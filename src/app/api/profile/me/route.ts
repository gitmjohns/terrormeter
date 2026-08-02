import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ avatar_emoji: null });

  const { data } = await supabase
    .from("profiles")
    .select("avatar_emoji, avatar_bg, username, role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    avatar_emoji: data?.avatar_emoji ?? "💀",
    avatar_bg:    data?.avatar_bg    ?? "#0a0a0f",
    username:     data?.username     ?? null,
    role:         data?.role         ?? "user",
  });
}
