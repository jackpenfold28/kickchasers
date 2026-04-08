import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Radio, Search } from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import GameLogCard from '@/components/portal/games/GameLogCard'
import {
  followLeague,
  loadMatchDaySnapshot,
  searchActiveLeagues,
  unfollowLeague,
  type MatchDayGame,
  type MatchDayLeague,
} from '@/lib/portal-match-day'
import { supabase } from '@/lib/supabase'

function monogram(label: string | null | undefined) {
  const cleaned = String(label || '').trim()
  if (!cleaned) return 'KC'
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function leagueLabel(league: Pick<MatchDayLeague, 'shortName' | 'name'>) {
  return league.shortName || league.name || 'League'
}

function formatSectionCount(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

function LeagueBadge({ league, className }: { league: Pick<MatchDayLeague, 'logoUrl' | 'shortName' | 'name'>; className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] ${className || ''}`}>
      {league.logoUrl ? (
        <img src={league.logoUrl} alt={leagueLabel(league)} className="h-full w-full object-cover" />
      ) : (
        <span className="text-[11px] font-black tracking-[0.08em] text-slate-100">{monogram(leagueLabel(league))}</span>
      )}
    </span>
  )
}

function MatchDayModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[30px] border border-white/10 bg-[#0B1324] shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/8 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9CE8BE]">League Follows</p>
              <h2 className="mt-2 text-xl font-black italic tracking-[-0.04em] text-white sm:text-2xl">{title}</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

function SectionHeader({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string
  title: string
  meta?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{eyebrow}</p>
        <h2 className="mt-1 text-[1.45rem] font-black italic tracking-[-0.05em] text-white sm:text-[1.7rem]">{title}</h2>
      </div>
      {meta ? <p className="text-sm text-slate-500">{meta}</p> : null}
    </div>
  )
}

export default function MatchDayPage() {
  const navigate = useNavigate()

  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [followedLeagues, setFollowedLeagues] = useState<MatchDayLeague[]>([])
  const [liveGames, setLiveGames] = useState<MatchDayGame[]>([])
  const [recentGames, setRecentGames] = useState<MatchDayGame[]>([])
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null)

  const [followModalOpen, setFollowModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<MatchDayLeague[]>([])
  const [togglingLeagueId, setTogglingLeagueId] = useState<string | null>(null)

  async function refreshMatchDay(uid: string, options?: { preferredLeagueId?: string | null; allowHomeAutoSelect?: boolean }) {
    const snapshot = await loadMatchDaySnapshot(uid)

    setFollowedLeagues(snapshot.followedLeagues)
    setLiveGames(snapshot.liveGames)
    setRecentGames(snapshot.recentGames)

    const preferredLeagueId = options?.preferredLeagueId
    const validSelectedLeagueId = preferredLeagueId && snapshot.followedLeagues.some((league) => league.id === preferredLeagueId)
      ? preferredLeagueId
      : null

    if (validSelectedLeagueId) {
      setSelectedLeagueId(validSelectedLeagueId)
      return
    }

    if (options?.allowHomeAutoSelect !== false && snapshot.homeLeagueId && snapshot.followedLeagues.some((league) => league.id === snapshot.homeLeagueId)) {
      setSelectedLeagueId(snapshot.homeLeagueId)
      return
    }

    setSelectedLeagueId(null)
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data.user

        if (!user) {
          navigate('/sign-in', { replace: true })
          return
        }

        if (cancelled) return
        setUserId(user.id)
        await refreshMatchDay(user.id, { allowHomeAutoSelect: true })
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load Match Day.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    if (!followModalOpen) return

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true)
        setSearchError(null)
        const results = await searchActiveLeagues(searchQuery)
        if (!cancelled) {
          setSearchResults(results)
        }
      } catch (loadError) {
        if (!cancelled) {
          setSearchError(loadError instanceof Error ? loadError.message : 'Unable to search leagues.')
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false)
        }
      }
    }, 180)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [followModalOpen, searchQuery])

  const followedLeagueIdSet = useMemo(() => new Set(followedLeagues.map((league) => league.id)), [followedLeagues])

  const filteredLive = useMemo(
    () => (selectedLeagueId ? liveGames.filter((game) => game.leagueId === selectedLeagueId) : liveGames),
    [liveGames, selectedLeagueId]
  )

  const filteredRecent = useMemo(
    () => (selectedLeagueId ? recentGames.filter((game) => game.leagueId === selectedLeagueId) : recentGames),
    [recentGames, selectedLeagueId]
  )

  const selectedLeague = useMemo(
    () => followedLeagues.find((league) => league.id === selectedLeagueId) ?? null,
    [followedLeagues, selectedLeagueId]
  )

  async function handleLeagueToggle(leagueId: string, isFollowing: boolean) {
    if (!userId) return

    const nextPreferredLeagueId = isFollowing && selectedLeagueId === leagueId ? null : selectedLeagueId

    try {
      setTogglingLeagueId(leagueId)
      setError(null)
      setSearchError(null)

      if (isFollowing) {
        await unfollowLeague(userId, leagueId)
      } else {
        await followLeague(userId, leagueId)
      }

      await refreshMatchDay(userId, { preferredLeagueId: nextPreferredLeagueId, allowHomeAutoSelect: false })
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Unable to update league follow.'
      setError(message)
      setSearchError(message)
    } finally {
      setTogglingLeagueId(null)
    }
  }

  async function handleManualRefresh() {
    if (!userId) return
    try {
      setRefreshing(true)
      setError(null)
      await refreshMatchDay(userId, { preferredLeagueId: selectedLeagueId, allowHomeAutoSelect: false })
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to refresh Match Day.')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading Match Day…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard className="overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(57,255,136,0.14),transparent_30%),linear-gradient(180deg,rgba(16,26,42,0.96)_0%,rgba(9,16,28,0.98)_100%)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9CE8BE]">Scoreboard Surface</p>
            <h1 className="mt-2 text-[1.85rem] font-black italic leading-none tracking-[-0.06em] text-white sm:text-[2.2rem]">
              Match Day
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Followed leagues drive this page. Live tracked games land first, recent finals sit underneath, and the same league filter controls both.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[480px]">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Followed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{followedLeagues.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live Now</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                <Radio className="h-4 w-4 text-[#39FF88]" />
                {filteredLive.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFollowModalOpen(true)}
              className="rounded-[22px] border border-[#39FF88]/24 bg-[#39FF88]/10 px-4 py-3 text-left transition hover:border-[#39FF88]/38 hover:bg-[#39FF88]/14"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8FFD5]">League Follows</p>
              <p className="mt-2 text-sm font-semibold text-white">Add or manage leagues</p>
            </button>
          </div>
        </div>
      </PortalCard>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">League Filter</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Followed leagues</h2>
          </div>
          <button
            type="button"
            onClick={() => void handleManualRefresh()}
            disabled={refreshing}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedLeagueId(null)}
            className={`inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedLeagueId == null
                ? 'border-[#39FF88]/40 bg-[#39FF88]/12 text-white shadow-[0_10px_28px_-18px_rgba(57,255,136,0.9)]'
                : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <span className="text-[11px] font-black uppercase tracking-[0.16em]">All</span>
          </button>

          {followedLeagues.map((league) => {
            const active = selectedLeagueId === league.id
            return (
              <button
                key={league.id}
                type="button"
                onClick={() => setSelectedLeagueId(league.id)}
                className={`inline-flex min-h-[48px] shrink-0 items-center gap-3 rounded-full border px-3.5 py-2 text-left transition ${
                  active
                    ? 'border-[#39FF88]/42 bg-[#39FF88]/12 text-white shadow-[0_10px_28px_-18px_rgba(57,255,136,0.9)]'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <LeagueBadge league={league} className="h-8 w-8" />
                <span className="min-w-0">
                  <span className="block whitespace-nowrap text-sm font-semibold">{leagueLabel(league)}</span>
                  <span className="block whitespace-nowrap text-[11px] uppercase tracking-[0.16em] text-slate-500">{league.stateCode || 'League'}</span>
                </span>
              </button>
            )
          })}

          <button
            type="button"
            onClick={() => setFollowModalOpen(true)}
            className="inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full border border-dashed border-white/14 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <Plus className="h-4 w-4 text-[#39FF88]" />
            Follow league
          </button>
        </div>
      </section>

      {error ? (
        <PortalCard className="border-red-400/25 bg-red-500/10">
          <p className="text-sm text-red-100">{error}</p>
        </PortalCard>
      ) : null}

      {!followedLeagues.length ? (
        <PortalCard className="border-dashed bg-white/[0.03]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">No followed leagues</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Start with the leagues you actually want to track.</h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Match Day is follow-first. Add a league to populate the live scoreboard surface and recent finals.
              </p>
            </div>
            <button type="button" onClick={() => setFollowModalOpen(true)} className="btn btn-secondary w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4 text-[#39FF88]" />
              Follow a league
            </button>
          </div>
        </PortalCard>
      ) : (
        <>
          {filteredLive.length ? (
            <section className="grid gap-4">
              <SectionHeader eyebrow="Live First" title="Live now" meta={formatSectionCount(filteredLive.length, 'game')} />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredLive.map((game) => (
                  <GameLogCard key={game.id} row={game} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-4">
            <SectionHeader
              eyebrow="Recent Finals"
              title={selectedLeague ? `${leagueLabel(selectedLeague)} recent` : 'Recent'}
              meta={formatSectionCount(filteredRecent.length, 'game')}
            />

            {filteredRecent.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredRecent.map((game) => (
                  <GameLogCard key={game.id} row={game} />
                ))}
              </div>
            ) : (
              <PortalCard className="border-dashed bg-white/[0.03]">
                <p className="text-sm text-slate-400">
                  {selectedLeague
                    ? `No recent tracked finals are available for ${leagueLabel(selectedLeague)} in the current window.`
                    : 'No recent tracked finals are available for your followed leagues yet.'}
                </p>
              </PortalCard>
            )}
          </section>
        </>
      )}

      <MatchDayModal
        open={followModalOpen}
        onClose={() => setFollowModalOpen(false)}
        title="Follow leagues"
        subtitle="Search active leagues by name, short name, or state, then follow or unfollow inline without leaving Match Day."
      >
        <div className="grid gap-4">
          <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-white/18 focus-within:bg-white/[0.07]">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search leagues or state code"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>

          {searchError ? (
            <div className="rounded-[22px] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{searchError}</div>
          ) : null}

          {searchLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-[88px] animate-pulse rounded-[24px] border border-white/6 bg-white/[0.04]" />
              ))}
            </div>
          ) : searchResults.length ? (
            <div className="grid gap-3">
              {searchResults.map((league) => {
                const isFollowing = followedLeagueIdSet.has(league.id)
                const isWorking = togglingLeagueId === league.id

                return (
                  <div
                    key={league.id}
                    className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <LeagueBadge league={league} className="h-14 w-14 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">{league.name || 'League'}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {[league.shortName, league.stateCode].filter(Boolean).join(' • ') || 'Active league'}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                          {league.clubCount > 0 ? formatSectionCount(league.clubCount, 'club') : 'Club count unavailable'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleLeagueToggle(league.id, isFollowing)}
                      disabled={isWorking}
                      className={`inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        isFollowing
                          ? 'border border-[#39FF88]/28 bg-[#39FF88]/10 text-[#D8FFE8] hover:bg-[#39FF88]/16'
                          : 'border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]'
                      }`}
                    >
                      {isWorking ? 'Saving…' : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
              No active leagues match that search yet.
            </div>
          )}
        </div>
      </MatchDayModal>
    </section>
  )
}
