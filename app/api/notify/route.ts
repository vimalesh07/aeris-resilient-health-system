import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { title, trigger, severity, recommendedAction, vitals, location, phone = '7092796084' } = body

    // Format Indian mobile number (+91)
    const cleanPhone = String(phone).replace(/\D/g, '')
    const tenDigitPhone = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone
    const formattedPhone = `91${tenDigitPhone}`
    const fullPlusPhone = `+${formattedPhone}`

    const mapsUrl = location && location.lat ? `https://maps.google.com/?q=${location.lat},${location.lon}` : 'N/A'

    const messageText = `🚨 AERIS ${severity ? severity.toUpperCase() : 'HEALTH'} ALERT
Title: ${title || 'Emergency Threshold Exceeded'}
Details: ${trigger || 'Physiological vital anomaly detected'}
Vitals: HR ${vitals?.heartRate || '--'} BPM | SpO2 ${vitals?.spo2 || '--'}% | Temp ${vitals?.bodyTemp || '--'}°C
Action: ${recommendedAction || 'Monitor vitals and seek medical attention if symptoms persist.'}
Location: ${mapsUrl}`

    // Environment API Keys for Automated Background SMS Dispatch
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER
    const fast2smsKey = process.env.FAST2SMS_API_KEY

    let smsStatus = 'simulated'

    // Option A: Fast2SMS API (High-speed India +91 Automated SMS)
    if (fast2smsKey) {
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
        if (smsData.return) smsStatus = 'sent (Fast2SMS)'
      } catch (e: any) {
        console.warn('Fast2SMS Error:', e?.message)
      }
    }

    // Option B: Twilio REST API (Global Automated SMS)
    if (accountSid && authToken && smsStatus === 'simulated') {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
        const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

        if (twilioPhone) {
          const smsParams = new URLSearchParams()
          smsParams.append('To', fullPlusPhone)
          smsParams.append('From', twilioPhone)
          smsParams.append('Body', messageText)

          const smsRes = await fetch(twilioEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: smsParams.toString(),
          })

          if (smsRes.ok) {
            smsStatus = 'sent (Twilio SMS)'
          } else {
            const smsErr = await smsRes.json().catch(() => null)
            // If Twilio Trial account requires predefined template (Error 572006)
            if (smsErr?.code === 572006) {
              console.log('Twilio Trial account template required (572006). Retrying with trial template...')
              const trialParams = new URLSearchParams()
              trialParams.append('To', fullPlusPhone)
              trialParams.append('From', twilioPhone)
              trialParams.append('Body', 'sms_appointment_reminders')

              const trialRes = await fetch(twilioEndpoint, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: trialParams.toString(),
              })

              if (trialRes.ok) {
                smsStatus = 'sent (Twilio Trial Template SMS)'
              } else {
                const trialErr = await trialRes.json().catch(() => null)
                smsStatus = `failed (Twilio SMS ${trialErr?.code || trialRes.status}: ${trialErr?.message || 'HTTP error'})`
              }
            } else {
              smsStatus = `failed (Twilio SMS ${smsErr?.code || smsRes.status}: ${smsErr?.message || 'HTTP error'})`
              console.warn('Twilio SMS API Error:', smsErr || smsRes.statusText)
            }
          }
        }
      } catch (twilioErr: any) {
        console.warn('Twilio REST API Dispatch Warning:', twilioErr?.message || twilioErr)
      }
    }

    if (smsStatus === 'simulated') {
      console.log('----------------------------------------------------')
      console.log('📱 AERIS AUTOMATED SMS DISPATCH (+91 ' + tenDigitPhone + ')')
      console.log('🔹 TARGET PHONE:', fullPlusPhone)
      console.log('🔹 SMS STATUS:', smsStatus)
      console.log('🔹 MESSAGE:\n' + messageText)
      console.log('----------------------------------------------------')
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      targetPhone: fullPlusPhone,
      smsStatus,
      messagePreview: messageText,
    })
  } catch (err: any) {
    console.error('API Notify Error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Failed to process notification push' }, { status: 500 })
  }
}
