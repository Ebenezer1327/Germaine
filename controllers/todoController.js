// Todo Controller - CRUD operations for to-do items

function formatTodoDateForClient(value, timezoneOffset) {
  if (!value) return null;
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  const offset = timezoneOffset ?? 0;
  const localMs = d.getTime() - offset * 60 * 1000;
  const local = new Date(localMs);
  const y = local.getUTCFullYear();
  const mo = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const h = String(local.getUTCHours()).padStart(2, '0');
  const min = String(local.getUTCMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day}T${h}:${min}`;
}

// Get all todos for the logged-in user
async function getTodos(req, res, pool) {
  try {
    const username = req.session.username;
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    const result = await pool.query(
      `SELECT id, title, description, due_date, reminder_time, timezone_offset, completed, created_at 
       FROM todos 
       WHERE user_id = $1 
       ORDER BY 
         completed ASC,
         CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
         due_date ASC,
         created_at DESC`,
      [userId]
    );
    
    const todos = result.rows.map(row => ({
      ...row,
      due_date: formatTodoDateForClient(row.due_date, row.timezone_offset),
      reminder_time: formatTodoDateForClient(row.reminder_time, row.timezone_offset),
      created_at: row.created_at ? new Date(row.created_at).toISOString() : null
    }));
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
}

// Create a new todo
async function createTodo(req, res, pool) {
  try {
    const username = req.session.username;
    const { title, description, due_date, reminder_time, timezone_offset } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    const result = await pool.query(
      `INSERT INTO todos (user_id, title, description, due_date, reminder_time, timezone_offset)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, due_date, reminder_time, timezone_offset, completed, created_at`,
      [userId, title.trim(), description || null, due_date || null, reminder_time || null, timezone_offset ?? null]
    );
    
    const todo = result.rows[0];
    const response = {
      ...todo,
      due_date: formatTodoDateForClient(todo.due_date, todo.timezone_offset),
      reminder_time: formatTodoDateForClient(todo.reminder_time, todo.timezone_offset),
      created_at: todo.created_at ? new Date(todo.created_at).toISOString() : null
    };
    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
}

// Update a todo
async function updateTodo(req, res, pool) {
  try {
    const username = req.session.username;
    const todoId = req.params.id;
    const { title, description, due_date, reminder_time, timezone_offset, completed } = req.body;
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Check if todo belongs to user
    const todoCheck = await pool.query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2',
      [todoId, userId]
    );
    
    if (todoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (due_date !== undefined) {
      updates.push(`due_date = $${paramCount++}`);
      values.push(due_date);
    }
    if (reminder_time !== undefined) {
      updates.push(`reminder_time = $${paramCount++}`);
      values.push(reminder_time);
      updates.push(`reminder_sent = FALSE`);
    }
    if (timezone_offset !== undefined) {
      updates.push(`timezone_offset = $${paramCount++}`);
      values.push(timezone_offset);
    }
    if (completed !== undefined) {
      updates.push(`completed = $${paramCount++}`);
      values.push(completed);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    values.push(todoId, userId);
    
    const result = await pool.query(
      `UPDATE todos 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount}
       RETURNING id, title, description, due_date, reminder_time, timezone_offset, completed, created_at`,
      values
    );
    
    const todo = result.rows[0];
    const response = {
      ...todo,
      due_date: formatTodoDateForClient(todo.due_date, todo.timezone_offset),
      reminder_time: formatTodoDateForClient(todo.reminder_time, todo.timezone_offset),
      created_at: todo.created_at ? new Date(todo.created_at).toISOString() : null
    };
    res.json(response);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
}

// Delete a todo
async function deleteTodo(req, res, pool) {
  try {
    const username = req.session.username;
    const todoId = req.params.id;
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    const result = await pool.query(
      'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
      [todoId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
}

// Save push subscription
async function savePushSubscription(req, res, pool) {
  try {
    const username = req.session.username;
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Upsert subscription (update if endpoint exists, otherwise insert)
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint) 
       DO UPDATE SET p256dh = $3, auth = $4, user_id = $1`,
      [userId, endpoint, keys.p256dh, keys.auth]
    );
    
    res.json({ message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('Error saving push subscription:', err);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
}

// Delete push subscription
async function deletePushSubscription(req, res, pool) {
  try {
    const username = req.session.username;
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }
    
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2',
      [endpoint, userId]
    );
    
    res.json({ message: 'Subscription removed successfully' });
  } catch (err) {
    console.error('Error deleting push subscription:', err);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
}

// Get VAPID public key (for client to subscribe)
function getVapidPublicKey(req, res) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return res.status(500).json({ error: 'Push notifications not configured' });
  }
  
  res.json({ publicKey });
}

module.exports = {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  savePushSubscription,
  deletePushSubscription,
  getVapidPublicKey
};
