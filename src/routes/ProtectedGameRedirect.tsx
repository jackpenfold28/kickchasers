import { Navigate, useParams } from 'react-router-dom'
import { buildTrackedSummaryRoute } from '@/lib/canonical/games-parity-contract'

export default function ProtectedGameRedirect() {
  const { gameId } = useParams<{ gameId: string }>()
  return <Navigate to={gameId ? buildTrackedSummaryRoute(gameId) : '/games'} replace />
}
