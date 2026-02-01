/**
 * Chat API: proxies to OpenAI so the assistant replies as the logged-in user
 * (so their partner feels they're talking to them). API key must be in .env as OPENAI_API_KEY.
 * Optional "voice" (instructions + sample messages) trains the model to reply like the user.
 */

async function getVoice(req, res, pool) {
  const username = req.session && req.session.username;
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const result = await pool.query(
      'SELECT voice_instructions, sample_messages, updated_at FROM user_chat_voice WHERE username = $1',
      [username]
    );
    const row = result.rows[0];
    let sampleMessages = [];
    if (row && row.sample_messages) {
      sampleMessages = Array.isArray(row.sample_messages) ? row.sample_messages : [];
    }
    res.json({
      voice_instructions: row ? (row.voice_instructions || '') : '',
      sample_messages: sampleMessages,
      updated_at: row ? row.updated_at : null,
    });
  } catch (err) {
    console.error('Error fetching chat voice:', err);
    res.status(500).json({ error: 'Failed to load voice settings' });
  }
}

async function saveVoice(req, res, pool) {
  const username = req.session && req.session.username;
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { voice_instructions, sample_messages } = req.body;
  const instructions = typeof voice_instructions === 'string' ? voice_instructions.trim() : '';
  let samples = [];
  if (sample_messages && Array.isArray(sample_messages)) {
    samples = sample_messages.filter((m) => typeof m === 'string' && m.trim()).map((m) => m.trim()).slice(0, 10);
  }
  try {
    await pool.query(
      `INSERT INTO user_chat_voice (username, voice_instructions, sample_messages, updated_at)
       VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (username)
       DO UPDATE SET voice_instructions = EXCLUDED.voice_instructions,
                     sample_messages = EXCLUDED.sample_messages,
                     updated_at = CURRENT_TIMESTAMP`,
      [username, instructions, JSON.stringify(samples)]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error saving chat voice:', err);
    res.status(500).json({ error: 'Failed to save voice settings' });
  }
}

async function chat(req, res, pool) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Chat is not configured. Add OPENAI_API_KEY to .env' });
  }

  const username = req.session && req.session.username;
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { message, history = [] } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // When CHAT_AS_NAME is set, the AI speaks as that identity; otherwise default to "Gerbumaine".
  const chatAsName = process.env.CHAT_AS_NAME && process.env.CHAT_AS_NAME.trim();
  const identity = chatAsName || 'Gerbumaine';

  let systemPrompt = `You are an AI named ${identity}, chatting with your partner.
Reply in first person as ${identity}.
Your tone is casual and warm.
You sometimes say "haha" and use light emojis.
You speak in a friendly way.
Be personal and natural—like you're really talking to them. Keep responses concise (a few sentences unless they ask for more). Don't break character or mention you're an AI.`;

  // Voice: prefer env (for "chat as me" setup), else DB for identity
  if (chatAsName) {
    const envInstructions = process.env.CHAT_VOICE_INSTRUCTIONS && process.env.CHAT_VOICE_INSTRUCTIONS.trim();
    if (envInstructions) {
      systemPrompt += `\n\nHow you talk (follow this style): ${envInstructions}`;
    }
    let envSamples = [];
    if (process.env.CHAT_VOICE_SAMPLES) {
      try {
        const parsed = JSON.parse(process.env.CHAT_VOICE_SAMPLES);
        envSamples = Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string' && s.trim()).map((s) => s.trim()).slice(0, 10) : [];
      } catch (_) {}
    }
    if (envSamples.length > 0) {
      systemPrompt += `\n\nExamples of how you write (match this tone and style):\n${envSamples.map((s) => `- "${s}"`).join('\n')}`;
    }
  } else {
    try {
      const voiceResult = await pool.query(
        'SELECT voice_instructions, sample_messages FROM user_chat_voice WHERE username = $1',
        [username]
      );
      const voice = voiceResult.rows[0];
      if (voice) {
        if (voice.voice_instructions && voice.voice_instructions.trim()) {
          systemPrompt += `\n\nHow you talk (follow this style): ${voice.voice_instructions.trim()}`;
        }
        const samples = voice.sample_messages && Array.isArray(voice.sample_messages) ? voice.sample_messages : [];
        if (samples.length > 0) {
          systemPrompt += `\n\nExamples of how you write (match this tone and style):\n${samples.map((s) => `- "${s}"`).join('\n')}`;
        }
      }
    } catch (_) {}
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message.trim() },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('OpenAI API error:', response.status, errBody);
      return res.status(502).json({ error: 'Could not get a reply. Try again.' });
    }

    const data = await response.json();
    const reply = data.choices && data.choices[0] && data.choices[0].message;
    if (!reply || !reply.content) {
      return res.status(502).json({ error: 'Empty reply. Try again.' });
    }

    res.json({ reply: reply.content.trim() });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}

module.exports = { chat, getVoice, saveVoice };
