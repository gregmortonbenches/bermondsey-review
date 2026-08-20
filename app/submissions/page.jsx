import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

// Placeholder address — swap for the Review's real inbox in /admin/site
// once there's somewhere to route it, or hardcode a different one here.
// Kept as a plain mailto rather than the /forms/[slug] system: a
// submission is an attachment and a pitch, not a handful of form
// fields, so email is the actual right tool here.
const SUBMISSIONS_EMAIL = "submissions@bermondseyreview.co.uk";

export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const copy = settings.page_copy?.submissions || DEFAULT_SITE_SETTINGS.page_copy.submissions;
  return {
    title: `${copy.title} — ${settings.site_title}`,
    description: copy.description,
  };
}

export default async function SubmissionsPage() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const copy = settings.page_copy?.submissions || DEFAULT_SITE_SETTINGS.page_copy.submissions;
  const mailHref = `mailto:${SUBMISSIONS_EMAIL}?subject=${encodeURIComponent("Submission for The Bermondsey Review of Books")}`;

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path="/submissions" />
      <Masthead />
      {/* max-w-content, same reading measure as an article body — this
          is prose meant to be read start to finish, not a listing or a
          tool, so it gets the same column width PostRenderer's body
          uses rather than the wider one archive/crossword reach for. */}
      <div id="main-content" className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink leading-tight">{copy.title}</h1>
        <p className="font-body italic text-lg text-ink/70 mt-4">{copy.description}</p>

        <div className="font-body text-ink space-y-6 mt-10 pt-10 border-t border-steel/20 [&_h2]:font-display [&_h2]:font-700 [&_h2]:text-xl [&_h2]:text-ink [&_h2]:pt-4">
          <h2>What we're looking for</h2>
          <p>
            Book reviews, essays, and the odd piece of local reporting — anything that would sit
            comfortably between our covers every fortnight. Cartoons too: one panel, one joke, a
            Bermondsey twist. We're not precious about length; a review can be 400 words or 2,000
            if it earns it.
          </p>

          <h2>Who from</h2>
          <p>
            Anyone. We print first-time writers as often as established ones, and we'd rather
            read something a bit rough that says something real than something polished that
            doesn't. You don't need to live in SE16 — you just need something worth saying about
            it, or about a book.
          </p>

          <h2>How to send it</h2>
          <p>
            Email it to us — a pasted draft or an attachment, either is fine. Include a one-line
            pitch at the top (what it is, roughly how long), your name as you'd like it to appear,
            and a way to reach you. No submission portal, no login: just an inbox someone actually
            reads.
          </p>

          <h2>What happens next</h2>
          <p>
            We read everything that comes in. If it's right for an upcoming issue we'll say so
            within a fortnight; if it isn't, we'll try to tell you that too rather than leave you
            wondering. First-publication rights only — whatever you send us stays yours.
          </p>
        </div>

        <a
          href={mailHref}
          className="inline-block font-sans text-sm font-600 text-paper bg-river hover:bg-river/90 transition-colors px-6 py-3 mt-10"
        >
          Email us a submission →
        </a>
      </div>
      <Footer />
    </main>
  );
}
