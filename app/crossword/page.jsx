import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import ThemeVars from "@/components/ThemeVars";

export default function CrosswordPage() {
  return (
    <main className="bg-paper min-h-screen flex flex-col">
      <ThemeVars />
      <Masthead />
      <div className="max-w-content mx-auto px-4 sm:px-6 lg:px-12 py-16 text-center flex-1">
        <h1 className="font-display font-700 text-3xl text-ink">The Crossword</h1>
        <p className="font-body text-steel mt-3">
          Coming in phase 2, once the article system is live — see the tech plan's build order.
        </p>
      </div>
      <Footer />
    </main>
  );
}
