import { useEffect, useMemo, useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import SidebarNavigation from '@/components/layout/SidebarNavigation'
import Topbar from '@/components/layout/Topbar'

type ProfileSummary = {
  name: string | null
  handle: string | null
  avatar_url: string | null
  avatar_path: string | null
  primary_role: string | null
  game_day_roles: string[] | null
}

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/squads': 'Squads',
  '/squads/new': 'Create Squad',
  '/games': 'Games',
  '/stats': 'Stats',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/settings/update-email': 'Update Email',
  '/settings/roles': 'Role Requests',
  '/settings/blocked-users': 'Blocked Users',
  '/admin': 'Admin',
}

function resolveAvatarUrl(profile: ProfileSummary | null): string | null {
  if (!profile) return null
  if (profile.avatar_url) return profile.avatar_url
  if (!profile.avatar_path) return null

  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(profile.avatar_path)
  return data.publicUrl || null
}

export default function PortalLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const [checkingRole, setCheckingRole] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [displayName, setDisplayName] = useState('User')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user

      if (!user) {
        if (!cancelled) setCheckingRole(false)
        return
      }

      const [profileRes, adminRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('name,handle,avatar_url,avatar_path,primary_role,game_day_roles')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', user.id).maybeSingle(),
      ])

      if (cancelled) return

      const profile = (profileRes.data as ProfileSummary | null) ?? null
      const profileRoles = Array.isArray(profile?.game_day_roles) ? profile.game_day_roles : []
      const profileIsAdmin = profile?.primary_role === 'admin' || profileRoles.includes('admin')
      const tableIsAdmin = Boolean(adminRes.data?.profile_user_id)
      const canAccessAdmin = profileIsAdmin || tableIsAdmin

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
    if (!checkingRole && location.pathname === '/admin' && !isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [checkingRole, isAdmin, location.pathname, navigate])

  const openProfile = () => navigate('/profile')
  const openSettings = () => navigate('/settings')
  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/sign-in', { replace: true })
  }

  const title = useMemo(() => {
    if (TITLES[location.pathname]) return TITLES[location.pathname]
    if (location.pathname.startsWith('/squads/')) return 'Squad Workspace'
    if (location.pathname.startsWith('/games/manual/')) return 'Manual Game Summary'
    if (location.pathname.startsWith('/games/')) return 'Game Summary'
    if (location.pathname.startsWith('/settings/')) return 'Settings'
    return 'Portal'
  }, [location.pathname])

  if (checkingRole) {
    return <main className="min-h-screen p-6 app-bg">Loading portal…</main>
  }

  if (location.pathname === '/admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100">
      <SidebarNavigation isAdmin={isAdmin} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="lg:pl-[240px]">
        <Topbar
          title={title}
          displayName={displayName}
          avatarUrl={avatarUrl}
          onToggleSidebar={() => setMobileOpen((value) => !value)}
          onOpenProfile={openProfile}
          onOpenSettings={openSettings}
          onLogout={logout}
        />

        <main className="px-4 py-6 sm:px-6">
          <div className="mx-auto grid max-w-[1320px] gap-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
