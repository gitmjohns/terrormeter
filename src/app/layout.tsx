import type { Metadata } from "next";
import { Creepster, Alfa_Slab_One, Oswald, Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

const creepster = Creepster({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-creepster",
});

const alfaSlabOne = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-alfa-slab-one",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TerrorMeter — Horror Reviews",
  description:
    "Rate horror movies and TV shows from Terrible to Terrifying.",
  openGraph: {
    title: "TerrorMeter",
    description: "Rate horror films and TV shows from Terrible to Terrifying.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${creepster.variable} ${alfaSlabOne.variable} ${oswald.variable} ${inter.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-void text-ghost antialiased">
        <Navigation />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-shadow py-8 text-center text-muted text-sm">
          <p>
            &copy; {new Date().getFullYear()} TerrorMeter &mdash; The best slasher, supernatural, and creature horror from 1968 to present.
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted/70">
            <Link href="/privacy" className="hover:text-muted transition-colors">Privacy Policy</Link>
            <span className="text-muted/30">&bull;</span>
            <Link href="/terms" className="hover:text-muted transition-colors">Terms of Service</Link>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <a
              href="https://www.themoviedb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="opacity-70 hover:opacity-100 transition-opacity"
              title="The Movie Database"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/tmdb-logo.svg" alt="TMDB" width={80} height={11} />
            </a>
            <p className="text-xs text-muted/60 max-w-sm">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
