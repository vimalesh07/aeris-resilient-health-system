import { Suspense } from 'react'
import { AuthForm } from '@/components/AuthForm'

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080B10' }} />}>
      <AuthForm />
    </Suspense>
  )
}
