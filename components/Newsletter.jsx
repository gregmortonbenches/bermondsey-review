export default function Newsletter() {
  return (
    <section id="newsletter" className="bg-river text-paper">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h2 className="font-display font-700 text-2xl sm:text-3xl">
            Get the next issue in your inbox
          </h2>
        </div>
        {/* Wired to Supabase + Resend in step 2 — for now this is a visual placeholder */}
        <form className="flex w-full sm:w-auto">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="font-sans text-sm px-4 py-3 w-full sm:w-64 rounded-l-sm text-ink bg-paper placeholder:text-steel focus-visible:outline-2 focus-visible:outline-brick"
          />
          <button
            type="submit"
            className="font-sans text-sm font-600 bg-brick text-paper px-5 py-3 rounded-r-sm hover:bg-paper hover:text-ink transition-colors whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
