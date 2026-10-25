import { AerisDashboard } from '@/components/AerisDashboard'
import { requireRole } from '@/lib/auth'

export default async function UserLayout({ children }: LayoutProps<'/user'>) {
  const context = await requireRole('user')
  return (
    <AerisDashboard account={{ name: context.profile.full_name, email: context.profile.email, role: context.profile.role, phone: context.profile.phone }}>
      {children}
    </AerisDashboard>
  )
}
