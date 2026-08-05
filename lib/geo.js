// Great-circle distance between two lat/lng points, in metres —
// standard haversine formula. Used to score a Guess the Spot round:
// how far the visitor's map click was from the round's real location.
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's mean radius, metres
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// "420m away" under a kilometre, "2.3km away" beyond it — matches how
// someone would actually describe the distance out loud, rather than
// always showing raw metres.
export function formatDistance(metres) {
  if (metres < 1000) return `${Math.round(metres)}m`;
  return `${(metres / 1000).toFixed(1)}km`;
}

// Turns a raw distance into a GeoGuessr-style 0-5000 point score, via
// exponential decay: 5000 * e^(-distance / SCORE_SCALE_METRES). The
// scale is tuned to Bermondsey's own size, not lifted from real
// GeoGuessr (which decays over a whole country/map's extent, hundreds
// of km) — a guess anywhere in the neighbourhood should still land
// somewhere on the scale, rather than everything past a few hundred
// metres bottoming out at zero. At this scale: ~4500 within 50m,
// ~3000 within 250m, ~1800 within 500m, under 100 past 2km.
const SCORE_SCALE_METRES = 500;

export function scoreFromDistance(distanceMeters) {
  return Math.round(5000 * Math.exp(-distanceMeters / SCORE_SCALE_METRES));
}

// A one-line qualitative read on a score, shown next to the number so
// it doesn't need mental translation from "out of 5000" to "was that
// good?".
export function scoreLabel(score) {
  if (score >= 4500) return "Spot on!";
  if (score >= 3000) return "Great guess";
  if (score >= 1500) return "Not bad";
  if (score >= 500) return "Getting warmer";
  return "Way off";
}
