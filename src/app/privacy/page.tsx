import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TerrorMeter",
};

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-green-spooky">{heading}</h2>
      <div className="text-ghost/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-green-spooky mb-3">Privacy Policy</h1>
        <p className="text-muted text-sm">Last updated: May 2026</p>
      </div>

      <div className="space-y-10">
        <Section heading="What We Collect">
          <p>
            When you create an account we collect your name and email address from your Google or
            Discord account, your chosen username and avatar, and the content you create on the site
            including ratings, reviews, and comments.
          </p>
        </Section>

        <Section heading="How We Use It">
          <p>
            We use your information to run your account, display your activity on the site, and send
            you notifications about your content. We do not sell your information to anyone.
          </p>
        </Section>

        <Section heading="What Others Can See">
          <p>
            Your profile, ratings, reviews, and comments are visible to other users by default. Your
            watchlist is private.
          </p>
        </Section>

        <Section heading="Third Party Services">
          <p>
            We use Supabase for database hosting, Vercel for website hosting, TMDB for movie and TV
            data, and Google and Discord for login. Each has their own privacy policy.
          </p>
        </Section>

        <Section heading="Your Data">
          <p>
            You can request access to, correction of, or deletion of your data at any time by
            contacting us. If you delete your account your data will be removed.
          </p>
        </Section>

        <Section heading="Cookies">
          <p>
            We use cookies to keep you logged in and remember your preferences. We do not use
            advertising or tracking cookies.
          </p>
        </Section>

      </div>
    </div>
  );
}
