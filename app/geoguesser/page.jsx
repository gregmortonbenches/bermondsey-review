import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import GeoguesserGame from "@/components/GeoguesserGame";
import { createClient } from "@/lib/supabase/public";
import { getCurrentRound } from "@/lib/geoguesser";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

export const metadata = {
  title: "Bermy on the Map, SE1 — The Bermondsey Review",
};

export default async function GeoGuesserPage() {
  let round = null;
  let copy = DEFAULT_SITE_SETTINGS.page_copy.geoguesser;
  try {
    const supabase = await createClient();
    const [currentRound, settings] = await Promise.all([
      getCurrentRound(supabase),
      getSiteSettingsSafe(supabase),
    ]);
    round = currentRound;
    copy = settings.page_copy?.geoguesser || copy;
  } catch {
    round = null;
  }

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path="/geoguesser" />
      <Masthead />
      {/* w-full: a direct flex-col child with mx-auto shrink-to-fits its
          content instead of filling the available width without this —
          see the matching comment in components/HomePageBody.jsx. */}
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink">{copy.title}</h1>
        <p className="font-body text-steel mt-2 mb-8">{copy.description}</p>

        {round ? (
          // Only the fields the game actually needs — never
          // correct_lat/correct_lng, which stay server-side and get
          // resolved by the scoring API route instead. See
          // app/api/geoguesser/guess/route.js.
          <GeoguesserGame
            round={{
              id: round.id,
              photo_url: round.photo_url,
              photo_alt: round.photo_alt,
              hint: round.hint,
            }}
          />
        ) : (
          <p className="font-body text-steel py-8 text-center border-t border-steel/20">
            No round published yet — check back soon.
          </p>
        )}
      </div>
      <Footer />
    </main>
  );
}
