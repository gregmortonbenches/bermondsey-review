import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import { blockStyleClasses } from "@/lib/blockStyle";
import { carouselWidthVars } from "@/lib/carouselLayout";
import RankedListBlock from "./RankedListBlock";

// Paragraph blocks store raw HTML captured from the admin's contentEditable
// canvas (see components/admin/BlockEditor.jsx) — but "captured" isn't
// "written": RLS lets any authenticated contributor save a draft's body
// directly via the Supabase client, bypassing that editor's
// execCommand-only surface entirely, and this same HTML is what an
// admin's browser executes when previewing the draft before publishing.
// So this is sanitized right here, at the one place it's turned into
// markup for a browser — not just trusted because it came from "the
// editor."
const ALLOWED_TAGS = ["strong", "em", "a", "b", "i", "br"];
function sanitizeBlockHtml(html) {
  return sanitizeHtml(html || "", { allowedTags: ALLOWED_TAGS, allowedAttributes: { a: ["href", "target", "rel"] } });
}

// Button blocks store a plain URL string, not markup, but it still comes
// from the same not-fully-trusted body — reject anything that isn't a
// relative link or a plain http(s) URL so a "javascript:" href can't ride
// along into the rendered <a>.
function sanitizeHref(url) {
  if (!url) return "#";
  if (url.startsWith("/") || url.startsWith("#")) return url;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? url : "#";
  } catch {
    return "#";
  }
}

// Embed blocks are the one place this app deliberately renders more than
// plain formatting — that's the whole point of an embed block — but the
// same not-fully-trusted-body reasoning above applies even more here, so
// this is NOT "paste any HTML/script": scripts and inline event handlers
// are never allowed (that's the actual XSS vector — an embed provider
// doesn't need script execution for a plain iframe embed), and any
// <iframe> whose src isn't one of a handful of known embed providers is
// dropped entirely, so an attacker-controlled iframe can't be used for
// phishing/clickjacking either. This covers the realistic majority case
// (YouTube/Vimeo/Maps/Spotify/SoundCloud's own plain-iframe embed codes)
// at the cost of script-hydrated embeds (e.g. Twitter's default snippet)
// falling back to a plain link instead of the rich version.
const EMBED_IFRAME_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "open.spotify.com",
  "w.soundcloud.com",
  "www.google.com",
  "maps.google.com",
  "platform.twitter.com",
  "www.instagram.com",
];
const EMBED_ALLOWED_TAGS = ["iframe", "blockquote", "p", "a", "br"];
function sanitizeEmbedHtml(html) {
  return sanitizeHtml(html || "", {
    allowedTags: EMBED_ALLOWED_TAGS,
    allowedAttributes: {
      iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "scrolling", "title"],
      a: ["href", "target", "rel"],
    },
    // sanitize-html's `allowedIframeHostnames` only strips the offending
    // `src` attribute, leaving an empty <iframe></iframe> behind —
    // exclusiveFilter drops the whole element instead, matching what the
    // old DOMPurify hook did (node.remove()).
    exclusiveFilter(frame) {
      if (frame.tag !== "iframe") return false;
      let host = "";
      try {
        host = new URL(frame.attribs.src || "", "https://example.com").hostname;
      } catch {
        host = "";
      }
      return !EMBED_IFRAME_HOSTS.includes(host);
    },
  });
}

// A generic "paste raw HTML" block — added as a quicker stopgap than
// fighting the ranked-list block's bulk-paste parser through Word/Google
// Docs' own copy-as-HTML output (heavy inline mso-* styling, empty
// <o:p> tags, arbitrary div/span wrapping — none of it plain tab-
// separated text, which is what that parser actually expects). Scoped
// to table/list/basic-formatting markup, not "any HTML" — wide enough
// to cover a pasted table (the actual case this exists for) or a list,
// narrow enough that nothing here can carry a script, an inline event
// handler, or a style/class attribute that would fight the site's own
// typography. Every attribute except <a>'s href/target/rel and <td>/
// <th>'s colspan/rowspan (structural, not styling) is stripped — sanitize-
// html's default behaviour for a disallowed tag is to unwrap it (drop
// the tag, keep its text/children) rather than delete the content too,
// so Word's own div/span/o:p wrapper soup collapses down to plain
// table structure instead of losing any of the actual pasted content.
const HTML_BLOCK_ALLOWED_TAGS = [
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "p", "br", "strong", "em", "b", "i", "u", "ul", "ol", "li", "a", "h3", "h4",
];
// Both exported so the admin editor's own HtmlField (BlockEditor.jsx) can
// show a live preview using the exact sanitizer output and styling a
// reader would actually get, not a guess at what survived — same "true
// visual canvas" reasoning as reusing RankedListBlock directly for that
// block's own preview.
export function sanitizeGenericHtml(html) {
  return sanitizeHtml(html || "", {
    allowedTags: HTML_BLOCK_ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
  });
}

// Baseline styling for whatever table/list/paragraph structure survives
// sanitization — pasted HTML never carries its own usable styles by the
// time it gets here (every inline style/class attribute was stripped on
// purpose), so without this a pasted table would render as an unstyled
// browser default: no borders, no spacing, default serif.
export const HTML_BLOCK_CLASS =
  "overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:font-sans [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-[0.08em] [&_th]:font-600 [&_th]:text-steel [&_th]:border-b [&_th]:border-steel/25 [&_th]:py-2 [&_th]:pr-4 [&_th]:whitespace-nowrap [&_td]:font-body [&_td]:text-sm [&_td]:text-ink [&_td]:border-b [&_td]:border-steel/10 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top [&_p]:font-body [&_p]:text-ink [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-5 [&_a]:underline [&_a]:underline-offset-2";

const SPACER_HEIGHTS = { small: "h-6", medium: "h-12", large: "h-24" };

// Returns the actual per-type markup for one block, unkeyed — the caller
// wraps it in a keyed container that carries the block's optional
// background/padding/alignment style (see blockStyleClasses in
// lib/blockStyle.js). Returns null for blocks with nothing to show (an
// empty video URL, an empty embed, a carousel with no images yet), so the
// caller can skip rendering a wrapper for them too.
function renderBlockBody(block, i, list, accentHex) {
  if (block.type === "paragraph") {
    const isFirst = i === 0 || list.slice(0, i).every((b) => b.type !== "paragraph");
    return (
      <p
        // Two font-size arbitrary values, not one — base (mobile) reads
        // --article-font-size-mobile, sm: (640px+) switches to
        // --article-font-size-desktop, matching the breakpoint the rest
        // of the site already treats as the mobile/desktop line. Two
        // separate custom properties rather than one JS-computed value,
        // because CSS's own media query is what decides which applies —
        // ArticleSidebar.jsx's text-size control always writes both
        // properties together, unconditionally, so it never needs to
        // know or react to the current viewport width itself; resizing
        // the window just changes which property the browser was
        // already reading. Fallbacks (1.1875rem mobile / 1.125rem
        // desktop) are "medium" at each width — a page with no
        // ArticleSidebar mounted (any admin preview, or a page type
        // that doesn't render one) still gets mobile's own slightly
        // larger default, not desktop's.
        //
        // Neither variable is the plain text-lg utility this used to be
        // — quotes/headings/captions stay their own fixed sizes on
        // purpose, same "only the bulk reading content resizes" scoping
        // most reading-mode controls use.
        className={`font-body text-[length:var(--article-font-size-mobile,1.1875rem)] sm:text-[length:var(--article-font-size-desktop,1.125rem)] leading-relaxed text-ink [&_a]:underline [&_a]:underline-offset-2 ${
          isFirst ? "drop-cap" : ""
        }`}
        style={isFirst ? { "--drop-cap-color": accentHex } : undefined}
        dangerouslySetInnerHTML={{ __html: sanitizeBlockHtml(block.text) }}
      />
    );
  }
  if (block.type === "image" && block.url) {
    return (
      <div className="relative w-full aspect-[3/2] overflow-hidden">
        <Image src={block.url} alt={block.alt || ""} fill sizes="(max-width: 780px) 100vw, 780px" className="object-cover" />
      </div>
    );
  }
  if (block.type === "heading") {
    return <h2 className="font-display font-700 text-2xl sm:text-3xl text-ink pt-4">{block.text}</h2>;
  }
  if (block.type === "quote") {
    return (
      <blockquote className="border-l-4 pl-5 py-1" style={{ borderColor: accentHex }}>
        <p className="font-display italic text-xl sm:text-2xl text-ink leading-snug">{block.text}</p>
        {block.attribution && (
          <cite className="block font-sans text-sm text-steel mt-2 not-italic">— {block.attribution}</cite>
        )}
      </blockquote>
    );
  }
  if (block.type === "divider") {
    return <hr className="border-steel/25 my-4" />;
  }
  if (block.type === "button") {
    return (
      <div>
        <a
          href={sanitizeHref(block.url)}
          className="inline-block font-sans text-sm font-600 text-paper px-5 py-2.5 hover:bg-ink transition-colors"
          style={{ backgroundColor: accentHex }}
        >
          {block.label || "Learn more"}
        </a>
      </div>
    );
  }
  if (block.type === "spacer") {
    return <div className={SPACER_HEIGHTS[block.size] || SPACER_HEIGHTS.medium} aria-hidden="true" />;
  }
  if (block.type === "video") {
    const embedUrl = getYouTubeEmbedUrl(block.url);
    if (!embedUrl) return null;
    return (
      <div className="aspect-video overflow-hidden bg-ink/5">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (block.type === "hero-carousel") {
    const images = (block.images || []).filter((img) => img.url);
    if (images.length === 0) return null;
    const widthVars = carouselWidthVars(block.mobileCount, block.desktopCount, {
      defaultMobile: "85%",
      defaultDesktop: "70%",
    });
    return (
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:thin]"
        style={widthVars || undefined}
      >
        {images.map((img, j) => (
          <div
            key={j}
            className={`relative shrink-0 aspect-video snap-start overflow-hidden ${
              widthVars ? "w-[var(--carousel-item-w-mobile)] sm:w-[var(--carousel-item-w-desktop)]" : "w-[85%] sm:w-[70%]"
            }`}
          >
            <Image src={img.url} alt={img.alt || ""} fill sizes="(max-width: 780px) 85vw, 546px" className="object-cover" />
          </div>
        ))}
      </div>
    );
  }
  if (block.type === "embed") {
    if (!block.html) return null;
    return (
      <div
        className="[&_iframe]:w-full [&_iframe]:aspect-video"
        dangerouslySetInnerHTML={{ __html: sanitizeEmbedHtml(block.html) }}
      />
    );
  }
  if (block.type === "html") {
    if (!block.html) return null;
    return <div className={HTML_BLOCK_CLASS} dangerouslySetInnerHTML={{ __html: sanitizeGenericHtml(block.html) }} />;
  }
  if (block.type === "ranked-list") {
    if (!block.rows || block.rows.length === 0) return null;
    return (
      <RankedListBlock
        title={block.title}
        rows={block.rows}
        totalResponses={block.totalResponses || 0}
        accentHex={accentHex}
      />
    );
  }
  if (block.type === "columns") {
    const columns = block.columns && block.columns.length === 2 ? block.columns : [[], []];
    if (columns.every((col) => col.length === 0)) return null;
    // Recurses into the same component for each column's own block list —
    // a column is just another blocks array, same shape as posts.body/
    // pages.body itself, so it gets the exact same rendering (and the
    // exact same sanitization) rather than a parallel implementation.
    return (
      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
        {columns.map((colBlocks, i) => (
          <BlockContent key={i} blocks={colBlocks} accentHex={accentHex} />
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Renders the shared block-array shape used by both posts.body and
 * pages.body: paragraph, image, heading, quote, divider, button, video,
 * spacer, hero-carousel, embed, ranked-list, html. See components/admin/BlockEditor.jsx for
 * how these are authored.
 *
 * `accentHex` drives the drop-cap letter, quote border, and button
 * background — pass the post's category colour, or a fixed default for
 * pages (which aren't categorised).
 */
export default function BlockContent({ blocks, accentHex, emptyText }) {
  const list = blocks || [];

  return (
    <div className="space-y-5">
      {list.length === 0 && emptyText && (
        <p className="font-body text-steel italic">{emptyText}</p>
      )}
      {list.map((block, i) => {
        const body = renderBlockBody(block, i, list, accentHex);
        if (body === null) return null;
        // blockStyleClasses itself skips background/padding/alignment for
        // spacer/divider (see UNSTYLABLE_BLOCK_TYPES in lib/blockStyle.js)
        // but still applies visibility — a divider or gap you only want
        // on mobile is a real case, unlike a background tint on one.
        return (
          <div key={i} className={blockStyleClasses(block.style, block.type)}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
