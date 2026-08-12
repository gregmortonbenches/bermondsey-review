"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Named import, not the classic `L.esri.Vector.vectorBasemapLayer(...)`
// global-namespace call — that pattern only exists on esri-leaflet's
// plain <script>-tag UMD build (what a static site loading it from a CDN,
// like github.com/gregmortonbenches/benches-map, gets). A bundler
// resolves the package's ESM entry instead, which is just named exports
// and never touches the L.esri namespace at all — confirmed by testing
// this: the global-namespace version throws "Cannot read properties of
// undefined (reading 'Vector')" under Next.js.
import { vectorBasemapLayer } from "esri-leaflet-vector";

// Esri's styled vector basemap (nicer-looking than plain OSM raster tiles
// — same one github.com/gregmortonbenches/benches-map uses) needs an
// ArcGIS Location Platform API token, which is metered/billed per
// account. Rather than hardcode that project's own token into this
// separate app and quietly share its quota, this reads its own token
// from an env var and falls back to the existing free OSM tiles when
// it's unset — see NEXT_PUBLIC_ESRI_TOKEN in .env.local.example.
const ESRI_TOKEN = process.env.NEXT_PUBLIC_ESRI_TOKEN;

// Mirrors GeoMap's onPick pattern (a Leaflet plugin that only has an
// imperative API, wrapped as a component so it can live declaratively
// inside <MapContainer>) — esri-leaflet-vector's basemap layer has no
// react-leaflet equivalent, so it's added/removed via useMap() instead.
function EsriVectorBasemap() {
  const map = useMap();
  useEffect(() => {
    const layer = vectorBasemapLayer("arcgis/colored-pencil", { token: ESRI_TOKEN }).addTo(map);
    return () => map.removeLayer(layer);
  }, [map]);
  return null;
}

// Simple coloured-dot markers instead of Leaflet's default pin icon —
// its default icon references relative image paths that break once
// bundled (a well-known Leaflet-in-a-bundler issue), and a plain div
// icon sidesteps that entirely rather than reaching for a CDN fallback
// for three small images. Matches the site's own brick/river palette so
// "your guess" vs "the real spot" reads as intentional, not generic map
// pins.
function dotIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:2.5px solid #FFFFFF;box-shadow:0 1px 4px rgba(0,0,0,0.45);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const GUESS_COLOR = "#1D4ED8"; // --color-river
const CORRECT_COLOR = "#F5C518"; // --color-brick

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Leaflet's `keyboard` option (on by default, left untouched below) gives
// arrow-key panning and +/- zoom for free once the map container has
// focus — but nothing in Leaflet itself lets a keyboard-only visitor
// actually *place* a guess, since that only ever fired from a mouse
// click event. This adds the missing half: Enter or Space, while the
// map has focus, picks whatever point is currently centred — the same
// point the crosshair overlay in GeoMap's own markup is drawn over, so
// there's a visible target to aim for while panning with the arrow keys.
function KeyboardPickHandler({ onPick }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    function handleKeyDown(e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      const center = map.getCenter();
      onPick(center.lat, center.lng);
    }
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [map, onPick]);
  return null;
}

/**
 * Shared Leaflet map for Guess the Spot — used both by the public game
 * (click to guess) and the admin round editor (click to set the answer).
 * Always dynamically imported with `ssr: false` by its caller: Leaflet
 * itself expects a real DOM, and this component's module only needs to
 * exist client-side.
 *
 * `marker` + `onPick`: a single draggable-by-click point (the admin
 * setting the correct spot, or a visitor placing their guess).
 * `resultMarkers`: shown instead, once a guess has been scored — both
 * points plus a dashed line between them, guess/river vs correct/brick.
 */
export default function GeoMap({
  center,
  zoom = 15,
  marker,
  onPick,
  resultMarkers,
  heightClass = "h-80",
}) {
  return (
    <div className={`${heightClass} relative overflow-hidden border border-steel/25`}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        {ESRI_TOKEN ? (
          <EsriVectorBasemap />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}
        {onPick && <ClickHandler onClick={onPick} />}
        {onPick && <KeyboardPickHandler onPick={onPick} />}
        {marker && <Marker position={[marker.lat, marker.lng]} icon={dotIcon(GUESS_COLOR)} />}
        {resultMarkers && (
          <>
            <Polyline
              positions={[
                [resultMarkers.guess.lat, resultMarkers.guess.lng],
                [resultMarkers.correct.lat, resultMarkers.correct.lng],
              ]}
              pathOptions={{ color: "#6E6C63", weight: 2, dashArray: "6 6" }}
            />
            <Marker position={[resultMarkers.guess.lat, resultMarkers.guess.lng]} icon={dotIcon(GUESS_COLOR)} />
            <Marker position={[resultMarkers.correct.lat, resultMarkers.correct.lng]} icon={dotIcon(CORRECT_COLOR)} />
          </>
        )}
      </MapContainer>
      {/* The point Enter/Space picks, for a keyboard user panning with
          the arrow keys — Leaflet has no built-in equivalent of "hover
          the cursor" for keyboard input, so the map's own centre stands
          in for it instead, with this crosshair marking where that is.
          Plain CSS overlay, not part of Leaflet's own coordinate system:
          the map pans underneath it, this always stays dead centre.
          pointer-events-none so it never intercepts the mouse clicks
          ClickHandler listens for. */}
      {onPick && (
        <svg
          viewBox="0 0 24 24"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 pointer-events-none z-[1000]"
          aria-hidden="true"
        >
          <g fill="none" stroke="#1D4ED8" strokeWidth="1.75" strokeLinecap="round">
            <circle cx="12" cy="12" r="6" />
            <line x1="12" y1="1" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="23" />
            <line x1="1" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="23" y2="12" />
          </g>
        </svg>
      )}
    </div>
  );
}
