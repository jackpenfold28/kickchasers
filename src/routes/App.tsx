import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { setClubColours } from '@/lib/theme'
export default function App(){
  useEffect(()=>{
    const saved=localStorage.getItem('theme');const html=document.documentElement
    if(saved==='light'){html.classList.remove('dark');html.classList.add('light')} else {html.classList.add('dark');html.classList.remove('light')}
    setClubColours(localStorage.getItem('club_primary')||'#003C77', localStorage.getItem('club_secondary')||'#ffffff')
    if('serviceWorker'in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})
  },[])
  return <Outlet/>
}
