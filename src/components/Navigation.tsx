"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchBar } from "@/components/SearchBar";
import { NotificationBell } from "@/components/NotificationBell";
import type { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/tv", label: "TV" },
  { href: "/feed", label: "Community" },
];

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [avatarEmoji, setAvatarEmoji] = useState("💀");
  const [avatarBg, setAvatarBg] = useState("#0a0a0f");
  const [username, setUsername] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile() {
      const res = await fetch("/api/profile/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.avatar_emoji) setAvatarEmoji(data.avatar_emoji);
      if (data.avatar_bg)    setAvatarBg(data.avatar_bg);
      if (data.username)     setUsername(data.username);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setAvatarEmoji("💀");
        setUsername(null);
      } else if (event === "SIGNED_IN") {
        loadProfile();
      }
    });

    function onEmojiUpdated(e: Event) {
      const detail = (e as CustomEvent<{ emoji: string; bg?: string }>).detail ?? {};
      if (detail.emoji) setAvatarEmoji(detail.emoji);
      if (detail.bg)    setAvatarBg(detail.bg);
    }
    window.addEventListener("avatarEmojiUpdated", onEmojiUpdated);

    return () => {
      listener.subscription.unsubscribe();
      window.removeEventListener("avatarEmojiUpdated", onEmojiUpdated);
    };
  }, []);

  // Close all mobile panels when navigating to a new page
  useEffect(() => {
    setSearchOpen(false);
    setMobileNavOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    window.location.href = "/";
  }

  function toggleSearch() {
    setSearchOpen((o) => !o);
    setMobileNavOpen(false);
    setMenuOpen(false);
  }

  function toggleMobileNav() {
    setMobileNavOpen((o) => !o);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-shadow bg-crypt/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="text-2xl text-ghost transition-colors flex-shrink-0"
            style={{ fontFamily: "var(--font-creepster)", letterSpacing: "0.05em" }}
          >
            TerrorMeter
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 flex-shrink-0 ml-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label text-sm font-medium transition-colors hover:text-white"
                style={{ color: pathname === link.href ? "#cc0000" : "#888888" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex-1" />

          {/* Desktop search bar */}
          <div className="hidden md:block w-56 lg:w-72">
            <SearchBar placeholder="Search horror..." />
          </div>

          {/* Desktop notification bell */}
          {user && (
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          )}

          {/* Right-side icon cluster (all breakpoints) */}
          <div className="flex items-center gap-1">

            {/* Mobile: search icon toggle */}
            <button
              onClick={toggleSearch}
              className="md:hidden p-2 text-specter hover:text-ghost transition-colors rounded-lg hover:bg-shadow"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Mobile: notification bell */}
            {user && (
              <div className="md:hidden">
                <NotificationBell />
              </div>
            )}

            {/* User avatar dropdown / sign-in link */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setMenuOpen((o) => !o); setMobileNavOpen(false); setSearchOpen(false); }}
                  className="flex items-center text-sm text-specter hover:text-ghost transition-colors p-1"
                >
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{ backgroundColor: avatarBg }}
                  >
                    {avatarEmoji}
                  </span>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-tomb border border-shadow rounded-lg shadow-xl py-1 z-50">
                    {username && (
                      <p className="px-4 py-2 text-xs text-muted truncate">@{username}</p>
                    )}
                    <hr className="border-shadow my-1" />
                    <Link href="/profile/me" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors">
                      My Profile
                    </Link>
                    <Link href="/watchlist" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors">
                      My Watchlist
                    </Link>
                    <Link href="/notifications" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors">
                      Notifications
                    </Link>
                    <Link href="/settings" onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors">
                      Settings
                    </Link>
                    <hr className="border-shadow my-1" />
                    <button onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-specter hover:text-ghost hover:bg-shadow transition-colors">
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="font-label text-sm text-specter hover:text-ghost transition-colors px-2">
                Sign In
              </Link>
            )}

            {/* Mobile: hamburger / close icon */}
            <button
              onClick={toggleMobileNav}
              className="md:hidden p-2 text-specter hover:text-ghost transition-colors rounded-lg hover:bg-shadow"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
            >
              {mobileNavOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: expandable search bar (below nav bar, no overlap) */}
      {searchOpen && (
        <div className="md:hidden border-t border-shadow bg-crypt/95 px-4 py-3">
          <SearchBar placeholder="Search horror..." className="w-full" />
        </div>
      )}

      {/* Mobile: expandable nav links dropdown */}
      {mobileNavOpen && (
        <div className="md:hidden border-t border-shadow bg-crypt/95 pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileNavOpen(false)}
              className="font-label flex items-center px-6 py-3.5 text-base font-medium transition-colors border-b border-shadow/40 last:border-0"
              style={{ color: pathname === link.href ? "#cc0000" : "#888888" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
