require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const { initDb } = require('./db/init');
const { setupPageRoutes } = require('./routes/pages');
const { setupAuthRoutes } = require('./routes/auth');
const { setupApiRoutes } = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'germaine-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

// Serve static frontend files from /public
app.use(express.static('public'));

// Create a pool using Neon connection string from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Initialize database
initDb(pool);

// Setup routes
setupPageRoutes(app);
setupAuthRoutes(app, pool);
setupApiRoutes(app, pool);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
