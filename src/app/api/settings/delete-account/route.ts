import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { deleteAccountLimiter } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try { await deleteAccountLimiter.consume(user.id); }
  catch { return NextResponse.json({ error: "Too many requests" }, { status: 429 }); }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_prime_admin")
    .eq("id", user.id)
    .single();
  if (profile?.is_prime_admin) {
    return NextResponse.json({ error: "This account cannot be deleted" }, { status: 403 });
  }

  const svc = serviceClient();
  await Promise.all([
    svc.from("watchlist").delete().eq("user_id", user.id),
    svc.from("ratings").delete().eq("user_id", user.id),
    svc.from("comment_votes").delete().eq("user_id", user.id),
    svc.from("comment_downvotes").delete().eq("user_id", user.id),
    svc.from("debate_replies").delete().eq("user_id", user.id),
    svc.from("notifications").delete().eq("user_id", user.id),
    svc.from("activity_feed").delete().eq("user_id", user.id),
  ]);
  await svc.from("comments").delete().eq("user_id", user.id);
  await svc.from("profiles").delete().eq("id", user.id);
  await svc.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
