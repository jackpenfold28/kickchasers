import { type CSSProperties, useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import SidebarNavigation from '@/components/layout/SidebarNavigation'
import { fetchPlatformAdminStatus } from '@/lib/platform-admin'

type ProfileSummary = {
  name: string | null
  handle: string | null
  avatar_url: string | null
  avatar_path: string | null
  primary_role: string | null
  game_day_roles: string[] | null
}

function resolveAvatarUrl(profile: ProfileSummary | null): string | null {
  if (!profile) return null
  if (profile.avatar_url) return profile.avatar_url
  if (!profile.avatar_path) return null

  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(profile.avatar_path)
  return data.publicUrl || null
}

const SIDEBAR_PREFERENCE_KEY = 'kickchasers.portal.sidebar-collapsed'

export default function PortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const [checkingRole, setCheckingRole] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayName, setDisplayName] = useState('User')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY) === 'true'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(SIDEBAR_PREFERENCE_KEY, String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        if (!cancelled) setCheckingRole(false)
        return
      }

      const [profileRes, adminStatus] = await Promise.all([
        supabase
          .from('profiles')
          .select('name,handle,avatar_url,avatar_path,primary_role,game_day_roles')
          .eq('user_id', user.id)
          .maybeSingle(),
        fetchPlatformAdminStatus(user.id),
      ])

      if (cancelled) return

      const profile = (profileRes.data as ProfileSummary | null) ?? null
      const canAccessAdmin = adminStatus.isAdmin

      setIsAdmin(canAccessAdmin)
      setDisplayName(profile?.name || profile?.handle || user.email || 'User')
      setAvatarUrl(resolveAvatarUrl(profile))
      setCheckingRole(false)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!checkingRole && isAdminRoute && !isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [checkingRole, isAdmin, isAdminRoute, navigate])

  const openSettings = () => navigate('/settings')
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  if (checkingRole) {
    return <main className="min-h-screen p-6 app-bg">Loading portal…</main>
  }

  if (isAdminRoute && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div
      className="min-h-screen bg-[#070F1E] text-slate-100"
      style={
        {
          '--portal-sidebar-width': `${sidebarCollapsed ? 96 : 240}px`,
        } as CSSProperties
      }
    >
      <SidebarNavigation
        isAdmin={isAdmin}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileOpen}
        displayName={displayName}
        avatarUrl={avatarUrl}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={() => setSidebarCollapsed((value) => !value)}
        onOpenProfile={() => navigate('/profile')}
        onOpenSettings={openSettings}
        onLogout={logout}
      />

      <div
        className={clsx(
          'min-w-0 lg:ml-[var(--portal-sidebar-width)] lg:w-[calc(100%-var(--portal-sidebar-width))] transition-[margin,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]'
        )}
      >
        <main className="min-w-0 px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
          <div className="mx-auto grid min-w-0 max-w-[1320px] gap-6">
            <div className="sticky top-3 z-30 flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1324]/90 px-3 py-2 backdrop-blur lg:hidden">
              <button
                type="button"
                onClick={() => setMobileOpen((value) => !value)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.95)] transition hover:bg-white/[0.08] hover:text-white"
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="min-w-0 px-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">KickChasers</p>
                <p className="truncate text-sm font-semibold text-white">Portal</p>
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/') || location.pathname.startsWith('/leagues/')
