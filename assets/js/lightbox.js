// Лёгкий просмотрщик фото без внешних библиотек.
// Подхватывает все фото из шорткода photo (figure.rest-photo > a) на странице.
(function () {
  'use strict';
  var links = Array.prototype.slice.call(document.querySelectorAll('.rest-photo a'));
  if (!links.length) return;

  var items = links.map(function (a) {
    var fig = a.closest('figure');
    var cap = fig && fig.querySelector('figcaption');
    var img = a.querySelector('img');
    return { src: a.getAttribute('href'), caption: cap ? cap.textContent : '', alt: img ? img.alt : '' };
  });

  var cur = 0, lastFocus = null, touchX = null;

  var overlay = document.createElement('div');
  overlay.className = 'lb-overlay' + (items.length < 2 ? ' lb-single' : '');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Просмотр фото');
  overlay.innerHTML =
    '<div class="lb-counter" aria-live="polite"></div>' +
    '<button type="button" class="lb-btn lb-close" aria-label="Закрыть">&times;</button>' +
    '<div class="lb-stage">' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Предыдущее">&#8249;</button>' +
      '<img class="lb-img" alt="">' +
      '<button type="button" class="lb-btn lb-next" aria-label="Следующее">&#8250;</button>' +
    '</div>' +
    '<div class="lb-caption"></div>';
  document.body.appendChild(overlay);

  var imgEl = overlay.querySelector('.lb-img');
  var capEl = overlay.querySelector('.lb-caption');
  var cntEl = overlay.querySelector('.lb-counter');
  var closeBtn = overlay.querySelector('.lb-close');

  function preload(i) {
    if (items.length < 2) return;
    var n = (i + items.length) % items.length;
    new Image().src = items[n].src;
  }

  function show(i) {
    cur = (i + items.length) % items.length;
    var it = items[cur];
    imgEl.classList.add('is-loading');
    imgEl.onload = function () { imgEl.classList.remove('is-loading'); };
    imgEl.src = it.src;
    imgEl.alt = it.alt;
    capEl.textContent = it.caption;
    cntEl.textContent = (cur + 1) + ' / ' + items.length;
    preload(cur + 1); preload(cur - 1);
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    overlay.classList.add('is-open');
    document.body.classList.add('lb-lock');
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.classList.remove('lb-lock');
    imgEl.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      // Ctrl/Cmd/Shift-клик и средняя кнопка — обычное поведение (новая вкладка)
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
      e.preventDefault();
      open(i);
    });
  });

  overlay.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
  overlay.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', function (e) {
    // клик по фону (не по картинке/кнопкам) закрывает
    if (e.target === overlay || e.target.classList.contains('lb-stage') || e.target === capEl) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(cur - 1);
    else if (e.key === 'ArrowRight') show(cur + 1);
    else if (e.key === 'Tab') { // фокус остаётся внутри окна
      var f = overlay.querySelectorAll('button:not([disabled])');
      var vis = Array.prototype.filter.call(f, function (b) { return b.offsetParent !== null; });
      if (!vis.length) return;
      var first = vis[0], last = vis[vis.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // свайп на телефоне
  overlay.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
  overlay.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) show(dx < 0 ? cur + 1 : cur - 1);
  }, { passive: true });
})();
