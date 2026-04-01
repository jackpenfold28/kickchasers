import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
import CheckEmail from './routes/auth/CheckEmail'
import Forgot from './routes/auth/Forgot'
import ResetPassword from './routes/auth/ResetPassword'
import Squad from './routes/Squad'
import Landing from './routes/Landing'
import HowItWorks from './routes/HowItWorks'
import Onboarding from './routes/Onboarding'
import AuthCallback from './routes/auth/Callback'
import DisabledRoute from './routes/DisabledRoute'
import PortalLayout from './components/layout/PortalLayout'
import DashboardPage from './routes/portal/DashboardPage'
import SquadsPage from './routes/portal/SquadsPage'
import SquadCreatePage from './routes/portal/SquadCreatePage'
import SquadDetailPage from './routes/portal/SquadDetailPage'
import TeamSelectionPage from './routes/portal/TeamSelectionPage'
import GamesPage from './routes/portal/GamesPage'
import GameSummaryPage from './routes/portal/GameSummaryPage'
import ManualGameSummaryPage from './routes/portal/ManualGameSummaryPage'
import StatsPage from './routes/portal/StatsPage'
import MatchDayPage from './routes/portal/MatchDayPage'
import NotificationsPage from './routes/portal/NotificationsPage'
import ProfilePage from './routes/portal/ProfilePage'
import SettingsPage from './routes/portal/SettingsPage'
import AdminPage from './routes/portal/AdminPage'
import AdminLeaguesPage from './routes/portal/admin/AdminLeaguesPage'
import AdminOfficialSquadsPage from './routes/portal/admin/AdminOfficialSquadsPage'
import AdminModerationPage from './routes/portal/admin/AdminModerationPage'
import AdminUsersPage from './routes/portal/admin/AdminUsersPage'
import AdminManualFeedPostPage from './routes/portal/admin/AdminManualFeedPostPage'
import AdminRequestDetailPage from './routes/portal/admin/AdminRequestDetailPage'
import AdminRequestsPage from './routes/portal/admin/AdminRequestsPage'
import AdminGamesPage from './routes/portal/admin/AdminGamesPage'
import LeagueAdminDetailPage from './routes/portal/admin/LeagueAdminDetailPage'
import UpdateEmailPage from './routes/portal/settings/UpdateEmailPage'
import RolesPage from './routes/portal/settings/RolesPage'
import BlockedUsersPage from './routes/portal/settings/BlockedUsersPage'
import LegalDocumentPage from './routes/LegalDocumentPage'
import RequestLeague from './routes/RequestLeague'
import RequestClub from './routes/RequestClub'
import { legalDocuments } from './content/legalDocuments'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'landing', element: <Landing /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'terms', element: <LegalDocumentPage document={legalDocuments.terms} /> },
      { path: 'privacy', element: <LegalDocumentPage document={legalDocuments.privacy} /> },
      {
        path: 'community-guidelines',
        element: <LegalDocumentPage document={legalDocuments['community-guidelines']} />,
      },
      { path: 'support', element: <LegalDocumentPage document={legalDocuments.support} /> },
      { path: 'login', element: <Login /> },
      { path: 'sign-in', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'signup', element: <Register /> },
      { path: 'sign-up', element: <Register /> },
      { path: 'check-email', element: <CheckEmail /> },
      { path: 'forgot', element: <Forgot /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'request-league', element: <RequestLeague /> },
      { path: 'request-club', element: <RequestClub /> },
      { path: 'hub', element: <Navigate to="/dashboard" replace /> },
      { path: 'account/update-email', element: <Navigate to="/settings/update-email" replace /> },
      { path: 'squad', element: <Squad /> },
      {
        element: <PortalLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'match-day', element: <MatchDayPage /> },
          { path: 'teams', element: <SquadsPage /> },
          { path: 'teams/new', element: <SquadCreatePage /> },
          { path: 'teams/:id', element: <SquadDetailPage /> },
          { path: 'teams/:id/team-selection', element: <TeamSelectionPage /> },
          { path: 'squads', element: <SquadsPage /> },
          { path: 'squads/new', element: <SquadCreatePage /> },
          { path: 'squads/:id', element: <SquadDetailPage /> },
          { path: 'squads/:id/team-selection', element: <TeamSelectionPage /> },
          { path: 'games', element: <GamesPage /> },
          { path: 'games/:id', element: <GameSummaryPage /> },
          { path: 'games/manual/:id', element: <ManualGameSummaryPage /> },
          { path: 'stats', element: <StatsPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/update-email', element: <UpdateEmailPage /> },
          { path: 'settings/roles', element: <RolesPage /> },
          { path: 'settings/blocked-users', element: <BlockedUsersPage /> },
          { path: 'admin', element: <AdminPage /> },
          { path: 'admin/leagues', element: <AdminLeaguesPage /> },
          { path: 'admin/official-squads', element: <AdminOfficialSquadsPage /> },
          { path: 'admin/moderation', element: <AdminModerationPage /> },
          { path: 'admin/users', element: <AdminUsersPage /> },
          { path: 'admin/requests', element: <AdminRequestsPage /> },
          { path: 'admin/games', element: <AdminGamesPage /> },
          { path: 'admin/manual-feed-post', element: <AdminManualFeedPostPage /> },
          { path: 'admin/requests/:requestType/:requestId', element: <AdminRequestDetailPage /> },
          { path: 'leagues/:id', element: <LeagueAdminDetailPage /> },
        ],
      },

      // Legacy game-day routes intentionally disabled for portal phase
      { path: 'new', element: <DisabledRoute /> },
      { path: 'newgame/:gameId', element: <DisabledRoute /> },
      { path: 'setup/:gameId', element: <DisabledRoute /> },
      { path: 'game/:gameId', element: <DisabledRoute /> },
      { path: 'summary/:gameId', element: <DisabledRoute /> },
      { path: 'viewer/:gameId', element: <DisabledRoute /> },
      { path: 'player/:gameId/:playerId', element: <DisabledRoute /> },
    ],
  },
  { path: 'auth/callback', element: <AuthCallback /> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router}/></React.StrictMode>
)
