import { redirect } from 'next/navigation'
import { getAuthContext } from '@/lib/auth'

export default async function HomePage() {
  const context = await getAuthContext()
  if (!context) redirect('/login')
  redirect(`/${context.profile.role}`)
}
