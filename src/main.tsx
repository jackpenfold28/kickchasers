import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
import Forgot from './routes/auth/Forgot'
import Hub from './routes/Hub'
import Squad from './routes/Squad'
import Landing from './routes/Landing'
import Onboarding from './routes/Onboarding'
import AuthCallback from './routes/auth/Callback'
import Profile from './routes/Profile'
import DisabledRoute from './routes/DisabledRoute'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'signup', element: <Register /> },
      { path: 'forgot', element: <Forgot /> },
      { path: 'onboarding', element: <Onboarding /> },
      { path: 'hub', element: <Hub /> },
      { path: 'profile', element: <Profile /> },
      { path: 'squad', element: <Squad /> },

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
