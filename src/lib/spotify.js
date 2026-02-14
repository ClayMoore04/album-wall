export async function searchAlbums(query) {
  if (!query.trim()) return [];

  const res = await fetch(
    `/api/spotify-search?q=${encodeURIComponent(query.trim())}`
  );

  if (!res.ok) {
    console.error("Spotify search failed:", res.status);
    return [];
  }

  return res.json();
}
