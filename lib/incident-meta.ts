import type React from 'react'
import { Construction, HeartPulse, Siren, Utensils } from 'lucide-react'
import type { BadgeTone } from '@/components/ui/badge'

export const SEVERITY_TONE: Record<string, BadgeTone> = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' }
export const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
export const TYPE_ICON: Record<string, React.ElementType> = { sos: Siren, threshold: HeartPulse, obstacle: Construction, food: Utensils }
export const TYPE_LABEL: Record<string, string> = { sos: 'SOS', threshold: 'Health alert', obstacle: 'Blocked path', food: 'Food & water' }

export function relativeTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}
