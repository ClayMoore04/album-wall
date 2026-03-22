import { useState } from "react";
import { palette } from "../lib/palette";

const MAX_DURATION_MS = 90 * 60 * 1000;

function extractPlaylistId(input) {
  const match = input.match(
    /(?:spotify\.com\/playlist\/|spotify:playlist:)([a-zA-Z0-9]+)/
  );
  return match ? match[1] : null;
}

function formatMs(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function SpotifyPlaylistImportModal({
  onImport,
  onClose,
  spotifyAccessToken,
}) {
  const [url, setUrl] = useState("");
  const [tracks, setTracks] = useState(null);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetch = async () => {
    const id = extractPlaylistId(url);
    if (!id) {
      setError("Paste a valid Spotify playlist URL.");
      return;
    }
    if (!spotifyAccessToken) {
      setError("Connect Spotify first to import playlists.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/spotify-playlist-tracks?id=${id}&access_token=${encodeURIComponent(
          spotifyAccessToken
        )}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch playlist");
      }
      const data = await res.json();
      setPlaylistName(data.name || "Imported Playlist");
      setTracks(data.tracks || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalMs = tracks
    ? tracks.reduce((sum, t) => sum + (t.durationMs || 0), 0)
    : 0;
  const isOverLimit = totalMs > MAX_DURATION_MS;

  const trimmedTracks = tracks
    ? (() => {
        let running = 0;
        const result = [];
        for (const t of tracks) {
          if (running + t.durationMs > MAX_DURATION_MS) break;
          running += t.durationMs;
          result.push(t);
        }
        return result;
      })()
    : [];

  const handleImport = () => {
    onImport({
      name: playlistName,
      tracks: isOverLimit ? trimmedTracks : tracks,
    });
  };

  const inputStyle = {
    flex: 1,
    padding: "10px 14px",
    background: "#0e0e0e",
    border: "1px solid #1e1e1e",
    borderRadius: 10,
    color: "#e8e6e3",
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 16,
          padding: 24,
          maxWidth: 480,
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Import from Spotify
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#555",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            \u2715
          </button>
        </div>

        {!tracks ? (
          <>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Spotify playlist URL..."
                onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                style={inputStyle}
              />
              <button
                onClick={handleFetch}
                disabled={loading || !url.trim()}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: palette.accent,
                  color: "#000",
                  opacity: loading || !url.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                {loading ? "Loading..." : "Fetch"}
              </button>
            </div>
            {!spotifyAccessToken && (
              <div
                style={{
                  fontSize: 11,
                  color: "#ef4444",
                  fontFamily: "'Space Mono', monospace",
                  marginBottom: 8,
                }}
              >
                You need to connect Spotify first (via your profile settings).
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {playlistName}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#555",
                  fontFamily: "'Space Mono', monospace",
                  marginTop: 4,
                  display: "flex",
                  gap: 12,
                }}
              >
                <span>{tracks.length} tracks</span>
                <span>{formatMs(totalMs)} total</span>
              </div>
              {isOverLimit && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    fontFamily: "'Space Mono', monospace",
                    marginTop: 6,
                  }}
                >
                  Over 90 min limit \u2014 importing first {trimmedTracks.length}{" "}
                  tracks ({formatMs(
                    trimmedTracks.reduce((s, t) => s + t.durationMs, 0)
                  )}
                  )
                </div>
              )}
            </div>

            <div
              style={{
                maxHeight: 300,
                overflowY: "auto",
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #1e1e1e",
              }}
            >
              {(isOverLimit ? trimmedTracks : tracks).map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 12px",
                    borderBottom:
                      i < (isOverLimit ? trimmedTracks : tracks).length - 1
                        ? "1px solid #1e1e1e"
                        : "none",
                  }}
                >
                  {t.imageUrl && (
                    <img
                      src={t.imageUrl}
                      alt=""
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 4,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#555",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      {t.artist}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#333",
                      fontFamily: "'Space Mono', monospace",
                      flexShrink: 0,
                    }}
                  >
                    {formatMs(t.durationMs)}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleImport}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: palette.accent,
                  color: "#000",
                }}
              >
                Import {isOverLimit ? trimmedTracks.length : tracks.length}{" "}
                tracks
              </button>
              <button
                onClick={() => {
                  setTracks(null);
                  setUrl("");
                }}
                style={{
                  padding: "12px 18px",
                  border: "1px solid #1e1e1e",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                  background: "transparent",
                  color: "#555",
                }}
              >
                Back
              </button>
            </div>
          </>
        )}

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "#ef4444",
              fontFamily: "'Space Mono', monospace",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
