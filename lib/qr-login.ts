import 'server-only'

import { createHash, randomBytes } from 'node:crypto'

export { maskPhone, normalizePhone } from '@/lib/phone'

export const QR_LOGIN_TTL_SECONDS = 120

export function newQrSecret(): string {
  return randomBytes(32).toString('base64url')
}

export function hashQrSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex')
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isQrRequestId(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/** Short human label for the browser asking to sign in, e.g. "Chrome on Windows". */
export function describeDevice(userAgent: string | null): string {
  const ua = userAgent || ''
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
    ? 'Opera'
    : /Chrome\//.test(ua)
    ? 'Chrome'
    : /Firefox\//.test(ua)
    ? 'Firefox'
    : /Safari\//.test(ua)
    ? 'Safari'
    : 'A browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
    ? 'Android'
    : /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Mac OS X/.test(ua)
    ? 'macOS'
    : /Linux/.test(ua)
    ? 'Linux'
    : 'an unknown system'
  return `${browser} on ${os}`
}
