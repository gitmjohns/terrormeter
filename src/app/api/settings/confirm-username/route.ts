import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { usernameHasBannedWord } from "@/lib/wordFilter";
import { confirmUsernameLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try { await confirmUsernameLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Too many requests" }, { status: 429 }); }

  const body = await request.json();
  const { username } = body as { username: string };
  if (!username) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const trimmed = username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return NextResponse.json({ error: "Username must be 3–20 chars, letters/numbers/underscores only" }, { status: 400 });
  }
  if (usernameHasBannedWord(trimmed)) {
    return NextResponse.json({ error: "Username not allowed" }, { status: 400 });
  }

  const { data: conflict } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .neq("id", user.id)
    .maybeSingle();
  if (conflict) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed, username_confirmed: true })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/settings");

  const response = NextResponse.json({ success: true });
  response.cookies.set("username_confirmed", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
