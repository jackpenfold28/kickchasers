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
    // If a magic-link / confirmation routed to '/', handle it here as a fallback.
    const url = window.location.href;
    const hasCode =
      url.includes('code=') ||
      url.includes('access_token=') ||
      url.includes('refresh_token=');

    if (!hasCode) return;

    (async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(url);
      if (error) {
        console.error('exchangeCodeForSession on Login failed:', error);
        return;
      }
      nav('/onboarding?new=1', { replace: true });
    })();
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

    // success: go to hub (or ?redirect=)
    if (data?.user) nav(redirectTo, { replace: true });
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