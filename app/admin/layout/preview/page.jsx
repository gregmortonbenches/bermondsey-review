"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DevicePreview from "@/components/admin/DevicePreview";

const FRAMES = {
  home: { label: "Home", src: "/admin/layout/preview/frame" },
  archive: { label: "Articles", src: "/admin/layout/preview/archive-frame" },
  geoguesser: { label: "Guess the Spot", src: "/admin/layout/preview/geoguesser-frame" },
};

function LayoutPreviewShell() {
  const searchParams = useSearchParams();
  const initialTab = FRAMES[searchParams.get("tab")] ? searchParams.get("tab") : "home";
  const [tab, setTab] = useState(initialTab);

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-mustard/20 border-b border-mustard/40 text-center py-2 font-sans text-sm text-ink">
        Previewing {FRAMES[tab].label.toLowerCase()} across devices.{" "}
        <Link href="/admin/layout" className="underline underline-offset-4 hover:text-brick">
          Back to editing
        </Link>
      </div>
      <div className="flex items-center justify-center gap-1 py-2 border-b border-steel/20 bg-paper">
        {Object.entries(FRAMES).map(([key, f]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
              tab === key
                ? "bg-ink text-paper border-ink"
                : "border-steel/30 text-steel hover:border-steel/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <DevicePreview src={FRAMES[tab].src} heightClass="h-[calc(100vh-75px)]" />
    </div>
  );
}

// The main /admin/layout editor is a fixed-width canvas (like the post
// and page editors) — this is where you check it across device sizes.
// Which page previews is a tab, not a separate route per page, so
// switching pages here doesn't lose your current device size. `?tab=`
// lets a canvas's own "Preview" link (see PageCopyEditCanvas.jsx and
// LayoutCanvas.jsx) open straight to the page it was editing. Wrapped
// in Suspense because useSearchParams requires it for a statically
// generated page — see https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout.
export default function LayoutPreviewPage() {
  return (
    <Suspense>
      <LayoutPreviewShell />
    </Suspense>
  );
}
