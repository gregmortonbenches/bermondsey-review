import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";

// Next's fallback for any unmatched URL, or an explicit notFound() call
// (a bad article/page/form slug — see app/article/[slug], app/[slug],
// app/forms/[slug]). Keeps the real masthead/footer/theme rather than
// Next's bare default, so a broken link still looks like the paper
// rather than an error screen — same "true canvas" reasoning as the
// admin's editing surfaces, just for the one page nobody designs on
// purpose.
export default function NotFound() {
  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead />
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-20 sm:py-28 flex-1 w-full text-center">
        <p className="font-display font-700 text-river text-sm uppercase tracking-[0.15em] mb-3">
          Page not found
        </p>
        <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink">
          That page has gone missing.
        </h1>
        <p className="font-body text-lg text-steel mt-4 max-w-md mx-auto">
          The link might be old, or the page may have moved. Try the front page, or The Latest
          for everything we've published.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            className="font-sans text-sm font-600 bg-brick text-paper px-5 py-2.5 rounded-sm hover:bg-ink transition-colors"
          >
            Back to the front page
          </Link>
          <Link
            href="/latest"
            className="font-sans text-sm font-600 text-ink border border-steel/30 px-5 py-2.5 rounded-sm hover:bg-steel/[0.08] transition-colors"
          >
            Browse The Latest
          </Link>
        </div>
      </div>
      <Footer />
    </main>
  );
}
