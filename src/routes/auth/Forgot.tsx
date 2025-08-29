import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { authCallbackUrl } from '@/lib/siteUrl'
export default function Forgot(){
  const [email,setEmail]=useState(''); const [msg,setMsg]=useState<string|null>(null)
  async function onSubmit(e:React.FormEvent){ e.preventDefault(); setMsg(null); await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${authCallbackUrl}?mode=rp`}); setMsg("If that email exists, you'll receive reset instructions.") }
  return <div className="max-w-md mx-auto p-6 space-y-4">
    <h1 className="h1">Reset password</h1>
    <form onSubmit={onSubmit} className="space-y-3">
      <Input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <button className="btn btn-primary w-full">Send reset link</button>
    </form>
    {msg && <div className="text-green-500 text-sm">{msg}</div>}
    <div className="text-sm"><Link to="/" className="underline">Back to sign in</Link></div>
  </div>
}
