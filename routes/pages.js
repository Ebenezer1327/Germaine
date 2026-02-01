const path = require('path');
const { requireAuth } = require('../middleware/auth');
const spotifyController = require('../controllers/spotifyController');

// Send HTML with no-cache so normal refresh shows updates (avoids hard-refresh)
function sendHtml(res, filePath) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.sendFile(filePath);
}

function setupPageRoutes(app) {
  const publicDir = path.join(__dirname, '..', 'public');

  app.get('/', (req, res) => {
    sendHtml(res, path.join(publicDir, 'index.html'));
  });

  app.get('/countdown', (req, res) => {
    sendHtml(res, path.join(publicDir, 'countdown.html'));
  });

  app.get('/login', (req, res) => {
    sendHtml(res, path.join(publicDir, 'login.html'));
  });

  app.get('/home', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'home.html'));
  });

  app.get('/mystery', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'mystery.html'));
  });

  app.get('/games', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'games.html'));
  });

  app.get('/wordle', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'wordle.html'));
  });

  app.get('/journal', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'journal.html'));
  });

  app.get('/todo', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'todo.html'));
  });

  app.get('/music', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'music.html'));
  });

  app.get('/journey', requireAuth, (req, res) => {
    sendHtml(res, path.join(publicDir, 'journey.html'));
  });

  app.get('/music/spotify-login', requireAuth, (req, res) => {
    spotifyController.login(req, res);
  });

  app.get('/music/spotify-callback', requireAuth, (req, res) => {
    spotifyController.callback(req, res);
  });
}

module.exports = { setupPageRoutes };
