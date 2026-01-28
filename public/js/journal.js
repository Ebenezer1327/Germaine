// Journal functionality with simple image upload and gallery

let currentImages = [];
let currentFolderId = null;
let folders = [];

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Image upload
  document.getElementById('image-upload').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const compressedSrc = await compressImage(event.target.result);
          currentImages.push(compressedSrc);
          updateImagePreview();
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  });

  // Folder selector
  document.getElementById('folder-select').addEventListener('change', (e) => {
    currentFolderId = e.target.value ? parseInt(e.target.value) : null;
  });

  // Create folder button
  document.getElementById('create-folder-btn').addEventListener('click', () => {
    showFolderModal();
  });

  // Folder modal handlers
  document.querySelector('.journal-folder-modal-close').addEventListener('click', closeFolderModal);
  document.getElementById('folder-modal').addEventListener('click', (e) => {
    if (e.target.id === 'folder-modal') {
      closeFolderModal();
    }
  });

  document.getElementById('folder-create-confirm-btn').addEventListener('click', createFolder);
  document.getElementById('folder-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      createFolder();
    }
  });

  // Modal close handlers
  document.querySelector('.journal-modal-close').addEventListener('click', closeImageModal);
  document.getElementById('image-modal').addEventListener('click', (e) => {
    if (e.target.id === 'image-modal') {
      closeImageModal();
    }
  });

  // Initialize
  loadFolders();
  loadEntries();
  document.getElementById('save-journal-btn').addEventListener('click', saveEntry);
  
  // Auto-save on Ctrl+S or Cmd+S
  document.getElementById('journal-textarea').addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveEntry();
    }
  });
});

function compressImage(src, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const compressedSrc = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedSrc);
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function updateImagePreview() {
  const preview = document.getElementById('journal-image-preview');
  const placeholder = preview.querySelector('.journal-preview-placeholder');
  
  if (currentImages.length === 0) {
    if (!placeholder) {
      preview.innerHTML = '<p class="journal-preview-placeholder">No images selected</p>';
    }
    return;
  }
  
  if (placeholder) placeholder.remove();
  
  preview.innerHTML = currentImages.map((src, index) => `
    <div class="journal-preview-item">
      <img src="${src}" alt="Preview ${index + 1}" class="journal-preview-img">
      <button class="journal-preview-delete" data-index="${index}">×</button>
    </div>
  `).join('');
  
  // Add delete handlers
  preview.querySelectorAll('.journal-preview-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      currentImages.splice(index, 1);
      updateImagePreview();
    });
  });
  
  // Add click handlers to view images
  preview.querySelectorAll('.journal-preview-img').forEach((img, index) => {
    img.addEventListener('click', () => {
      showImageModal(currentImages[index]);
    });
  });
}

function showImageModal(src) {
  const modal = document.getElementById('image-modal');
  const modalImg = document.getElementById('modal-image');
  modalImg.src = src;
  modal.style.display = 'flex';
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  modal.style.display = 'none';
}

// Load entries
async function loadEntries() {
  try {
    const response = await fetch('/api/journal');
    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (response.status === 500) {
        const errorText = await response.text();
        console.error('Server error:', errorText);
        throw new Error(`Server error: ${response.status}. Check server logs.`);
      }
      throw new Error(`Failed to load entries: ${response.status}`);
    }
    const data = await response.json();
    if (data.entries) {
      displayEntries(data.entries);
    } else {
      displayEntries([]);
    }
  } catch (error) {
    console.error('Error loading entries:', error);
    const list = document.getElementById('journal-entries-list');
    if (list) {
      list.innerHTML = '<p class="journal-error">Failed to load entries. Please try again. If the problem persists, check the server console.</p>';
    }
  }
}

// Folder functions
async function loadFolders() {
  try {
    const response = await fetch('/api/folders');
    if (!response.ok) {
      throw new Error('Failed to load folders');
    }
    const data = await response.json();
    folders = data.folders || [];
    updateFolderSelector();
  } catch (error) {
    console.error('Error loading folders:', error);
  }
}

function updateFolderSelector() {
  const select = document.getElementById('folder-select');
  const currentValue = select.value;
  
  // Keep "No Folder" option
  select.innerHTML = '<option value="">No Folder</option>';
  
  folders.forEach(folder => {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.folder_name;
    select.appendChild(option);
  });
  
  // Restore selection if editing
  if (currentValue) {
    select.value = currentValue;
  }
}

function showFolderModal() {
  const modal = document.getElementById('folder-modal');
  const input = document.getElementById('folder-name-input');
  modal.style.display = 'flex';
  input.value = '';
  input.focus();
}

function closeFolderModal() {
  const modal = document.getElementById('folder-modal');
  modal.style.display = 'none';
}

async function createFolder() {
  const input = document.getElementById('folder-name-input');
  const folderName = input.value.trim();
  
  if (!folderName) {
    showMessage('Please enter a folder name', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ folder_name: folderName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create folder');
    }
    
    const data = await response.json();
    showMessage(`Folder "${folderName}" created! 💕`, 'success');
    closeFolderModal();
    await loadFolders();
    
    // Select the newly created folder
    document.getElementById('folder-select').value = data.folder.id;
    currentFolderId = data.folder.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    showMessage(error.message || 'Failed to create folder', 'error');
  }
}

function displayEntries(entries) {
  const list = document.getElementById('journal-entries-list');
  
  if (!entries || entries.length === 0) {
    list.innerHTML = '<p class="journal-empty">No entries yet. Start writing!</p>';
    return;
  }

  // Group entries by folder
  const entriesByFolder = {};
  const entriesNoFolder = [];
  
  entries.forEach(entry => {
    if (entry.folder_id && entry.folder_name) {
      if (!entriesByFolder[entry.folder_id]) {
        entriesByFolder[entry.folder_id] = {
          folder_name: entry.folder_name,
          entries: []
        };
      }
      entriesByFolder[entry.folder_id].entries.push(entry);
    } else {
      entriesNoFolder.push(entry);
    }
  });

  // Build HTML
  let html = '';
  
  // Entries in folders
  Object.values(entriesByFolder).forEach(folderGroup => {
    html += `
      <div class="journal-folder-group">
        <div class="journal-folder-header">
          <h3 class="journal-folder-name">📁 ${folderGroup.folder_name}</h3>
        </div>
        <div class="journal-folder-entries">
          ${folderGroup.entries.map(entry => renderEntry(entry)).join('')}
        </div>
      </div>
    `;
  });
  
  // Entries without folder
  if (entriesNoFolder.length > 0) {
    html += `
      <div class="journal-folder-group">
        <div class="journal-folder-header">
          <h3 class="journal-folder-name">📄 All Entries</h3>
        </div>
        <div class="journal-folder-entries">
          ${entriesNoFolder.map(entry => renderEntry(entry)).join('')}
        </div>
      </div>
    `;
  }
  
  list.innerHTML = html;
  
  // Render galleries for entries with images
  setTimeout(() => {
    entries.forEach(entry => {
      let images = [];
      try {
        if (Array.isArray(entry.images)) {
          images = entry.images;
        } else if (entry.images && typeof entry.images === 'string') {
          images = JSON.parse(entry.images);
        } else if (entry.images && typeof entry.images === 'object') {
          images = entry.images;
        }
      } catch (parseErr) {
        console.error('Error parsing images for rendering:', parseErr);
        images = [];
      }
      if (images && images.length > 0) {
        renderGallery(`gallery-${entry.id}`, images);
      }
    });
  }, 100);
  
  // Use event delegation for edit/delete buttons
  if (!window.journalEventListenerAttached) {
    window.journalEventListenerAttached = true;
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.journal-edit-btn');
      const deleteBtn = e.target.closest('.journal-delete-btn');
      
      if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        const entryId = parseInt(editBtn.dataset.entryId);
        const content = editBtn.dataset.content.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        editEntry(entryId, content);
      } else if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const entryId = parseInt(deleteBtn.dataset.entryId);
        deleteEntry(entryId);
      }
    });
  }
}

function renderEntry(entry) {
  const date = new Date(entry.created_at);
  const formattedDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const content = entry.content || '';
  const escapedContent = escapeForAttribute(content);
  let images = [];
  try {
    if (Array.isArray(entry.images)) {
      images = entry.images;
    } else if (entry.images && typeof entry.images === 'string') {
      images = JSON.parse(entry.images);
    } else if (entry.images && typeof entry.images === 'object') {
      images = entry.images;
    }
  } catch (parseErr) {
    console.error('Error parsing images in display:', parseErr);
    images = [];
  }
  const hasImages = images.length > 0;
  
  return `
    <div class="journal-entry" data-entry-id="${entry.id}">
      <div class="journal-entry-header">
        <div class="journal-entry-date">${formattedDate}</div>
        <div class="journal-entry-actions">
          <button class="journal-edit-btn" data-entry-id="${entry.id}" data-content="${escapedContent}">✏️</button>
          <button class="journal-delete-btn" data-entry-id="${entry.id}">🗑️</button>
        </div>
      </div>
      ${content ? `<div class="journal-entry-content" id="content-${entry.id}">${escapeHtml(content)}</div>` : ''}
      ${hasImages ? `<div class="journal-entry-gallery" id="gallery-${entry.id}"></div>` : ''}
    </div>
  `;
}

function renderGallery(containerId, images) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!images || !Array.isArray(images) || images.length === 0) return;
  
  // Handle both old format (objects with src) and new format (just strings)
  const imageSources = images.map(img => typeof img === 'string' ? img : (img.src || img));
  
  container.innerHTML = imageSources.map((src, index) => {
    // Escape src for onclick
    const escapedSrc = src.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `
      <div class="journal-gallery-item">
        <img src="${src}" alt="Image ${index + 1}" class="journal-gallery-img" onclick="showImageModal('${escapedSrc}')">
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/\n/g, '<br>');
}

function escapeForAttribute(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Make showImageModal global for onclick handlers
window.showImageModal = showImageModal;

async function saveEntry() {
  if (window.editingEntry) {
    await saveEdit(window.editingEntry);
    return;
  }
  
  const textarea = document.getElementById('journal-textarea');
  const content = textarea.value.trim();
  const saveBtn = document.getElementById('save-journal-btn');
  const folderSelect = document.getElementById('folder-select');
  
  if (!content && currentImages.length === 0) {
    showMessage('Please write something or add images before saving!', 'error');
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // Save images as simple array of strings (base64 data URLs)
    const images = currentImages.map(src => src);
    const folderId = folderSelect.value ? parseInt(folderSelect.value) : null;
    
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, images, folder_id: folderId }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save entry';
      try {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } catch (parseErr) {
        const errorText = await response.text();
        if (response.status === 413) {
          errorMessage = 'Image files are too large. Please use smaller images or compress them.';
        } else {
          errorMessage = `Server error (${response.status}). Check server logs.`;
        }
        console.error('Error response:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    showMessage('Entry saved successfully! 💕', 'success');
    
    // Clear editor
    textarea.value = '';
    currentImages = [];
    currentFolderId = null;
    folderSelect.value = '';
    updateImagePreview();
    
    await loadEntries();
  } catch (error) {
    console.error('Error saving entry:', error);
    showMessage('Failed to save entry. Please try again.', 'error');
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Entry';
  }
}

async function editEntry(entryId, currentContent) {
  if (window.editingEntry && window.editingEntry !== entryId) {
    return;
  }
  window.editingEntry = entryId;
  
  const saveBtn = document.getElementById('save-journal-btn');
  saveBtn.textContent = 'Update Entry';
  
  try {
    const response = await fetch('/api/journal');
    if (!response.ok) {
      throw new Error('Failed to load entries');
    }
    const data = await response.json();
    const entry = data.entries.find(e => e.id === entryId);
    
    if (!entry) {
      showMessage('Entry not found', 'error');
      window.editingEntry = null;
      saveBtn.textContent = 'Save Entry';
      return;
    }
    
    const textarea = document.getElementById('journal-textarea');
    const content = currentContent ? currentContent.replace(/&quot;/g, '"').replace(/&#39;/g, "'") : (entry.content || '');
    textarea.value = content;
    
    // Load folder
    const folderSelect = document.getElementById('folder-select');
    if (entry.folder_id) {
      folderSelect.value = entry.folder_id;
      currentFolderId = entry.folder_id;
    } else {
      folderSelect.value = '';
      currentFolderId = null;
    }
    
    // Load images
    let images = [];
    try {
      if (Array.isArray(entry.images)) {
        images = entry.images;
      } else if (entry.images && typeof entry.images === 'string') {
        images = JSON.parse(entry.images);
      } else if (entry.images && typeof entry.images === 'object') {
        images = entry.images;
      }
    } catch (parseErr) {
      console.error('Error parsing images:', parseErr);
      images = [];
    }
    
    // Convert to simple array of strings
    currentImages = images.map(img => typeof img === 'string' ? img : (img.src || img));
    updateImagePreview();
    
    textarea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    console.error('Error loading entry for edit:', error);
    showMessage('Failed to load entry', 'error');
    window.editingEntry = null;
    saveBtn.textContent = 'Save Entry';
  }
}

async function saveEdit(entryId) {
  const textarea = document.getElementById('journal-textarea');
  const content = textarea.value.trim();
  const images = currentImages.map(src => src);
  const saveBtn = document.getElementById('save-journal-btn');
  const folderSelect = document.getElementById('folder-select');
  const folderId = folderSelect.value ? parseInt(folderSelect.value) : null;
  
  if (!content && images.length === 0) {
    showMessage('Entry cannot be empty!', 'error');
    return;
  }
  
  saveBtn.disabled = true;
  saveBtn.textContent = 'Updating...';
  
  try {
    const response = await fetch(`/api/journal/${entryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, images, folder_id: folderId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update entry');
    }
    
    showMessage('Entry updated successfully! 💕', 'success');
    window.editingEntry = null;
    
    // Clear editor
    textarea.value = '';
    currentImages = [];
    currentFolderId = null;
    folderSelect.value = '';
    updateImagePreview();
    saveBtn.textContent = 'Save Entry';
    
    await loadEntries();
  } catch (error) {
    console.error('Error updating entry:', error);
    showMessage('Failed to update entry. Please try again.', 'error');
    window.editingEntry = null;
    saveBtn.textContent = 'Save Entry';
  } finally {
    saveBtn.disabled = false;
  }
}

async function deleteEntry(entryId) {
  if (!confirm('Are you sure you want to delete this entry?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete entry');
    }
    
    showMessage('Entry deleted successfully', 'success');
    await loadEntries();
  } catch (error) {
    console.error('Error deleting entry:', error);
    showMessage('Failed to delete entry. Please try again.', 'error');
  }
}

function showMessage(text, type = 'info') {
  const messageEl = document.getElementById('journal-message');
  messageEl.textContent = text;
  messageEl.className = `journal-message journal-message--${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 4000);
}
