"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EditorOutlineProvider, useEditorOutline, jumpToElement } from "./EditorOutlineContext";
import PageSwitcher from "./PageSwitcher";

const SECTIONS = [
  {
    items: [{ href: "/admin", label: "Dashboard", exact: true }],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/posts", label: "Posts" },
      { href: "/admin/pages", label: "Pages", adminOnly: true },
      { href: "/admin/media", label: "Media" },
    ],
  },
  {
    label: "Engagement",
    adminOnly: true,
    items: [
      { href: "/admin/forms", label: "Forms", adminOnly: true },
      { href: "/admin/geoguesser", label: "Guess the Spot", adminOnly: true },
      { href: "/admin/analytics", label: "Analytics", adminOnly: true },
      { href: "/admin/redirects", label: "Redirects", adminOnly: true },
    ],
  },
  {
    label: "Design & settings",
    adminOnly: true,
    items: [
      { href: "/admin/theme", label: "Design", adminOnly: true },
      { href: "/admin/site", label: "Site", adminOnly: true },
      { href: "/admin/layout", label: "Homepage layout", adminOnly: true },
    ],
  },
];

// The "on this page" list — whatever canvas is currently mounted inside
// {children} (BlockEditor for a post/page, LayoutCanvas for the homepage)
// publishes this via usePublishOutline; nothing shows here for the pages
// that don't (post list, media library, and so on).
function OutlinePanel({ outline }) {
  return (
    <div className="pt-4 mt-1 border-t border-steel/15 space-y-0.5">
      <p className="px-3 font-sans text-[11px] uppercase tracking-[0.08em] text-steel mb-1.5">
        {outline.title}
      </p>
      {outline.items.length === 0 ? (
        <p className="px-3 font-sans text-xs text-steel/70">Nothing here yet</p>
      ) : (
        outline.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => jumpToElement(item.id)}
            title={item.hint}
            className={`block w-full text-left font-sans text-[13px] leading-snug px-3 py-1.5 rounded-sm hover:bg-steel/[0.08] transition-colors truncate ${
              item.muted ? "text-steel/60 italic" : "text-ink/80 hover:text-ink"
            }`}
          >
            {item.label}
          </button>
        ))
      )}
    </div>
  );
}

function NavLink({ href, label, exact, pathname }) {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={`block font-sans text-sm px-3 py-2 rounded-sm transition-colors ${
        active ? "bg-brick/[0.1] text-brick font-600" : "text-ink hover:bg-steel/[0.08]"
      }`}
    >
      {label}
    </Link>
  );
}

export default function AdminShell({ role, children }) {
  return (
    <EditorOutlineProvider>
      <AdminShellInner role={role}>{children}</AdminShellInner>
    </EditorOutlineProvider>
  );
}

function AdminShellInner({ role, children }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const { outline } = useEditorOutline();

  return (
    <div className="flex h-screen bg-paper">
      <aside className="w-56 shrink-0 h-screen overflow-y-auto border-r border-steel/20 flex flex-col">
        <Link href="/admin" className="block px-4 py-5 hover:bg-steel/[0.04] transition-colors">
          <p className="font-display font-700 text-lg text-ink">The Bermondsey Review</p>
          <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel mt-0.5">
            {isAdmin ? "Admin" : "Contributor"}
          </p>
        </Link>

        <nav className="flex-1 px-2 space-y-5 overflow-y-auto">
          {SECTIONS.map((section, i) => {
            const items = section.adminOnly && !isAdmin ? [] : section.items.filter((it) => isAdmin || !it.adminOnly);
            if (items.length === 0) return null;
            return (
              <div key={i} className="space-y-0.5">
                {section.label && (
                  <p className="px-3 font-sans text-[10px] uppercase tracking-[0.08em] text-steel/70 mb-1.5">{section.label}</p>
                )}
                {items.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} />
                ))}
              </div>
            );
          })}

          <PageSwitcher pathname={pathname} />
          {outline && <OutlinePanel outline={outline} />}
        </nav>

        <div className="px-2 py-4 border-t border-steel/20 space-y-0.5">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="block font-sans text-sm text-steel hover:text-ink px-3 py-2 rounded-sm hover:bg-steel/[0.08] transition-colors"
          >
            View site ↗
          </a>
          <form action="/admin/logout" method="post">
            <button
              type="submit"
              className="w-full text-left font-sans text-sm text-steel hover:text-ink px-3 py-2 rounded-sm hover:bg-steel/[0.08] transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-screen overflow-y-auto">{children}</div>
    </div>
  );
}
