import { supabase } from '@/lib/supabase'
import type { RequestableRole } from '@/lib/profile-utils'

export type RoleRequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled'

export type RoleRequestRow = {
  id: string
  requested_role: RequestableRole
  status: RoleRequestStatus
  decision_reason: string | null
  created_at: string
}

export type BlockedUserListItem = {
  blockedUserId: string
  createdAt: string
  name: string | null
  handle: string | null
  avatarUrl: string | null
}

function resolveAvatarUrl(avatarUrl: string | null | undefined, avatarPath: string | null | undefined): string | null {
  if (avatarUrl) return avatarUrl
  if (!avatarPath) return null
  const { data } = supabase.storage.from('profile-avatars').getPublicUrl(avatarPath)
  return data?.publicUrl || null
}

export async function getOfficialSquadIdForClub(clubId: string | null): Promise<string | null> {
  if (!clubId) return null

  const { data, error } = await supabase
    .from('squads')
    .select('id')
    .eq('club_id', clubId)
    .eq('is_official', true)
    .is('archived_at', null)
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') throw error
  return (data as { id?: string | null } | null)?.id ?? null
}

export async function listMyRoleRequests(squadId: string, requesterUserId: string): Promise<RoleRequestRow[]> {
  const { data, error } = await supabase
    .from('squad_join_requests')
    .select('id, requested_role, status, decision_reason, created_at')
    .eq('squad_id', squadId)
    .eq('requester_user_id', requesterUserId)
    .in('requested_role', ['player', 'coach', 'tracker'])
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []) as RoleRequestRow[]
}

export async function createRoleRequest(
  squadId: string,
  requesterUserId: string,
  requestedRole: RequestableRole
): Promise<void> {
  const payload = {
    squad_id: squadId,
    requester_user_id: requesterUserId,
    requested_role: requestedRole,
    status: 'pending',
    decided_by: null,
    decided_at: null,
    decision_reason: null,
  }

  const { error } = await supabase.from('squad_join_requests').insert(payload)

  if (error && error.code !== '23505') throw error
}

export async function cancelRoleRequest(requestId: string, requesterUserId: string): Promise<void> {
  const { error } = await supabase
    .from('squad_join_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId)
    .eq('requester_user_id', requesterUserId)
    .eq('status', 'pending')

  if (error) throw error
}

export async function listBlockedUsers(blockerUserId: string): Promise<BlockedUserListItem[]> {
  const { data: blockRows, error: blocksError } = await supabase
    .from('user_blocks')
    .select('blocked_user_id, created_at')
    .eq('blocker_user_id', blockerUserId)
    .order('created_at', { ascending: false })

  if (blocksError) throw blocksError

  const blockedIds = (blockRows ?? [])
    .map((row) => (row as { blocked_user_id?: string | null }).blocked_user_id)
    .filter((value): value is string => Boolean(value))

  if (!blockedIds.length) return []

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles_directory')
    .select('user_id,name,handle,avatar_url,avatar_path')
    .in('user_id', blockedIds)

  if (profileError) throw profileError

  const profileMap = new Map<string, { name: string | null; handle: string | null; avatarUrl: string | null }>()
  ;(profileRows ?? []).forEach((row) => {
    const userId = (row as { user_id?: string | null }).user_id
    if (!userId) return

    profileMap.set(userId, {
      name: (row as { name?: string | null }).name ?? null,
      handle: (row as { handle?: string | null }).handle ?? null,
      avatarUrl: resolveAvatarUrl(
        (row as { avatar_url?: string | null }).avatar_url,
        (row as { avatar_path?: string | null }).avatar_path
      ),
    })
  })

  return (blockRows ?? []).flatMap((row) => {
    const blockedUserId = (row as { blocked_user_id?: string | null }).blocked_user_id
    if (!blockedUserId) return []

    const profile = profileMap.get(blockedUserId)
    return [
      {
        blockedUserId,
        createdAt: ((row as { created_at?: string | null }).created_at ?? new Date().toISOString()) as string,
        name: profile?.name ?? null,
        handle: profile?.handle ?? null,
        avatarUrl: profile?.avatarUrl ?? null,
      },
    ]
  })
}

export async function unblockUser(blockerUserId: string, blockedUserId: string): Promise<void> {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_user_id', blockerUserId)
    .eq('blocked_user_id', blockedUserId)

  if (error) throw error
}
