// Authentication middleware

function requireAuth(req, res, next) {
  if (!req.session.username) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  next();
}

module.exports = { requireAuth };
