/**
 * Normalises a mobile number to E.164 (+919876543210). Bare 10-digit numbers
 * are treated as Indian. Returns null when it can't be a valid number.
 * Mirrors private.normalize_phone() in the database.
 */
export function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+91${digits}`
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`
  return null
}

/** "+91 ••••• •3210" — shown on screen without exposing the whole number. */
export function maskPhone(e164: string): string {
  return `${e164.slice(0, 3)} ••••• •${e164.slice(-4)}`
}
