import Link from 'next/link'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'radial-gradient(ellipse at 50% 20%, rgba(220, 38, 38, 0.15) 0%, #080B10 70%)',
        color: '#F8FAFC',
        fontFamily: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 480,
          textAlign: 'center',
          padding: 36,
          borderRadius: 16,
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            color: '#EF4444',
            margin: '0 auto 20px',
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.12em',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'rgba(220, 38, 38, 0.2)',
            color: '#EF4444',
            textTransform: 'uppercase',
          }}
        >
          403 · Authorization Restriction
        </span>

        <h1
          style={{
            margin: '16px 0 8px',
            fontSize: 24,
            fontWeight: 800,
            color: '#FFFFFF',
          }}
        >
          Access Denied
        </h1>

        <p
          style={{
            margin: '0 0 24px',
            fontSize: 14,
            lineHeight: 1.5,
            color: '#94A3B8',
          }}
        >
          Your authenticated account does not have permission to access this dashboard. Each portal requires an authorized role (USER, ADMIN, or GOVERNMENT).
        </p>

        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '11px 20px',
            background: '#DC2626',
            color: '#FFFFFF',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
            transition: 'background 0.15s ease',
          }}
        >
          <ArrowLeft size={16} />
          <span>Return to Role Selection & Sign in</span>
        </Link>
      </section>
    </main>
  )
}
