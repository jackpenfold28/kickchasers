import { supabase } from '@/lib/supabase'

export type PortalNotification = {
  id: string
  type: string
  refId: string | null
  squadId: string | null
  payload: Record<string, unknown> | null
  actorId: string | null
  readAt: string | null
  createdAt: string
  actorName: string | null
  actorHandle: string | null
  actorAvatarUrl: string | null
  squadName: string | null
  squadLogoUrl: string | null
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
        type: row.type ?? 'unknown',
        refId: row.ref_id ?? null,
        squadId: row.squad_id ?? null,
        payload: (row.payload as Record<string, unknown> | null) ?? null,
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
