const bcrypt = require('bcryptjs');

async function login(req, res, pool) {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).send('Missing username or password.');
  }

  try {
    const result = await pool.query(
      'SELECT username, password_hash, is_admin FROM users WHERE username = $1',
      [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).send('Invalid username or password.');
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).send('Invalid username or password.');
    }

    // Store username in session
    req.session.username = user.username;
    req.session.isAdmin = user.is_admin;

    // After successful login go to the private home page
    return res.redirect('/home');
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).send('Something went wrong logging in.');
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
