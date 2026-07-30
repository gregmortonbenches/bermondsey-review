"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  {
    items: [
      { href: "/admin", label: "Posts", exact: true },
      { href: "/admin/pages", label: "Pages", adminOnly: true },
      { href: "/admin/media", label: "Media" },
    ],
  },
  {
    adminOnly: true,
    items: [
      { href: "/admin/forms", label: "Forms", adminOnly: true },
      { href: "/admin/analytics", label: "Analytics", adminOnly: true },
      { href: "/admin/redirects", label: "Redirects", adminOnly: true },
    ],
  },
  {
    adminOnly: true,
    items: [
      { href: "/admin/theme", label: "Design", adminOnly: true },
      { href: "/admin/site", label: "Site", adminOnly: true },
      { href: "/admin/layout", label: "Homepage layout", adminOnly: true },
    ],
  },
];

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
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <div className="flex h-screen bg-paper">
      <aside className="w-56 shrink-0 h-screen overflow-y-auto border-r border-steel/20 flex flex-col">
        <div className="px-4 py-5">
          <p className="font-display font-700 text-lg text-ink">The Bermondsey Review</p>
          <p className="font-sans text-[11px] uppercase tracking-[0.08em] text-steel mt-0.5">
            {isAdmin ? "Admin" : "Contributor"}
          </p>
        </div>

        <nav className="flex-1 px-2 space-y-5">
          {SECTIONS.map((section, i) => {
            const items = section.adminOnly && !isAdmin ? [] : section.items.filter((it) => isAdmin || !it.adminOnly);
            if (items.length === 0) return null;
            return (
              <div key={i} className="space-y-0.5">
                {items.map((item) => (
                  <NavLink key={item.href} {...item} pathname={pathname} />
                ))}
              </div>
            );
          })}
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
