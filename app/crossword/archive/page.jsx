import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { listCrosswordsForArchive } from "@/lib/crossword";

export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  return {
    title: `Crossword archive — ${settings.site_title}`,
    description: "Every fortnightly crossword, playable any time.",
  };
}

export default async function CrosswordArchivePage() {
  let crosswords = [];
  try {
    const supabase = await createClient();
    crosswords = await listCrosswordsForArchive(supabase);
  } catch {
    crosswords = [];
  }

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path="/crossword/archive" />
      <Masthead />
      <div id="main-content" className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink mb-1">Crossword archive</h1>
        <p className="font-body text-steel mb-8">Every fortnightly crossword, playable any time.</p>

        {crosswords.length === 0 ? (
          <p className="font-body text-steel py-8 text-center border-t border-steel/20">
            No puzzles published yet — check back soon.
          </p>
        ) : (
          <div className="border-t border-steel/20">
            {crosswords.map((crossword, index) => (
              <Link
                key={crossword.id}
                href={`/crossword/archive/${crossword.id}`}
                className="flex items-center gap-4 py-4 border-b border-steel/20 hover:bg-river/[0.04] px-2 -mx-2 rounded-sm transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-700 text-ink">
                    {new Date(crossword.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="font-sans text-xs text-steel mt-1">
                    {crossword.grid_json?.rows || "?"}×{crossword.grid_json?.cols || "?"} grid
                  </p>
                </div>
                {index === 0 && (
                  <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-river bg-river/[0.1] rounded-full px-2.5 py-1 shrink-0">
                    Current
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
