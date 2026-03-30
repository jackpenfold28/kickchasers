import { NavLink } from 'react-router-dom'
import { type ComponentType } from 'react'
import {
  Bell,
  ChartNoAxesCombined,
  Gamepad2,
  LayoutDashboard,
  Settings,
  Shield,
  SquareUserRound,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'

type SidebarNavigationProps = {
  isAdmin: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

type NavItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Squads', path: '/squads', icon: UsersRound },
  { label: 'Games', path: '/games', icon: Gamepad2 },
  { label: 'Stats', path: '/stats', icon: ChartNoAxesCombined },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Profile', path: '/profile', icon: SquareUserRound },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Admin', path: '/admin', icon: Shield, adminOnly: true },
]

function Item({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
          isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#39FF88]" />}
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function SidebarNavigation({ isAdmin, mobileOpen, onCloseMobile }: SidebarNavigationProps) {
  const items = NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : true))

  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[240px] border-r border-white/10 bg-[#081225] px-4 py-5 transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-8 flex flex-col items-center px-2 text-center">
          <img src="/kickchasers_logo.png" alt="KickChasers" className="h-14 w-auto object-contain" />
          <h1 className="mt-2 text-[10px] font-light uppercase tracking-[0.3em] text-slate-400">Web Portal</h1>
        </div>

        <nav className="space-y-1">
          {items.map((item) => (
            <Item key={item.path} item={item} onNavigate={onCloseMobile} />
          ))}
        </nav>
      </aside>
    </>
  )
}
