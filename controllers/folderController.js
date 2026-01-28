// Folder controller

async function getFolders(req, res, pool) {
  try {
    const result = await pool.query(
      'SELECT id, folder_name, created_at FROM journal_folders WHERE username = $1 ORDER BY folder_name ASC',
      [req.session.username]
    );
    res.json({ folders: result.rows });
  } catch (err) {
    console.error('Error fetching folders:', err);
    res.status(500).json({ error: 'Failed to fetch folders', details: err.message });
  }
}

async function createFolder(req, res, pool) {
  const { folder_name } = req.body;

  if (!folder_name || folder_name.trim().length === 0) {
    return res.status(400).json({ error: 'Folder name is required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO journal_folders (username, folder_name) VALUES ($1, $2) ON CONFLICT (username, folder_name) DO NOTHING RETURNING id, folder_name, created_at',
      [req.session.username, folder_name.trim()]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({ error: 'Folder already exists' });
    }

    res.json({ 
      success: true, 
      folder: result.rows[0]
    });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Failed to create folder' });
  }
}

async function deleteFolder(req, res, pool) {
  const folderId = parseInt(req.params.id);

  try {
    // Verify folder belongs to user
    const checkResult = await pool.query(
      'SELECT username FROM journal_folders WHERE id = $1',
      [folderId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    if (checkResult.rows[0].username !== req.session.username) {
      return res.status(403).json({ error: 'Not authorized to delete this folder' });
    }

    // Delete folder (entries will have folder_id set to NULL due to ON DELETE SET NULL)
    await pool.query('DELETE FROM journal_folders WHERE id = $1', [folderId]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting folder:', err);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
}

module.exports = {
  getFolders,
  createFolder,
  deleteFolder
};
