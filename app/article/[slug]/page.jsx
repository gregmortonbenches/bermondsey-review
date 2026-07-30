import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import CoverArt from "@/components/CoverArt";
import Newsletter from "@/components/Newsletter";
import PageViewTracker from "@/components/PageViewTracker";
import ThemeVars from "@/components/ThemeVars";
import { articles, getArticleBySlug, categoryFamily } from "@/lib/articles";

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }) {
  const article = getArticleBySlug(params.slug);
  if (!article) return {};
  return { title: `${article.title} — The Bermondsey Review`, description: article.dek };
}

export default function ArticlePage({ params }) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();
  const accent = categoryFamily(article.category);
  const accentHex =
    accent === "brick" ? "var(--color-brick, #9C6B42)" : "var(--color-river, #2B4C73)";

  return (
    <main className="bg-paper min-h-screen">
      <ThemeVars />
      <PageViewTracker path={`/article/${article.slug}`} />
      <Masthead />

      <article className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <p className={`font-sans text-xs tracking-[0.14em] uppercase mb-3 ${accent === "brick" ? "text-brick" : "text-river"}`}>
          {article.category}
        </p>
        <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink leading-[1.05]">
          {article.title}
        </h1>
        <p className="font-body text-lg sm:text-xl text-steel mt-4">{article.dek}</p>
        <p className="font-sans text-sm text-steel mt-4">{article.author}</p>

        <CoverArt category={article.category} className="aspect-[16/9] mt-8 rounded-sm" />

        <div className="mt-10 space-y-5">
          {article.body.map((paragraph, i) => (
            <p
              key={i}
              className={`font-body text-lg leading-relaxed text-ink ${i === 0 ? "drop-cap" : ""}`}
              style={i === 0 ? { "--drop-cap-color": accentHex } : undefined}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <Newsletter />
    </main>
  );
}
