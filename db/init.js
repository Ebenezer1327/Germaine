const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function initDb(pool) {
  try {
    const result = await pool.query('SELECT NOW() AS now');
    console.log('Connected to Neon DB at:', result.rows[0].now);

    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE
      );
    `);

    // Create journal_folders table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_folders (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        folder_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, folder_name)
      );
    `);

    // Create journal_entries table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Add images column if it doesn't exist (for existing tables)
    try {
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries' AND column_name = 'images'
      `);
      
      if (columnCheck.rows.length === 0) {
        await pool.query(`
          ALTER TABLE journal_entries ADD COLUMN images JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('Added images column to journal_entries table');
      }
    } catch (alterErr) {
      console.error('Error adding images column:', alterErr.message);
    }

    // Add folder_id column if it doesn't exist
    try {
      const folderColumnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'journal_entries' AND column_name = 'folder_id'
      `);
      
      if (folderColumnCheck.rows.length === 0) {
        await pool.query(`
          ALTER TABLE journal_entries ADD COLUMN folder_id INTEGER REFERENCES journal_folders(id) ON DELETE SET NULL;
        `);
        console.log('Added folder_id column to journal_entries table');
      }
    } catch (alterErr) {
      console.error('Error adding folder_id column:', alterErr.message);
    }

    const plainPassword = 'T270819i';
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const seedUsers = [
      { username: 'germaine', isAdmin: false },
      { username: 'admin', isAdmin: true },
    ];

    for (const user of seedUsers) {
      await pool.query(
        `
        INSERT INTO users (username, password_hash, is_admin)
        VALUES ($1, $2, $3)
        ON CONFLICT (username)
        DO UPDATE SET password_hash = EXCLUDED.password_hash,
                      is_admin = EXCLUDED.is_admin;
      `,
        [user.username, passwordHash, user.isAdmin]
      );
    }

    console.log('Ensured users exist: germaine, admin');

    // Create todos table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        due_date TIMESTAMP,
        reminder_time TIMESTAMP,
        completed BOOLEAN DEFAULT FALSE,
        reminder_sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured todos table exists');

    // Create push_subscriptions table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Ensured push_subscriptions table exists');

  } catch (err) {
    console.error('Failed to initialize DB:', err.message);
  }
}

module.exports = { initDb };
