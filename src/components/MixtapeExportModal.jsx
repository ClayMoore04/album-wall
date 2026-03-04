import { palette } from "../lib/palette";
import { formatMs } from "../hooks/useMixtapeData";

export default function MixtapeExportModal({
  mixtapeId,
  mixtape,
  tracks,
  totalMs,
  isOwner,
  isCollaborator,
  showExportModal,
  setShowExportModal,
  playlistName,
  setPlaylistName,
  isPublic,
  setIsPublic,
  exporting,
  exportResult,
  setExportResult,
  exportError,
  handleExport,
  connected,
  startSpotifyAuth,
  copiedTracks,
  setCopiedTracks,
  setCopied,
}) {
  if (tracks.length === 0) return null;

  return (
    <>
      {/* Export bottom bar */}
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
          {tracks.length} track{tracks.length !== 1 ? "s" : ""} &middot;{" "}
          {formatMs(totalMs)}
        </span>
        <button
          onClick={() => {
            const text = `${mixtape.title}\n\n${tracks
              .map(
                (t, i) =>
                  `${i + 1}. ${t.track_name} — ${t.artist_name}${
                    t.liner_notes ? `\n   "${t.liner_notes}"` : ""
                  }`
              )
              .join("\n")}\n\n${tracks
              .map((t) => t.spotify_url)
              .filter(Boolean)
              .join("\n")}`;
            navigator.clipboard.writeText(text);
            setCopiedTracks(true);
            setTimeout(() => setCopiedTracks(false), 2000);
          }}
          style={{
            padding: "10px 16px",
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: "transparent",
            color: copiedTracks ? palette.accent : palette.textMuted,
            transition: "all 0.2s",
          }}
        >
          {copiedTracks ? "Copied!" : "Copy tracklist"}
        </button>
        {(isOwner || isCollaborator) && (
          <button
            onClick={() => {
              setShowExportModal(true);
              setExportResult(null);
              setPlaylistName(mixtape.title);
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
            Export to Spotify
          </button>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
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
              setShowExportModal(false);
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
            {exportResult ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
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
                  {exportResult.track_count} tracks
                </p>
                <a
                  href={exportResult.playlist_url}
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
                  Open in Spotify
                </a>
                <div style={{ marginTop: 16 }}>
                  <button
                    onClick={() => {
                      setShowExportModal(false);
                      setExportResult(null);
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
              <>
                <div
                  style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}
                >
                  Export Mixtape
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    marginBottom: 20,
                  }}
                >
                  {tracks.length} track{tracks.length !== 1 ? "s" : ""}{" "}
                  &middot; {formatMs(totalMs)}
                </div>

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
                      background: isPublic ? palette.accent : palette.border,
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
                  {tracks.map((track, i) => (
                    <div
                      key={track.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        padding: "4px 0",
                      }}
                    >
                      <span
                        style={{
                          color: palette.textDim,
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 10,
                          width: 18,
                        }}
                      >
                        {i + 1}
                      </span>
                      {track.album_art_url && (
                        <img
                          src={track.album_art_url}
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
                          {track.track_name}
                        </span>
                        <span style={{ color: palette.textDim }}>
                          {" — "}
                          {track.artist_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {exportError && (
                  <div
                    style={{
                      fontSize: 12,
                      color: palette.coral,
                      fontFamily: "'Space Mono', monospace",
                      marginBottom: 12,
                    }}
                  >
                    {exportError}
                  </div>
                )}

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
                    {exporting ? "Creating Playlist..." : "Export to Spotify"}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sessionStorage.setItem("spotify_return_path", `/mixtape/${mixtapeId}`);
                      startSpotifyAuth();
                    }}
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
                  onClick={() => setShowExportModal(false)}
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
    </>
  );
}
