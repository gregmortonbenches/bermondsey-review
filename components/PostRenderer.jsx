import Image from "next/image";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import BlockContent from "./BlockContent";
import CoverArt from "./CoverArt";
import ArticleSidebar from "./ArticleSidebar";
import { focalPointStyle } from "@/lib/media";
import { categoryInk } from "@/lib/categories";

export default function PostRenderer({ post }) {
  // The drop cap and quote rule stay on the one standing accent
  // (river) regardless of category — those are page furniture, not a
  // category signal. The category kicker itself now uses that
  // category's own ink (see lib/categories.js) rather than always
  // being river too; the two used to be the same colour by coincidence
  // more than intent.
  const accentHex = "var(--color-river, #1D4ED8)";
  const embedUrl = post.type === "video" ? getYouTubeEmbedUrl(post.media_url) : null;

  // A single illustration doesn't read as a headline-and-standfirst piece,
  // so cartoons skip the split hero band below entirely for their own
  // compact, centred layout: the full image — uncropped (object-contain,
  // not object-cover; cropping a single-panel joke can cut off the
  // punchline, unlike the homepage rail's thumbnail, which can afford to)
  // — with the caption (post.title, same field CartoonsSection shows
  // under the thumbnail) and artist underneath. No body content section:
  // a cartoon post has no blocks to render, same as it always has.
  if (post.type === "cartoon") {
    return (
      <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <p className="font-sans text-xs tracking-[0.14em] uppercase mb-4" style={{ color: categoryInk("Cartoon") }}>Cartoon</p>
        {post.cover_image_url ? (
          <div className="relative w-full aspect-[4/3] bg-steel/[0.05] overflow-hidden">
            <Image
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title || "Cartoon"}
              fill
              sizes="(max-width: 640px) 100vw, 42rem"
              className="object-contain"
              priority
            />
          </div>
        ) : (
          <CoverArt category={post.category} className="aspect-[4/3]" />
        )}
        {post.title && <p className="font-display italic text-xl text-ink mt-6">{post.title}</p>}
        {post.author && <p className="font-sans text-sm uppercase tracking-[0.06em] text-steel mt-2">{post.author}</p>}
      </article>
    );
  }

  return (
    <article>
      {/* The lead: headline block and cover image side by side on desktop,
          stacking on mobile — a proper front-of-section lead rather than
          a plain header sitting above the image.
          This band used to be filled with a pale wash of the story's
          category colour. Plain paper with a hairline under it now: at
          full width the tint was the loudest thing on the page, and it
          was carrying almost no information — colour is spent on the
          category label and the drop cap instead. */}
      <div className="hairline-b">
        <div className="max-w-wider mx-auto grid sm:grid-cols-2 sm:min-h-[420px]">
          <div className="px-4 sm:px-6 lg:px-12 py-10 sm:py-16 flex flex-col justify-center">
            <p className="font-sans text-xs tracking-[0.14em] uppercase mb-3" style={{ color: categoryInk(post.category) }}>
              {post.category || "Uncategorised"}
            </p>
            <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink leading-[1.05]">
              {post.title || "Untitled"}
            </h1>
            {/* Author used to show here too — dropped once ArticleSidebar
                started showing it (see below), which would have meant
                the same byline twice on the same page. Cartoons still
                show it under their own image (see the branch above,
                before this return): they don't get a sidebar at all
                (no split hero band, no body blocks to make one relevant
                for), so that's still the only place it appears there. */}
            {post.dek && <p className="font-body italic text-lg sm:text-xl text-ink/70 mt-4">{post.dek}</p>}
          </div>
          {post.cover_image_url ? (
            <div className="relative aspect-[4/3] sm:aspect-auto sm:h-full">
              <Image
                src={post.cover_image_url}
                alt={post.cover_image_alt || ""}
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
                style={focalPointStyle(post)}
                priority
              />
            </div>
          ) : (
            <CoverArt category={post.category} className="aspect-[4/3] sm:h-full" />
          )}
        </div>
      </div>

      {/* Sidebar + body as a two-column grid, not the plain single
          max-w-content column this used to be — ArticleSidebar is a
          Client Component (the text-size control, a share button), but
          this stays a Server Component: it's rendered as a normal child
          here, no different from any other component import, since
          everything handed to it (author/date/category/etc.) is plain
          serializable data.
          lg:grid-cols-[220px_1fr]: below that, a single column, so the
          sidebar simply stacks above the body in DOM order — matches
          how it's meant to read on a phone, not a collapsed drawer.
          The body's own max-w-content is unchanged from before (still
          780px, the same reading measure every other standalone page
          uses) — just no longer centred in the full page width, since
          it now sits in the grid's second track alongside the rail
          rather than filling it alone. */}
      <div className="max-w-wide mx-auto px-4 sm:px-6 lg:px-12 py-10 grid lg:grid-cols-[220px_1fr] gap-10 lg:gap-16">
        {/* self-start: without it, a grid item stretches to match the
            row's full height by default, which would defeat lg:sticky —
            a sticky element needs a height shorter than its scroll
            container to ever actually have room to "stick". */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ArticleSidebar
            author={post.author}
            illustrator={post.illustrator}
            publishedAt={post.published_at}
            category={post.category}
            title={post.title}
            slug={post.slug}
          />
        </aside>

        <div className="max-w-content">
          {/* Video / podcast player */}
          {post.type === "video" && (
            <div className="aspect-video overflow-hidden bg-ink/5">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <p className="font-sans text-sm text-steel p-6">
                  Add a valid YouTube URL to see the player here.
                </p>
              )}
            </div>
          )}
          {post.type === "podcast" && post.media_url && (
            <audio controls className="w-full">
              <source src={post.media_url} />
            </audio>
          )}

          {/* Article body blocks */}
          {post.type === "article" && (
            <BlockContent
              blocks={post.body}
              accentHex={accentHex}
              emptyText="This article doesn't have any content yet."
            />
          )}
        </div>
      </div>
    </article>
  );
}
