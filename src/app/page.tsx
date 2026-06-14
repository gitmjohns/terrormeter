export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";
import { TitleCard } from "@/components/TitleCard";
import type { Title } from "@/lib/types";
import {
  getGoats, getCultClassics, getLatestSpooks,
  getSpookyComedies, getTopTV,
  getSubgenreSpotlightTitles, getFeaturedSubgenre,
  getWatchlistIds, getCurrentUser,
} from "@/lib/data";

// ─── Shared UI ────────────────────────────────────────────────────────────────

function SectionHeader({ title, sub, href }: { title: string; sub: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        <h2 className="font-display text-3xl text-ghost">{title}</h2>
        <p className="font-label font-light text-muted text-base mt-0.5">{sub}</p>
      </div>
      {href && (
        <Link href={href} className="text-sm font-bold text-green-spooky hover:underline shrink-0">
          View All →
        </Link>
      )}
    </div>
  );
}

interface RowProps { isLoggedIn: boolean; watchlistIds: Set<string> }

function TitleGrid({ titles, isLoggedIn, watchlistIds }: { titles: Title[] } & RowProps) {
  if (!titles.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {titles.map((t) => (
        <TitleCard key={t.id} title={t} inWatchlist={watchlistIds.has(t.id)} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-tomb border border-shadow animate-pulse">
          <div className="aspect-[2/3] bg-shadow rounded-t-lg" />
          <div className="p-3 space-y-2">
            <div className="h-3 bg-shadow rounded w-4/5" />
            <div className="h-3 bg-shadow rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionSkeleton() {
  return (
    <section className="py-10 border-t border-shadow">
      <div className="mb-5">
        <div className="h-8 w-56 bg-tomb rounded animate-pulse" />
        <div className="h-4 w-72 bg-tomb rounded animate-pulse mt-1" />
      </div>
      <GridSkeleton />
    </section>
  );
}

// ─── Row 1: Spooky G.O.A.T. ──────────────────────────────────────────────────

async function SpookyGoat({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getGoats(12);
  if (!titles.length) return null;
  return (
    <section className="pt-6 pb-10">
      <SectionHeader
        title="G.O.A.T. Terrors"
        sub="The greatest horror films ever made"
        href="/movies?sort=top-rated"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 2: Buried Terrors ─────────────────────────────────────────────────

async function CultClassics({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getCultClassics(6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Buried Terrors"
        sub="Overlooked, underseen, and worth every scream"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 3: Latest Spooks ─────────────────────────────────────────────────────

async function LatestSpooks({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getLatestSpooks(12); // 2 rows
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Latest Terrors"
        sub="New and recent horror releases"
        href="/movies?sort=newest"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 4: Spooky Comedies ───────────────────────────────────────────────────

async function SpookyComedies({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getSpookyComedies(6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Terrific Comedies"
        sub="Horror with a sense of humor"
        href="/movies?genre=Comedy+Horror"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 5: Subgenre Spotlight ────────────────────────────────────────────────

async function SubgenreSpotlight({ isLoggedIn, watchlistIds }: RowProps) {
  const spotlight = await getFeaturedSubgenre();
  const titles = await getSubgenreSpotlightTitles(spotlight.db, 6);
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title={`Weekly Terrors: ${spotlight.display}`}
        sub="Weekly rotating subgenre spotlight"
        href={`/movies?genre=${encodeURIComponent(spotlight.db)}`}
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Row 6: TV Serial Spooks ──────────────────────────────────────────────

async function TopHorrorTV({ isLoggedIn, watchlistIds }: RowProps) {
  const titles = await getTopTV(12); // 2 rows
  if (!titles.length) return null;
  return (
    <section className="py-10 border-t border-shadow">
      <SectionHeader
        title="Televised Terror"
        sub="Horror series, anthologies, and limited runs"
        href="/tv"
      />
      <TitleGrid titles={titles} isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} />
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [user, watchlistIds] = await Promise.all([getCurrentUser(), getWatchlistIds()]);
  const isLoggedIn = !!user;

  return (
    <div>
      {/* Hero */}
      <div className="relative w-full h-[23vw] min-h-[93px] max-h-[433px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-banner.jpg"
          alt="TerrorMeter"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: "center" }}
        />
        {/* Bottom vignette — fades from page bg to transparent */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none" style={{ background: "linear-gradient(to top, #0a0a0a 0%, #0a0a0a 5%, rgba(10,10,10,0.6) 35%, transparent 100%)" }} />
        {/* Title + subtitle — vertically and horizontally centered as a group */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
          <p className="hidden md:flex" style={{
            fontFamily: "var(--font-creepster)",
            color: "#ffffff",
            textShadow: "4px 4px 0px #000000",
            fontSize: "clamp(2.5rem, 9vw, 8rem)",
            lineHeight: 1,
            letterSpacing: "0.02em",
            alignItems: "flex-end",
          }}>
            <span style={{ position: "relative", top: "-9px" }}>TERROR</span>
            <span>METER</span>
          </p>
          <p className="md:ml-[8%]" style={{
            fontFamily: "var(--font-oswald)",
            fontWeight: 300,
            color: "#ffffff",
            fontSize: "clamp(0.72rem, 1.6vw, 1.2rem)",
            letterSpacing: "0.08em",
          }}>
            Discover horror. Rate from Terrible to Terrifying.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<SectionSkeleton />}><SpookyGoat isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><CultClassics isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><LatestSpooks isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><SpookyComedies isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><SubgenreSpotlight isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
        <Suspense fallback={<SectionSkeleton />}><TopHorrorTV isLoggedIn={isLoggedIn} watchlistIds={watchlistIds} /></Suspense>
      </div>
    </div>
  );
}
