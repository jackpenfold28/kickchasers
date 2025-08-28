import { STAT_DEFS, StatKey } from '@/types'

export type Totals = Record<StatKey, number>

export default function TotalsStrip({ title, totals }:{ title:string; totals: Totals }) {
  const keys: StatKey[] = ['K','HB','M','T','G','B','FF','FA','CL','I50','R50']
  return (
    <div className="card">
      <div className="h2 mb-3">{title}</div>
      <div className="totals-strip">
        {keys.map(k => (
          <div key={k} className="totals-pill">
            <div className="totals-value">{totals[k] ?? 0}</div>
            <div className="totals-label">{label(k)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function label(k: StatKey) {
  switch(k){
    case 'K': return 'Kicks'
    case 'HB': return 'Handballs'
    case 'M': return 'Marks'
    case 'T': return 'Tackles'
    case 'G': return 'Goals'
    case 'B': return 'Behinds'
    case 'FF': return 'Free For'
    case 'FA': return 'Free Against'
    case 'CL': return 'Clearances'
    case 'I50': return 'Inside 50s'
    case 'R50': return 'Rebound 50s'
  }
}