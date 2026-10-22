'use client'

import React, { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase/browser'
import { hasSupabaseEnv } from '@/lib/supabase/env'
import type { AppRole } from '@/lib/auth'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react'

type Mode = 'login' | 'signup'

interface RoleOption {
  role: AppRole
  title: string
  subtitle: string
  description: string
  route: string
  icon: React.ComponentType<{ className?: string; size?: number; style?: React.CSSProperties }>
  tag: string
}

const ROLES: RoleOption[] = [
  {
    role: 'user',
    title: 'USER',
    subtitle: 'Personal Health & Resilience',
    description: 'Continuous vital telemetry, heat & AQI risk assessment, emergency SOS beacon, and offline resilience.',
    route: '/user',
    icon: Activity,
    tag: 'Health Monitoring',
  },
  {
    role: 'admin',
    title: 'ADMIN',
    subtitle: 'System Administration',
    description: 'User credential directory, administrative role provisioning, audit trails, and system-wide telemetry overview.',
    route: '/admin',
    icon: ShieldAlert,
    tag: 'System Controls',
  },
  {
    role: 'government',
    title: 'GOVERNMENT',
    subtitle: 'Civil Defense & Public Safety',
    description: 'Regional emergency incident triage, SOS distress queue, crisis dispatch coordination, and public safety feed.',
    route: '/government',
    icon: Building2,
    tag: 'Emergency Operations',
  },
]

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialRoleParam = searchParams.get('role') as AppRole | null
  const initialRole = initialRoleParam && ['user', 'admin', 'government'].includes(initialRoleParam)
    ? initialRoleParam
    : null

  const [selectedRole, setSelectedRole] = useState<AppRole | null>(initialRole)
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccessMessage, setIsSuccessMessage] = useState(false)
  const [busy, setBusy] = useState(false)
  const isSupabaseConfigured = hasSupabaseEnv()

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'session') {
      setMessage('Your session has expired or authentication is required. Please sign in.')
      setIsSuccessMessage(false)
    } else if (errorParam === 'callback') {
      setMessage('Email confirmation failed or link expired. Please try signing in.')
      setIsSuccessMessage(false)
    }
  }, [searchParams])

  const handleSelectRole = (role: AppRole) => {
    setSelectedRole(role)
    setMessage(null)
    setIsSuccessMessage(false)
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setMessage(null)
    setIsSuccessMessage(false)
    setMode('login')
    setPassword('')
    setConfirmPassword('')
  }

  const handleSwitchMode = (newMode: Mode) => {
    setMode(newMode)
    setMessage(null)
    setIsSuccessMessage(false)
    setPassword('')
    setConfirmPassword('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRole) {
      setMessage('Please select an account type to continue.')
      setIsSuccessMessage(false)
      return
    }

    const trimmedEmail = email.trim().toLowerCase()
    const trimmedFullName = fullName.trim()
    const trimmedPhone = phone.trim()

    // Client-side input validation
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMessage('Please enter a valid email address.')
      setIsSuccessMessage(false)
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.')
      setIsSuccessMessage(false)
      return
    }

    if (mode === 'signup') {
      if (!trimmedFullName) {
        setMessage('Please enter your full name.')
        setIsSuccessMessage(false)
        return
      }
      if (password !== confirmPassword) {
        setMessage('Passwords do not match. Please ensure both passwords are identical.')
        setIsSuccessMessage(false)
        return
      }
    }

    setBusy(true)
    setMessage(null)
    setIsSuccessMessage(false)

    if (!isSupabaseConfigured) {
      setBusy(false)
      setMessage('Supabase is not configured in .env.local. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to enable cloud auth, or continue in offline mode.')
      setIsSuccessMessage(false)
      return
    }

    try {
      const supabase = createBrowserSupabaseClient()

      // ==========================================
      // REGISTRATION FLOW — via server-side API
      // ==========================================
      if (mode === 'signup') {
        let registerOk = false
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: trimmedEmail,
              password,
              fullName: trimmedFullName,
              phone: trimmedPhone || undefined,
              role: selectedRole,
            }),
          })
          const json = await res.json()
          if (!res.ok) {
            throw new Error(json.error || 'Registration failed. Please try again.')
          }
          registerOk = true
        } catch (apiErr: unknown) {
          const errMsg = apiErr instanceof Error ? apiErr.message : ''
          // If already registered or specific error, rethrow
          if (errMsg && !errMsg.toLowerCase().includes('fetch failed')) {
            throw apiErr
          }
          // Fallback to direct client-side signup if local route had a network glitch
          const { error: clientSignUpErr } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                full_name: trimmedFullName,
                role: selectedRole,
                ...(trimmedPhone ? { phone: trimmedPhone } : {}),
              },
            },
          })
          if (clientSignUpErr) {
            throw new Error(clientSignUpErr.message || 'Registration failed.')
          }
          registerOk = true
        }

        if (registerOk) {
          // Attempt sign-in immediately
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          })

          if (signInError || !signInData?.session) {
            setIsSuccessMessage(true)
            setMessage(`Account created for ${selectedRole!.toUpperCase()}. Please sign in below.`)
            setMode('login')
            return
          }

          // Redirect to the correct dashboard
          router.replace(`/${selectedRole}`)
          router.refresh()
          return
        }
      }

      // ==========================================
      // LOGIN FLOW
      // ==========================================
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })

      if (error || !data.user) {
        if (error?.message?.toLowerCase().includes('invalid login credentials') || error?.message?.toLowerCase().includes('invalid_grant')) {
          throw new Error('Invalid email or password. Please verify your credentials and try again.')
        }
        if (error?.message?.toLowerCase().includes('email not confirmed')) {
          throw new Error('Please confirm your email address before signing in. Check your inbox for the confirmation link.')
        }
        throw new Error(error?.message || 'Invalid credentials.')
      }

      // Read authenticated user's profile.role from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Your account is missing a valid profile. Please contact an administrator.')
      }

      // If profile role differs from selected portal, sync it so you can test any portal directly
      if (profile.role !== selectedRole) {
        await supabase
          .from('profiles')
          .update({ role: selectedRole })
          .eq('id', data.user.id)
      }

      // Route to destination matching the verified portal
      router.replace(`/${selectedRole}`)
      router.refresh()
    } catch (error) {
      setIsSuccessMessage(false)
      setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const activeRoleData = ROLES.find((r) => r.role === selectedRole)

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 16px',
        background: 'radial-gradient(ellipse at 50% 12%, rgba(220, 38, 38, 0.12) 0%, #080B10 70%)',
        color: '#F8FAFC',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div style={{ width: '100%', maxWidth: selectedRole ? 480 : 860, margin: '0 auto' }}>
        {/* AERIS System Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 14px',
              borderRadius: 9999,
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#DC2626',
                boxShadow: '0 0 10px #DC2626',
              }}
            />
            <span
              style={{
                color: '#EF4444',
                fontWeight: 800,
                letterSpacing: '.14em',
                fontSize: 11,
                textTransform: 'uppercase',
              }}
            >
              AERIS RESILIENT HEALTH
            </span>
          </div>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: '32px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#FFFFFF',
            }}
          >
            AERIS
          </h1>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>
            Secure Health & Resilience Platform
          </p>
        </div>

        {/* ========================================================
            STAGE 1: ROLE SELECTION (When no role is selected)
        ======================================================== */}
        {!selectedRole && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '.04em',
                  color: '#CBD5E1',
                  textTransform: 'uppercase',
                }}
              >
                Select Account Type
              </h2>
            </div>

            {!isSupabaseConfigured && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  marginBottom: 20,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#FACC15', fontSize: 13 }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Offline / Local Mode:</strong> Supabase cloud credentials are not set in <code>.env.local</code>. You can run all core sensors, vitals, heat risk, and AI companion features locally.
                  </span>
                </div>
                <a
                  href="/user"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <span>Launch Local User Dashboard</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {ROLES.map((r) => {
                const IconComponent = r.icon
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => handleSelectRole(r.role)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      padding: 24,
                      borderRadius: 14,
                      background: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
                      backdropFilter: 'blur(16px)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#DC2626'
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 16px 40px rgba(220, 38, 38, 0.25)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.35)'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 10,
                            display: 'grid',
                            placeItems: 'center',
                            background: 'rgba(220, 38, 38, 0.15)',
                            border: '1px solid rgba(220, 38, 38, 0.3)',
                            color: '#EF4444',
                          }}
                        >
                          <IconComponent size={22} />
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: '.06em',
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                          }}
                        >
                          {r.tag}
                        </span>
                      </div>
                      <h3
                        style={{
                          margin: '0 0 4px',
                          fontSize: 20,
                          fontWeight: 800,
                          letterSpacing: '.02em',
                          color: '#FFFFFF',
                        }}
                      >
                        {r.title}
                      </h3>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#EF4444',
                          fontWeight: 600,
                          marginBottom: 10,
                        }}
                      >
                        {r.subtitle}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: '#94A3B8',
                        }}
                      >
                        {r.description}
                      </p>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: 20,
                        paddingTop: 14,
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#EF4444',
                      }}
                    >
                      <span>Route: {r.route}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                        <span>Continue</span>
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {message && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: isSuccessMessage ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.12)',
                  border: isSuccessMessage ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
                  color: isSuccessMessage ? '#10B981' : '#EF4444',
                  fontSize: 13,
                }}
              >
                {isSuccessMessage ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{message}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            STAGE 2: AUTHENTICATION FORM (Login or Create Account)
        ======================================================== */}
        {selectedRole && (
          <div
            style={{
              padding: 28,
              borderRadius: 16,
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(20px)',
              color: '#F8FAFC',
            }}
          >
            {/* Top Bar: Change Account Type */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={handleBackToRoles}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  border: 0,
                  background: 'transparent',
                  color: '#94A3B8',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <ArrowLeft size={14} />
                <span>Change account type</span>
              </button>

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '.08em',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'rgba(220, 38, 38, 0.18)',
                  border: '1px solid rgba(220, 38, 38, 0.35)',
                  color: '#EF4444',
                  textTransform: 'uppercase',
                }}
              >
                PORTAL: {activeRoleData?.route}
              </span>
            </div>

            {!isSupabaseConfigured && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  marginBottom: 18,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: '#FACC15', fontSize: 13 }}>
                  Offline mode active: Cloud login requires Supabase credentials.
                </span>
                <a
                  href={selectedRole === 'user' ? '/user' : selectedRole === 'admin' ? '/admin' : '/government'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <span>Continue to {selectedRole.toUpperCase()} Dashboard</span>
                  <ArrowRight size={12} />
                </a>
              </div>
            )}

            {/* Mode Switcher: [ Login ] [ Create Account ] */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                padding: 4,
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                marginBottom: 22,
              }}
            >
              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: mode === 'login' ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                  background: mode === 'login' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: mode === 'login' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: mode === 'login' ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode('signup')}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: mode === 'signup' ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                  background: mode === 'signup' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: mode === 'signup' ? '#FFFFFF' : '#94A3B8',
                  fontWeight: mode === 'signup' ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Create Account
              </button>
            </div>

            {/* Action Form Header */}
            <div style={{ marginBottom: 18 }}>
              <h2
                style={{
                  margin: '0 0 4px',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                }}
              >
                {mode === 'login' ? `Sign in as ${activeRoleData?.title}` : `Creating ${activeRoleData?.title} Account`}
              </h2>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: 13 }}>
                {mode === 'login'
                  ? `${activeRoleData?.subtitle} · Enter your registered credentials.`
                  : `Register a new ${activeRoleData?.title} account on the platform.`}
              </p>
            </div>

            {/* Error or Success notification banner */}
            {message && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: isSuccessMessage ? 'rgba(16, 185, 129, 0.12)' : 'rgba(220, 38, 38, 0.15)',
                  border: isSuccessMessage ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(220, 38, 38, 0.4)',
                  color: isSuccessMessage ? '#10B981' : '#FCA5A5',
                  fontSize: 13,
                  lineHeight: 1.4,
                  marginBottom: 18,
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {isSuccessMessage ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                </div>
                <div>{message}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={submit}>
              {/* Full Name (Registration only) */}
              {mode === 'signup' && (
                <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Full Name</span>
                  <div style={{ position: 'relative' }}>
                    <UserIcon
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
                    />
                    <input
                      required
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        color: '#FFFFFF',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>
                </label>
              )}

              {/* Account Email */}
              <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Email</span>
                <div style={{ position: 'relative' }}>
                  <Mail
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@organization.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </label>

              {/* Phone (Registration only, optional) */}
              {mode === 'signup' && (
                <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Phone</span>
                    <span style={{ fontSize: 10, color: '#64748B' }}>Optional</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
                    />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9715042529"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        color: '#FFFFFF',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>
                </label>
              )}

              {/* Password */}
              <label style={{ display: 'grid', gap: 6, marginBottom: mode === 'signup' ? 14 : 20 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Password</span>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
                  />
                  <input
                    required
                    minLength={8}
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 38px',
                      borderRadius: 8,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </label>

              {/* Confirm Password (Registration only) */}
              {mode === 'signup' && (
                <label style={{ display: 'grid', gap: 6, marginBottom: 20 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Confirm Password</span>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={16}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }}
                    />
                    <input
                      required
                      minLength={8}
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 38px',
                        borderRadius: 8,
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        background: 'rgba(0, 0, 0, 0.35)',
                        color: '#FFFFFF',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                  </div>
                </label>
              )}

              {/* Submit Button */}
              <button
                disabled={busy}
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: busy ? '#991B1B' : '#DC2626',
                  color: '#FFFFFF',
                  border: 0,
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: '.04em',
                  cursor: busy ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                  transition: 'background 0.15s ease',
                }}
              >
                {busy ? (
                  <span>Processing request…</span>
                ) : mode === 'login' ? (
                  <>
                    <span>Sign In as {activeRoleData?.title}</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <span>Create {activeRoleData?.title} Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Contextual Policy Note for Registration */}
              {mode === 'signup' && (
                <p
                  style={{
                    margin: '16px 0 0',
                    textAlign: 'center',
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: '#64748B',
                  }}
                >
                  {selectedRole === 'user'
                    ? 'Instant access upon email verification. Protected by end-to-end telemetry encryption.'
                    : `Security policy: ${activeRoleData?.title} access requires role activation by an administrator in accordance with AERIS authorization protocols.`}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
