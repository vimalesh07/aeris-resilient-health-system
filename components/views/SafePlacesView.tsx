'use client'

import React from 'react'
import { Building2, Home, MapPin, Pill, Shield, ShieldCheck } from 'lucide-react'
import { SafePlaceFinder } from '@/components/SafePlaceFinder'

export function SafePlacesView() {
  return (
    <div style={{ paddingTop: 20 }}>
      {/* Header section */}
      <div style={{ marginBottom: 24 }}>
        <p className="eyebrow">AERIS Resilient Geo-Spatial Infrastructure</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '4px 0 8px', color: '#FFF' }}>
          Safe Place Finder & Emergency Facilities
        </h1>
        <p className="subhead">
          Real-time, privacy-preserving emergency routing linking physiological vitals and climate risk detection to
          verified nearby medical centres, cooling shelters, and safe zones.
        </p>
      </div>

      {/* Quick Facility Category Overview Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: '#1F0505',
            border: '1px solid rgba(198, 40, 40, 0.4)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(198, 40, 40, 0.2)',
              color: 'var(--main-red)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: '#FFF', display: 'block' }}>Hospitals</strong>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>24/7 Trauma, ICU & Critical Triage</span>
          </div>
        </div>

        <div
          style={{
            background: '#1F0505',
            border: '1px solid rgba(37, 99, 235, 0.4)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(37, 99, 235, 0.2)',
              color: '#3B82F6',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: '#FFF', display: 'block' }}>Primary Health (PHCs)</strong>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Community Care, ORS & First Aid</span>
          </div>
        </div>

        <div
          style={{
            background: '#1F0505',
            border: '1px solid rgba(217, 119, 6, 0.4)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(217, 119, 6, 0.2)',
              color: '#F59E0B',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Home size={18} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: '#FFF', display: 'block' }}>Emergency Shelters</strong>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Cooling Havens & Elevated Flood Refuge</span>
          </div>
        </div>

        <div
          style={{
            background: '#1F0505',
            border: '1px solid rgba(5, 150, 105, 0.4)',
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(5, 150, 105, 0.2)',
              color: '#10B981',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Pill size={18} />
          </div>
          <div>
            <strong style={{ fontSize: 13, color: '#FFF', display: 'block' }}>Pharmacies</strong>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Essential Rx, Oxygen & Nebulizers</span>
          </div>
        </div>
      </div>

      {/* Safe Place Finder Core Engine */}
      <SafePlaceFinder />
    </div>
  )
}
