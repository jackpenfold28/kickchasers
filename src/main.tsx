import React from 'react'
import ReactDOM from 'react-dom/client'
import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
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
import GamesPage from './routes/portal/GamesPage'
import GameSummaryPage from './routes/portal/GameSummaryPage'
import ManualGameSummaryPage from './routes/portal/ManualGameSummaryPage'
import StatsPage from './routes/portal/StatsPage'
import NotificationsPage from './routes/portal/NotificationsPage'
import ProfilePage from './routes/portal/ProfilePage'
import SettingsPage from './routes/portal/SettingsPage'
import AdminPage from './routes/portal/AdminPage'
import UpdateEmailPage from './routes/portal/settings/UpdateEmailPage'
import RolesPage from './routes/portal/settings/RolesPage'
import BlockedUsersPage from './routes/portal/settings/BlockedUsersPage'
import LegalDocumentPage from './routes/LegalDocumentPage'
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
      { path: 'forgot', element: <Forgot /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'hub', element: <Navigate to="/dashboard" replace /> },
      { path: 'account/update-email', element: <Navigate to="/settings/update-email" replace /> },
      { path: 'squad', element: <Squad /> },
      {
        element: <PortalLayout />,
        children: [
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'squads', element: <SquadsPage /> },
          { path: 'squads/new', element: <SquadCreatePage /> },
          { path: 'squads/:id', element: <SquadDetailPage /> },
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
