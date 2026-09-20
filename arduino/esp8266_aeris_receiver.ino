#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ======================= CONFIG =======================
const char* WIFI_SSID     = "Vimal";
const char* WIFI_PASSWORD = "12345678";
const char* SERVER_URL    = "http://10.97.91.171:3000/api/telemetry";
const char* NOTIFY_URL    = "http://10.97.91.171:3000/api/notify";

// =================== HARDWARE PINS ====================
// Connect Pushbutton between D5 (GPIO 14) and GND (uses internal pullup)
#define BUTTON_PIN D5 

// Connect Buzzer (+) to D6 (GPIO 12) and (-) to GND
#define BUZZER_PIN D6 
// ======================================================

WiFiClient wifiClient;
HTTPClient http;

int    bpm          = 0;
int    spo2         = 0;
String healthStatus = "NO FINGER";
bool   hasNewData   = false;
unsigned long lastPost = 0;

String rxBuffer = "";

// ================= BUTTON & ALERT STATE ===============
int           pressCount       = 0;
unsigned long firstPressTime   = 0;
unsigned long lastDebounceTime = 0;
const unsigned long DEBOUNCE_DELAY = 50;   // 50ms button debounce
const unsigned long TRIPLE_PRESS_WINDOW = 1500; // Must press 3 times within 1.5s
int           lastButtonState  = HIGH;
int           buttonState      = HIGH;
// ======================================================

// Forward declarations
void parseAerisPacket(String pkt);
void sendTelemetry();
void checkButtonPress();
void playSteadyBuzzerHits();
void triggerTelegramAlertPush();

void setup() {
  // 1. Initialize Hardware Pins
  pinMode(BUTTON_PIN, INPUT_PULLUP); // Active LOW
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);     // Ensure silent on boot

  // 2. Use Hardware Serial RX at 115200 (Matches Arduino UNO Serial)
  Serial.begin(115200);
  delay(200);

  // 3. Connect to WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  // 4. Initial HTTP setup
  http.begin(wifiClient, SERVER_URL);
  http.setReuse(true);
  http.addHeader("Content-Type", "application/json");

  // Startup chirp (1 short beep)
  digitalWrite(BUZZER_PIN, HIGH);
  delay(60);
  digitalWrite(BUZZER_PIN, LOW);
}

void loop() {
  // 1. Read bytes from Arduino UNO (Unchanged Receiving Style)
  while (Serial.available() > 0) {
    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {
      rxBuffer.trim();

      // Only care about the packet starting with AERIS:
      if (rxBuffer.startsWith("AERIS:")) {
        parseAerisPacket(rxBuffer);
        hasNewData = true;
      }
      rxBuffer = "";
    } else {
      rxBuffer += c;
      // Safety guard against buffer overflow from IR floods
      if (rxBuffer.length() > 64) {
        rxBuffer = "";
      }
    }
  }

  // 2. Non-blocking Check for Pushbutton (3 presses detection)
  checkButtonPress();

  // 3. Transmit to Next.js API on new data or 500ms heartbeat (Unchanged)
  unsigned long now = millis();
  if (hasNewData || (now - lastPost > 500)) {
    sendTelemetry();
    lastPost = now;
    hasNewData = false;
  }

  // 4. Keep WiFi alive
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
  }
}

// ========================================================
// 1. UNCHANGED PACKET PARSER: AERIS:MEASURING,78,98
// ========================================================
void parseAerisPacket(String pkt) {
  String data = pkt.substring(6);
  data.trim();

  int firstComma  = data.indexOf(',');
  int secondComma = data.indexOf(',', firstComma + 1);

  if (firstComma > 0 && secondComma > firstComma) {
    healthStatus = data.substring(0, firstComma);
    bpm          = data.substring(firstComma + 1, secondComma).toInt();
    spo2         = data.substring(secondComma + 1).toInt();
  }
}

// ========================================================
// 2. UNCHANGED TELEMETRY STREAM
// ========================================================
void sendTelemetry() {
  if (WiFi.status() != WL_CONNECTED) return;

  String json = "{";
  json += "\"source\":\"esp8266_wifi\",";
  json += "\"bpm\":"    + String(bpm) + ",";
  json += "\"spo2\":"   + String(spo2) + ",";
  json += "\"status\":\"" + healthStatus + "\",";
  json += "\"sos\":false,";
  json += "\"timestamp\":" + String(millis());
  json += "}";

  http.POST(json);
}

// ========================================================
// 3. BUTTON MULTI-PRESS DETECTOR (3 PRESSES)
// ========================================================
void checkButtonPress() {
  int reading = digitalRead(BUTTON_PIN);

  // Debounce logic
  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
    if (reading != buttonState) {
      buttonState = reading;

      // Detect button press (Active LOW with INPUT_PULLUP)
      if (buttonState == LOW) {
        unsigned long currentMillis = millis();

        // If first press or window expired, reset timer
        if (pressCount == 0 || (currentMillis - firstPressTime > TRIPLE_PRESS_WINDOW)) {
          pressCount = 1;
          firstPressTime = currentMillis;
        } else {
          pressCount++;
        }

        // Check if 3 presses reached within window
        if (pressCount >= 3) {
          pressCount = 0; // Reset counter

          // Step 1: Buzzer slow and steady hits
          playSteadyBuzzerHits();

          // Step 2: Separate Telegram alert push
          triggerTelegramAlertPush();
        }
      }
    }
  }

  // Reset press count if window expired without 3rd press
  if (pressCount > 0 && (millis() - firstPressTime > TRIPLE_PRESS_WINDOW)) {
    pressCount = 0;
  }

  lastButtonState = reading;
}

// ========================================================
// 4. BUZZER SLOW AND STEADY HITS
// ========================================================
void playSteadyBuzzerHits() {
  // 3 steady, rhythmic alert hits
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(220); // Steady hit ON
    digitalWrite(BUZZER_PIN, LOW);
    delay(180); // Steady pause OFF
  }
}

// ========================================================
// 5. SEPARATE FUNCTION: TELEGRAM BOT ALERT PUSH
// ========================================================
void triggerTelegramAlertPush() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    return;
  }

  WiFiClient alertClient;
  HTTPClient alertHttp;

  // A. Post SOS trigger to AERIS Telemetry (triggers web dashboard HUD & alarm)
  alertHttp.begin(alertClient, SERVER_URL);
  alertHttp.addHeader("Content-Type", "application/json");

  String telemetrySosJson = "{";
  telemetrySosJson += "\"source\":\"esp8266_button_sos\",";
  telemetrySosJson += "\"bpm\":"    + String(bpm) + ",";
  telemetrySosJson += "\"spo2\":"   + String(spo2) + ",";
  telemetrySosJson += "\"status\":\"EMERGENCY_SOS\",";
  telemetrySosJson += "\"sos\":true,";
  telemetrySosJson += "\"timestamp\":" + String(millis());
  telemetrySosJson += "}";

  alertHttp.POST(telemetrySosJson);
  alertHttp.end();

  // B. Post direct SOS alert to Telegram Bot API (/api/notify)
  alertHttp.begin(alertClient, NOTIFY_URL);
  alertHttp.addHeader("Content-Type", "application/json");

  String notifyJson = "{";
  notifyJson += "\"type\":\"sos\",";
  notifyJson += "\"title\":\"🚨 ESP8266 Hardware SOS Button Activated\",";
  notifyJson += "\"trigger\":\"Physical pushbutton pressed 3 times on ESP8266 module\",";
  notifyJson += "\"severity\":\"Critical\",";
  notifyJson += "\"patientName\":\"Vimal\",";
  notifyJson += "\"phone\":\"9715042529\",";
  notifyJson += "\"location\":{\"lat\":10.903,\"lon\":76.955},";
  notifyJson += "\"vitals\":{";
  notifyJson += "\"heartRate\":" + String(bpm > 0 ? bpm : 76) + ",";
  notifyJson += "\"spo2\":"      + String(spo2 > 0 ? spo2 : 98) + ",";
  notifyJson += "\"bodyTemp\":36.8";
  notifyJson += "}";
  notifyJson += "}";

  alertHttp.POST(notifyJson);
  alertHttp.end();

  // Final quick confirmation chirp
  digitalWrite(BUZZER_PIN, HIGH);
  delay(90);
  digitalWrite(BUZZER_PIN, LOW);
}
