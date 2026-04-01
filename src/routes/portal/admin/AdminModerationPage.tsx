import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { listModerationPosts, type ModerationPost } from '@/lib/portal-admin'
import { setPostHidden } from '@/lib/platform-admin'
import { supabase } from '@/lib/supabase'
import { AdminActionButton, EmptyState, formatDateTime, SectionHeading } from './admin-ui'

export default function AdminModerationPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyPostId, setBusyPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<ModerationPost[]>([])

  async function loadPage() {
    setLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        navigate('/sign-in', { replace: true })
        return
      }
      setPosts(await listModerationPosts(40))
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load moderation queue.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPage()
  }, [])

  async function handleToggle(post: ModerationPost) {
    setBusyPostId(post.id)
    try {
      await setPostHidden(post.id, !Boolean(post.hiddenAt))
      await loadPage()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update post visibility.')
    } finally {
      setBusyPostId(null)
    }
  }

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading moderation…</main>
  }

  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Moderation"
          title="Post moderation"
          description="This surface keeps moderation lightweight and real: recent posts, current visibility state, and hide or unhide actions through the existing RPC."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      {error ? (
        <PortalCard>
          <p className="text-sm text-red-300">{error}</p>
        </PortalCard>
      ) : null}

      <div className="grid gap-4">
        {posts.length ? posts.map((post) => {
          const hidden = Boolean(post.hiddenAt)
          return (
            <PortalCard key={post.id} className="bg-[#0F192C]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{formatDateTime(post.createdAt)}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${hidden ? 'border-white/10 bg-white/[0.04] text-slate-300' : 'border-[#39FF88]/25 bg-[#39FF88]/12 text-[#B8FFD5]'}`}>
                      {hidden ? 'Hidden' : 'Visible'}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-white">{post.body || '(image post)'}</p>
                  <p className="mt-2 text-sm text-slate-400">{post.authorName || 'Author unknown'}</p>
                </div>
                <AdminActionButton onClick={() => void handleToggle(post)} disabled={busyPostId === post.id} tone={hidden ? 'primary' : 'ghost'}>
                  {hidden ? 'Unhide' : 'Hide'}
                </AdminActionButton>
              </div>
            </PortalCard>
          )
        }) : <EmptyState label="No posts found for moderation." />}
      </div>
    </section>
  )
}
