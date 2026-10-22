# AERIS — AI-Enabled Resilient Health Intelligence System

> **Privacy-Preserving Edge AI Companion for Early Health-Risk Awareness and Multi-Hazard Resilience**  
> **Team:** STRAW HATS  

AERIS is an affordable, edge-intelligent personal health companion designed for continuous biometric monitoring, early physiological risk awareness, and environmental hazard resilience. Operating under a strict **privacy-first Edge AI architecture**, AERIS processes sensitive health signals locally on-device without forced cloud telemetry uploads.

---

## 🎯 The Real Problem & Vision

Millions of vulnerable citizens across India—including elderly individuals living independently, outdoor gig workers, and residents of disaster-prone regions—face severe health risks such as heat exhaustion, cardiovascular strain, and unattended falls. During peak summer heatwaves or monsoon urban floods, these health threats multiply rapidly, precisely when power grids fail and cellular networks collapse, cutting off access to emergency medical assistance.

Existing smartwatches fail these critical real-world situations:
* **Isolated Metrics:** They track vitals in isolation without environmental context (e.g., ignoring a dangerous 43°C heat index or flood water).
* **Network Fragility:** They depend completely on active internet and cloud servers, becoming useless when cell towers go dark during a storm or disaster.
* **Prohibitive Cost & Privacy Issues:** Costing ₹3,000–₹35,000 and transmitting raw biometric data to remote servers, they present both economic barriers and serious data privacy risks.

**AERIS solves this** by fusing multi-modal physiological vitals, gait stability, and ambient climate hazards on an affordable (~₹1,200 BOM) ESP32 edge device, maintaining an offline LoRa emergency pathway that broadcasts distress signals over miles even during complete telecom blackouts.

---

## 🌟 Key Features

* **Privacy-Preserving Edge AI**: Local feature extraction, multi-modal risk scoring, and encrypted local storage (`LOCAL PROCESSING ENABLED`) compliant with India's DPDP Act 2023.
* **Multi-Modal Risk Engine**: Fuses physiological vitals, body temperature variance, motion gait symmetry, and climate hazards into a **0–100 AERIS Risk Index**.
* **Offline Disaster Resilience (LoRa)**: Dual-mode communication (Online BLE/Wi-Fi + Long-range LoRa 433/868 MHz) for instant distress broadcasts when cellular networks fail.
* **5 Core Prototype Hardware Sensors**:
  1. **MAX30102**: Pulse Oximeter & Heart Rate Sensor (Heart Rate, HRV, SpO₂)
  2. **MAX30205 / MLX90614**: Body & Skin Temperature Sensor
  3. **MPU6050**: 6-Axis Motion & Gait Accelerometer/Gyroscope (Steps, Cadence, Gait Symmetry %, Movement Variability %)
  4. **BME280**: Environmental Node (Ambient Temp, Relative Humidity, Barometric Pressure)
  5. **Rain Sensor**: Precipitation & Contact Moisture Node
* **GSR-Free Stress Estimation**: Calculates physiological stress using HRV (RMSSD), resting heart rate, activity levels, and personal baseline—strictly without GSR hardware dependencies.
* **Interactive Guided HRV Breathing**: Guided resonance breathing tool (Inhale 4s, Hold 4s, Exhale 6s) with visual expanding circle animation.
* **AERIS AI Companion (Powered by Gemini 3.6 Flash)**: Interactive context-aware assistant with real-time telemetry injection and explicit source provenance badging (`✨ Gemini 3.6 Flash API` vs. `⚡ Local Rule Engine`).
* **Real External Weather & Climate API**: Dual-engine weather API integration (**OpenWeatherMap API** & **Open-Meteo Free API**) with IP & browser geolocation.
* **Chrome Desktop Push Notifications**: Real-time native browser pop-up notifications when risk advisories trigger.
* **6 Reactive Demo Scenarios**: **NORMAL**, **STRESS**, **HEAT**, **TEMPERATURE ANOMALY**, **MOBILITY**, and **MONSOON**.
* **Strict Red + White + Yellow UI System**: Main Red (`#C62828`), Deep Red (`#8E0000`), White (`#FFFFFF`), and Yellow (`#FFC107`).
* **Non-Diagnostic Medical Safety**: Strict pattern-based risk language ("Elevated stress pattern", "Temperature anomaly", "Increased heat risk", "Mobility change", "Environmental risk").

---

## 📐 Architecture & Offline Communication Flow

```
[Sensors: MAX30102, MAX30205, MPU6050, BME280, Rain Sensor]
                         │
                         ▼
        [ESP32 Edge Microcontroller Core]
       (Local Noise Filtering & TinyML Baseline)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ONLINE PATHWAY]                  [OFFLINE DISASTER PATHWAY]
Bluetooth Low Energy / Wi-Fi       LoRa Radio (433/868 MHz)
        │                                 │
        ▼                                 ▼
[AERIS Web Dashboard Hub]          [Emergency Gateway / Siren]
(Multi-Modal 0-100 Risk Index)     (Direct Siren & Offline SOS)
        │
        ▼
[Gemini 3.6 Flash AI Companion]
```

---

## 🚦 Prototype Risk Index Thresholds

* **0 – 25 (Normal / Low Risk)**: All biometric and climate signals strictly within personal baseline.
* **26 – 50 (Monitor / Moderate Risk)**: Mild signal variation; continued passive edge tracking.
* **51 – 75 (Warning / Elevated Risk)**: Multi-signal strain detected; user advisory generated.
* **76 – 100 (High Risk / High Attention)**: Significant physiological or climate hazard anomaly; triggers 8-second confirmation escalation and emergency broadcast.

---

## 🏛️ National Policy & Standards Alignment

* **Ayushman Bharat Digital Mission (ABDM)**: Built adhering to Unified Health Interface (UHI) interoperability standards for wearable integration.
* **Digital Personal Data Protection (DPDP) Act, 2023**: Strict on-device edge processing and data minimization; zero raw biometric data uploads.
* **National Programme on Climate Change & Human Health (NPCCHH)**: Real-time surveillance protocols for extreme heatwave indices and climate-sensitive physiological risk.
* **NDMA & DoT Guidelines**: Adheres to Common Alerting Protocol (CAP) for rapid emergency notification.

---

## 🛠️ Tech Stack

* **Embedded Hardware**: ESP32 Dual-Core MCU, LoRa SX1278 transceiver, 5 physical sensor nodes, custom 3D CAD enclosure (`aeris_wearable_case.scad`)
* **Framework**: Next.js 16 (App Router & Turbopack)
* **Frontend**: React 19, TypeScript 5.7, Tailwind CSS 4
* **AI & LLM**: `@google/genai` (Google Gemini 3.6 Flash API) + Local TinyML baseline engine
* **Database & Auth**: Supabase (PostgreSQL with Row Level Security)
* **Weather & Hazard APIs**: OpenWeatherMap API & Open-Meteo Free API

---

## 🚀 Quick Start & Installation

### Prerequisites
* Node.js v18.0.0 or higher
* npm or pnpm

### Setup Commands

1. **Clone the repository**:
   ```bash
   git clone https://github.com/vimalesh07/aeris-resilient-health-system.git
   cd aeris-resilient-health-system
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
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
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

AERIS is an early health-risk awareness and environmental resilience companion. **AERIS is NOT a medical diagnosis system.** It does not diagnose medical conditions such as depression, dengue, malaria, fever, heat stroke, or arthritis. All output scores are prototype risk estimations designed to promote self-awareness and timely preventive recovery.
