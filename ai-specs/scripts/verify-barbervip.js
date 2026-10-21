#!/usr/bin/env node
// verify-barbervip.js - Verificación de las reglas de negocio del booking
//
// Carga web-app/config.js y el script inline de web-app/index.html en un
// contexto VM (sin navegador) y ejecuta aserciones sobre:
//   - Festivos de Colombia (2026/2027) como días cerrados
//   - Horario por día de la semana
//   - Validación del formulario de reserva (duración del servicio)
//   - Límites min/max del selector de hora
//   - Resolución del endpoint Webhook de n8n
//
// Uso: node ai-specs/scripts/verify-barbervip.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const APP_DIR = path.resolve(__dirname, '..', '..', 'web-app');
const configSrc = fs.readFileSync(path.join(APP_DIR, 'config.js'), 'utf8');
const html = fs.readFileSync(path.join(APP_DIR, 'index.html'), 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error('No se encontro el script inline en index.html');
const inlineSrc = scriptMatch[1];

// ---------- Stubs de DOM ----------
function makeEl(id) {
  const attrs = {};
  const classes = new Set();
  const children = {};
  const el = {
    id,
    value: '',
    textContent: '',
    innerHTML: '',
    checked: false,
    dataset: {},
    classList: {
      add(...names) { names.forEach(n => classes.add(n)); },
      remove(...names) { names.forEach(n => classes.delete(n)); },
      contains(name) { return classes.has(name); },
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : !!force;
        if (on) classes.add(name); else classes.delete(name);
        return on;
      }
    },
    setAttribute(k, v) { attrs[k] = String(v); },
    removeAttribute(k) { delete attrs[k]; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    appendChild() {},
    addEventListener() {},
    querySelector(sel) {
      if (sel === '.btn-label' && id === 'submitBtn') {
        if (!children[sel]) children[sel] = makeEl('btnLabel');
        return children[sel];
      }
      return null;
    },
    querySelectorAll() { return []; },
    scrollIntoView() {},
    focus() {}
  };
  return el;
}

const els = {};
const serviceCards = [];

const documentStub = {
  getElementById(id) {
    if (!els[id]) els[id] = makeEl(id);
    return els[id];
  },
  createElement(tag) { return makeEl(tag); },
  querySelectorAll(sel) {
    if (sel === '.service-card') return serviceCards;
    return [];
  },
  addEventListener() {}
};

const context = {
  console,
  Date,
  Intl,
  JSON,
  Math,
  Object,
  Array,
  String,
  Number,
  RegExp,
  Promise,
  fetch: async () => ({ ok: true, status: 200 }),
  document: documentStub,
  window: { location: { protocol: 'http:' }, addEventListener() {}, setTimeout, clearTimeout },
  IntersectionObserver: class { observe() {} unobserve() {} },
  setTimeout,
  clearTimeout
};
vm.createContext(context);

vm.runInContext(configSrc, context, { filename: 'config.js' });
vm.runInContext('globalThis.BUSINESS_CONFIG = BUSINESS_CONFIG;', context, { filename: 'config.js#export' });
vm.runInContext(inlineSrc, context, { filename: 'index.html#inline' });
vm.runInContext(
  'globalThis.__x = { N8N_WEBHOOK_URL, getScheduleForDate, getHolidayForDate, validateForm, ' +
  'applyTimeBounds, isHourOutsideBounds, minutesToTime, timeToMinutes, formatDateLong, ' +
  'formatDateWithWeekday, getService, getBusinessNow, getOpenState, renderOpenStatus, ' +
  'selectService, highlightSelectedCard, setSubmitLoading, showModal, formatHour };',
  context, { filename: 'index.html#export' }
);

const g = (name) => (name in context.__x ? context.__x[name] : context[name]);
const BUSINESS_CONFIG = context.BUSINESS_CONFIG;

// ---------- Aserciones ----------
let pass = 0;
let fail = 0;

function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log('  OK   ' + name);
  } else {
    fail++;
    console.log('  FAIL ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''));
  }
}

console.log('\n[1] Festivos (is_open false + nombre)');
const holidays = BUSINESS_CONFIG.business_hours.holidays;
check('38 festivos cargados (19 de 2026 + 19 de 2027)', holidays.length === 38, holidays.length);
['2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01',
  '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-13', '2026-07-20',
  '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08',
  '2026-12-25', '2027-01-01', '2027-01-11', '2027-03-22', '2027-03-25', '2027-03-26',
  '2027-05-01', '2027-05-10', '2027-05-31', '2027-06-07', '2027-07-05', '2027-07-12',
  '2027-07-20', '2027-08-07', '2027-08-16', '2027-10-18', '2027-11-01', '2027-11-15',
  '2027-12-08', '2027-12-25'].forEach(d => {
  const s = g('getScheduleForDate')(d);
  check(`${d} cerrado (${s && s.holidayName})`, !!s && s.is_open === false && !!s.holidayName, s);
});

console.log('\n[2] Dias habiles conservan su horario');
[['2026-12-24', '08:00', '19:30'], ['2026-12-26', '08:00', '20:30'],
  ['2026-12-27', '09:00', '16:00'], ['2026-12-21', '08:00', '19:30']].forEach(([d, open, close]) => {
  const s = g('getScheduleForDate')(d);
  check(`${d} -> ${open}-${close}`, !!s && s.is_open === true && s.open === open && s.close === close, s);
});

console.log('\n[3] Dias de la semana de los festivos (calendario oficial)');
const expectedWeekday = {
  '2026-01-01': 4, '2026-01-12': 1, '2026-03-23': 1, '2026-04-02': 4, '2026-04-03': 5,
  '2026-05-01': 5, '2026-05-18': 1, '2026-06-08': 1, '2026-06-15': 1, '2026-06-29': 1,
  '2026-07-13': 1, '2026-07-20': 1, '2026-08-07': 5, '2026-08-17': 1, '2026-10-12': 1,
  '2026-11-02': 1, '2026-11-16': 1, '2026-12-08': 2, '2026-12-25': 5,
  '2027-01-01': 5, '2027-01-11': 1, '2027-03-22': 1, '2027-03-25': 4, '2027-03-26': 5,
  '2027-05-01': 6, '2027-05-10': 1, '2027-05-31': 1, '2027-06-07': 1, '2027-07-05': 1,
  '2027-07-12': 1, '2027-07-20': 2, '2027-08-07': 6, '2027-08-16': 1, '2027-10-18': 1,
  '2027-11-01': 1, '2027-11-15': 1, '2027-12-08': 3, '2027-12-25': 6
};
const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
holidays.forEach(h => {
  const wd = new Date(h.date + 'T12:00:00').getDay();
  check(`${h.date} = ${dayNames[wd]} (esperado ${dayNames[expectedWeekday[h.date]]})`,
    wd === expectedWeekday[h.date], dayNames[wd]);
});

console.log('\n[4] validateForm');
const base = {
  nombre: 'Juan Perez', telefono: '3001234567',
  servicio: 'Corte Caballero Clásico / Fade', fecha: '2026-12-24', hora: '10:00'
};
check('reserva valida sin error', g('validateForm')(Object.assign({}, base)) === null);
const festErr = g('validateForm')(Object.assign({}, base, { fecha: '2026-01-01' }));
check('festivo rechazado', /festivo/.test(festErr) && /Año Nuevo/.test(festErr), festErr);
check('fuera de horario de apertura',
  /horario/.test(g('validateForm')(Object.assign({}, base, { hora: '07:00' }))));
check('fuera de horario de cierre',
  /horario/.test(g('validateForm')(Object.assign({}, base, { hora: '20:00' }))));
const durErr = g('validateForm')(Object.assign({}, base, {
  servicio: 'Combo Full Grooming (Corte + Barba + Cejas)', hora: '19:00'
}));
check('duracion 85min no cabe (ultima 6:05 PM)', /6:05 PM/.test(durErr), durErr);
check('duracion 85min cabe a las 18:00', g('validateForm')(Object.assign({}, base, {
  servicio: 'Combo Full Grooming (Corte + Barba + Cejas)', hora: '18:00'
})) === null);
check('servicio 90min cierra 19:30 -> ultima 18:00', g('validateForm')(Object.assign({}, base, {
  servicio: 'Visagismo + Corte Exclusivo', hora: '17:30'
})) === null);
check('sin fecha -> error', /fecha/i.test(g('validateForm')(Object.assign({}, base, { fecha: '' }))));

console.log('\n[5] Limites del selector de hora');
const fechaEl = documentStub.getElementById('fecha');
const horaEl = documentStub.getElementById('hora');
const servEl = documentStub.getElementById('servicio');

servEl.value = 'Combo Full Grooming (Corte + Barba + Cejas)';
fechaEl.value = '2026-12-24';
g('applyTimeBounds')();
check('min 08:00', horaEl.getAttribute('min') === '08:00', horaEl.getAttribute('min'));
check('max 18:05 (cierre 19:30 - 85min)', horaEl.getAttribute('max') === '18:05', horaEl.getAttribute('max'));
servEl.value = 'Corte Caballero Clásico / Fade';
g('applyTimeBounds')();
check('max 18:30 con servicio de 60min (19:30 - 60min)',
  horaEl.getAttribute('max') === '18:30', horaEl.getAttribute('max'));
fechaEl.value = '2026-01-01';
g('applyTimeBounds')();
check('festivo -> sin min', horaEl.getAttribute('min') === null, horaEl.getAttribute('min'));
check('festivo -> sin max', horaEl.getAttribute('max') === null, horaEl.getAttribute('max'));
fechaEl.value = '';
g('applyTimeBounds')();
check('sin fecha -> sin min', horaEl.getAttribute('min') === null);
check('sin fecha -> sin max', horaEl.getAttribute('max') === null);
fechaEl.value = '2026-12-26';
servEl.value = 'Combo Corte + Barba';
g('applyTimeBounds')();
check('sabado: min 08:00', horaEl.getAttribute('min') === '08:00');
check('sabado: max 19:10 (20:30 - 80min)', horaEl.getAttribute('max') === '19:10', horaEl.getAttribute('max'));

console.log('\n[6] Webhook de n8n');
const n8n = BUSINESS_CONFIG.n8n || {};
check('webhook_url es HTTPS', /^https:\/\//.test(n8n.webhook_url || ''), n8n.webhook_url);
check('webhook_url configurado', !!n8n.webhook_url, n8n.webhook_url);
check('fallback local declarado', n8n.webhook_fallback === 'http://localhost:5678/webhook/reserva', n8n.webhook_fallback);
check('el script usa la URL de config', g('N8N_WEBHOOK_URL') === n8n.webhook_url, g('N8N_WEBHOOK_URL'));
check('sin IP hardcodeada 192.168', !html.includes('192.168.1.5'));

console.log('\n[7] Utilidades');
check("minutesToTime(1085) === '18:05'", g('minutesToTime')(1085) === '18:05', g('minutesToTime')(1085));
check("timeToMinutes('18:05') === 1085", g('timeToMinutes')('18:05') === 1085);
check("formatDateLong('2026-12-08')", g('formatDateLong')('2026-12-08') === '8 de diciembre de 2026',
  g('formatDateLong')('2026-12-08'));
check('getService encuentra duracion',
  g('getService')('Combo Full Grooming (Corte + Barba + Cejas)').duration_max === 85);
check('getService null si no existe', g('getService')('No existe') === null);

console.log('\n[8] Coherencia de datos');
const flat = [];
BUSINESS_CONFIG.categories.forEach(c => c.services.forEach(s => flat.push(s)));
check('8 servicios', flat.length === 8, flat.length);
check('todos con duration_min/max',
  flat.every(s => typeof s.duration_min === 'number' && typeof s.duration_max === 'number'));
check('duration_min <= duration_max', flat.every(s => s.duration_min <= s.duration_max));
check('sin fechas de festivo duplicadas', new Set(holidays.map(h => h.date)).size === holidays.length);
check('todos los festivos tienen nombre', holidays.every(h => !!h.name));

console.log('\n[9] Opción A: seleccion rapida desde la tarjeta');
const cardA = makeEl('cardA');
const btnA = makeEl('btnA');
btnA.dataset.service = 'Corte Caballero Clásico / Fade';
cardA.querySelector = (sel) => (sel === '.choose-service' ? btnA : null);
const cardB = makeEl('cardB');
const btnB = makeEl('btnB');
btnB.dataset.service = 'Combo Full Grooming (Corte + Barba + Cejas)';
cardB.querySelector = (sel) => (sel === '.choose-service' ? btnB : null);
serviceCards.push(cardA, cardB);

const servSelect = documentStub.getElementById('servicio');
servSelect.value = '';
g('selectService')('Corte Caballero Clásico / Fade');
check('el select queda con el servicio elegido', servSelect.value === 'Corte Caballero Clásico / Fade', servSelect.value);
check('la tarjeta A queda resaltada', cardA.classList.contains('is-selected'));
check('la tarjeta B no queda resaltada', !cardB.classList.contains('is-selected'));
g('highlightSelectedCard')('Combo Full Grooming (Corte + Barba + Cejas)');
check('resaltado manual mueve la marca a la tarjeta B', cardB.classList.contains('is-selected') && !cardA.classList.contains('is-selected'));
g('highlightSelectedCard')('');
check('sin seleccion se quita el resaltado', !cardA.classList.contains('is-selected') && !cardB.classList.contains('is-selected'));
check('el boton de la tarjeta dice Agendar', /Agendar/.test(html), 'falta etiqueta Agendar');
check('el boton tiene aria-label descriptivo', /aria-label="Reservar este servicio:/.test(html));

console.log('\n[10] Opción B: badge de estado en tiempo real');
const now = g('getBusinessNow')();
check('fecha con formato YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(now.fecha), now.fecha);
check('hora con formato HH:MM', /^\d{2}:\d{2}$/.test(now.hora), now.hora);
const utc = new Date();
const expectedHour = (utc.getUTCHours() - 5 + 24) % 24;
check('hora de Bogota = UTC-5', parseInt(now.hora.slice(0, 2), 10) === expectedHour, { now: now.hora, expected: expectedHour });

const state = (fecha, hora) => g('getOpenState')({ fecha, hora });
let s = state('2026-12-24', '10:00');
check('jueves 10:00 -> abierta', s.isOpen === true && s.label === 'Abierta ahora', s);
check('detalle de cierre correcto', s.detail === 'Cierra a las 7:30 PM', s.detail);
s = state('2026-12-24', '08:00');
check('jueves 08:00 (apertura exacta) -> abierta', s.isOpen === true, s);
s = state('2026-12-24', '19:30');
check('jueves 19:30 (cierre exacto) -> cerrada', s.isOpen === false, s);
s = state('2026-12-24', '07:00');
check('jueves 07:00 -> cerrada con hora de apertura', s.isOpen === false && s.detail === 'Abre a las 8:00 AM', s);
s = state('2026-12-24', '20:00');
check('jueves 20:00 -> cerrada con hora de cierre', s.isOpen === false && s.detail === 'Cerró a las 7:30 PM', s);
s = state('2026-12-26', '12:00');
check('sabado 12:00 -> abierta (08:00-20:30)', s.isOpen === true && s.detail === 'Cierra a las 8:30 PM', s);
s = state('2026-12-27', '10:00');
check('domingo 10:00 -> abierta (09:00-16:00)', s.isOpen === true && s.detail === 'Cierra a las 4:00 PM', s);
s = state('2026-12-27', '08:00');
check('domingo 08:00 -> cerrada, abre 9:00 AM', s.isOpen === false && s.detail === 'Abre a las 9:00 AM', s);
s = state('2026-01-01', '10:00');
check('festivo -> cerrada por festivo', s.isOpen === false && /Año Nuevo/.test(s.detail), s);
s = state('2027-12-25', '10:00');
check('festivo 2027 -> cerrada por festivo', s.isOpen === false && /Navidad/.test(s.detail), s);

const badge = documentStub.getElementById('openStatus');
g('renderOpenStatus')();
check('el badge se renderiza', /Abierta ahora|Cerrada ahora/.test(documentStub.getElementById('openStatusLabel').textContent),
  documentStub.getElementById('openStatusLabel').textContent);
check('el badge aplica clase is-open o is-closed',
  badge.classList.contains('is-open') !== badge.classList.contains('is-closed'));

console.log('\n[11] Opción C: spinner y modal de resumen');
const submitBtn = documentStub.getElementById('submitBtn');
g('setSubmitLoading')(true);
check('boton deshabilitado durante el envio', submitBtn.disabled === true);
check('boton con clase is-loading', submitBtn.classList.contains('is-loading'));
check('aria-busy activo', submitBtn.getAttribute('aria-busy') === 'true');
check('etiqueta Enviando...', submitBtn.querySelector('.btn-label').textContent === 'Enviando...',
  submitBtn.querySelector('.btn-label').textContent);
g('setSubmitLoading')(false);
check('boton reactivado', submitBtn.disabled === false);
check('boton sin is-loading', !submitBtn.classList.contains('is-loading'));
check('etiqueta restaurada', submitBtn.querySelector('.btn-label').textContent === 'Confirmar Reserva');

const summaryEl = documentStub.getElementById('modalSummary');
g('showModal')('success', 'x', 'y', [
  { label: 'Servicio', value: 'Corte Caballero Clásico / Fade' },
  { label: 'Fecha', value: 'jueves 24 de diciembre de 2026' },
  { label: 'Hora', value: '10:00 AM' },
  { label: 'Teléfono', value: '3001234567' }
]);
check('el resumen se muestra', !summaryEl.classList.contains('hidden'));
check('el resumen contiene las 4 filas', (summaryEl.innerHTML.match(/modal-summary-row/g) || []).length === 4, summaryEl.innerHTML);
check('el resumen incluye el servicio', /Corte Caballero Clásico/.test(summaryEl.innerHTML));
g('showModal')('error', 'x', 'y');
check('sin resumen el bloque se oculta', summaryEl.classList.contains('hidden'));
check('formatDateWithWeekday', g('formatDateWithWeekday')('2026-12-24') === 'jueves 24 de diciembre de 2026',
  g('formatDateWithWeekday')('2026-12-24'));
check('el boton de envio tiene spinner en el HTML', /btn-spinner/.test(html));
check('el modal tiene bloque de resumen en el HTML', /id="modalSummary"/.test(html));
check('el badge existe en el HTML', /id="openStatus"/.test(html));

console.log('\n==============================');
console.log('PASS: ' + pass + '  FAIL: ' + fail);
console.log('==============================');
process.exit(fail === 0 ? 0 : 1);
