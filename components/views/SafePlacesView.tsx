'use client'

import React from 'react'
import { Ambulance, CloudLightning, Siren } from 'lucide-react'
import { SafePlaceFinder } from '@/components/SafePlaceFinder'
import { PageHeader } from '@/components/ui/page-header'

const EMERGENCY_NUMBERS = [
  { number: '112', label: 'Police & all emergencies', icon: Siren, primary: true },
  { number: '108', label: 'Ambulance', icon: Ambulance },
  { number: '1077', label: 'Disaster helpline', icon: CloudLightning },
]

export function SafePlacesView() {
  return (
    <>
      <PageHeader title="Safe places" description="Hospitals, health centres, shelters and pharmacies near you — ordered by what matters most for your current risk." />

      {/* Emergency calls are the hero and render with the first frame — never animated in. */}
      <nav aria-label="Emergency numbers" className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
        {EMERGENCY_NUMBERS.map(({ number, label, icon: Icon, primary }) => (
          <a
            key={number}
            href={`tel:${number}`}
            className={
              primary
                ? 'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-2xl bg-brand px-3 py-2.5 text-white shadow-sm hover:bg-brand-hover md:flex-row md:items-center md:gap-3 md:px-4'
                : 'flex min-h-14 flex-col items-start justify-center gap-0.5 rounded-2xl border border-line bg-surface px-3 py-2.5 text-fg hover:bg-surface-2 md:flex-row md:items-center md:gap-3 md:px-4'
            }
          >
            <span className="flex items-center gap-2">
              <Icon className="size-5" aria-hidden />
              <span className="font-mono text-xl font-medium tabular-nums">{number}</span>
            </span>
            <span className={primary ? 'text-xs leading-tight text-white md:text-sm' : 'text-xs leading-tight text-fg-muted md:text-sm'}>{label}</span>
          </a>
        ))}
      </nav>

      <SafePlaceFinder />
    </>
  )
}
