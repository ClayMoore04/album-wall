export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, access_token } = req.query;

  if (!id || !access_token) {
    return res.status(400).json({ error: "Missing playlist id or access_token" });
  }

  try {
    // Fetch playlist metadata
    const playlistRes = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?fields=name`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    if (!playlistRes.ok) {
      const err = await playlistRes.json().catch(() => ({}));
      return res.status(playlistRes.status).json({
        error: err.error?.message || "Failed to fetch playlist",
      });
    }

    const playlist = await playlistRes.json();

    // Fetch tracks with pagination
    let tracks = [];
    let url = `https://api.spotify.com/v1/playlists/${id}/tracks?fields=items(track(id,name,artists,album(name,images),external_urls,duration_ms)),next&limit=100`;

    while (url) {
      const tracksRes = await fetch(url, {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!tracksRes.ok) break;

      const data = await tracksRes.json();

      for (const item of data.items || []) {
        const track = item.track;
        if (!track || !track.id) continue;

        tracks.push({
          id: track.id,
          name: track.name,
          artist: (track.artists || []).map((a) => a.name).join(", "),
          albumName: track.album?.name || "",
          imageUrl: track.album?.images?.[0]?.url || null,
          spotifyUrl: track.external_urls?.spotify || null,
          durationMs: track.duration_ms || 0,
        });
      }

      url = data.next || null;
    }

    return res.status(200).json({
      name: playlist.name,
      tracks,
    });
  } catch (e) {
    console.error("spotify-playlist-tracks error:", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
