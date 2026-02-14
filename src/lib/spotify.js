export async function searchAlbums(query, signal) {
  if (!query.trim()) return [];

  const res = await fetch(
    `/api/spotify-search?q=${encodeURIComponent(query.trim())}`,
    { signal }
  );

  if (!res.ok) {
    throw new Error(`Spotify search failed: ${res.status}`);
  }

  return res.json();
}
