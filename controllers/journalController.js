// Journal controller

async function getJournalEntries(req, res, pool) {
  try {
    const result = await pool.query(
      `SELECT je.id, je.content, je.images, je.created_at, je.folder_id, jf.folder_name 
       FROM journal_entries je 
       LEFT JOIN journal_folders jf ON je.folder_id = jf.id 
       WHERE je.username = $1 
       ORDER BY je.created_at DESC`,
      [req.session.username]
    );
    // Parse JSONB images field - handle null, string, or already parsed objects
    const entries = result.rows.map(row => {
      let images = [];
      try {
        if (row.images) {
          if (typeof row.images === 'string') {
            images = JSON.parse(row.images);
          } else if (Array.isArray(row.images)) {
            images = row.images;
          } else if (typeof row.images === 'object') {
            images = row.images;
          }
        }
      } catch (parseErr) {
        console.error('Error parsing images for entry', row.id, ':', parseErr);
        images = [];
      }
      return {
        id: row.id,
        content: row.content || '',
        images: images,
        created_at: row.created_at,
        folder_id: row.folder_id,
        folder_name: row.folder_name
      };
    });
    res.json({ entries });
  } catch (err) {
    console.error('Error fetching journal entries:', err);
    res.status(500).json({ error: 'Failed to fetch journal entries', details: err.message });
  }
}

async function createJournalEntry(req, res, pool) {
  const { content, images } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    const imagesArray = images && Array.isArray(images) ? images : [];
    const result = await pool.query(
      'INSERT INTO journal_entries (username, content, images) VALUES ($1, $2, $3::jsonb) RETURNING id, created_at',
      [req.session.username, content.trim(), JSON.stringify(imagesArray)]
    );
    res.json({ 
      success: true, 
      entry: {
        id: result.rows[0].id,
        content: content.trim(),
        images: imagesArray,
        created_at: result.rows[0].created_at
      }
    });
  } catch (err) {
    console.error('Error saving journal entry:', err);
    res.status(500).json({ error: 'Failed to save journal entry' });
  }
}

async function updateJournalEntry(req, res, pool) {
  const entryId = parseInt(req.params.id);
  const { content, images, folder_id } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  try {
    // Verify entry belongs to user
    const checkResult = await pool.query(
      'SELECT username FROM journal_entries WHERE id = $1',
      [entryId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (checkResult.rows[0].username !== req.session.username) {
      return res.status(403).json({ error: 'Not authorized to edit this entry' });
    }

    // Verify folder belongs to user if folder_id is provided
    if (folder_id) {
      const folderCheck = await pool.query(
        'SELECT id FROM journal_folders WHERE id = $1 AND username = $2',
        [folder_id, req.session.username]
      );
      if (folderCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Invalid folder' });
      }
    }

    const imagesArray = images && Array.isArray(images) ? images : [];
    
    const result = await pool.query(
      'UPDATE journal_entries SET content = $1, images = $2::jsonb, folder_id = $4 WHERE id = $3 RETURNING id, content, images, created_at, folder_id',
      [content.trim(), JSON.stringify(imagesArray), entryId, folder_id || null]
    );

    res.json({ 
      success: true, 
      entry: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating journal entry:', err);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
}

async function deleteJournalEntry(req, res, pool) {
  const entryId = parseInt(req.params.id);

  try {
    // Verify entry belongs to user
    const checkResult = await pool.query(
      'SELECT username FROM journal_entries WHERE id = $1',
      [entryId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (checkResult.rows[0].username !== req.session.username) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    await pool.query('DELETE FROM journal_entries WHERE id = $1', [entryId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting journal entry:', err);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
}

module.exports = {
  getJournalEntries,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
};
