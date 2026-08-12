"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { formatDistance, scoreLabel } from "@/lib/geo";

// Leaflet needs a real DOM — loaded client-side only, and only once this
// component (itself already client-only) actually mounts.
const GeoMap = dynamic(() => import("./GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="h-80 border border-steel/25 bg-steel/[0.06] flex items-center justify-center">
      <p className="font-sans text-sm text-steel">Loading map…</p>
    </div>
  ),
});

const BERMONDSEY_CENTER = [51.497, -0.063];

export default function GeoguesserGame({ round }) {
  const [guess, setGuess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit() {
    if (!guess) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/geoguesser/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: round.id, lat: guess.lat, lng: guess.lng }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong scoring that guess.");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleTryAgain() {
    setResult(null);
    setGuess(null);
    setError(null);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] sm:aspect-[16/9] overflow-hidden bg-steel/[0.08] mb-4">
        <Image
          src={round.photo_url}
          alt={round.photo_alt || ""}
          fill
          sizes="(max-width: 780px) 100vw, 780px"
          className="object-cover"
          priority
        />
      </div>

      {round.hint && !result && (
        <p className="font-body text-steel italic mb-4">{round.hint}</p>
      )}

      {!result ? (
        <>
          <p className="font-sans text-sm text-steel mb-2">
            Click the map where you think this photo was taken — or tab to it, use the arrow keys
            to move it, and press Enter to drop your guess on the crosshair.
          </p>
          <GeoMap center={BERMONDSEY_CENTER} marker={guess} onPick={(lat, lng) => setGuess({ lat, lng })} />
          {error && (
            <p className="font-sans text-sm text-brick bg-brick/[0.08] px-3 py-2 mt-3">{error}</p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!guess || submitting}
            className="mt-4 font-sans text-sm font-600 bg-brick text-paper px-5 py-2.5 hover:bg-ink transition-colors disabled:opacity-50"
          >
            {submitting ? "Scoring…" : guess ? "Submit guess" : "Click the map to guess first"}
          </button>
        </>
      ) : (
        <>
          <div className="bg-river/[0.06] px-5 py-4 mb-4">
            <div className="flex items-baseline gap-3 flex-wrap">
              <p className="font-display font-700 text-4xl text-ink">
                {result.score.toLocaleString()}
                <span className="font-body font-400 text-lg text-steel"> / 5,000</span>
              </p>
              <p className="font-sans text-sm font-600 uppercase tracking-[0.08em] text-brick">
                {scoreLabel(result.score)}
              </p>
            </div>
            <p className="font-body text-steel mt-2">
              {formatDistance(result.distanceMeters)} away
              {result.locationName ? ` — the real spot was ${result.locationName}.` : " — here's the real spot."}
            </p>
          </div>
          <GeoMap
            center={BERMONDSEY_CENTER}
            resultMarkers={{ guess, correct: { lat: result.correctLat, lng: result.correctLng } }}
          />
          <button
            type="button"
            onClick={handleTryAgain}
            className="mt-4 font-sans text-sm font-600 text-ink border border-steel/30 px-5 py-2.5 hover:bg-steel/[0.08] transition-colors"
          >
            Guess again
          </button>
        </>
      )}
    </div>
  );
}
