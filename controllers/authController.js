const bcrypt = require('bcryptjs');

async function login(req, res, pool) {
  const { username, password, remember_me } = req.body || {};

  if (!username || !password) {
    return res.redirect('/login?error=missing');
  }

  try {
    const result = await pool.query(
      'SELECT username, password_hash, is_admin FROM users WHERE username = $1',
      [username.trim()]
    );

    if (result.rowCount === 0) {
      return res.redirect('/login?error=username');
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.redirect('/login?error=password');
    }

    req.session.username = user.username;
    req.session.isAdmin = user.is_admin;

    if (remember_me) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
      req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
    }

    return res.redirect('/home');
  } catch (err) {
    console.error('Login error:', err.message);
    return res.redirect('/login?error=server');
  }
}

function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
}

module.exports = { login, logout };
