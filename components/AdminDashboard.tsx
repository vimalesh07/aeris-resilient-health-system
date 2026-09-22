'use client'

import { useState } from 'react'
import { SessionControls } from './SessionControls'
import { ShieldCheck, Users, AlertTriangle, FileText, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'

export function AdminDashboard({
  profile,
  counts,
}: {
  profile: { full_name: string; role: 'admin' }
  counts: { users: number; requests: number; alerts: number }
}) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'user' | 'admin' | 'government'>('user')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const assignRole = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      setMessage('Please enter a valid email address.')
      setIsSuccess(false)
      return
    }

    setLoading(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, role }),
      })
      const data = await response.json()
      if (response.ok) {
        setIsSuccess(true)
        setMessage(`Success: Updated ${data.email} to ${data.role.toUpperCase()} role.`)
        setEmail('')
      } else {
        setIsSuccess(false)
        setMessage(data.error || 'Role update failed.')
      }
    } catch {
      setIsSuccess(false)
      setMessage('Network error: Failed to reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickSwitchRole = async (targetRole: 'user' | 'admin' | 'government') => {
    try {
      const res = await fetch('/api/dev/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = `/${targetRole}`
      } else {
        alert(data.error || 'Could not switch role')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error switching role')
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '36px clamp(16px, 5vw, 60px)',
        background: 'radial-gradient(ellipse at 50% 10%, rgba(220, 38, 38, 0.08) 0%, #080B10 60%)',
        color: '#F8FAFC',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 20,
          flexWrap: 'wrap',
          paddingBottom: 24,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 9999,
              background: 'rgba(220, 38, 38, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              marginBottom: 10,
            }}
          >
            <ShieldCheck size={14} color="#EF4444" />
            <span style={{ color: '#EF4444', fontWeight: 800, fontSize: 11, letterSpacing: '.1em' }}>
              AERIS SYSTEM ADMINISTRATION
            </span>
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#FFFFFF' }}>
            Operations & Control Dashboard
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>
            Administrative management of user accounts, telemetry systems, and emergency operations.
          </p>
        </div>
        <SessionControls name={profile.full_name} role="admin" />
      </header>

      {/* Metrics Grid */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 28,
        }}
      >
        <article
          style={{
            padding: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3B82F6',
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <strong style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF' }}>{counts.users}</strong>
            <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Registered Users
            </p>
          </div>
        </article>

        <article
          style={{
            padding: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <strong style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF' }}>{counts.requests}</strong>
            <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Emergency Requests
            </p>
          </div>
        </article>

        <article
          style={{
            padding: 20,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 12,
              borderRadius: 10,
              background: 'rgba(234, 179, 8, 0.15)',
              color: '#EAB308',
            }}
          >
            <FileText size={24} />
          </div>
          <div>
            <strong style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF' }}>{counts.alerts}</strong>
            <p style={{ margin: '2px 0 0', color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Active Risk Alerts
            </p>
          </div>
        </article>
      </section>

      {/* Role Management Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          marginTop: 28,
        }}
      >
        <section
          style={{
            padding: 24,
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
            Assign Account Role
          </h2>
          <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: 13, lineHeight: 1.5 }}>
            Elevate or change application permissions for any registered user.
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>
              User Email
            </label>
            <input
              aria-label="User email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              type="email"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: 'rgba(0, 0, 0, 0.4)',
                color: '#FFFFFF',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#CBD5E1' }}>
              Target Role
            </label>
            <select
              aria-label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                background: '#0F172A',
                color: '#FFFFFF',
                fontSize: 14,
                boxSizing: 'border-box',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="user">USER — Personal Health & Biometrics</option>
              <option value="admin">ADMIN — Operations & Management</option>
              <option value="government">GOVERNMENT — Incident Feed</option>
            </select>
          </div>

          <button
            onClick={assignRole}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 8,
              border: 0,
              background: loading ? '#6B7280' : '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
            }}
          >
            {loading ? 'Updating...' : 'Confirm Role Update'}
            <ArrowRight size={16} />
          </button>

          {message && (
            <div
              role="status"
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                border: isSuccess ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: isSuccess ? '#34D399' : '#F87171',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{message}</span>
            </div>
          )}
        </section>

        {/* Quick Testing & Portal Preview */}
        <section
          style={{
            padding: 24,
            background: 'rgba(15, 23, 42, 0.85)',
            borderRadius: 14,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
            Portal Testing Hub
          </h2>
          <p style={{ margin: '0 0 20px', color: '#94A3B8', fontSize: 13, lineHeight: 1.5 }}>
            Switch your current session instantly to test and verify the distinct portals:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => quickSwitchRole('user')}
              style={{
                padding: '14px 18px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#60A5FA' }}>1. USER Portal (/user)</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Test telemetry, vitals, hardware, SOS</span>
              </div>
              <ArrowRight size={16} color="#60A5FA" />
            </button>

            <button
              onClick={() => quickSwitchRole('government')}
              style={{
                padding: '14px 18px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: 14, color: '#34D399' }}>2. GOVERNMENT Portal (/government)</strong>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>Test anonymized incident resilience feed</span>
              </div>
              <ArrowRight size={16} color="#34D399" />
            </button>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: 12,
                color: '#FCA5A5',
                marginTop: 6,
              }}
            >
              <strong>Active Role:</strong> {profile.role.toUpperCase()} (You are currently on the ADMIN operations portal).
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
