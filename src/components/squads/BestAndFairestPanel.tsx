import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Award, Check, Clipboard, ExternalLink, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { useSquadVotes } from '@/hooks/useSquadVotes'
import { parsePointValues, buildAuthenticatedVoteCardRoute, type VoteAwardType, type VoteBreakdown, type VoteMatchup, type VoteMember, type VoteTally } from '@/lib/canonical/squad-votes'
import { archiveOrDeleteVoteGroup, assignVoteCard, buildPublicVoteCardUrl, createVoteGroup, createVoteMatchup, deleteVoteAward, deleteVoteCard, deleteVoteMatchup, getVoteBreakdown, getVoteTally, listVoteAssignableUsers, listVoteGameOptions, listVoteMatchups, listVoteMembers, restoreVoteGroup, saveVoteAward, setVoteMembers, voidVoteCard } from '@/lib/squad-votes'

const field = 'min-h-11 w-full rounded-xl border border-white/10 bg-[#081321] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#39FF88]/55'
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50'
const primary = `${button} bg-[#39FF88] text-[#07120d] hover:brightness-105`
const secondary = `${button} border border-white/10 bg-white/[0.06] text-white hover:bg-white/[0.1]`

function dateLabel(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) }

function GroupWorkspace({ squadId, group, onChanged }: { squadId: string; group: ReturnType<typeof useSquadVotes>['groups'][number]; onChanged: () => Promise<void> | void }) {
  const [view, setView] = useState<'matchups' | 'setup' | 'tally'>('matchups')
  const [members, setMembers] = useState<VoteMember[]>([])
  const [matchups, setMatchups] = useState<VoteMatchup[]>([])
  const [users, setUsers] = useState<Awaited<ReturnType<typeof listVoteAssignableUsers>>>([])
  const [games, setGames] = useState<Awaited<ReturnType<typeof listVoteGameOptions>>>([])
  const [tally, setTally] = useState<VoteTally | null>(null)
  const [breakdown, setBreakdown] = useState<VoteBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState(false)
  const [awardEditing, setAwardEditing] = useState<VoteAwardType | null>(null)
  const [awardName, setAwardName] = useState('Best & Fairest')
  const [awardCategory, setAwardCategory] = useState<'best_and_fairest' | 'incentive'>('best_and_fairest')
  const [awardCustom, setAwardCustom] = useState(false)
  const [awardPoints, setAwardPoints] = useState('5,4,3,2,1')
  const [awardCards, setAwardCards] = useState('1')
  const [sourceType, setSourceType] = useState<'manual' | 'tracked_game'>('manual')
  const [round, setRound] = useState('')
  const [opponent, setOpponent] = useState('')
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10))
  const [gameId, setGameId] = useState('')
  const [notes, setNotes] = useState('')
  const [assignment, setAssignment] = useState<Record<string, { userId: string; name: string; email: string }>>({})
  const [shareLink, setShareLink] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [nextMembers, nextMatchups, nextUsers, nextGames] = await Promise.all([listVoteMembers(group.id), listVoteMatchups(group.id), listVoteAssignableUsers(squadId), listVoteGameOptions(squadId)])
      setMembers(nextMembers); setMatchups(nextMatchups); setUsers(nextUsers); setGames(nextGames); setError(null)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Unable to load vote group.') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [group.id])

  async function mutate(action: () => Promise<unknown>) {
    setWorking(true); setError(null)
    try { await action(); await load(); await onChanged() }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : 'Unable to update voting.') }
    finally { setWorking(false) }
  }

  function editAward(award?: VoteAwardType) {
    setAwardEditing(award ?? null); setAwardName(award?.name ?? 'Best & Fairest'); setAwardCategory(award?.category ?? 'best_and_fairest'); setAwardCustom(award?.colorKey === 'custom'); setAwardPoints(award?.pointValues.join(',') ?? '5,4,3,2,1'); setAwardCards(String(award?.maxCardsPerMatchup ?? 1))
  }

  async function submitAward(event: FormEvent) {
    event.preventDefault()
    let points: number[]
    try { points = parsePointValues(awardPoints) } catch (parseError) { setError(parseError instanceof Error ? parseError.message : 'Invalid points.'); return }
    const maxCards = Number.parseInt(awardCards, 10)
    if (!awardName.trim() || !Number.isInteger(maxCards) || maxCards < 1) { setError('Enter an award name and at least one card per matchup.'); return }
    await mutate(() => saveVoteAward({ id: awardEditing?.id, groupId: group.id, name: awardName.trim(), category: awardCategory, pointValues: points, maxCards, colorKey: awardCustom ? 'custom' : null }))
    setAwardEditing(null)
  }

  async function submitMatchup(event: FormEvent) {
    event.preventDefault()
    await mutate(() => createVoteMatchup({ groupId: group.id, sourceType, roundLabel: sourceType === 'manual' ? round : null, opponentName: sourceType === 'manual' ? opponent : null, matchupDate: sourceType === 'manual' ? new Date(`${matchDate}T12:00:00`).toISOString() : null, gameId: sourceType === 'tracked_game' ? gameId : null, notes }))
    setRound(''); setOpponent(''); setGameId(''); setNotes('')
  }

  async function showTally() { setView('tally'); setLoading(true); try { setTally(await getVoteTally(group.id)); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load tally.') } finally { setLoading(false) } }

  if (loading) return <PortalCard className="teams-section-card"><p className="text-sm text-slate-300">Loading voting group…</p></PortalCard>
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Voting group sections">
        {(['matchups', 'setup', 'tally'] as const).map((item) => <button key={item} type="button" className={view === item ? primary : secondary} onClick={() => item === 'tally' ? void showTally() : setView(item)}>{item === 'matchups' ? 'Matchups & cards' : item === 'setup' ? 'Setup' : 'Private tally'}</button>)}
      </div>
      {error ? <PortalCard className="teams-section-card"><p role="alert" className="text-sm text-red-300">{error}</p></PortalCard> : null}

      {view === 'setup' ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <PortalCard className="teams-section-card">
            <div className="flex items-center justify-between gap-3"><div><h4 className="font-black text-white">Award templates</h4><p className="text-sm text-slate-400">Exact points and cards per matchup.</p></div><button type="button" className={secondary} onClick={() => editAward()}><Plus className="h-4 w-4" /> Add</button></div>
            <div className="mt-4 space-y-2">{group.awardTypes.length ? group.awardTypes.map((award) => <div key={award.id} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{award.name}</p><p className="mt-1 text-xs text-slate-400">{award.colorKey === 'custom' ? 'Custom' : award.category === 'incentive' ? 'Club award' : 'Best & Fairest'} • {award.pointValues.join(' / ')} points • {award.maxCardsPerMatchup} card(s)</p></div><div className="flex gap-1"><button type="button" className={secondary} onClick={() => editAward(award)}>Edit</button><button type="button" aria-label={`Delete ${award.name}`} className={secondary} onClick={() => window.confirm('Delete this unused award template?') && void mutate(() => deleteVoteAward(award.id))}><Trash2 className="h-4 w-4" /></button></div></div></div>) : <p className="text-sm text-slate-400">No award templates yet.</p>}</div>
            <form className="mt-4 space-y-3 border-t border-white/8 pt-4" onSubmit={submitAward}>
              <input className={field} value={awardName} onChange={(e) => setAwardName(e.target.value)} aria-label="Award name" placeholder="Award name" />
              <div className="grid gap-3 sm:grid-cols-2"><select className={field} value={awardCategory} onChange={(e) => setAwardCategory(e.target.value as typeof awardCategory)} aria-label="Award category"><option value="best_and_fairest">Best & Fairest</option><option value="incentive">Club award</option></select><label className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-3 text-sm text-slate-300"><input type="checkbox" checked={awardCustom} onChange={(e) => setAwardCustom(e.target.checked)} /> Custom label</label></div>
              <div className="grid gap-3 sm:grid-cols-2"><input className={field} value={awardPoints} onChange={(e) => setAwardPoints(e.target.value)} aria-label="Point values" placeholder="5,4,3,2,1" /><input className={field} type="number" min="1" value={awardCards} onChange={(e) => setAwardCards(e.target.value)} aria-label="Cards per matchup" /></div>
              <button disabled={working} className={primary}>{awardEditing ? 'Save template' : 'Create template'}</button>
            </form>
          </PortalCard>
          <PortalCard className="teams-section-card">
            <div className="flex items-center justify-between gap-3"><div><h4 className="font-black text-white">Eligible players</h4><p className="text-sm text-slate-400">Accepted linked and guest members use stable roster IDs.</p></div><button type="button" disabled={working} className={primary} onClick={() => void mutate(() => setVoteMembers(group.id, members.filter((member) => member.selected).map((member) => member.squadMemberId)))}><Check className="h-4 w-4" /> Save</button></div>
            <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">{members.length ? members.map((member) => <label key={member.squadMemberId} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2"><input type="checkbox" checked={member.selected} onChange={() => setMembers((current) => current.map((item) => item.squadMemberId === member.squadMemberId ? { ...item, selected: !item.selected } : item))} /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-white">{member.name}{member.jerseyNumber != null ? ` #${member.jerseyNumber}` : ''}</span><span className="text-xs text-slate-500">{member.isGuest ? 'Guest player' : member.handle || 'Squad player'}</span></span></label>) : <p className="text-sm text-slate-400">No accepted squad members.</p>}</div>
          </PortalCard>
        </div>
      ) : view === 'tally' ? (
        <div className="grid gap-4 xl:grid-cols-2">{tally?.leaderboards.length ? tally.leaderboards.map((board) => <PortalCard key={board.awardTypeId} className="teams-section-card"><p className="teams-kicker">Private results</p><h4 className="mt-1 text-lg font-black text-white">{board.awardTypeName}</h4><div className="mt-4 space-y-2">{board.players.map((player, index) => <div key={player.subjectKey} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2"><span className="w-7 font-black text-[#D4AF37]">{index + 1}</span><span className="min-w-0 flex-1 truncate font-semibold text-white">{player.subjectName}{player.isGuest ? ' • Guest' : ''}</span><span className="font-black tabular-nums text-white">{player.totalPoints}</span></div>)}</div></PortalCard>) : <PortalCard className="teams-section-card"><p className="font-semibold text-white">No submitted votes yet</p><p className="mt-1 text-sm text-slate-400">Private tallies appear after cards are submitted.</p></PortalCard>}</div>
      ) : (
        <div className="space-y-4">
          <PortalCard className="teams-section-card"><h4 className="font-black text-white">New matchup</h4><p className="mt-1 text-sm text-slate-400">Link an existing tracked game or enter a manual matchup.</p><form className="mt-4 grid gap-3 lg:grid-cols-2" onSubmit={submitMatchup}><select className={field} value={sourceType} onChange={(e) => setSourceType(e.target.value as typeof sourceType)}><option value="manual">Manual matchup</option><option value="tracked_game">Tracked game</option></select>{sourceType === 'tracked_game' ? <select className={field} value={gameId} onChange={(e) => setGameId(e.target.value)} aria-label="Tracked game"><option value="">Choose tracked game</option>{games.map((game) => <option key={game.id} value={game.id}>{game.round != null ? `R${game.round} • ` : ''}{game.opponent || 'Opponent'} • {game.date ? dateLabel(game.date) : 'TBC'}</option>)}</select> : <><input className={field} value={round} onChange={(e) => setRound(e.target.value)} placeholder="Round or finals code" aria-label="Round label" /><input className={field} value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Opponent" aria-label="Opponent" /><input className={field} type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} aria-label="Match date" /></>}<input className={field} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" aria-label="Matchup notes" /><button disabled={working} className={primary}><Plus className="h-4 w-4" /> Create matchup</button></form></PortalCard>
          {matchups.length ? matchups.map((matchup) => <PortalCard key={matchup.id} className="teams-section-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="teams-kicker">{matchup.sourceType === 'tracked_game' ? 'Tracked game' : 'Manual matchup'}</p><h4 className="mt-1 text-lg font-black text-white">{matchup.roundLabel} • {matchup.opponentName}</h4><p className="mt-1 text-sm text-slate-400">{dateLabel(matchup.matchupDate)} • {matchup.cards.filter((card) => card.status === 'submitted').length}/{matchup.cards.length} cards submitted</p></div><div className="flex gap-2"><button type="button" className={secondary} onClick={() => void (async () => { try { setBreakdown(await getVoteBreakdown(matchup.id)) } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load breakdown.') } })()}>Breakdown</button><button type="button" aria-label="Delete matchup" className={secondary} onClick={() => window.confirm('Delete this matchup if its cards are still eligible for deletion?') && void mutate(() => deleteVoteMatchup(matchup.id))}><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 grid gap-3 lg:grid-cols-2">{matchup.cards.length ? matchup.cards.map((card) => { const draft = assignment[card.id] ?? { userId: '', name: '', email: '' }; return <article key={card.id} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-white">{card.awardTypeName} #{card.cardIndex}</p><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{card.status} • {card.assignmentMode.replace('_', ' ')}</p></div><Link className={secondary} to={buildAuthenticatedVoteCardRoute(squadId, card.id)}><ExternalLink className="h-4 w-4" /> Open</Link></div>{card.status === 'pending' ? <div className="mt-3 space-y-2"><select className={field} value={draft.userId} onChange={(e) => setAssignment((current) => ({ ...current, [card.id]: { ...draft, userId: e.target.value, name: '', email: '' } }))}><option value="">Assign internal user</option>{users.map((user) => <option key={user.userId} value={user.userId}>{user.name}</option>)}</select><div className="grid gap-2 sm:grid-cols-2"><input className={field} value={draft.name} onChange={(e) => setAssignment((current) => ({ ...current, [card.id]: { ...draft, userId: '', name: e.target.value } }))} placeholder="External voter name" /><input className={field} value={draft.email} onChange={(e) => setAssignment((current) => ({ ...current, [card.id]: { ...draft, userId: '', email: e.target.value } }))} placeholder="Email (optional)" /></div><div className="flex flex-wrap gap-2"><button type="button" disabled={working || (!draft.userId && !draft.name.trim())} className={primary} onClick={() => void mutate(async () => { const result = await assignVoteCard({ cardId: card.id, userId: draft.userId || null, name: draft.name || null, email: draft.email || null }); if (result?.publicSubmitToken) setShareLink(buildPublicVoteCardUrl(result.publicSubmitToken)) })}>Assign</button><button type="button" className={secondary} onClick={() => window.confirm('Delete this pending card?') && void mutate(() => deleteVoteCard(card.id))}><Trash2 className="h-4 w-4" /></button></div></div> : card.status === 'submitted' ? <button type="button" className={`${secondary} mt-3`} onClick={() => window.confirm('Void this submitted card?') && void mutate(() => voidVoteCard(card.id))}><X className="h-4 w-4" /> Void</button> : null}</article> }) : <p className="text-sm text-slate-400">No cards. Add an active award template before creating a matchup.</p>}</div></PortalCard>) : <PortalCard className="teams-section-card"><p className="font-semibold text-white">No matchups yet</p><p className="mt-1 text-sm text-slate-400">Create a tracked or manual matchup to generate configured cards.</p></PortalCard>}
        </div>
      )}
      {shareLink ? <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-[#39FF88]/30 bg-[#07131a] p-4 shadow-2xl"><div className="min-w-0 flex-1"><p className="font-bold text-white">External voting link created</p><p className="truncate text-xs text-slate-400">{shareLink}</p></div><button className={primary} onClick={() => void navigator.clipboard.writeText(shareLink)}><Clipboard className="h-4 w-4" /> Copy</button><button aria-label="Close link" className={secondary} onClick={() => setShareLink(null)}><X className="h-4 w-4" /></button></div> : null}
      {breakdown ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Matchup breakdown"><div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[#091423] p-5"><div className="flex items-start justify-between gap-3"><div><p className="teams-kicker">Private breakdown</p><h3 className="text-xl font-black text-white">{breakdown.matchup.roundLabel} • {breakdown.matchup.opponentName}</h3></div><button className={secondary} onClick={() => setBreakdown(null)}><X className="h-4 w-4" /></button></div><div className="mt-4 space-y-3">{breakdown.cards.map((card) => <div key={card.id || (card as any).cardId} className="rounded-2xl bg-white/[0.04] p-3"><p className="font-bold text-white">{card.awardTypeName} #{card.cardIndex} • {card.status}</p><p className="text-xs text-slate-500">{card.assignedVoterName || 'Unassigned'}{card.submittedAt ? ` • submitted ${dateLabel(card.submittedAt)}` : ''}</p>{card.entries?.map((entry) => <p key={entry.slotIndex} className="mt-2 text-sm text-slate-300">{entry.pointsValue} — {entry.subjectName}</p>)}</div>)}</div></div></div> : null}
    </div>
  )
}

export default function BestAndFairestPanel({ squadId }: { squadId: string }) {
  const state = useSquadVotes(squadId)
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [working, setWorking] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const groups = useMemo(() => state.groups.filter((group) => activeTab === 'active' ? group.isActive : !group.isActive), [activeTab, state.groups])
  const selected = state.groups.find((group) => group.id === selectedGroupId) ?? null
  async function run(action: () => Promise<unknown>) { setWorking(true); setMutationError(null); try { await action(); await state.refresh() } catch (e) { setMutationError(e instanceof Error ? e.message : 'Unable to update voting.') } finally { setWorking(false) } }
  async function create(event: FormEvent) { event.preventDefault(); if (!name.trim()) { setMutationError('Enter a voting group name.'); return } await run(async () => { const id = await createVoteGroup(squadId, name, description || null); setSelectedGroupId(String(id)); setName(''); setDescription('') }) }

  if (state.status === 'loading') return <PortalCard className="teams-section-card"><p className="text-sm text-slate-300">Loading Best & Fairest…</p></PortalCard>
  if (state.status === 'error') return <PortalCard className="teams-section-card"><p className="text-sm font-semibold text-red-300">Voting could not be loaded.</p><p className="mt-1 text-sm text-slate-400">{state.error}</p><button className={`${secondary} mt-4`} onClick={() => void state.refresh()}>Try again</button></PortalCard>
  if (!state.access.canManage) return <PortalCard className="teams-section-card"><p className="font-semibold text-white">Voting manager access required</p><p className="mt-1 text-sm text-slate-400">The server has not granted this account access to private Best & Fairest management or tallies.</p></PortalCard>
  return <section className="space-y-4" aria-labelledby="best-fairest-heading"><PortalCard className="teams-section-card"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="teams-kicker">Squad voting</p><h3 id="best-fairest-heading" className="mt-1 text-2xl font-black text-white">Best & Fairest</h3><p className="mt-1 max-w-2xl text-sm text-slate-400">Configure private award programs, eligible players, matchups and secure vote cards.</p></div><button className={secondary} onClick={() => void state.refresh()}><RefreshCw className="h-4 w-4" /> Refresh</button></div></PortalCard>{mutationError ? <PortalCard className="teams-section-card"><p role="alert" className="text-sm text-red-300">{mutationError}</p></PortalCard> : null}{selected ? <><button className={secondary} onClick={() => setSelectedGroupId(null)}>← Voting groups</button><PortalCard className="teams-section-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="teams-kicker">{selected.isActive ? 'Active program' : 'Archived program'}</p><h3 className="mt-1 text-xl font-black text-white">{selected.name}</h3><p className="mt-1 text-sm text-slate-400">{selected.description || 'No program notes'} • {selected.matchupCount} matchups • {selected.pendingCardCount} pending cards</p></div>{selected.isActive ? <button disabled={working} className={secondary} onClick={() => window.confirm('Archive this voting group?') && void run(() => archiveOrDeleteVoteGroup(selected.id))}>Archive</button> : <div className="flex gap-2"><button disabled={working} className={secondary} onClick={() => void run(() => restoreVoteGroup(selected.id))}>Restore</button><button disabled={working} className={secondary} onClick={() => window.confirm('Permanently delete this archived group?') && void run(async () => { await archiveOrDeleteVoteGroup(selected.id); setSelectedGroupId(null) })}><Trash2 className="h-4 w-4" /> Delete</button></div>}</div></PortalCard>{selected.isActive ? <GroupWorkspace squadId={squadId} group={selected} onChanged={state.refresh} /> : <PortalCard className="teams-section-card"><p className="text-sm text-slate-400">Archived programs are read-only here. Restore this group to manage it again.</p></PortalCard>}</> : <><PortalCard className="teams-section-card"><form className="grid gap-3 lg:grid-cols-[1fr_1.5fr_auto]" onSubmit={create}><input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Voting group name" aria-label="Voting group name" /><input className={field} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Season or competition notes" aria-label="Voting group description" /><button disabled={working} className={primary}><Award className="h-4 w-4" /> New group</button></form></PortalCard><div className="flex gap-2"><button className={activeTab === 'active' ? primary : secondary} onClick={() => setActiveTab('active')}>Active</button><button className={activeTab === 'archived' ? primary : secondary} onClick={() => setActiveTab('archived')}>Archived</button></div>{groups.length ? <div className="grid gap-4 lg:grid-cols-2">{groups.map((group) => <button key={group.id} type="button" className="rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(212,175,55,0.13),rgba(8,18,32,0.96)_48%)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#D4AF37]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#39FF88]" onClick={() => setSelectedGroupId(group.id)}><div className="flex items-start justify-between gap-3"><Award className="h-6 w-6 text-[#D4AF37]" /><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-300">{group.isActive ? 'Active' : 'Archived'}</span></div><h4 className="mt-5 text-xl font-black text-white">{group.name}</h4><p className="mt-1 line-clamp-2 text-sm text-slate-400">{group.description || 'Season voting program'}</p><div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-300"><span className="rounded-full bg-white/[0.05] px-2.5 py-1">{group.awardTypes.length} awards</span><span className="rounded-full bg-white/[0.05] px-2.5 py-1">{group.matchupCount} matchups</span><span className="rounded-full bg-white/[0.05] px-2.5 py-1">{group.pendingCardCount} pending</span></div></button>)}</div> : <PortalCard className="teams-section-card"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-slate-400" /><div><p className="font-semibold text-white">{activeTab === 'active' ? 'No active voting groups' : 'No archived voting groups'}</p><p className="mt-1 text-sm text-slate-400">{activeTab === 'active' ? 'Create a group to configure awards and eligible players.' : 'Archived voting programs will appear here.'}</p></div></div></PortalCard>}</>}</section>
}
