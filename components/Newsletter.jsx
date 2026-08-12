import Script from "next/script";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";

// The actual subscribe form/button for embed 4462233900 — Supascribe's
// own script (loaded below) finds this div by its data attribute and
// replaces its contents with the real widget UI, styled from whatever's
// configured on their dashboard (currently a white card with a blue
// button, set there rather than here — this div itself carries no
// visual styling of its own, deliberately, since Supascribe owns that).
// Posts a subscriber's email to Supascribe's own API, which forwards it
// on to the linked Substack (thebermondseyreview.substack.com) — not a
// direct-to-Substack embed, so an email typed here does pass through
// Supascribe's servers first.
function SupascribeEmbed() {
  return (
    <div className="w-full sm:w-auto">
      <div data-supascribe-embed-id="4462233900" data-supascribe-subscribe />
      {/* lazyOnload: this is a below-the-fold sign-up widget, not
          above-the-fold content, so there's no reason for it to compete
          with anything on the critical rendering path — id lets Next
          dedupe it rather than re-inject the script if this component
          ever ends up rendered more than once in the same page load. */}
      <Script
        id="supascribe-loader"
        src="https://js.supascribe.com/v1/loader/Wi76rW1A7iR26BlzZ3R7LbwAzFt2.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

// Async, like Masthead/Footer — same settings fetch, same reasoning: one
// source of truth for the site's identity, not a prop threaded through
// every call site (HomePageBody, the admin layout canvas's sectionContent,
// the article page's own footer band).
//
// The site tagline used to show under the wordmark in the masthead and
// again in the footer — moved here instead, as the one place it shows at
// all, right where "sign up" is the actual point being made.
export default async function Newsletter() {
  let settings = DEFAULT_SITE_SETTINGS;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }

  return (
    <section id="newsletter" className="bg-river text-paper scroll-mt-24">
      <div className="max-w-wider mx-auto px-4 sm:px-6 lg:px-12 py-12 sm:py-16 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <h2 className="font-display font-700 text-2xl sm:text-3xl">
            Get the newsletter
          </h2>
          {settings.site_tagline && (
            <p className="font-sans text-xs tracking-[0.1em] uppercase text-paper/70 mt-2">
              {settings.site_tagline}
            </p>
          )}
        </div>
        <SupascribeEmbed />
      </div>
    </section>
  );
}
