import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";
import PageViewTracker from "@/components/PageViewTracker";
import CrosswordGame from "@/components/CrosswordGame";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getCrosswordById } from "@/lib/crossword";

export async function generateMetadata({ params }) {
  const { id } = await params;
  let settings = DEFAULT_SITE_SETTINGS;
  let crossword = null;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
    crossword = await getCrosswordById(supabase, id);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const dateLabel = crossword
    ? new Date(crossword.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "Archive";
  return {
    title: `${dateLabel} crossword — ${settings.site_title}`,
    description: "A fortnightly crossword with an SE1 twist, from the archive.",
  };
}

export default async function CrosswordArchiveEntryPage({ params }) {
  const { id } = await params;
  let crossword = null;
  try {
    const supabase = await createClient();
    crossword = await getCrosswordById(supabase, id);
  } catch {
    crossword = null;
  }

  if (!crossword) notFound();

  const dateLabel = new Date(crossword.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <PageViewTracker path={`/crossword/archive/${id}`} />
      <Masthead />
      <div id="main-content" className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-10 flex-1 w-full">
        <Link href="/crossword/archive" className="font-sans text-sm text-steel hover:text-ink underline underline-offset-4">
          ← Crossword archive
        </Link>
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink mt-3 mb-1">{dateLabel} crossword</h1>
        <p className="font-body text-steel mb-8">A fortnightly crossword with an SE1 twist</p>

        <CrosswordGame crossword={crossword} />
      </div>
      <Footer />
    </main>
  );
}
