import Script from "next/script";
import { createClient } from "@/lib/supabase/public";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import NewsletterDrawer from "./NewsletterDrawer";

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
// every call site.
//
// Renders the drawer (NewsletterDrawer.jsx), not an in-page section —
// this used to be a static full-width band, shown only on the homepage
// (when enabled in the layout builder) and at the bottom of every
// article. Mounted once now, from Masthead.jsx itself, right next to the
// Subscribe button that opens it — so it's a fixed overlay present on
// every page with a masthead, not just the two places the static band
// used to live, and there's no separate on/off toggle for it any more
// (see lib/sections.js/lib/layout.js's git history): Subscribe was
// already unconditional chrome, not a reorderable homepage section, and
// the drawer it opens is exactly the same kind of thing now.
//
// The site tagline used to show under the wordmark in the masthead and
// again in the footer — shows here instead, as the one place it shows at
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
    <NewsletterDrawer tagline={settings.site_tagline}>
      <SupascribeEmbed />
    </NewsletterDrawer>
  );
}
