import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { ratingLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ score: null });
  const titleId = request.nextUrl.searchParams.get("titleId");
  if (!titleId) return NextResponse.json({ score: null });
  const { data } = await adminDb().from("ratings").select("score")
    .eq("user_id", user.id).eq("title_id", titleId).maybeSingle();
  return NextResponse.json({ score: data?.score ?? null });
}

export async function POST(request: NextRequest) {
  // Verify identity with session client; use service role for the write so
  // RLS cannot block the upsert.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json();
  const { titleId, score } = body as { titleId: string; score: number };
  if (!titleId || typeof score !== "number" || score < 0 || score > 100) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try { await ratingLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Slow down — you're rating too fast" }, { status: 429 }); }

  const { error } = await adminDb().from("ratings").upsert(
    { user_id: user.id, title_id: titleId, score },
    { onConflict: "user_id,title_id" }
  );

  if (error) {
    console.error("[api/rate] upsert error:", error.message, "code:", error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath(`/movies/${titleId}`);
  revalidatePath(`/tv/${titleId}`);
  return NextResponse.json({ success: true });
}
