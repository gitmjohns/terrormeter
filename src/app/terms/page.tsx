import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TerrorMeter",
};

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-green-spooky">{heading}</h2>
      <div className="text-ghost/90 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="mb-10">
        <h1 className="font-display text-4xl sm:text-5xl text-green-spooky mb-3">Terms of Service</h1>
        <p className="text-muted text-sm">Last updated: May 2026</p>
      </div>

      <div className="space-y-10">
        <Section heading="Using the Site">
          <p>
            By using TerrorMeter you agree to these terms.
          </p>
        </Section>

        <Section heading="Your Account">
          <p>
            You are responsible for your account and all activity under it. Change your password
            immediately if you believe your account has been compromised.
          </p>
        </Section>

        <Section heading="Your Content">
          <p>
            You own the content you post. By posting you give us permission to display it on the
            site. You agree not to post content that is abusive, harassing, or illegal.
          </p>
        </Section>

        <Section heading="Rating Integrity">
          <p>
            Rate titles based on your genuine opinion. Creating multiple accounts to manipulate
            scores is prohibited and may result in account termination.
          </p>
        </Section>

        <Section heading="Moderation">
          <p>
            We reserve the right to remove content or suspend accounts that violate these terms.
          </p>
        </Section>

        <Section heading="Disclaimer">
          <p>
            TerrorMeter is provided as is. We do not guarantee the accuracy of movie or TV
            information on the site and are not liable for damages arising from use of the site.
          </p>
        </Section>

        <Section heading="Changes">
          <p>
            We may update these terms at any time. Continued use of the site means you accept any
            changes.
          </p>
        </Section>
      </div>
    </div>
  );
}
