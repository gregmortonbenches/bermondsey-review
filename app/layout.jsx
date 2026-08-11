import { Zilla_Slab, Source_Serif_4, Inter } from "next/font/google";
import "./globals.css";

const zilla = Zilla_Slab({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-zilla",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-source-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "The Bermondsey Review of Books",
  description:
    "A fortnightly, free publication about Bermondsey, London — plus books, film, and whatever else we're reading.",
};

// Without this, a statically-rendered page (the homepage, the archive,
// an already-known article/page slug — anything not forced dynamic by
// reading cookies()) is generated once at build/deploy time and served
// from that cache indefinitely: editing site settings, an existing
// post's content, or the homepage layout in the admin updates Supabase
// immediately, but nothing tells Next.js to regenerate the cached page,
// so none of it would show up on the live site until the next code
// deploy. Applies to every route by default (admin pages are already
// forced fully dynamic by lib/supabase/server.js's use of cookies(), so
// this doesn't change anything there — it only affects the routes that
// were silently stuck on last-deploy's data). 60s keeps most of static
// rendering's caching benefit while making the admin feel like it
// actually controls the live site.
export const revalidate = 60;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${zilla.variable} ${sourceSerif.variable} ${inter.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
