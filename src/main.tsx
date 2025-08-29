import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './routes/App'
import Login from './routes/auth/Login'
import Register from './routes/auth/Register'
import Forgot from './routes/auth/Forgot'
import Hub from './routes/Hub'
import NewGame from './routes/NewGame'
import Setup from './routes/Setup'
import Game from './routes/Game'
import Viewer from './routes/Viewer'
import Onboarding from './routes/Onboarding'
import AuthCallback from './routes/auth/Callback'
import Profile from './routes/Profile'
import Summary from './routes/Summary'

const router=createBrowserRouter([
  { path:'/', element:<App/>, children:[
    { index:true, element:<Login/> },
    { path:'register', element:<Register/> },
    { path:'signup', element:<Register/> },
    { path:'forgot', element:<Forgot/> },
    { path:'onboarding', element:<Onboarding/> },
    { path:'hub', element:<Hub/> },
    { path:'profile', element:<Profile/> },
    { path:'new', element:<NewGame/> },
    { path:'setup/:gameId', element:<Setup/> },
    { path:'game/:gameId', element:<Game/> },
    { path:'summary/:gameId', element:<Summary/> },
    { path:'viewer/:gameId', element:<Viewer/> }
  ]},
  { path:'auth/callback', element:<AuthCallback/> },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><RouterProvider router={router}/></React.StrictMode>
)
