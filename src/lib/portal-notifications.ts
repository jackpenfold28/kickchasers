import { supabase } from '@/lib/supabase'

export type PortalNotificationType =
  | 'squad_invite'
  | 'squad_invite_accepted'
  | 'squad_invite_declined'
  | 'squad_admin_promoted'
  | 'squad_role_changed'
  | 'club_role_changed'
  | 'post_liked'
  | 'post_commented'
  | 'squad_join_request_created'
  | 'squad_join_request_decided'
  | 'guest_merge_request_created'
  | 'guest_merge_request_decided'
  | 'official_directory_request_created'
  | 'official_directory_request_decided'
  | 'official_squad_admin_request_created'
  | 'official_squad_admin_request_decided'
  | 'user_followed'
  | 'official_game_live_started'
  | 'track_request'
  | 'track_request_accepted'
  | 'track_request_declined'
  | 'vote_card_assigned'
  | 'vote_card_reminder'

export type PortalNotificationPayload = {
  request_id?: string | null
  squad_id?: string | null
  request_kind?: string | null
  requested_label?: string | null
  requested_role?: string | null
  approved_role?: string | null
  status?: string | null
  club_id?: string | null
  club_name?: string | null
  league_id?: string | null
  short_name?: string | null
  official_squad_id?: string | null
  decided_by?: string | null
  decided_at?: string | null
  admin_notes?: string | null
  follower_user_id?: string | null
  follower_name?: string | null
  follower_handle?: string | null
  squad_name?: string | null
  squad_logo_url?: string | null
  gameId?: string | null
  game_id?: string | null
  manual_game_id?: string | null
  old_role?: string | null
  new_role?: string | null
  action?: string | null
  post_id?: string | null
  comment_id?: string | null
  comment_preview?: string | null
  card_id?: string | null
  award_type_name?: string | null
  vote_group_name?: string | null
  home_team_name?: string | null
  away_team_name?: string | null
  guest_name?: string | null
  [key: string]: unknown
}

export type PortalNotification = {
  id: string
  type: PortalNotificationType
  refId: string | null
  squadId: string | null
  payload: PortalNotificationPayload | null
  actorId: string | null
  readAt: string | null
  createdAt: string
  actorName: string | null
  actorHandle: string | null
  actorAvatarUrl: string | null
  squadName: string | null
  squadLogoUrl: string | null
}

function normalizeNotificationType(input: string | null | undefined): PortalNotificationType {
  if (
    input === 'squad_invite' ||
    input === 'squad_invite_accepted' ||
    input === 'squad_invite_declined' ||
    input === 'squad_admin_promoted' ||
    input === 'squad_role_changed' ||
    input === 'club_role_changed' ||
    input === 'post_liked' ||
    input === 'post_commented' ||
    input === 'squad_join_request_created' ||
    input === 'squad_join_request_decided' ||
    input === 'guest_merge_request_created' ||
    input === 'guest_merge_request_decided' ||
    input === 'official_directory_request_created' ||
    input === 'official_directory_request_decided' ||
    input === 'official_squad_admin_request_created' ||
    input === 'official_squad_admin_request_decided' ||
    input === 'user_followed' ||
    input === 'official_game_live_started' ||
    input === 'track_request' ||
    input === 'track_request_accepted' ||
    input === 'track_request_declined' ||
    input === 'vote_card_assigned' ||
    input === 'vote_card_reminder'
  ) {
    return input
  }

  return 'squad_invite'
}

function resolveStorageUrl(input: string | null | undefined, defaultBucket = 'profile-avatars') {
  if (!input) return null
  if (/^https?:\/\//i.test(input)) return input

  const clean = input.replace(/^\/+/, '')
  const explicit = clean.match(/^([^:]+)::(.+)$/)
  if (explicit) {
    const { data } = supabase.storage.from(explicit[1]).getPublicUrl(explicit[2])
    return data.publicUrl || input
  }

  if (clean.includes('/')) {
    const [bucket, ...rest] = clean.split('/')
    if (bucket && rest.length) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(rest.join('/'))
      return data.publicUrl || input
    }
  }

  const { data } = supabase.storage.from(defaultBucket).getPublicUrl(clean)
  return data.publicUrl || input
}

export async function listNotifications(userId: string, limit = 80): Promise<PortalNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,type,ref_id,squad_id,payload,actor_id,read_at,created_at')
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  const rows = (data ?? []) as any[]

  const actorIds = Array.from(new Set(rows.map((row) => row.actor_id).filter(Boolean))) as string[]
  const squadIds = Array.from(new Set(rows.map((row) => row.squad_id).filter(Boolean))) as string[]

  const [actorsRes, squadsRes] = await Promise.all([
    actorIds.length
      ? supabase.from('profiles_directory').select('user_id,name,handle,avatar_url,avatar_path').in('user_id', actorIds)
      : Promise.resolve({ data: [], error: null }),
    squadIds.length
      ? supabase.from('squads').select('id,name,logo_url').in('id', squadIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (actorsRes.error) throw actorsRes.error
  if (squadsRes.error) throw squadsRes.error

  const actorMap = new Map<string, { name: string | null; handle: string | null; avatarUrl: string | null }>()
  ;((actorsRes.data ?? []) as any[]).forEach((row) => {
    actorMap.set(row.user_id, {
      name: row.name ?? null,
      handle: row.handle ?? null,
      avatarUrl: resolveStorageUrl(row.avatar_url ?? row.avatar_path ?? null, 'profile-avatars'),
    })
  })

  const squadMap = new Map<string, { name: string | null; logoUrl: string | null }>()
  ;((squadsRes.data ?? []) as any[]).forEach((row) => {
    squadMap.set(row.id, {
      name: row.name ?? null,
      logoUrl: resolveStorageUrl(row.logo_url ?? null, 'team-logos'),
    })
  })

  return rows
    .filter((row) => row.id && row.created_at)
    .map((row) => {
      const actor = row.actor_id ? actorMap.get(row.actor_id) : null
      const squad = row.squad_id ? squadMap.get(row.squad_id) : null
      return {
        id: row.id,
        type: normalizeNotificationType(row.type),
        refId: row.ref_id ?? null,
        squadId: row.squad_id ?? null,
        payload: (row.payload as PortalNotificationPayload | null) ?? null,
        actorId: row.actor_id ?? null,
        readAt: row.read_at ?? null,
        createdAt: row.created_at,
        actorName: actor?.name ?? null,
        actorHandle: actor?.handle ?? null,
        actorAvatarUrl: actor?.avatarUrl ?? null,
        squadName: squad?.name ?? null,
        squadLogoUrl: squad?.logoUrl ?? null,
      }
    })
}

export async function markNotificationsRead(userId: string, ids: string[]) {
  if (!ids.length) return
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('recipient_id', userId)
    .in('id', ids)
  if (error) throw error
}

export async function respondInvite(userId: string, memberId: string, accept: boolean) {
  const { error } = await supabase.rpc('f_respond_invite', {
    _uid: userId,
    _member_id: memberId,
    _accept: accept,
  })
  if (error) throw error
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

export async function decideGuestMerge(requestId: string, decision: 'approve' | 'decline') {
  const { error } = await supabase.rpc('rpc_decide_guest_merge_request', {
    _request_id: requestId,
    _decision: decision,
    _reason: null,
  })
  if (error) throw error
}

export async function respondTrackRequest(gameId: string, decision: 'accepted' | 'declined') {
  const { error } = await supabase.rpc('respond_track_game_request', {
    game_id: gameId,
    decision,
  })
  if (error) throw error
}
