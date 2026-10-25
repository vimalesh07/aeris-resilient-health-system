import { ShieldCheck, Eye, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { RiskScores } from '@/types/aeris'

export type RiskTier = 'safe' | 'monitor' | 'critical'

export function tierOf(score: number, criticalOverride = false): RiskTier {
  if (criticalOverride || score > 60) return 'critical'
  if (score > 30) return 'monitor'
  return 'safe'
}

export function tierOfRisks(risks: RiskScores): RiskTier {
  return tierOf(risks.overall, risks.criticalOverride)
}

/** Critical anywhere = icon + word + colour. */
export const TIER_META: Record<RiskTier, { label: string; icon: LucideIcon; text: string; bg: string; solid: string }> = {
  safe: { label: 'Safe', icon: ShieldCheck, text: 'text-safe', bg: 'bg-safe-bg', solid: 'bg-safe-solid' },
  monitor: { label: 'Monitor', icon: Eye, text: 'text-monitor', bg: 'bg-monitor-bg', solid: 'bg-monitor-solid' },
  critical: { label: 'Critical', icon: TriangleAlert, text: 'text-critical', bg: 'bg-critical-bg', solid: 'bg-critical-solid' },
}
