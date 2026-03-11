import PortalCard from '@/components/cards/PortalCard'

type PlaceholderPageProps = {
  title: string
  description: string
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <PortalCard title={title} subtitle="Portal foundation placeholder">
      <p className="text-sm text-slate-300">{description}</p>
    </PortalCard>
  )
}
