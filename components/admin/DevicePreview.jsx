"use client";

import { useState } from "react";

const DEVICES = {
  mobile: { label: "Mobile", width: 375, icon: "phone" },
  tablet: { label: "Tablet", width: 768, icon: "tablet" },
  desktop: { label: "Desktop", width: null, icon: "desktop" }, // null = fill available width
};

function DeviceIcon({ kind }) {
  if (kind === "phone") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="7" y="2" width="10" height="20" rx="2" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    );
  }
  if (kind === "tablet") {
    return (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <line x1="11" y1="19" x2="13" y2="19" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="4" width="20" height="13" rx="1.5" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

export default function DevicePreview({ src, refreshToken, heightClass = "h-[calc(100vh-41px)]" }) {
  const [device, setDevice] = useState("desktop");
  const current = DEVICES[device];

  return (
    <div className={`flex flex-col ${heightClass}`}>
      <div className="flex items-center justify-center gap-1 py-2 border-b border-steel/20 bg-paper shrink-0">
        {Object.entries(DEVICES).map(([key, d]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDevice(key)}
            className={`flex items-center gap-1.5 font-sans text-xs px-3 py-1.5 rounded-full border transition-colors ${
              device === key
                ? "bg-ink text-paper border-ink"
                : "border-steel/30 text-steel hover:border-steel/50"
            }`}
          >
            <DeviceIcon kind={d.icon} />
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-steel/[0.08] flex justify-center py-6">
        <div
          className={device !== "desktop" ? "rounded-lg border border-steel/25 shadow-lg overflow-hidden bg-paper" : "w-full h-full"}
          style={{ width: current.width ? current.width : "100%" }}
        >
          <iframe
            key={`${device}-${refreshToken || 0}`}
            src={src}
            title="Preview"
            className="w-full h-full bg-paper"
            style={{ height: device === "desktop" ? "100%" : 720, border: "none" }}
          />
        </div>
      </div>
    </div>
  );
}
