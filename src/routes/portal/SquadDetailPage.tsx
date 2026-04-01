import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Link2,
  Lock,
  MoreVertical,
  Palette,
  Share2,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import PortalCard from '@/components/cards/PortalCard'
import SquadBrandingPanel from '@/components/squads/SquadBrandingPanel'
import { supabase } from '@/lib/supabase'
import {
  addGuestPlayer,
  decideGuestMergeRequest,
  decideJoinRequest,
  deleteSquad,
  followClub,
  getClubFollowState,
  getJoinRequestStatus,
  getSquadDetail,
  getSquadMembership,
  inviteByHandle,
  isClubAdmin,
  leaveSquad,
  linkGuestMemberToUser,
  listClubRoles,
  listFollowConnections,
  listGuestMergeRequests,
  listLeagueGrades,
  listMyGuestMergeRequests,
  listPendingInvitesForSquad,
  listPendingJoinRequests,
  listSquadMembers,
  removeMember,
  requestGuestMerge,
  requestToJoinSquad,
  searchProfileByHandle,
  unfollowClub,
  updateMemberNumber,
  updateMemberPosition,
  updateSquadBranding,
  updateSquadGrade,
  type ClubRole,
  type FollowConnection,
  type GuestMergeRequest,
  type JoinRequest,
  type PendingInvite,
  type SquadDetail,
  type SquadMember,
} from '@/lib/squads'

type DetailTab = 'activity' | 'players' | 'team' | 'manage'
type PeopleTab = 'players' | 'coaches' | 'members' | 'trackers'
type TeamResultFilter = 'all' | 'wins' | 'losses'

type ClubRolePerson = {
  id: string
  userId: string | null
  name: string
  handle: string | null
  avatarUrl: string | null
  role: 'coach' | 'tracker' | 'member' | 'admin'
}

type SquadGameSummary = {
  id: string
  opponent: string | null
  opponentLogoUrl: string | null
  date: string | null
  round: number | null
  status: string | null
  trackBothTeams: boolean
  gradeId: string | null
  gradeName: string | null
  scoreHomeGoals: number
  scoreHomeBehinds: number
  scoreAwayGoals: number
  scoreAwayBehinds: number
}

type LeaderboardStatKey =
  | 'disposals'
  | 'kicks'
  | 'handballs'
  | 'marks'
  | 'tackles'
  | 'goals'
  | 'behinds'
  | 'goal_assists'
  | 'turnovers'
  | 'intercepts'
  | 'one_percenters'
  | 'clearances'
  | 'inside_50s'
  | 'rebound_50s'
  | 'hitouts'
  | 'frees_for'
  | 'frees_against'

type LeaderboardPlayer = {
  key: string
  profileId: string | null
  avatarUrl: string | null
  isGuest: boolean
  name: string
  number: number | null
  games: number
  stats: Partial<Record<LeaderboardStatKey, number>>
}

type LeaderboardDataset = {
  topStatKeys: LeaderboardStatKey[]
  players: LeaderboardPlayer[]
  isEmpty: boolean
}

type TeamAveragesDataset = {
  grades: Array<{ id: string; name: string }>
  seasonYears: number[]
  finalGameCount: number
  allCount: number
  winCount: number
  lossCount: number
  all: Partial<Record<LeaderboardStatKey, number>>
  wins: Partial<Record<LeaderboardStatKey, number>>
  losses: Partial<Record<LeaderboardStatKey, number>>
}

type ManagePerson = {
  id: string
  userId: string | null
  name: string
  handle: string | null
  avatarUrl: string | null
  jerseyNumber: number | null
  position: string | null
  role: string | null
  status: string | null
  isGuest: boolean
  source: 'roster' | 'guest' | 'club_role'
  member: SquadMember | null
}

const POSITION_OPTIONS = ['Forward', 'Midfield', 'Defence', 'Ruck', 'Utility', 'Bench'] as const
const RESULT_FILTERS: TeamResultFilter[] = ['all', 'wins', 'losses']
const TRACKED_STAT_KEYS: LeaderboardStatKey[] = [
  'disposals',
  'kicks',
  'handballs',
  'marks',
  'tackles',
  'goals',
  'behinds',
  'goal_assists',
  'turnovers',
  'intercepts',
  'one_percenters',
  'clearances',
  'inside_50s',
  'rebound_50s',
  'hitouts',
  'frees_for',
  'frees_against',
]

const EVENT_TO_STAT_KEY: Record<string, LeaderboardStatKey | undefined> = {
  K: 'kicks',
  K_EF: 'kicks',
  K_IF: 'kicks',
  HB: 'handballs',
  HB_EF: 'handballs',
  HB_IF: 'handballs',
  M: 'marks',
  MC: 'marks',
  MUC: 'marks',
  T: 'tackles',
  G: 'goals',
  GOAL: 'goals',
  B: 'behinds',
  BEHIND: 'behinds',
  GA: 'goal_assists',
  TO: 'turnovers',
  INT: 'intercepts',
  ONE_PERCENT: 'one_percenters',
  ONE_PERCENTERS: 'one_percenters',
  CL: 'clearances',
  I50: 'inside_50s',
  R50: 'rebound_50s',
  HO: 'hitouts',
  FF: 'frees_for',
  FA: 'frees_against',
}

const STAT_LABELS: Record<LeaderboardStatKey, string> = {
  disposals: 'Disposals',
  kicks: 'Kicks',
  handballs: 'Handballs',
  marks: 'Marks',
  tackles: 'Tackles',
  goals: 'Goals',
  behinds: 'Behinds',
  goal_assists: 'Goal Assists',
  turnovers: 'Turnovers',
  intercepts: 'Intercepts',
  one_percenters: '1%ers',
  clearances: 'Clearances',
  inside_50s: 'Inside 50s',
  rebound_50s: 'Rebound 50s',
  hitouts: 'Hitouts',
  frees_for: 'Frees For',
  frees_against: 'Frees Against',
}

function storageUrl(path: string | null | undefined, bucket = 'team-logos') {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const cleaned = path.replace(/^\/+/, '')
  if (!cleaned) return null
  if (cleaned.includes('/')) {
    const [candidateBucket, ...rest] = cleaned.split('/')
    if (candidateBucket && rest.length) {
      const { data } = supabase.storage.from(candidateBucket).getPublicUrl(rest.join('/'))
      return data.publicUrl || path
    }
  }
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleaned)
  return data.publicUrl || path
}

function displayMemberName(member: SquadMember) {
  if (member.profileName) return member.profileName
  if (member.handle) return member.handle.startsWith('@') ? member.handle : `@${member.handle}`
  return member.guestName || 'Unknown player'
}

function initialsFromName(value: string | null | undefined) {
  if (!value) return 'KC'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'KC'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

function normalizeName(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function guestMatchesProfile(guest: SquadMember, profile: { name: string | null; playerNumber: number | null } | null) {
  if (!profile) return false
  const guestName = normalizeName(guest.guestName ?? guest.profileName ?? null)
  const profileName = normalizeName(profile.name)
  const jerseyMatches =
    profile.playerNumber != null &&
    guest.jerseyNumber != null &&
    Number(profile.playerNumber) === Number(guest.jerseyNumber)

  if (jerseyMatches) return true
  if (!guestName || !profileName) return false
  if (guestName === profileName) return true

  const profileTokens = profileName.split(' ').filter(Boolean)
  if (!profileTokens.length) return false
  return profileTokens.every((token) => guestName.includes(token))
}

function formatPosition(value: string | null | undefined) {
  if (!value) return null
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatRoundLabel(round: number | null | undefined) {
  if (round == null || Number.isNaN(round)) return 'Unknown round'
  return `Round ${round}`
}

function formatDateLabel(value: string | null) {
  if (!value) return 'Date TBC'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBC'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function totalScore(goals: number, behinds: number) {
  return goals * 6 + behinds
}

function scoreText(goals: number, behinds: number) {
  return `${goals}.${behinds}`
}

function averageTotals(totals: Partial<Record<LeaderboardStatKey, number>>, games: number) {
  const next: Partial<Record<LeaderboardStatKey, number>> = {}
  TRACKED_STAT_KEYS.forEach((key) => {
    const total = Number(totals[key] ?? 0)
    if (!total || !games) return
    next[key] = Number((total / games).toFixed(1))
  })
  return next
}

function sortByJerseyNumber<T extends { jerseyNumber: number | null }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    if (a.jerseyNumber == null && b.jerseyNumber == null) return 0
    if (a.jerseyNumber == null) return 1
    if (b.jerseyNumber == null) return -1
    return a.jerseyNumber - b.jerseyNumber
  })
}

async function fetchClubRolePeople(clubId: string): Promise<{
  coaches: ClubRolePerson[]
  trackers: ClubRolePerson[]
  members: ClubRolePerson[]
  admins: ClubRolePerson[]
}> {
  const empty = {
    coaches: [] as ClubRolePerson[],
    trackers: [] as ClubRolePerson[],
    members: [] as ClubRolePerson[],
    admins: [] as ClubRolePerson[],
  }

  const { data, error } = await supabase
    .from('club_roles')
    .select('role,user_id')
    .eq('club_id', clubId)
    .in('role', ['coach', 'tracker', 'member', 'admin'])

  if (error) throw error
  const userIds = Array.from(
    new Set(
      ((data ?? []) as Array<{ user_id?: string | null }>)
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const profileMap = new Map<string, { name: string | null; handle: string | null; avatarUrl: string | null }>()
  if (userIds.length) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles_directory')
      .select('user_id,name,handle,avatar_url,avatar_path')
      .in('user_id', userIds)

    if (profileError) throw profileError
    ;(profiles ?? []).forEach((row) => {
      const profile = row as { user_id?: string | null; name?: string | null; handle?: string | null; avatar_url?: string | null; avatar_path?: string | null }
      if (!profile.user_id) return
      profileMap.set(profile.user_id, {
        name: profile.name ?? null,
        handle: profile.handle ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : null,
        avatarUrl: storageUrl(profile.avatar_url ?? profile.avatar_path ?? null, 'profile-avatars'),
      })
    })
  }

  ;(data ?? []).forEach((row, index) => {
    const role = ((row as { role?: string | null }).role ?? '').toLowerCase()
    const userId = (row as { user_id?: string | null }).user_id ?? null
    const profile = userId ? profileMap.get(userId) : null
    const person: ClubRolePerson = {
      id: userId ? `${role}-${userId}` : `${role}-${index}`,
      userId,
      name: profile?.name ?? 'KickChaser',
      handle: profile?.handle ?? null,
      avatarUrl: profile?.avatarUrl ?? null,
      role: (role || 'member') as ClubRolePerson['role'],
    }
    if (role === 'coach') empty.coaches.push(person)
    else if (role === 'tracker') empty.trackers.push(person)
    else if (role === 'admin') empty.admins.push(person)
    else empty.members.push(person)
  })

  return empty
}

async function fetchAvatarMap(userIds: string[]) {
  if (!userIds.length) return {} as Record<string, string | null>
  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,avatar_url,avatar_path')
    .in('user_id', Array.from(new Set(userIds)))

  if (error) throw error
  const map: Record<string, string | null> = {}
  ;(data ?? []).forEach((row) => {
    const profile = row as { user_id?: string | null; avatar_url?: string | null; avatar_path?: string | null }
    if (!profile.user_id) return
    map[profile.user_id] = storageUrl(profile.avatar_url ?? profile.avatar_path ?? null, 'profile-avatars')
  })
  return map
}

async function fetchSquadGames(squadId: string): Promise<SquadGameSummary[]> {
  const { data: links, error: linksError } = await supabase
    .from('game_squads')
    .select('game_id')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (linksError) throw linksError
  const gameIds = ((links ?? []) as Array<{ game_id?: string | null }>).map((row) => row.game_id).filter((id): id is string => Boolean(id))
  if (!gameIds.length) return []

  const [{ data: games, error: gamesError }, { data: scoreRows, error: scoreError }] = await Promise.all([
    supabase
      .from('games')
      .select('id,opponent,opponent_logo_path,grade_id,date,round,status,track_both_teams')
      .in('id', gameIds),
    supabase
      .from('v_counted_events')
      .select('game_id,team_side,stat_key')
      .in('game_id', gameIds)
      .in('stat_key', ['G', 'GOAL', 'B', 'BEHIND']),
  ])

  if (gamesError) throw gamesError
  if (scoreError) throw scoreError
  const { data: gradeRows, error: gradeError } = await supabase
    .from('league_grades')
    .select('id,name,grade_catalog(label)')
    .in(
      'id',
      ((games ?? []) as Array<{ grade_id?: string | null }>).map((row) => row.grade_id).filter((id): id is string => Boolean(id))
    )
  if (gradeError) throw gradeError

  const gradeNameMap = new Map<string, string | null>()
  ;(gradeRows ?? []).forEach((row) => {
    const grade = row as { id?: string | null; name?: string | null; grade_catalog?: { label?: string | null } | null }
    if (!grade.id) return
    gradeNameMap.set(grade.id, grade.grade_catalog?.label ?? grade.name ?? null)
  })

  const scoreMap = new Map<string, { hg: number; hb: number; ag: number; ab: number }>()
  ;(scoreRows ?? []).forEach((row) => {
    const event = row as { game_id?: string | null; team_side?: string | null; stat_key?: string | null }
    if (!event.game_id) return
    const current = scoreMap.get(event.game_id) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }
    const side = event.team_side === 'away' ? 'away' : 'home'
    const key = (event.stat_key ?? '').toUpperCase()
    if (key === 'G' || key === 'GOAL') {
      if (side === 'home') current.hg += 1
      else current.ag += 1
    }
    if (key === 'B' || key === 'BEHIND') {
      if (side === 'home') current.hb += 1
      else current.ab += 1
    }
    scoreMap.set(event.game_id, current)
  })

  return ((games ?? []) as Array<{ id: string; opponent?: string | null; opponent_logo_path?: string | null; grade_id?: string | null; date?: string | null; round?: number | null; status?: string | null; track_both_teams?: boolean | null }>)
    .map((game) => {
      const score = scoreMap.get(game.id) ?? { hg: 0, hb: 0, ag: 0, ab: 0 }
      return {
        id: game.id,
        opponent: game.opponent ?? null,
        opponentLogoUrl: storageUrl(game.opponent_logo_path ?? null),
        gradeId: game.grade_id ?? null,
        gradeName: game.grade_id ? gradeNameMap.get(game.grade_id) ?? null : null,
        date: game.date ?? null,
        round: game.round ?? null,
        status: game.status ?? null,
        trackBothTeams: Boolean(game.track_both_teams),
        scoreHomeGoals: score.hg,
        scoreHomeBehinds: score.hb,
        scoreAwayGoals: score.ag,
        scoreAwayBehinds: score.ab,
      }
    })
    .sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : 0
      const bTime = b.date ? new Date(b.date).getTime() : 0
      return bTime - aTime
    })
}

async function fetchPlayersLeaderboard(squadId: string, seasonYear: number | null): Promise<LeaderboardDataset> {
  const { data: links, error: linkError } = await supabase.from('game_squads').select('game_id').eq('squad_id', squadId)
  if (linkError) throw linkError
  const allGameIds = ((links ?? []) as Array<{ game_id?: string | null }>).map((row) => row.game_id).filter((id): id is string => Boolean(id))
  if (!allGameIds.length) return { topStatKeys: [], players: [], isEmpty: true }

  let gamesQuery = supabase.from('games').select('id,date').in('id', allGameIds)
  if (seasonYear) {
    gamesQuery = gamesQuery.gte('date', `${seasonYear}-01-01T00:00:00.000Z`).lt('date', `${seasonYear + 1}-01-01T00:00:00.000Z`)
  }
  const { data: games, error: gamesError } = await gamesQuery
  if (gamesError) throw gamesError
  const gameIds = ((games ?? []) as Array<{ id?: string | null }>).map((row) => row.id).filter((id): id is string => Boolean(id))
  if (!gameIds.length) return { topStatKeys: [], players: [], isEmpty: true }

  const { data: events, error: eventsError } = await supabase
    .from('v_counted_events_for_squad')
    .select('game_id,profile_user_id,player_number,stat_key,player_display_name,squad_member_id')
    .eq('squad_id', squadId)
    .in('game_id', gameIds)

  if (eventsError) throw eventsError
  if (!(events ?? []).length) return { topStatKeys: [], players: [], isEmpty: true }

  const profileIds = Array.from(
    new Set(
      ((events ?? []) as Array<{ profile_user_id?: string | null }>)
        .map((row) => row.profile_user_id)
        .filter((id): id is string => Boolean(id))
    )
  )
  const guestMemberIds = Array.from(
    new Set(
      ((events ?? []) as Array<{ squad_member_id?: string | null; profile_user_id?: string | null }>)
        .filter((row) => !row.profile_user_id)
        .map((row) => row.squad_member_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const [profilesRes, memberRes] = await Promise.all([
    profileIds.length
      ? supabase.from('profiles_directory').select('user_id,name,avatar_url,avatar_path,player_number').in('user_id', profileIds)
      : Promise.resolve({ data: [], error: null }),
    guestMemberIds.length
      ? supabase.from('squad_members').select('id,guest_name,jersey_number').in('id', guestMemberIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (profilesRes.error) throw profilesRes.error
  if (memberRes.error) throw memberRes.error

  const profileMap = new Map<string, { name: string | null; avatarUrl: string | null; number: number | null }>()
  ;(profilesRes.data ?? []).forEach((row: any) => {
    profileMap.set(row.user_id, {
      name: row.name ?? null,
      avatarUrl: storageUrl(row.avatar_url ?? row.avatar_path ?? null, 'profile-avatars'),
      number: row.player_number ?? null,
    })
  })

  const guestMap = new Map<string, { name: string | null; number: number | null }>()
  ;(memberRes.data ?? []).forEach((row: any) => {
    guestMap.set(row.id, {
      name: row.guest_name ?? null,
      number: row.jersey_number ?? null,
    })
  })

  const players = new Map<
    string,
    {
      profileId: string | null
      avatarUrl: string | null
      isGuest: boolean
      name: string
      number: number | null
      games: Set<string>
      stats: Partial<Record<LeaderboardStatKey, number>>
    }
  >()

  ;(events ?? []).forEach((row) => {
    const event = row as { game_id?: string | null; profile_user_id?: string | null; player_number?: number | null; stat_key?: string | null; player_display_name?: string | null; squad_member_id?: string | null }
    const profileId = event.profile_user_id ?? null
    const guestSource = event.squad_member_id ? guestMap.get(event.squad_member_id) : null
    const key = profileId ? `user:${profileId}` : guestSource?.name ? `guest:${guestSource.name.toLowerCase()}` : null
    if (!key) return
    const profile = profileId ? profileMap.get(profileId) : null
    if (!players.has(key)) {
      players.set(key, {
        profileId,
        avatarUrl: profile?.avatarUrl ?? null,
        isGuest: !profileId,
        name: profile?.name?.trim() || guestSource?.name || event.player_display_name?.trim() || 'Player',
        number: profile?.number ?? guestSource?.number ?? event.player_number ?? null,
        games: new Set(),
        stats: {},
      })
    }

    const current = players.get(key)!
    if (event.game_id) current.games.add(event.game_id)
    if (current.number == null) current.number = guestSource?.number ?? event.player_number ?? null
    const statKey = EVENT_TO_STAT_KEY[(event.stat_key ?? '').toUpperCase()]
    if (!statKey) return
    current.stats[statKey] = Number(current.stats[statKey] ?? 0) + 1
  })

  const rows = Array.from(players.entries()).map(([key, player]) => {
    const kicks = Number(player.stats.kicks ?? 0)
    const handballs = Number(player.stats.handballs ?? 0)
    if (kicks + handballs > 0) player.stats.disposals = kicks + handballs
    return {
      key,
      profileId: player.profileId,
      avatarUrl: player.avatarUrl,
      isGuest: player.isGuest,
      name: player.name,
      number: player.number,
      games: player.games.size,
      stats: player.stats,
    } satisfies LeaderboardPlayer
  })

  const totals: Partial<Record<LeaderboardStatKey, number>> = {}
  rows.forEach((row) => {
    TRACKED_STAT_KEYS.forEach((key) => {
      const value = Number(row.stats[key] ?? 0)
      if (!value) return
      totals[key] = Number(totals[key] ?? 0) + value
    })
  })

  const topStatKeys = Object.entries(totals)
    .filter(([, value]) => Number(value) > 0)
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .map(([key]) => key as LeaderboardStatKey)
    .slice(0, 6)

  return {
    topStatKeys,
    players: rows,
    isEmpty: !rows.length || !topStatKeys.length,
  }
}

async function fetchTeamAverages(squadId: string, seasonYear: number | null, gradeId: string | null): Promise<TeamAveragesDataset> {
  const { data: links, error: linkError } = await supabase.from('game_squads').select('game_id,team_side').eq('squad_id', squadId)
  if (linkError) throw linkError

  const sideByGame = new Map<string, 'home' | 'away'>()
  ;((links ?? []) as Array<{ game_id?: string | null; team_side?: string | null }>).forEach((row) => {
    if (!row.game_id) return
    sideByGame.set(row.game_id, row.team_side === 'away' ? 'away' : 'home')
  })

  const allGameIds = Array.from(sideByGame.keys())
  if (!allGameIds.length) {
    return { grades: [], seasonYears: [], finalGameCount: 0, allCount: 0, winCount: 0, lossCount: 0, all: {}, wins: {}, losses: {} }
  }

  let gamesQuery = supabase.from('games').select('id,date,track_both_teams,grade_id').in('id', allGameIds)
  if (gradeId) gamesQuery = gamesQuery.eq('grade_id', gradeId)
  const { data: games, error: gamesError } = await gamesQuery
  if (gamesError) throw gamesError

  const seasonYears = Array.from(
    new Set(
      ((games ?? []) as Array<{ date?: string | null }>)
        .map((row) => {
          if (!row.date) return null
          const date = new Date(row.date)
          return Number.isNaN(date.getTime()) ? null : date.getFullYear()
        })
        .filter((year): year is number => Boolean(year))
    )
  ).sort((a, b) => b - a)

  const filteredGames = ((games ?? []) as Array<{ id: string; date?: string | null; track_both_teams?: boolean | null; grade_id?: string | null }>)
    .filter((game) => {
      if (!seasonYear) return true
      if (!game.date) return false
      const year = new Date(game.date).getFullYear()
      return year === seasonYear
    })

  const filteredIds = filteredGames.map((row) => row.id)
  if (!filteredIds.length) {
    return { grades: [], seasonYears, finalGameCount: 0, allCount: 0, winCount: 0, lossCount: 0, all: {}, wins: {}, losses: {} }
  }

  const [{ data: events, error: eventsError }, { data: gradeRows, error: gradeError }] = await Promise.all([
    supabase
      .from('v_counted_events_for_squad')
      .select('game_id,team_side,stat_key')
      .eq('squad_id', squadId)
      .in('game_id', filteredIds),
    supabase
      .from('league_grades')
      .select('id,name,grade_catalog(label)')
      .in(
        'id',
        Array.from(new Set(filteredGames.map((row) => row.grade_id).filter((id): id is string => Boolean(id))))
      ),
  ])

  if (eventsError) throw eventsError
  if (gradeError) throw gradeError

  const gradeMap = new Map<string, string>()
  ;(gradeRows ?? []).forEach((row) => {
    const grade = row as { id?: string | null; name?: string | null; grade_catalog?: { label?: string | null } | null }
    if (!grade.id) return
    gradeMap.set(grade.id, grade.grade_catalog?.label ?? grade.name ?? grade.id)
  })

  const grades = Array.from(
    new Set(filteredGames.map((row) => row.grade_id).filter((id): id is string => Boolean(id)))
  ).map((id) => ({ id, name: gradeMap.get(id) ?? 'Grade' }))

  const eventsByGame = new Map<string, Array<{ team_side: 'home' | 'away'; stat_key: string | null }>>()
  ;(events ?? []).forEach((row) => {
    const event = row as { game_id?: string | null; team_side?: string | null; stat_key?: string | null }
    if (!event.game_id) return
    const list = eventsByGame.get(event.game_id) ?? []
    list.push({ team_side: event.team_side === 'away' ? 'away' : 'home', stat_key: event.stat_key ?? null })
    eventsByGame.set(event.game_id, list)
  })

  const allTotals: Partial<Record<LeaderboardStatKey, number>> = {}
  const winTotals: Partial<Record<LeaderboardStatKey, number>> = {}
  const lossTotals: Partial<Record<LeaderboardStatKey, number>> = {}
  let allCount = 0
  let winCount = 0
  let lossCount = 0

  filteredGames.forEach((game) => {
    const side = sideByGame.get(game.id) ?? 'home'
    const gameEvents = eventsByGame.get(game.id) ?? []
    if (!gameEvents.length) return
    const trackBothTeams = Boolean(game.track_both_teams)
    const ourEvents = trackBothTeams ? gameEvents.filter((event) => event.team_side === side) : gameEvents
    const oppEvents = trackBothTeams ? gameEvents.filter((event) => event.team_side !== side) : []
    if (!ourEvents.length) return

    const applyTotals = (target: Partial<Record<LeaderboardStatKey, number>>, rows: Array<{ stat_key: string | null }>) => {
      rows.forEach((event) => {
        const statKey = EVENT_TO_STAT_KEY[(event.stat_key ?? '').toUpperCase()]
        if (!statKey) return
        target[statKey] = Number(target[statKey] ?? 0) + 1
      })
    }

    allCount += 1
    applyTotals(allTotals, ourEvents)

    const scoreFor = (rows: Array<{ stat_key: string | null }>) =>
      rows.reduce(
        (score, row) => {
          const statKey = (row.stat_key ?? '').toUpperCase()
          if (statKey === 'G' || statKey === 'GOAL') score += 6
          if (statKey === 'B' || statKey === 'BEHIND') score += 1
          return score
        },
        0
      )

    const ourScore = scoreFor(ourEvents)
    const oppScore = scoreFor(oppEvents)
    if (trackBothTeams && ourScore !== oppScore) {
      if (ourScore > oppScore) {
        winCount += 1
        applyTotals(winTotals, ourEvents)
      } else {
        lossCount += 1
        applyTotals(lossTotals, ourEvents)
      }
    }
  })

  const addDisposals = (target: Partial<Record<LeaderboardStatKey, number>>) => {
    const kicks = Number(target.kicks ?? 0)
    const handballs = Number(target.handballs ?? 0)
    if (kicks + handballs > 0) target.disposals = kicks + handballs
  }
  addDisposals(allTotals)
  addDisposals(winTotals)
  addDisposals(lossTotals)

  return {
    grades,
    seasonYears,
    finalGameCount: allCount,
    allCount,
    winCount,
    lossCount,
    all: averageTotals(allTotals, allCount),
    wins: averageTotals(winTotals, winCount),
    losses: averageTotals(lossTotals, lossCount),
  }
}

function TeamsModal({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-[30px] bg-[#0E1726] shadow-[0_28px_80px_rgba(0,0,0,0.5)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/6 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
          </div>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  )
}

export default function SquadDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState<DetailTab>(
    initialTab === 'players' || initialTab === 'team' || initialTab === 'manage' ? initialTab : 'activity'
  )
  const [peopleTab, setPeopleTab] = useState<PeopleTab>('players')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [workingAction, setWorkingAction] = useState<string | null>(null)
  const [savingBranding, setSavingBranding] = useState(false)
  const [sendingInvite, setSendingInvite] = useState(false)
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const [actingRequestId, setActingRequestId] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  const [changingGrade, setChangingGrade] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{ name: string | null; playerNumber: number | null } | null>(null)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [clubRoles, setClubRoles] = useState<ClubRole[]>([])
  const [clubRolePeople, setClubRolePeople] = useState<{
    coaches: ClubRolePerson[]
    trackers: ClubRolePerson[]
    members: ClubRolePerson[]
    admins: ClubRolePerson[]
  }>({ coaches: [], trackers: [], members: [], admins: [] })
  const [followState, setFollowState] = useState(false)
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null)
  const [myGuestMergeRequests, setMyGuestMergeRequests] = useState<Array<{ id: string; guestSquadMemberId: string; status: string; requestedAt: string }>>([])
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({})

  const [squad, setSquad] = useState<SquadDetail | null>(null)
  const [membershipRole, setMembershipRole] = useState<string | null>(null)
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null)
  const [members, setMembers] = useState<SquadMember[]>([])
  const [connections, setConnections] = useState<FollowConnection[]>([])
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
  const [guestMergeRequests, setGuestMergeRequests] = useState<GuestMergeRequest[]>([])
  const [gradeOptions, setGradeOptions] = useState<Array<{ id: string; name: string | null; code: string | null }>>([])
  const [selectedGradeId, setSelectedGradeId] = useState('')

  const [gamesLoading, setGamesLoading] = useState(false)
  const [games, setGames] = useState<SquadGameSummary[]>([])
  const [seasonYear, setSeasonYear] = useState<number | null>(null)

  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardDataset>({ topStatKeys: [], players: [], isEmpty: true })
  const [selectedStatKey, setSelectedStatKey] = useState<LeaderboardStatKey>('disposals')

  const [teamStatsLoading, setTeamStatsLoading] = useState(false)
  const [teamStats, setTeamStats] = useState<TeamAveragesDataset>({
    grades: [],
    seasonYears: [],
    finalGameCount: 0,
    allCount: 0,
    winCount: 0,
    lossCount: 0,
    all: {},
    wins: {},
    losses: {},
  })
  const [teamGradeId, setTeamGradeId] = useState<string | null>(null)
  const [teamResultFilter, setTeamResultFilter] = useState<TeamResultFilter>('all')

  const [addPlayerOpen, setAddPlayerOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [brandingOpen, setBrandingOpen] = useState(false)
  const [changeLeagueOpen, setChangeLeagueOpen] = useState(false)
  const [heroMenuOpen, setHeroMenuOpen] = useState(false)
  const [actionMember, setActionMember] = useState<SquadMember | null>(null)
  const [numberModalMember, setNumberModalMember] = useState<SquadMember | null>(null)
  const [numberModalValue, setNumberModalValue] = useState('')
  const [positionMember, setPositionMember] = useState<SquadMember | null>(null)
  const [guestEditMember, setGuestEditMember] = useState<SquadMember | null>(null)
  const [guestEditName, setGuestEditName] = useState('')
  const [guestEditEmail, setGuestEditEmail] = useState('')
  const [guestEditNumber, setGuestEditNumber] = useState('')
  const [mergeModalMember, setMergeModalMember] = useState<SquadMember | null>(null)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestJersey, setGuestJersey] = useState('')
  const [inviteHandle, setInviteHandle] = useState('')
  const [linkHandle, setLinkHandle] = useState('')
  const [foundProfile, setFoundProfile] = useState<{ userId: string; name: string | null; handle: string | null; avatarUrl: string | null } | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [dismissedGuestBanner, setDismissedGuestBanner] = useState(false)

  const acceptedMembers = useMemo(() => members.filter((member) => member.status === 'accepted'), [members])
  const guestMembers = useMemo(
    () => acceptedMembers.filter((member) => !member.userId && Boolean(member.guestName)),
    [acceptedMembers]
  )
  const directMemberId = useMemo(
    () => acceptedMembers.find((member) => member.userId && member.userId === userId)?.id ?? null,
    [acceptedMembers, userId]
  )
  const memberCount = acceptedMembers.length
  const isOwner = Boolean(userId && squad?.ownerId && squad.ownerId === userId)
  const isAcceptedMember = membershipStatus?.toLowerCase() === 'accepted'
  const isCustomAdmin = membershipRole === 'owner' || membershipRole === 'admin'
  const isCustomTracker = membershipRole === 'tracker'
  const isClubTracker = clubRoles.includes('tracker')
  const isClubCoach = clubRoles.includes('coach')
  const isClubSupporter = clubRoles.includes('supporter') || clubRoles.includes('member') || clubRoles.includes('club_member')
  const isOfficialAdmin = squad?.isOfficial ? isOwner || isPlatformAdmin || clubRoles.includes('admin') : false
  const canManageTeamAdminStuff = squad?.isOfficial ? isOfficialAdmin : isOwner || isCustomAdmin || isPlatformAdmin
  const canManageGuests = squad?.isOfficial
    ? isOfficialAdmin || isClubTracker
    : isOwner || isCustomAdmin || isCustomTracker || isPlatformAdmin
  const canInvite = canManageTeamAdminStuff
  const canApprove = canManageTeamAdminStuff
  const canEditBranding = canManageTeamAdminStuff
  const canChangeLeague = squad?.isOfficial ? isPlatformAdmin : canManageTeamAdminStuff
  const canDelete = squad?.isOfficial ? isPlatformAdmin : canManageTeamAdminStuff
  const canUseTeamSelection = Boolean((isOwner || directMemberId) && (isAcceptedMember || isOwner))

  const viewerState = useMemo(() => {
    if (isOwner) return 'owner'
    if (isOfficialAdmin) return 'official-admin'
    if (isCustomAdmin) return 'admin'
    if (isClubTracker || isCustomTracker) return 'tracker'
    if (isAcceptedMember) return 'member'
    if (followState || isClubSupporter || isClubCoach) return 'follower'
    return 'locked'
  }, [followState, isAcceptedMember, isClubCoach, isClubSupporter, isClubTracker, isCustomAdmin, isCustomTracker, isOfficialAdmin, isOwner])

  const guestClaimCandidates = useMemo(() => {
    if (!userId) return [] as SquadMember[]
    return guestMembers.filter((member) => {
      const alreadyRequested = myGuestMergeRequests.some((row) => row.status === 'pending' && row.guestSquadMemberId === member.id)
      if (alreadyRequested) return false
      return guestMatchesProfile(member, userProfile)
    })
  }, [guestMembers, myGuestMergeRequests, userId, userProfile])

  const availableTabs = useMemo(() => {
    if (viewerState === 'locked') return [] as DetailTab[]
    if (viewerState === 'follower') return ['activity'] as DetailTab[]
    return ['activity', 'players', 'team', 'manage'] as DetailTab[]
  }, [viewerState])

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('tab', tab)
      return next
    })
  }, [setSearchParams, tab])

  useEffect(() => {
    if (!availableTabs.length) return
    if (!availableTabs.includes(tab)) setTab(availableTabs[0])
  }, [availableTabs, tab])

  async function loadDetail(silent = false) {
    if (!id) return
    if (!silent) setLoading(true)
    setRefreshing(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData.user
      if (!user) {
        navigate('/sign-in', { replace: true })
        return
      }

      setUserId(user.id)

      const [{ data: platformAdmin }, { data: profileRow }, detail, membership, roster, followConnections] = await Promise.all([
        supabase.from('platform_admins').select('profile_user_id').eq('profile_user_id', user.id).maybeSingle(),
        supabase.from('profiles_directory').select('name,player_number').eq('user_id', user.id).maybeSingle(),
        getSquadDetail(id),
        getSquadMembership(id, user.id),
        listSquadMembers(id),
        listFollowConnections(user.id),
      ])

      if (!detail) {
        setSquad(null)
        return
      }

      const [followsClub, clubRoleRows, joinStatus, inviteRows, joinRows, guestRows, myMergeRows, grades, rolePeople] = await Promise.all([
        getClubFollowState(detail.clubId ?? null, user.id),
        detail.clubId ? listClubRoles(detail.clubId, user.id) : Promise.resolve([] as ClubRole[]),
        getJoinRequestStatus(id, user.id),
        listPendingInvitesForSquad(id),
        listPendingJoinRequests(id),
        listGuestMergeRequests(id),
        listMyGuestMergeRequests(id, user.id),
        detail.leagueId ? listLeagueGrades(detail.leagueId) : Promise.resolve([]),
        detail.clubId ? fetchClubRolePeople(detail.clubId) : Promise.resolve({ coaches: [], trackers: [], members: [], admins: [] }),
      ])

      let nextRole = membership.role?.toLowerCase() ?? null
      if (detail.isOfficial && detail.clubId) {
        try {
          const clubAdmin = await isClubAdmin(detail.clubId, user.id)
          if (clubAdmin) nextRole = 'club_admin'
        } catch {
          // keep current role
        }
      }

      const roleUserIds = [
        ...rolePeople.coaches.map((person) => person.userId),
        ...rolePeople.trackers.map((person) => person.userId),
        ...rolePeople.members.map((person) => person.userId),
        ...rolePeople.admins.map((person) => person.userId),
      ].filter((entry): entry is string => Boolean(entry))
      const rosterUserIds = roster.map((member) => member.userId).filter((entry): entry is string => Boolean(entry))
      const avatars = await fetchAvatarMap([...roleUserIds, ...rosterUserIds])

      setSquad(detail)
      setUserProfile({
        name: (profileRow as { name?: string | null } | null)?.name ?? null,
        playerNumber: (profileRow as { player_number?: number | null } | null)?.player_number ?? null,
      })
      setMembershipRole(nextRole)
      setMembershipStatus(membership.status ?? null)
      setMembers(roster)
      setConnections(followConnections)
      setPendingInvites(inviteRows)
      setJoinRequests(joinRows)
      setGuestMergeRequests(guestRows)
      setIsPlatformAdmin(Boolean(platformAdmin?.profile_user_id))
      setClubRoles(clubRoleRows)
      setClubRolePeople(rolePeople)
      setFollowState(followsClub)
      setJoinRequestStatus(joinStatus)
      setMyGuestMergeRequests(myMergeRows)
      setGradeOptions(grades)
      setSelectedGradeId(detail.gradeId ?? '')
      setAvatarMap(avatars)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load team detail.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void loadDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    setDismissedGuestBanner(false)
  }, [id, userId])

  useEffect(() => {
    if (!squad?.id) return
    let cancelled = false
    ;(async () => {
      try {
        setGamesLoading(true)
        const nextGames = await fetchSquadGames(squad.id)
        if (cancelled) return
        setGames(nextGames)
        if (seasonYear == null) {
          const years = Array.from(
            new Set(
              nextGames
                .map((game) => (game.date ? new Date(game.date).getFullYear() : null))
                .filter((value): value is number => Boolean(value))
            )
          ).sort((a, b) => b - a)
          setSeasonYear(years[0] ?? new Date().getFullYear())
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load team activity.')
      } finally {
        if (!cancelled) setGamesLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [seasonYear, squad?.id])

  useEffect(() => {
    if (!squad?.id || viewerState === 'locked' || viewerState === 'follower') return
    let cancelled = false
    ;(async () => {
      try {
        setLeaderboardLoading(true)
        const data = await fetchPlayersLeaderboard(squad.id, seasonYear)
        if (cancelled) return
        setLeaderboard(data)
        if (data.topStatKeys.length && !data.topStatKeys.includes(selectedStatKey)) {
          setSelectedStatKey(data.topStatKeys[0])
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load player leaderboard.')
      } finally {
        if (!cancelled) setLeaderboardLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [seasonYear, selectedStatKey, squad?.id, viewerState])

  useEffect(() => {
    if (!squad?.id || viewerState === 'locked' || viewerState === 'follower') return
    let cancelled = false
    ;(async () => {
      try {
        setTeamStatsLoading(true)
        const data = await fetchTeamAverages(squad.id, seasonYear, teamGradeId)
        if (cancelled) return
        setTeamStats(data)
        if (!teamGradeId && (squad.gradeId || data.grades[0]?.id)) {
          setTeamGradeId(squad.gradeId ?? data.grades[0]?.id ?? null)
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load team stats.')
      } finally {
        if (!cancelled) setTeamStatsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [seasonYear, squad?.gradeId, squad?.id, teamGradeId, viewerState])

  async function onUpdateNumber(memberId: string, jersey: number | null) {
    setSavingMemberId(memberId)
    try {
      await updateMemberNumber(memberId, jersey)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onUpdatePosition(memberId: string, position: string | null) {
    setSavingMemberId(memberId)
    try {
      await updateMemberPosition(memberId, position)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onRemoveMember(memberId: string) {
    if (!userId) return
    setSavingMemberId(memberId)
    try {
      await removeMember(memberId, userId)
      await loadDetail(true)
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onInvite(handle: string) {
    if (!userId || !id) return
    setSendingInvite(true)
    try {
      await inviteByHandle(userId, id, handle)
      await loadDetail(true)
      setInviteHandle('')
      setInviteOpen(false)
    } finally {
      setSendingInvite(false)
    }
  }

  async function onJoinDecision(requestId: string, requestedRole: string | null, decision: 'approve' | 'decline') {
    setActingRequestId(requestId)
    try {
      await decideJoinRequest(requestId, decision, requestedRole)
      await loadDetail(true)
    } finally {
      setActingRequestId(null)
    }
  }

  async function onGuestMergeDecision(requestId: string, decision: 'approve' | 'decline') {
    setActingRequestId(requestId)
    try {
      await decideGuestMergeRequest(requestId, decision)
      await loadDetail(true)
    } finally {
      setActingRequestId(null)
    }
  }

  async function onSaveBranding(payload: { logoUrl?: string | null; primaryColorHex?: string | null; secondaryColorHex?: string | null; tertiaryColorHex?: string | null }) {
    if (!id) return
    setSavingBranding(true)
    try {
      await updateSquadBranding(id, payload)
      await loadDetail(true)
    } finally {
      setSavingBranding(false)
    }
  }

  async function onLeave() {
    if (!id) return
    const confirmed = window.confirm('Leave this team? This removes you from the roster.')
    if (!confirmed) return
    setLeaving(true)
    try {
      await leaveSquad(id)
      navigate('/teams', { replace: true })
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : 'Unable to leave team.')
    } finally {
      setLeaving(false)
    }
  }

  async function onToggleFollow() {
    if (!userId || !squad?.clubId) return
    try {
      setWorkingAction('follow')
      if (followState) await unfollowClub(squad.clubId, userId)
      else await followClub(squad.clubId, userId)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onRequestJoin() {
    if (!id || !userId) return
    try {
      setWorkingAction('join')
      await requestToJoinSquad(id, userId)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onRequestGuestClaim(member: SquadMember) {
    if (!id || !userId || !member.id || !member.guestName) return
    try {
      setWorkingAction(`claim-${member.id}`)
      await requestGuestMerge(id, member.id, member.guestName, userId)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onSearchHandle() {
    try {
      setLinkError(null)
      setWorkingAction('search-link')
      const profile = await searchProfileByHandle(linkHandle)
      setFoundProfile(profile)
      if (!profile) setLinkError('No profile matched that handle.')
    } finally {
      setWorkingAction(null)
    }
  }

  async function onDirectLinkGuest() {
    if (!mergeModalMember?.id || !foundProfile?.userId) return
    try {
      setLinkError(null)
      setWorkingAction('direct-link')
      await linkGuestMemberToUser(mergeModalMember.id, foundProfile.userId)
      setMergeModalMember(null)
      setFoundProfile(null)
      setLinkHandle('')
      await loadDetail(true)
    } catch (linkingError) {
      setLinkError(linkingError instanceof Error ? linkingError.message : 'Unable to link guest user.')
    } finally {
      setWorkingAction(null)
    }
  }

  async function onAddGuestPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!id || !guestName.trim()) return
    try {
      setWorkingAction('add-guest')
      await addGuestPlayer(id, {
        name: guestName.trim(),
        email: guestEmail.trim() || null,
        jerseyNumber: guestJersey.trim() ? Number(guestJersey) : null,
      })
      setGuestName('')
      setGuestEmail('')
      setGuestJersey('')
      setAddPlayerOpen(false)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onSaveGuestEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!guestEditMember?.id || !guestEditName.trim()) return
    try {
      setWorkingAction('edit-guest')
      const jersey = guestEditNumber.trim() ? Number(guestEditNumber) : null
      const { error: updateError } = await supabase
        .from('squad_members')
        .update({
          guest_name: guestEditName.trim(),
          guest_email: guestEditEmail.trim() || null,
          jersey_number: Number.isNaN(jersey) ? null : jersey,
        })
        .eq('id', guestEditMember.id)
      if (updateError) throw updateError
      setGuestEditMember(null)
      await loadDetail(true)
    } finally {
      setWorkingAction(null)
    }
  }

  async function onChangeGrade() {
    if (!id || !selectedGradeId) return
    try {
      setChangingGrade(true)
      await updateSquadGrade(id, {
        gradeId: selectedGradeId,
        leagueId: squad?.leagueId ?? null,
        stateCode: squad?.stateCode ?? null,
      })
      setChangeLeagueOpen(false)
      await loadDetail(true)
    } finally {
      setChangingGrade(false)
    }
  }

  async function onDeleteTeam() {
    if (!id) return
    const confirmed = window.confirm(
      squad?.isOfficial
        ? 'Delete is restricted for official teams. Continue only if you are sure this official team should be removed.'
        : 'Delete this custom team? This cannot be undone.'
    )
    if (!confirmed) return
    try {
      setDeleting(true)
      await deleteSquad(id)
      navigate('/teams', { replace: true })
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete team.')
    } finally {
      setDeleting(false)
    }
  }

  async function updateRosterRole(member: SquadMember, role: 'player' | 'coach' | 'tracker' | 'admin', action: 'grant' | 'revoke' = 'grant') {
    if (!member.id) return
    const normalizedRole = role.toLowerCase()
    const isGrant = action === 'grant'
    try {
      setSavingMemberId(member.id)
      if (squad?.isOfficial) {
        if (normalizedRole === 'player') {
          const { error: roleError } = await supabase
            .from('squad_members')
            .update({ role: isGrant ? 'player' : 'member', updated_by: userId ?? null })
            .eq('id', member.id)
          if (roleError) throw roleError
        } else {
          if (!squad.clubId || !member.userId) return
          if (isGrant) {
            const { error: insertError } = await supabase
              .from('club_roles')
              .insert({ club_id: squad.clubId, user_id: member.userId, role: normalizedRole, updated_by: userId ?? null })
            if (insertError && insertError.code !== '23505') throw insertError
          } else {
            const { error: revokeError } = await supabase.rpc('rpc_revoke_club_role', {
              _club_id: squad.clubId,
              _user_id: member.userId,
              _role: normalizedRole,
              _acting_user_id: userId,
            })
            if (revokeError && revokeError.code !== 'PGRST116') throw revokeError
          }
        }
      } else {
        const { error: roleError } = await supabase
          .from('squad_members')
          .update({ role: isGrant ? normalizedRole : 'member', updated_by: userId ?? null })
          .eq('id', member.id)
        if (roleError) throw roleError
      }
      setActionMember(null)
      await loadDetail(true)
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Unable to update role.')
    } finally {
      setSavingMemberId(null)
    }
  }

  async function onShare() {
    try {
      const target = window.location.href
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(target)
      }
    } catch {
      // ignore clipboard failures
    }
  }

  const seasonYears = useMemo(
    () =>
      Array.from(
        new Set(
          games
            .map((game) => (game.date ? new Date(game.date).getFullYear() : null))
            .filter((value): value is number => Boolean(value))
        )
      ).sort((a, b) => b - a),
    [games]
  )

  const activityGroups = useMemo(() => {
    const filtered = seasonYear
      ? games.filter((game) => (game.date ? new Date(game.date).getFullYear() === seasonYear : false))
      : games
    const grouped = new Map<string, SquadGameSummary[]>()
    filtered.forEach((game) => {
      const key = formatRoundLabel(game.round)
      const list = grouped.get(key) ?? []
      list.push(game)
      grouped.set(key, list)
    })
    return Array.from(grouped.entries()).sort((a, b) => {
      const aValue = a[1][0]?.round ?? -1
      const bValue = b[1][0]?.round ?? -1
      return bValue - aValue
    })
  }, [games, seasonYear])

  const sortedLeaderboard = useMemo(() => {
    if (!leaderboard.players.length) return [] as Array<LeaderboardPlayer & { statValue: number }>
    return [...leaderboard.players]
      .map((row) => ({ ...row, statValue: Number(row.stats[selectedStatKey] ?? 0) }))
      .filter((row) => row.statValue > 0)
      .sort((a, b) => {
        if (b.statValue !== a.statValue) return b.statValue - a.statValue
        return b.games - a.games
      })
      .slice(0, 10)
  }, [leaderboard.players, selectedStatKey])

  const activeTeamStats = useMemo(() => {
    if (teamResultFilter === 'wins') return teamStats.wins
    if (teamResultFilter === 'losses') return teamStats.losses
    return teamStats.all
  }, [teamResultFilter, teamStats.all, teamStats.losses, teamStats.wins])

  const teamStatCards = useMemo(
    () =>
      TRACKED_STAT_KEYS.filter((key) => Number(activeTeamStats[key] ?? 0) > 0)
        .slice(0, 8)
        .map((key) => ({ key, label: STAT_LABELS[key], value: activeTeamStats[key] ?? 0 })),
    [activeTeamStats]
  )

  const playersPeople = useMemo(
    () =>
      sortByJerseyNumber(
        acceptedMembers
          .filter((member) => !['coach', 'tracker'].includes((member.role ?? '').toLowerCase()))
          .map((member) => ({
            id: member.id,
            userId: member.userId ?? null,
            name: member.profileName ?? member.guestName ?? member.handle ?? 'KickChaser',
            handle: member.handle ? (member.handle.startsWith('@') ? member.handle : `@${member.handle}`) : null,
            avatarUrl: member.userId ? avatarMap[member.userId] ?? null : null,
            jerseyNumber: member.jerseyNumber ?? null,
            position: member.position ?? null,
            role: member.role ?? null,
            status: member.status ?? null,
            isGuest: !member.userId,
            source: !member.userId ? ('guest' as const) : ('roster' as const),
            member,
          }))
      ),
    [acceptedMembers, avatarMap]
  )

  const membersPeople = useMemo(
    () =>
      acceptedMembers
        .filter((member) => Boolean(member.userId))
        .map((member) => ({
          id: member.id,
          userId: member.userId ?? null,
          name: member.profileName ?? member.handle ?? 'KickChaser',
          handle: member.handle ? (member.handle.startsWith('@') ? member.handle : `@${member.handle}`) : null,
          avatarUrl: member.userId ? avatarMap[member.userId] ?? null : null,
          jerseyNumber: member.jerseyNumber ?? null,
          position: member.position ?? null,
          role: member.role ?? null,
          status: member.status ?? null,
          isGuest: false,
          source: 'roster' as const,
          member,
        })),
    [acceptedMembers, avatarMap]
  )

  const coachesPeople = useMemo(
    () =>
      clubRolePeople.coaches.map((person) => ({
        id: person.id,
        userId: person.userId,
        name: person.name,
        handle: person.handle,
        avatarUrl: person.avatarUrl,
        jerseyNumber: null,
        position: null,
        role: 'coach',
        status: 'accepted',
        isGuest: false,
        source: 'club_role' as const,
        member: members.find((member) => member.userId === person.userId) ?? null,
      })),
    [clubRolePeople.coaches, members]
  )

  const trackersPeople = useMemo(
    () =>
      clubRolePeople.trackers.map((person) => ({
        id: person.id,
        userId: person.userId,
        name: person.name,
        handle: person.handle,
        avatarUrl: person.avatarUrl,
        jerseyNumber: null,
        position: null,
        role: 'tracker',
        status: 'accepted',
        isGuest: false,
        source: 'club_role' as const,
        member: members.find((member) => member.userId === person.userId) ?? null,
      })),
    [clubRolePeople.trackers, members]
  )

  const activePeople = useMemo(() => {
    if (peopleTab === 'players') return playersPeople
    if (peopleTab === 'coaches') return coachesPeople
    if (peopleTab === 'members') return membersPeople
    return trackersPeople
  }, [coachesPeople, membersPeople, peopleTab, playersPeople, trackersPeople])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading team workspace…</main>
  }

  if (!squad) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Team unavailable.'}</p>
      </PortalCard>
    )
  }

  const leagueLabel = squad.gradeName || squad.leagueShortName || squad.leagueName || 'League TBC'
  const heroActions = [
    {
      key: 'share',
      label: 'Share',
      icon: <Share2 className="h-5 w-5" />,
      onClick: () => void onShare(),
      visible: true,
      accent: false,
      asLink: false,
    },
    {
      key: 'invite',
      label: 'Invite',
      icon: <UserPlus className="h-5 w-5" />,
      onClick: () => setInviteOpen(true),
      visible: canInvite,
      accent: false,
      asLink: false,
    },
    {
      key: 'merge-guest',
      label: 'Merge Guest',
      icon: <Link2 className="h-5 w-5" />,
      onClick: () => setTab('manage'),
      visible: canManageGuests && guestMembers.length > 0,
      accent: false,
      asLink: false,
    },
    {
      key: 'team-selection',
      label: 'Selection',
      icon: <Trophy className="h-5 w-5" />,
      href: `/teams/${squad.id}/team-selection`,
      visible: canUseTeamSelection,
      accent: false,
      asLink: true,
    },
    {
      key: 'pending',
      label: 'Pending',
      icon: <Users className="h-5 w-5" />,
      onClick: () => setTab('manage'),
      visible: canApprove,
      accent: false,
      badge: joinRequests.length + guestMergeRequests.length,
      asLink: false,
    },
    {
      key: 'follow',
      label: followState ? 'Following' : 'Follow',
      icon: <Check className="h-5 w-5" />,
      onClick: onToggleFollow,
      visible: Boolean(squad.isOfficial && squad.clubId),
      accent: !followState,
      asLink: false,
    },
    {
      key: 'join',
      label: joinRequestStatus === 'pending' ? 'Requested' : 'Request',
      icon: <ArrowRight className="h-5 w-5" />,
      onClick: onRequestJoin,
      visible: viewerState === 'locked',
      accent: true,
      asLink: false,
    },
  ].filter((item) => item.visible)

  return (
    <>
      <section className="teams-stage grid gap-6">
        <section className="teams-detail-hero">
          <Link
            to="/teams"
            aria-label="Back to Teams"
            className="absolute left-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:bg-black/55"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          {Boolean(userId && !isOwner && isAcceptedMember) ? (
            <button
              type="button"
              aria-label="Team options"
              onClick={() => setHeroMenuOpen(true)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-sm transition hover:bg-black/55"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          ) : null}
          <div
            className="teams-detail-cover"
            style={
              squad.coverImageUrl
                ? {
                    backgroundImage: `linear-gradient(180deg, rgba(5,8,15,0.12), rgba(5,8,15,0.12)), url(${squad.coverImageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          />
          <div className="-mt-16 px-5 pb-6 sm:px-7 sm:pb-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="teams-detail-logo">
                  {squad.logoUrl ? (
                    <img src={squad.logoUrl} alt={squad.name || 'Team'} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-slate-400">{initialsFromName(squad.name)}</span>
                  )}
                </div>

                <div className="min-w-0 pt-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="teams-kicker">Teams</p>
                    {squad.isOfficial && (
                      <span className="team-official-badge">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Official
                      </span>
                    )}
                  </div>
                  <h2 className="teams-title-display mt-2 text-[2.1rem] font-black leading-none text-white sm:text-[2.9rem]">
                    {squad.name || 'Team'}
                  </h2>
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-slate-300">{leagueLabel}</p>
                  <div className="teams-hero-meta-row mt-4">
                    <span className="team-meta-pill">{memberCount} members</span>
                    <span className="team-meta-pill">{viewerState.replaceAll('-', ' ')}</span>
                    <span className="team-meta-pill">{squad.isOfficial ? 'Official club team' : 'Custom squad'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="teams-hero-actions">
          {heroActions.map((action) =>
            action.asLink ? (
              <Link key={action.key} to={action.href!} className={`teams-hero-action ${action.accent ? 'teams-hero-action--accent' : ''}`}>
                <span className="teams-hero-action-icon">
                  {action.icon}
                  {action.badge ? <span className="teams-hero-action-badge">{action.badge > 9 ? '9+' : action.badge}</span> : null}
                </span>
                <span>{action.label}</span>
              </Link>
            ) : (
              <button
                key={action.key}
                className={`teams-hero-action ${action.accent ? 'teams-hero-action--accent' : ''}`}
                onClick={action.onClick}
                disabled={
                  (action.key === 'follow' && workingAction === 'follow') ||
                  (action.key === 'join' && (workingAction === 'join' || joinRequestStatus === 'pending'))
                }
              >
                <span className="teams-hero-action-icon">
                  {action.icon}
                  {action.badge ? <span className="teams-hero-action-badge">{action.badge > 9 ? '9+' : action.badge}</span> : null}
                </span>
                <span>
                  {action.key === 'follow' && workingAction === 'follow'
                    ? 'Updating…'
                    : action.key === 'join' && workingAction === 'join'
                      ? 'Requesting…'
                      : action.label}
                </span>
              </button>
            )
          )}
        </div>

        {availableTabs.length > 0 ? (
          <div className="teams-segmented">
            {availableTabs.map((item) => (
              <button key={item} onClick={() => setTab(item)} className={`teams-segment ${tab === item ? 'is-active' : ''}`}>
                {item === 'activity' ? 'Activity' : item === 'players' ? 'Players' : item === 'team' ? 'Team' : 'Manage'}
              </button>
            ))}
          </div>
        ) : null}

        {error && (
          <PortalCard className="teams-section-card">
            <p className="text-sm text-red-300">{error}</p>
          </PortalCard>
        )}

        {viewerState === 'locked' ? (
          <PortalCard className="teams-section-card">
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-amber-400/12 text-amber-200">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-white">Join this team to view roster, stats and games</p>
                  <p className="mt-1 text-sm text-slate-400">Non-followers stay locked out of the team workspace until they follow the club or are accepted into the team.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {squad.isOfficial && squad.clubId ? (
                  <button className="teams-action-chip" disabled={workingAction === 'follow'} onClick={onToggleFollow}>
                    {followState ? 'Following' : 'Follow'}
                  </button>
                ) : null}
                <button className="teams-action-chip teams-action-chip--accent" disabled={workingAction === 'join' || joinRequestStatus === 'pending'} onClick={onRequestJoin}>
                  {joinRequestStatus === 'pending' ? 'Join requested' : 'Request to join'}
                </button>
              </div>
            </div>
          </PortalCard>
        ) : null}

        {tab === 'activity' && viewerState !== 'locked' && (
          <div className="grid gap-6">
            {guestClaimCandidates.length > 0 && Boolean(userId) && !dismissedGuestBanner ? (
              <PortalCard className="teams-section-card">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FBBF24]">Guest Merge</p>
                      <p className="mt-2 text-lg font-semibold text-white">Is this guest player you?</p>
                      <p className="mt-1 text-sm text-slate-400">This only appears when a guest entry matches your profile name or jersey number. Admin approval is still required.</p>
                    </div>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                      onClick={() => setDismissedGuestBanner(true)}
                      aria-label="Close guest merge suggestion"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {guestClaimCandidates.slice(0, 2).map((member) => (
                    <div key={member.id} className="teams-guest-card flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{member.guestName}</p>
                        <p className="mt-1 text-sm text-slate-400">Rostered as a guest player.</p>
                      </div>
                      <button className="teams-action-chip teams-action-chip--accent" disabled={workingAction === `claim-${member.id}`} onClick={() => onRequestGuestClaim(member)}>
                        {workingAction === `claim-${member.id}` ? 'Requesting…' : 'Request merge'}
                      </button>
                    </div>
                  ))}
                </div>
              </PortalCard>
            ) : null}

            <PortalCard className="teams-section-card">
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tracked Games</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Activity</h3>
                  </div>
                  {seasonYears.length ? (
                    <div className="flex flex-wrap gap-2">
                      {seasonYears.map((year) => (
                        <button
                          key={year}
                          onClick={() => setSeasonYear(year)}
                          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${seasonYear === year ? 'bg-[#39FF88] text-[#081120]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {gamesLoading ? (
                  <p className="text-sm text-slate-400">Loading tracked games…</p>
                ) : activityGroups.length === 0 ? (
                  <div className="rounded-[24px] bg-white/[0.03] p-5 text-sm text-slate-400">No tracked games yet. Activity is grouped by round once this team has tracked games.</div>
                ) : (
                  <div className="grid gap-6">
                    {activityGroups.map(([roundLabel, roundGames]) => (
                      <div key={roundLabel} className="grid gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">{roundLabel}</h4>
                          <span className="text-xs text-slate-500">{roundGames.length} games</span>
                        </div>
                        <div className="grid gap-3">
                          {roundGames.map((game) => (
                            <Link key={game.id} to={`/games/${game.id}`} className="team-row-card block">
                              <div className="flex items-center gap-4">
                                <div className="team-row-logo">
                                  {squad.logoUrl ? <img src={squad.logoUrl} alt={squad.name || 'Team'} /> : <span className="text-sm font-semibold text-slate-300">{initialsFromName(squad.name)}</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="truncate text-base font-semibold text-white">{squad.name || 'Team'} vs {game.opponent || 'Opponent'}</h4>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-400">{formatDateLabel(game.date)} • {game.status || 'Tracked game'}</p>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <span className="team-meta-pill">{game.gradeName || squad.gradeName || 'Grade TBC'}</span>
                                    <span className="team-meta-pill">{scoreText(game.scoreHomeGoals, game.scoreHomeBehinds)} - {scoreText(game.scoreAwayGoals, game.scoreAwayBehinds)}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-semibold text-white">{totalScore(game.scoreHomeGoals, game.scoreHomeBehinds)} - {totalScore(game.scoreAwayGoals, game.scoreAwayBehinds)}</p>
                                  <div className="team-forward mt-2 ml-auto">
                                    <ChevronRight className="h-4 w-4" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PortalCard>
          </div>
        )}

        {tab === 'players' && availableTabs.includes('players') && (
          <PortalCard className="teams-section-card">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Leaderboard</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Players</h3>
                </div>
                {seasonYears.length ? (
                  <div className="flex flex-wrap gap-2">
                    {seasonYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSeasonYear(year)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${seasonYear === year ? 'bg-[#39FF88] text-[#081120]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="teams-action-scroll">
                {(leaderboard.topStatKeys.length ? leaderboard.topStatKeys : ['disposals']).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStatKey(key as LeaderboardStatKey)}
                    className={`teams-action-chip ${selectedStatKey === key ? 'teams-action-chip--accent' : ''}`}
                  >
                    {STAT_LABELS[key as LeaderboardStatKey]}
                  </button>
                ))}
              </div>

              {leaderboardLoading ? (
                <p className="text-sm text-slate-400">Loading leaderboard…</p>
              ) : leaderboard.isEmpty || !sortedLeaderboard.length ? (
                <div className="rounded-[24px] bg-white/[0.03] p-5 text-sm text-slate-400">No leaderboard data for this team yet. Track final games to unlock the top 10 rankings.</div>
              ) : (
                <div className="grid gap-3">
                  {sortedLeaderboard.map((row) => (
                    <div key={row.key} className="rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(2,8,20,0.22)]">
                      <div className="flex items-center gap-4">
                        <div className="min-w-[44px] text-center text-[2rem] font-black italic leading-none text-white/78">{row.number ?? '—'}</div>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#142033]">
                          {row.avatarUrl && !row.isGuest ? (
                            <img src={row.avatarUrl} alt={row.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-sm font-semibold text-slate-300">{initialsFromName(row.name)}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-black uppercase italic tracking-[0.02em] text-white">{row.name}</p>
                          <p className={`mt-1 text-sm ${row.isGuest ? 'text-[#FBBF24]' : 'text-slate-400'}`}>
                            {row.isGuest ? 'Guest' : `No. ${row.number ?? '—'} • Games: ${row.games}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[#39FF88]">{row.statValue}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-500">{STAT_LABELS[selectedStatKey]}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PortalCard>
        )}

        {tab === 'team' && availableTabs.includes('team') && (
          <PortalCard className="teams-section-card">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Season Averages</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Team</h3>
                </div>
                {teamStats.seasonYears.length ? (
                  <div className="flex flex-wrap gap-2">
                    {teamStats.seasonYears.map((year) => (
                      <button
                        key={year}
                        onClick={() => setSeasonYear(year)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${seasonYear === year ? 'bg-[#39FF88] text-[#081120]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-3 py-1.5 text-sm text-slate-300">
                  Grade: {teamStats.grades.find((grade) => grade.id === teamGradeId)?.name ?? squad.gradeName ?? 'Current'}
                </span>
                {RESULT_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTeamResultFilter(filter)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${teamResultFilter === filter ? 'bg-[#39FF88] text-[#081120]' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
                  >
                    {filter === 'all' ? 'All Games' : filter === 'wins' ? 'Wins' : 'Losses'}
                  </button>
                ))}
              </div>

              {teamStatsLoading ? (
                <p className="text-sm text-slate-400">Loading team averages…</p>
              ) : !teamStatCards.length ? (
                <div className="rounded-[24px] bg-white/[0.03] p-5 text-sm text-slate-400">No team stats yet. Team averages unlock from tracked games tied to this team.</div>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {teamStatCards.map((card) => (
                      <div key={card.key} className="rounded-[24px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(2,8,20,0.22)]">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
                        <p className="mt-3 text-3xl font-black text-white">{card.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[22px] bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tracked Games</p>
                      <p className="mt-2 text-2xl font-black text-white">{teamStats.finalGameCount}</p>
                    </div>
                    <div className="rounded-[22px] bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Wins</p>
                      <p className="mt-2 text-2xl font-black text-white">{teamStats.winCount}</p>
                    </div>
                    <div className="rounded-[22px] bg-white/[0.03] p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Losses</p>
                      <p className="mt-2 text-2xl font-black text-white">{teamStats.lossCount}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </PortalCard>
        )}

        {tab === 'manage' && availableTabs.includes('manage') && (
          <div className="grid gap-6">
            <PortalCard className="teams-section-card">
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Manage</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Management Actions</h3>
                </div>

                {!(canManageTeamAdminStuff || canManageGuests) ? (
                  <div className="rounded-[24px] bg-white/[0.03] p-5">
                    <p className="text-lg font-semibold text-white">Limited access</p>
                    <p className="mt-2 text-sm text-slate-400">Members can view the manage structure, but only admins and trackers get operational tools. Trackers are limited to guest workflows.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-5">
                    {canManageGuests ? (
                      <button className="teams-operational-card text-left" onClick={() => setAddPlayerOpen(true)}>
                        <Users className="h-5 w-5 text-[#9CE8BE]" />
                        <p className="mt-3 font-semibold text-white">Add Player</p>
                        <p className="mt-1 text-sm text-slate-400">Add a guest or roster player entry.</p>
                      </button>
                    ) : null}
                    {canInvite ? (
                      <button className="teams-operational-card text-left" onClick={() => setInviteOpen(true)}>
                        <UserPlus className="h-5 w-5 text-[#9CE8BE]" />
                        <p className="mt-3 font-semibold text-white">Invite Member</p>
                        <p className="mt-1 text-sm text-slate-400">Send an official invite by handle.</p>
                      </button>
                    ) : null}
                    {canEditBranding ? (
                      <button className="teams-operational-card text-left" onClick={() => setBrandingOpen(true)}>
                        <Palette className="h-5 w-5 text-[#9CE8BE]" />
                        <p className="mt-3 font-semibold text-white">Edit Club Branding</p>
                        <p className="mt-1 text-sm text-slate-400">Logo, colours and cover identity.</p>
                      </button>
                    ) : null}
                    {canManageGuests ? (
                      <button className="teams-operational-card text-left" onClick={() => setPeopleTab('players')}>
                        <Link2 className="h-5 w-5 text-[#9CE8BE]" />
                        <p className="mt-3 font-semibold text-white">Manage Guest Users</p>
                        <p className="mt-1 text-sm text-slate-400">Guests, merge requests, and direct linking.</p>
                      </button>
                    ) : null}
                    {canChangeLeague ? (
                      <button className="teams-operational-card text-left" onClick={() => setChangeLeagueOpen(true)}>
                        <Trophy className="h-5 w-5 text-[#9CE8BE]" />
                        <p className="mt-3 font-semibold text-white">Change League</p>
                        <p className="mt-1 text-sm text-slate-400">Update grade assignment for this team.</p>
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </PortalCard>

            <PortalCard className="teams-section-card">
              <div className="grid gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-white">Pending Requests</h3>
                    <span className="text-sm text-slate-500">{joinRequests.length + guestMergeRequests.length} pending</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">Join requests and guest merge requests stay separated from the people list.</p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Join Requests</p>
                      <span className="text-xs text-slate-500">{joinRequests.length} pending</span>
                    </div>
                    {joinRequests.length ? joinRequests.map((request) => (
                      <div key={request.id} className="teams-operational-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{request.requesterName || request.requesterHandle || 'KickChaser'}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              Requested {request.requestedRole || 'member'}
                              {request.requesterHandle ? ` • ${request.requesterHandle}` : ''}
                            </p>
                          </div>
                          {canApprove ? (
                            <div className="flex flex-wrap gap-2">
                              <button className="teams-action-chip teams-action-chip--accent" disabled={actingRequestId === request.id} onClick={() => onJoinDecision(request.id, request.requestedRole, 'approve')}>
                                Approve
                              </button>
                              <button className="teams-action-chip !text-red-300" disabled={actingRequestId === request.id} onClick={() => onJoinDecision(request.id, request.requestedRole, 'decline')}>
                                Decline
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )) : <div className="rounded-[22px] bg-white/[0.03] p-4 text-sm text-slate-400">No pending join requests.</div>}
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Guest Merge Requests</p>
                      <span className="text-xs text-slate-500">{guestMergeRequests.length} pending</span>
                    </div>
                    {guestMergeRequests.length ? guestMergeRequests.map((request) => (
                      <div key={request.id} className="teams-guest-card">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{request.requesterName || request.requesterHandle || 'KickChaser'}</p>
                            <p className="mt-1 text-sm text-[#FBBF24]">Guest: {request.guestName}</p>
                          </div>
                          {canApprove ? (
                            <div className="flex flex-wrap gap-2">
                              <button className="teams-action-chip teams-action-chip--accent" disabled={actingRequestId === request.id} onClick={() => onGuestMergeDecision(request.id, 'approve')}>
                                Approve
                              </button>
                              <button className="teams-action-chip !text-red-300" disabled={actingRequestId === request.id} onClick={() => onGuestMergeDecision(request.id, 'decline')}>
                                Decline
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )) : <div className="rounded-[22px] bg-white/[0.03] p-4 text-sm text-slate-400">No pending guest merge requests.</div>}
                  </div>
                </div>
              </div>
            </PortalCard>

            <PortalCard className="teams-section-card">
              <div className="grid gap-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-white">People</h3>
                    <p className="mt-1 text-sm text-slate-400">Roster players, coaches, members, and trackers stay separated into mobile-style tabs.</p>
                  </div>
                  <span className="text-sm text-slate-500">{activePeople.length} listed</span>
                </div>

                <div className="teams-segmented">
                  {(['players', 'coaches', 'members', 'trackers'] as PeopleTab[]).map((item) => (
                    <button key={item} onClick={() => setPeopleTab(item)} className={`teams-segment ${peopleTab === item ? 'is-active' : ''}`}>
                      {item === 'players' ? 'Players' : item === 'coaches' ? 'Coaches' : item === 'members' ? 'Members' : 'Trackers'}
                    </button>
                  ))}
                </div>

                {!activePeople.length ? (
                  <div className="rounded-[22px] bg-white/[0.03] p-5 text-sm text-slate-400">No {peopleTab} available for this team state yet.</div>
                ) : (
                  <div className="grid gap-3">
                    {activePeople.map((person) => {
                      const canOpenProfile = Boolean(person.userId && !person.isGuest)
                      const canManageRow = Boolean(
                        person.member &&
                          ((canManageTeamAdminStuff && !person.isGuest) || (canManageGuests && person.isGuest))
                      )
                      const content = (
                        <div className="flex items-center gap-4">
                          {peopleTab === 'players' ? (
                            <div className="min-w-[44px] text-center text-[2rem] font-black italic leading-none text-white/78">{person.jerseyNumber ?? '—'}</div>
                          ) : null}
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#142033]">
                            {person.avatarUrl && !person.isGuest ? (
                              <img src={person.avatarUrl} alt={person.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-semibold text-slate-300">{initialsFromName(person.name)}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-black uppercase italic tracking-[0.02em] text-white">{person.name}</p>
                            <p className={`mt-1 text-sm ${person.isGuest ? 'text-[#FBBF24]' : 'text-slate-400'}`}>
                              {person.isGuest
                                ? 'Guest'
                                : peopleTab === 'players'
                                  ? `No. ${person.jerseyNumber ?? '—'}${person.position ? ` • ${formatPosition(person.position)}` : ''}`
                                  : person.handle || formatPosition(person.role) || 'Linked member'}
                            </p>
                          </div>
                          {canManageRow ? (
                            <button
                              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
                              onClick={() => setActionMember(person.member)}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          ) : null}
                        </div>
                      )

                      return (
                        <div
                          key={person.id}
                          className={`rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_14px_32px_rgba(2,8,20,0.22)] ${canOpenProfile ? 'cursor-default' : ''}`}
                        >
                          {content}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </PortalCard>

            <PortalCard className="teams-section-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Delete Squad</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {squad.isOfficial ? 'Official teams are more restricted than custom squads.' : 'Custom squads can be deleted by owner/admin paths.'}
                  </p>
                </div>
                <button className="teams-action-chip !text-red-300" disabled={!canDelete || deleting} onClick={onDeleteTeam}>
                  {deleting ? 'Deleting…' : 'Delete squad'}
                </button>
              </div>
            </PortalCard>
          </div>
        )}
      </section>

      <TeamsModal open={addPlayerOpen} onClose={() => setAddPlayerOpen(false)} title="Add Player" subtitle="Add a roster or guest player entry">
        <form className="grid gap-3" onSubmit={onAddGuestPlayer}>
          <input className="input" value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Player name" />
          <input className="input" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} placeholder="Optional email" />
          <input className="input" value={guestJersey} onChange={(event) => setGuestJersey(event.target.value)} placeholder="Optional jersey number" />
          <button className="teams-action-chip teams-action-chip--accent justify-center" disabled={workingAction === 'add-guest' || !guestName.trim()} type="submit">
            {workingAction === 'add-guest' ? 'Adding…' : 'Add player'}
          </button>
        </form>
      </TeamsModal>

      <TeamsModal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member" subtitle="Send an invite to a linked KickChaser profile">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            void onInvite(inviteHandle)
          }}
        >
          <input className="input" value={inviteHandle} onChange={(event) => setInviteHandle(event.target.value)} placeholder="@playerhandle" />
          <button className="teams-action-chip teams-action-chip--accent justify-center" disabled={sendingInvite || !inviteHandle.trim()} type="submit">
            {sendingInvite ? 'Sending…' : 'Send invite'}
          </button>
          {pendingInvites.length ? (
            <div className="grid gap-2 pt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Pending Invites</p>
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="rounded-[20px] bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {invite.profileName || invite.profileHandle || invite.guestName || 'Invite'} • {invite.role || 'member'}
                </div>
              ))}
            </div>
          ) : null}
        </form>
      </TeamsModal>

      <TeamsModal open={brandingOpen} onClose={() => setBrandingOpen(false)} title="Edit Club Branding" subtitle="Logo and colour surfaces stay inside Teams">
        <SquadBrandingPanel
          ownerId={userId || squad.ownerId || ''}
          squadId={squad.id}
          canManage={Boolean(canEditBranding)}
          logoUrl={squad.logoUrl}
          primaryColorHex={squad.primaryColorHex}
          secondaryColorHex={squad.secondaryColorHex}
          tertiaryColorHex={squad.tertiaryColorHex}
          saving={savingBranding}
          onSave={onSaveBranding}
        />
      </TeamsModal>

      <TeamsModal open={changeLeagueOpen} onClose={() => setChangeLeagueOpen(false)} title="Change League" subtitle="League and grade changes follow official/custom permissions">
        <div className="grid gap-3">
          <select className="input" value={selectedGradeId} onChange={(event) => setSelectedGradeId(event.target.value)}>
            <option value="">Select grade</option>
            {gradeOptions.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name || grade.code || grade.id}
              </option>
            ))}
          </select>
          <button className="teams-action-chip teams-action-chip--accent justify-center" disabled={changingGrade || !selectedGradeId} onClick={() => void onChangeGrade()}>
            {changingGrade ? 'Saving…' : 'Update grade'}
          </button>
        </div>
      </TeamsModal>

      <TeamsModal open={Boolean(actionMember)} onClose={() => setActionMember(null)} title={actionMember ? displayMemberName(actionMember) : 'Manage member'} subtitle="Member actions open in a sheet, not inline">
        {actionMember ? (
          <div className="grid gap-2">
            <button className="teams-action-chip justify-between" onClick={() => { setNumberModalMember(actionMember); setNumberModalValue(actionMember.jerseyNumber?.toString() ?? ''); setActionMember(null) }}>
              Edit jersey number
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="teams-action-chip justify-between" onClick={() => { setPositionMember(actionMember); setActionMember(null) }}>
              Edit position
              <ArrowRight className="h-4 w-4" />
            </button>
            {canManageTeamAdminStuff && !actionMember.userId ? (
              <button
                className="teams-action-chip justify-between"
                onClick={() => {
                  setGuestEditMember(actionMember)
                  setGuestEditName(actionMember.guestName ?? '')
                  setGuestEditEmail(actionMember.guestEmail ?? '')
                  setGuestEditNumber(actionMember.jerseyNumber?.toString() ?? '')
                  setActionMember(null)
                }}
              >
                Edit guest name / number
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
            {canManageGuests && !actionMember.userId ? (
              <button className="teams-action-chip justify-between" onClick={() => { setMergeModalMember(actionMember); setLinkHandle(''); setFoundProfile(null); setActionMember(null) }}>
                Link guest to user
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
            {canManageTeamAdminStuff && actionMember.userId ? (
              <>
                <button className="teams-action-chip justify-between" onClick={() => void updateRosterRole(actionMember, 'coach', 'grant')}>
                  Promote to coach
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="teams-action-chip justify-between" onClick={() => void updateRosterRole(actionMember, 'tracker', 'grant')}>
                  Promote to tracker
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button className="teams-action-chip justify-between" onClick={() => void updateRosterRole(actionMember, 'admin', 'grant')}>
                  Promote to admin
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            ) : null}
            {(canManageTeamAdminStuff || (canManageGuests && !actionMember.userId)) ? (
              <button
                className="teams-action-chip justify-between !text-red-300"
                disabled={savingMemberId === actionMember.id}
                onClick={() => {
                  const confirmed = window.confirm(`Remove ${displayMemberName(actionMember)} from this squad?`)
                  if (!confirmed) return
                  setActionMember(null)
                  void onRemoveMember(actionMember.id)
                }}
              >
                Remove from squad
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </TeamsModal>

      <TeamsModal open={Boolean(numberModalMember)} onClose={() => setNumberModalMember(null)} title={numberModalMember ? `Edit jersey number` : 'Edit jersey number'} subtitle="Number changes require confirmation before saving">
        {numberModalMember ? (
          <div className="grid gap-3">
            <input className="input" value={numberModalValue} onChange={(event) => setNumberModalValue(event.target.value)} placeholder="Jersey number" />
            <button
              className="teams-action-chip teams-action-chip--accent justify-center"
              disabled={savingMemberId === numberModalMember.id}
              onClick={() => {
                const parsed = numberModalValue.trim() ? Number(numberModalValue.trim()) : null
                const description = parsed == null ? 'remove the jersey number' : `set the jersey number to #${parsed}`
                const confirmed = window.confirm(`Are you sure you want to ${description}?`)
                if (!confirmed) return
                void onUpdateNumber(numberModalMember.id, parsed)
                setNumberModalMember(null)
              }}
            >
              Save number
            </button>
          </div>
        ) : null}
      </TeamsModal>

      <TeamsModal open={Boolean(positionMember)} onClose={() => setPositionMember(null)} title={positionMember ? 'Edit position' : 'Edit position'} subtitle="Position changes apply immediately from the sheet">
        <div className="grid gap-2 sm:grid-cols-2">
          {POSITION_OPTIONS.map((position) => (
            <button
              key={position}
              className="teams-action-chip justify-between"
              disabled={!positionMember}
              onClick={() => {
                if (!positionMember) return
                void onUpdatePosition(positionMember.id, position)
                setPositionMember(null)
              }}
            >
              {position}
              <ArrowRight className="h-4 w-4" />
            </button>
          ))}
        </div>
      </TeamsModal>

      <TeamsModal open={Boolean(guestEditMember)} onClose={() => setGuestEditMember(null)} title="Edit Guest" subtitle="Guests stay visually and operationally distinct from linked users">
        <form className="grid gap-3" onSubmit={onSaveGuestEdit}>
          <input className="input" value={guestEditName} onChange={(event) => setGuestEditName(event.target.value)} placeholder="Guest name" />
          <input className="input" value={guestEditEmail} onChange={(event) => setGuestEditEmail(event.target.value)} placeholder="Guest email" />
          <input className="input" value={guestEditNumber} onChange={(event) => setGuestEditNumber(event.target.value)} placeholder="Jersey number" />
          <button className="teams-action-chip teams-action-chip--accent justify-center" disabled={workingAction === 'edit-guest' || !guestEditName.trim()} type="submit">
            {workingAction === 'edit-guest' ? 'Saving…' : 'Save guest'}
          </button>
        </form>
      </TeamsModal>

      <TeamsModal open={Boolean(mergeModalMember)} onClose={() => setMergeModalMember(null)} title={mergeModalMember ? `Link ${mergeModalMember.guestName || 'guest player'}` : 'Link guest'} subtitle="Guest linking is a dedicated reconciliation flow">
        <div className="grid gap-3">
          <div className="flex gap-2">
            <input className="input flex-1" value={linkHandle} onChange={(event) => setLinkHandle(event.target.value)} placeholder="@playerhandle" />
            <button className="teams-action-chip inline-flex items-center gap-2" disabled={workingAction === 'search-link' || !linkHandle.trim()} onClick={() => void onSearchHandle()}>
              <Link2 className="h-4 w-4" />
              Search
            </button>
          </div>
          {foundProfile ? (
            <div className="teams-guest-card">
              <p className="font-semibold text-white">{foundProfile.name || foundProfile.handle || 'Profile found'}</p>
              <p className="mt-1 text-sm text-slate-400">{foundProfile.handle || 'No handle'}</p>
            </div>
          ) : null}
          {linkError ? <p className="text-sm text-red-300">{linkError}</p> : null}
          <button className="teams-action-chip teams-action-chip--accent justify-center" disabled={workingAction === 'direct-link' || !mergeModalMember || !foundProfile?.userId} onClick={() => void onDirectLinkGuest()}>
            {workingAction === 'direct-link' ? 'Linking…' : 'Link guest to user'}
          </button>
        </div>
      </TeamsModal>

      <TeamsModal open={heroMenuOpen} onClose={() => setHeroMenuOpen(false)} title="Team Options" subtitle="Additional actions for this team">
        <div className="grid gap-2">
          {Boolean(userId && !isOwner && isAcceptedMember) ? (
            <button
              type="button"
              onClick={() => {
                setHeroMenuOpen(false)
                void onLeave()
              }}
              disabled={leaving}
              className="teams-action-chip justify-between !text-red-300"
            >
              {leaving ? 'Leaving…' : 'Leave team'}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </TeamsModal>
    </>
  )
}
