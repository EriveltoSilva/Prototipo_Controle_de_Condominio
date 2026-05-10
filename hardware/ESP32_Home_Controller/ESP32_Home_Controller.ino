/**
 * AUTOR...:  Erivelto Silva
 * PROJECTO:  Casa Inteligente — Controlo Residencial
 * MCU.....:  ESP32
 * DATA....:  09-05-2026
 *
 * Componentes:
 *   - DHT11       — temperatura e humidade (GPIO 4)
 *   - LED Sala    — luz da sala de estar   (GPIO 2)
 *   - LED Quarto  — luz do quarto          (GPIO 5)
 *
 * Aceder via browser:
 *   http://casainteligente.local   (mDNS)
 *   http://<IP_DO_ESP32>
 *   Login: admin / admin1234
 *
 * Bibliotecas necessarias (Library Manager):
 *   - DHT sensor library (Adafruit)
 *   - ESPAsyncWebServer (me-no-dev)
 *   - AsyncTCP (me-no-dev)
 */

#include "DHT.h"
#include "SPIFFS.h"
#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

// ============================================================
// CONFIGURACAO — altere antes de carregar
// ============================================================
const char* ssid = "UNITEL NET CASA 2.4GHz_A886";
const char* password = "474frut4mba";

#define LOGIN_USER "admin"
#define LOGIN_PASS "admin1234"

// ============================================================
// PINOS
// ============================================================
#define DHTPIN      4
#define DHTTYPE     DHT11
#define LED_SALA    2
#define LED_QUARTO  5

#define DHT_READ_INTERVAL 10000UL

// ============================================================
// INSTANCIAS
// ============================================================
DHT dht(DHTPIN, DHTTYPE);
AsyncWebServer server(80);

float temperature    = 0.0f;
float humidity       = 0.0f;
bool  ledSalaState   = false;
bool  ledQuartoState = false;
unsigned long lastDhtRead = 0;

// ============================================================
// Wi-Fi
// ============================================================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("A ligar ao Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ============================================================
// DHT11
// ============================================================
void readSensors() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    humidity    = h;
    temperature = t;
  }
}

// ============================================================
// Rotas HTTP
// ============================================================
void setupRoutes() {

  // Ficheiros estaticos
  server.on("/login.css",     HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/login.css",     "text/css");        });
  server.on("/dashboard.css", HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/dashboard.css", "text/css");        });
  server.on("/dashboard.js",  HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/dashboard.js",  "text/javascript"); });

  // Paginas
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* r) {
    r->redirect("/login");
  });
  server.on("/login", HTTP_GET, [](AsyncWebServerRequest* r) {
    r->send(SPIFFS, "/login.html", "text/html");
  });
  server.on("/dashboard.html", HTTP_GET, [](AsyncWebServerRequest* r) {
    r->send(SPIFFS, "/dashboard.html", "text/html");
  });

  // Login
  server.on("/getin", HTTP_POST, [](AsyncWebServerRequest* r) {
    String u = r->hasParam("username", true) ? r->getParam("username", true)->value() : "";
    String p = r->hasParam("password", true) ? r->getParam("password", true)->value() : "";
    if (u == LOGIN_USER && p == LOGIN_PASS) {
      r->redirect("/dashboard.html");
    } else {
      r->redirect("/login");
    }
  });

  // Dados dos sensores + estado dos LEDs
  server.on("/dados", HTTP_GET, [](AsyncWebServerRequest* r) {
    String json = "{";
    json += "\"temp\":"      + String(temperature, 1) + ",";
    json += "\"humidity\":"  + String(humidity, 1)    + ",";
    json += "\"ledSala\":"   + String(ledSalaState   ? "true" : "false") + ",";
    json += "\"ledQuarto\":" + String(ledQuartoState ? "true" : "false");
    json += "}";
    r->send(200, "application/json", json);
  });

  // LED Sala
  server.on("/led/sala/on", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledSalaState = true;
    digitalWrite(LED_SALA, HIGH);
    r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/sala/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledSalaState = false;
    digitalWrite(LED_SALA, LOW);
    r->send(200, "application/json", "{\"ok\":true}");
  });

  // LED Quarto
  server.on("/led/quarto/on", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledQuartoState = true;
    digitalWrite(LED_QUARTO, HIGH);
    r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/quarto/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledQuartoState = false;
    digitalWrite(LED_QUARTO, LOW);
    r->send(200, "application/json", "{\"ok\":true}");
  });

  server.onNotFound([](AsyncWebServerRequest* r) {
    r->send(404, "text/plain", "Not found");
  });

  server.begin();
}

// ============================================================
// Setup
// ============================================================
void setup() {
  Serial.begin(115200);

  pinMode(LED_SALA,   OUTPUT); digitalWrite(LED_SALA,   LOW);
  pinMode(LED_QUARTO, OUTPUT); digitalWrite(LED_QUARTO, LOW);

  dht.begin();
  readSensors();

  connectWiFi();

  if (!SPIFFS.begin(true)) {
    Serial.println("Erro: SPIFFS nao montado");
    return;
  }
  Serial.println("SPIFFS montado.");

  if (MDNS.begin("casainteligente")) {
    MDNS.addService("http", "tcp", 80);
    Serial.println("mDNS: http://casainteligente.local");
  }

  setupRoutes();
  Serial.println("Servidor iniciado.");
}

// ============================================================
// Loop
// ============================================================
void loop() {
  if ((unsigned long)(millis() - lastDhtRead) >= DHT_READ_INTERVAL) {
    lastDhtRead = millis();
    readSensors();
  }
}
