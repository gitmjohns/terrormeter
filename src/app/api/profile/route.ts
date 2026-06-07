import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { usernameHasBannedWord } from "@/lib/wordFilter";
import { profileUpdateLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try { await profileUpdateLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Too many requests" }, { status: 429 }); }

  const svc = adminDb();

  const { data: profile, error: profileError } = await svc
    .from("profiles")
    .select("id, username_confirmed")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (profile) {
    return NextResponse.json({ username_confirmed: profile.username_confirmed });
  }

  const username = await makeUniqueUsername(svc, user);

  const { error: insertError } = await svc.from("profiles").insert({
    id: user.id,
    username,
    username_confirmed: false,
    avatar_emoji: "💀",
    avatar_bg: "#0a0a0f",
    role: "user",
    banned: false,
    is_prime_admin: false,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ username_confirmed: false });
}

async function makeUniqueUsername(
  svc: ReturnType<typeof adminDb>,
  user: { user_metadata?: Record<string, string>; email?: string }
): Promise<string> {
  const raw =
    (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "ghost"
    )
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 16) || "ghost";

  const base = usernameHasBannedWord(raw)
    ? "ghost"
    : raw.length >= 3
    ? raw
    : `${raw}user`;
  let candidate = base;

  for (let i = 0; i < 10; i++) {
    const { data } = await svc
      .from("profiles")
      .select("id")
      .eq("username", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base.slice(0, 14)}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  return `user${Date.now().toString(36)}`;
}
