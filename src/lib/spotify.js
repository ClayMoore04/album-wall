export async function searchSpotify(query, type = "album", signal) {
  if (!query.trim()) return [];

  const res = await fetch(
    `/api/spotify-search?q=${encodeURIComponent(query.trim())}&type=${type}`,
    { signal }
  );

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  return res.json();
}

// Backwards compatible alias
export const searchAlbums = (query, signal) =>
  searchSpotify(query, "album", signal);
