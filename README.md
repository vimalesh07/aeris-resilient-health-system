# AERIS — AI-Enabled Resilient Health Intelligence System

> **Privacy-Preserving Edge AI Companion for Early Health-Risk Awareness and Multi-Hazard Resilience**

AERIS is a personal health companion designed for continuous biometric monitoring, early physiological risk awareness, and environmental hazard resilience. Operating under a strict **privacy-first Edge AI architecture**, AERIS processes sensitive health signals locally on-device without cloud telemetry uploads.

---

## 🌟 Key Features

* **Privacy-Preserving Edge AI**: Local feature extraction, multi-modal risk scoring, and encrypted local storage (`LOCAL PROCESSING ENABLED`).
* **Multi-Modal Risk Engine**: Fuses physiological vitals, body temperature variance, motion gait symmetry, and climate hazards into a **0–100 AERIS Risk Index**.
* **5 Core Prototype Hardware Sensors**:
  1. **MAX30102**: Pulse Oximeter & Heart Rate Sensor (Heart Rate, HRV, SpO₂)
  2. **MAX30205 / MLX90614**: Body & Skin Temperature Sensor
  3. **MPU6050**: 6-Axis Motion & Gait Accelerometer/Gyroscope (Steps, Cadence, Gait Symmetry %, Movement Variability %)
  4. **BME280**: Environmental Node (Ambient Temp, Relative Humidity, Barometric Pressure)
  5. **Rain Sensor**: Precipitation & Contact Moisture Node
* **GSR-Free Stress Estimation**: Calculates physiological stress using HRV, resting heart rate, activity levels, and personal baseline—strictly without GSR hardware dependencies.
* **Interactive Guided HRV Breathing**: Guided resonance breathing tool (Inhale 4s, Hold 4s, Exhale 6s) with visual expanding circle animation.
* **AERIS AI Companion (Powered by Gemini 3.6 Flash)**: Interactive context-aware chatbot with real-time telemetry injection and explicit source provenance badging (`✨ Gemini 3.6 Flash API` vs. `⚡ Local Rule Engine`).
* **Real External Weather & Climate API**: Dual-engine weather API integration (**OpenWeatherMap API** & **Open-Meteo Free API**) with IP & browser geolocation.
* **Chrome Desktop Push Notifications**: Real-time native browser pop-up notifications when risk advisories trigger.
* **6 Reactive Demo Scenarios**: **NORMAL**, **STRESS**, **HEAT**, **TEMPERATURE ANOMALY**, **MOBILITY**, and **MONSOON**.
* **Strict Red + White + Yellow UI System**: Main Red (`#C62828`), Deep Red (`#8E0000`), White (`#FFFFFF`), and Yellow (`#FFC107`).
* **Non-Diagnostic Medical Safety**: Strict pattern-based risk language ("Elevated stress pattern", "Temperature anomaly", "Increased heat risk", "Mobility change", "Environmental risk").

---

## 📐 Data Flow & Architecture

```
Sensors (MAX30102, MAX30205, MPU6050, BME280, Rain Sensor)
  ↓
ESP32 Low-Energy Microcontroller Node
  ↓
Bluetooth Low Energy (BLE Gateway)
  ↓
Smartphone / Edge Hub
  ↓
Signal Processing & Feature Extraction
  ↓
Personal Learned Baseline Comparison
  ↓
Edge AI Multi-Modal Fusion Engine
  ↓
Sub-Risk Scores (Physiological, Stress, Temp, Heat, Mobility, Environment)
  ↓
Overall AERIS Risk Score (0–100) & Early Warning Alerts
  ↓
AERIS Dashboard & Chrome Desktop Notifications
```

---

## 🚦 Prototype Risk Index Thresholds

* **0 – 25 (Normal / Low Risk)**: All biometric and climate signals strictly within personal baseline.
* **26 – 50 (Monitor / Moderate Risk)**: Mild signal variation; continued passive edge tracking.
* **51 – 75 (Warning / Elevated Risk)**: Multi-signal strain detected; user advisory generated.
* **76 – 100 (High Risk / High Attention)**: Significant physiological or climate hazard anomaly.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 16 (App Router & Turbopack)
* **Frontend**: React 19, TypeScript 5.7, Tailwind CSS 4
* **AI & LLM**: `@google/genai` (Google Gemini 3.6 Flash API)
* **Icons**: Lucide React
* **Weather APIs**: OpenWeatherMap API & Open-Meteo API
* **State Management**: Custom React Telemetry Provider & Context

---

## 🚀 Quick Start & Installation

### Prerequisites
* Node.js v18.0.0 or higher
* npm or pnpm

### Setup Commands

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/aeris-health-companion.git
   cd aeris-health-companion
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## 🛡️ Medical Disclaimer

AERIS is an early health-risk awareness and environmental resilience companion. **AERIS is NOT a medical diagnosis system.** It does not diagnose medical conditions such as depression, dengue, malaria, fever, heat stroke, or arthritis. All output scores are prototype risk estimations designed to promote self-awareness and recovery.
