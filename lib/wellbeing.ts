/**
 * Validated short wellbeing screeners, worded as published:
 *  - PSS-4  Perceived Stress Scale, 4-item (Cohen, Kamarck & Mermelstein, 1983)
 *  - GAD-2  Generalized Anxiety Disorder 2-item (Kroenke et al., 2007)
 *  - PHQ-2  Patient Health Questionnaire 2-item (Kroenke et al., 2003)
 *  - Sleep  overall sleep-quality item from the PSQI (Buysse et al., 1989)
 *
 * These are screening aids, not diagnoses. PHQ and GAD are free to use
 * without permission; PSS is free for non-commercial use.
 */

export type ScaleId = 'pss4' | 'gad2' | 'phq2' | 'sleep'

export interface Choice {
  value: number
  label: string
}

export interface Question {
  id: string
  scale: ScaleId
  text: string
  /** Reverse-scored items (PSS-4 items 2 and 3). */
  reverse?: boolean
}

export interface Section {
  scale: ScaleId
  title: string
  stem: string
  choices: Choice[]
  questions: Question[]
}

const PSS_CHOICES: Choice[] = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Almost never' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Fairly often' },
  { value: 4, label: 'Very often' },
]

const PHQ_GAD_CHOICES: Choice[] = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'Several days' },
  { value: 2, label: 'More than half the days' },
  { value: 3, label: 'Nearly every day' },
]

const SLEEP_CHOICES: Choice[] = [
  { value: 0, label: 'Very good' },
  { value: 1, label: 'Fairly good' },
  { value: 2, label: 'Fairly bad' },
  { value: 3, label: 'Very bad' },
]

export const SECTIONS: Section[] = [
  {
    scale: 'pss4',
    title: 'Stress',
    stem: 'In the last month, how often have you felt…',
    choices: PSS_CHOICES,
    questions: [
      { id: 'pss1', scale: 'pss4', text: '…that you were unable to control the important things in your life?' },
      { id: 'pss2', scale: 'pss4', text: '…confident about your ability to handle your personal problems?', reverse: true },
      { id: 'pss3', scale: 'pss4', text: '…that things were going your way?', reverse: true },
      { id: 'pss4', scale: 'pss4', text: '…difficulties were piling up so high that you could not overcome them?' },
    ],
  },
  {
    scale: 'gad2',
    title: 'Worry',
    stem: 'Over the last 2 weeks, how often have you been bothered by…',
    choices: PHQ_GAD_CHOICES,
    questions: [
      { id: 'gad1', scale: 'gad2', text: 'Feeling nervous, anxious, or on edge' },
      { id: 'gad2', scale: 'gad2', text: 'Not being able to stop or control worrying' },
    ],
  },
  {
    scale: 'phq2',
    title: 'Mood',
    stem: 'Over the last 2 weeks, how often have you been bothered by…',
    choices: PHQ_GAD_CHOICES,
    questions: [
      { id: 'phq1', scale: 'phq2', text: 'Little interest or pleasure in doing things' },
      { id: 'phq2', scale: 'phq2', text: 'Feeling down, depressed, or hopeless' },
    ],
  },
  {
    scale: 'sleep',
    title: 'Sleep',
    stem: 'During the past week…',
    choices: SLEEP_CHOICES,
    questions: [{ id: 'sleep1', scale: 'sleep', text: 'How would you rate your sleep quality overall?' }],
  },
]

export const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions.map((q) => ({ ...q, section: s })))

export type Answers = Partial<Record<string, number>>

export interface CheckInResult {
  completedAt: string
  pss4: number // 0–16
  gad2: number // 0–6
  phq2: number // 0–6
  sleep: number // 0–3 (higher = worse)
  /** 0–100 self-reported strain used in the stress score. */
  selfScore: number
  /** GAD-2 ≥ 3 or PHQ-2 ≥ 3 — the published cut-offs for "worth a follow-up". */
  followUp: boolean
}

export function isComplete(answers: Answers): boolean {
  return ALL_QUESTIONS.every((q) => typeof answers[q.id] === 'number')
}

export function scoreCheckIn(answers: Answers): CheckInResult {
  const sum = (scale: ScaleId) =>
    ALL_QUESTIONS.filter((q) => q.scale === scale).reduce((total, q) => {
      const v = answers[q.id] ?? 0
      return total + (q.reverse ? 4 - v : v)
    }, 0)
  const pss4 = sum('pss4')
  const gad2 = sum('gad2')
  const phq2 = sum('phq2')
  const sleep = sum('sleep')
  // Weighting for AERIS's combined stress score (not a clinical measure):
  // perceived stress 50%, worry 20%, mood 15%, sleep 15%.
  const selfScore = Math.round((pss4 / 16) * 50 + (gad2 / 6) * 20 + (phq2 / 6) * 15 + (sleep / 3) * 15)
  return { completedAt: new Date().toISOString(), pss4, gad2, phq2, sleep, selfScore, followUp: gad2 >= 3 || phq2 >= 3 }
}

const STORAGE_KEY = 'aeris-wellbeing-checkin-v1'

export function loadCheckIn(): CheckInResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CheckInResult) : null
  } catch {
    return null
  }
}

export function saveCheckIn(result: CheckInResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
  } catch {
    // Storage unavailable: the result still applies for this session.
  }
}

/** Plain-language reading of each score (screening only). */
export function describe(result: CheckInResult) {
  return {
    pss4: result.pss4 <= 4 ? 'Low' : result.pss4 <= 8 ? 'Moderate' : 'High',
    gad2: result.gad2 >= 3 ? 'Worth a follow-up' : 'Below screening cut-off',
    phq2: result.phq2 >= 3 ? 'Worth a follow-up' : 'Below screening cut-off',
    sleep: ['Very good', 'Fairly good', 'Fairly bad', 'Very bad'][result.sleep] ?? '—',
  }
}
