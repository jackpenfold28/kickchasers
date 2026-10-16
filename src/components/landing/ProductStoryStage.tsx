import type { ReactNode } from 'react'

/** The same media remains in the DOM for static, keyboard and mobile layouts. */
export function ProductStoryStage({ kind, children, labels }: { kind: 'mapping' | 'cards' | 'phones'; children: ReactNode; labels?: string[] }) {
  const steps = labels || (kind === 'mapping'
    ? ['Select what to map', 'Map every stat', 'See the game move']
    : ['Your performance. Your card.', 'Track. Create. Save. Share.', 'Keep your season together'])
  return <div className="lp-story-track" data-product-stage={kind}>
    <div className="lp-sticky-stage">
      {children}
      <ol className="lp-story-progress" aria-label={`${kind === 'mapping' ? 'Mapping' : kind === 'cards' ? 'Game Card' : 'Feature'} story`}>
        {steps.map((step,index) => <li key={step} data-story-step={index}><span aria-hidden="true">0{index+1}</span>{step}</li>)}
      </ol>
      <div className="lp-story-progress-line" aria-hidden="true"><span/></div>
    </div>
  </div>
}
