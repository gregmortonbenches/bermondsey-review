import Masthead from "@/components/Masthead";
import ArticleCard from "@/components/ArticleCard";
import PageViewTracker from "@/components/PageViewTracker";
import ThemeVars from "@/components/ThemeVars";
import { articles } from "@/lib/articles";

const CATEGORIES = ["All", "Bermondsey", "Books", "Film", "Culture", "Cartoon"];

// Reads ?category= from the URL so the pill filter below is a real link,
// not client-side state — keeps this page a plain server component for now.
export default function ArchivePage({ searchParams }) {
  const activeCategory = searchParams?.category || "All";
  const sorted = [...articles].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered =
    activeCategory === "All" ? sorted : sorted.filter((a) => a.category === activeCategory);

  return (
    <main className="bg-paper min-h-screen">
      <ThemeVars />
      <PageViewTracker path="/archive" />
      <Masthead />
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <h2 className="font-display font-700 text-3xl sm:text-4xl text-ink">Archive</h2>
        <p className="font-body text-steel mt-2">
          Every issue of the Review, newest first.
        </p>

        <div className="flex flex-wrap gap-2 mt-6 mb-2">
          {CATEGORIES.map((cat) => (
            <a
              key={cat}
              href={cat === "All" ? "/archive" : `/archive?category=${cat}`}
              className={`font-sans text-sm px-3 py-1.5 rounded-full border transition-colors ${
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
    </main>
  );
}
