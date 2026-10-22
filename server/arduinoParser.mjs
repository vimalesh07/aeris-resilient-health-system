/**
 * Robust Arduino MAX30102 Serial Line Parser
 * Handles any formatted or unformatted lines & key-value outputs from Arduino UNO over USB/Serial.
 */

export class ArduinoParser {
  constructor() {
    this.state = {
      status: 'DISCONNECTED', // 'MEASURING' | 'NO FINGER' | 'STABILIZING' | 'DISCONNECTED'
      bpm: null,
      spo2: null,
      ir: null,
      stableBpm: null,
      stableSpo2: null,
      r: null,
      sqi: null,
      anomaly: null,
      fingerDetected: false,
      connected: false,
      timestamp: Date.now(),
      lastRawLine: '',
      sosEvent: null,
    }
  }

  parseLine(rawLine) {
    if (!rawLine || typeof rawLine !== 'string') return this.state
    const line = rawLine.trim()
    if (!line) return this.state

    this.state.lastRawLine = line
    this.state.timestamp = Date.now()

    // 0. Handle Standard Machine-Readable AERIS TinyML Telemetry Packet
    // Format: AERIS:<STATUS>,<BPM>,<SpO2>,<SQI>,<ANOMALY>
    const aerisMatch = line.match(/^AERIS:([A-Za-z0-9_]+)(?:,(\d+),(\d+),(\d+),([A-Za-z0-9_]+))?/i)
    if (aerisMatch) {
      const statusToken = aerisMatch[1].toUpperCase()
      const rawBpm = aerisMatch[2] ? parseInt(aerisMatch[2], 10) : null
      const rawSpo2 = aerisMatch[3] ? parseInt(aerisMatch[3], 10) : null
      const rawSqi = aerisMatch[4] ? parseInt(aerisMatch[4], 10) : null
      const anomalyToken = aerisMatch[5] || null

      this.state.connected = true
      if (rawSqi !== null) this.state.sqi = rawSqi
      if (anomalyToken) this.state.anomaly = anomalyToken

      if (statusToken === 'SOS' || statusToken === 'SOS_TRIGGERED') {
        this.state.sosEvent = {
          type: 'SOS_TRIGGERED',
          source: 'PHYSICAL_BUTTON',
          device: 'AERIS_HEALTH_WATCH',
          timestamp: Date.now(),
        }
      } else if (statusToken === 'NO_FINGER') {
        this.state.status = 'NO FINGER'
        this.state.fingerDetected = false
        this.state.bpm = null
        this.state.spo2 = null
        this.state.stableBpm = null
        this.state.stableSpo2 = null
      } else if (statusToken === 'STABILIZING') {
        this.state.status = 'STABILIZING'
        this.state.fingerDetected = true
      } else if (statusToken === 'MEASURING') {
        this.state.status = 'MEASURING'
        this.state.fingerDetected = true
        if (rawBpm && rawBpm > 0) {
          this.state.bpm = rawBpm
          this.state.stableBpm = rawBpm
        }
        if (rawSpo2 && rawSpo2 > 0) {
          this.state.spo2 = rawSpo2
          this.state.stableSpo2 = rawSpo2
        }
      }
      return this.state
    }

    // 0b. Explicit Physical SOS Button Trigger Detection (Excludes startup logs like "SOS BUTTON READY")
    if (/(?:^|\s)SOS STARTED(?:$|\s)|(?:^|\s)SOS_TRIGGERED(?:$|\s)|(?:^|\s)SOS CONFIRMED(?:$|\s)/i.test(line) && !/READY/i.test(line)) {
      this.state.sosEvent = {
        type: 'SOS_TRIGGERED',
        source: 'PHYSICAL_BUTTON',
        device: 'AERIS_HEALTH_WATCH',
        timestamp: Date.now(),
      }
      this.state.connected = true
    }

    // 1. Explicit Status Checks
    if (/STATUS\s*:\s*MEASURING|MEASURING/i.test(line) && !/NO\s*FINGER/i.test(line)) {
      this.state.status = 'MEASURING'
      this.state.fingerDetected = true
      this.state.connected = true
    } else if (/STATUS\s*:\s*NO\s*FINGER|NO\s*FINGER/i.test(line)) {
      this.state.status = 'NO FINGER'
      this.state.fingerDetected = false
      this.state.bpm = null
      this.state.spo2 = null
      this.state.stableBpm = null
      this.state.stableSpo2 = null
      this.state.connected = true
    } else if (/STATUS\s*:\s*STABILIZING|STABILIZING/i.test(line)) {
      this.state.status = 'STABILIZING'
      this.state.fingerDetected = true
      this.state.connected = true
    }

    // 2. No Finger / Empty Indicators
    if (/(?:BPM|SpO2|SpO₂)\s*[:=]?\s*--/i.test(line)) {
      if (/BPM/i.test(line)) {
        this.state.bpm = null
        this.state.stableBpm = null
      }
      if (/SpO2|SpO₂/i.test(line)) {
        this.state.spo2 = null
        this.state.stableSpo2 = null
      }
    }

    // 3. Extract BPM (e.g., "BPM : 76", "BPM = 76", "BPM: 76", "Stable BPM = 76", "Heart Rate: 76")
    const stableBpmMatch = line.match(/Stable\s*BPM\s*[:=]?\s*(\d+)/i)
    if (stableBpmMatch) {
      const num = parseInt(stableBpmMatch[1], 10)
      if (!isNaN(num) && num > 0) {
        this.state.stableBpm = num
        this.state.bpm = num
        this.state.fingerDetected = true
        this.state.connected = true
      }
    }

    const bpmMatch = line.match(/(?:BPM|Heart\s*Rate|HR)\s*[:=]?\s*(\d+)/i)
    if (bpmMatch) {
      const num = parseInt(bpmMatch[1], 10)
      if (!isNaN(num) && num > 0) {
        this.state.bpm = num
        if (!this.state.stableBpm) this.state.stableBpm = num
        this.state.fingerDetected = true
        this.state.connected = true
      }
    }

    // 4. Extract SpO2 (e.g., "SpO2 : 90%", "SpO2 = 90%", "SpO2: 90", "Stable = 90%", "SpO2 sample = 90%")
    const stableSpo2Match = line.match(/Stable\s*[:=]?\s*(\d+)%?/i)
    if (stableSpo2Match && !/BPM/i.test(line)) {
      const num = parseInt(stableSpo2Match[1], 10)
      if (!isNaN(num) && num > 0) {
        this.state.stableSpo2 = num
        this.state.spo2 = num
        this.state.connected = true
      }
    }

    const spo2Match = line.match(/(?:SpO2|SpO₂|O2|Oxygen)\s*(?:sample)?\s*[:=]?\s*(\d+)%?/i)
    if (spo2Match) {
      const num = parseInt(spo2Match[1], 10)
      if (!isNaN(num) && num > 0) {
        this.state.spo2 = num
        if (!this.state.stableSpo2) this.state.stableSpo2 = num
        this.state.connected = true
      }
    }

    // 5. Extract IR & R values
    const irMatch = line.match(/IR\s*[:=]?\s*(\d+)/i)
    if (irMatch) {
      this.state.ir = parseInt(irMatch[1], 10)
      this.state.connected = true
    }

    const rMatch = line.match(/R\s*[:=]?\s*([\d.]+)/i)
    if (rMatch) {
      this.state.r = parseFloat(rMatch[1])
    }

    if (/BEAT\s*DETECTED/i.test(line)) {
      this.state.fingerDetected = true
      this.state.connected = true
    }

    // Automatic Status Inference if serial data has valid readings
    if (this.state.connected && (this.state.bpm > 0 || this.state.spo2 > 0)) {
      if (this.state.status === 'DISCONNECTED' || this.state.status === 'NO FINGER') {
        this.state.status = 'MEASURING'
      }
      this.state.fingerDetected = true
    }

    return this.state
  }

  setConnected(connected) {
    this.state.connected = connected
    if (!connected) {
      this.state.status = 'DISCONNECTED'
      this.state.fingerDetected = false
      this.state.bpm = null
      this.state.spo2 = null
      this.state.stableBpm = null
      this.state.stableSpo2 = null
      this.state.sqi = null
      this.state.anomaly = null
    }
  }

  /**
   * Returns the current sosEvent and immediately clears it so it is
   * only consumed once. This prevents stale SOS events from being
   * re-broadcast on every subsequent health_update frame.
   */
  consumeSosEvent() {
    const event = this.state.sosEvent
    this.state.sosEvent = null
    return event
  }

  getState() {
    // Never include sosEvent in health_update snapshots — SOS is
    // delivered as a separate one-shot message via consumeSosEvent().
    const { sosEvent, ...cleanState } = this.state
    return { ...cleanState }
  }
}
