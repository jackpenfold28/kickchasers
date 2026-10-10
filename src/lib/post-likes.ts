import { supabase } from '@/lib/supabase'

export async function getPostLike(postId: string, viewerId: string, signal: AbortSignal) {
  const [like, post] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('post_id', postId).eq('user_id', viewerId).abortSignal(signal).maybeSingle(),
    supabase.from('posts').select('like_count').eq('id', postId).abortSignal(signal).single(),
  ])
  if (like.error) throw like.error
  if (post.error) throw post.error
  return { liked: Boolean(like.data), count: Number(post.data.like_count ?? 0) }
}

/** Use the mobile app's existing user-scoped like/unlike contract. */
export async function setPostLike(postId: string, viewerId: string, liked: boolean) {
  const result = liked
    ? await supabase.from('post_likes').insert({ post_id: postId, user_id: viewerId })
    : await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', viewerId)
  if (result.error) throw result.error
}
