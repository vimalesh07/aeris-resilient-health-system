import { notFound } from 'next/navigation'
import { UserViewRenderer } from '@/components/UserViewRenderer'
import { resolveViewId } from '@/lib/navigation'

export default async function UserViewPage({ params }: PageProps<'/user/[[...view]]'>) {
  const { view } = await params
  if (view && view.length > 1) notFound()
  const viewId = resolveViewId(view?.[0])
  if (!viewId) notFound()
  return <UserViewRenderer viewId={viewId} />
}
