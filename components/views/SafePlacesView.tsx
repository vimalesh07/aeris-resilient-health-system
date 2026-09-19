'use client'

import React from 'react'
import { Building2, Home, Pill, Shield } from 'lucide-react'
import { SafePlaceFinder } from '@/components/SafePlaceFinder'

export function SafePlacesView() {
  return (
    <div style={{ paddingTop: 16 }}>
      {/* Header section */}
      <div style={{ marginBottom: 20 }}>
        <p className="eyebrow">AERIS Geo-Spatial Resilience Engine</p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 30px)', fontWeight: 800, margin: '4px 0 6px', color: 'var(--text-primary)' }}>
          Safe Place Finder & Emergency Facilities
        </h1>
        <p className="subhead">
          Real-time, privacy-preserving emergency routing linking physiological vitals and climate risk detection to verified nearby medical centres, cooling shelters, and safe zones.
        </p>
      </div>

      {/* Quick Facility Category Overview Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(198, 40, 40, 0.15)',
              color: 'var(--main-red)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Building2 size={16} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>Hospitals</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>24/7 Trauma, ICU & Triage</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Shield size={16} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>Primary Health (PHCs)</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Community Care & First Aid</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(255, 193, 7, 0.15)',
              color: 'var(--yellow)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Home size={16} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>Emergency Shelters</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cooling Havens & Flood Refuge</span>
          </div>
        </div>

        <div
          style={{
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--risk-safe)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Pill size={16} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block' }}>Pharmacies</strong>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Essential Rx & Oxygen Supplies</span>
          </div>
        </div>
      </div>

      {/* Safe Place Finder Core Engine */}
      <SafePlaceFinder />
    </div>
  )
}
