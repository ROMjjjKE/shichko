
(function () {
  'use strict';
  var WA = 'https://wa.me/375336319516';
  var PLAN = {
    chand: { name: 'Люстра', h: 0.6, color: '#7A4B2A', icon: 'light' },
    sock: { name: 'Розетка / выключатель', h: 0.4, color: '#2C6FB5', icon: 'socket' },
    brk: { name: 'Автомат', h: 0.3, color: '#5A7210', icon: 'breaker' },
    mtr: { name: 'Счётчик', h: 1.5, color: '#5A7210', icon: 'meter' },
    spot: { name: 'Светильник / спот', h: 0.25, color: '#7A4B2A', icon: 'light' },
    fault: { name: 'Поиск неисправности', h: 1, color: '#B03A2C', icon: 'test' }
  };
  var SPOTS = {
    light: [[120, 90], [300, 90], [400, 120], [200, 150]],
    socket: [[80, 200], [200, 200], [330, 200], [440, 200], [80, 140], [440, 140]],
    breaker: [[470, 40], [430, 40]],
    meter: [[470, 70]],
    test: [[250, 240], [150, 240]]
  };
  var DIAG = {
    svet: { t: 'Не горит свет', c: 'Чаще всего: перегорела лампа, отошёл контакт в патроне или клемме люстры, реже — выключатель или провод в распаечной коробке.', w: 'Проверка лампы → прозвонка выключателя → проверка клемм люстры и коробки.', time: '30–60 мин', risk: 'Не срочно, но искрящая клемма греется: тянуть не стоит.' },
    vybivaet: { t: 'Выбивает автомат', c: 'Перегрузка линии, неисправный прибор или повреждённый кабель. Важно, выбивает сразу или через время: причины разные.', w: 'Отключение потребителей по одному, замер тока и изоляции, поиск повреждённого участка.', time: '1–2 часа', risk: 'Не ставьте автомат на больший номинал: он защищает кабель, а не наоборот.' },
    iskrit: { t: 'Искрит или почернела розетка', c: 'Плохой контакт в клеммах или подгоревший механизм. Почернение — признак нагрева, а не «нормально работает».', w: 'Обесточить линию, разобрать, оценить клеммы и жилу, при необходимости обрезать повреждённый участок.', time: '30–60 мин', risk: 'Срочно: не пользуйтесь точкой и обесточьте линию в щите до приезда.' },
    komnata: { t: 'Не работает одна комната', c: 'Обесточенная линия, сработавший автомат или УЗО, разрыв в распаечной коробке, иногда отгоревший ноль на группе.', w: 'Проверка щита, затем коробок и первой точки линии.', time: '1–2 часа', risk: 'Проверьте, не выбит ли автомат в щите, но не лезьте внутрь без опыта.' },
    morgaet: { t: 'Моргает свет', c: 'Плохой контакт, перегрузка линии, неисправный диммер или несовместимая с ним лампа.', w: 'Проверка контактов по цепи, замер просадки, проверка совместимости лампы и диммера.', time: '1–2 часа', risk: 'Мерцание — ранний признак нагрева контакта.' },
    zapah: { t: 'Запах пластмассы, гудит', c: 'Перегрев клеммы, автомата или проводки. Самый опасный симптом из списка.', w: 'Обесточить, найти источник нагрева, устранить, заменить повреждённые элементы.', time: '1–3 часа', risk: 'Срочно: обесточьте линию и не пользуйтесь ею до осмотра.' }
  };

  function initDrawer() {
    var d = document.getElementById('drawer');
    var b = document.querySelector('.header .burger');
    if (!d || !b) return;
    var last = null;
    function open() {
      last = document.activeElement;
      d.hidden = false; d.setAttribute('data-open', '');
      b.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-locked');
      var f = d.querySelector('a, button'); if (f) f.focus({ preventScroll: true });
    }
    function close() {
      d.hidden = true; d.removeAttribute('data-open');
      b.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      if (last) last.focus({ preventScroll: true });
    }
    b.addEventListener('click', function () { d.hidden ? open() : close(); });
    d.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.closest('a') || !e.target.closest('.drawer__in')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !d.hidden) close();
      if (e.key === 'Tab' && !d.hidden) {
        var it = d.querySelectorAll('a, button, input');
        if (!it.length) return;
        var f = it[0], l = it[it.length - 1];
        if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
        else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
      }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024 && !d.hidden) close(); });
  }

  function m(v, d2) { return (Math.round(v * Math.pow(10, d2 || 0)) / Math.pow(10, d2 || 0)).toString().replace('.', ','); }

  function initPlan() {
    var svg = document.getElementById('planSvg');
    if (!svg) return;
    var st = { chand: 0, sock: 0, brk: 0, mtr: 0, spot: 0, fault: 0 };
    var out = {
      time: document.getElementById('planTime'), spec: document.getElementById('planSpec'),
      f: document.getElementById('planFormula'), go: document.getElementById('planGo')
    };

    function draw() {
      var p = [];
      p.push('<rect x="0" y="0" width="520" height="320" fill="#FAFBF8"/>');
      // квартира: комнаты
      p.push('<g fill="none" stroke="#1A1D1F" stroke-width="2.2">');
      p.push('<rect x="30" y="30" width="260" height="150"/>');       // гостиная
      p.push('<rect x="290" y="30" width="200" height="110"/>');      // кухня
      p.push('<rect x="30" y="180" width="150" height="100"/>');      // спальня
      p.push('<rect x="180" y="180" width="110" height="100"/>');     // коридор
      p.push('<rect x="290" y="140" width="200" height="140"/>');     // санузел/кабинет
      p.push('</g>');
      // подписи комнат
      var labels = [['ГОСТИНАЯ', 40, 50], ['КУХНЯ', 300, 50], ['СПАЛЬНЯ', 40, 200], ['КОРИДОР', 188, 200], ['КАБИНЕТ', 300, 160]];
      labels.forEach(function (l) {
        p.push('<text x="' + l[1] + '" y="' + l[2] + '" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="1.4" fill="#8B928B">' + l[0] + '</text>');
      });
      // щит и линия к нему
      p.push('<rect x="452" y="26" width="34" height="52" fill="#E9EBE5" stroke="#5A7210" stroke-width="2"/>');
      p.push('<text x="458" y="20" font-family="JetBrains Mono, monospace" font-size="8" fill="#5A7210">ЩИТ</text>');

      // точки
      var used = { light: 0, socket: 0, breaker: 0, meter: 0, test: 0 };
      var pts = [];
      Object.keys(st).forEach(function (k) {
        var n = st[k];
        if (!n) return;
        var icon = PLAN[k].icon, arr = SPOTS[icon] || [];
        for (var i = 0; i < n; i++) {
          var pos = arr[(used[icon] + i) % arr.length];
          var jitter = Math.floor((used[icon] + i) / arr.length) * 9;
          pts.push({ x: pos[0] + jitter, y: pos[1] + jitter, c: PLAN[k].color, icon: icon });
        }
        used[icon] += n;
      });
      // линия к щиту — от первой точки с фазой
      if (pts.length) {
        p.push('<path d="M' + pts[0].x + ' ' + pts[0].y + ' Q ' + ((pts[0].x + 470) / 2) + ' ' + (pts[0].y - 60) + ' 456 52" fill="none" stroke="#7A4B2A" stroke-width="1.4" stroke-dasharray="5 4"/>');
      }
      pts.forEach(function (pt) { drawIcon(p, pt); });

      if (!pts.length) {
        p.push('<text x="260" y="308" text-anchor="middle" font-family="Golos Text, sans-serif" font-size="12" fill="#8B928B">Добавьте работы справа — точки появятся на плане</text>');
      }
      svg.innerHTML = p.join('');
    }

    function drawIcon(p, pt) {
      var x = pt.x, y = pt.y, c = pt.c;
      if (pt.icon === 'light') {
        p.push('<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + c + '"/>');
        p.push('<g stroke="' + c + '" stroke-width="1.3">');
        for (var a = 0; a < 8; a++) {
          var rad = a * Math.PI / 4;
          p.push('<line x1="' + (x + Math.cos(rad) * 8.5) + '" y1="' + (y + Math.sin(rad) * 8.5) + '" x2="' + (x + Math.cos(rad) * 12) + '" y2="' + (y + Math.sin(rad) * 12) + '"/>');
        }
        p.push('</g>');
      } else if (pt.icon === 'socket') {
        p.push('<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" rx="2" fill="#fff" stroke="' + c + '" stroke-width="2.2"/>');
        p.push('<circle cx="' + (x - 2.4) + '" cy="' + (y - 1) + '" r="1.5" fill="' + c + '"/><circle cx="' + (x + 2.4) + '" cy="' + (y - 1) + '" r="1.5" fill="' + c + '"/>');
      } else if (pt.icon === 'breaker' || pt.icon === 'meter') {
        p.push('<rect x="' + (x - 6) + '" y="' + (y - 8) + '" width="12" height="16" rx="1.5" fill="#fff" stroke="' + c + '" stroke-width="2.2"/>');
        p.push('<line x1="' + (x - 3) + '" y1="' + (y + 1) + '" x2="' + (x + 3) + '" y2="' + (y + 1) + '" stroke="' + c + '" stroke-width="1.6"/>');
      } else {
        p.push('<circle cx="' + x + '" cy="' + y + '" r="6.5" fill="none" stroke="' + c + '" stroke-width="2.2"/>');
        p.push('<path d="M' + (x - 9) + ' ' + (y + 9) + ' L' + (x - 3) + ' ' + (y + 3) + '" stroke="' + c + '" stroke-width="2.2"/>');
      }
    }

    function calc() {
      var hours = 0, rows = [], total = 0, parts = [];
      Object.keys(st).forEach(function (k) {
        var n = st[k];
        if (!n) return;
        var h = n * PLAN[k].h;
        hours += h; total += n;
        rows.push([PLAN[k].name, n + ' шт. · ' + m(h, 2) + ' ч']);
        parts.push(PLAN[k].name + ' × ' + n);
      });
      if (!total) {
        out.time.textContent = '—';
        out.spec.innerHTML = '<tr><td>Пока ничего не выбрано</td><td>0 ч</td></tr>';
        out.f.textContent = 'Выберите работы степперами справа';
        out.go.href = WA;
        return;
      }
      var trips = hours > 6 ? 2 : 1;
      var rounded = Math.ceil(hours * 2) / 2;
      out.time.textContent = m(rounded, 1).replace(',0', '') + ' ч';
      rows.push(['Всего точек', total + ' шт.']);
      rows.push(['Визитов', trips]);
      out.spec.innerHTML = rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('');
      out.f.textContent = 'Время = сумма по точкам = ' + m(hours, 2) + ' ч, округлено до получаса: ' + m(rounded, 1) + ' ч' + (trips > 1 ? ' | больше 6 часов — удобнее за два визита' : ' | укладывается в один визит');
      out.go.href = WA + '?text=' + encodeURIComponent(
        'Заявка с сайта: электромонтаж.\nРаботы:\n— ' + parts.join('\n— ') +
        '\n\nТочек: ' + total + '\nОриентировочное время: ' + m(rounded, 1) + ' ч' +
        '\n\nПодскажите цену и когда сможете приехать.');
    }

    var pk = document.getElementById('pk');
    if (pk) pk.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-k]'); if (!btn) return;
      var k = btn.getAttribute('data-k'), dlt = parseInt(btn.getAttribute('data-d'), 10);
      st[k] = Math.max(0, Math.min(20, st[k] + dlt));
      var o = { chand: 'oChand', sock: 'oSock', brk: 'oBrk', mtr: 'oMtr', spot: 'oSpot', fault: 'oFault' }[k];
      var el = document.getElementById(o); if (el) el.textContent = st[k];
      draw(); calc();
    });
    draw(); calc();
  }

  function initDiag() {
    var box = document.getElementById('diagBtns');
    if (!box) return;
    var v = document.getElementById('verdict');
    var keys = Object.keys(DIAG);
    box.innerHTML = keys.map(function (k, i) {
      return '<button type="button" data-k="' + k + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '">' + DIAG[k].t + '<span>' + DIAG[k].time + '</span></button>';
    }).join('');
    function show(k) {
      var d = DIAG[k];
      v.innerHTML = '<h3>' + d.t + '</h3>' +
        '<div class="rowline"><b>вероятная причина</b><p>' + d.c + '</p></div>' +
        '<div class="rowline"><b>что делаю</b><p>' + d.w + '</p></div>' +
        '<div class="rowline"><b>обычно занимает</b><p>' + d.time + '</p></div>' +
        '<div class="risk">' + d.risk + '</div>' +
        '<p class="note" style="margin-top:12px">Это ориентир, а не диагноз по интернету: точную причину видно на месте.</p>' +
        '<a class="btn" href="' + WA + '?text=' + encodeURIComponent('Заявка с сайта: ' + d.t + '. Опишу подробнее и пришлю фото.') + '" target="_blank" rel="noopener">Написать про это</a>';
    }
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-k]'); if (!btn) return;
      [].forEach.call(box.children, function (c) { c.setAttribute('aria-pressed', c === btn ? 'true' : 'false'); });
      show(btn.getAttribute('data-k'));
    });
    show(keys[0]);
  }

  function initLead() {
    var f = document.getElementById('lead');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('lName'), t = document.getElementById('lTel');
      var city = document.getElementById('lCity'), when = document.getElementById('lWhen'), task = document.getElementById('lTask');
      var bad = false;
      [n, t].forEach(function (el) {
        if (!el.value.trim()) { el.style.borderColor = '#B03A2C'; bad = true; } else { el.style.borderColor = ''; }
      });
      if (bad) return;
      var msg = 'Заявка с сайта: электрика.\nИмя: ' + n.value.trim() + '\nТелефон: ' + t.value.trim() +
        (city && city.value.trim() ? '\nРайон: ' + city.value.trim() : '') +
        (when && when.value.trim() ? '\nУдобное время: ' + when.value.trim() : '') +
        (task && task.value.trim() ? '\nЗадача: ' + task.value.trim() : '') +
        '\n\nФото прикреплю следом.';
      window.open(WA + '?text=' + encodeURIComponent(msg), '_blank');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDrawer(); initPlan(); initDiag(); initLead();
    var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
  });
})();
