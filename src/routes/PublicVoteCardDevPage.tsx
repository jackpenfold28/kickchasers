import PublicVoteCard from '@/components/vote-card/PublicVoteCard'
import { devVoteCardContext } from '@/mocks/devVoteCard'

export default function PublicVoteCardDevPage() {
  return <PublicVoteCard context={devVoteCardContext} mode="dev" />
}
