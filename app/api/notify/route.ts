import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, trigger, severity, recommendedAction, vitals, location, phone = '9715042529', type } = body

    // Format Indian mobile number (+91)
    const cleanPhone = String(phone).replace(/\D/g, '')
    const tenDigitPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone
    const formattedPhone = `91${tenDigitPhone}`
    const fullPlusPhone = `+${formattedPhone}`

    const mapsUrl = location && location.lat ? `https://maps.google.com/?q=${location.lat},${location.lon}` : 'N/A'
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const patientName = body.patientName || 'Emergency Contact / User'
    const alertStatus = severity ? severity.toUpperCase() : 'CRITICAL'

    let messageText = ''
    if (type === 'obstacle') {
      messageText = `🚧 EMERGENCY OBSTACLE PUSH: AERIS RESILIENCE
Reporter: ${patientName}
Priority: HIGH (${title || 'Field Path Obstruction Reported'})
Trigger: ${trigger || 'Path obstacle / road blockage reported'}
- Heart Rate: ${vitals?.heartRate || '--'} BPM
- Blood Oxygen (SpO2): ${vitals?.spo2 || '--'}%
- Time: ${currentTime}
Action: ${recommendedAction || 'Clear path obstruction / dispatch alternate route'}
Live Location: ${mapsUrl}`
    } else if (type === 'food') {
      messageText = `🍲 EMERGENCY RELIEF REQUEST: AERIS RATION SUPPORT
Reporter: ${patientName}
Priority: HIGH (${title || 'Food & Nutrition Requirement Reported'})
Trigger: ${trigger || 'Emergency ration and potable water required'}
- Heart Rate: ${vitals?.heartRate || '--'} BPM
- Blood Oxygen (SpO2): ${vitals?.spo2 || '--'}%
- Time: ${currentTime}
Action: ${recommendedAction || 'Dispatch relief food pack & hydration supplies'}
Live Location: ${mapsUrl}`
    } else {
      messageText = `🚨 EMERGENCY HEALTH ALERT: AERIS SOS WATCH
Patient: ${patientName}
Status: ${alertStatus} (${title || 'Abnormal Vitals / SOS Detected'})
- Heart Rate: ${vitals?.heartRate || '--'} BPM
- Blood Oxygen (SpO2): ${vitals?.spo2 || '--'}%
- Time: ${currentTime}
Immediate medical assistance requested.
Live Location: ${mapsUrl}`
    }

    // Environment API Keys for Automated Telegram & SMS Dispatch
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8813634516:AAEwsWYyV3OkvVi4AnXDP3CDx_leBODecqM'
    const telegramChatId = process.env.TELEGRAM_CHAT_ID || '8827470925'
    const fast2smsKey = process.env.FAST2SMS_API_KEY

    let dispatchStatus = 'simulated'
    let telegramDelivered = false

    // Primary Automated Channel: Telegram Bot (@hacksporabot)
    if (telegramToken && telegramChatId) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        })

        const tgData = await tgRes.json()
        if (tgData.ok) {
          telegramDelivered = true
          dispatchStatus = 'sent (Telegram Bot @hacksporabot)'
        } else {
          console.warn('Telegram Bot API Response:', tgData)
          // Fallback to plain text if formatting error
          const retryRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: messageText,
            }),
          })
          const retryData = await retryRes.json()
          if (retryData.ok) {
            telegramDelivered = true
            dispatchStatus = 'sent (Telegram Bot @hacksporabot)'
          } else {
            dispatchStatus = `failed (Telegram: ${retryData.description || 'Check /start on @hacksporabot'})`
          }
        }
      } catch (tgErr: any) {
        console.warn('Telegram Dispatch Error:', tgErr?.message || tgErr)
        dispatchStatus = `failed (Telegram Network: ${tgErr?.message})`
      }
    }

    // Optional Secondary Channel: Fast2SMS API (India Gateway)
    if (fast2smsKey && !telegramDelivered) {
      try {
        const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'q',
            message: messageText,
            language: 'english',
            flash: 0,
            numbers: tenDigitPhone,
          }),
        })
        const smsData = await smsRes.json()
        if (smsData.return) dispatchStatus = 'sent (Fast2SMS)'
      } catch (e: any) {
        console.warn('Fast2SMS Error:', e?.message)
      }
    }

    if (dispatchStatus === 'simulated') {
      console.log('----------------------------------------------------')
      console.log('🤖 AERIS TELEGRAM BOT DISPATCH (@hacksporabot)')
      console.log('🔹 TARGET CHAT ID:', telegramChatId)
      console.log('🔹 STATUS:', dispatchStatus)
      console.log('🔹 MESSAGE:\n' + messageText)
      console.log('----------------------------------------------------')
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      targetRecipient: `@hacksporabot (Chat ID: ${telegramChatId})`,
      targetPhone: fullPlusPhone,
      smsStatus: dispatchStatus,
      dispatchStatus,
      telegramDelivered,
      channel: 'telegram',
      type: body.type || 'sos',
      messagePreview: messageText,
    })
  } catch (err: any) {
    console.error('API Notify Error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed to process notification push' }, { status: 500 })
  }
}
