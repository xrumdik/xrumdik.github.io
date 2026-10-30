// Переключатель тем: Paper (эта версия сайта) <-> Nerdy (вторая сборка в /nerdy/).
// Ссылка ведёт на ту же страницу в другой теме. Строится на лету, потому что футер
// PaperMod кэшируется Hugo и одинаков для всех страниц.
(function () {
  'use strict';
  var en = (document.documentElement.lang || 'ru').slice(0, 2) === 'en';
  var base = en ? '/en/' : '/';
  var path = location.pathname;
  if (path.indexOf(base) !== 0) path = base;
  var rel = path.slice(base.length).replace(/index\.html$/, '');

  // в какой раздел Nerdy попал каждый кейс
  var topics = {
    'project-glpi': 'itsm', 'project-redmine': 'itsm',
    'project-pcp': 'network', 'project-mail': 'network',
    'project-databasys': 'backup'
  };

  var target = base + 'nerdy/';
  var m = rel.match(/^projects\/([^\/]+)\/?$/);
  if (m && topics[m[1]]) target = base + 'nerdy/posts/work/' + topics[m[1]] + '/' + m[1] + '/';
  else if (/^projects(\/|$)/.test(rel)) target = base + 'nerdy/posts/';
  else if (/^about\/?$/.test(rel)) target = base + 'nerdy/about/';

  var box = document.createElement('div');
  box.className = 'theme-switch';
  box.setAttribute('role', 'group');
  box.setAttribute('aria-label', en ? 'Site theme' : 'Тема сайта');
  box.innerHTML =
    '<span class="theme-switch__item is-active" aria-current="true">Paper</span>' +
    '<a class="theme-switch__item" href="' + target + '">Nerdy</a>';
  document.body.appendChild(box);

  // На телефоне: прячем таблетку при прокрутке вниз, показываем при прокрутке вверх
  // и в самом конце страницы (там под ней оставлено место).
  var last = window.pageYOffset, ticking = false;
  function update() {
    var y = window.pageYOffset;
    var atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 8;
    if (atBottom || y < 80 || y < last - 4) box.classList.remove('is-hidden');
    else if (y > last + 4) box.classList.add('is-hidden');
    last = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
})();
