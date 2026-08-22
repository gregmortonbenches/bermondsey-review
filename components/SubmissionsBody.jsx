import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

// Fixed titles, admin-editable answers — see lib/theme.js's own comment
// on why the four questions themselves aren't part of page_copy.
const SECTIONS = [
  ["What we're looking for", "whatWereLookingFor"],
  ["Who from", "whoFrom"],
  ["How to send it", "howToSend"],
  ["What happens next", "whatHappensNext"],
];

// A blank line is a paragraph break — the same plain-text convention
// every other multi-paragraph admin field in this codebase uses, rather
// than inventing a rich-text format for four short answers.
function paragraphs(text) {
  return (text || "").split(/\n\s*\n/).filter(Boolean);
}

// Shared between app/submissions/page.jsx and the admin layout
// builder's preview frame (app/admin/layout/preview/submissions-frame)
// — same reasoning as ArchiveBody.jsx: one real render, reused, rather
// than a second implementation the preview could drift from.
// PageViewTracker deliberately stays out of this component and in the
// route itself, so a preview render never counts as a real visit.
export default async function SubmissionsBody() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const copy = { ...DEFAULT_SITE_SETTINGS.page_copy.submissions, ...settings.page_copy?.submissions };
  const mailHref = `mailto:${copy.email}?subject=${encodeURIComponent("Submission for The Bermondsey Review of Books")}`;

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead />
      {/* max-w-content, same reading measure as an article body — this
          is prose meant to be read start to finish, not a listing or a
          tool, so it gets the same column width PostRenderer's body
          uses rather than the wider one archive/crossword reach for. */}
      <div id="main-content" className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink leading-tight">{copy.title}</h1>
        <p className="font-body italic text-lg text-ink/70 mt-4">{copy.description}</p>

        <div className="font-body text-ink space-y-6 mt-10 pt-10 border-t border-steel/20 [&_h2]:font-display [&_h2]:font-700 [&_h2]:text-xl [&_h2]:text-ink [&_h2]:pt-4">
          {SECTIONS.map(([heading, key]) => (
            <div key={key}>
              <h2>{heading}</h2>
              {paragraphs(copy[key]).map((p, i) => (
                <p key={i} className="mt-2 first:mt-0">
                  {p}
                </p>
              ))}
            </div>
          ))}
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
