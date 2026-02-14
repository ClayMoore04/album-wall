let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

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
        "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
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

export default async function handler(req, res) {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const token = await getToken();

    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?type=album&limit=5&q=${encodeURIComponent(q)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!spotifyRes.ok) {
      throw new Error(`Spotify API error: ${spotifyRes.status}`);
    }

    const data = await spotifyRes.json();

    const albums = (data.albums?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      artist: a.artists.map((ar) => ar.name).join(", "),
      imageUrl: a.images?.[1]?.url || a.images?.[0]?.url || "",
      spotifyUrl: a.external_urls?.spotify || "",
    }));

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.json(albums);
  } catch (e) {
    console.error("Spotify search error:", e);
    return res.status(500).json({ error: "Failed to search Spotify" });
  }
}
