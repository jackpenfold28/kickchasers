import { supabase } from '@/lib/supabase'

export type SquadSummary = {
  id: string
  name: string | null
  logoUrl: string | null
  ownerId: string | null
  role: string | null
  status: string | null
  memberCount: number
  isOfficial: boolean
  leagueId: string | null
  leagueName: string | null
  leagueShortName: string | null
  clubId: string | null
  gradeId: string | null
}

export type SquadDetail = {
  id: string
  name: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  ownerId: string | null
  clubId: string | null
  leagueId: string | null
  leagueName: string | null
  leagueShortName: string | null
  gradeId: string | null
  isOfficial: boolean
  primaryColorHex: string | null
  secondaryColorHex: string | null
  tertiaryColorHex: string | null
}

export type SquadMember = {
  id: string
  squadId: string
  userId: string | null
  guestName: string | null
  guestEmail: string | null
  handle: string | null
  profileName: string | null
  jerseyNumber: number | null
  position: string | null
  role: string
  status: string
}

export type FollowConnection = {
  userId: string
  name: string
  handle: string | null
}

export type PendingInvite = {
  id: string
  userId: string | null
  guestName: string | null
  guestEmail: string | null
  role: string | null
  status: string
  createdAt: string
  invitedBy: string | null
  profileName: string | null
  profileHandle: string | null
}

export type JoinRequest = {
  id: string
  requesterUserId: string
  requestedRole: string | null
  status: string
  createdAt: string
  requesterName: string | null
  requesterHandle: string | null
  requesterAvatarUrl: string | null
}

export type GuestMergeRequest = {
  id: string
  squadId: string
  guestSquadMemberId: string
  guestName: string
  userId: string
  status: string
  requestedAt: string
  requesterName: string | null
  requesterHandle: string | null
  requesterAvatarUrl: string | null
}

export type SquadMembership = {
  isMember: boolean
  role: string | null
  status: string | null
}

export type StateOption = {
  code: string
  name: string | null
}

export type LeagueOption = {
  id: string
  name: string | null
  shortName: string | null
  stateCode: string | null
}

export type GradeOption = {
  id: string
  name: string | null
  code: string | null
}

function resolvePublicUrl(path: string | null | undefined, bucket = 'team-logos') {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path

  const cleaned = path.replace(/^\/+/, '')
  const explicit = cleaned.match(/^([^:]+)::(.+)$/)

  if (explicit) {
    const { data } = supabase.storage.from(explicit[1]).getPublicUrl(explicit[2])
    return data.publicUrl || path
  }

  if (cleaned.includes('/')) {
    const [candidateBucket, ...rest] = cleaned.split('/')
    if (rest.length > 0) {
      const { data } = supabase.storage.from(candidateBucket || bucket).getPublicUrl(rest.join('/'))
      return data.publicUrl || path
    }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(cleaned)
  return data.publicUrl || path
}

async function countAcceptedMembers(squadId: string): Promise<number> {
  const { data, error } = await supabase.rpc('f_squad_members', { _squad_id: squadId })
  if (error) return 0
  const rows = (data ?? []) as { status?: string | null }[]
  return rows.reduce((sum, row) => (row.status === 'accepted' ? sum + 1 : sum), 0)
}

export async function listMySquads(userId: string): Promise<SquadSummary[]> {
  const { data, error } = await supabase.rpc('f_squads_for_user_v2', { _uid: userId })
  if (error) throw error

  const rows = (data ?? []) as {
    squad_id?: string | null
    name?: string | null
    logo_url?: string | null
    owner_id?: string | null
    role?: string | null
    status?: string | null
    league_id?: string | null
    grade_id?: string | null
    league_grade_id?: string | null
    is_official?: boolean | null
  }[]

  const squadIds = rows.map((row) => row.squad_id).filter((id): id is string => Boolean(id))
  const [{ data: meta, error: metaError }, counts] = await Promise.all([
    squadIds.length
      ? supabase
          .from('squads')
          .select('id, is_official, club_id, league_id, league:leagues(name, short_name)')
          .in('id', squadIds)
      : Promise.resolve({ data: [], error: null }),
    Promise.all(squadIds.map((id) => countAcceptedMembers(id))),
  ])

  if (metaError) throw metaError

  const metaMap = new Map<
    string,
    {
      isOfficial: boolean
      clubId: string | null
      leagueId: string | null
      leagueName: string | null
      leagueShortName: string | null
    }
  >()

  ;(meta ?? []).forEach((row) => {
    const id = (row as { id?: string | null }).id
    if (!id) return
    const league = (row as { league?: { name?: string | null; short_name?: string | null } | null }).league
    metaMap.set(id, {
      isOfficial: Boolean((row as { is_official?: boolean | null }).is_official),
      clubId: (row as { club_id?: string | null }).club_id ?? null,
      leagueId: (row as { league_id?: string | null }).league_id ?? null,
      leagueName: league?.name ?? null,
      leagueShortName: league?.short_name ?? null,
    })
  })

  return rows
    .map((row) => {
      const id = row.squad_id
      if (!id) return null
      const m = metaMap.get(id)
      return {
        id,
        name: row.name ?? null,
        logoUrl: resolvePublicUrl(row.logo_url ?? null),
        ownerId: row.owner_id ?? null,
        role: row.role ?? null,
        status: row.status ?? null,
        memberCount: counts[squadIds.indexOf(id)] ?? 0,
        isOfficial: m?.isOfficial ?? Boolean(row.is_official),
        leagueId: m?.leagueId ?? row.league_id ?? null,
        leagueName: m?.leagueName ?? null,
        leagueShortName: m?.leagueShortName ?? null,
        clubId: m?.clubId ?? null,
        gradeId: row.league_grade_id ?? row.grade_id ?? null,
      }
    })
    .filter((row): row is SquadSummary => Boolean(row))
}

export async function listFollowedClubs(userId: string): Promise<SquadSummary[]> {
  const { data: follows, error } = await supabase.from('club_follows').select('club_id').eq('user_id', userId)
  if (error) throw error

  const clubIds = (follows ?? [])
    .map((row) => (row as { club_id?: string | null }).club_id)
    .filter((id): id is string => Boolean(id))

  if (!clubIds.length) return []

  const { data: squads, error: squadsError } = await supabase
    .from('squads')
    .select('id, name, logo_url, owner_id, league_id, grade_id, league_grade_id, is_official, club_id, league:leagues(name, short_name)')
    .in('club_id', clubIds)
    .is('archived_at', null)

  if (squadsError) throw squadsError

  const rows = (squads ?? []) as {
    id: string
    name?: string | null
    logo_url?: string | null
    owner_id?: string | null
    league_id?: string | null
    grade_id?: string | null
    league_grade_id?: string | null
    is_official?: boolean | null
    club_id?: string | null
    league?: { name?: string | null; short_name?: string | null } | null
  }[]

  const counts = await Promise.all(rows.map((row) => countAcceptedMembers(row.id)))

  return rows.map((row, idx) => ({
    id: row.id,
    name: row.name ?? null,
    logoUrl: resolvePublicUrl(row.logo_url ?? null),
    ownerId: row.owner_id ?? null,
    role: null,
    status: 'following',
    memberCount: counts[idx] ?? 0,
    isOfficial: Boolean(row.is_official),
    leagueId: row.league_id ?? null,
    leagueName: row.league?.name ?? null,
    leagueShortName: row.league?.short_name ?? null,
    clubId: row.club_id ?? null,
    gradeId: row.league_grade_id ?? row.grade_id ?? null,
  }))
}

export async function getSquadDetail(squadId: string): Promise<SquadDetail | null> {
  const { data, error } = await supabase
    .from('squads')
    .select('id, name, logo_url, cover_image_url, owner_id, club_id, league_id, grade_id, league_grade_id, is_official, primary_color_hex, secondary_color_hex, tertiary_color_hex, league:leagues(name, short_name)')
    .eq('id', squadId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const row = data as {
    id: string
    name?: string | null
    logo_url?: string | null
    cover_image_url?: string | null
    owner_id?: string | null
    club_id?: string | null
    league_id?: string | null
    grade_id?: string | null
    league_grade_id?: string | null
    is_official?: boolean | null
    primary_color_hex?: string | null
    secondary_color_hex?: string | null
    tertiary_color_hex?: string | null
    league?: { name?: string | null; short_name?: string | null } | null
  }

  return {
    id: row.id,
    name: row.name ?? null,
    logoUrl: resolvePublicUrl(row.logo_url ?? null),
    coverImageUrl: resolvePublicUrl(row.cover_image_url ?? null),
    ownerId: row.owner_id ?? null,
    clubId: row.club_id ?? null,
    leagueId: row.league_id ?? null,
    leagueName: row.league?.name ?? null,
    leagueShortName: row.league?.short_name ?? null,
    gradeId: row.league_grade_id ?? row.grade_id ?? null,
    isOfficial: Boolean(row.is_official),
    primaryColorHex: row.primary_color_hex ?? null,
    secondaryColorHex: row.secondary_color_hex ?? null,
    tertiaryColorHex: row.tertiary_color_hex ?? null,
  }
}

export async function getSquadMembership(squadId: string, userId: string): Promise<SquadMembership> {
  const { data, error } = await supabase
    .from('squad_members')
    .select('role, status')
    .eq('squad_id', squadId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) throw error

  const row = (data ?? [])[0] as { role?: string | null; status?: string | null } | undefined
  const status = row?.status ?? null
  return {
    isMember: status?.toLowerCase() === 'accepted',
    role: row?.role ?? null,
    status,
  }
}

export async function isClubAdmin(clubId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('f_is_club_admin', { _club_id: clubId })
  if (error) throw error
  void userId
  return Boolean(data)
}

export async function listSquadMembers(squadId: string): Promise<SquadMember[]> {
  const { data, error } = await supabase.rpc('f_squad_members', { _squad_id: squadId })
  if (error) throw error

  const rows = (data ?? []) as {
    id: string
    squad_id: string
    user_id?: string | null
    guest_name?: string | null
    guest_email?: string | null
    handle?: string | null
    profile_handle?: string | null
    profile_name?: string | null
    jersey_number?: number | null
    position?: string | null
    role: string
    status: string
  }[]

  return rows.map((row) => ({
    id: row.id,
    squadId: row.squad_id,
    userId: row.user_id ?? null,
    guestName: row.guest_name ?? null,
    guestEmail: row.guest_email ?? null,
    handle: row.handle ?? row.profile_handle ?? null,
    profileName: row.profile_name ?? null,
    jerseyNumber: row.jersey_number ?? null,
    position: row.position ?? null,
    role: row.role,
    status: row.status,
  }))
}

export async function updateMemberNumber(memberId: string, jersey: number | null) {
  const { error } = await supabase.from('squad_members').update({ jersey_number: jersey }).eq('id', memberId)
  if (error) throw error
}

export async function updateMemberPosition(memberId: string, position: string | null) {
  const { error } = await supabase.from('squad_members').update({ position }).eq('id', memberId)
  if (error) throw error
}

export async function removeMember(memberId: string, actorId: string) {
  const { error } = await supabase.rpc('f_remove_squad_member', { _member_id: memberId, _actor: actorId })
  if (error) throw error
}

export async function leaveSquad(squadId: string) {
  const { error } = await supabase.rpc('f_leave_squad', { _squad_id: squadId })
  if (error) throw error
}

export async function listFollowConnections(userId: string): Promise<FollowConnection[]> {
  const [{ data: following, error: followingError }, { data: followers, error: followersError }] = await Promise.all([
    supabase.from('follows').select('followee_id').eq('follower_id', userId),
    supabase.from('follows').select('follower_id').eq('followee_id', userId),
  ])

  if (followingError) throw followingError
  if (followersError) throw followersError

  const ids = new Set<string>()
  ;(following ?? []).forEach((row) => {
    const id = (row as { followee_id?: string | null }).followee_id
    if (id) ids.add(id)
  })
  ;(followers ?? []).forEach((row) => {
    const id = (row as { follower_id?: string | null }).follower_id
    if (id) ids.add(id)
  })

  if (!ids.size) return []

  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle')
    .in('user_id', Array.from(ids))
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const handle = (row as { handle?: string | null }).handle ?? null
    return {
      userId: (row as { user_id: string }).user_id,
      name: (row as { name?: string | null }).name ?? 'KickChaser',
      handle: handle ? (handle.startsWith('@') ? handle : `@${handle}`) : null,
    }
  })
}

export async function inviteByHandle(inviterId: string, squadId: string, handle: string) {
  const normalized = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`
  const { error } = await supabase.rpc('f_invite_member', {
    _inviter: inviterId,
    _squad_id: squadId,
    _handle: normalized,
    _guest_name: null,
    _guest_email: null,
    _jersey: null,
    _position: null,
  })
  if (error) throw error
}

export async function listPendingInvitesForSquad(squadId: string): Promise<PendingInvite[]> {
  const { data, error } = await supabase
    .from('squad_members')
    .select('id,user_id,guest_name,guest_email,role,status,created_at,invited_by,profiles:profiles_directory!squad_members_user_id_fkey(name,handle)')
    .eq('squad_id', squadId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) {
    const fallback = await supabase
      .from('squad_members')
      .select('id,user_id,guest_name,guest_email,role,status,created_at,invited_by')
      .eq('squad_id', squadId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (fallback.error) throw fallback.error

    return ((fallback.data ?? []) as any[]).map((row) => ({
      id: row.id,
      userId: row.user_id ?? null,
      guestName: row.guest_name ?? null,
      guestEmail: row.guest_email ?? null,
      role: row.role ?? null,
      status: row.status,
      createdAt: row.created_at,
      invitedBy: row.invited_by ?? null,
      profileName: null,
      profileHandle: null,
    }))
  }

  return ((data ?? []) as any[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    return {
      id: row.id,
      userId: row.user_id ?? null,
      guestName: row.guest_name ?? null,
      guestEmail: row.guest_email ?? null,
      role: row.role ?? null,
      status: row.status,
      createdAt: row.created_at,
      invitedBy: row.invited_by ?? null,
      profileName: profile?.name ?? null,
      profileHandle: profile?.handle ? (profile.handle.startsWith('@') ? profile.handle : `@${profile.handle}`) : null,
    }
  })
}

async function fetchProfileMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, { name: string | null; handle: string | null; avatarUrl: string | null }>()
  const { data, error } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path')
    .in('user_id', userIds)
  if (error) throw error

  const map = new Map<string, { name: string | null; handle: string | null; avatarUrl: string | null }>()
  ;(data ?? []).forEach((row) => {
    const id = (row as { user_id?: string | null }).user_id
    if (!id) return
    const avatarUrl =
      (row as { avatar_url?: string | null }).avatar_url ??
      resolvePublicUrl((row as { avatar_path?: string | null }).avatar_path ?? null, 'profile-avatars')

    map.set(id, {
      name: (row as { name?: string | null }).name ?? null,
      handle: (row as { handle?: string | null }).handle ?? null,
      avatarUrl,
    })
  })
  return map
}

export async function listPendingJoinRequests(squadId: string): Promise<JoinRequest[]> {
  const { data, error } = await supabase
    .from('squad_join_requests')
    .select('id,requester_user_id,requested_role,status,created_at')
    .eq('squad_id', squadId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as {
    id: string
    requester_user_id: string
    requested_role?: string | null
    status: string
    created_at: string
  }[]

  const profileMap = await fetchProfileMap(rows.map((row) => row.requester_user_id))

  return rows.map((row) => {
    const p = profileMap.get(row.requester_user_id)
    return {
      id: row.id,
      requesterUserId: row.requester_user_id,
      requestedRole: row.requested_role ?? null,
      status: row.status,
      createdAt: row.created_at,
      requesterName: p?.name ?? null,
      requesterHandle: p?.handle ? (p.handle.startsWith('@') ? p.handle : `@${p.handle}`) : null,
      requesterAvatarUrl: p?.avatarUrl ?? null,
    }
  })
}

export async function decideJoinRequest(requestId: string, decision: 'approve' | 'decline', approvedRole: string | null) {
  const { error } = await supabase.rpc('rpc_decide_squad_join_request', {
    _request_id: requestId,
    _decision: decision,
    _approved_role: approvedRole ?? 'member',
    _reason: null,
  })
  if (error) throw error
}

export async function listGuestMergeRequests(squadId: string): Promise<GuestMergeRequest[]> {
  const { data, error } = await supabase
    .from('guest_merge_requests')
    .select('id,squad_id,guest_squad_member_id,guest_name,user_id,status,requested_at')
    .eq('squad_id', squadId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true })

  if (error) throw error

  const rows = (data ?? []) as {
    id: string
    squad_id: string
    guest_squad_member_id: string
    guest_name: string
    user_id: string
    status: string
    requested_at: string
  }[]

  const profileMap = await fetchProfileMap(rows.map((row) => row.user_id))

  return rows.map((row) => {
    const p = profileMap.get(row.user_id)
    return {
      id: row.id,
      squadId: row.squad_id,
      guestSquadMemberId: row.guest_squad_member_id,
      guestName: row.guest_name,
      userId: row.user_id,
      status: row.status,
      requestedAt: row.requested_at,
      requesterName: p?.name ?? null,
      requesterHandle: p?.handle ? (p.handle.startsWith('@') ? p.handle : `@${p.handle}`) : null,
      requesterAvatarUrl: p?.avatarUrl ?? null,
    }
  })
}

export async function decideGuestMergeRequest(requestId: string, decision: 'approve' | 'decline') {
  const { error } = await supabase.rpc('rpc_decide_guest_merge_request', {
    _request_id: requestId,
    _decision: decision,
    _reason: null,
  })
  if (error) throw error
}

export async function listStates(): Promise<StateOption[]> {
  const { data, error } = await supabase.from('states').select('code,name').order('name', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    code: (row as { code: string }).code,
    name: (row as { name?: string | null }).name ?? null,
  }))
}

export async function listLeaguesByState(stateCode: string): Promise<LeagueOption[]> {
  if (!stateCode) return []
  const { data, error } = await supabase
    .from('leagues')
    .select('id,name,short_name,state_code')
    .eq('state_code', stateCode)
    .order('name', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { name?: string | null }).name ?? null,
    shortName: (row as { short_name?: string | null }).short_name ?? null,
    stateCode: (row as { state_code?: string | null }).state_code ?? null,
  }))
}

export async function listLeagueGrades(leagueId: string): Promise<GradeOption[]> {
  if (!leagueId) return []
  const { data, error } = await supabase
    .from('league_grades')
    .select('id,name,code,grade_catalog(label)')
    .eq('league_id', leagueId)
    .order('sort_order', { ascending: true })
  if (error) throw error

  return (data ?? []).map((row) => {
    const catalog = (row as { grade_catalog?: { label?: string | null } | null }).grade_catalog
    return {
      id: (row as { id: string }).id,
      name: catalog?.label ?? (row as { name?: string | null }).name ?? null,
      code: (row as { code?: string | null }).code ?? null,
    }
  })
}

export async function createSquad(payload: {
  ownerId: string
  name: string
  stateCode: string
  leagueId: string
  gradeId?: string | null
  isOfficial: boolean
  clubName?: string | null
  logoUrl?: string | null
}) {
  const trimmedName = payload.name.trim()
  if (!trimmedName) throw new Error('Squad name is required.')
  if (!payload.leagueId) throw new Error('League is required.')

  const { data: existing, error: existingError } = await supabase
    .from('squads')
    .select('set_name')
    .eq('owner_id', payload.ownerId)
    .ilike('set_name', 'Default%')

  if (existingError) throw existingError

  const existingSet = new Set(
    (existing ?? [])
      .map((row) => (row as { set_name?: string | null }).set_name?.trim() ?? '')
      .filter(Boolean)
  )

  let setName = 'Default'
  if (existingSet.has(setName)) {
    let i = 2
    while (existingSet.has(`Default (${i})`)) i += 1
    setName = `Default (${i})`
  }

  let clubId: string | null = null
  if (payload.isOfficial) {
    const clubLabel = payload.clubName?.trim() || trimmedName
    const { data: existingClub, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('league_id', payload.leagueId)
      .ilike('name', clubLabel)
      .limit(1)
      .maybeSingle()

    if (clubError && clubError.code !== 'PGRST116') throw clubError

    if (existingClub?.id) {
      clubId = existingClub.id
    } else {
      const { data: insertedClub, error: insertClubError } = await supabase
        .from('clubs')
        .insert({ name: clubLabel, league_id: payload.leagueId })
        .select('id')
        .single()
      if (insertClubError) throw insertClubError
      clubId = insertedClub.id
    }
  }

  const insertPayload: Record<string, unknown> = {
    owner_id: payload.ownerId,
    user_id: payload.ownerId,
    name: trimmedName,
    number: 7,
    set_name: setName,
    state_code: payload.stateCode,
    league_id: payload.leagueId,
    logo_url: payload.logoUrl ?? null,
    is_official: payload.isOfficial,
    club_id: clubId,
    grade_id: payload.isOfficial ? null : payload.gradeId ?? null,
    league_grade_id: payload.isOfficial ? null : payload.gradeId ?? null,
  }

  const { data: squad, error } = await supabase.from('squads').insert(insertPayload).select('id').single()
  if (error) throw error
  return squad.id as string
}

export async function uploadSquadLogo(ownerId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `squads/${ownerId}/logo_${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('team-logos').upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error
  return path
}

export async function updateSquadBranding(
  squadId: string,
  payload: {
    logoUrl?: string | null
    primaryColorHex?: string | null
    secondaryColorHex?: string | null
    tertiaryColorHex?: string | null
  }
) {
  const updates: Record<string, string | null> = {}
  if ('logoUrl' in payload) updates.logo_url = payload.logoUrl ?? null
  if ('primaryColorHex' in payload) updates.primary_color_hex = payload.primaryColorHex ?? null
  if ('secondaryColorHex' in payload) updates.secondary_color_hex = payload.secondaryColorHex ?? null
  if ('tertiaryColorHex' in payload) updates.tertiary_color_hex = payload.tertiaryColorHex ?? null

  if (!Object.keys(updates).length) return

  const { error } = await supabase.from('squads').update(updates).eq('id', squadId)
  if (error) throw error
}
