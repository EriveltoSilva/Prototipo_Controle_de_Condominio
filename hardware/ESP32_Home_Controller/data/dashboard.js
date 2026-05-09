const DEEPSEEK_API_KEY = "sk-1e35f2add99443ee8f1c1c1318aa6e3d";
const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";
const MAX_HISTORY = 10;

const SYSTEM_PROMPT_BASE =
  "You are a smart assistant like Alexa built into an ESP32 device. " +
  "You control hardware and answer questions naturally. " +
  "If the user wants to turn ON the LED, respond ONLY with the exact text: LED_ON. " +
  "If the user wants to turn OFF the LED, respond ONLY with the exact text: LED_OFF. " +
  "You also have access to real-time sensor data from the environment. " +
  "If the user asks about temperature, humidity, weather conditions, or if it is hot/cold, " +
  "use the sensor data provided below to answer naturally. " +
  "Never invent sensor values. " +
  "For any other question, answer naturally and concisely. " +
  "Never explain what LED_ON or LED_OFF mean.";

// ---- DOM references ----
const temperatureSensor = document.getElementById("temperatureSensor");
const humiditySensor = document.getElementById("humiditySensor");
const tempBar = document.getElementById("tempBar");
const humidBar = document.getElementById("humidBar");
const ledBulb = document.getElementById("ledBulb");
const ledGlow = document.getElementById("ledGlow");
const ledBadge = document.getElementById("ledBadge");
const ledStateText = document.getElementById("ledStateText");
const btnLed = document.getElementById("btnLed");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const btnSend = document.getElementById("btnSend");
const aiStatus = document.getElementById("aiStatus");

let currentLedState = false;
let currentTemp     = 0;
let currentHumid    = 0;
let messageHistory  = [];  // rolling buffer of {role, content} pairs

function buildSystemPrompt() {
  return (
    SYSTEM_PROMPT_BASE +
    "\n\nCurrent sensor readings:" +
    "\n- Temperature: " +
    currentTemp.toFixed(2) +
    " °C" +
    "\n- Humidity: " +
    currentHumid.toFixed(2) +
    " %" +
    "\n- LED state: " +
    (currentLedState ? "ON" : "OFF")
  );
}

// ======================================================
// Data polling
// ======================================================
window.addEventListener("load", () => {
  receiveData();
  setInterval(receiveData, 2000);
});

function receiveData() {
  fetch("/dados")
    .then((resp) => resp.json())
    .then((data) => {
      currentTemp = data.temp;
      currentHumid = data.humidity;
      temperatureSensor.textContent = data.temp.toFixed(1);
      humiditySensor.textContent = data.humidity.toFixed(1);

      // progress bars: temp 0–50°C, humidity 0–100%
      tempBar.style.width = Math.min(Math.max((data.temp / 50) * 100, 0), 100) + "%";
      humidBar.style.width = Math.min(Math.max(data.humidity, 0), 100) + "%";

      currentLedState = data.ledState;
      updateLedUI();
    })
    .catch((err) => console.error("Erro ao buscar dados:", err));
}

function updateLedUI() {
  if (currentLedState) {
    btnLed.textContent = "&#9646; DESLIGAR";
    btnLed.innerHTML = "&#9646; DESLIGAR";
    btnLed.className = "btn btn-danger";
    ledBulb.classList.add("on");
    ledGlow.classList.add("on");
    ledBadge.textContent = "ON";
    ledBadge.className = "card-badge on";
    ledStateText.textContent = "Ligado";
    ledStateText.className = "led-state on";
  } else {
    btnLed.innerHTML = "&#9654; LIGAR";
    btnLed.className = "btn btn-primary";
    ledBulb.classList.remove("on");
    ledGlow.classList.remove("on");
    ledBadge.textContent = "OFF";
    ledBadge.className = "card-badge";
    ledStateText.textContent = "Desligado";
    ledStateText.className = "led-state";
  }
}

// ======================================================
// LED manual control
// ======================================================
btnLed.addEventListener("click", () => {
  const url = currentLedState ? "/led/off" : "/led/on";
  fetch(url)
    .then((resp) => resp.json())
    .then(() => receiveData())
    .catch((err) => console.error("Erro ao controlar LED:", err));
});

// ======================================================
// Chat helpers
// ======================================================
function addMessage(text, role) {
  const wrapper = document.createElement("div");
  wrapper.className = "message " + role;

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrapper;
}

function setBusy(busy) {
  btnSend.disabled = busy;
  chatInput.disabled = busy;
  aiStatus.textContent = busy ? "a pensar..." : "pronto para ajudar";
  aiStatus.className = busy ? "chat-subtitle busy" : "chat-subtitle";
}

// ======================================================
// Send message to DeepSeek
// ======================================================
btnSend.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendMessage();
});

function pushHistory(role, content) {
  messageHistory.push({ role, content });
  if (messageHistory.length > MAX_HISTORY) {
    messageHistory.splice(0, messageHistory.length - MAX_HISTORY);
  }
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = "";
  addMessage(text, "user");
  pushHistory("user", text);

  const thinking = addMessage("A pensar...", "thinking");
  setBusy(true);

  fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + DEEPSEEK_API_KEY,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        ...messageHistory,
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  })
    .then((resp) => resp.json())
    .then((data) => {
      thinking.remove();
      setBusy(false);

      const reply = data.choices[0].message.content.trim();
      pushHistory("assistant", reply);

      if (reply === "LED_ON") {
        fetch("/led/on")
          .then(() => receiveData())
          .catch(console.error);
        addMessage("LED ligado!", "bot");
      } else if (reply === "LED_OFF") {
        fetch("/led/off")
          .then(() => receiveData())
          .catch(console.error);
        addMessage("LED desligado!", "bot");
      } else {
        addMessage(reply, "bot");
      }
    })
    .catch((err) => {
      thinking.remove();
      setBusy(false);
      // remove the failed user message from history so it won't confuse future turns
      if (messageHistory.at(-1)?.role === "user") messageHistory.pop();
      addMessage("Erro ao contactar a IA. Verifique a sua chave API.", "bot");
      console.error("DeepSeek error:", err);
    });
}
