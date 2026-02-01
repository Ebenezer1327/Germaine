// Todo List JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const todoList = document.getElementById('todo-list');
  const todoTitleInput = document.getElementById('todo-title-input');
  const todoDueDate = document.getElementById('todo-due-date');
  const todoReminder = document.getElementById('todo-reminder');
  const addTodoBtn = document.getElementById('add-todo-btn');
  const todoMessage = document.getElementById('todo-message');
  const notificationBanner = document.getElementById('notification-banner');
  const enableNotificationsBtn = document.getElementById('enable-notifications-btn');
  const dismissBannerBtn = document.getElementById('dismiss-banner-btn');
  const iosInstructions = document.getElementById('ios-instructions');

  // State
  let todos = [];
  let vapidPublicKey = null;

  // Initialize
  init();

  async function init() {
    await loadTodos();
    await checkNotificationStatus();
    setupEventListeners();
  }

  function setupEventListeners() {
    addTodoBtn.addEventListener('click', handleAddTodo);
    todoTitleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAddTodo();
    });
    enableNotificationsBtn.addEventListener('click', handleEnableNotifications);
    dismissBannerBtn.addEventListener('click', () => {
      notificationBanner.style.display = 'none';
      localStorage.setItem('notification-banner-dismissed', 'true');
    });
  }

  // Load all todos
  async function loadTodos() {
    try {
      const response = await fetch('/api/todos', { credentials: 'include' });
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to load todos');
      
      todos = await response.json();
      renderTodos();
    } catch (error) {
      console.error('Error loading todos:', error);
      todoList.innerHTML = '<p class="todo-error">Failed to load tasks. Please refresh.</p>';
    }
  }

  // Render todos
  function renderTodos() {
    if (todos.length === 0) {
      todoList.innerHTML = '<p class="todo-empty">No tasks yet. Add your first task above!</p>';
      return;
    }

    const incompleteTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    let html = '';

    if (incompleteTodos.length > 0) {
      html += incompleteTodos.map(todo => createTodoHTML(todo)).join('');
    }

    if (completedTodos.length > 0) {
      html += '<div class="todo-completed-section">';
      html += '<h3 class="todo-completed-title">Completed</h3>';
      html += completedTodos.map(todo => createTodoHTML(todo)).join('');
      html += '</div>';
    }

    todoList.innerHTML = html;

    // Add event listeners to todo items
    document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', handleToggleComplete);
    });
    document.querySelectorAll('.todo-delete-btn').forEach(btn => {
      btn.addEventListener('click', handleDeleteTodo);
    });
    document.querySelectorAll('.todo-edit-btn').forEach(btn => {
      btn.addEventListener('click', handleEditTodo);
    });
  }

  function createTodoHTML(todo) {
    const dueDate = todo.due_date ? parseDisplayDate(todo.due_date) : null;
    const reminderTime = todo.reminder_time ? parseDisplayDate(todo.reminder_time) : null;
    const dueMs = dueDate ? new Date(dueDate.y, dueDate.m - 1, dueDate.d, dueDate.hh, dueDate.mm).getTime() : 0;
    const isOverdue = dueDate && !todo.completed && dueMs < Date.now();

    return `
      <div class="todo-item ${todo.completed ? 'todo-item--completed' : ''} ${isOverdue ? 'todo-item--overdue' : ''}" data-id="${todo.id}">
        <div class="todo-item-main">
          <label class="todo-checkbox-label">
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} data-id="${todo.id}" />
            <span class="todo-checkbox-custom"></span>
          </label>
          <div class="todo-item-content">
            <span class="todo-item-title">${escapeHtml(todo.title)}</span>
            ${dueDate ? `<span class="todo-item-due ${isOverdue ? 'todo-item-due--overdue' : ''}">📅 ${formatDisplayDate(dueDate)}</span>` : ''}
            ${reminderTime ? `<span class="todo-item-reminder">🔔 ${formatDisplayDate(reminderTime)}</span>` : ''}
          </div>
        </div>
        <div class="todo-item-actions">
          <button class="todo-edit-btn" data-id="${todo.id}" title="Edit">✏️</button>
          <button class="todo-delete-btn" data-id="${todo.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  // Add new todo
  async function handleAddTodo() {
    const title = todoTitleInput.value.trim();
    if (!title) {
      showMessage('Please enter a task title', 'error');
      return;
    }

    // Store raw value - PWA/standalone can use UTC for display, causing wrong times
    const dueDate = todoDueDate.value || null;
    const reminderTime = todoReminder.value || null;
    const timezoneOffset = new Date().getTimezoneOffset();

    try {
      addTodoBtn.disabled = true;
      addTodoBtn.textContent = 'Adding...';

      const response = await fetch('/api/todos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          due_date: dueDate,
          reminder_time: reminderTime,
          timezone_offset: timezoneOffset
        })
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to add todo');

      const newTodo = await response.json();
      todos.unshift(newTodo);
      renderTodos();

      // Clear form
      todoTitleInput.value = '';
      todoDueDate.value = '';
      todoReminder.value = '';

      showMessage('Task added!', 'success');
    } catch (error) {
      console.error('Error adding todo:', error);
      showMessage('Failed to add task', 'error');
    } finally {
      addTodoBtn.disabled = false;
      addTodoBtn.textContent = 'Add Task';
    }
  }

  // Toggle todo complete
  async function handleToggleComplete(e) {
    const todoId = e.target.dataset.id;
    const completed = e.target.checked;

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });

      if (!response.ok) throw new Error('Failed to update todo');

      const todo = todos.find(t => t.id == todoId);
      if (todo) {
        todo.completed = completed;
        renderTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      showMessage('Failed to update task', 'error');
      e.target.checked = !completed; // Revert
    }
  }

  // Delete todo
  async function handleDeleteTodo(e) {
    const todoId = e.currentTarget.dataset.id;
    if (!confirm('Delete this task?')) return;

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to delete todo');

      todos = todos.filter(t => t.id != todoId);
      renderTodos();
      showMessage('Task deleted', 'success');
    } catch (error) {
      console.error('Error deleting todo:', error);
      showMessage('Failed to delete task', 'error');
    }
  }

  // Edit todo (simple inline edit)
  function handleEditTodo(e) {
    const todoId = e.currentTarget.dataset.id;
    const todoItem = document.querySelector(`.todo-item[data-id="${todoId}"]`);
    const todo = todos.find(t => t.id == todoId);
    if (!todoItem || !todo) return;

    const titleEl = todoItem.querySelector('.todo-item-title');
    const currentTitle = todo.title;

    // Create inline edit
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input';
    input.value = currentTitle;
    input.maxLength = 200;

    titleEl.replaceWith(input);
    input.focus();
    input.select();

    const saveEdit = async () => {
      const newTitle = input.value.trim();
      if (!newTitle || newTitle === currentTitle) {
        input.replaceWith(titleEl);
        return;
      }

      try {
        const response = await fetch(`/api/todos/${todoId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTitle })
        });

        if (!response.ok) throw new Error('Failed to update');

        todo.title = newTitle;
        renderTodos();
      } catch (error) {
        console.error('Error updating todo:', error);
        showMessage('Failed to update task', 'error');
        input.replaceWith(titleEl);
      }
    };

    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveEdit();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.replaceWith(titleEl);
      }
    });
  }

  // Notification handling
  async function checkNotificationStatus() {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Push notifications not supported');
      return;
    }

    // Get VAPID public key
    try {
      const response = await fetch('/api/push/vapid-public-key', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        vapidPublicKey = data.publicKey;
      }
    } catch (error) {
      console.log('Could not get VAPID key:', error);
      return;
    }

    // Check if already subscribed or permission denied
    const permission = Notification.permission;
    const dismissed = localStorage.getItem('notification-banner-dismissed');

    if (permission === 'granted') {
      // Already have permission, try to subscribe
      await subscribeToPush();
    } else if (permission !== 'denied' && !dismissed) {
      // Show the banner
      notificationBanner.style.display = 'block';
      
      // Check if iOS Safari
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isIOS && !isStandalone) {
        iosInstructions.style.display = 'block';
      }
    }
  }

  async function handleEnableNotifications() {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await subscribeToPush();
        notificationBanner.style.display = 'none';
        showMessage('Notifications enabled!', 'success');
      } else if (permission === 'denied') {
        showMessage('Notification permission denied', 'error');
        notificationBanner.style.display = 'none';
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      showMessage('Could not enable notifications', 'error');
    }
  }

  async function subscribeToPush() {
    if (!vapidPublicKey) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
      }

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (!response.ok) throw new Error('Failed to save subscription');

      console.log('Push subscription saved');
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
  }

  // Utility functions
  function showMessage(text, type) {
    todoMessage.textContent = text;
    todoMessage.className = `todo-message todo-message--${type}`;
    todoMessage.style.display = 'block';
    
    setTimeout(() => {
      todoMessage.style.display = 'none';
    }, 3000);
  }

  function parseDisplayDate(value) {
    if (!value) return null;
    const s = String(value);
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (isoMatch) {
      return { y: +isoMatch[1], m: +isoMatch[2], d: +isoMatch[3], hh: +isoMatch[4], mm: +isoMatch[5] };
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), hh: d.getHours(), mm: d.getMinutes() };
  }

  function formatDisplayDate(parsed) {
    if (!parsed) return '';
    const now = new Date();
    const today = now.getFullYear() === parsed.y && now.getMonth()+1 === parsed.m && now.getDate() === parsed.d;
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isTomorrow = tomorrow.getFullYear() === parsed.y && tomorrow.getMonth()+1 === parsed.m && tomorrow.getDate() === parsed.d;
    const isYesterday = yesterday.getFullYear() === parsed.y && yesterday.getMonth()+1 === parsed.m && yesterday.getDate() === parsed.d;
    
    const h = parsed.hh;
    const m = parsed.mm;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const timeStr = `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
    
    if (today) return `Today ${timeStr}`;
    if (isTomorrow) return `Tomorrow ${timeStr}`;
    if (isYesterday) return `Yesterday ${timeStr}`;
    
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parsed.m-1]} ${parsed.d}, ${timeStr}`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
});
