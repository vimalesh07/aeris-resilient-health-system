import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ReadlineParser } from '@serialport/parser-readline'
import { SerialPort } from 'serialport'
import { WebSocketServer } from 'ws'
import { ArduinoParser } from './arduinoParser.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env.local if present
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8')
  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=')
      if (key && values.length > 0) {
        process.env[key.trim()] = values.join('=').trim()
      }
    }
  })
}

const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM3'
const ARDUINO_BAUD = parseInt(process.env.ARDUINO_BAUD || '115200', 10)
const WEBSOCKET_PORT = parseInt(process.env.WEBSOCKET_PORT || '3001', 10)

console.log('====================================================')
console.log('  AERIS Hardware Serial Bridge (Arduino UNO + MAX30102)')
console.log('====================================================')
console.log(` Target COM Port : ${ARDUINO_PORT}`)
console.log(` Baud Rate       : ${ARDUINO_BAUD}`)
console.log(` WebSocket Port  : ${WEBSOCKET_PORT}`)
console.log('====================================================\n')

const parser = new ArduinoParser()

// 1. WebSocket Server Initialization
const wss = new WebSocketServer({ port: WEBSOCKET_PORT }, () => {
  console.log(`[WebSocket] Server broadcasting live telemetry at ws://localhost:${WEBSOCKET_PORT}`)
})

function broadcastState(state) {
  const payload = JSON.stringify({
    type: 'health_update',
    data: state,
  })

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(payload)
    }
  })
}

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client dashboard connected to live telemetry stream.')
  // Immediately send current state on connect
  ws.send(
    JSON.stringify({
      type: 'health_update',
      data: parser.getState(),
    })
  )

  ws.on('close', () => {
    console.log('[WebSocket] Client dashboard disconnected.')
  })
})

// 2. SerialPort Connection & Auto-Reconnect Engine
let serialPort = null
let readlineParser = null
let isConnecting = false
let lastReceivedTime = Date.now()

function connectSerial() {
  if (isConnecting) return
  isConnecting = true

  console.log(`[SerialPort] Attempting connection to ${ARDUINO_PORT} @ ${ARDUINO_BAUD} baud...`)

  try {
    serialPort = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: ARDUINO_BAUD,
      autoOpen: false,
    })

    readlineParser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }))

    serialPort.open((err) => {
      isConnecting = false
      if (err) {
        console.error(`[SerialPort Error] Failed to open ${ARDUINO_PORT}: ${err.message}`)
        console.log(`[Troubleshooting] Ensure Arduino UNO is plugged into USB on ${ARDUINO_PORT} and Arduino Serial Monitor is closed. Retrying in 3s...`)
        parser.setConnected(false)
        broadcastState(parser.getState())
        setTimeout(connectSerial, 3000)
        return
      }

      console.log(`[SerialPort Success] Connected to Arduino UNO on ${ARDUINO_PORT}!`)
      parser.setConnected(true)
      lastReceivedTime = Date.now()
      broadcastState(parser.getState())
    })

    readlineParser.on('data', (line) => {
      lastReceivedTime = Date.now()
      const updatedState = parser.parseLine(line)
      broadcastState(updatedState)
    })

    serialPort.on('error', (err) => {
      console.error(`[SerialPort Error] ${err.message}`)
      parser.setConnected(false)
      broadcastState(parser.getState())
    })

    serialPort.on('close', () => {
      console.log(`[SerialPort Closed] Connection to ${ARDUINO_PORT} dropped. Retrying in 3s...`)
      parser.setConnected(false)
      broadcastState(parser.getState())
      serialPort = null
      isConnecting = false
      setTimeout(connectSerial, 3000)
    })
  } catch (err) {
    isConnecting = false
    console.error(`[SerialPort Exception] ${err.message}`)
    parser.setConnected(false)
    broadcastState(parser.getState())
    setTimeout(connectSerial, 3000)
  }
}

// 3. Stale Telemetry Detector (5 second timeout)
setInterval(() => {
  if (parser.getState().connected && Date.now() - lastReceivedTime > 5000) {
    console.warn(`[Telemetry Timeout] No serial data received from ${ARDUINO_PORT} for 5s. Marking sensor data stale.`)
    parser.setConnected(false)
    broadcastState(parser.getState())
  }
}, 2500)

// Start serial port loop
connectSerial()
