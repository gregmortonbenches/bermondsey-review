import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSiteSettingsSafe, DEFAULT_SITE_SETTINGS } from "@/lib/theme";
import { getSiteNavLinks } from "@/lib/pages";

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4 L20 20 M4 4 L10.5 4 L20 20 L13.5 20 Z" />
      <path d="M4 20 L10.5 13" />
      <path d="M13.5 11 L20 4" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 21 V13 H18 L18.5 9.5 H15 V7.2 C15 6.1 15.3 5.3 16.9 5.3 H18.6 V2.1 C18.3 2.1 17.2 2 15.9 2 C13.1 2 11.2 3.7 11.2 6.8 V9.5 H8 V13 H11.2 V21 Z" />
    </svg>
  );
}

const SOCIAL_ICONS = { twitter: TwitterIcon, instagram: InstagramIcon, facebook: FacebookIcon };

// Site identity, nav, and socials all come from the same site_settings row
// Masthead reads (see /admin/site) — kept in sync automatically since
// there's one source of truth, not two places to update.
export default async function Footer() {
  let settings = DEFAULT_SITE_SETTINGS;
  let navLinks = DEFAULT_SITE_SETTINGS.nav_links;
  try {
    const supabase = await createClient();
    settings = await getSiteSettingsSafe(supabase);
    const baseLinks = settings.nav_links?.length ? settings.nav_links : DEFAULT_SITE_SETTINGS.nav_links;
    navLinks = await getSiteNavLinks(supabase, baseLinks);
  } catch {
    settings = DEFAULT_SITE_SETTINGS;
  }
  const socialLinks = Object.entries(settings.social_links || {}).filter(([, url]) => url);

  return (
    <footer className="bg-ink text-paper mt-auto">
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-10">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div>
            <p className="font-display font-700 text-xl">{settings.site_title}</p>
            {settings.site_tagline && (
              <p className="font-sans text-xs tracking-[0.1em] uppercase text-paper/60 mt-1">
                {settings.site_tagline}
              </p>
            )}
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="text-paper/80 hover:text-paper transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                if (!Icon) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={key}
                    className="text-paper/80 hover:text-paper transition-colors"
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {settings.footer_text && (
          <p className="font-sans text-sm text-paper/70 mt-8 pt-8 border-t border-paper/15">
            {settings.footer_text}
          </p>
        )}

        <p className="font-sans text-xs text-paper/50 mt-6">
          © {new Date().getFullYear()} {settings.site_title}
        </p>
      </div>
    </footer>
  );
}
