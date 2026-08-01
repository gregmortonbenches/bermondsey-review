import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/public";
import { getRoundById } from "@/lib/geoguesser";
import { haversineDistanceMeters } from "@/lib/geo";

// Scores a guess server-side rather than shipping correct_lat/correct_lng
// to the browser at all — the public /geoguesser page only ever gets
// photo_url/photo_alt/hint (see app/geoguesser/page.jsx), so the answer
// never sits in the page's own HTML or JS for a casual view-source to
// find. The round itself is still a publicly-readable table (same as
// redirects, forms, etc. — see supabase/schema.sql), so this isn't
// airtight against someone querying Supabase's REST API directly; for a
// free community puzzle, guarding against that casual case is the
// actually-useful bar, not a determined attacker.
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { roundId, lat, lng } = body || {};
  if (!roundId || typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ error: "Missing or invalid guess." }, { status: 400 });
  }

  const supabase = createClient();
  const round = await getRoundById(supabase, roundId);
  if (!round) {
    return NextResponse.json({ error: "That round no longer exists." }, { status: 404 });
  }

  const distanceMeters = haversineDistanceMeters(lat, lng, round.correct_lat, round.correct_lng);

  return NextResponse.json({
    distanceMeters,
    correctLat: round.correct_lat,
    correctLng: round.correct_lng,
    locationName: round.location_name || null,
  });
}
