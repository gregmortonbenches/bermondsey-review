import Image from "next/image";
import DOMPurify from "isomorphic-dompurify";

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
  return DOMPurify.sanitize(html || "", { ALLOWED_TAGS, ALLOWED_ATTR: ["href", "target", "rel"] });
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

/**
 * Renders the shared block-array shape used by both posts.body and
 * pages.body: paragraph, image, heading, quote, divider, button. See
 * components/admin/BlockEditor.jsx for how these are authored.
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
        if (block.type === "paragraph") {
          const isFirst = i === 0 || list.slice(0, i).every((b) => b.type !== "paragraph");
          return (
            <p
              key={i}
              className={`font-body text-lg leading-relaxed text-ink [&_a]:underline [&_a]:underline-offset-2 ${
                isFirst ? "drop-cap" : ""
              }`}
              style={isFirst ? { "--drop-cap-color": accentHex } : undefined}
              dangerouslySetInnerHTML={{ __html: sanitizeBlockHtml(block.text) }}
            />
          );
        }
        if (block.type === "image" && block.url) {
          return (
            <div key={i} className="relative w-full aspect-[3/2] rounded-sm overflow-hidden">
              <Image src={block.url} alt="" fill sizes="(max-width: 780px) 100vw, 780px" className="object-cover" />
            </div>
          );
        }
        if (block.type === "heading") {
          return (
            <h2 key={i} className="font-display font-700 text-2xl sm:text-3xl text-ink pt-4">
              {block.text}
            </h2>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={i} className="border-l-4 pl-5 py-1" style={{ borderColor: accentHex }}>
              <p className="font-display italic text-xl sm:text-2xl text-ink leading-snug">{block.text}</p>
              {block.attribution && (
                <cite className="block font-sans text-sm text-steel mt-2 not-italic">— {block.attribution}</cite>
              )}
            </blockquote>
          );
        }
        if (block.type === "divider") {
          return <hr key={i} className="border-steel/25 my-4" />;
        }
        if (block.type === "button") {
          return (
            <div key={i}>
              <a
                href={sanitizeHref(block.url)}
                className="inline-block font-sans text-sm font-600 text-paper px-5 py-2.5 rounded-sm hover:bg-ink transition-colors"
                style={{ backgroundColor: accentHex }}
              >
                {block.label || "Learn more"}
              </a>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
