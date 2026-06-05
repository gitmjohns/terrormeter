import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { fetchNewHorrorReleases, fetchMovieGenres } from "@/lib/tmdb";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split("T")[0];

  const [releases, genresList] = await Promise.all([
    fetchNewHorrorReleases(dateStr),
    fetchMovieGenres(),
  ]);

  const genreMap = Object.fromEntries(
    genresList.map((g) => [g.id, g.name])
  );

  const moviesPayload = releases.movies.map((m) => ({
    tmdb_id: m.id,
    media_type: "movie" as const,
    title: m.title,
    overview: m.overview || null,
    poster_path: m.poster_path,
    backdrop_path: m.backdrop_path,
    release_year: m.release_date
      ? parseInt(m.release_date.split("-")[0], 10)
      : null,
    genres: m.genre_ids.map((id) => genreMap[id]).filter(Boolean),
  }));

  const tvPayload = releases.tv.map((s) => ({
    tmdb_id: s.id,
    media_type: "tv" as const,
    title: s.name,
    overview: s.overview || null,
    poster_path: s.poster_path,
    backdrop_path: s.backdrop_path,
    release_year: s.first_air_date
      ? parseInt(s.first_air_date.split("-")[0], 10)
      : null,
    genres: s.genre_ids.map((id) => genreMap[id]).filter(Boolean),
  }));

  const allPayload = [...moviesPayload, ...tvPayload];

  if (allPayload.length === 0) {
    return NextResponse.json({
      success: true,
      imported: 0,
      date: dateStr,
    });
  }

  // Protect manually-edited overviews: if a title already has an overview in
  // the database, keep it rather than overwriting with TMDB's version.
  const { data: existingRows } = await supabase
    .from("titles")
    .select("tmdb_id, media_type, overview")
    .in("tmdb_id", allPayload.map((p) => p.tmdb_id));

  const existingOverviewMap = new Map(
    (existingRows ?? [])
      .filter((r) => r.overview)
      .map((r) => [`${r.tmdb_id}:${r.media_type}`, r.overview as string])
  );

  const protectedPayload = allPayload.map((item) => ({
    ...item,
    overview: existingOverviewMap.get(`${item.tmdb_id}:${item.media_type}`) ?? item.overview,
  }));

  const { error, count } = await supabase.from("titles").upsert(protectedPayload, {
    onConflict: "tmdb_id,media_type",
    ignoreDuplicates: false,
    count: "exact",
  });

  if (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    imported: count ?? allPayload.length,
    date: dateStr,
    breakdown: {
      movies: moviesPayload.length,
      tv: tvPayload.length,
    },
  });
}
