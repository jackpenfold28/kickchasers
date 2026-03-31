import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import autoTable from 'jspdf-autotable'
import jsPDF from 'jspdf'
import PortalCard from '@/components/cards/PortalCard'
import {
  MatchHero,
  StickyMatchHeader,
  SummaryActionBar,
  SummaryControls,
  SummaryInsightTiles,
  SummaryPlayersTable,
  TeamComparisonBars,
} from '@/components/portal/game-summary/SummaryMatchComponents'
import {
  ADVANCED_ONLY_COLUMN_KEYS,
  ADVANCED_SUMMARY_COLUMNS,
  BASE_SUMMARY_COLUMNS,
  TEAM_COMPARISON_GROUPS,
  buildAvailableScopes,
  buildPlayerSummaryRows,
  buildTeamSummaryRows,
  computeInsightTiles,
  computeScoreBySide,
  formatTeamShortName,
  sortPlayerRows,
  type SummaryColumnDef,
  type PlayerSummaryRow,
  type SummaryScope,
  type SummarySortKey,
} from '@/lib/portal-game-summary'
import { getGameSummary, type GameSummary } from '@/lib/portal-games'
import { formatRoundLabel } from '@/lib/round-label'

const formatDateTime = (value: string | null) => {
  if (!value) return 'Date TBD'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date TBD'
  return date.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const normalizeHexColor = (input: string | null | undefined) => {
  if (!input) return null
  let trimmed = input.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('#')) trimmed = trimmed.slice(1)
  if (trimmed.length === 3) {
    trimmed = trimmed
      .split('')
      .map((char) => `${char}${char}`)
      .join('')
  }
  if (trimmed.length !== 6) return null
  if (!/^[0-9a-fA-F]{6}$/.test(trimmed)) return null
  return `#${trimmed.toUpperCase()}`
}

const logoColorCache = new Map<string, string>()

const averageImageColorToHex = (image: HTMLImageElement) => {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)

  let totalRed = 0
  let totalGreen = 0
  let totalBlue = 0
  let totalWeight = 0

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255
    if (alpha < 0.08) continue
    totalRed += data[index] * alpha
    totalGreen += data[index + 1] * alpha
    totalBlue += data[index + 2] * alpha
    totalWeight += alpha
  }

  if (!totalWeight) return null

  const red = Math.round(totalRed / totalWeight)
  const green = Math.round(totalGreen / totalWeight)
  const blue = Math.round(totalBlue / totalWeight)

  return `#${[red, green, blue]
    .map((value) => value.toString(16).padStart(2, '0').toUpperCase())
    .join('')}`
}

const resolveLogoPrimaryColor = async (logoUrl: string | null | undefined, fallbackColor: string) => {
  if (!logoUrl || typeof window === 'undefined') return fallbackColor

  const cached = logoColorCache.get(logoUrl)
  if (cached) return cached

  const resolved = await new Promise<string>((resolve) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.referrerPolicy = 'no-referrer'
    image.onload = () => {
      try {
        resolve(averageImageColorToHex(image) ?? fallbackColor)
      } catch {
        resolve(fallbackColor)
      }
    }
    image.onerror = () => resolve(fallbackColor)
    image.src = logoUrl
  })

  logoColorCache.set(logoUrl, resolved)
  return resolved
}

const resolveSideTint = async (
  primaryColorHex: string | null | undefined,
  logoUrl: string | null | undefined,
  fallbackColor: string
) => {
  const direct = normalizeHexColor(primaryColorHex)
  if (direct) return direct
  const sampled = normalizeHexColor(await resolveLogoPrimaryColor(logoUrl, fallbackColor))
  return sampled ?? fallbackColor
}

const formatStatus = (value: string | null) => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'final' || normalized === 'finished' || normalized === 'complete' || normalized === 'completed') return 'FINAL'
  if (normalized === 'live') return 'LIVE'
  if (normalized === 'scheduled') return 'SCHEDULED'
  return value?.toUpperCase() || 'SUMMARY'
}

const formatScopeTitle = (scope: SummaryScope) => (scope === 'total' ? 'Total' : typeof scope === 'number' ? `Q${scope}` : scope.toUpperCase())

const exportSummaryPdf = ({
  summary,
  availableScopes,
  activeColumns,
  selectedScope,
}: {
  summary: GameSummary
  availableScopes: SummaryScope[]
  activeColumns: SummaryColumnDef[]
  selectedScope: SummaryScope
}) => {
  const homeName = summary.homeTeamName || summary.squadName || 'Home'
  const awayName = summary.awayTeamName || summary.opponent || 'Away'
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' })
  const margin = 36
  const totalScore = computeScoreBySide(summary.events, 'total')
  const title = `${homeName} ${totalScore.home.points} : ${totalScore.away.points} ${awayName} — Match Summary`

  const tableColumns = ['Team', 'G.B', 'PTS', 'D', 'K', 'HB', 'M', 'T', 'CL', 'I50', 'R50', 'AF']
  const scopeTables = ['total', ...availableScopes.filter((scope) => scope !== 'total')] as SummaryScope[]

  const buildTeamTableRows = (scope: SummaryScope) => {
    const rows = buildTeamSummaryRows(summary.events, { scope })
    const score = computeScoreBySide(summary.events, scope)
    const home = rows.find((row) => row.teamSide === 'home')
    const away = rows.find((row) => row.teamSide === 'away')
    return [
      {
        Team: homeName,
        'G.B': `${score.home.goals}.${score.home.behinds}`,
        PTS: score.home.points,
        D: home?.stats.D ?? 0,
        K: home?.stats.K ?? 0,
        HB: home?.stats.HB ?? 0,
        M: home?.stats.M ?? 0,
        T: home?.stats.T ?? 0,
        CL: home?.stats.CL ?? 0,
        I50: home?.stats.I50 ?? 0,
        R50: home?.stats.R50 ?? 0,
        AF: home?.stats.AF ?? 0,
      },
      {
        Team: awayName,
        'G.B': `${score.away.goals}.${score.away.behinds}`,
        PTS: score.away.points,
        D: away?.stats.D ?? 0,
        K: away?.stats.K ?? 0,
        HB: away?.stats.HB ?? 0,
        M: away?.stats.M ?? 0,
        T: away?.stats.T ?? 0,
        CL: away?.stats.CL ?? 0,
        I50: away?.stats.I50 ?? 0,
        R50: away?.stats.R50 ?? 0,
        AF: away?.stats.AF ?? 0,
      },
    ]
  }

  const mapPlayerRows = (rows: PlayerSummaryRow[]) =>
    rows.map((row) => {
      const mapped: Record<string, string | number> = {
        '#': row.jumperNumber ?? '–',
        Player: row.name,
      }
      for (const column of activeColumns) {
        mapped[column.label] =
          column.key === 'GB'
            ? `${row.stats.G ?? 0}.${row.stats.B ?? 0}`
            : column.key === 'D'
            ? row.stats.D ?? (row.stats.K ?? 0) + (row.stats.HB ?? 0)
            : row.stats[column.key] ?? 0
      }
      return mapped
    })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, margin, 40)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`${formatRoundLabel(summary.round, 'Round TBD')} • ${summary.venue || 'Venue TBD'} • ${formatDateTime(summary.date)}`, margin, 58)

  let startY = 76
  scopeTables.forEach((scope, index) => {
    const rows = buildTeamTableRows(scope)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(formatScopeTitle(scope), margin, startY)
    autoTable(doc, {
      startY: startY + 8,
      head: [tableColumns],
      body: rows.map((row) => tableColumns.map((column) => row[column as keyof typeof row])),
      margin: { left: margin, right: margin },
      styles: { fontSize: 9, halign: 'center' },
      columnStyles: { 0: { halign: 'left' } },
      headStyles: { fillColor: [18, 26, 42], textColor: 255 },
    })
    startY = (doc as any).lastAutoTable.finalY + 18
    if (startY > 480 && index < scopeTables.length - 1) {
      doc.addPage()
      startY = 40
    }
  })

  const playerColumns = ['#', 'Player', ...activeColumns.map((column) => column.label)]
  const scopedHomeRows = buildPlayerSummaryRows(summary.events, summary.players, { teamSide: 'home', scope: selectedScope })
  const scopedAwayRows = buildPlayerSummaryRows(summary.events, summary.players, { teamSide: 'away', scope: selectedScope })

  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`${homeName} Players (${formatScopeTitle(selectedScope)})`, margin, 40)
  autoTable(doc, {
    startY: 56,
    head: [playerColumns],
    body: mapPlayerRows(scopedHomeRows).map((row) => playerColumns.map((column) => row[column])),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, halign: 'center' },
    columnStyles: { 1: { halign: 'left' } },
    headStyles: { fillColor: [18, 26, 42], textColor: 255 },
  })

  doc.addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`${awayName} Players (${formatScopeTitle(selectedScope)})`, margin, 40)
  autoTable(doc, {
    startY: 56,
    head: [playerColumns],
    body: mapPlayerRows(scopedAwayRows).map((row) => playerColumns.map((column) => row[column])),
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, halign: 'center' },
    columnStyles: { 1: { halign: 'left' } },
    headStyles: { fillColor: [18, 26, 42], textColor: 255 },
  })

  doc.save(`kickchasers-match-summary-${summary.id}.pdf`)
}

export default function GameSummaryPage() {
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<GameSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'players' | 'team'>('players')
  const [selectedScope, setSelectedScope] = useState<SummaryScope>('total')
  const [advanced, setAdvanced] = useState(false)
  const [sortKey, setSortKey] = useState<SummarySortKey>('D')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [stickyVisible, setStickyVisible] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [homeTint, setHomeTint] = useState('#00d09c')
  const [awayTint, setAwayTint] = useState('#a855f7')

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!id) return
      try {
        const data = await getGameSummary(id)
        if (!cancelled) setSummary(data)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load game summary.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    const handleScroll = () => setStickyVisible(window.scrollY > 280)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    let active = true

    const hydrateTints = async () => {
      if (!summary) return
      const [resolvedHome, resolvedAway] = await Promise.all([
        resolveSideTint(summary.homePrimaryColorHex, summary.squadLogoUrl, '#00d09c'),
        resolveSideTint(summary.awayPrimaryColorHex, summary.opponentLogoUrl, '#a855f7'),
      ])
      if (!active) return
      setHomeTint(resolvedHome)
      setAwayTint(resolvedAway)
    }

    void hydrateTints()
    return () => {
      active = false
    }
  }, [summary])

  if (loading) {
    return <main className="min-h-screen p-6 app-bg">Loading summary…</main>
  }

  if (!summary) {
    return (
      <PortalCard>
        <p className="text-sm text-red-300">{error || 'Game summary not available.'}</p>
      </PortalCard>
    )
  }

  const availableScopes = buildAvailableScopes(summary.events)
  const effectiveScope = availableScopes.includes(selectedScope) ? selectedScope : 'total'
  const activeColumns = advanced ? ADVANCED_SUMMARY_COLUMNS : BASE_SUMMARY_COLUMNS

  const playerRows = [
    ...buildPlayerSummaryRows(summary.events, summary.players, { teamSide: 'home', scope: effectiveScope }),
    ...buildPlayerSummaryRows(summary.events, summary.players, { teamSide: 'away', scope: effectiveScope }),
  ]
  const sortedRows = sortPlayerRows(playerRows, sortKey, sortDirection)
  const teamRows = buildTeamSummaryRows(summary.events, { scope: effectiveScope })
  const homeStats = teamRows.find((row) => row.teamSide === 'home')?.stats
  const awayStats = teamRows.find((row) => row.teamSide === 'away')?.stats
  const totalScore = computeScoreBySide(summary.events, 'total')
  const quarterScores = {
    home: [1, 2, 3, 4].map((quarter) => {
      if (!availableScopes.includes(quarter)) return '–'
      const score = computeScoreBySide(summary.events, quarter)
      return `${score.home.goals}.${score.home.behinds}`
    }),
    away: [1, 2, 3, 4].map((quarter) => {
      if (!availableScopes.includes(quarter)) return '–'
      const score = computeScoreBySide(summary.events, quarter)
      return `${score.away.goals}.${score.away.behinds}`
    }),
  }

  const homeName = formatTeamShortName(summary.homeTeamName || summary.squadName || 'Home') || 'Home'
  const awayName = formatTeamShortName(summary.awayTeamName || summary.opponent || 'Away') || 'Away'
  const insights = computeInsightTiles({
    playerRows,
    homeStats,
    awayStats,
    events: summary.events,
    availableScopes,
    homeTeamName: summary.homeTeamName || summary.squadName || 'Home',
    awayTeamName: summary.awayTeamName || summary.opponent || 'Away',
  })

  const statusLabel = formatStatus(summary.status)
  const roundLabel = formatRoundLabel(summary.round, 'Round TBD')
  const venueLabel = summary.venue || 'Venue TBD'
  const dateLabel = formatDateTime(summary.date)

  const handleSort = (key: SummarySortKey) => {
    if (sortKey === key) setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const handleShare = async () => {
    const text = `${summary.homeTeamName || homeName} ${totalScore.home.points} - ${totalScore.away.points} ${summary.awayTeamName || awayName}\n${statusLabel}\n${roundLabel} • ${venueLabel}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'KickChasers Match Summary', text })
        return
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      }
    } catch {
      // ignore share failure
    }
  }

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      exportSummaryPdf({
        summary,
        availableScopes,
        activeColumns,
        selectedScope: effectiveScope,
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <StickyMatchHeader
        visible={stickyVisible}
        home={{
          name: homeName,
          logoUrl: summary.squadLogoUrl,
          accent: homeTint,
          score: totalScore.home.points,
          goals: totalScore.home.goals,
          behinds: totalScore.home.behinds,
        }}
        away={{
          name: awayName,
          logoUrl: summary.opponentLogoUrl,
          accent: awayTint,
          score: totalScore.away.points,
          goals: totalScore.away.goals,
          behinds: totalScore.away.behinds,
        }}
        statusLabel={statusLabel}
        roundLabel={roundLabel}
        venueLabel={venueLabel}
        dateLabel={dateLabel}
        onShare={handleShare}
        onDownload={handleDownload}
        isDownloading={downloading}
      />

      <section className="space-y-4 pb-12">
        <MatchHero
          home={{
            name: homeName,
            logoUrl: summary.squadLogoUrl,
            accent: homeTint,
            score: totalScore.home.points,
            goals: totalScore.home.goals,
            behinds: totalScore.home.behinds,
          }}
          away={{
            name: awayName,
            logoUrl: summary.opponentLogoUrl,
            accent: awayTint,
            score: totalScore.away.points,
            goals: totalScore.away.goals,
            behinds: totalScore.away.behinds,
          }}
          statusLabel={statusLabel}
          centerLabel={summary.gradeLabel || 'VS'}
          roundLabel={roundLabel}
          venueLabel={venueLabel}
          dateLabel={dateLabel}
          homeQuarterScores={quarterScores.home}
          awayQuarterScores={quarterScores.away}
        />

        <SummaryActionBar onShare={handleShare} onDownload={handleDownload} isDownloading={downloading} />

        <SummaryInsightTiles tiles={insights} homeTint={homeTint} awayTint={awayTint} />

        <SummaryControls
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          selectedScope={effectiveScope}
          onSelectScope={setSelectedScope}
          availableScopes={availableScopes}
          advanced={advanced}
          onToggleAdvanced={() => setAdvanced((current) => !current)}
        />

        {activeTab === 'players' ? (
          <SummaryPlayersTable
            gameId={summary.id}
            rows={sortedRows}
            columns={activeColumns}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={handleSort}
            advancedOnlyKeys={advanced ? ADVANCED_ONLY_COLUMN_KEYS : []}
            homeTint={homeTint}
            awayTint={awayTint}
          />
        ) : (
          <TeamComparisonBars
            groups={TEAM_COMPARISON_GROUPS}
            homeName={homeName}
            awayName={awayName}
            homeStats={homeStats ?? buildTeamSummaryRows([], { scope: 'total' })[0].stats}
            awayStats={awayStats ?? buildTeamSummaryRows([], { scope: 'total' })[1].stats}
            homeTint={homeTint}
            awayTint={awayTint}
          />
        )}
      </section>
    </>
  )
}
