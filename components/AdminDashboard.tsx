'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { FileText, Hourglass, Loader2, ShieldCheck, Siren, UserCog, Users } from 'lucide-react'
import { PortalShell } from '@/components/PortalShell'
import { RequestQueue, type AdminRequest } from '@/components/admin/RequestQueue'
import { PageHeader } from '@/components/ui/page-header'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field, Input, Select } from '@/components/ui/field'
import { useToast } from '@/components/ui/toast'
import { AnimatedNumber } from '@/components/ui/animated-number'

type Role = 'user' | 'admin' | 'government'

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: 'user', label: 'Personal', description: 'Own health dashboard and SOS' },
  { value: 'government', label: 'Government', description: 'Anonymised incident feed' },
  { value: 'admin', label: 'Admin', description: 'Full access, including role changes' },
]

type Counts = { users: number; requests: number; alerts: number; pending: number }

export function AdminDashboard({
  profile,
  counts,
  requests,
  live,
}: {
  profile: { full_name: string; role: 'admin' }
  counts: Counts
  requests: AdminRequest[]
  live: boolean
}) {
  return (
    <PortalShell portal="Admin console" role="admin" name={profile.full_name}>
      <AdminContent counts={counts} requests={requests} live={live} />
    </PortalShell>
  )
}

function AdminContent({ counts, requests, live }: { counts: Counts; requests: AdminRequest[]; live: boolean }) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('user')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const stats = [
    { label: 'Pending review', value: counts.pending, icon: Hourglass },
    { label: 'Registered users', value: counts.users, icon: Users },
    { label: 'Emergency requests', value: counts.requests, icon: Siren },
    { label: 'Risk alerts', value: counts.alerts, icon: FileText },
  ]

  const submit = () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Enter a valid email address, like name@example.com.')
      return
    }
    setError(null)
    if (role === 'admin') setConfirmOpen(true)
    else void assignRole()
  }

  const assignRole = async () => {
    setConfirmOpen(false)
    setLoading(true)
    try {
      const response = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ tone: 'success', title: 'Role updated', description: `${data.email} is now ${ROLE_OPTIONS.find((r) => r.value === data.role)?.label ?? data.role}.` })
        setEmail('')
      } else {
        setError(data.error || 'Role update failed.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader title="Admin console" description="Manage accounts and monitor emergency activity across AERIS." />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4" aria-label="Overview">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <Card className="flex items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-surface-2 text-fg-2">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-mono text-3xl font-light tracking-tight text-fg tabular-nums">
                  <AnimatedNumber value={value} />
                </p>
                <p className="text-eyebrow text-fg-muted uppercase">{label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </section>

      <div className="mt-5">
        <RequestQueue initialRequests={requests} live={live} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5">
        <Card className="p-5 md:p-6 lg:col-span-3">
          <CardHeader title="Change an account’s role" description="Grant or remove government and admin access for an existing account." icon={<UserCog className="size-4" />} />
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
            noValidate
          >
            <Field label="Account email" htmlFor="role-email">
              <Input
                id="role-email"
                type="email"
                autoComplete="off"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (error) setError(null)
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'role-email-error' : undefined}
              />
            </Field>
            {error && (
              <p id="role-email-error" role="alert" className="-mt-2 text-sm text-danger">
                {error}
              </p>
            )}
            <Field label="New role" htmlFor="role-select" hint={ROLE_OPTIONS.find((r) => r.value === role)?.description}>
              <Select id="role-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Update role
              </Button>
            </div>
          </form>
        </Card>

        <Card className="p-5 md:p-6 lg:col-span-2">
          <CardHeader title="Role permissions" />
          <ul className="mt-4 grid gap-3">
            {ROLE_OPTIONS.map((r) => (
              <li key={r.value} className="rounded-xl border border-line p-3.5">
                <p className="text-sm font-semibold text-fg">{r.label}</p>
                <p className="mt-0.5 text-sm text-fg-2">{r.description}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Grant admin access?"
        description={`${email.trim()} will be able to change any account’s role, including yours.`}
        size="sm"
      >
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setConfirmOpen(false)} data-autofocus>
            Cancel
          </Button>
          <Button variant="danger" onClick={assignRole}>
            Grant admin
          </Button>
        </div>
      </Dialog>
    </>
  )
}
