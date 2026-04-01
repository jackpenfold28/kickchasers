import { supabase } from '@/lib/supabase'

export type RequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'revoked' | 'archived'

export type VettingAnswers = {
  role_at_club?: string
  reason?: string
  verification?: string
} & Record<string, unknown>

export type RequesterProfile = {
  userId: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
}

export type SquadSummary = {
  id: string
  name: string | null
  clubId: string | null
  leagueId: string | null
  gradeId: string | null
  stateCode: string | null
  isOfficial: boolean
  archivedAt: string | null
  logoUrl: string | null
  clubName: string | null
  leagueName: string | null
  leagueShortName: string | null
  gradeName: string | null
  gradeCode: string | null
}

export type SquadAdminRequest = {
  id: string
  squadId: string
  requesterUserId: string
  status: RequestStatus
  vettingAnswers: VettingAnswers | null
  adminNotes: string | null
  decidedAt: string | null
  decidedBy: string | null
  createdAt: string
  updatedAt: string
  squad: SquadSummary | null
  requester: RequesterProfile | null
}

export type DirectoryRequestKind = 'add_league' | 'add_grade' | 'add_club' | 'add_squad'

export type DirectoryRequest = {
  id: string
  requesterUserId: string
  requestKind: DirectoryRequestKind
  payload: Record<string, unknown>
  status: RequestStatus
  adminNotes: string | null
  decidedAt: string | null
  decidedBy: string | null
  createdAt: string
  updatedAt: string
  requester: RequesterProfile | null
}

export type OfficialSquadAdminRow = {
  id: string
  name: string | null
  logoUrl: string | null
  archivedAt: string | null
  createdAt: string | null
  clubId: string | null
  clubName: string | null
  leagueId: string | null
  leagueName: string | null
  leagueShortName: string | null
  stateCode: string | null
}

export type LeagueAdminRow = {
  id: string
  name: string | null
  shortName: string | null
  stateCode: string | null
  isActive: boolean
  clubCount: number
  officialSquadCount: number
}

export type LeagueAdminDetail = {
  id: string
  name: string | null
  shortName: string | null
  stateCode: string | null
  isActive: boolean
  clubCount: number
  officialSquadCount: number
  squads: OfficialSquadAdminRow[]
}

export type ModerationPost = {
  id: string
  body: string | null
  imageUrl: string | null
  authorId: string | null
  authorName: string | null
  createdAt: string | null
  hiddenAt: string | null
}

export type AdminUserResult = {
  userId: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
  isPlatformAdmin: boolean
}

export type AdminProfileRow = {
  userId: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
  createdAt: string | null
  onboardingCompletedAt: string | null
  onboardingComplete: boolean
  stateCode: string | null
  clubName: string | null
  leagueName: string | null
  leagueShortName: string | null
  primaryRole: string | null
  isPlatformAdmin: boolean
}

export type AdminProfilesFilter = {
  search?: string
  onboarding?: 'all' | 'complete' | 'incomplete'
  state?: string
  league?: string
  club?: string
  sort?: 'newest' | 'oldest'
}

export type AdminOverviewStats = {
  newUsers30d: number
  onboardingCompleted: number
  gamesTracked: number
  pendingOfficialAdminRequests: number
  pendingDirectoryRequests: number
  officialSquadsCount: number
  leaguesCount: number
  clubsCount: number
}

export type RecentAdminUser = {
  userId: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
  createdAt: string | null
  onboardingCompletedAt: string | null
  stateCode: string | null
  clubName: string | null
  leagueName: string | null
  leagueShortName: string | null
}

export type PlatformActivityItem = {
  id: string
  type: 'directory_request_created' | 'official_admin_request_created' | 'post_hidden' | 'official_squad_archived'
  title: string
  context: string
  createdAt: string | null
}

const AVATAR_BUCKET = 'profile-avatars'
const TEAM_LOGO_BUCKET = 'team-logos'

function resolvePublicUrl(path: string | null | undefined, bucket: string) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const clean = path.replace(/^\/+/, '')
  const explicit = clean.match(/^([^:]+)::(.+)$/)
  if (explicit) {
    const { data } = supabase.storage.from(explicit[1]).getPublicUrl(explicit[2])
    return data.publicUrl || path
  }

  if (clean.includes('/')) {
    const [candidateBucket, ...rest] = clean.split('/')
    if (candidateBucket && rest.length) {
      const { data } = supabase.storage.from(candidateBucket).getPublicUrl(rest.join('/'))
      return data.publicUrl || path
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(clean)
  return data.publicUrl || path
}

async function mapRequesterProfiles(userIds: string[]): Promise<Map<string, RequesterProfile>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  if (!uniqueIds.length) return new Map()

  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path')
    .in('user_id', uniqueIds)

  if (error) throw error

  const map = new Map<string, RequesterProfile>()
  ;(data ?? []).forEach((row: any) => {
    if (!row.user_id) return
    map.set(row.user_id, {
      userId: row.user_id,
      name: row.name ?? null,
      handle: row.handle ?? null,
      avatarUrl: resolvePublicUrl(row.avatar_url ?? row.avatar_path ?? null, AVATAR_BUCKET),
    })
  })

  return map
}

async function mapGradeMetadata(gradeIds: string[]) {
  const validIds = Array.from(new Set(gradeIds.filter(Boolean)))
  if (!validIds.length) return new Map<string, { name: string | null; code: string | null }>()

  const { data, error } = await supabase
    .from('league_grades')
    .select('id,name,code,grade_catalog(label)')
    .in('id', validIds)

  if (error) throw error

  const map = new Map<string, { name: string | null; code: string | null }>()
  ;(data ?? []).forEach((row: any) => {
    map.set(row.id, {
      name: row.grade_catalog?.label ?? row.name ?? null,
      code: row.code ?? null,
    })
  })

  return map
}

async function setRequestStatus(
  table: 'official_squad_admin_requests' | 'official_directory_requests',
  requestId: string,
  status: RequestStatus,
  decidedBy: string | null,
  adminNotes?: string | null
) {
  const payload: Record<string, unknown> = {
    status,
    admin_notes: adminNotes ?? null,
  }

  if (decidedBy) {
    payload.decided_by = decidedBy
    payload.decided_at = new Date().toISOString()
  }

  const { error } = await supabase.from(table).update(payload).eq('id', requestId)
  if (error) throw error
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function throwFriendly(error: any, fallback: string): never {
  if (error?.code === '23505') {
    throw new Error(fallback)
  }

  throw error
}

export async function fetchAdminOverviewStats(): Promise<AdminOverviewStats> {
  const recentCutoff = new Date()
  recentCutoff.setDate(recentCutoff.getDate() - 30)
  const recentIso = recentCutoff.toISOString()

  const [
    newUsers30d,
    onboardingCompleted,
    gamesTracked,
    pendingOfficialAdminRequests,
    pendingDirectoryRequests,
    officialSquadsCount,
    leaguesCount,
    clubsCount,
  ] = await Promise.all([
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }).gte('created_at', recentIso),
    supabase
      .from('profiles')
      .select('user_id', { count: 'exact', head: true })
      .not('onboarding_completed_at', 'is', null),
    supabase.from('games').select('id', { count: 'exact', head: true }),
    supabase
      .from('official_squad_admin_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('official_directory_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('squads').select('id', { count: 'exact', head: true }).eq('is_official', true),
    supabase.from('leagues').select('id', { count: 'exact', head: true }),
    supabase.from('clubs').select('id', { count: 'exact', head: true }),
  ])

  if (newUsers30d.error) throw newUsers30d.error
  if (onboardingCompleted.error) throw onboardingCompleted.error
  if (gamesTracked.error) throw gamesTracked.error
  if (pendingOfficialAdminRequests.error) throw pendingOfficialAdminRequests.error
  if (pendingDirectoryRequests.error) throw pendingDirectoryRequests.error
  if (officialSquadsCount.error) throw officialSquadsCount.error
  if (leaguesCount.error) throw leaguesCount.error
  if (clubsCount.error) throw clubsCount.error

  return {
    newUsers30d: newUsers30d.count ?? 0,
    onboardingCompleted: onboardingCompleted.count ?? 0,
    gamesTracked: gamesTracked.count ?? 0,
    pendingOfficialAdminRequests: pendingOfficialAdminRequests.count ?? 0,
    pendingDirectoryRequests: pendingDirectoryRequests.count ?? 0,
    officialSquadsCount: officialSquadsCount.count ?? 0,
    leaguesCount: leaguesCount.count ?? 0,
    clubsCount: clubsCount.count ?? 0,
  }
}

export async function listRecentAdminUsers(limit = 6): Promise<RecentAdminUser[]> {
  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path,created_at,home_state_code,home_club_name,home_league_name,home_league_short_name')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const userIds = ((data ?? []) as any[]).map((row) => row.user_id).filter(Boolean)
  const { data: profileRows, error: profileError } = userIds.length
    ? await supabase
        .from('profiles')
        .select('user_id,onboarding_completed_at')
        .in('user_id', userIds)
    : { data: [], error: null }

  if (profileError) throw profileError

  const profileMap = new Map<string, any>()
  ;((profileRows ?? []) as any[]).forEach((row) => {
    if (row.user_id) profileMap.set(row.user_id, row)
  })

  return ((data ?? []) as any[]).map((row) => ({
    userId: row.user_id,
    name: row.name ?? null,
    handle: row.handle ?? null,
    avatarUrl: resolvePublicUrl(row.avatar_url ?? row.avatar_path ?? null, AVATAR_BUCKET),
    createdAt: row.created_at ?? null,
    onboardingCompletedAt: profileMap.get(row.user_id)?.onboarding_completed_at ?? null,
    stateCode: row.home_state_code ?? null,
    clubName: row.home_club_name ?? null,
    leagueName: row.home_league_name ?? null,
    leagueShortName: row.home_league_short_name ?? null,
  }))
}

export async function listPlatformActivity(limit = 10): Promise<PlatformActivityItem[]> {
  const [directoryRequests, squadRequests, hiddenPosts, archivedSquads] = await Promise.all([
    supabase
      .from('official_directory_requests')
      .select('id,request_kind,payload,created_at')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('official_squad_admin_requests')
      .select('id,created_at,squads(name),requester_user_id')
      .order('created_at', { ascending: false })
      .limit(limit),
    supabase
      .from('posts')
      .select('id,body,hidden_at')
      .not('hidden_at', 'is', null)
      .order('hidden_at', { ascending: false })
      .limit(limit),
    supabase
      .from('squads')
      .select('id,name,archived_at')
      .eq('is_official', true)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .limit(limit),
  ])

  if (directoryRequests.error) throw directoryRequests.error
  if (squadRequests.error) throw squadRequests.error
  if (hiddenPosts.error) throw hiddenPosts.error
  if (archivedSquads.error) throw archivedSquads.error

  const items: PlatformActivityItem[] = [
    ...((directoryRequests.data ?? []) as any[]).map((row) => ({
      id: `directory-${row.id}`,
      type: 'directory_request_created' as const,
      title: `Directory request: ${row.request_kind?.replace(/_/g, ' ') ?? 'request'}`,
      context: String(row.payload?.club_name ?? row.payload?.league_name ?? row.payload?.grade_name ?? row.payload?.squad_name ?? 'Directory request'),
      createdAt: row.created_at ?? null,
    })),
    ...((squadRequests.data ?? []) as any[]).map((row) => ({
      id: `admin-${row.id}`,
      type: 'official_admin_request_created' as const,
      title: 'Official admin request created',
      context: row.squads?.name ?? 'Official squad request',
      createdAt: row.created_at ?? null,
    })),
    ...((hiddenPosts.data ?? []) as any[]).map((row) => ({
      id: `post-${row.id}`,
      type: 'post_hidden' as const,
      title: 'Post hidden',
      context: row.body ?? '(image post)',
      createdAt: row.hidden_at ?? null,
    })),
    ...((archivedSquads.data ?? []) as any[]).map((row) => ({
      id: `squad-${row.id}`,
      type: 'official_squad_archived' as const,
      title: 'Official squad archived',
      context: row.name ?? 'Official squad',
      createdAt: row.archived_at ?? null,
    })),
  ]

  return items
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, limit)
}

export async function listSquadAdminRequests(
  statusFilter: RequestStatus[] = ['pending']
): Promise<SquadAdminRequest[]> {
  const { data, error } = await supabase
    .from('official_squad_admin_requests')
    .select(
      'id,squad_id,requester_user_id,status,vetting_answers,admin_notes,decided_at,decided_by,created_at,updated_at,squads!inner(id,name,club_id,league_id,grade_id,league_grade_id,state_code,is_official,archived_at,logo_url,clubs(name),leagues(name,short_name,state_code))'
    )
    .in('status', statusFilter)
    .order('created_at', { ascending: true })

  if (error) throw error

  const requesterIds = (data ?? []).map((row: any) => row.requester_user_id).filter(Boolean)
  const gradeIds = (data ?? [])
    .map((row: any) => row.squads?.league_grade_id ?? row.squads?.grade_id ?? null)
    .filter(Boolean)

  const [profileMap, gradeMap] = await Promise.all([
    mapRequesterProfiles(requesterIds),
    mapGradeMetadata(gradeIds),
  ])

  return (data ?? []).map((row: any) => {
    const squad = row.squads
    const gradeId = squad?.league_grade_id ?? squad?.grade_id ?? null
    const gradeMeta = gradeId ? gradeMap.get(gradeId) : null

    return {
      id: row.id,
      squadId: row.squad_id,
      requesterUserId: row.requester_user_id,
      status: row.status,
      vettingAnswers: row.vetting_answers ?? null,
      adminNotes: row.admin_notes ?? null,
      decidedAt: row.decided_at ?? null,
      decidedBy: row.decided_by ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      squad: squad
        ? {
            id: squad.id,
            name: squad.name ?? null,
            clubId: squad.club_id ?? null,
            leagueId: squad.league_id ?? null,
            gradeId: gradeId,
            stateCode: squad.state_code ?? null,
            isOfficial: Boolean(squad.is_official),
            archivedAt: squad.archived_at ?? null,
            logoUrl: resolvePublicUrl(squad.logo_url ?? null, TEAM_LOGO_BUCKET),
            clubName: squad.clubs?.name ?? null,
            leagueName: squad.leagues?.name ?? null,
            leagueShortName: squad.leagues?.short_name ?? null,
            gradeName: gradeMeta?.name ?? null,
            gradeCode: gradeMeta?.code ?? null,
          }
        : null,
      requester: profileMap.get(row.requester_user_id ?? '') ?? null,
    }
  })
}

export async function approveSquadAdminRequest(
  requestId: string,
  requesterUserId: string,
  clubId: string | null,
  actingUserId: string | null,
  adminNotes?: string | null
) {
  if (!actingUserId) throw new Error('Only platform admins can approve requests.')
  if (!requestId || !requesterUserId || !clubId) throw new Error('Missing request context for approval.')

  const { error: roleError } = await supabase
    .from('club_roles')
    .insert({ club_id: clubId, user_id: requesterUserId, role: 'admin', updated_by: actingUserId })

  if (roleError && roleError.code !== '23505') throw roleError
  await setRequestStatus('official_squad_admin_requests', requestId, 'approved', actingUserId, adminNotes)
}

export async function revokeSquadAdminRequest(
  requestId: string,
  requesterUserId: string,
  clubId: string | null,
  actingUserId: string | null,
  adminNotes?: string | null
) {
  if (!actingUserId) throw new Error('Only platform admins can revoke requests.')
  if (!requestId || !requesterUserId || !clubId) throw new Error('Missing request context for revocation.')

  const { error } = await supabase.rpc('rpc_revoke_club_role', {
    _club_id: clubId,
    _user_id: requesterUserId,
    _role: 'admin',
    _acting_user_id: actingUserId,
  })

  if (error && error.code !== 'PGRST116') throw error
  await setRequestStatus('official_squad_admin_requests', requestId, 'revoked', actingUserId, adminNotes)
}

export async function updateSquadAdminRequestStatus(
  requestId: string,
  status: RequestStatus,
  actingUserId: string | null,
  adminNotes?: string | null
) {
  if (!actingUserId) throw new Error('Not authenticated.')
  await setRequestStatus('official_squad_admin_requests', requestId, status, actingUserId, adminNotes)
}

export async function listDirectoryRequests(
  statusFilter: RequestStatus[] = ['pending']
): Promise<DirectoryRequest[]> {
  const { data, error } = await supabase
    .from('official_directory_requests')
    .select('id,requester_user_id,request_kind,payload,status,admin_notes,decided_at,decided_by,created_at,updated_at')
    .in('status', statusFilter)
    .order('created_at', { ascending: true })

  if (error) throw error

  const requesterIds = (data ?? []).map((row: any) => row.requester_user_id).filter(Boolean)
  const profileMap = await mapRequesterProfiles(requesterIds)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    requesterUserId: row.requester_user_id,
    requestKind: row.request_kind,
    payload: row.payload ?? {},
    status: row.status,
    adminNotes: row.admin_notes ?? null,
    decidedAt: row.decided_at ?? null,
    decidedBy: row.decided_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requester: profileMap.get(row.requester_user_id ?? '') ?? null,
  }))
}

export async function updateDirectoryRequestStatus(
  requestId: string,
  status: RequestStatus,
  actingUserId: string | null,
  adminNotes?: string | null
) {
  if (!actingUserId) throw new Error('Not authenticated.')
  await setRequestStatus('official_directory_requests', requestId, status, actingUserId, adminNotes)
}

export async function approveDirectoryRequest(
  request: DirectoryRequest,
  actingUserId: string | null,
  adminNotes?: string | null
) {
  if (!actingUserId) throw new Error('Not authenticated.')

  const payload = request.payload ?? {}

  if (request.requestKind === 'add_club') {
    const clubName = typeof payload.club_name === 'string' ? payload.club_name.trim() : ''
    const leagueId = typeof payload.league_id === 'string' ? payload.league_id.trim() : ''

    const { error } = await supabase
      .from('official_directory_requests')
      .update({
        status: 'approved',
        decided_by: actingUserId,
        decided_at: new Date().toISOString(),
        admin_notes: adminNotes ?? null,
      })
      .eq('id', request.id)

    if (error) throw error

    if (leagueId && clubName) {
      await supabase
        .from('clubs')
        .select('id')
        .eq('league_id', leagueId)
        .ilike('name', clubName)
        .maybeSingle()
    }

    return
  }

  if (request.requestKind === 'add_league') {
    const stateCode = typeof payload.state_code === 'string' ? payload.state_code.trim().toUpperCase() : ''
    const leagueName = typeof payload.league_name === 'string' ? payload.league_name.trim() : ''
    const shortName =
      typeof payload.short_name === 'string' && payload.short_name.trim().length ? payload.short_name.trim() : null

    if (!stateCode || !leagueName) {
      throw new Error('League name and state are required.')
    }

    const { error } = await supabase.from('leagues').insert({
      name: leagueName,
      state_code: stateCode,
      short_name: shortName,
      is_custom: false,
      is_active: true,
      created_by: actingUserId,
    })

    if (error) throwFriendly(error, 'A league with that name already exists.')
  } else if (request.requestKind === 'add_grade') {
    const leagueId = typeof payload.league_id === 'string' ? payload.league_id.trim() : ''
    const gradeName = typeof payload.grade_name === 'string' ? payload.grade_name.trim() : ''
    const codeRaw = typeof payload.code === 'string' ? payload.code.trim() : ''
    const code = codeRaw.length ? codeRaw : slugify(gradeName || 'grade').replace(/-/g, '_')

    if (!leagueId || !gradeName) {
      throw new Error('League and grade name are required.')
    }

    const { error } = await supabase.from('league_grades').insert({
      league_id: leagueId,
      name: gradeName,
      code,
      is_custom: false,
    })

    if (error) throwFriendly(error, 'That grade already exists for this league.')
  } else if (request.requestKind === 'add_squad') {
    const clubId = typeof payload.club_id === 'string' ? payload.club_id.trim() : ''
    const leagueId = typeof payload.league_id === 'string' ? payload.league_id.trim() : ''
    const gradeId = typeof payload.grade_id === 'string' ? payload.grade_id.trim() : null
    const stateCode = typeof payload.state_code === 'string' ? payload.state_code.trim().toUpperCase() : ''
    const squadName = typeof payload.squad_name === 'string' ? payload.squad_name.trim() : ''

    if (!clubId || !leagueId || !squadName || !stateCode) {
      throw new Error('Club, league, squad name, and state are required.')
    }

    const { data: numberRows, error: numberError } = await supabase.from('squads').select('number').eq('user_id', actingUserId)
    if (numberError) throw numberError

    const nextNumber =
      (numberRows ?? []).reduce((max: number, row: any) => Math.max(max, row.number ?? 0), 0) + 1

    const { error } = await supabase.from('squads').insert({
      owner_id: actingUserId,
      user_id: actingUserId,
      name: squadName,
      number: nextNumber,
      set_name: 'Default',
      state_code: stateCode,
      league_id: leagueId,
      grade_id: gradeId,
      club_id: clubId,
      is_official: true,
    })

    if (error) throwFriendly(error, 'An official squad already exists for this club.')
  }

  await setRequestStatus('official_directory_requests', request.id, 'approved', actingUserId, adminNotes)
}

export async function listOfficialSquads(limit?: number): Promise<OfficialSquadAdminRow[]> {
  let query = supabase
    .from('squads')
    .select('id,name,logo_url,archived_at,created_at,club_id,league_id,state_code,clubs:club_id(name),leagues:league_id(name,short_name)')
    .eq('is_official', true)
    .order('created_at', { ascending: false })

  if (typeof limit === 'number') {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? null,
    logoUrl: resolvePublicUrl(row.logo_url ?? null, TEAM_LOGO_BUCKET),
    archivedAt: row.archived_at ?? null,
    createdAt: row.created_at ?? null,
    clubId: row.club_id ?? null,
    clubName: row.clubs?.name ?? null,
    leagueId: row.league_id ?? null,
    leagueName: row.leagues?.name ?? null,
    leagueShortName: row.leagues?.short_name ?? null,
    stateCode: row.state_code ?? null,
  }))
}

export async function listPlatformLeagues(limit?: number): Promise<LeagueAdminRow[]> {
  let leagueQuery = supabase
    .from('leagues')
    .select('id,name,short_name,state_code,is_active')
    .order('name', { ascending: true })

  if (typeof limit === 'number') {
    leagueQuery = leagueQuery.limit(limit)
  }

  const [{ data: leagues, error: leaguesError }, { data: clubs, error: clubsError }, { data: officialSquads, error: squadsError }] =
    await Promise.all([
      leagueQuery,
      supabase.from('clubs').select('id,league_id'),
      supabase.from('squads').select('id,league_id').eq('is_official', true),
    ])

  if (leaguesError) throw leaguesError
  if (clubsError) throw clubsError
  if (squadsError) throw squadsError

  const clubCounts = new Map<string, number>()
  ;(clubs ?? []).forEach((row: any) => {
    if (!row.league_id) return
    clubCounts.set(row.league_id, (clubCounts.get(row.league_id) ?? 0) + 1)
  })

  const squadCounts = new Map<string, number>()
  ;(officialSquads ?? []).forEach((row: any) => {
    if (!row.league_id) return
    squadCounts.set(row.league_id, (squadCounts.get(row.league_id) ?? 0) + 1)
  })

  return (leagues ?? []).map((row: any) => ({
    id: row.id,
    name: row.name ?? null,
    shortName: row.short_name ?? null,
    stateCode: row.state_code ?? null,
    isActive: Boolean(row.is_active),
    clubCount: clubCounts.get(row.id) ?? 0,
    officialSquadCount: squadCounts.get(row.id) ?? 0,
  }))
}

export async function fetchLeagueAdminDetail(leagueId: string): Promise<LeagueAdminDetail | null> {
  const [leagues, squads] = await Promise.all([
    listPlatformLeagues(),
    listOfficialSquads(),
  ])

  const league = leagues.find((row) => row.id === leagueId) ?? null
  if (!league) return null

  return {
    ...league,
    squads: squads.filter((row) => row.leagueId === leagueId),
  }
}

export async function updateLeagueActiveState(leagueId: string, isActive: boolean) {
  const { error } = await supabase.from('leagues').update({ is_active: isActive }).eq('id', leagueId)
  if (error) throw error
}

export async function listModerationPosts(limit = 40): Promise<ModerationPost[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id,body,image_url,author_id,created_at,hidden_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const authorIds = Array.from(new Set((data ?? []).map((row: any) => row.author_id).filter(Boolean)))
  const profileMap = new Map<string, { name: string | null }>()

  if (authorIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles_directory')
      .select('user_id,name')
      .in('user_id', authorIds)

    if (profilesError) throw profilesError

    ;(profiles ?? []).forEach((row: any) => {
      if (!row.user_id) return
      profileMap.set(row.user_id, { name: row.name ?? null })
    })
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    body: row.body ?? null,
    imageUrl: row.image_url ?? null,
    authorId: row.author_id ?? null,
    authorName: profileMap.get(row.author_id ?? '')?.name ?? null,
    createdAt: row.created_at ?? null,
    hiddenAt: row.hidden_at ?? null,
  }))
}

export async function searchUsersForAdmin(query: string): Promise<AdminUserResult[]> {
  const term = query.trim().replace(/^@+/, '')
  if (!term) return []

  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path')
    .or(`handle.ilike.%${term}%,name.ilike.%${term}%`)
    .limit(20)

  if (error) throw error

  const userIds = (data ?? []).map((row: any) => row.user_id).filter(Boolean)
  const adminMap = new Set<string>()

  if (userIds.length) {
    const { data: admins, error: adminsError } = await supabase
      .from('platform_admins')
      .select('profile_user_id')
      .in('profile_user_id', userIds)

    if (adminsError) throw adminsError

    ;(admins ?? []).forEach((row: any) => {
      if (row.profile_user_id) adminMap.add(row.profile_user_id)
    })
  }

  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    name: row.name ?? null,
    handle: row.handle ?? null,
    avatarUrl: resolvePublicUrl(row.avatar_url ?? row.avatar_path ?? null, AVATAR_BUCKET),
    isPlatformAdmin: adminMap.has(row.user_id),
  }))
}

export async function listAdminProfiles(filters: AdminProfilesFilter = {}): Promise<AdminProfileRow[]> {
  const { data: profiles, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path,created_at,home_state_code,home_club_name,home_league_name,home_league_short_name')
    .order('created_at', { ascending: false })
    .range(0, 999)

  if (error) throw error

  const userIds = ((profiles ?? []) as any[]).map((row) => row.user_id).filter(Boolean)

  const [profileRes, adminsRes] = await Promise.all([
    userIds.length
      ? supabase
          .from('profiles')
          .select('user_id,onboarding_completed_at,primary_role')
          .in('user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? supabase.from('platform_admins').select('profile_user_id').in('profile_user_id', userIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (profileRes.error) throw profileRes.error
  if (adminsRes.error) throw adminsRes.error

  const profileMap = new Map<string, any>()
  ;((profileRes.data ?? []) as any[]).forEach((row) => {
    if (row.user_id) profileMap.set(row.user_id, row)
  })

  const adminSet = new Set<string>()
  ;((adminsRes.data ?? []) as any[]).forEach((row) => {
    if (row.profile_user_id) adminSet.add(row.profile_user_id)
  })

  const search = filters.search?.trim().toLowerCase() ?? ''

  let rows = ((profiles ?? []) as any[]).map((row) => {
    const profile = profileMap.get(row.user_id)
    return {
      userId: row.user_id,
      name: row.name ?? null,
      handle: row.handle ?? null,
      avatarUrl: resolvePublicUrl(row.avatar_url ?? row.avatar_path ?? null, AVATAR_BUCKET),
      createdAt: row.created_at ?? null,
      onboardingCompletedAt: profile?.onboarding_completed_at ?? null,
      onboardingComplete: Boolean(profile?.onboarding_completed_at),
      stateCode: row.home_state_code ?? null,
      clubName: row.home_club_name ?? null,
      leagueName: row.home_league_name ?? null,
      leagueShortName: row.home_league_short_name ?? null,
      primaryRole: profile?.primary_role ?? null,
      isPlatformAdmin: adminSet.has(row.user_id),
    } as AdminProfileRow
  })

  if (search) {
    rows = rows.filter((row) => {
      return (
        (row.name || '').toLowerCase().includes(search) ||
        (row.handle || '').toLowerCase().includes(search)
      )
    })
  }

  if (filters.onboarding === 'complete') {
    rows = rows.filter((row) => row.onboardingComplete)
  } else if (filters.onboarding === 'incomplete') {
    rows = rows.filter((row) => !row.onboardingComplete)
  }

  if (filters.state) {
    rows = rows.filter((row) => row.stateCode === filters.state)
  }

  if (filters.league) {
    rows = rows.filter((row) => (row.leagueShortName || row.leagueName) === filters.league)
  }

  if (filters.club) {
    rows = rows.filter((row) => row.clubName === filters.club)
  }

  rows.sort((a, b) => {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return filters.sort === 'oldest' ? left - right : right - left
  })

  return rows
}
