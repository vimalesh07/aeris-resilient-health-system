#include <Wire.h>
#include "MAX30105.h"
#include "heartRate.h"
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <math.h>

// =====================================================
// OLED
// =====================================================
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_ADDR 0x3C

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// =====================================================
// MAX30102
// =====================================================
MAX30105 sensor;

// Adjust according to your IR readings
#define FINGER_THRESHOLD 1800

// =====================================================
// BPM SETTINGS
// =====================================================
#define BPM_HISTORY 6

int bpmValues[BPM_HISTORY];
byte bpmIndex = 0;
byte bpmCount = 0;

int stableBPM = 0;

unsigned long lastBeat = 0;

// =====================================================
// SpO2 SETTINGS
// =====================================================
#define SPO2_HISTORY 5

int spo2Values[SPO2_HISTORY];
byte spo2Index = 0;
byte spo2Count = 0;

int stableSpO2 = 0;

// =====================================================
// SpO2 SIGNAL TRACKING
// =====================================================
float redDC = 0;
float irDC = 0;

float redAC = 0;
float irAC = 0;

unsigned long lastSpO2Calc = 0;

// =====================================================
// FINGER STATE
// =====================================================
bool fingerDetected = false;
bool measuring = false;

byte fingerOnCounter = 0;
byte fingerOffCounter = 0;

unsigned long fingerStartTime = 0;

// =====================================================
// DISPLAY
// =====================================================
unsigned long lastDisplay = 0;

#define DISPLAY_INTERVAL 2000

// =====================================================
// NEW: SOS BUTTON + BUZZER
// =====================================================
#define SOS_BUTTON_PIN 7
#define BUZZER_PIN 8

bool sosTriggered = false;

// =====================================================
// TINYML EDGE AI: SIGNAL QUALITY (SQI) & ANOMALY
// =====================================================
int liveSQI = 0;               // 0-100% Signal Quality Index
String liveAnomaly = "NORMAL"; // NORMAL | TACHYCARDIA | BRADYCARDIA | HYPOXIA | MOTION_NOISE

int computeTinyML_SQI(float ac, float dc, unsigned long beatDelta)
{
  if (dc <= 100 || ac <= 0) return 0;
  
  // 1. Perfusion Index (PI): ideal AC/DC between 0.4% and 7.0%
  float pi = (ac / dc) * 100.0;
  int piScore = 0;
  if (pi >= 0.4 && pi <= 7.0) piScore = 50;
  else if (pi >= 0.15 && pi <= 12.0) piScore = 30;
  else piScore = 10;
  
  // 2. Beat Interval Regularity (physiological delta: 450ms - 1100ms)
  int rhythmScore = 0;
  if (beatDelta >= 450 && beatDelta <= 1100) rhythmScore = 50;
  else if (beatDelta >= 350 && beatDelta <= 1400) rhythmScore = 30;
  else rhythmScore = 10;
  
  return (piScore + rhythmScore);
}

String classifyTinyMLAnomaly(int bpm, int spo2, int sqi)
{
  if (sqi < 40) return "MOTION_NOISE";
  if (spo2 > 0 && spo2 < 92) return "HYPOXIA";
  if (bpm > 105) return "TACHYCARDIA";
  if (bpm > 0 && bpm < 50) return "BRADYCARDIA";
  return "NORMAL";
}

// =====================================================
// NEW: SOS BUZZER SEQUENCE
// =====================================================
void triggerSOS()
{
  Serial.println();
  Serial.println(F("=============================="));
  Serial.println(F(" SOS BUTTON PRESSED"));
  Serial.println(F(" STARTING ALERT SEQUENCE"));
  Serial.println(F("=============================="));

  // ---------------------------------------------------
  // 3 slow and steady buzzer hits
  // ---------------------------------------------------
  for (byte i = 0; i < 3; i++)
  {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(500);

    digitalWrite(BUZZER_PIN, LOW);
    delay(700);

    Serial.print(F("BUZZER HIT "));
    Serial.println(i + 1);
  }

  // ---------------------------------------------------
  // After third buzzer hit -> SOS starts
  // ---------------------------------------------------
  sosTriggered = true;

  Serial.println();
  Serial.println(F("=============================="));
  Serial.println(F(" SOS STARTED"));
  Serial.println(F("=============================="));
  Serial.println(F("AERIS:SOS_TRIGGERED,0,0,100,SOS"));
}

// =====================================================
// ADD BPM
// =====================================================
void addBPM(int bpm)
{
  if (bpm < 45 || bpm > 190)
    return;

  // Reject extreme sudden jumps
  if (stableBPM > 0)
  {
    if (abs(bpm - stableBPM) > 40)
      return;
  }

  bpmValues[bpmIndex] = bpm;

  bpmIndex++;

  if (bpmIndex >= BPM_HISTORY)
    bpmIndex = 0;

  if (bpmCount < BPM_HISTORY)
    bpmCount++;

  long total = 0;

  for (byte i = 0; i < bpmCount; i++)
  {
    total += bpmValues[i];
  }

  stableBPM = total / bpmCount;
}

// =====================================================
// ADD SPO2
// =====================================================
void addSpO2(int value)
{
  if (value < 90 || value > 100)
    return;

  if (stableSpO2 > 0)
  {
    if (abs(value - stableSpO2) > 5)
      return;
  }

  spo2Values[spo2Index] = value;

  spo2Index++;

  if (spo2Index >= SPO2_HISTORY)
    spo2Index = 0;

  if (spo2Count < SPO2_HISTORY)
    spo2Count++;

  long total = 0;

  for (byte i = 0; i < spo2Count; i++)
  {
    total += spo2Values[i];
  }

  stableSpO2 = total / spo2Count;
}

// =====================================================
// RESET
// =====================================================
void resetMeasurements()
{
  bpmIndex = 0;
  bpmCount = 0;

  spo2Index = 0;
  spo2Count = 0;

  stableBPM = 0;
  stableSpO2 = 0;

  lastBeat = 0;

  redDC = 0;
  irDC = 0;

  redAC = 0;
  irAC = 0;

  lastSpO2Calc = millis();

  for (byte i = 0; i < BPM_HISTORY; i++)
    bpmValues[i] = 0;

  for (byte i = 0; i < SPO2_HISTORY; i++)
    spo2Values[i] = 0;
}

// =====================================================
// FINGER DETECTION
// =====================================================
void updateFinger(long ir)
{
  // ---------------------------------------------------
  // Finger absent
  // ---------------------------------------------------
  if (!fingerDetected)
  {
    if (ir >= FINGER_THRESHOLD)
    {
      fingerOnCounter++;

      if (fingerOnCounter >= 5)
      {
        fingerDetected = true;

        fingerOnCounter = 0;
        fingerOffCounter = 0;

        fingerStartTime = millis();

        measuring = false;

        resetMeasurements();

        Serial.println();
        Serial.println(F("FINGER CONFIRMED"));
        Serial.print(F("IR = "));
        Serial.println(ir);
      }
    }
    else
    {
      fingerOnCounter = 0;
    }
  }

  // ---------------------------------------------------
  // Finger present
  // ---------------------------------------------------
  else
  {
    // Lower removal threshold prevents
    // temporary signal drops from removing finger.
    if (ir < 1400)
    {
      fingerOffCounter++;

      if (fingerOffCounter >= 25)
      {
        fingerDetected = false;

        fingerOnCounter = 0;
        fingerOffCounter = 0;

        measuring = false;

        resetMeasurements();

        Serial.println();
        Serial.println(F("FINGER REMOVED"));
      }
    }
    else
    {
      fingerOffCounter = 0;
    }
  }
}

// =====================================================
// BPM PROCESSING
// =====================================================
void processBPM(long ir)
{
  // SparkFun beat detection
  if (checkForBeat(ir))
  {
    unsigned long now = millis();

    Serial.println(F(">>> BEAT DETECTED <<<"));

    if (lastBeat > 0)
    {
      unsigned long delta = now - lastBeat;

      Serial.print(F("Beat interval = "));
      Serial.print(delta);
      Serial.println(F(" ms"));

      // 45 BPM to 190 BPM
      if (delta >= 315 && delta <= 1333)
      {
        int bpm = 60000 / delta;

        Serial.print(F("BPM = "));
        Serial.print(bpm);

        addBPM(bpm);

        Serial.print(F(" | Stable BPM = "));
        Serial.println(stableBPM);
      }
      else
      {
        Serial.println(F("Beat interval rejected"));
      }
    }

    lastBeat = now;
  }

  // Reset if no beat for 3 seconds
  if (lastBeat > 0 &&
      millis() - lastBeat > 3000)
  {
    lastBeat = 0;
  }
}

// =====================================================
// SpO2 PROCESSING
// =====================================================
void processSpO2(long red, long ir)
{
  // ---------------------------------------------------
  // DC tracking
  // ---------------------------------------------------
  if (irDC == 0)
  {
    irDC = ir;
    redDC = red;
  }
  else
  {
    irDC = irDC * 0.98 + ir * 0.02;
    redDC = redDC * 0.98 + red * 0.02;
  }

  // ---------------------------------------------------
  // AC component
  // ---------------------------------------------------
  float irDifference =
    abs((float)ir - irDC);

  float redDifference =
    abs((float)red - redDC);

  irAC =
    irAC * 0.95 +
    irDifference * 0.05;

  redAC =
    redAC * 0.95 +
    redDifference * 0.05;

  // ---------------------------------------------------
  // Calculate every 2.5 seconds
  // ---------------------------------------------------
  if (millis() - lastSpO2Calc < 2500)
    return;

  lastSpO2Calc = millis();

  // ---------------------------------------------------
  // Signal quality
  // ---------------------------------------------------
  if (irDC < 1000 ||
      redDC < 300 ||
      irAC < 1 ||
      redAC < 1)
  {
    Serial.println(F("SpO2 signal too weak"));
    return;
  }

  // ---------------------------------------------------
  // Ratio of ratios
  // ---------------------------------------------------
  float redNormalized =
    redAC / redDC;

  float irNormalized =
    irAC / irDC;

  if (irNormalized <= 0)
    return;

  float R =
    redNormalized / irNormalized;

  // ---------------------------------------------------
  // Prototype calibration
  // ---------------------------------------------------
  float calculatedSpO2 =
    110.0 - (25.0 * R);

  if (calculatedSpO2 > 100)
    calculatedSpO2 = 100;

  if (calculatedSpO2 < 90)
    calculatedSpO2 = 90;

  int value =
    (int)(calculatedSpO2 + 0.5);

  addSpO2(value);

  Serial.print(F("SpO2 sample = "));
  Serial.print(value);

  Serial.print(F("% | Stable = "));
  Serial.print(stableSpO2);

  Serial.print(F("% | R = "));
  Serial.println(R, 3);
}

// =====================================================
// OLED
// =====================================================
void updateOLED()
{
  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);

  // Header
  display.setTextSize(1);

  display.setCursor(20, 0);
  display.print(F("HEALTH WATCH"));

  display.drawLine(
    0,
    10,
    127,
    10,
    SSD1306_WHITE
  );

  // ---------------------------------------------------
  // Status
  // ---------------------------------------------------
  display.setCursor(0, 14);

  if (!fingerDetected)
  {
    display.print(F("STATUS: NO FINGER"));
  }
  else if (!measuring)
  {
    display.print(F("STATUS: STABILIZING"));
  }
  else
  {
    display.print(F("AI:"));
    display.print(liveAnomaly);
    display.print(F(" "));
    display.print(liveSQI);
    display.print(F("%"));
  }

  // ---------------------------------------------------
  // BPM
  // ---------------------------------------------------
  display.setTextSize(1);

  display.setCursor(0, 29);
  display.print(F("BPM:"));

  display.setTextSize(2);

  display.setCursor(42, 24);

  if (measuring && stableBPM > 0)
  {
    display.print(stableBPM);
  }
  else
  {
    display.print(F("--"));
  }

  // ---------------------------------------------------
  // SpO2
  // ---------------------------------------------------
  display.setTextSize(1);

  display.setCursor(0, 49);
  display.print(F("SpO2:"));

  display.setTextSize(2);

  display.setCursor(42, 44);

  if (measuring && stableSpO2 > 0)
  {
    display.print(stableSpO2);
    display.print(F("%"));
  }
  else
  {
    display.print(F("--"));
  }

  display.display();
}

// =====================================================
// SETUP
// =====================================================
void setup()
{
  Serial.begin(115200);

  Wire.begin();

  Wire.setClock(400000);

  Serial.println();
  Serial.println(F("=============================="));
  Serial.println(F(" MAX30102 HEALTH WATCH"));
  Serial.println(F("=============================="));

  // ===================================================
  // OLED
  // ===================================================

  Serial.println(F("Starting OLED..."));

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        OLED_ADDR))
  {
    Serial.println(F("OLED NOT FOUND"));

    while (1)
    {
      delay(1000);
    }
  }

  Serial.println(F("OLED FOUND"));

  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(1);

  display.setCursor(20, 10);
  display.println(F("MAX30102"));

  display.setCursor(20, 28);
  display.println(F("HEALTH WATCH"));

  display.setCursor(20, 46);
  display.println(F("STARTING..."));

  display.display();

  delay(1500);

  // ===================================================
  // MAX30102
  // ===================================================

  Serial.println(F("Starting MAX30102..."));

  if (!sensor.begin(
        Wire,
        I2C_SPEED_FAST))
  {
    Serial.println(F("MAX30102 NOT FOUND"));

    display.clearDisplay();

    display.setTextSize(1);

    display.setCursor(15, 25);
    display.println(F("MAX30102 ERROR"));

    display.display();

    while (1)
    {
      delay(1000);
    }
  }

  Serial.println(F("MAX30102 FOUND"));

  // ===================================================
  // SENSOR CONFIGURATION
  // ===================================================

  /*
       IMPORTANT:
       Average = 1 instead of 4.
       This gives the beat detector the
       individual waveform samples.
  */

  sensor.setup(
    0x7F,     // LED brightness
    1,        // SAMPLE AVERAGING = 1
    2,        // Red + IR
    100,      // Sample rate
    411,      // Pulse width
    16384     // ADC range
  );

  sensor.setPulseAmplitudeRed(0x7F);
  sensor.setPulseAmplitudeIR(0x7F);
  sensor.setPulseAmplitudeGreen(0);

  resetMeasurements();

  Serial.println(F("MAX30102 READY"));
  Serial.println();

  Serial.println(F("Place finger gently."));
  Serial.println(F("Keep finger still."));
  Serial.println(F("Waiting for signal..."));

  // ===================================================
  // NEW: SOS BUTTON + BUZZER
  // ===================================================

  pinMode(SOS_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);

  Serial.println(F("SOS BUTTON READY"));

  updateOLED();
}

// =====================================================
// LOOP
// =====================================================
void loop()
{
  // ===================================================
  // NEW: SOS BUTTON CHECK
  // ===================================================

  if (digitalRead(SOS_BUTTON_PIN) == LOW && !sosTriggered)
  {
    delay(50);

    if (digitalRead(SOS_BUTTON_PIN) == LOW)
    {
      triggerSOS();

      // Wait until button is released
      while (digitalRead(SOS_BUTTON_PIN) == LOW)
      {
        delay(10);
      }
    }
  }

  sensor.check();

  while (sensor.available())
  {
    long ir =
      sensor.getFIFOIR();

    long red =
      sensor.getFIFORed();

    // -------------------------------------------------
    // DEBUG IR
    // -------------------------------------------------

    Serial.print(F("IR = "));
    Serial.println(ir);

    // -------------------------------------------------
    // Finger detection
    // -------------------------------------------------

    updateFinger(ir);

    // -------------------------------------------------
    // No finger
    // -------------------------------------------------

    if (!fingerDetected)
    {
      sensor.nextSample();
      continue;
    }

    // -------------------------------------------------
    // Stabilization
    // -------------------------------------------------

    unsigned long elapsed =
      millis() - fingerStartTime;

    if (!measuring)
    {
      if (elapsed >= 8000)
      {
        measuring = true;

        resetMeasurements();

        Serial.println();
        Serial.println(F("=============================="));
        Serial.println(F(" SIGNAL STABLE"));
        Serial.println(F(" MEASUREMENT STARTED"));
        Serial.println(F("=============================="));
      }

      sensor.nextSample();
      continue;
    }

    // -------------------------------------------------
    // BPM
    // -------------------------------------------------

    processBPM(ir);

    // -------------------------------------------------
    // SpO2
    // -------------------------------------------------

    processSpO2(
      red,
      ir
    );

    sensor.nextSample();
  }

  // ===================================================
  // OLED + SERIAL UPDATE
  // ===================================================

  if (millis() - lastDisplay >= DISPLAY_INTERVAL)
  {
    lastDisplay = millis();

    if (fingerDetected && measuring)
    {
      liveSQI = computeTinyML_SQI(irAC, irDC, (lastBeat > 0 ? (millis() - lastBeat) : 800));
      liveAnomaly = classifyTinyMLAnomaly(stableBPM, stableSpO2, liveSQI);
    }
    else
    {
      liveSQI = 0;
      liveAnomaly = fingerDetected ? "STABILIZING" : "NO_FINGER";
    }

    updateOLED();

    Serial.println();
    Serial.println(F("------------------------------"));

    if (!fingerDetected)
    {
      Serial.println(F("STATUS : NO FINGER"));
      Serial.println(F("BPM    : --"));
      Serial.println(F("SpO2   : --"));
    }
    else if (!measuring)
    {
      unsigned long elapsed =
        millis() - fingerStartTime;

      int remaining =
        8 - (elapsed / 1000);

      if (remaining < 0)
        remaining = 0;

      Serial.println(F("STATUS : STABILIZING"));

      Serial.print(F("WAIT   : "));
      Serial.print(remaining);
      Serial.println(F(" sec"));

      Serial.println(F("BPM    : --"));
      Serial.println(F("SpO2   : --"));
    }
    else
    {
      Serial.println(F("STATUS : MEASURING"));

      Serial.print(F("BPM    : "));

      if (stableBPM > 0)
        Serial.println(stableBPM);
      else
        Serial.println(F("--"));

      Serial.print(F("SpO2   : "));

      if (stableSpO2 > 0)
      {
        Serial.print(stableSpO2);
        Serial.println(F("%"));
      }
      else
      {
        Serial.println(F("--"));
      }
    }

    Serial.println(F("------------------------------"));

    // Standardized AERIS Machine-Readable TinyML Telemetry Packet
    if (!fingerDetected)
    {
      Serial.println(F("AERIS:NO_FINGER,0,0,0,NO_FINGER"));
    }
    else if (!measuring)
    {
      Serial.println(F("AERIS:STABILIZING,0,0,50,STABILIZING"));
    }
    else
    {
      Serial.print(F("AERIS:MEASURING,"));
      Serial.print(stableBPM > 0 ? stableBPM : 0);
      Serial.print(F(","));
      Serial.print(stableSpO2 > 0 ? stableSpO2 : 0);
      Serial.print(F(","));
      Serial.print(liveSQI);
      Serial.print(F(","));
      Serial.println(liveAnomaly);
    }
  }
}

