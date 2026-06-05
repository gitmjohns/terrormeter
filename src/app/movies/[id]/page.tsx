export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TerrorMeter } from "@/components/TerrorMeter";
import { CommentSection } from "@/components/CommentSection";
import { ScrollReset } from "@/components/ScrollReset";
import { WatchlistButton } from "@/components/WatchlistButton";
import { TitleCard } from "@/components/TitleCard";
import { DebateThread } from "@/components/DebateThread";
import { SignInButton } from "@/components/SignInButton";
import { tmdbImageUrl, getRatingLabel, getBadgeColor, tieredCombinedScore } from "@/lib/utils";
import {
  getTitleById, getComments, getUserRating, getCurrentUser,
  getSimilarTitles, getWatchlistIds, getDebateThread, getDebateReplies,
  getDebateFollowStatus,
} from "@/lib/data";

interface PageProps { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const title = await getTitleById(id, "movie");
  if (!title) return { title: "Not Found" };
  return { title: `${title.title} — TerrorMeter`, description: title.overview ?? undefined };
}

export default async function MovieDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [title, user] = await Promise.all([getTitleById(id, "movie"), getCurrentUser()]);
  if (!title) notFound();

  const [comments, userRating, similar, watchlistIds, debateThread, profile] = await Promise.all([
    getComments(id, user?.id),
    getUserRating(id),
    getSimilarTitles(id, title.subgenres ?? [], title.critic_score, "movie", 8, title.release_year),
    user ? getWatchlistIds() : Promise.resolve(new Set<string>()),
    getDebateThread(id),
    user ? (async () => {
      const { createClient } = await import("@/lib/supabase/server");
      const s = await createClient();
      const { data } = await s.from("profiles").select("username,avatar_emoji,avatar_bg").eq("id", user.id).single();
      return data;
    })() : Promise.resolve(null),
  ]);

  const debateReplies = debateThread ? await getDebateReplies(debateThread.id) : [];
  const debateFollowing = user && debateThread ? await getDebateFollowStatus(debateThread.id) : false;

  const backdropUrl = tmdbImageUrl(title.backdrop_path, "w780");
  const posterUrl = tmdbImageUrl(title.poster_path, "w342");

  const hasRatings = title.rating_count > 0;
  const overallScore = Math.round(tieredCombinedScore(title.critic_score, title.rating_avg, title.rating_count));
  const overallBadgeColor = getBadgeColor(overallScore);
  const overallLabel = getRatingLabel(overallScore);
  const criticColor = getBadgeColor(title.critic_score);
  const fanColor = hasRatings ? getBadgeColor(title.rating_avg) : "#888888";

  return (
    <div>
      <ScrollReset />
      {backdropUrl && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative h-48 sm:h-64 lg:h-[350px] overflow-hidden rounded-2xl">
            <img
              src={backdropUrl}
              alt={title.title}
              className="w-full h-full object-cover object-center"
            />
            {/* bottom vignette — strongest, dissolves into page background */}
            <div className="absolute inset-x-0 bottom-0 h-4/5 bg-gradient-to-t from-[#080810] via-[#080810]/60 to-transparent" />
            {/* top vignette */}
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-[#080810]/60 to-transparent" />
            {/* left vignette */}
            <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#080810] to-transparent" />
            {/* right vignette */}
            <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-[#080810] to-transparent" />
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* ── TOP SECTION ── */}
        <div className="flex gap-4 sm:gap-6 -mt-14 relative z-10 mb-8 items-start">
          {posterUrl && (
            <div className="shrink-0 pt-16 sm:pt-16">
              <div className="w-28 sm:w-40 rounded-xl overflow-hidden border-2 border-shadow shadow-2xl shadow-void">
                <img src={posterUrl} alt={title.title} width={160} height={240} className="w-full" />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0 pt-16 sm:pt-16">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-purple-deep text-specter text-xs rounded uppercase tracking-wider">Movie</span>
                  {(title.subgenres ?? []).slice(0, 3).map((g) => (
                    <span key={g} className="px-2 py-0.5 bg-shadow text-muted text-xs rounded">{g}</span>
                  ))}
                </div>
                <h1 className="font-verdict text-4xl sm:text-5xl md:text-6xl text-ghost leading-tight">{title.title}</h1>
                {title.release_year && <p className="text-muted mt-1 text-sm">{title.release_year}</p>}
                {title.overview && <p className="text-specter text-sm mt-3 leading-relaxed">{title.overview}</p>}
                <div className="mt-3">
                  <WatchlistButton
                    titleId={id}
                    initialInList={watchlistIds.has(id)}
                    isLoggedIn={!!user}
                    size="md"
                  />
                </div>
              </div>

              {/* Score box — desktop only (mobile version is full-width below) */}
              <div className="hidden md:block md:w-52 shrink-0">
                <div className="bg-tomb border border-shadow rounded-2xl p-4 space-y-3">
                  <div className="text-center pb-3 border-b border-shadow">
                    <div className="text-xs text-muted uppercase tracking-wider mb-1">Overall Score</div>
                    <div className="font-verdict text-xl leading-tight" style={{ color: overallBadgeColor }}>{overallLabel}</div>
                    <div className="font-score text-5xl font-black leading-none mt-1" style={{ color: overallBadgeColor }}>
                      {overallScore}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase tracking-wider mb-0.5">Critic</div>
                      <div className="font-score text-xl font-bold" style={{ color: criticColor }}>
                        {title.critic_score}<span className="text-xs text-muted font-normal">/100</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted uppercase tracking-wider mb-0.5">
                        Fan{hasRatings ? ` (${title.rating_count})` : ""}
                      </div>
                      <div className="font-score text-xl font-bold" style={{ color: fanColor }}>
                        {hasRatings ? Math.round(title.rating_avg) : "—"}<span className="text-xs text-muted font-normal">/100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score box — mobile only, full width outside poster constraint */}
        <div className="md:hidden mb-8">
          <div className="bg-tomb border border-shadow rounded-2xl p-4 space-y-3">
            <div className="text-center pb-3 border-b border-shadow">
              <div className="text-xs text-muted uppercase tracking-wider mb-1">Overall Score</div>
              <div className="font-verdict text-xl leading-tight" style={{ color: overallBadgeColor }}>{overallLabel}</div>
              <div className="font-score text-5xl font-black leading-none mt-1" style={{ color: overallBadgeColor }}>
                {overallScore}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-0.5">Critic</div>
                <div className="font-score text-xl font-bold" style={{ color: criticColor }}>
                  {title.critic_score}<span className="text-xs text-muted font-normal">/100</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted uppercase tracking-wider mb-0.5">
                  Fan{hasRatings ? ` (${title.rating_count})` : ""}
                </div>
                <div className="font-score text-xl font-bold" style={{ color: fanColor }}>
                  {hasRatings ? Math.round(title.rating_avg) : "—"}<span className="text-xs text-muted font-normal">/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TERRORMETER ── */}
        <div className="mb-8 rounded-xl py-8 px-6" style={{ background: "#111111", border: "2px solid #333333" }}>
          {user ? (
            <TerrorMeter titleId={id} initialScore={userRating} />
          ) : (
            <div className="relative overflow-hidden rounded-xl">
              <TerrorMeter titleId={id} initialScore={null} disabled />
              <div className="absolute inset-0 backdrop-blur-[3px] bg-void/60 rounded-xl flex flex-col items-center justify-center gap-3">
                <svg className="w-8 h-8 text-ghost opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-ghost text-base font-medium">Sign in to cast your verdict</p>
                <SignInButton className="px-6 py-2 bg-purple-mid hover:bg-purple-light text-ghost text-sm font-medium rounded-xl transition-colors" />
              </div>
            </div>
          )}
        </div>

        {/* ── DEBATE THREAD ── */}
        {debateThread && (
          <div className="mb-8 rounded-xl py-8 px-6" style={{ background: "#111111", border: "2px solid #333333" }}>
            <DebateThread
              threadId={debateThread.id}
              prompt={debateThread.prompt}
              initialReplies={debateReplies as never[]}
              isLoggedIn={!!user}
              initialIsFollowing={debateFollowing}
              currentUsername={profile?.username}
              currentEmoji={profile?.avatar_emoji}
              currentAvatarBg={(profile as any)?.avatar_bg}
              currentUserId={user?.id}
            />
          </div>
        )}

        {/* ── COMMENTS ── */}
        <CommentSection titleId={id} initialComments={comments} isLoggedIn={!!user} currentUsername={profile?.username} currentEmoji={profile?.avatar_emoji} currentAvatarBg={(profile as any)?.avatar_bg} currentUserId={user?.id} />

        {/* ── YOU MAY ALSO LIKE ── */}
        {similar.length > 0 && (
          <section className="mt-12 pt-8 border-t border-shadow">
            <h2 className="font-display text-2xl text-ghost mb-5">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similar.slice(0, 6).map((t) => <TitleCard key={t.id} title={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
