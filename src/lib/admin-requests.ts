import { supabase } from '@/lib/supabase'

export type DirectoryRequestKind = 'add_league' | 'add_grade' | 'add_club' | 'add_squad'

export async function createDirectoryRequest(
  requesterUserId: string,
  requestKind: DirectoryRequestKind,
  payload: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('official_directory_requests').insert({
    requester_user_id: requesterUserId,
    request_kind: requestKind,
    payload,
    status: 'pending',
  })

  if (error && error.code !== '23505') throw error
}
