"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const GUESS_COLOR = "#2B4C73"; // --color-river
const CORRECT_COLOR = "#9C6B42"; // --color-brick

function ClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
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
    <div className={`${heightClass} rounded-sm overflow-hidden border border-steel/25`}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {onPick && <ClickHandler onClick={onPick} />}
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
    </div>
  );
}
