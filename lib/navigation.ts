import {
  CloudSun,
  LayoutDashboard,
  LineChart,
  MapPin,
  MessageSquareText,
  Settings2,
  Waves,
  type LucideIcon,
} from 'lucide-react'

export type UserViewId = 'dashboard' | 'stress' | 'climate' | 'safe-places' | 'assistant' | 'trends' | 'settings'

export interface UserView {
  id: UserViewId
  label: string
  shortLabel: string
  description: string
  icon: LucideIcon
  group: 'monitor' | 'tools'
}

export const USER_VIEWS: UserView[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', description: 'Live vitals and overall risk', icon: LayoutDashboard, group: 'monitor' },
  { id: 'stress', label: 'Stress & recovery', shortLabel: 'Stress', description: 'Stress load, HRV and breathing', icon: Waves, group: 'monitor' },
  { id: 'climate', label: 'Climate health', shortLabel: 'Climate', description: 'Heat, humidity and air quality', icon: CloudSun, group: 'monitor' },
  { id: 'safe-places', label: 'Safe places', shortLabel: 'Safe places', description: 'Hospitals, clinics and shelters nearby', icon: MapPin, group: 'monitor' },
  { id: 'assistant', label: 'AI assistant', shortLabel: 'Assistant', description: 'Ask about your vitals and conditions', icon: MessageSquareText, group: 'tools' },
  { id: 'trends', label: 'Trends', shortLabel: 'Trends', description: 'History, movement and patterns', icon: LineChart, group: 'tools' },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', description: 'Profile, baselines, alerts and privacy', icon: Settings2, group: 'tools' },
]

const VIEW_BY_ID = new Map(USER_VIEWS.map((v) => [v.id, v]))

// Older view names that may still be passed to setActiveView.
const LEGACY_ALIASES: Record<string, UserViewId> = {
  Dashboard: 'dashboard',
  Overview: 'dashboard',
  'Stress & Well-being': 'stress',
  'Climate Health': 'climate',
  'Safe Places': 'safe-places',
  'Safe Place Finder': 'safe-places',
  'SafePlace Finder': 'safe-places',
  'AI Companion': 'assistant',
  Analytics: 'trends',
  'Health Analytics': 'trends',
  'Health History': 'trends',
  History: 'trends',
  Settings: 'settings',
}

export function resolveViewId(value: string | undefined | null): UserViewId | null {
  if (!value) return 'dashboard'
  if (VIEW_BY_ID.has(value as UserViewId)) return value as UserViewId
  return LEGACY_ALIASES[value] ?? null
}

export function getView(id: UserViewId): UserView {
  return VIEW_BY_ID.get(id) ?? USER_VIEWS[0]
}

export function viewHref(id: UserViewId): string {
  return id === 'dashboard' ? '/user' : `/user/${id}`
}

export function viewIdFromPathname(pathname: string | null): UserViewId {
  const segment = pathname?.replace(/^\/user\/?/, '').split('/')[0]
  return resolveViewId(segment || undefined) ?? 'dashboard'
}
