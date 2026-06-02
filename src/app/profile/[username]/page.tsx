export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { tmdbImageUrl, getBadgeColor, tieredCombinedScore } from "@/lib/utils";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — TerrorMeter` };
}

function timeAgo(date: string) {
  const mins = Math.round((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function formatMonthYear(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const ALL_BADGES = [
  { id: "first_blood", emoji: "🩸", label: "First Blood", desc: "Left first comment" },
  { id: "slasher_scholar", emoji: "🔪", label: "Slasher Scholar", desc: "Rated 25+ slashers" },
  { id: "dookie_detector", emoji: "🗑️", label: "Schlock Detector", desc: "Scored 10+ films under 30" },
  { id: "certified_spooky", emoji: "✨", label: "Certified Terror", desc: "Scored 10+ films over 90" },
  { id: "crypt_keeper", emoji: "☠️", label: "Crypt Keeper", desc: "Rated 100+ titles" },
  { id: "true_horror_fan", emoji: "🕰️", label: "True Horror Fan", desc: "Rated across 4+ decades" },
  { id: "hidden_gem_hunter", emoji: "💎", label: "Hidden Gem Hunter", desc: "Found 10+ cult classics" },
  { id: "debate_champion", emoji: "🗣️", label: "Debate Champion", desc: "Joined 10+ debates" },
];

type RatingRow = {
  id: string;
  score: number;
  created_at: string;
  titles: {
    id: string;
    title: string;
    poster_path: string | null;
    release_year: number | null;
    critic_score: number;
    media_type: string;
    subgenres: string[] | null;
  } | null;
};

type CommentRow = {
  id: string;
  content: string;
  upvote_count: number;
  created_at: string;
  titles: {
    id: string;
    title: string;
    media_type: string;
  } | null;
};

type WatchlistRow = {
  id: string;
  title_id: string;
  watched: boolean;
  watched_at: string | null;
  created_at: string;
  title?: {
    id: string;
    title: string;
    poster_path: string | null;
    release_year: number | null;
    critic_score: number;
    rating_avg: number;
    rating_count: number;
    media_type: string;
  };
};

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const sp = await searchParams;

  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (!profile) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  const currentTab = sp.tab ?? "ratings";
  const sortParam = sp.sort ?? "date";

  // Parallel data fetches
  // Ratings use adminDb so RLS cannot block public profile reads.
  const [ratingsRes, commentsRes, debateRes] = await Promise.all([
    adminDb()
      .from("ratings")
      .select("id,score,created_at,titles!inner(id,title,poster_path,release_year,critic_score,media_type,subgenres)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id,content,upvote_count,created_at,titles(id,title,media_type)")
      .eq("user_id", profile.id)
      .is("parent_id", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("debate_replies")
      .select("thread_id", { count: "exact", head: true })
      .eq("user_id", profile.id),
  ]);

  const ratings = (ratingsRes.data ?? []) as unknown as RatingRow[];
  const comments = (commentsRes.data ?? []) as unknown as CommentRow[];
  const debateCount = debateRes.count ?? 0;

  let watchlistRows: WatchlistRow[] = [];
  if (isOwner) {
    const { data: wRows } = await supabase
      .from("watchlist")
      .select("id,title_id,watched,watched_at,created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    const wTitleIds = (wRows ?? []).map((w: { title_id: string }) => w.title_id);
    if (wTitleIds.length > 0) {
      const { data: wTitles } = await supabase
        .from("titles")
        .select("id,title,poster_path,release_year,critic_score,rating_avg,rating_count,media_type")
        .in("id", wTitleIds);
      const wTitleMap = Object.fromEntries((wTitles ?? []).map((t) => [t.id, t]));
      watchlistRows = (wRows ?? []).map((w: WatchlistRow) => ({
        ...w,
        title: wTitleMap[w.title_id] as WatchlistRow["title"],
      }));
    }
  }

  // Stats
  const totalRatings = ratings.length;
  const avgScore =
    totalRatings > 0
      ? Math.round(ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings)
      : null;

  // Top genre
  const genreCounts: Record<string, number> = {};
  for (const r of ratings) {
    for (const sg of r.titles?.subgenres ?? []) {
      genreCounts[sg] = (genreCounts[sg] ?? 0) + 1;
    }
  }
  const topGenre =
    Object.keys(genreCounts).length > 0
      ? Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0][0]
      : null;

  // Personality tag
  let personalityTag = "Horror Curious";
  if (totalRatings >= 100) personalityTag = "Crypt Master";
  else if (totalRatings >= 50) personalityTag = "Horror Veteran";
  else if (totalRatings >= 20) personalityTag = "Genre Enthusiast";
  else if (totalRatings >= 5) personalityTag = "Aspiring Screamer";

  if (avgScore != null) {
    if (avgScore < 30) personalityTag = "Schlock Connoisseur";
    else if (avgScore > 85) personalityTag = "Terror Purist";
  }

  // Badge calculations
  const slasherCount = ratings.filter((r) =>
    (r.titles?.subgenres ?? []).includes("Slasher")
  ).length;
  const dookieCount = ratings.filter((r) => r.score < 30).length;
  const spookyCount = ratings.filter((r) => r.score > 90).length;
  const decadesSet = new Set(
    ratings
      .filter((r) => r.titles?.release_year)
      .map((r) => Math.floor((r.titles!.release_year as number) / 10) * 10)
  );
  const cultCount = ratings.filter((r) =>
    (r.titles?.subgenres ?? []).includes("Cult Classic")
  ).length;

  const earned = new Set<string>();
  if (comments.length > 0) earned.add("first_blood");
  if (slasherCount >= 25) earned.add("slasher_scholar");
  if (dookieCount >= 10) earned.add("dookie_detector");
  if (spookyCount >= 10) earned.add("certified_spooky");
  if (totalRatings >= 100) earned.add("crypt_keeper");
  if (decadesSet.size >= 4) earned.add("true_horror_fan");
  if (cultCount >= 10) earned.add("hidden_gem_hunter");
  if (debateCount >= 10) earned.add("debate_champion");

  // Sort ratings
  const sortedRatings = [...ratings].sort((a, b) => {
    if (sortParam === "score") return b.score - a.score;
    if (sortParam === "title") return (a.titles?.title ?? "").localeCompare(b.titles?.title ?? "");
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const ratingSortLinks = [
    { label: "Date Rated", value: "date" },
    { label: "Score", value: "score" },
    { label: "Title A-Z", value: "title" },
  ];

  const tabs = isOwner
    ? ["ratings", "reviews", "watchlist"]
    : ["ratings", "reviews"];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header */}
      <div className="flex items-start gap-6 mb-8">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shrink-0"
          style={{ backgroundColor: (profile as { avatar_bg?: string }).avatar_bg ?? "#0a0a0f" }}
        >
          {(profile as { avatar_emoji?: string }).avatar_emoji ?? "💀"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-ghost">{profile.username}</h1>
              <p className="text-muted text-sm">
                Member since {formatMonthYear(profile.created_at)}
              </p>
              <span className="inline-block mt-1 px-3 py-1 bg-purple-deep text-specter text-xs rounded-full">
                {personalityTag}
              </span>
            </div>
            {isOwner && (
              <Link
                href="/settings"
                className="text-sm text-muted hover:text-specter border border-shadow hover:border-purple-mid px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                Settings
              </Link>
            )}
          </div>
          <div className="flex gap-6 mt-3 text-sm flex-wrap">
            <span>
              <strong className="text-ghost">{totalRatings}</strong>{" "}
              <span className="text-muted">Ratings</span>
            </span>
            <span>
              <strong className="text-ghost">{avgScore ?? "—"}</strong>{" "}
              <span className="text-muted">Avg Score</span>
            </span>
            <span>
              <span className="text-muted">Top Genre:</span>{" "}
              <strong className="text-ghost">{topGenre ?? "—"}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-shadow">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/profile/${username}?tab=${tab}`}
            className={`font-score px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${
              currentTab === tab
                ? "border-green-spooky text-green-spooky"
                : "border-transparent text-muted hover:text-ghost"
            }`}
          >
            {tab}
          </Link>
        ))}
      </div>

      {/* Ratings Tab */}
      {currentTab === "ratings" && (
        <div>
          {ratings.length > 0 && (
            <div className="flex gap-2 mb-6">
              {ratingSortLinks.map((s) => (
                <Link
                  key={s.value}
                  href={`/profile/${username}?tab=ratings&sort=${s.value}`}
                  className={`font-label px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    sortParam === s.value
                      ? "bg-green-spooky text-void"
                      : "bg-tomb text-specter border border-shadow hover:border-purple-mid hover:text-ghost"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}

          {sortedRatings.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-muted">No ratings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {sortedRatings.map((r) => {
                if (!r.titles) return null;
                const posterUrl = tmdbImageUrl(r.titles.poster_path, "w185");
                const badgeColor = getBadgeColor(r.score);
                return (
                  <Link
                    key={r.id}
                    href={`/${r.titles.media_type === "movie" ? "movies" : "tv"}/${r.titles.id}`}
                  >
                    <div className="relative aspect-[2/3] bg-shadow rounded-lg overflow-hidden">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={r.titles.title}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">💀</div>
                      )}
                      <div
                        className="font-score absolute top-2 right-2 px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ backgroundColor: badgeColor, color: "#ffffff" }}
                      >
                        {r.score}
                      </div>
                    </div>
                    <p className="text-xs text-ghost mt-1 truncate">{r.titles.title}</p>
                    {r.titles.release_year && (
                      <p className="text-xs text-muted">{r.titles.release_year}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {currentTab === "reviews" && (
        <div>
          {comments.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-muted">No reviews yet</p>
            </div>
          ) : (
            <div className="divide-y divide-shadow">
              {comments.map((c) => (
                <div key={c.id} className="py-4">
                  <div className="flex items-center justify-between mb-1">
                    {c.titles ? (
                      <Link
                        href={`/${c.titles.media_type === "movie" ? "movies" : "tv"}/${c.titles.id}`}
                        className="text-sm font-medium text-green-spooky hover:underline"
                      >
                        {c.titles.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-medium text-muted">Unknown title</span>
                    )}
                    <span className="text-xs text-muted">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-specter line-clamp-3">{c.content}</p>
                  <p className="text-xs text-muted mt-1">♥ {c.upvote_count}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Watchlist Tab (owner only) */}
      {currentTab === "watchlist" && isOwner && (
        <div>
          {watchlistRows.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-display text-2xl text-muted">Watchlist is empty</p>
              <Link href="/watchlist" className="text-sm text-green-spooky hover:underline mt-2 block">
                Go to My Watchlist
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlistRows.map((w) => {
                if (!w.title) return null;
                const posterUrl = tmdbImageUrl(w.title.poster_path, "w185");
                const combinedScore = Math.round(tieredCombinedScore(w.title.critic_score, w.title.rating_avg, w.title.rating_count));
                const badgeColorW = getBadgeColor(combinedScore);
                const titleHref = `/${w.title.media_type === "movie" ? "movies" : "tv"}/${w.title.id}`;
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3 bg-tomb border border-shadow rounded-lg hover:border-purple-mid transition-colors"
                  >
                    <Link href={titleHref} className="shrink-0">
                      <div className="relative w-10 h-[60px] rounded overflow-hidden bg-shadow">
                        {posterUrl ? (
                          <img src={posterUrl} alt={w.title.title} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">💀</div>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={titleHref} className="text-sm font-medium text-ghost hover:text-green-spooky transition-colors truncate block">
                        {w.title.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        {w.title.release_year && <span className="text-xs text-muted">{w.title.release_year}</span>}
                        <span className="font-score text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: badgeColorW, color: "#ffffff" }}>
                          {Math.round(combinedScore)}
                        </span>
                        {w.watched && (
                          <span className="text-xs text-green-spooky">✓ Watched</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Badges */}
      <section className="mt-10 pt-8 border-t border-shadow">
        <h2 className="font-display text-2xl text-ghost mb-4">Badges</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ALL_BADGES.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-lg border text-center ${
                earned.has(badge.id)
                  ? "bg-tomb border-purple-mid"
                  : "bg-tomb/40 border-shadow/40 opacity-40"
              }`}
            >
              <div className="text-2xl mb-1">{badge.emoji}</div>
              <div className="font-verdict text-xs font-medium text-ghost">{badge.label}</div>
              <div className="text-xs text-muted mt-0.5">{badge.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
