import { supabase } from '@/lib/supabase'

export type PostComment = { id: string; authorId: string | null; authorName: string; body: string; createdAt: string }

/** Read the existing mobile comment contract, preserving viewer moderation filters. */
export async function listPostComments(postId: string, viewerId: string, signal: AbortSignal): Promise<PostComment[]> {
  const [comments, blocks, reports] = await Promise.all([
    supabase.from('post_comments').select('id,author_id,body,created_at').eq('post_id', postId).order('created_at', { ascending: true }).abortSignal(signal),
    supabase.from('user_blocks').select('blocker_user_id,blocked_user_id').or(`blocker_user_id.eq.${viewerId},blocked_user_id.eq.${viewerId}`).abortSignal(signal),
    supabase.from('comment_reports').select('comment_id').eq('reporter_user_id', viewerId).abortSignal(signal),
  ])
  for (const result of [comments, blocks, reports]) if (result.error) throw result.error
  const blocked = new Set((blocks.data ?? []).map((row) => row.blocker_user_id === viewerId ? row.blocked_user_id : row.blocker_user_id))
  const reported = new Set((reports.data ?? []).map((row) => row.comment_id))
  const visible = (comments.data ?? []).filter((row) => !blocked.has(row.author_id) && !reported.has(row.id))
  const authorIds = [...new Set(visible.map((row) => row.author_id).filter(Boolean))]
  const names = new Map<string, string>()
  if (authorIds.length) {
    const authors = await supabase.from('profiles_directory').select('user_id,name').in('user_id', authorIds).abortSignal(signal)
    if (authors.error) throw authors.error
    for (const author of authors.data ?? []) names.set(author.user_id, author.name?.trim() || 'KickChaser')
  }
  return visible.map((row) => ({ id: row.id, authorId: row.author_id, authorName: names.get(row.author_id) || 'KickChaser', body: row.body, createdAt: row.created_at }))
}
