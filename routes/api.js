const { requireAuth } = require('../middleware/auth');
const journalController = require('../controllers/journalController');
const folderController = require('../controllers/folderController');
const todoController = require('../controllers/todoController');

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

  // Todo API routes
  app.get('/api/todos', requireAuth, (req, res) => {
    todoController.getTodos(req, res, pool);
  });

  app.post('/api/todos', requireAuth, (req, res) => {
    todoController.createTodo(req, res, pool);
  });

  app.put('/api/todos/:id', requireAuth, (req, res) => {
    todoController.updateTodo(req, res, pool);
  });

  app.delete('/api/todos/:id', requireAuth, (req, res) => {
    todoController.deleteTodo(req, res, pool);
  });

  // Push notification API routes
  app.get('/api/push/vapid-public-key', requireAuth, (req, res) => {
    todoController.getVapidPublicKey(req, res);
  });

  app.post('/api/push/subscribe', requireAuth, (req, res) => {
    todoController.savePushSubscription(req, res, pool);
  });

  app.delete('/api/push/subscribe', requireAuth, (req, res) => {
    todoController.deletePushSubscription(req, res, pool);
  });
}

module.exports = { setupApiRoutes };
