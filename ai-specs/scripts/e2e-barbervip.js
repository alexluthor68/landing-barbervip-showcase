#!/usr/bin/env node
// e2e-barbervip.js - Prueba end-to-end de la Landing Page en Chrome headless
//
// Levanta Chrome con el puerto de depuración remoto, carga la landing desde
// web-app/index.html y verifica en un navegador real:
//   - Opción A: clic en "Agendar" -> autoselección, resaltado y límites de hora
//   - Opción B: badge de estado (Abierta/Cerrada) renderizado
//   - Opción C: spinner de envío + modal de confirmación con resumen de la cita
//
// Uso: node ai-specs/scripts/e2e-barbervip.js
// Env:  CHROME_PATH=/ruta/a/chrome   (si el binario no está en una ruta estándar)

const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PAGE_PATH = path.join(REPO_ROOT, 'web-app', 'index.html');
const PROFILE_DIR = path.join(os.tmpdir(), 'barbervip-e2e-profile');
const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser'
].filter(Boolean);

function findBrowser() {
  const found = CHROME_CANDIDATES.find(candidate => fs.existsSync(candidate));
  if (!found) {
    throw new Error('No se encontro Chrome/Edge. Define CHROME_PATH con la ruta del ejecutable.');
  }
  return found;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getPageTarget(port) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
      const page = list.find(target => target.type === 'page' && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch (error) { /* el navegador aun no responde */ }
    await sleep(250);
  }
  throw new Error('No se pudo conectar con el navegador');
}

function createClient(ws) {
  let id = 0;
  const pending = new Map();

  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result);
    }
  });

  return (method, params) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    ws.send(JSON.stringify({ id: messageId, method, params: params || {} }));
  });
}

const PAGE_TEST = `(async () => {
  const out = {};
  const $ = id => document.getElementById(id);

  // --- Opción A: clic en "Agendar" de las tarjetas ---
  $('fecha').value = '2026-12-24';   // jueves 08:00 - 19:30
  $('fecha').dispatchEvent(new Event('change', { bubbles: true }));

  const card = document.querySelector('.service-card');
  card.querySelector('.choose-service').click();
  await new Promise(r => setTimeout(r, 100));
  out.servicioSeleccionado = $('servicio').value;
  out.tarjetaResaltada = card.classList.contains('is-selected');
  out.horaBoundsMax = $('hora').getAttribute('max');

  // Servicio de 85 min: el maximo debe adelantarse a 18:05 (cierre 19:30)
  const longCard = Array.from(document.querySelectorAll('.service-card'))
    .find(c => c.querySelector('.choose-service').dataset.service.indexOf('Full Grooming') !== -1);
  longCard.querySelector('.choose-service').click();
  await new Promise(r => setTimeout(r, 100));
  out.horaBoundsMaxLargo = $('hora').getAttribute('max');
  out.servicioSeleccionadoLargo = $('servicio').value;

  // Sin fecha no debe quedar ningun limite obsoleto
  $('fecha').value = '';
  $('fecha').dispatchEvent(new Event('change', { bubbles: true }));
  out.horaBoundsSinFecha = $('hora').getAttribute('max');

  // --- Opción B: badge de estado ---
  out.badgeLabel = $('openStatusLabel').textContent;
  out.badgeDetail = $('openStatusDetail').textContent;
  out.badgeOpen = $('openStatus').classList.contains('is-open');
  out.badgeClosed = $('openStatus').classList.contains('is-closed');

  // --- Opción C: envio con spinner y modal de resumen ---
  $('nombre').value = 'Juan Perez';
  $('telefono').value = '3001234567';
  $('fecha').value = '2026-12-24';
  $('hora').value = '10:00';
  $('servicio').value = 'Corte Caballero Clásico / Fade';

  let resolveFetch;
  window.fetch = () => new Promise(res => { resolveFetch = res; });
  $('bookingForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  await new Promise(r => setTimeout(r, 150));

  const btn = $('submitBtn');
  out.spinnerActivo = btn.classList.contains('is-loading');
  out.botonDeshabilitado = btn.disabled;
  out.etiquetaEnviando = btn.querySelector('.btn-label').textContent;
  out.ariaBusy = btn.getAttribute('aria-busy');
  out.spinnerVisible = getComputedStyle(btn.querySelector('.btn-spinner')).display !== 'none';

  resolveFetch({ ok: true, status: 200 });
  await new Promise(r => setTimeout(r, 400));

  out.modalVisible = !$('modal').classList.contains('hidden');
  out.modalTitulo = $('modalTitle').textContent;
  out.resumenVisible = !$('modalSummary').classList.contains('hidden');
  out.resumen = Array.from(document.querySelectorAll('.modal-summary-row'))
    .map(r => r.querySelector('dt').textContent + ': ' + r.querySelector('dd').textContent);
  out.botonRestaurado = !btn.disabled && !btn.classList.contains('is-loading');
  out.etiquetaRestaurada = btn.querySelector('.btn-label').textContent;
  out.formLimpiado = $('nombre').value === '';

  return JSON.stringify(out);
})()`;

(async () => {
  if (!fs.existsSync(PAGE_PATH)) {
    throw new Error('No se encontro la landing page en ' + PAGE_PATH);
  }

  const browser = findBrowser();
  const port = await getFreePort();
  const pageUrl = pathToFileURL(PAGE_PATH).href;

  console.log('Navegador: ' + browser);
  console.log('Pagina:    ' + pageUrl);

  fs.rmSync(PROFILE_DIR, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
  const child = spawn(browser, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--allow-file-access-from-files',
    '--remote-debugging-port=' + port,
    '--user-data-dir=' + PROFILE_DIR,
    pageUrl
  ], { stdio: 'ignore' });

  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    try { child.kill(); } catch (error) { /* ya termino */ }
    await sleep(700);
    try {
      fs.rmSync(PROFILE_DIR, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch (error) {
      console.warn('Aviso: no se pudo borrar el perfil temporal ' + PROFILE_DIR);
    }
  };

  let ws;
  try {
    const target = await getPageTarget(port);
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });

    const send = createClient(ws);
    await send('Runtime.enable');
    await sleep(800);

    const result = await send('Runtime.evaluate', {
      expression: PAGE_TEST,
      awaitPromise: true,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      throw new Error('Error en la pagina: ' + JSON.stringify(result.exceptionDetails));
    }

    const data = JSON.parse(result.result.value);
    let pass = 0;
    let fail = 0;
    const check = (name, cond, extra) => {
      if (cond) {
        pass++;
        console.log('  OK   ' + name);
      } else {
        fail++;
        console.log('  FAIL ' + name + (extra !== undefined ? ' -> ' + JSON.stringify(extra) : ''));
      }
    };

    console.log('\n[1] Opcion A: seleccion rapida desde la tarjeta');
    check('el clic autoselecciona el servicio',
      data.servicioSeleccionado === 'Corte Caballero Clásico / Fade', data.servicioSeleccionado);
    check('la tarjeta queda resaltada', data.tarjetaResaltada === true);
    check('los limites de hora se recalculan (60min -> 18:30)', data.horaBoundsMax === '18:30', data.horaBoundsMax);
    check('servicio de 85min -> max 18:05', data.horaBoundsMaxLargo === '18:05', data.horaBoundsMaxLargo);
    check('el servicio largo queda seleccionado',
      /Full Grooming/.test(data.servicioSeleccionadoLargo || ''), data.servicioSeleccionadoLargo);
    check('sin fecha se limpian los limites', data.horaBoundsSinFecha === null, data.horaBoundsSinFecha);

    console.log('\n[2] Opcion B: badge de estado en tiempo real');
    check('badge renderizado', /Abierta ahora|Cerrada ahora/.test(data.badgeLabel || ''), data.badgeLabel);
    check('badge con detalle', !!data.badgeDetail, data.badgeDetail);
    check('clase is-open o is-closed aplicada',
      data.badgeOpen !== data.badgeClosed, { open: data.badgeOpen, closed: data.badgeClosed });

    console.log('\n[3] Opcion C: spinner y modal de resumen');
    check('spinner activo durante el envio', data.spinnerActivo === true);
    check('spinner visible por CSS', data.spinnerVisible === true);
    check('boton deshabilitado', data.botonDeshabilitado === true);
    check('etiqueta Enviando...', data.etiquetaEnviando === 'Enviando...', data.etiquetaEnviando);
    check('aria-busy=true', data.ariaBusy === 'true');
    check('modal de confirmacion visible', data.modalVisible === true);
    check('titulo del modal', /Confirmada/.test(data.modalTitulo || ''), data.modalTitulo);
    check('resumen visible', data.resumenVisible === true);
    check('resumen con 4 filas', (data.resumen || []).length === 4, data.resumen);
    check('resumen con el servicio', /Corte Caballero/.test((data.resumen || []).join(' ')), data.resumen);
    check('resumen con la fecha', /diciembre de 2026/.test((data.resumen || []).join(' ')), data.resumen);
    check('resumen con la hora', /10:00 AM/.test((data.resumen || []).join(' ')), data.resumen);
    check('resumen con el telefono', /3001234567/.test((data.resumen || []).join(' ')), data.resumen);
    check('boton restaurado tras el envio', data.botonRestaurado === true);
    check('etiqueta restaurada', data.etiquetaRestaurada === 'Confirmar Reserva', data.etiquetaRestaurada);
    check('formulario limpiado', data.formLimpiado === true);

    console.log('\n==============================');
    console.log('PASS: ' + pass + '  FAIL: ' + fail);
    console.log('==============================');
    await cleanup();
    process.exit(fail === 0 ? 0 : 1);
  } catch (error) {
    console.error('Error E2E:', error.message);
    await cleanup();
    process.exit(1);
  } finally {
    if (ws) ws.close();
  }
})();
