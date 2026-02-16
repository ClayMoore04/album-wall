export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { access_token, playlist_name, description, is_public, album_ids } =
    req.body;

  if (!access_token || !playlist_name || !album_ids?.length) {
    return res
      .status(400)
      .json({ error: "Missing access_token, playlist_name, or album_ids" });
  }

  const spotifyFetch = (url, options = {}) =>
    fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

  try {
    // 1. Get current user's ID
    const meRes = await spotifyFetch("https://api.spotify.com/v1/me");
    if (!meRes.ok) {
      const err = await meRes.text();
      console.error("Spotify /me error:", meRes.status, err);
      return res.status(meRes.status).json({ error: "Failed to get user profile" });
    }
    const me = await meRes.json();

    // 2. Fetch tracks for all albums
    const trackUris = [];
    for (const albumId of album_ids) {
      const tracksRes = await spotifyFetch(
        `https://api.spotify.com/v1/albums/${albumId}/tracks?market=US&limit=50`
      );
      if (tracksRes.ok) {
        const tracksData = await tracksRes.json();
        for (const track of tracksData.items || []) {
          trackUris.push(track.uri);
        }
      } else {
        console.warn(`Failed to fetch tracks for album ${albumId}:`, tracksRes.status);
      }
    }

    if (trackUris.length === 0) {
      return res.status(400).json({ error: "No tracks found for the selected albums" });
    }

    // 3. Create the playlist
    const createRes = await spotifyFetch(
      `https://api.spotify.com/v1/users/${me.id}/playlists`,
      {
        method: "POST",
        body: JSON.stringify({
          name: playlist_name,
          description: description || "Created from The Booth",
          public: is_public !== false,
        }),
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      console.error("Create playlist error:", createRes.status, err);
      return res.status(createRes.status).json({ error: "Failed to create playlist" });
    }

    const playlist = await createRes.json();

    // 4. Add tracks in batches of 100 (Spotify limit)
    for (let i = 0; i < trackUris.length; i += 100) {
      const batch = trackUris.slice(i, i + 100);
      const addRes = await spotifyFetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: "POST",
          body: JSON.stringify({ uris: batch }),
        }
      );
      if (!addRes.ok) {
        console.warn(`Failed to add tracks batch ${i}:`, addRes.status);
      }
    }

    return res.json({
      success: true,
      playlist_url: playlist.external_urls?.spotify || "",
      playlist_id: playlist.id,
      track_count: trackUris.length,
    });
  } catch (e) {
    console.error("Create playlist error:", e);
    return res.status(500).json({ error: "Failed to create playlist" });
  }
}
