"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Provider = "google" | "facebook" | "discord";

const PROVIDERS: { id: Provider; label: string; bg: string; hover: string; icon: React.ReactNode }[] = [
  {
    id: "google",
    label: "Continue with Google",
    bg: "#1a1a2a",
    hover: "#252535",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
  },
  {
    id: "discord",
    label: "Continue with Discord",
    bg: "#1a1d3a",
    hover: "#20244a",
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.245.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
      </svg>
    ),
  },
];

const ERROR_MESSAGES: Record<string, string> = {
  auth_failed: "Sign in failed. Please try again.",
  access_denied: "Access was denied. Please try again.",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(ERROR_MESSAGES[urlError] ?? "Sign in failed. Please try again.");
    }
  }, [searchParams]);

  async function signInWith(provider: Provider) {
    setLoading(provider);
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin.replace(/^(https?:\/\/)www\./, "$1");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback`,
        // Request email explicitly — required for Discord to return email data
        ...(provider === "discord" && { scopes: "identify email" }),
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💀</div>
          <h1 className="font-verdict text-4xl leading-tight" style={{ color: "#ffffff" }}>
            The TerrorMeter
          </h1>
          <p className="text-specter mt-3 text-sm leading-relaxed">
            Rate every horror title from Terrible to Terrifying
          </p>
        </div>

        {/* Card */}
        <div className="bg-tomb border border-shadow rounded-2xl p-6 space-y-3">
          <p className="text-center text-xs text-muted uppercase tracking-widest mb-5">
            Sign in to enter the crypt
          </p>

          {error && (
            <div className="bg-dookie/20 border border-dookie text-ghost text-sm rounded-lg px-4 py-3 mb-2">
              {error}
            </div>
          )}

          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => signInWith(p.id)}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-shadow text-ghost text-sm font-medium transition-all duration-200 disabled:opacity-50"
              style={{ backgroundColor: loading === p.id ? p.hover : p.bg }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = p.hover; }}
              onMouseLeave={e => { if (loading !== p.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = p.bg; }}
            >
              {p.icon}
              <span className="flex-1 text-center">
                {loading === p.id ? "Redirecting…" : p.label}
              </span>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted mt-6 leading-relaxed">
          By signing in you agree to our{" "}
          <Link href="/terms" className="text-muted/80 underline hover:text-specter transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-muted/80 underline hover:text-specter transition-colors">Privacy Policy</Link>.<br />
          Your account will be created automatically on first sign in.
        </p>
      </div>
    </div>
  );
}
