import { NavLink } from 'react-router-dom'
import { type ComponentType, type CSSProperties, useEffect, useRef, useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  LayoutDashboard,
  Settings,
  Shield,
  UserRound,
  UsersRound,
} from 'lucide-react'
import clsx from 'clsx'
import AppAssetIcon from '@/components/icons/AppAssetIcon'

type SidebarNavigationProps = {
  isAdmin: boolean
  collapsed: boolean
  mobileOpen: boolean
  displayName: string
  avatarUrl: string | null
  onCloseMobile: () => void
  onToggleCollapsed: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onLogout: () => void | Promise<void>
}

type NavItem = {
  label: string
  path: string
  icon: ComponentType<{ className?: string; style?: CSSProperties }>
  adminOnly?: boolean
}

const MatchDayIcon: NavItem['icon'] = ({ className }) => (
  <AppAssetIcon src="/assets/icons/afl/scoreboard.svg" className={className} />
)

const LeaderboardsIcon: NavItem['icon'] = ({ className }) => (
  <AppAssetIcon src="/assets/icons/afl/cup.svg" className={className} />
)

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Match Day', path: '/match-day', icon: MatchDayIcon },
  { label: 'Teams', path: '/teams', icon: UsersRound },
  { label: 'Game Log', path: '/games', icon: History },
  { label: 'Leaderboards', path: '/stats', icon: LeaderboardsIcon },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Me', path: '/profile', icon: UserRound },
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Admin', path: '/admin', icon: Shield, adminOnly: true },
]

function Item({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  onNavigate: () => void
}) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center text-sm font-medium transition-all duration-200',
          collapsed
            ? 'mx-auto h-12 w-12 justify-center rounded-2xl text-slate-400 hover:bg-white/[0.05] hover:text-white'
            : clsx(
                'rounded-xl gap-3 px-4 py-3',
                isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              ),
          collapsed &&
            isActive &&
            'bg-white/[0.06] text-white shadow-[inset_0_0_0_1px_rgba(57,255,136,0.18),0_10px_25px_-18px_rgba(57,255,136,0.8)]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#39FF88]" />}
          <Icon
            className={clsx('shrink-0', collapsed ? 'h-[18px] w-[18px]' : 'h-4 w-4')}
            style={{
              color: isActive ? '#39FF88' : 'rgba(255,255,255,0.65)',
            }}
          />
          {!collapsed && <span>{item.label}</span>}
          {collapsed && <span className="sr-only">{item.label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function SidebarNavigation({
  isAdmin,
  collapsed,
  mobileOpen,
  displayName,
  avatarUrl,
  onCloseMobile,
  onToggleCollapsed,
  onOpenProfile,
  onOpenSettings,
  onLogout,
}: SidebarNavigationProps) {
  const items = NAV_ITEMS.filter((item) => (item.adminOnly ? isAdmin : true))
  const [menuOpen, setMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const displayInitial = (displayName || 'U').slice(0, 1).toUpperCase()

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    window.addEventListener('mousedown', onClick)
    return () => window.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [collapsed, mobileOpen])

  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-black/60 backdrop-blur-[2px] lg:hidden" onClick={onCloseMobile} aria-label="Close navigation overlay" />}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-[min(88vw,240px)] border-r border-white/10 bg-[#081225] px-4 py-5 transition-[width,transform,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-[var(--portal-sidebar-width)] lg:translate-x-0',
          collapsed ? 'lg:px-3' : 'lg:px-4',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={clsx('px-1', collapsed ? 'flex h-full flex-col' : '')}>
          <div
            className={clsx(
              'transition-[gap,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
              collapsed ? 'flex flex-col items-center gap-3 pt-1' : 'relative mb-8 px-1 pt-1'
            )}
          >
            <button
              type="button"
              onClick={onToggleCollapsed}
              className={clsx(
                'hidden lg:inline-flex items-center justify-center rounded-full text-slate-500 transition-all duration-200 hover:bg-white/[0.04] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/10',
                collapsed ? 'h-8 w-8' : 'absolute right-0 top-0 h-8 w-8'
              )}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="h-[15px] w-[15px]" /> : <ChevronLeft className="h-[15px] w-[15px]" />}
            </button>
            <button
              type="button"
              onClick={onCloseMobile}
              className="absolute right-0 top-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/[0.04] hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>

            <div className={clsx('min-w-0', collapsed ? 'flex justify-center' : 'flex flex-col items-center text-center')}>
              <img
                src="/kickchasers_logo.png"
                alt="KickChasers"
                className={clsx(
                  'w-auto object-contain transition-[height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                  collapsed ? 'h-10 opacity-95' : 'h-14'
                )}
              />

              {!collapsed && (
                <h1 className="mt-2 text-[10px] font-light uppercase tracking-[0.3em] text-slate-400">Web Portal</h1>
              )}
            </div>
          </div>

          <div
            className={clsx(
              'flex flex-col',
              collapsed ? 'flex-1 pt-10' : 'h-[calc(100%-5.5rem)]'
            )}
          >
            <div className={clsx(collapsed ? 'flex flex-1 flex-col justify-center' : '')}>
              <nav className={clsx(collapsed ? 'flex flex-col items-center gap-3' : 'space-y-1')}>
                {items.map((item) => (
                  <Item key={item.path} item={item} collapsed={collapsed} onNavigate={onCloseMobile} />
                ))}
              </nav>
            </div>

            <div className={clsx('relative', collapsed ? 'mt-10 pb-4' : 'mt-auto pb-8 pt-4')} ref={dropdownRef}>
              {!collapsed && <div className="h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />}

              <div className={clsx(collapsed ? 'flex justify-center' : 'mt-3 px-1')}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((value) => !value)}
                  title={collapsed ? `${displayName || 'User'} account menu` : undefined}
                  className={clsx(
                    'flex items-center rounded-2xl text-left transition-colors hover:bg-white/[0.04]',
                    collapsed ? 'h-12 w-12 justify-center' : 'w-full gap-3 px-2 py-2.5'
                  )}
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/10 bg-[#1A2336] text-sm font-semibold text-white shadow-[0_16px_30px_-24px_rgba(0,0,0,0.9)]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
                    ) : (
                      displayInitial
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{displayName || 'User'}</span>
                        <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-500">Account</span>
                      </span>
                      <ChevronDown
                        className={clsx(
                          'h-4 w-4 text-slate-500 transition-transform',
                          menuOpen && 'rotate-180 text-slate-300'
                        )}
                      />
                    </>
                  )}
                  {collapsed && <span className="sr-only">Open account menu</span>}
                </button>
              </div>

              {menuOpen && (
                <div
                  className={clsx(
                    'absolute overflow-hidden rounded-xl border border-white/10 bg-[#111C2F] py-1 shadow-xl',
                    collapsed ? 'bottom-0 left-[calc(100%+0.75rem)] w-44' : 'bottom-[calc(100%+0.5rem)] left-1 right-1'
                  )}
                >
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      setMenuOpen(false)
                      onCloseMobile()
                      onOpenProfile()
                    }}
                  >
                    Me
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    onClick={() => {
                      setMenuOpen(false)
                      onCloseMobile()
                      onOpenSettings()
                    }}
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-white/10"
                    onClick={() => {
                      setMenuOpen(false)
                      onCloseMobile()
                      void onLogout()
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
