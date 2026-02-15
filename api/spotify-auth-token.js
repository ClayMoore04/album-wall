export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, redirect_uri, code_verifier } = req.body;

  if (!code || !redirect_uri || !code_verifier) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier,
      }),
    });

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      console.error("Spotify token exchange error:", tokenRes.status, errorBody);
      return res.status(tokenRes.status).json({ error: "Token exchange failed" });
    }

    const data = await tokenRes.json();

    return res.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (e) {
    console.error("Token exchange error:", e);
    return res.status(500).json({ error: "Token exchange failed" });
  }
}
