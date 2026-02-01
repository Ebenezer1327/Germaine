require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { Pool } = require('pg');
const { initDb } = require('./db/init');
const { setupPageRoutes } = require('./routes/pages');
const { setupAuthRoutes } = require('./routes/auth');
const { setupApiRoutes } = require('./routes/api');
const { initializePush, checkAndSendReminders } = require('./services/pushService');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve favicon so browser doesn't 404 on /favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'icons', 'icon-192.png'));
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'germaine-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Ensures cookie is sent with same-site fetch on iOS
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

// Initialize push notification service
const pushEnabled = initializePush();

// Setup routes
setupPageRoutes(app);
setupAuthRoutes(app, pool);
setupApiRoutes(app, pool);

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  
  // Start reminder checker if push is enabled
  if (pushEnabled) {
    // Check for due reminders every minute
    const REMINDER_CHECK_INTERVAL = 60 * 1000; // 1 minute
    
    setInterval(async () => {
      const result = await checkAndSendReminders(pool);
      if (result.reminders > 0) {
        console.log(`Sent ${result.reminders} reminder notification(s)`);
      }
    }, REMINDER_CHECK_INTERVAL);
    
    console.log('Reminder checker started (checking every minute)');
  }
});
