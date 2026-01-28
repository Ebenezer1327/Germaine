const { requireAuth } = require('../middleware/auth');
const journalController = require('../controllers/journalController');
const folderController = require('../controllers/folderController');

function setupApiRoutes(app, pool) {
  // Journal API routes
  app.get('/api/journal', requireAuth, (req, res) => {
    journalController.getJournalEntries(req, res, pool);
  });

  app.post('/api/journal', requireAuth, (req, res) => {
    journalController.createJournalEntry(req, res, pool);
  });

  app.put('/api/journal/:id', requireAuth, (req, res) => {
    journalController.updateJournalEntry(req, res, pool);
  });

  app.delete('/api/journal/:id', requireAuth, (req, res) => {
    journalController.deleteJournalEntry(req, res, pool);
  });

  // Folder API routes
  app.get('/api/folders', requireAuth, (req, res) => {
    folderController.getFolders(req, res, pool);
  });

  app.post('/api/folders', requireAuth, (req, res) => {
    folderController.createFolder(req, res, pool);
  });

  app.delete('/api/folders/:id', requireAuth, (req, res) => {
    folderController.deleteFolder(req, res, pool);
  });
}

module.exports = { setupApiRoutes };
