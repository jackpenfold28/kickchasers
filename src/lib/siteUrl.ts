

// src/lib/siteUrl.ts
const fallback =
  typeof window !== "undefined" ? window.location.origin : "https://kickchasers.com";

// In prod, prefer the env var; in dev it falls back to current origin.
export const siteUrl =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) || fallback;

export const authCallbackUrl = `${siteUrl}/auth/callback`;
export const onboardingUrl = `${siteUrl}/onboarding`;