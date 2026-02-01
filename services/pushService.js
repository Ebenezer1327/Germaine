const webpush = require('web-push');

// Configure web-push with VAPID keys
function initializePush() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:example@example.com';

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured. Push notifications will not work.');
    return false;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
  console.log('Push notification service initialized');
  return true;
}

// Send a push notification to a subscription
async function sendNotification(subscription, payload) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    const options = {
      TTL: 60 * 60, // 1 hour
      urgency: 'high'
    };

    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      options
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // If subscription is no longer valid, return info to clean it up
    if (error.statusCode === 404 || error.statusCode === 410) {
      return { success: false, expired: true, endpoint: subscription.endpoint };
    }
    
    return { success: false, error: error.message };
  }
}

// Send notification to all subscriptions for a user
async function sendNotificationToUser(pool, userId, payload) {
  try {
    const result = await pool.query(
      'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const expiredEndpoints = [];

    for (const subscription of result.rows) {
      const sendResult = await sendNotification(subscription, payload);
      
      if (sendResult.success) {
        sent++;
      } else {
        failed++;
        if (sendResult.expired) {
          expiredEndpoints.push(sendResult.endpoint);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await pool.query(
        'DELETE FROM push_subscriptions WHERE endpoint = ANY($1)',
        [expiredEndpoints]
      );
      console.log(`Cleaned up ${expiredEndpoints.length} expired subscriptions`);
    }

    return { sent, failed };
  } catch (error) {
    console.error('Error sending notifications to user:', error);
    return { sent: 0, failed: 0, error: error.message };
  }
}

// Parse raw reminder_time "2025-02-05T14:07" + timezone_offset to UTC Date
function parseReminderToUTC(reminderTime, timezoneOffset) {
  if (!reminderTime) return null;
  const m = String(reminderTime).match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, hh, mm] = m.map(Number);
  const offsetMin = timezoneOffset ?? 0;
  const utcMs = Date.UTC(y, mo - 1, d, hh, mm, 0, 0) + offsetMin * 60 * 1000;
  return new Date(utcMs);
}

// Check for due reminders and send notifications
async function checkAndSendReminders(pool) {
  try {
    const result = await pool.query(`
      SELECT t.id, t.title, t.reminder_time, t.timezone_offset, t.user_id
      FROM todos t
      WHERE t.reminder_time IS NOT NULL
        AND t.reminder_sent = FALSE
        AND t.completed = FALSE
    `);

    const now = Date.now();
    const dueTodos = result.rows.filter(row => {
      const utcDate = parseReminderToUTC(row.reminder_time, row.timezone_offset);
      return utcDate && utcDate.getTime() <= now;
    });

    if (dueTodos.length === 0) {
      return { checked: true, reminders: 0 };
    }

    console.log(`Found ${dueTodos.length} reminders to send`);

    for (const todo of dueTodos) {
      const payload = {
        title: 'Task Reminder',
        body: todo.title,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: `todo-${todo.id}`,
        data: {
          todoId: todo.id,
          url: '/todo'
        }
      };

      await sendNotificationToUser(pool, todo.user_id, payload);

      // Mark reminder as sent
      await pool.query(
        'UPDATE todos SET reminder_sent = TRUE WHERE id = $1',
        [todo.id]
      );
    }

    return { checked: true, reminders: result.rows.length };
  } catch (error) {
    console.error('Error checking reminders:', error);
    return { checked: false, error: error.message };
  }
}

module.exports = {
  initializePush,
  sendNotification,
  sendNotificationToUser,
  checkAndSendReminders
};
