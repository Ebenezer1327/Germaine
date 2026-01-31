const path = require('path');
const { requireAuth } = require('../middleware/auth');

function setupPageRoutes(app) {
  // Public countdown page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // Countdown page (same as home countdown but with nav, no login button)
  app.get('/countdown', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'countdown.html'));
  });

  // Login page
  app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });

  // Private pages (require authentication)
  app.get('/home', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'home.html'));
  });

  app.get('/mystery', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'mystery.html'));
  });

  app.get('/games', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'games.html'));
  });

  app.get('/wordle', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'wordle.html'));
  });

  app.get('/journal', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'journal.html'));
  });

  app.get('/todo', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'todo.html'));
  });
}

module.exports = { setupPageRoutes };
