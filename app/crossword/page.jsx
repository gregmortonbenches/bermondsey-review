import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import CrosswordGame from "@/components/CrosswordGame";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getCurrentCrossword } from "@/lib/crossword";

export async function generateMetadata() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  return {
    title: `The Crossword — ${settings.site_title}`,
    description: "A fortnightly crossword with an SE1 twist",
  };
}

export default async function CrosswordPage() {
  let crossword = null;
  try {
    const supabase = await createClient();
    crossword = await getCurrentCrossword(supabase);
  } catch {
    crossword = null;
  }

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path="/crossword" />
      <Masthead />
      {/* max-w-wider, not the max-w-content most standalone pages use —
          this page's actual content is a grid plus a two-column clue
          list, not reading prose, so it wants the same wider column the
          homepage/footer already use rather than a reading-optimised
          line length. w-full for the same reason every other page here
          needs it — see the matching comment in HomePageBody.jsx. */}
      <div id="main-content" className="max-w-wider mx-auto px-4 sm:px-6 lg:px-12 py-10 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink mb-1">The crossword</h1>
        <p className="font-body text-steel mb-8">A fortnightly crossword with an SE1 twist</p>

        {crossword ? (
          <CrosswordGame crossword={crossword} />
        ) : (
          <p className="font-body text-steel py-8 text-center border-t border-steel/20">
            No puzzle published yet — check back soon.
          </p>
        )}

        <p className="mt-10 pt-6 border-t border-steel/20">
          <Link href="/crossword/archive" className="font-sans text-sm text-steel hover:text-river underline underline-offset-4">
            Play the archive of previous crosswords
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
