import { AerisDashboard } from '@/components/AerisDashboard'
import { requireRole } from '@/lib/auth'

export default async function UserDashboardPage() {
  await requireRole('user')
  return <AerisDashboard />
}
