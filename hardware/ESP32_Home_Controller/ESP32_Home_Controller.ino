#include "DHT.h"
#include "SPIFFS.h"
#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

#define LED_PIN 2
#define DHTPIN 4
#define DHTTYPE DHT11

#define TIME_BETWEEN_DHT_READINGS 10000

const char* ssid = "UNITEL NET CASA 2.4GHz_A886";
const char* password = "474frut4mba";

float temperature = 0;
float humidity = 0;
bool ledState = false;
unsigned long timeDelay = 0;

DHT dht(DHTPIN, DHTTYPE);
AsyncWebServer server(80);


//====================================================
// Conectar WiFi
//====================================================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("CONECTANDO A WIFI...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("CONECTADO A WIFI!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}


//====================================================
// Leitura do DHT11
//====================================================
void readSensors() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    humidity = h;
    temperature = t;
  }
}


//====================================================
// Rotas do servidor web
//====================================================
void serverHandlers() {

  // --- Ficheiros estáticos ---
  server.on("/login.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/login.css", "text/css");
  });
  server.on("/dashboard.css", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/dashboard.css", "text/css");
  });
  server.on("/dashboard.js", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/dashboard.js", "text/javascript");
  });
  server.on("/Arduino_DAYS2026_Logo.png", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/Arduino_DAYS2026_Logo.png", "image/png");
  });
  server.on("/Tecmicro-logo.png", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/Tecmicro-logo.png", "image/png");
  });

  // --- Páginas ---
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->redirect("/login");
  });
  server.on("/login", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/login.html", "text/html");
  });
  server.on("/dashboard", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send(SPIFFS, "/dashboard.html", "text/html");
  });

  // --- Autenticação ---
  server.on("/getin", HTTP_POST, [](AsyncWebServerRequest *request) {
    if (request->hasParam("username", true) && request->hasParam("password", true)) {
      String u = request->getParam("username", true)->value();
      String p = request->getParam("password", true)->value();
      if (u == "admin" && p == "admin1234") {
        request->redirect("/dashboard");
        return;
      }
    }
    request->redirect("/login");
  });

  // --- Dados dos sensores e estado do LED ---
  server.on("/dados", HTTP_GET, [](AsyncWebServerRequest *request) {
    String json =
      "{\"temp\":" + String(temperature, 1) +
      ",\"humidity\":" + String(humidity, 1) +
      ",\"ledState\":" + (ledState ? "true" : "false") + "}";
    request->send(200, "application/json", json);
  });

  // --- Controlo do LED ---
  server.on("/led/on", HTTP_GET, [](AsyncWebServerRequest *request) {
    digitalWrite(LED_PIN, HIGH);
    ledState = true;
    request->send(200, "application/json", "{\"status\":\"success\"}");
  });
  server.on("/led/off", HTTP_GET, [](AsyncWebServerRequest *request) {
    digitalWrite(LED_PIN, LOW);
    ledState = false;
    request->send(200, "application/json", "{\"status\":\"success\"}");
  });

  server.onNotFound([](AsyncWebServerRequest *request) {
    request->send(404, "text/plain", "Not found");
  });

  server.begin();
}


//====================================================
// Setup
//====================================================
void setup() {
  Serial.begin(115200);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  dht.begin();
  connectWiFi();

  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS Mount Failed!");
    return;
  }
  Serial.println("SPIFFS montado.");

  serverHandlers();

  // Set up mDNS responder:
  // - first argument is the domain name, in this example
  //   the fully-qualified domain name is "esp32.local"
  // - second argument is the IP address to advertise
  //   we send our IP address on the WiFi network
  if (!MDNS.begin("duinoai")) {
    Serial.println("Error setting up MDNS responder!");
    while (1) {
      delay(1000);
    }
  }
  Serial.println("mDNS responder started");

  // Add service to MDNS-SD
  MDNS.addService("http", "tcp", 80);

  Serial.println("Servidor Web do DUINO AI a correr.");
}


//====================================================
// Loop
//====================================================
void loop() {
  if (millis() - timeDelay > TIME_BETWEEN_DHT_READINGS) {
    readSensors();
    timeDelay = millis();
  }
}
