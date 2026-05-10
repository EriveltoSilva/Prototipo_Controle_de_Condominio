const POLL_INTERVAL = 2000;

// ---- DOM references ----
const temperatureSensor = document.getElementById('temperatureSensor');
const humiditySensor    = document.getElementById('humiditySensor');
const tempBar           = document.getElementById('tempBar');
const humidBar          = document.getElementById('humidBar');

const salaBulb      = document.getElementById('salaBulb');
const salaGlow      = document.getElementById('salaGlow');
const salaBadge     = document.getElementById('salaBadge');
const salaStateText = document.getElementById('salaStateText');
const btnSala       = document.getElementById('btnSala');

const quartoBulb      = document.getElementById('quartoBulb');
const quartoGlow      = document.getElementById('quartoGlow');
const quartoBadge     = document.getElementById('quartoBadge');
const quartoStateText = document.getElementById('quartoStateText');
const btnQuarto       = document.getElementById('btnQuarto');

const statusDot   = document.getElementById('statusDot');
const statusLabel = document.getElementById('statusLabel');
const footerIp    = document.getElementById('footerIp');

let ledSala   = false;
let ledQuarto = false;

// ============================================================
// Data polling
// ============================================================
window.addEventListener('load', () => {
  receiveData();
  setInterval(receiveData, POLL_INTERVAL);
});

function receiveData() {
  fetch('/dados')
    .then(resp => resp.json())
    .then(data => {
      setOnline(true);

      temperatureSensor.textContent = data.temp.toFixed(1);
      humiditySensor.textContent    = data.humidity.toFixed(1);

      tempBar.style.width  = clamp((data.temp / 50) * 100) + '%';
      humidBar.style.width = clamp(data.humidity) + '%';

      ledSala   = data.ledSala;
      ledQuarto = data.ledQuarto;

      updateLedUI('sala',   ledSala);
      updateLedUI('quarto', ledQuarto);
    })
    .catch(() => setOnline(false));
}

function clamp(v) { return Math.min(Math.max(v, 0), 100); }

function setOnline(online) {
  if (online) {
    statusDot.classList.add('online');
    statusLabel.textContent = 'Online';
    footerIp.textContent    = window.location.hostname;
  } else {
    statusDot.classList.remove('online');
    statusLabel.textContent = 'Sem ligacao';
  }
}

// ============================================================
// LED UI helper
// ============================================================
function updateLedUI(room, state) {
  const bulb      = room === 'sala' ? salaBulb      : quartoBulb;
  const glow      = room === 'sala' ? salaGlow      : quartoGlow;
  const badge     = room === 'sala' ? salaBadge     : quartoBadge;
  const stateText = room === 'sala' ? salaStateText : quartoStateText;
  const btn       = room === 'sala' ? btnSala       : btnQuarto;

  if (state) {
    bulb.classList.add('on');
    glow.classList.add('on');
    badge.textContent    = 'ON';
    badge.className      = 'card-badge on';
    stateText.textContent = 'Ligado';
    stateText.className  = 'led-state on';
    btn.innerHTML        = '&#9646; DESLIGAR';
    btn.className        = 'btn btn-danger';
  } else {
    bulb.classList.remove('on');
    glow.classList.remove('on');
    badge.textContent    = 'OFF';
    badge.className      = 'card-badge';
    stateText.textContent = 'Desligado';
    stateText.className  = 'led-state';
    btn.innerHTML        = '&#9654; LIGAR';
    btn.className        = 'btn btn-primary';
  }
}

// ============================================================
// LED controls
// ============================================================
btnSala.addEventListener('click', () => {
  const url = ledSala ? '/led/sala/off' : '/led/sala/on';
  fetch(url).then(() => receiveData()).catch(console.error);
});

btnQuarto.addEventListener('click', () => {
  const url = ledQuarto ? '/led/quarto/off' : '/led/quarto/on';
  fetch(url).then(() => receiveData()).catch(console.error);
});
