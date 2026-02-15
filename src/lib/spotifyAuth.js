const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = "playlist-modify-public playlist-modify-private";
const TOKEN_KEY = "spotify_auth";

// ─── PKCE Helpers ────────────────────────────────────────────────────────────

function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generateCodeChallenge(verifier) {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

// ─── Auth Flow ───────────────────────────────────────────────────────────────

export async function startSpotifyAuth() {
  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier for the callback
  sessionStorage.setItem("spotify_code_verifier", verifier);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: challenge,
    scope: SCOPES,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem("spotify_code_verifier");
  if (!verifier) throw new Error("Missing code verifier");

  const res = await fetch("/api/spotify-auth-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: REDIRECT_URI, code_verifier: verifier }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json();
  sessionStorage.removeItem("spotify_code_verifier");

  saveTokens(data);
  return data;
}

// ─── Token Storage ───────────────────────────────────────────────────────────

function saveTokens({ access_token, refresh_token, expires_in }) {
  const tokenData = {
    access_token,
    refresh_token,
    expires_at: Date.now() + expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData));
}

export function getStoredTokens() {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function getValidAccessToken() {
  const tokens = getStoredTokens();
  if (!tokens) return null;

  // If token is still valid (with 60s buffer), return it
  if (Date.now() < tokens.expires_at - 60000) {
    return tokens.access_token;
  }

  // Try to refresh
  if (!tokens.refresh_token) return null;

  try {
    const res = await fetch("/api/spotify-refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: tokens.refresh_token }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    saveTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token || tokens.refresh_token,
      expires_in: data.expires_in,
    });

    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export function isSpotifyConnected() {
  return getStoredTokens() !== null;
}
