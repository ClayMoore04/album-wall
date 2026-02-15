import { useState, useMemo } from "react";
import { palette, getColor } from "../lib/palette";
import {
  startSpotifyAuth,
  getValidAccessToken,
  isSpotifyConnected,
  clearTokens,
} from "../lib/spotifyAuth";

export default function PlaylistBuilder({ submissions, loading }) {
  const [selected, setSelected] = useState(new Set());
  const [showModal, setShowModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("Albums from The Wall");
  const [isPublic, setIsPublic] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const connected = isSpotifyConnected();

  const albums = useMemo(
    () => submissions.filter((s) => s.spotify_id),
    [submissions]
  );

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === albums.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(albums.map((a) => a.id)));
    }
  };

  const selectedAlbums = useMemo(
    () => albums.filter((a) => selected.has(a.id)),
    [albums, selected]
  );

  const handleExport = async () => {
    setExporting(true);
    setError(null);

    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        setError("Spotify session expired. Please reconnect.");
        setExporting(false);
        return;
      }

      const albumIds = selectedAlbums.map((a) => a.spotify_id);

      const res = await fetch("/api/spotify-create-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          playlist_name: playlistName,
          is_public: isPublic,
          album_ids: albumIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create playlist");
      }

      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error("Export error:", e);
      setError(e.message || "Failed to create playlist");
    } finally {
      setExporting(false);
    }
  };

  const handleDisconnect = () => {
    clearTokens();
    setResult(null);
    setError(null);
    // Force re-render
    setShowModal(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60, color: palette.textMuted }}>
        Loading...
      </div>
    );
  }

  if (albums.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>🎶</div>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
          }}
        >
          No albums on the wall yet.
          <br />
          Submit some albums first!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Select albums for your playlist
          </div>
          <button
            onClick={selectAll}
            style={{
              padding: "4px 10px",
              border: `1px solid ${palette.border}`,
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              color: palette.textMuted,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {selected.size === albums.length ? "Deselect All" : "Select All"}
          </button>
        </div>
        {connected && (
          <button
            onClick={handleDisconnect}
            style={{
              padding: "4px 10px",
              border: `1px solid ${palette.border}`,
              borderRadius: 6,
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              background: "transparent",
              cursor: "pointer",
            }}
          >
            Disconnect Spotify
          </button>
        )}
      </div>

      {/* Album selection list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {albums.map((sub) => {
          const isSelected = selected.has(sub.id);
          return (
            <button
              key={sub.id}
              onClick={() => toggleSelect(sub.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: isSelected
                  ? "rgba(29,185,84,0.08)"
                  : palette.cardBg,
                border: isSelected
                  ? `1px solid rgba(29,185,84,0.3)`
                  : `1px solid ${palette.border}`,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "left",
                color: palette.text,
                transition: "all 0.15s",
                width: "100%",
              }}
            >
              {/* Checkbox */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: isSelected
                    ? `2px solid ${palette.accent}`
                    : `2px solid ${palette.border}`,
                  background: isSelected ? palette.accent : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 13,
                  color: "#000",
                  fontWeight: 800,
                  transition: "all 0.15s",
                }}
              >
                {isSelected ? "✓" : ""}
              </div>

              {/* Album art */}
              {sub.album_art_url ? (
                <img
                  src={sub.album_art_url}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 6,
                    flexShrink: 0,
                    background: `linear-gradient(135deg, ${getColor(sub.artist_name)}, ${getColor(sub.album_name)})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.9)",
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {(sub.album_name || "?")[0]?.toUpperCase()}
                </div>
              )}

              {/* Album info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sub.album_name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sub.artist_name}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Floating bottom bar */}
      {selected.size > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: palette.surface,
            borderTop: `1px solid ${palette.border}`,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            zIndex: 150,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
              color: palette.textMuted,
            }}
          >
            {selected.size} album{selected.size !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={() => {
              setShowModal(true);
              setResult(null);
              setError(null);
            }}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
              transition: "all 0.2s",
            }}
          >
            Create Playlist
          </button>
        </div>
      )}

      {/* Export Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !exporting) {
              setShowModal(false);
            }
          }}
        >
          <div
            style={{
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 16,
              padding: 28,
              width: "100%",
              maxWidth: 400,
              margin: "0 20px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            {result ? (
              /* Success state */
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div
                  style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}
                >
                  Playlist Created!
                </div>
                <p
                  style={{
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {result.track_count} tracks from {selected.size} albums
                </p>
                <a
                  href={result.playlist_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 24px",
                    background: palette.accent,
                    color: "#000",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 700,
                    textDecoration: "none",
                    fontFamily: "'Space Mono', monospace",
                    marginTop: 16,
                  }}
                >
                  ▶ Open in Spotify
                </a>
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setSelected(new Set());
                      setResult(null);
                    }}
                    style={{
                      padding: "8px 16px",
                      border: `1px solid ${palette.border}`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                      color: palette.textMuted,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Config state */
              <>
                <div
                  style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}
                >
                  Create Playlist
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    marginBottom: 20,
                  }}
                >
                  {selected.size} album{selected.size !== 1 ? "s" : ""}{" "}
                  selected
                </div>

                {/* Playlist name */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "'Space Mono', monospace",
                      color: palette.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      background: palette.bg,
                      border: `1px solid ${palette.border}`,
                      borderRadius: 10,
                      color: palette.text,
                      fontSize: 14,
                      fontFamily: "'Syne', sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Public toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    style={{
                      width: 40,
                      height: 22,
                      borderRadius: 11,
                      border: "none",
                      background: isPublic
                        ? palette.accent
                        : palette.border,
                      cursor: "pointer",
                      position: "relative",
                      transition: "background 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 8,
                        background: "#fff",
                        position: "absolute",
                        top: 3,
                        left: isPublic ? 21 : 3,
                        transition: "left 0.2s",
                      }}
                    />
                  </button>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "'Space Mono', monospace",
                      color: palette.textMuted,
                    }}
                  >
                    {isPublic ? "Public playlist" : "Private playlist"}
                  </span>
                </div>

                {/* Selected albums preview */}
                <div
                  style={{
                    maxHeight: 160,
                    overflowY: "auto",
                    marginBottom: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {selectedAlbums.map((sub) => (
                    <div
                      key={sub.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        padding: "4px 0",
                      }}
                    >
                      {sub.album_art_url && (
                        <img
                          src={sub.album_art_url}
                          alt=""
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 4,
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 600 }}>
                          {sub.album_name}
                        </span>
                        <span style={{ color: palette.textDim }}>
                          {" — "}
                          {sub.artist_name}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleSelect(sub.id)}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: palette.textDim,
                          cursor: "pointer",
                          fontSize: 16,
                          padding: "0 4px",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Error message */}
                {error && (
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.coral,
                      fontFamily: "'Space Mono', monospace",
                      marginBottom: 12,
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Action buttons */}
                {connected ? (
                  <button
                    onClick={handleExport}
                    disabled={exporting || !playlistName.trim()}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      cursor:
                        exporting || !playlistName.trim()
                          ? "not-allowed"
                          : "pointer",
                      background:
                        exporting || !playlistName.trim()
                          ? palette.border
                          : palette.accent,
                      color:
                        exporting || !playlistName.trim()
                          ? palette.textDim
                          : "#000",
                      transition: "all 0.2s",
                      marginBottom: 8,
                    }}
                  >
                    {exporting
                      ? "Creating Playlist..."
                      : "Export to Spotify"}
                  </button>
                ) : (
                  <button
                    onClick={startSpotifyAuth}
                    style={{
                      width: "100%",
                      padding: "14px",
                      border: "none",
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      background: palette.accent,
                      color: "#000",
                      transition: "all 0.2s",
                      marginBottom: 8,
                    }}
                  >
                    Connect Spotify to Export
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  disabled={exporting}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: `1px solid ${palette.border}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    background: "transparent",
                    color: palette.textMuted,
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
