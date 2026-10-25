'use client'

import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { HeartHandshake, Phone } from 'lucide-react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SECTIONS, describe, isComplete, saveCheckIn, scoreCheckIn, type Answers, type CheckInResult } from '@/lib/wellbeing'
import { cn } from '@/lib/utils'

/**
 * Short wellbeing check-in using validated screeners (PSS-4, GAD-2, PHQ-2,
 * PSQI sleep item). One section per step; answers stay on this device.
 */
export function WellbeingCheckIn({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: (r: CheckInResult) => void }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [result, setResult] = useState<CheckInResult | null>(null)

  useEffect(() => {
    if (open) {
      setStep(0)
      setAnswers({})
      setResult(null)
    }
  }, [open])

  const section = SECTIONS[step]
  const sectionDone = section ? section.questions.every((q) => typeof answers[q.id] === 'number') : true
  const totalQuestions = SECTIONS.reduce((n, s) => n + s.questions.length, 0)
  const answered = Object.keys(answers).length

  const finish = () => {
    if (!isComplete(answers)) return
    const r = scoreCheckIn(answers)
    saveCheckIn(r)
    setResult(r)
    onComplete(r)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={result ? 'Thanks for checking in' : 'How have you been feeling?'}
      description={result ? 'Your answers stay on this device. They adjust your stress score.' : 'Nine short questions from standard wellbeing screeners. There are no right or wrong answers.'}
    >
      {!result ? (
        <>
          <div className="mb-5">
            <div className="flex justify-between text-xs text-fg-muted">
              <span>
                Step {step + 1} of {SECTIONS.length} · {section.title}
              </span>
              <span className="font-mono">
                {answered}/{totalQuestions}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <motion.div className="h-full w-full origin-left rounded-full bg-brand" animate={{ scaleX: answered / totalQuestions }} transition={{ type: 'spring', stiffness: 380, damping: 36 }} />
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={section.scale} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12, transition: { duration: 0.12 } }} transition={{ duration: 0.2 }}>
              <p className="mb-4 text-[15px] font-medium text-fg">{section.stem}</p>
              <div className="grid gap-5">
                {section.questions.map((q) => (
                  <fieldset key={q.id}>
                    <legend className="mb-2 text-sm text-fg">{q.text}</legend>
                    <div role="radiogroup" className={cn('grid gap-1.5', section.choices.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4')}>
                      {section.choices.map((c) => {
                        const active = answers[q.id] === c.value
                        return (
                          <button
                            key={c.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setAnswers((a) => ({ ...a, [q.id]: c.value }))}
                            className={cn(
                              'min-h-11 cursor-pointer rounded-xl border px-2.5 py-2 text-[13px] leading-tight font-medium transition-colors',
                              active ? 'border-fg bg-fg text-on-fg' : 'border-line bg-surface text-fg-2 hover:border-line-strong hover:text-fg',
                            )}
                          >
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  </fieldset>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-between gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < SECTIONS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!sectionDone}>
                Next
              </Button>
            ) : (
              <Button onClick={finish} disabled={!sectionDone}>
                See results
              </Button>
            )}
          </div>
        </>
      ) : (
        <CheckInSummary result={result} onDone={onClose} />
      )}
    </Dialog>
  )
}

export function CheckInSummary({ result, onDone }: { result: CheckInResult; onDone?: () => void }) {
  const d = describe(result)
  const rows = [
    { label: 'Perceived stress (PSS-4)', value: `${result.pss4}/16`, note: d.pss4 },
    { label: 'Worry (GAD-2)', value: `${result.gad2}/6`, note: d.gad2 },
    { label: 'Mood (PHQ-2)', value: `${result.phq2}/6`, note: d.phq2 },
    { label: 'Sleep quality', value: d.sleep, note: 'Past week' },
  ]
  return (
    <div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <li key={r.label} className="rounded-xl border border-line p-3.5">
            <p className="text-xs text-fg-muted">{r.label}</p>
            <p className={cn('mt-0.5 text-lg text-fg', /\d/.test(r.value) && 'font-mono')}>{r.value}</p>
            <p className="text-xs text-fg-2">{r.note}</p>
          </li>
        ))}
      </ul>

      {result.followUp && (
        <div className="mt-4 flex gap-3 rounded-2xl border border-info-line bg-info-soft p-4">
          <HeartHandshake className="mt-0.5 size-5 shrink-0 text-info" aria-hidden />
          <div className="text-sm text-fg-2">
            <p className="font-semibold text-fg">It may help to talk to someone</p>
            <p className="mt-1">
              Your answers are above the usual screening cut-off. That isn’t a diagnosis, but a conversation with a doctor or counsellor can help. Tele-MANAS is India’s free, confidential
              mental-health helpline, open 24/7.
            </p>
            <a href="tel:14416" className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-info px-4 text-sm font-semibold text-white">
              <Phone className="size-4" aria-hidden /> Call Tele-MANAS 14416
            </a>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-fg-muted">These are screening questions, not a diagnosis. If you ever feel unsafe, call 112.</p>
      {onDone && (
        <div className="mt-5 flex justify-end">
          <Button onClick={onDone}>Done</Button>
        </div>
      )}
    </div>
  )
}
