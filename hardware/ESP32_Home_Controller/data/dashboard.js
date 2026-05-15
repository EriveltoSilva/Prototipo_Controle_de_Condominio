const POLL_INTERVAL = 2000;

const statusDot   = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const footerIp    = document.getElementById('footerIp');
const statDevices = document.getElementById('statDevices');
const statFire    = document.getElementById('statFire');

// Local state mirror (prevents UI flicker between polls)
const state = {
  casa1: { led: false, ac: false, fire: false, temp: 0, humid: 0 },
  casa2: { led: false, ac: false,               temp: 0, humid: 0 },
  casa3: { led: false, ac: false,               temp: 0, humid: 0 },
};

// ============================================================
// Boot
// ============================================================
window.addEventListener('load', () => {
  receiveData();
  setInterval(receiveData, POLL_INTERVAL);
});

// ============================================================
// Accordion toggle
// ============================================================
function toggleHouse(houseId) {
  const body    = document.getElementById('body-' + houseId);
  const chevron = document.getElementById('chevron-' + houseId);
  const isOpen  = body.classList.contains('open');

  if (isOpen) {
    body.classList.remove('open');
    chevron.innerHTML = '&#9660;'; // ▼ collapsed
  } else {
    body.classList.add('open');
    chevron.innerHTML = '&#9650;'; // ▲ expanded
  }
}

// ============================================================
// Data polling
// ============================================================
function receiveData() {
  fetch('/dados')
    .then(r => r.json())
    .then(data => {
      setOnline(true);
      updateHouse(1, data.casa1);
      updateHouse(2, data.casa2);
      updateHouse(3, data.casa3);
      updateBuildingStats();
    })
    .catch(() => setOnline(false));
}

function clamp(v) { return Math.min(Math.max(v, 0), 100); }

function setOnline(online) {
  if (online) {
    statusDot.classList.add('online');
    statusLabel.textContent = 'Online';
    if (footerIp) footerIp.textContent = window.location.hostname;
  } else {
    statusDot.classList.remove('online');
    statusLabel.textContent = 'Sem ligação';
  }
}

// ============================================================
// House UI update
// ============================================================
function updateHouse(n, d) {
  const key = 'casa' + n;
  state[key].led  = d.led;
  state[key].ac   = d.ac;
  state[key].temp  = d.temp;
  state[key].humid = d.humid;

  const p = 'c' + n + '-';

  // Temperatura & humidade
  document.getElementById(p + 'temp').textContent  = d.temp.toFixed(1);
  document.getElementById(p + 'humid').textContent = d.humid.toFixed(1);
  document.getElementById(p + 'tempBar').style.width  = clamp((d.temp / 50) * 100) + '%';
  document.getElementById(p + 'humidBar').style.width = clamp(d.humid) + '%';

  // Lâmpada
  applyLedState(n, d.led);

  // Ar-condicionado
  applyAcState(n, d.ac);

  // Sensor de fogo (só casa 1)
  if (n === 1 && d.fire !== undefined) {
    state.casa1.fire = d.fire;
    applyFireState(d.fire);
  }

  // Badge de resumo no cabeçalho do apartamento
  updateHouseBadge(n);
}

function applyLedState(n, on) {
  const p   = 'c' + n + '-';
  const bulb  = document.getElementById(p + 'ledBulb');
  const glow  = document.getElementById(p + 'ledGlow');
  const badge = document.getElementById(p + 'ledBadge');
  const txt   = document.getElementById(p + 'ledState');
  const btn   = document.getElementById('btn-' + p + 'led');

  if (on) {
    bulb.classList.add('on');
    glow.classList.add('on');
    badge.textContent = 'ON';
    badge.className   = 'card-badge on';
    txt.textContent   = 'Ligado';
    txt.className     = 'led-state on';
    btn.innerHTML     = '&#9646; DESLIGAR';
    btn.className     = 'btn btn-danger';
  } else {
    bulb.classList.remove('on');
    glow.classList.remove('on');
    badge.textContent = 'OFF';
    badge.className   = 'card-badge';
    txt.textContent   = 'Desligado';
    txt.className     = 'led-state';
    btn.innerHTML     = '&#9654; LIGAR';
    btn.className     = 'btn btn-primary';
  }
}

function applyAcState(n, on) {
  const p     = 'c' + n + '-';
  const bulb  = document.getElementById(p + 'acBulb');
  const glow  = document.getElementById(p + 'acGlow');
  const badge = document.getElementById(p + 'acBadge');
  const txt   = document.getElementById(p + 'acState');
  const btn   = document.getElementById('btn-' + p + 'ac');

  if (on) {
    bulb.classList.add('on');
    glow.classList.add('on');
    badge.textContent = 'ON';
    badge.className   = 'card-badge ac-badge on';
    txt.textContent   = 'Ligado';
    txt.className     = 'led-state ac-on';
    btn.innerHTML     = '&#9646; DESLIGAR';
    btn.className     = 'btn btn-danger';
  } else {
    bulb.classList.remove('on');
    glow.classList.remove('on');
    badge.textContent = 'OFF';
    badge.className   = 'card-badge ac-badge';
    txt.textContent   = 'Desligado';
    txt.className     = 'led-state';
    btn.innerHTML     = '&#9654; LIGAR';
    btn.className     = 'btn btn-ac';
  }
}

function applyFireState(fire) {
  const card  = document.getElementById('c1-fireCard');
  const glow  = document.getElementById('c1-fireGlow');
  const badge = document.getElementById('c1-fireBadge');
  const icon  = document.getElementById('c1-fireIcon');
  const txt   = document.getElementById('c1-fireState');
  const hdr   = document.getElementById('hdr-casa1');

  if (fire) {
    card.style.borderColor = 'var(--danger)';
    glow.classList.add('alert');
    badge.textContent = 'ALERTA!';
    badge.className   = 'card-badge fire-alert';
    icon.className    = 'fire-icon alert';
    txt.textContent   = 'INCÊNDIO!';
    txt.className     = 'fire-state alert';
    hdr.classList.add('fire-alert');
  } else {
    card.style.borderColor = '';
    glow.classList.remove('alert');
    badge.textContent = 'SEGURO';
    badge.className   = 'card-badge fire-safe';
    icon.className    = 'fire-icon safe';
    txt.textContent   = 'Seguro';
    txt.className     = 'fire-state safe';
    hdr.classList.remove('fire-alert');
  }
}

function updateHouseBadge(n) {
  const key   = 'casa' + n;
  const badge = document.getElementById('badge-' + key);
  const s     = state[key];

  if (n === 1 && s.fire) {
    badge.textContent = 'FOGO!';
    badge.className   = 'house-badge fire-alert';
    return;
  }

  const on = (s.led ? 1 : 0) + (s.ac ? 1 : 0);
  if (on > 0) {
    badge.textContent = on + (on === 1 ? ' activo' : ' activos');
    badge.className   = 'house-badge active';
  } else {
    badge.textContent = 'Inactivo';
    badge.className   = 'house-badge';
  }
}

function updateBuildingStats() {
  const totalOn = ['casa1', 'casa2', 'casa3'].reduce((sum, k) => {
    const s = state[k];
    return sum + (s.led ? 1 : 0) + (s.ac ? 1 : 0);
  }, 0);

  statDevices.textContent = totalOn;

  if (state.casa1.fire) {
    statFire.textContent = 'ALERTA!';
    statFire.classList.add('alert');
  } else {
    statFire.textContent = 'OK';
    statFire.classList.remove('alert');
  }
}

// ============================================================
// Controls
// ============================================================
function toggleLed(n) {
  const on = state['casa' + n].led;
  fetch('/led/casa' + n + '/' + (on ? 'off' : 'on'))
    .then(() => receiveData())
    .catch(console.error);
}

function toggleAc(n) {
  const on = state['casa' + n].ac;
  fetch('/ac/casa' + n + '/' + (on ? 'off' : 'on'))
    .then(() => receiveData())
    .catch(console.error);
}
