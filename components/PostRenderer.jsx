import Image from "next/image";
import { categoryFamily } from "@/lib/articles";
import { getYouTubeEmbedUrl } from "@/lib/youtube";
import BlockContent from "./BlockContent";

export default function PostRenderer({ post }) {
  const accent = categoryFamily(post.category);
  const accentHex =
    accent === "brick" ? "var(--color-brick, #9C6B42)" : "var(--color-river, #2B4C73)";
  const embedUrl = post.type === "video" ? getYouTubeEmbedUrl(post.media_url) : null;

  return (
    <article className="max-w-content mx-auto px-4 sm:px-6 py-10">
      <p
        className={`font-sans text-xs tracking-[0.14em] uppercase mb-3 ${
          accent === "brick" ? "text-brick" : "text-river"
        }`}
      >
        {post.category || "Uncategorised"}
      </p>
      <h1 className="font-display font-700 text-4xl sm:text-5xl text-ink leading-[1.05]">
        {post.title || "Untitled"}
      </h1>
      {post.dek && <p className="font-body text-lg sm:text-xl text-steel mt-4">{post.dek}</p>}
      {post.author && <p className="font-sans text-sm text-steel mt-4">{post.author}</p>}

      {post.cover_image_url && (
        <div className="relative w-full aspect-[16/9] mt-8 rounded-sm overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.cover_image_alt || ""}
            fill
            sizes="(max-width: 780px) 100vw, 780px"
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Video / podcast player */}
      {post.type === "video" && (
        <div className="mt-8 aspect-video rounded-sm overflow-hidden bg-ink/5">
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
        <audio controls className="w-full mt-8">
          <source src={post.media_url} />
        </audio>
      )}

      {/* Article body blocks */}
      {post.type === "article" && (
        <div className="mt-10">
          <BlockContent
            blocks={post.body}
            accentHex={accentHex}
            emptyText="This article doesn't have any content yet."
          />
        </div>
      )}
    </article>
  );
}
