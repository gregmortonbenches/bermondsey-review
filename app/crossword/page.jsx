import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

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
    description: "A fortnightly crossword with a Bermondsey twist.",
  };
}

export default function CrosswordPage() {
  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead />
      {/* w-full: a direct flex-col child with mx-auto shrink-to-fits its
          content instead of filling the available width without this —
          see the matching comment in components/HomePageBody.jsx. */}
      <div id="main-content" className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center flex-1 w-full">
        <h1 className="font-display font-700 text-3xl text-ink">The Crossword</h1>
        <p className="font-body text-steel mt-3">
          Coming in phase 2, once the article system is live — see the tech plan's build order.
        </p>
      </div>
      <Footer />
    </main>
  );
}
