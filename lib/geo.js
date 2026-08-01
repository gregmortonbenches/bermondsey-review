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
