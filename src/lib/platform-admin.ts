import { supabase } from '@/lib/supabase'

export type PlatformAdminStatus = {
  userId: string | null
  isAdmin: boolean
}

export async function fetchPlatformAdminStatus(userId?: string | null): Promise<PlatformAdminStatus> {
  let resolvedUserId = userId

  if (!resolvedUserId) {
    const { data: userData } = await supabase.auth.getUser()
    resolvedUserId = userData.user?.id ?? null
  }

  if (!resolvedUserId) {
    return { userId: null, isAdmin: false }
  }

  const { data: functionResult, error: functionError } = await supabase.rpc('f_is_platform_admin')

  let isAdmin = Boolean(functionResult)
  if (!isAdmin || functionError) {
    const { data, error } = await supabase
      .from('platform_admins')
      .select('profile_user_id')
      .eq('profile_user_id', resolvedUserId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    isAdmin = Boolean(data?.profile_user_id)
  }

  return {
    userId: resolvedUserId,
    isAdmin,
  }
}

export async function setPlatformAdminStatus(targetUserId: string, makeAdmin: boolean): Promise<void> {
  if (!targetUserId) return

  const { data: userData } = await supabase.auth.getUser()
  const actingUserId = userData.user?.id ?? null

  if (!actingUserId) {
    throw new Error('Not authenticated.')
  }

  if (makeAdmin) {
    const { error } = await supabase
      .from('platform_admins')
      .insert({ profile_user_id: targetUserId, created_by: actingUserId })

    if (error && error.code !== '23505') {
      throw error
    }

    return
  }

  const { error } = await supabase.from('platform_admins').delete().eq('profile_user_id', targetUserId)
  if (error) throw error
}

export async function setPostHidden(postId: string, hidden: boolean) {
  if (!postId) return null

  const { data, error } = await supabase.rpc('rpc_set_post_hidden', {
    _post_id: postId,
    _hidden: hidden,
  })

  if (error) throw error
  return data
}

export async function setSquadArchived(squadId: string, archived: boolean) {
  if (!squadId) return null

  const { data, error } = await supabase.rpc('rpc_set_squad_archived', {
    _squad_id: squadId,
    _archived: archived,
  })

  if (error) throw error
  return data
}
