import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRatingLabel(score: number): string {
  if (score >= 90) return "Truly Terrifying";
  if (score >= 75) return "Pretty Scary";
  if (score >= 60) return "Kinda Creepy";
  if (score >= 45) return "Meh-diocre";
  if (score >= 30) return "Kinda Bad";
  if (score >= 15) return "Pretty Awful";
  return "Truly Terrible";
}

export function getRatingColor(score: number): string {
  if (score >= 60) return "#ffffff";
  if (score >= 45) return "#d4a017";
  return "#cc0000";
}

export function getBadgeColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#d4a017";
  return "#cc0000";
}

// Tiered weighting: fan ratings gain influence as community engagement grows.
// Both criticScore and ratingAvg are on 0-100 scale; return value is 0-100.
// Always returns a whole number clamped to [0, 100].
export function tieredCombinedScore(criticScore: number, ratingAvg: number, ratingCount: number): number {
  // Zero fan ratings means no fan data at all — rating_avg=0 is a DB default,
  // not a real score. Return critic score unchanged.
  if (ratingCount === 0) return Math.max(0, Math.min(100, Math.round(criticScore)));
  const fanScore = ratingAvg;
  let raw: number;
  if (ratingCount < 10)  raw = criticScore * 0.95 + fanScore * 0.05;
  else if (ratingCount < 50)  raw = criticScore * 0.8  + fanScore * 0.2;
  else if (ratingCount < 100) raw = criticScore * 0.6  + fanScore * 0.4;
  else if (ratingCount < 500) raw = criticScore * 0.4  + fanScore * 0.6;
  else                        raw = criticScore * 0.2  + fanScore * 0.8;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function tmdbImageUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w342"
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
