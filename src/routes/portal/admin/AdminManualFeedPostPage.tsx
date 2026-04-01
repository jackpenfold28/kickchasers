import { Link } from 'react-router-dom'
import PortalCard from '@/components/cards/PortalCard'
import { SectionHeading } from './admin-ui'

export default function AdminManualFeedPostPage() {
  return (
    <section className="grid gap-6">
      <PortalCard>
        <SectionHeading
          eyebrow="Admin / Manual Feed Post"
          title="Manual feed post tool entry point"
          description="The current real workflow exists in mobile under `/admin/manual-feed-post`. This portal pass adds the admin route and discoverability, but does not fake a web authoring tool that has not been ported yet."
          actions={<Link to="/admin" className="text-sm font-medium text-[#9CE8BE]">Back to overview</Link>}
        />
      </PortalCard>

      <PortalCard title="Current state" subtitle="Grounded scope only.">
        <div className="grid gap-4 text-sm leading-6 text-slate-300">
          <p>The existing manual feed post flow already supports manual stat-entry publishing in mobile. That workflow is a real platform-admin tool, but it has not been implemented in this web repo yet.</p>
          <p>This route exists so the Platform Admin area can surface the tool cleanly without pretending the web authoring flow is already available.</p>
          <p>When the web version is built, this route is where the current mobile capability should land.</p>
        </div>
      </PortalCard>
    </section>
  )
}
