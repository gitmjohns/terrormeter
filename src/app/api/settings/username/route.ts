import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { usernameChangeLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try { await usernameChangeLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Too many requests" }, { status: 429 }); }

  const body = await request.json();
  const { username } = body as { username: string };
  if (!username) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const trimmed = username.trim().toLowerCase();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
    return NextResponse.json({ error: "Username must be 3-20 chars, letters/numbers/underscores only" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", trimmed)
    .neq("id", user.id)
    .single();
  if (existing) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

  const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/settings");
  revalidatePath(`/profile/${trimmed}`);
  return NextResponse.json({ success: true });
}
