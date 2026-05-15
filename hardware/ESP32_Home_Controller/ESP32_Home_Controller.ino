/**
 * AUTOR...:  Erivelto Silva
 * PROJECTO:  Condomínio Inteligente — Controlo Residencial
 * MCU.....:  ESP32
 * DATA....:  09-05-2026
 *
 * Componentes por apartamento:
 *   Casa 1 — GPIO  2: Lâmpada (LED)
 *             GPIO  4: DHT11 (temperatura/humidade)
 *             GPIO 13: Sensor de Fogo (LOW activo)
 *             GPIO 15: Ar-Condicionado (cooler)
 *   Casa 2 — GPIO  5: Lâmpada (LED)
 *             GPIO 18: Ar-Condicionado (cooler)
 *             GPIO 19: DHT11 (temperatura/humidade)
 *   Casa 3 — GPIO 21: Lâmpada (LED)
 *             GPIO 22: Ar-Condicionado (cooler)
 *             GPIO 23: DHT11 (temperatura/humidade)
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
// CONFIGURAÇÃO — altere antes de carregar
// ============================================================
const char* ssid     = "UNITEL NET CASA 2.4GHz_A886";
const char* password = "474frut4mba";

#define LOGIN_USER "admin"
#define LOGIN_PASS "admin1234"

// ============================================================
// PINOS — CASA 1
// ============================================================
#define C1_LED_PIN    2
#define C1_DHT_PIN    4
#define C1_FIRE_PIN  13
#define C1_AC_PIN    15

// ============================================================
// PINOS — CASA 2
// ============================================================
#define C2_LED_PIN    5
#define C2_AC_PIN    18
#define C2_DHT_PIN   19

// ============================================================
// PINOS — CASA 3
// ============================================================
#define C3_LED_PIN   21
#define C3_AC_PIN    22
#define C3_DHT_PIN   23

#define DHTTYPE            DHT11
#define DHT_READ_INTERVAL  10000UL
#define FIRE_READ_INTERVAL  2000UL

// ============================================================
// INSTÂNCIAS
// ============================================================
DHT dht1(C1_DHT_PIN, DHTTYPE);
DHT dht2(C2_DHT_PIN, DHTTYPE);
DHT dht3(C3_DHT_PIN, DHTTYPE);

AsyncWebServer server(80);

// Estado — Casa 1
float temp1 = 0.0f, humid1 = 0.0f;
bool  ledCasa1 = false, acCasa1 = false, fireCasa1 = false;

// Estado — Casa 2
float temp2 = 0.0f, humid2 = 0.0f;
bool  ledCasa2 = false, acCasa2 = false;

// Estado — Casa 3
float temp3 = 0.0f, humid3 = 0.0f;
bool  ledCasa3 = false, acCasa3 = false;

unsigned long lastDhtRead  = 0;
unsigned long lastFireRead = 0;

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
// Sensores
// ============================================================
void readDHTs() {
  float h, t;

  h = dht1.readHumidity();  t = dht1.readTemperature();
  if (!isnan(h) && !isnan(t)) { humid1 = h; temp1 = t; }

  h = dht2.readHumidity();  t = dht2.readTemperature();
  if (!isnan(h) && !isnan(t)) { humid2 = h; temp2 = t; }

  h = dht3.readHumidity();  t = dht3.readTemperature();
  if (!isnan(h) && !isnan(t)) { humid3 = h; temp3 = t; }
}

// ============================================================
// Rotas HTTP
// ============================================================
void setupRoutes() {

  // Ficheiros estáticos
  server.on("/login.css",     HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/login.css",     "text/css");        });
  server.on("/dashboard.css", HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/dashboard.css", "text/css");        });
  server.on("/dashboard.js",  HTTP_GET, [](AsyncWebServerRequest* r) { r->send(SPIFFS, "/dashboard.js",  "text/javascript"); });

  // Páginas
  server.on("/", HTTP_GET, [](AsyncWebServerRequest* r) { r->redirect("/login"); });
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
    if (u == LOGIN_USER && p == LOGIN_PASS) r->redirect("/dashboard.html");
    else r->redirect("/login");
  });

  // ── Dados (JSON com os 3 apartamentos) ──
  server.on("/dados", HTTP_GET, [](AsyncWebServerRequest* r) {
    String j = "{";

    j += "\"casa1\":{";
    j += "\"temp\":"  + String(temp1,  1) + ",";
    j += "\"humid\":" + String(humid1, 1) + ",";
    j += "\"led\":"   + String(ledCasa1  ? "true" : "false") + ",";
    j += "\"ac\":"    + String(acCasa1   ? "true" : "false") + ",";
    j += "\"fire\":"  + String(fireCasa1 ? "true" : "false");
    j += "},";

    j += "\"casa2\":{";
    j += "\"temp\":"  + String(temp2,  1) + ",";
    j += "\"humid\":" + String(humid2, 1) + ",";
    j += "\"led\":"   + String(ledCasa2 ? "true" : "false") + ",";
    j += "\"ac\":"    + String(acCasa2  ? "true" : "false");
    j += "},";

    j += "\"casa3\":{";
    j += "\"temp\":"  + String(temp3,  1) + ",";
    j += "\"humid\":" + String(humid3, 1) + ",";
    j += "\"led\":"   + String(ledCasa3 ? "true" : "false") + ",";
    j += "\"ac\":"    + String(acCasa3  ? "true" : "false");
    j += "}";

    j += "}";
    r->send(200, "application/json", j);
  });

  // ── Lâmpadas ──
  server.on("/led/casa1/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa1 = true;  digitalWrite(C1_LED_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/casa1/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa1 = false; digitalWrite(C1_LED_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/casa2/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa2 = true;  digitalWrite(C2_LED_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/casa2/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa2 = false; digitalWrite(C2_LED_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/casa3/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa3 = true;  digitalWrite(C3_LED_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/led/casa3/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    ledCasa3 = false; digitalWrite(C3_LED_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
  });

  // ── Ar-Condicionado ──
  server.on("/ac/casa1/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa1 = true;  digitalWrite(C1_AC_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/ac/casa1/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa1 = false; digitalWrite(C1_AC_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/ac/casa2/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa2 = true;  digitalWrite(C2_AC_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/ac/casa2/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa2 = false; digitalWrite(C2_AC_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/ac/casa3/on",  HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa3 = true;  digitalWrite(C3_AC_PIN, HIGH); r->send(200, "application/json", "{\"ok\":true}");
  });
  server.on("/ac/casa3/off", HTTP_GET, [](AsyncWebServerRequest* r) {
    acCasa3 = false; digitalWrite(C3_AC_PIN, LOW);  r->send(200, "application/json", "{\"ok\":true}");
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

  // Saídas
  pinMode(C1_LED_PIN, OUTPUT); digitalWrite(C1_LED_PIN, LOW);
  pinMode(C1_AC_PIN,  OUTPUT); digitalWrite(C1_AC_PIN,  LOW);
  pinMode(C2_LED_PIN, OUTPUT); digitalWrite(C2_LED_PIN, LOW);
  pinMode(C2_AC_PIN,  OUTPUT); digitalWrite(C2_AC_PIN,  LOW);
  pinMode(C3_LED_PIN, OUTPUT); digitalWrite(C3_LED_PIN, LOW);
  pinMode(C3_AC_PIN,  OUTPUT); digitalWrite(C3_AC_PIN,  LOW);

  // Sensor de fogo (LOW activo — INPUT_PULLUP)
  pinMode(C1_FIRE_PIN, INPUT_PULLUP);

  dht1.begin();
  dht2.begin();
  dht3.begin();
  readDHTs();

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
  unsigned long now = millis();

  if ((unsigned long)(now - lastFireRead) >= FIRE_READ_INTERVAL) {
    lastFireRead = now;
    fireCasa1 = !digitalRead(C1_FIRE_PIN); // LOW activo
  }

  if ((unsigned long)(now - lastDhtRead) >= DHT_READ_INTERVAL) {
    lastDhtRead = now;
    readDHTs();
  }
}
