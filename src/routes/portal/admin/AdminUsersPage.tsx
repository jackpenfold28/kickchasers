import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Shield, UserRound } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import { listAdminProfiles, type AdminProfileRow } from '@/lib/portal-admin'
import { setPlatformAdminStatus } from '@/lib/platform-admin'
import { AdminActionButton, EmptyState, formatDateTime, SectionHeading } from './admin-ui'

function roleLabel(value: string | null) {
  if (!value) return 'Role pending'
  return value.replace(/_/g, ' ')
}

function avatarInitial(user: AdminProfileRow) {
  return (user.name || user.handle || 'U').slice(0, 1).toUpperCase()
}

function formatHandle(handle: string | null) {
  if (!handle) return 'Handle pending'
  return handle.startsWith('@') ? handle : `@${handle}`
}

function userContext(user: AdminProfileRow) {
  const location = user.stateCode || 'State pending'
  const club = user.clubName || 'Club pending'
  const league = user.leagueShortName || user.leagueName || 'League pending'
  return `${location} • ${club} • ${league}`
}

type Filters = {
  search: string
  onboarding: 'all' | 'complete' | 'incomplete'
  adminStatus: 'all' | 'admins' | 'non-admins'
  state: string
  league: string
  club: string
  sort: 'newest' | 'oldest'
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [allRows, setAllRows] = useState<AdminProfileRow[]>([])
  const [filters, setFilters] = useState<Filters>({
    search: '',
    onboarding: 'all',
    adminStatus: 'all',
    state: '',
    league: '',
    club: '',
    sort: 'newest',
  })

  async function loadPage() {
    setLoading(true)
    try {
      const next = await listAdminProfiles()
      setAllRows(next)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load profiles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [])

  const filterOptions = useMemo(() => {
    const stateValues = Array.from(new Set(allRows.map((row) => row.stateCode).filter(Boolean))) as string[]
    const leagueValues = Array.from(
      new Set(allRows.map((row) => row.leagueShortName || row.leagueName).filter(Boolean))
    ) as string[]
    const clubValues = Array.from(new Set(allRows.map((row) => row.clubName).filter(Boolean))) as string[]

    return {
      states: stateValues.sort(),
      leagues: leagueValues.sort(),
      clubs: clubValues.sort(),
    }
  }, [allRows])

  const rows = useMemo(() => {
    const search = filters.search.trim().toLowerCase()

    let next = [...allRows]

    if (search) {
      next = next.filter((row) => (row.name || '').toLowerCase().includes(search) || (row.handle || '').toLowerCase().includes(search))
    }

    if (filters.onboarding === 'complete') {
      next = next.filter((row) => row.onboardingComplete)
    } else if (filters.onboarding === 'incomplete') {
      next = next.filter((row) => !row.onboardingComplete)
    }

    if (filters.adminStatus === 'admins') {
      next = next.filter((row) => row.isPlatformAdmin)
    } else if (filters.adminStatus === 'non-admins') {
      next = next.filter((row) => !row.isPlatformAdmin)
    }

    if (filters.state) {
      next = next.filter((row) => row.stateCode === filters.state)
    }

    if (filters.league) {
      next = next.filter((row) => (row.leagueShortName || row.leagueName) === filters.league)
    }

    if (filters.club) {
      next = next.filter((row) => row.clubName === filters.club)
    }

    next.sort((a, b) => {
      const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return filters.sort === 'oldest' ? left - right : right - left
    })

    return next
  }, [allRows, filters])

  async function handleToggle(user: AdminProfileRow) {
    setBusyUserId(user.userId)
    try {
      await setPlatformAdminStatus(user.userId, !user.isPlatformAdmin)
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update platform admin access.')
    } finally {
      setBusyUserId(null)
    }
  }

  return (
    <section className="grid gap-6">
      <PortalCard className="overflow-hidden border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.14),transparent_30%),linear-gradient(135deg,#0B1324,#0E172A_58%,#111E33)] p-6 sm:p-7">
        <SectionHeading
          eyebrow="Admin / Users"
          title="Product profiles"
          description="Review signed-up KickChasers profiles, filter the directory context, and manage platform admin access without leaving the portal flow."
          actions={
            <Link to="/admin" className="teams-action-chip inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to overview
            </Link>
          }
        />
        <div className="mt-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300">
          <Shield className="h-3.5 w-3.5 text-[#9CE8BE]" />
          Profiles only. Auth users still sit outside this surface.
        </div>
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <PortalCard className="teams-section-card">
        <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9CE8BE]">Filters</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Refine the profile directory</h3>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Search by identity, narrow the onboarding and admin state, then drill into state, league, club, or sort order.
            </p>
          </div>
          <div className="admin-users-count-pill">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Visible</span>
            <span className="text-base font-semibold text-white">{rows.length}</span>
            <span className="text-sm text-slate-400">profile{rows.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <label className="admin-users-control admin-users-search">
            <Search className="h-4 w-4 text-slate-500" />
            <div className="min-w-0 flex-1">
              <span className="admin-users-control-label">Search</span>
              <input
                value={filters.search}
                onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
                placeholder="Name or handle"
                className="admin-users-control-input"
              />
            </div>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="admin-users-control">
              <span className="admin-users-control-label">Onboarding</span>
              <select
                value={filters.onboarding}
                onChange={(event) => setFilters((current) => ({ ...current, onboarding: event.target.value as Filters['onboarding'] }))}
                className="admin-users-control-select"
              >
                <option value="all">All states</option>
                <option value="complete">Complete</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </label>

            <label className="admin-users-control">
              <span className="admin-users-control-label">Admin status</span>
              <select
                value={filters.adminStatus}
                onChange={(event) => setFilters((current) => ({ ...current, adminStatus: event.target.value as Filters['adminStatus'] }))}
                className="admin-users-control-select"
              >
                <option value="all">All users</option>
                <option value="admins">Platform admins</option>
                <option value="non-admins">Standard users</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="admin-users-control">
            <span className="admin-users-control-label">State</span>
            <select
              value={filters.state}
              onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))}
              className="admin-users-control-select"
            >
              <option value="">All states</option>
              {filterOptions.states.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="admin-users-control">
            <span className="admin-users-control-label">League</span>
            <select
              value={filters.league}
              onChange={(event) => setFilters((current) => ({ ...current, league: event.target.value }))}
              className="admin-users-control-select"
            >
              <option value="">All leagues</option>
              {filterOptions.leagues.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="admin-users-control">
            <span className="admin-users-control-label">Club</span>
            <select
              value={filters.club}
              onChange={(event) => setFilters((current) => ({ ...current, club: event.target.value }))}
              className="admin-users-control-select"
            >
              <option value="">All clubs</option>
              {filterOptions.clubs.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </label>

          <label className="admin-users-control">
            <span className="admin-users-control-label">Sort</span>
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters['sort'] }))}
              className="admin-users-control-select"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>
      </PortalCard>

      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Profiles</p>
            <h3 className="mt-1 text-xl font-black italic tracking-[-0.04em] text-white">Admin Access Directory</h3>
            <p className="mt-1 text-sm text-slate-400">Current product profiles with onboarding, role, and platform access context.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {loading ? (
            <EmptyState label="Loading profiles…" />
          ) : rows.length ? rows.map((user) => (
            <article key={user.userId} className="admin-user-row">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <div className="admin-user-avatar">
                  {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name || 'User'} className="h-full w-full object-cover" /> : avatarInitial(user)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate text-[17px] font-semibold text-white">{user.name || 'Unnamed profile'}</h4>
                    <span className="admin-users-primary-role-pill">{roleLabel(user.primaryRole)}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-400">{formatHandle(user.handle)}</p>
                  <p className="mt-2 truncate text-sm text-slate-500">{userContext(user)}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="admin-users-meta-pill">
                      <span className="admin-users-meta-label">Created</span>
                      {formatDateTime(user.createdAt)}
                    </span>
                    <span className={`admin-users-meta-pill ${user.onboardingComplete ? 'admin-users-meta-pill--accent' : ''}`}>
                      <span className="admin-users-meta-label">Onboarding</span>
                      {user.onboardingComplete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-user-side">
                <div className="admin-user-side-summary">
                  <div className="admin-user-badge-stack">
                    <span className={`admin-users-status-badge ${user.isPlatformAdmin ? 'admin-users-status-badge--admin' : 'admin-users-status-badge--standard'}`}>
                      {user.isPlatformAdmin ? (
                        <>
                          <Shield className="h-3.5 w-3.5" />
                          Platform admin
                        </>
                      ) : (
                        <>
                          <UserRound className="h-3.5 w-3.5" />
                          Standard user
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-right text-xs uppercase tracking-[0.18em] text-slate-500">Access</p>
                </div>

                <div className="admin-user-action-row">
                  <AdminActionButton
                    onClick={() => void handleToggle(user)}
                    disabled={busyUserId === user.userId}
                    tone={user.isPlatformAdmin ? 'danger' : 'primary'}
                  >
                    {user.isPlatformAdmin ? 'Remove admin' : 'Grant admin'}
                  </AdminActionButton>
                </div>
              </div>
            </article>
          )) : (
            <EmptyState label="No profiles match the current filters." />
          )}
        </div>
      </section>
    </section>
  )
}
