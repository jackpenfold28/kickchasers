

// src/lib/siteUrl.ts
const fallback =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

// In production, set VITE_PUBLIC_SITE_URL explicitly in Vercel.
export const siteUrl =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || fallback;

export const authCallbackUrl = `${siteUrl}/auth/callback`;
export const onboardingUrl = `${siteUrl}/onboarding`;
