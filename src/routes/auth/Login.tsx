import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [qp] = useSearchParams();
  const redirectTo = qp.get("redirect") || "/hub";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>();

  useEffect(() => {
    // Handle Supabase magic-link / email confirmation that lands on '/' with hash tokens.
    // Outlook SafeLinks and some clients preserve tokens in the URL hash.
    const hash = window.location.hash || ''
    const hasAuthParams =
      hash.includes('code=') ||
      hash.includes('access_token=') ||
      hash.includes('refresh_token=')

    if (!hasAuthParams) return

    ;(async () => {
      try {
        // Build a URL that includes the hash fragment for Supabase to parse
        const full = `${window.location.origin}${window.location.pathname}${hash}`
        const { error } = await supabase.auth.exchangeCodeForSession(full)
        if (error) {
          console.error('exchangeCodeForSession on Login failed:', error)
          return
        }

        // Clean the hash from the address bar
        window.history.replaceState({}, document.title, window.location.pathname)

        // Proceed to onboarding once session is set
        nav('/onboarding?new=1', { replace: true })
      } catch (err) {
        console.error('Unexpected error exchanging code on Login:', err)
      }
    })()
  }, [nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(undefined);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    // success: first-login goes to onboarding; otherwise go to hub (or ?redirect=)
    if (data?.user) {
      try {
        const { data: profileRow, error: profErr } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profErr) {
          console.warn('profiles lookup failed, sending to onboarding by default:', profErr);
          nav('/onboarding?new=1', { replace: true });
        } else if (!profileRow) {
          // No profile row yet -> treat as first login
          nav('/onboarding?new=1', { replace: true });
        } else {
          nav(redirectTo, { replace: true });
        }
      } catch (e) {
        console.error('profiles check error, routing to onboarding:', e);
        nav('/onboarding?new=1', { replace: true });
      }
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 app-bg">
      <div className="flex justify-center items-center gap-6">
        <div className="flex justify-center items-center">
          <img
            src="/kickchasers_logo.png"
            alt="Kickchasers logo"
            className="w-[32rem] h-auto drop-shadow-lg"
          />
        </div>
        <form onSubmit={onSubmit} className="form-card w-full max-w-md">
        <h1 className="h1">Sign in</h1>

        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <div className="relative">
          <input
            className="input pr-24"
            type={showPw ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn px-2 py-1"
            onClick={() => setShowPw((s) => !s)}
          >
            {showPw ? "Hide" : "Show"}
          </button>
        </div>

        {err && <div className="text-red-400 text-sm">{err}</div>}

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

          <div className="flex justify-between text-sm">
            <Link className="underline" to="/signup">Create account</Link>
            <Link className="underline" to="/forgot">Forgot password</Link>
          </div>
        </form>
      </div>
    </main>
  );
}