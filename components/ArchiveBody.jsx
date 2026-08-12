import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ArticleCard from "@/components/ArticleCard";
import ThemeVars from "@/components/ThemeVars";
import { createClient } from "@/lib/supabase/public";
import { getPublishedPosts } from "@/lib/posts";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

export const ARCHIVE_CATEGORIES = ["All", "Bermondsey", "Books", "Film", "Culture"];

// Shared between app/archive/page.jsx and the admin layout builder's
// preview frame (app/admin/layout/preview/archive-frame) — same
// reasoning as components/HomePageBody.jsx: one real render of the page,
// reused rather than a second, parallel implementation the preview
// could drift from. PageViewTracker deliberately stays out of this
// component and in the route itself, so a preview render never counts
// as a real visit.
export default async function ArchiveBody({ activeCategory = "All" }) {
  let posts = [];
  let copy = DEFAULT_SITE_SETTINGS.page_copy.archive;
  try {
    const supabase = await createClient();
    // Cartoons get their own homepage section (components/CartoonsSection.jsx)
    // rather than showing up in the archive list.
    const [allPosts, settings] = await Promise.all([
      getPublishedPosts(supabase),
      getSiteSettingsSafe(supabase),
    ]);
    posts = allPosts.filter((p) => p.type !== "cartoon");
    copy = settings.page_copy?.archive || copy;
  } catch {
    posts = [];
  }

  const filtered =
    activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);

  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead />
      {/* w-full: a direct flex-col child with mx-auto shrink-to-fits its
          content instead of filling the available width without this —
          see the matching comment in components/HomePageBody.jsx. */}
      <div id="main-content" className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8 flex-1 w-full">
        <h1 className="font-display font-700 text-3xl sm:text-4xl text-ink">{copy.title}</h1>

        <div className="flex flex-wrap gap-2 mt-6 mb-2">
          {ARCHIVE_CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={cat === "All" ? "/latest" : `/latest?category=${cat}`}
              className={`font-sans text-sm px-3 py-1.5 border transition-colors ${
                activeCategory === cat
                  ? "bg-ink text-paper border-ink"
                  : "border-steel/40 text-ink hover:border-brick"
              }`}
            >
              {cat}
            </a>
          ))}
        </div>

        <div>
          {filtered.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
          {filtered.length === 0 && (
            <p className="font-body text-steel py-8">Nothing filed under this section yet.</p>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
