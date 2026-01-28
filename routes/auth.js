const { login, logout } = require('../controllers/authController');

function setupAuthRoutes(app, pool) {
  app.post('/login', (req, res) => {
    login(req, res, pool);
  });

  app.get('/logout', (req, res) => {
    logout(req, res);
  });
}

module.exports = { setupAuthRoutes };
