// Chat panel: open when mascot clicked, send to /api/chat, display replies.
// Voice (reply like Germaine) is set in DB for Germaine only; no in-app UI.

(function () {
  var chatHistory = [];

  function openChat() {
    var panel = document.getElementById('chat-panel');
    if (panel) {
      panel.classList.add('chat-panel--open');
      document.body.style.overflow = 'hidden';
      var input = document.getElementById('chat-input');
      if (input) input.focus();
    }
  }

  function closeChat() {
    var panel = document.getElementById('chat-panel');
    if (panel) {
      panel.classList.remove('chat-panel--open');
      document.body.style.overflow = '';
    }
  }

  function _removedOpenVoiceModal() {
    if (!voiceModal) return;
    voiceModal.classList.add('chat-voice-modal--open');
    fetch('/api/chat/voice', { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        if (voiceInstructionsEl) voiceInstructionsEl.value = data.voice_instructions || '';
        var samples = Array.isArray(data.sample_messages) ? data.sample_messages : [];
        renderSampleInputs(samples);
      })
      .catch(function () {
        if (voiceSamplesListEl) voiceSamplesListEl.innerHTML = '';
      });
  }

  function renderSampleInputs(samples) {
    if (!voiceSamplesListEl) return;
    voiceSamplesListEl.innerHTML = '';
    (samples || []).slice(0, maxSamples).forEach(function (text) {
      addSampleRow(text);
    });
    maybeAddEmptyRow();
  }

  function addSampleRow(value) {
    if (!voiceSamplesListEl) return;
    var current = voiceSamplesListEl.querySelectorAll('.chat-voice-sample-row').length;
    if (current >= maxSamples) return;
    value = value || '';
    var row = document.createElement('div');
    row.className = 'chat-voice-sample-row';
    var input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'e.g. "Love you, talk later!"';
    input.value = value;
    input.className = 'chat-voice-sample-input';
    input.setAttribute('data-gramm', 'false');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-voice-sample-remove';
    btn.textContent = '×';
    btn.setAttribute('aria-label', 'Remove');
    btn.addEventListener('click', function () {
      row.remove();
      maybeAddEmptyRow();
    });
    row.appendChild(input);
    row.appendChild(btn);
    var addBtn = voiceSamplesListEl.querySelector('.chat-voice-add-sample');
    voiceSamplesListEl.insertBefore(row, addBtn || null);
  }

  function maybeAddEmptyRow() {
    if (!voiceSamplesListEl) return;
    var count = voiceSamplesListEl.querySelectorAll('.chat-voice-sample-row').length;
    if (count < maxSamples) {
      var addBtn = voiceSamplesListEl.querySelector('.chat-voice-add-sample');
      if (!addBtn) {
        addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'chat-voice-add-sample';
        addBtn.textContent = '+ Add a sample phrase';
        addBtn.addEventListener('click', function () {
          addSampleRow('');
          maybeAddEmptyRow();
        });
        voiceSamplesListEl.appendChild(addBtn);
      }
      addBtn.style.display = count >= maxSamples ? 'none' : '';
    }
  }

  function collectVoiceData() {
    var instructions = (voiceInstructionsEl && voiceInstructionsEl.value) ? voiceInstructionsEl.value.trim() : '';
    var samples = [];
    if (voiceSamplesListEl) {
      voiceSamplesListEl.querySelectorAll('.chat-voice-sample-input').forEach(function (inp) {
        var v = inp.value.trim();
        if (v) samples.push(v);
      });
    }
    return { voice_instructions: instructions, sample_messages: samples };
  }

  function saveVoice() {
    var payload = collectVoiceData();
    fetch('/api/chat/voice', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        if (data.ok) {
          closeVoiceModal();
          showVoiceToast('Saved. Replies will sound more like you.');
        } else if (data.error) {
          showVoiceToast(data.error);
        }
      })
      .catch(function () {
        showVoiceToast('Failed to save. Try again.');
      });
  }

  function showVoiceToast(msg) {
    var panel = document.getElementById('chat-panel');
    if (!panel) return;
    var existing = panel.querySelector('.chat-voice-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'chat-voice-toast';
    toast.textContent = msg;
    panel.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  function ensureVoiceUI() {
    var header = document.querySelector('.chat-panel-header');
    var inner = document.querySelector('.chat-panel-inner');
    if (!header || !inner || document.getElementById('chat-voice-btn')) return;

    var title = header.querySelector('.chat-panel-title');
    var trainBtn = document.createElement('button');
    trainBtn.type = 'button';
    trainBtn.id = 'chat-voice-btn';
    trainBtn.className = 'chat-voice-btn';
    trainBtn.textContent = 'Train my voice';
    trainBtn.addEventListener('click', openVoiceModal);
    header.insertBefore(trainBtn, header.querySelector('.chat-panel-close'));

    var modal = document.createElement('div');
    modal.className = 'chat-voice-modal';
    modal.setAttribute('aria-label', 'Train my voice');
    modal.innerHTML =
      '<div class="chat-voice-modal-backdrop" id="chat-voice-backdrop"></div>' +
      '<div class="chat-voice-modal-content">' +
      '  <div class="chat-voice-modal-header">' +
      '    <h3 class="chat-voice-modal-title">Train my voice</h3>' +
      '    <button type="button" class="chat-voice-modal-close" id="chat-voice-modal-close" aria-label="Close">&times;</button>' +
      '  </div>' +
      '  <div class="chat-voice-modal-body">' +
      '    <label class="chat-voice-label">How you want to sound</label>' +
      '    <textarea id="chat-voice-instructions" class="chat-voice-instructions" rows="3" placeholder="e.g. Casual and warm. I use &quot;haha&quot; and emojis sometimes. I call my partner babe." maxlength="2000" data-gramm="false"></textarea>' +
      '    <label class="chat-voice-label">Sample phrases (how you’d say things)</label>' +
      '    <div id="chat-voice-samples-list" class="chat-voice-samples-list"></div>' +
      '  </div>' +
      '  <div class="chat-voice-modal-footer">' +
      '    <button type="button" class="chat-voice-cancel" id="chat-voice-cancel">Cancel</button>' +
      '    <button type="button" class="chat-voice-save" id="chat-voice-save">Save</button>' +
      '  </div>' +
      '</div>';
    inner.appendChild(modal);
    voiceModal = modal;
    voiceInstructionsEl = modal.querySelector('#chat-voice-instructions');
    voiceSamplesListEl = modal.querySelector('#chat-voice-samples-list');

    modal.querySelector('#chat-voice-backdrop').addEventListener('click', closeVoiceModal);
    modal.querySelector('#chat-voice-modal-close').addEventListener('click', closeVoiceModal);
    modal.querySelector('#chat-voice-cancel').addEventListener('click', closeVoiceModal);
    modal.querySelector('#chat-voice-save').addEventListener('click', saveVoice);
  }

  function appendMessage(role, content) {
    var container = document.getElementById('chat-messages');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'chat-msg chat-msg--' + role;
    var text = document.createElement('div');
    text.className = 'chat-msg-text';
    text.textContent = content;
    div.appendChild(text);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function setError(msg) {
    var container = document.getElementById('chat-messages');
    if (!container) return;
    var err = container.querySelector('.chat-msg--error');
    if (err) err.remove();
    var div = document.createElement('div');
    div.className = 'chat-msg chat-msg--error';
    div.textContent = msg;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    var input = document.getElementById('chat-input');
    var sendBtn = document.getElementById('chat-send');
    if (!input || !sendBtn) return;
    var text = input.value.trim();
    if (!text) return;

    input.value = '';
    sendBtn.disabled = true;
    appendMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, history: chatHistory.slice(-20) }),
    })
      .then(function (r) {
        if (r.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return r.json();
      })
      .then(function (data) {
        if (!data) return;
        if (data.reply) {
          chatHistory.push({ role: 'assistant', content: data.reply });
          appendMessage('assistant', data.reply);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(function () {
        setError('Something went wrong. Try again.');
      })
      .finally(function () {
        if (sendBtn) sendBtn.disabled = false;
      });
  }

  function init() {
    var mascot = document.getElementById('nav-mascot');
    var panel = document.getElementById('chat-panel');
    var closeBtn = document.getElementById('chat-panel-close');
    var sendBtn = document.getElementById('chat-send');
    var input = document.getElementById('chat-input');

    if (mascot) mascot.addEventListener('click', openChat);
    if (closeBtn) closeBtn.addEventListener('click', closeChat);
    if (panel) {
      panel.addEventListener('click', function (e) {
        if (e.target === panel) closeChat();
      });
    }
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
