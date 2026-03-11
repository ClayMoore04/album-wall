/**
 * Taste compatibility scoring between two users.
 *
 * Weights:
 *   - Shared artists across rated albums: 50%
 *   - Rating similarity on shared artists: 20%
 *   - Shared Spotify IDs in mixtape tracks: 30%
 */

async function fetchUserData(supabase, userId) {
  const [{ data: submissions }, { data: mixtapeTracks }] = await Promise.all([
    supabase
      .from("submissions")
      .select("artist_name, album_name, spotify_id, rating")
      .eq("wall_id", userId)
      .gt("rating", 0),
    supabase
      .from("mixtape_tracks")
      .select("track_name, artist_name, spotify_id, mixtapes!inner(user_id)")
      .eq("mixtapes.user_id", userId),
  ]);

  return {
    submissions: submissions || [],
    mixtapeTracks: mixtapeTracks || [],
  };
}

function normalizeArtist(name) {
  return (name || "").trim().toLowerCase();
}

export async function getCompatibility(supabase, userId1, userId2) {
  if (!supabase || !userId1 || !userId2 || userId1 === userId2) {
    return null;
  }

  const [user1, user2] = await Promise.all([
    fetchUserData(supabase, userId1),
    fetchUserData(supabase, userId2),
  ]);

  // Minimum data check: at least 3 rated albums or mixtape tracks combined
  const user1Count = user1.submissions.length + user1.mixtapeTracks.length;
  const user2Count = user2.submissions.length + user2.mixtapeTracks.length;
  if (user1Count < 3 || user2Count < 3) {
    return null;
  }

  // --- Shared artists (50%) ---
  const artistRatings1 = new Map();
  for (const s of user1.submissions) {
    const key = normalizeArtist(s.artist_name);
    const existing = artistRatings1.get(key);
    if (!existing || s.rating > existing.rating) {
      artistRatings1.set(key, { rating: s.rating, display: s.artist_name });
    }
  }

  const artistRatings2 = new Map();
  for (const s of user2.submissions) {
    const key = normalizeArtist(s.artist_name);
    const existing = artistRatings2.get(key);
    if (!existing || s.rating > existing.rating) {
      artistRatings2.set(key, { rating: s.rating, display: s.artist_name });
    }
  }

  // Also count artists from mixtape tracks
  for (const t of user1.mixtapeTracks) {
    const key = normalizeArtist(t.artist_name);
    if (!artistRatings1.has(key)) {
      artistRatings1.set(key, { rating: 0, display: t.artist_name });
    }
  }
  for (const t of user2.mixtapeTracks) {
    const key = normalizeArtist(t.artist_name);
    if (!artistRatings2.has(key)) {
      artistRatings2.set(key, { rating: 0, display: t.artist_name });
    }
  }

  const sharedArtistKeys = [];
  for (const key of artistRatings1.keys()) {
    if (artistRatings2.has(key)) {
      sharedArtistKeys.push(key);
    }
  }

  const totalUniqueArtists = new Set([
    ...artistRatings1.keys(),
    ...artistRatings2.keys(),
  ]).size;

  const sharedArtists = sharedArtistKeys.map(
    (k) => artistRatings1.get(k).display
  );

  const sharedArtistScore =
    totalUniqueArtists > 0
      ? (sharedArtistKeys.length / totalUniqueArtists) * 100
      : 0;

  // --- Rating similarity on shared artists (20%) ---
  let ratingScore = 0;
  const ratedShared = sharedArtistKeys.filter(
    (k) => artistRatings1.get(k).rating > 0 && artistRatings2.get(k).rating > 0
  );
  if (ratedShared.length > 0) {
    let totalSimilarity = 0;
    for (const k of ratedShared) {
      const diff = Math.abs(
        artistRatings1.get(k).rating - artistRatings2.get(k).rating
      );
      // diff 0 = 100%, diff 4 = 0%
      totalSimilarity += (1 - diff / 4) * 100;
    }
    ratingScore = totalSimilarity / ratedShared.length;
  } else {
    // No rated overlap -- neutral
    ratingScore = 50;
  }

  // --- Shared mixtape spotify_ids (30%) ---
  const mixtapeIds1 = new Set(
    user1.mixtapeTracks.map((t) => t.spotify_id).filter(Boolean)
  );
  const mixtapeIds2 = new Set(
    user2.mixtapeTracks.map((t) => t.spotify_id).filter(Boolean)
  );

  let mixtapeScore = 0;
  if (mixtapeIds1.size > 0 && mixtapeIds2.size > 0) {
    let sharedCount = 0;
    for (const id of mixtapeIds1) {
      if (mixtapeIds2.has(id)) sharedCount++;
    }
    const totalUnique = new Set([...mixtapeIds1, ...mixtapeIds2]).size;
    mixtapeScore = totalUnique > 0 ? (sharedCount / totalUnique) * 100 : 0;
  } else {
    // If either has no mixtape tracks, neutral
    mixtapeScore = 50;
  }

  // Weighted total
  const score = Math.round(
    sharedArtistScore * 0.5 + ratingScore * 0.2 + mixtapeScore * 0.3
  );

  const clamped = Math.min(100, Math.max(0, score));

  let level;
  if (clamped >= 80) level = "soul mates";
  else if (clamped >= 60) level = "kindred spirits";
  else if (clamped >= 30) level = "good vibes";
  else level = "different wavelengths";

  return {
    score: clamped,
    sharedArtists,
    level,
  };
}
