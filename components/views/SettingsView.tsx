'use client'

import React, { useState } from 'react'
import { BellRing, ChevronLeft, ChevronRight, Cpu, Database, HardDrive, Lock, RotateCcw, Save, Send, Sliders, User, Watch } from 'lucide-react'
import type { BiologicalSex, UserActivityLevel } from '@/types/aeris'
import { ArduinoDebugPanel } from '@/components/ArduinoDebugPanel'
import { useTelemetry } from '@/hooks/useTelemetry'
import { calculateBMI, DEFAULT_BASELINE } from '@/lib/telemetry'
import { useIsDesktop } from '@/hooks/useIsDesktop'
import { Dialog } from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Field, Input, Select, Switch } from '@/components/ui/field'
import { Stat } from '@/components/ui/meter'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { normalizePhone } from '@/lib/phone'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import { getBrowserSupabase } from '@/lib/supabase/lazy'

type Section = 'profile' | 'baselines' | 'alerts' | 'device' | 'privacy'

const SECTIONS: { id: Section; label: string; description: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', description: 'Name, mobile number, body details', icon: User },
  { id: 'baselines', label: 'Baselines', description: 'What “normal” means for you', icon: Sliders },
  { id: 'alerts', label: 'Alerts & contacts', description: 'Emergency contact and notifications', icon: BellRing },
  { id: 'device', label: 'Wearable', description: 'Connection and live sensor log', icon: Watch },
  { id: 'privacy', label: 'Privacy', description: 'On-device AI and where data lives', icon: Lock },
]

export function SettingsView() {
  const { userProfile, updateUserProfile, baseline, notificationsEnabled, enableChromeNotifications, triggerNotificationPush, isOffline, setIsOffline, telemetry, account, updateBaseline } = useTelemetry()
  const { toast } = useToast()
  const [section, setSection] = useState<Section>('profile')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const isDesktop = useIsDesktop()

  const [name, setName] = useState(userProfile.name || '')
  const [accountPhone, setAccountPhone] = useState((account?.phone || '').replace(/^\+91/, ''))
  const [savedAccountPhone, setSavedAccountPhone] = useState(account?.phone || null)
  const [age, setAge] = useState<number | ''>(userProfile.age || '')
  const [sex, setSex] = useState<BiologicalSex>(userProfile.sex || 'Male')
  const [heightCm, setHeightCm] = useState<number | ''>(userProfile.heightCm || '')
  const [weightKg, setWeightKg] = useState<number | ''>(userProfile.weightKg || '')
  const [activityLevel, setActivityLevel] = useState<UserActivityLevel>(userProfile.activityLevel || 'Moderately Active')
  const [knownRestingHR, setKnownRestingHR] = useState<number | ''>(userProfile.knownRestingHR || '')
  const [healthNotes, setHealthNotes] = useState(userProfile.healthNotes || '')
  const [phone, setPhone] = useState(userProfile.emergencyContactPhone || '')
  const [autoAlerts, setAutoAlerts] = useState(userProfile.enableSmsAlerts !== false)
  const [testing, setTesting] = useState(false)

  const bmi = calculateBMI(Number(weightKg), Number(heightCm))

  const save = async () => {
    // The account mobile number lives on the Supabase profile and is what QR login checks.
    const normalized = accountPhone.trim() ? normalizePhone(accountPhone) : null
    if (accountPhone.trim() && !normalized) {
      toast({ tone: 'error', title: 'Check your mobile number', description: 'Enter a 10-digit number, like 98765 43210.' })
      return
    }
    if (normalized !== savedAccountPhone && hasSupabaseEnv()) {
      const supabase = (await getBrowserSupabase())
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase.from('profiles').update({ phone: normalized }).eq('id', user.id)
        if (error) {
          toast({ tone: 'error', title: 'Mobile number not saved', description: error.message })
          return
        }
        setSavedAccountPhone(normalized)
      }
    }
    updateUserProfile({
      name: name.trim(),
      age: Number(age) || userProfile.age,
      sex,
      heightCm: Number(heightCm) || userProfile.heightCm,
      weightKg: Number(weightKg) || userProfile.weightKg,
      activityLevel,
      knownRestingHR: knownRestingHR !== '' ? Number(knownRestingHR) : null,
      healthNotes,
      emergencyContactPhone: phone.trim(),
      enableSmsAlerts: autoAlerts,
    })
    toast({ tone: 'success', title: 'Settings saved' })
  }

  const sendTest = async () => {
    setTesting(true)
    const data = await triggerNotificationPush({
      type: 'threshold',
      title: 'Test alert from AERIS',
      body: 'This is a test. No action is needed.',
      vitals: { heartRate: telemetry.heartRate, spo2: telemetry.spo2, bodyTemp: telemetry.bodyTemp },
    })
    setTesting(false)
    if (!data) toast({ tone: 'error', title: 'Test alert failed', description: 'Could not reach the server.' })
  }

  const enableNotifications = async () => {
    const ok = await enableChromeNotifications()
    toast(
      ok
        ? { tone: 'success', title: 'Notifications on', description: 'You will get alerts even when this tab is in the background.' }
        : { tone: 'warning', title: 'Notifications blocked', description: 'Allow notifications for this site in your browser settings.' },
    )
  }

  return (
    <>
      <PageHeader title="Settings" description="AERIS compares your readings with your own baseline, so keeping your profile accurate matters." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        {!isDesktop && !mobileOpen && (
          <nav aria-label="Settings sections">
            <ul className="overflow-hidden rounded-[20px] border border-line bg-surface">
              {SECTIONS.map(({ id, label, description, icon: Icon }) => (
                <li key={id} className="border-b border-line last:border-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSection(id)
                      setMobileOpen(true)
                    }}
                    className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-2">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-medium text-fg">{label}</span>
                      <span className="block truncate text-xs text-fg-muted">{description}</span>
                    </span>
                    <ChevronRight className="size-4 text-fg-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="flex flex-col gap-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => setSection(id)}
                  aria-current={section === id ? 'page' : undefined}
                  className={cn(
                    'flex h-10 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition-colors',
                    section === id ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className={cn('min-w-0', !isDesktop && !mobileOpen && 'hidden')}>
          {!isDesktop && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mb-3 -ml-2 inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl px-2 text-sm font-medium text-fg-2 hover:text-fg"
            >
              <ChevronLeft className="size-4" aria-hidden /> Settings
            </button>
          )}
          {section === 'profile' && (
            <Card className="p-5 md:p-6">
              <CardHeader title="Personal profile" description="Used to set your reference heart-rate range and for responders in an emergency." />
              <form
                className="mt-5 grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  save()
                }}
              >
                <Field label="Name" htmlFor="set-name" className="md:col-span-2">
                  <Input id="set-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </Field>
                <Field label="Your mobile number" htmlFor="set-mobile" hint="Used for Scan to log in — only this number can approve a QR login to your account." className="md:col-span-2">
                  <div className="flex h-11 items-center overflow-hidden rounded-xl border border-line bg-surface focus-within:border-brand">
                    <span className="border-r border-line px-3 text-[15px] text-fg-muted">+91</span>
                    <input
                      id="set-mobile"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="98765 43210"
                      value={accountPhone}
                      onChange={(e) => setAccountPhone(e.target.value)}
                      className="h-full flex-1 bg-transparent px-3 text-[15px] text-fg placeholder:text-fg-muted focus:outline-none"
                    />
                  </div>
                </Field>
                <Field label="Age" htmlFor="set-age">
                  <Input id="set-age" type="number" inputMode="numeric" min={1} max={120} value={age} onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))} />
                </Field>
                <Field label="Sex" htmlFor="set-sex">
                  <Select id="set-sex" value={sex} onChange={(e) => setSex(e.target.value as BiologicalSex)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </Select>
                </Field>
                <Field label="Height (cm)" htmlFor="set-height">
                  <Input id="set-height" type="number" inputMode="numeric" value={heightCm} onChange={(e) => setHeightCm(e.target.value === '' ? '' : Number(e.target.value))} />
                </Field>
                <Field label="Weight (kg)" htmlFor="set-weight" hint={heightCm && weightKg ? `BMI ${bmi}` : undefined}>
                  <Input id="set-weight" type="number" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value === '' ? '' : Number(e.target.value))} />
                </Field>
                <Field label="Activity level" htmlFor="set-activity">
                  <Select id="set-activity" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value as UserActivityLevel)}>
                    <option value="Sedentary">Sedentary — little or no exercise</option>
                    <option value="Lightly Active">Lightly active — 1–3 days a week</option>
                    <option value="Moderately Active">Moderately active — 3–5 days a week</option>
                    <option value="Very Active">Very active — 6–7 days a week</option>
                    <option value="Athlete">Athlete — professional training</option>
                  </Select>
                </Field>
                <Field label="Resting heart rate (optional)" htmlFor="set-rhr" hint="If you know it from another device">
                  <Input id="set-rhr" type="number" inputMode="numeric" placeholder="e.g. 64" value={knownRestingHR} onChange={(e) => setKnownRestingHR(e.target.value === '' ? '' : Number(e.target.value))} />
                </Field>
                <Field label="Medical notes for responders (optional)" htmlFor="set-notes" hint="Allergies, conditions or medication. Shown in the SOS screen." className="md:col-span-2">
                  <Input id="set-notes" value={healthNotes} onChange={(e) => setHealthNotes(e.target.value)} placeholder="e.g. Asthma, allergic to penicillin" />
                </Field>
                <div className="md:col-span-2">
                  <Button type="submit">
                    <Save /> Save profile
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {section === 'baselines' && (
            <Card className="p-5 md:p-6">
              <CardHeader
                title="Your baselines"
                description="Learned from your own readings. Alerts trigger when you move away from these, not from population averages."
                action={<Badge tone={baseline.isLearningMode ? 'warning' : 'success'}>{baseline.isLearningMode ? `Learning · ${baseline.totalSamplesCount}/10` : 'Established'}</Badge>}
              />
              <div className="mt-5 grid gap-2 md:grid-cols-3">
                <Stat label="Resting heart rate" value={baseline.restingHR} unit="BPM" hint={`Normal for you ${baseline.restingHRRange.min}–${baseline.restingHRRange.max}`} />
                <Stat label="Body temperature" value={baseline.tempBaseline.toFixed(1)} unit="°C" hint={`Normal for you ${baseline.tempRange.min}–${baseline.tempRange.max}`} />
                <Stat label="Blood oxygen" value="95–100" unit="%" hint="Healthy range" />
              </div>
              <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-fg-muted">Reference range for your age and activity</dt>
                  <dd className="mt-0.5 font-medium text-fg">
                    {baseline.refRestingHRRange.min}–{baseline.refRestingHRRange.max} BPM
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Readings used</dt>
                  <dd className="mt-0.5 font-medium text-fg">{baseline.totalSamplesCount} over a rolling 14 days</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Confidence</dt>
                  <dd className="mt-0.5 font-medium text-fg">{baseline.confidence || '—'}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Learned on</dt>
                  <dd className="mt-0.5 font-mono font-medium text-fg">{baseline.lastUpdated || '—'}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
                <p className="text-sm text-fg-2">Moved, changed medication or started training? Reset so AERIS learns your new normal.</p>
                <Button variant="danger-soft" onClick={() => setResetOpen(true)}>
                  <RotateCcw /> Reset baselines
                </Button>
              </div>
            </Card>
          )}

          {section === 'alerts' && (
            <div className="grid gap-4">
              <Card className="p-5 md:p-6">
                <CardHeader title="Emergency contact" description="Receives SOS and high-risk alerts with your location and vitals." />
                <div className="mt-5 grid gap-4">
                  <Field label="Phone number" htmlFor="set-phone" hint="Include the country code if outside India.">
                    <Input id="set-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile number" />
                  </Field>
                  <Switch id="set-auto" checked={autoAlerts} onChange={setAutoAlerts} label="Send alerts automatically" description="When a reading becomes critical, notify your contact and the response channel without asking." />
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={save}>
                      <Save /> Save
                    </Button>
                    <Button variant="secondary" onClick={sendTest} disabled={testing}>
                      <Send /> {testing ? 'Sending…' : 'Send test alert'}
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-5 md:p-6">
                <Switch
                  id="set-notify"
                  checked={notificationsEnabled}
                  onChange={(v) => v && enableNotifications()}
                  label="Browser notifications"
                  description={notificationsEnabled ? 'On — alerts appear even when AERIS is in the background.' : 'Get alerts even when this tab is in the background.'}
                />
              </Card>
            </div>
          )}

          {section === 'device' && (
            <Card className="p-5 md:p-6">
              <CardHeader title="AERIS wearable" description="Connection status and live sensor data. Useful when setting up the watch." icon={<Watch className="size-4" />} />
              <div className="mt-5">
                <ArduinoDebugPanel />
              </div>
            </Card>
          )}

          {section === 'privacy' && (
            <div className="grid gap-4">
              <Card className="p-5 md:p-6">
                <Switch
                  id="set-offline"
                  checked={isOffline}
                  onChange={setIsOffline}
                  label="On-device AI only"
                  description="The assistant answers using the built-in model and never sends your question or vitals to a cloud AI service."
                />
              </Card>
              <Card className="p-5 md:p-6">
                <CardHeader title="Where your data lives" />
                <ul className="mt-4 grid gap-4">
                  {[
                    { icon: Cpu, title: 'Risk scoring runs on your device', body: 'Heart rate, temperature and weather are combined in your browser. Raw sensor streams are not uploaded.' },
                    { icon: HardDrive, title: 'Recent readings are cached locally', body: 'Kept in this browser so AERIS keeps working without a connection.' },
                    { icon: Database, title: 'Your profile and baseline sync to your account', body: 'When signed in, they are stored in your AERIS account so they follow you across devices.' },
                    { icon: BellRing, title: 'Alerts share only what responders need', body: 'Your name, vitals and location are sent only when you trigger SOS or an alert fires.' },
                  ].map(({ icon: Icon, title, body }) => (
                    <li key={title} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-fg-2">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-fg">{title}</p>
                        <p className="mt-0.5 text-sm text-fg-2">{body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset your baselines?"
        description="AERIS will forget what is normal for you and start learning again from your next 10 readings. Alerts are less personal until then."
        size="sm"
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setResetOpen(false)} data-autofocus>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              updateBaseline({ ...DEFAULT_BASELINE, refRestingHRRange: baseline.refRestingHRRange, isLearningMode: true, totalSamplesCount: 0, lastUpdated: new Date().toLocaleDateString() })
              setResetOpen(false)
              toast({ tone: 'success', title: 'Baselines reset', description: 'AERIS is learning your normal again.' })
            }}
          >
            Reset
          </Button>
        </div>
      </Dialog>
    </>
  )
}
