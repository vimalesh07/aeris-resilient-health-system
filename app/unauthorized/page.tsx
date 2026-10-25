import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-6">
      <section className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-md">
        <svg viewBox="0 0 320 60" className="mx-auto h-12 w-full max-w-xs" aria-hidden>
          <path d="M0 30 H120 L130 30 L136 14 L142 44 L148 30 H320" fill="none" stroke="var(--border-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M160 30 H320" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <p className="mt-5 font-mono text-xs font-medium text-fg-muted">ERROR 403</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">You don’t have access to this portal</h1>
        <p className="mt-2 text-sm text-fg-2">
          Your account isn’t allowed to open this portal. Go back to your own dashboard, or ask an AERIS admin to change your role.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] bg-brand px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-hover">
            <Home className="size-4" aria-hidden /> My dashboard
          </Link>
          <Link href="/login" className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-line px-4 text-sm font-semibold text-fg hover:bg-surface-2">
            <ArrowLeft className="size-4" aria-hidden /> Sign in again
          </Link>
        </div>
      </section>
    </main>
  )
}
