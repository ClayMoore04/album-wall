let cachedToken = null;
let tokenExpiry = 0;

async function getToken(forceRefresh = false) {
  if (!forceRefresh && cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(clientId + ":" + clientSecret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

async function spotifySearch(query, token, type = "album") {
  const res = await fetch(
    `https://api.spotify.com/v1/search?type=${type}&market=US&limit=6&q=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
}

export default async function handler(req, res) {
  const { q, type = "album" } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  // Only allow album or track
  const searchType = type === "track" ? "track" : "album";

  try {
    let token = await getToken();
    let spotifyRes = await spotifySearch(q, token, searchType);

    // If token expired, refresh and retry once
    if (spotifyRes.status === 401) {
      token = await getToken(true);
      spotifyRes = await spotifySearch(q, token, searchType);
    }

    if (!spotifyRes.ok) {
      const errorBody = await spotifyRes.text();
      console.error("Spotify API response:", spotifyRes.status, errorBody);
      throw new Error(`Spotify API error: ${spotifyRes.status} - ${errorBody}`);
    }

    const data = await spotifyRes.json();

    let results = [];

    if (searchType === "album") {
      results = (data.albums?.items || []).map((a) => ({
        id: a.id,
        type: "album",
        name: a.name,
        artist: a.artists.map((ar) => ar.name).join(", "),
        imageUrl: a.images?.[1]?.url || a.images?.[0]?.url || "",
        spotifyUrl: a.external_urls?.spotify || "",
      }));
    } else {
      results = (data.tracks?.items || []).map((t) => ({
        id: t.id,
        type: "track",
        name: t.name,
        artist: t.artists.map((ar) => ar.name).join(", "),
        imageUrl: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || "",
        spotifyUrl: t.external_urls?.spotify || "",
        albumName: t.album?.name || "",
      }));
    }

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.json(results);
  } catch (e) {
    console.error("Spotify search error:", e);
    return res.status(500).json({ error: "Failed to search Spotify" });
  }
}
