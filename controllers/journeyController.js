/**
 * Journey entries: one per user per calendar date (text + images).
 * Entries are private: only the logged-in user sees their own journey.
 */

async function getMonth(req, res, pool) {
  const username = req.session && req.session.username;
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const year = parseInt(req.query.year, 10);
  const month = parseInt(req.query.month, 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  try {
    const result = await pool.query(
      `SELECT id, entry_date, content, images, updated_at
       FROM journey_entries
       WHERE username = $1
         AND entry_date >= $2::date
         AND entry_date < ($2::date + INTERVAL '1 month')::date
       ORDER BY entry_date ASC`,
      [username, `${year}-${String(month).padStart(2, '0')}-01`]
    );

    const entries = result.rows.map((row) => {
      let images = [];
      try {
        if (row.images != null) {
          if (Array.isArray(row.images)) {
            images = row.images;
          } else if (typeof row.images === 'string') {
            const parsed = JSON.parse(row.images);
            images = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : []);
          } else if (typeof row.images === 'object') {
            images = Object.values(row.images);
          }
        }
        if (!Array.isArray(images)) images = [];
      } catch (_) {
        images = [];
      }
      const dateVal = row.entry_date;
      const dateStr = typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)
        ? dateVal.slice(0, 10)
        : (dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal).slice(0, 10));
      return {
        id: row.id,
        date: dateStr,
        content: row.content || '',
        images,
        updated_at: row.updated_at,
      };
    });

    res.json({ entries });
  } catch (err) {
    console.error('Error fetching journey month:', err);
    res.status(500).json({ error: 'Failed to load journey entries' });
  }
}

async function upsert(req, res, pool) {
  const username = req.session && req.session.username;
  if (!username) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { date, content, images } = req.body;
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Date is required' });
  }

  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
  }

  const contentStr = typeof content === 'string' ? content : '';
  const imagesArray = images && Array.isArray(images) ? images : [];

  try {
    const result = await pool.query(
      `INSERT INTO journey_entries (username, entry_date, content, images, updated_at)
       VALUES ($1, $2::date, $3, $4::jsonb, CURRENT_TIMESTAMP)
       ON CONFLICT (username, entry_date)
       DO UPDATE SET content = EXCLUDED.content, images = EXCLUDED.images, updated_at = CURRENT_TIMESTAMP
       RETURNING id, entry_date, content, images, updated_at`,
      [username, date, contentStr, JSON.stringify(imagesArray)]
    );

    const row = result.rows[0];
    let imgs = [];
    try {
      if (row.images != null) {
        if (Array.isArray(row.images)) imgs = row.images;
        else if (typeof row.images === 'string') {
          const parsed = JSON.parse(row.images);
          imgs = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? Object.values(parsed) : []);
        } else if (typeof row.images === 'object') imgs = Object.values(row.images);
      }
      if (!Array.isArray(imgs)) imgs = [];
    } catch (_) {
      imgs = [];
    }
    const dateVal = row.entry_date;
    const dateStr = typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)
      ? dateVal.slice(0, 10)
      : (dateVal instanceof Date ? dateVal.toISOString().slice(0, 10) : String(dateVal).slice(0, 10));

    res.json({
      success: true,
      entry: {
        id: row.id,
        date: dateStr,
        content: row.content || '',
        images: imgs,
        updated_at: row.updated_at,
      },
    });
  } catch (err) {
    console.error('Error upserting journey entry:', err);
    res.status(500).json({ error: 'Failed to save entry' });
  }
}

module.exports = { getMonth, upsert };
