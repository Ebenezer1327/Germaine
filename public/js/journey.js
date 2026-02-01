// Journey calendar: click a date to add text + media for that day

(function () {
  var currentYear, currentMonth;
  var monthEntries = {};
  var dayImages = [];
  var currentSelectedDate = null;

  function compressImage(src, maxWidth, quality) {
    maxWidth = maxWidth || 1200;
    quality = quality == null ? 0.85 : quality;
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var canvas = document.createElement('canvas');
        var w = img.width;
        var h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch (e) {
          resolve(src);
        }
      };
      img.onerror = function () { resolve(src); };
      img.src = src;
    });
  }

  function dateKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function normalizeDateKey(dateVal) {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
      var m = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return m ? m[1] + '-' + m[2] + '-' + m[3] : dateVal.slice(0, 10);
    }
    if (dateVal instanceof Date) return dateVal.toISOString().slice(0, 10);
    return String(dateVal).slice(0, 10);
  }

  function formatDateLabel(dateStr) {
    var m = dateStr && dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return dateStr || '';
    var year = parseInt(m[1], 10);
    var month = parseInt(m[2], 10) - 1;
    var day = parseInt(m[3], 10);
    var d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  function loadMonth() {
    var url = '/api/journey?year=' + currentYear + '&month=' + currentMonth;
    fetch(url, { credentials: 'same-origin' })
      .then(function (r) {
        if (r.status === 401) { window.location.href = '/login'; return; }
        return r.json();
      })
      .then(function (data) {
        monthEntries = {};
        if (data && data.entries) {
          data.entries.forEach(function (e) {
            var key = normalizeDateKey(e.date);
            var imgs = e.images;
            if (!Array.isArray(imgs) && imgs && typeof imgs === 'object') imgs = Object.values(imgs);
            if (!Array.isArray(imgs)) imgs = [];
            monthEntries[key] = {
              id: e.id,
              date: e.date,
              content: e.content || '',
              images: imgs,
              updated_at: e.updated_at
            };
          });
        }
        renderCalendar();
      })
      .catch(function () { renderCalendar(); });
  }

  function renderCalendar() {
    var nav = document.getElementById('journey-cal-nav');
    var grid = document.getElementById('journey-cal-grid');
    if (!nav || !grid) return;

    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    nav.querySelector('.journey-cal-title').textContent = monthNames[currentMonth - 1] + ' ' + currentYear;

    var first = new Date(currentYear, currentMonth - 1, 1);
    var last = new Date(currentYear, currentMonth, 0);
    var startDow = first.getDay();
    var daysInMonth = last.getDate();

    var prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    var prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    var prevLast = new Date(prevYear, prevMonth, 0);
    var prevDays = prevLast.getDate();

    var html = '<div class="journey-cal-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>';
    var cells = [];
    var i, d, key, hasEntry;

    for (i = 0; i < startDow; i++) {
      d = prevDays - startDow + i + 1;
      cells.push('<button type="button" class="journey-cal-day journey-cal-day--other" disabled>' + d + '</button>');
    }
    for (d = 1; d <= daysInMonth; d++) {
      key = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      hasEntry = monthEntries[key];
      var selected = key === currentSelectedDate ? ' journey-cal-day--selected' : '';
      cells.push(
        '<button type="button" class="journey-cal-day' + (hasEntry ? ' journey-cal-day--has-entry' : '') + selected + '" data-date="' + key + '">' +
          '<span class="journey-cal-day-num">' + d + '</span>' +
          (hasEntry ? '<span class="journey-cal-day-dot"></span>' : '') +
        '</button>'
      );
    }

    var total = cells.length;
    var remainder = total % 7;
    if (remainder) for (i = 0; i < 7 - remainder; i++) cells.push('<span class="journey-cal-day journey-cal-day--empty"></span>');

    html += '<div class="journey-cal-days">' + cells.join('') + '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('.journey-cal-day[data-date]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openDayPanel(btn.dataset.date);
      });
    });
  }

  function openDayPanel(dateStr) {
    var placeholder = document.getElementById('journey-note-placeholder');
    var form = document.getElementById('journey-note-form');
    var title = document.getElementById('journey-day-title');
    var textarea = document.getElementById('journey-day-text');
    var fileInput = document.getElementById('journey-day-upload');
    if (!form || !title) return;

    dayImages = [];
    var entry = monthEntries[dateStr] || monthEntries[normalizeDateKey(dateStr)];
    if (entry) {
      textarea.value = entry.content || '';
      dayImages = (entry.images && entry.images.length) ? entry.images.slice() : [];
    } else {
      textarea.value = '';
    }

    currentSelectedDate = dateStr;
    title.textContent = formatDateLabel(dateStr);
    form.dataset.editDate = dateStr;
    showDayError('');
    updateDayPreview();
    if (placeholder) placeholder.style.display = 'none';
    form.style.display = 'block';
    if (fileInput) fileInput.value = '';
    textarea.focus();
  }

  function showJourneyImageModal(src) {
    var modal = document.getElementById('journey-image-modal');
    var img = document.getElementById('journey-modal-image');
    if (modal && img) {
      img.src = src;
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  function closeJourneyImageModal() {
    var modal = document.getElementById('journey-image-modal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  function updateDayPreview() {
    var preview = document.getElementById('journey-day-preview');
    if (!preview) return;
    if (dayImages.length === 0) {
      preview.innerHTML = '<p class="journey-day-preview-placeholder">No images</p>';
      return;
    }
    preview.innerHTML = dayImages.map(function (src, idx) {
      var safeSrc = src.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      return (
        '<div class="journey-day-preview-item">' +
          '<img src="' + safeSrc + '" alt="" class="journey-day-preview-img" data-src="' + safeSrc + '" title="Click to expand" />' +
          '<button type="button" class="journey-day-preview-remove" data-index="' + idx + '" aria-label="Remove">×</button>' +
        '</div>'
      );
    }).join('');
    preview.querySelectorAll('.journey-day-preview-remove').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        dayImages.splice(parseInt(btn.dataset.index, 10), 1);
        updateDayPreview();
      });
    });
    preview.querySelectorAll('.journey-day-preview-img').forEach(function (img) {
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        var src = img.getAttribute('data-src') || img.src;
        if (src) showJourneyImageModal(src);
      });
    });
  }

  function showDayError(msg) {
    var el = document.getElementById('journey-day-error');
    if (el) {
      el.textContent = msg || 'Something went wrong.';
      el.style.display = msg ? 'block' : 'none';
    }
  }

  function saveDayEntry(onSuccess) {
    var form = document.getElementById('journey-note-form');
    var textarea = document.getElementById('journey-day-text');
    var dateStr = form && form.dataset.editDate;
    if (!dateStr) {
      if (typeof onSuccess === 'function') onSuccess();
      return;
    }

    showDayError('');

    var content = textarea ? textarea.value.trim() : '';
    var payload = { date: dateStr, content: content, images: dayImages };

    var btn = document.getElementById('journey-day-save');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    fetch('/api/journey', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        if (r.status === 401) {
          window.location.href = '/login';
          return null;
        }
        return r.json().then(function (data) {
          return { ok: r.ok, status: r.status, data: data };
        }).catch(function () {
          return { ok: false, status: r.status, data: null };
        });
      })
      .then(function (result) {
        if (!result) return;
        if (result.ok && result.data && result.data.entry) {
          var key = normalizeDateKey(result.data.entry.date) || dateStr;
          var entry = result.data.entry;
          var imgs = entry.images;
          if (!Array.isArray(imgs) && imgs && typeof imgs === 'object') imgs = Object.values(imgs);
          if (!Array.isArray(imgs)) imgs = [];
          monthEntries[key] = { id: entry.id, date: entry.date, content: entry.content || '', images: imgs, updated_at: entry.updated_at };
          renderCalendar();
          if (typeof onSuccess === 'function') onSuccess();
        } else {
          var msg = (result.data && result.data.error) ? result.data.error : ('Save failed (' + result.status + '). Try again.');
          showDayError(msg);
        }
      })
      .catch(function (err) {
        showDayError('Network error. Check connection and try again.');
        console.error('Journey save error:', err);
        if (typeof onSuccess === 'function') onSuccess();
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = 'Save'; }
      });
  }

  function init() {
    var now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1;

    function changeMonth(delta) {
      var form = document.getElementById('journey-note-form');
      var dateStr = form && form.dataset.editDate;
      var formVisible = form && form.style.display !== 'none';
      if (formVisible && dateStr) {
        saveDayEntry(function () {
          doChangeMonth(delta);
        });
      } else {
        doChangeMonth(delta);
      }
    }

    function doChangeMonth(delta) {
      if (delta < 0) {
        if (currentMonth === 1) { currentMonth = 12; currentYear--; } else currentMonth--;
      } else {
        if (currentMonth === 12) { currentMonth = 1; currentYear++; } else currentMonth++;
      }
      loadMonth();
    }

    var prevBtn = document.getElementById('journey-cal-prev');
    var nextBtn = document.getElementById('journey-cal-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { changeMonth(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { changeMonth(1); });

    var upload = document.getElementById('journey-day-upload');
    if (upload) {
      upload.addEventListener('change', function (e) {
        var files = e.target.files && Array.from(e.target.files);
        if (!files || files.length === 0) return;
        var done = 0;
        files.forEach(function (file) {
          if (!file.type.startsWith('image/')) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            compressImage(ev.target.result).then(function (compressed) {
              dayImages.push(compressed);
              updateDayPreview();
            });
          };
          reader.readAsDataURL(file);
        });
        e.target.value = '';
      });
    }

    var saveBtn = document.getElementById('journey-day-save');
    if (saveBtn) saveBtn.addEventListener('click', saveDayEntry);

    var imageModal = document.getElementById('journey-image-modal');
    var imageModalClose = document.getElementById('journey-image-modal-close');
    if (imageModalClose) imageModalClose.addEventListener('click', closeJourneyImageModal);
    if (imageModal) {
      imageModal.addEventListener('click', function (e) {
        if (e.target === imageModal) closeJourneyImageModal();
      });
    }

    loadMonth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
