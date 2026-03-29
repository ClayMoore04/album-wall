import { palette } from "../lib/palette";
import { formatMs } from "../hooks/useMixtapeData";

export default function MixtapeProgress({
  tracks,
  totalMs,
  remainingMs,
  progressPercent,
  isOverTime,
  isNearFull,
  MAX_DURATION_MS,
  sideAMs,
  sideBMs,
  tapeWarning,
  topPlayerIndex,
  setTopPlayerIndex,
  playingTrackId,
  setPlayingTrackId,
  mixtape,
  currentTurn,
  isMyTurn,
}) {
  return (
    <>
      {/* Time Bar */}
      <div
        style={{
          background: "#111",
          border: `1px solid #1e1e1e`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 8,
          }}
        >
          <span style={{ color: "#e8e6e3", fontWeight: 700 }}>
            {formatMs(totalMs)} / 90:00
          </span>
          <span
            style={{
              color: isOverTime ? "#ef4444" : "#555",
            }}
          >
            {isOverTime
              ? `${formatMs(totalMs - MAX_DURATION_MS)} over!`
              : `${formatMs(remainingMs)} remaining`}
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "#1e1e1e",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              borderRadius: 3,
              background: isNearFull ? "#ef4444" : palette.accent,
              transition: "width 0.3s, background 0.3s",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: -1,
              bottom: -1,
              width: 2,
              background: "#333",
              borderRadius: 1,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            marginTop: 6,
          }}
        >
          <span style={{ color: palette.accent }}>
            SIDE A ({formatMs(sideAMs)})
          </span>
          <span style={{ color: "#ef4444" }}>
            SIDE B ({formatMs(sideBMs)})
          </span>
        </div>
      </div>

      {/* Top player */}
      {topPlayerIndex !== null && tracks[topPlayerIndex] && (
        <div
          style={{
            background: "#111",
            border: `1px solid #1e1e1e`,
            borderRadius: 10,
            padding: "12px 14px",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                color: "#555",
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              Now playing ({topPlayerIndex + 1}/{tracks.length})
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setTopPlayerIndex((i) => Math.max(0, i - 1))}
                disabled={topPlayerIndex === 0}
                style={{
                  padding: "4px 10px",
                  border: `1px solid #1e1e1e`,
                  borderRadius: 6,
                  background: "transparent",
                  color: topPlayerIndex === 0 ? "#333" : "#555",
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  cursor: topPlayerIndex === 0 ? "default" : "pointer",
                }}
              >
                Prev
              </button>
              <button
                onClick={() =>
                  setTopPlayerIndex((i) => Math.min(tracks.length - 1, i + 1))
                }
                disabled={topPlayerIndex === tracks.length - 1}
                style={{
                  padding: "4px 10px",
                  border: `1px solid #1e1e1e`,
                  borderRadius: 6,
                  background: "transparent",
                  color:
                    topPlayerIndex === tracks.length - 1
                      ? "#333"
                      : "#555",
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  cursor:
                    topPlayerIndex === tracks.length - 1 ? "default" : "pointer",
                }}
              >
                Next
              </button>
              <button
                onClick={() => setTopPlayerIndex(null)}
                style={{
                  padding: "4px 10px",
                  border: `1px solid #1e1e1e`,
                  borderRadius: 6,
                  background: "transparent",
                  color: "#ef4444",
                  fontSize: 11,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            {tracks[topPlayerIndex].track_name}
            <span style={{ color: "#555", fontWeight: 400 }}>
              {" "}
              — {tracks[topPlayerIndex].artist_name}
            </span>
          </div>
          <iframe
            key={tracks[topPlayerIndex].spotify_id}
            src={`https://open.spotify.com/embed/track/${tracks[topPlayerIndex].spotify_id}?utm_source=generator&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 8 }}
          />
        </div>
      )}

      {/* Play all button */}
      {tracks.length > 0 && topPlayerIndex === null && (
        <div style={{ textAlign: "center", marginBottom: 12 }}>
          <button
            onClick={() => setTopPlayerIndex(0)}
            style={{
              padding: "8px 20px",
              border: `1px solid #1e1e1e`,
              borderRadius: 8,
              background: "transparent",
              color: palette.accent,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ▶ Preview mixtape
          </button>
        </div>
      )}

      {/* Turn indicator */}
      {mixtape.is_collab && mixtape.collab_mode === "turns" && currentTurn && (
        <div
          style={{
            textAlign: "center",
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
            borderRadius: 8,
            background: isMyTurn
              ? "rgba(244,114,182,0.08)"
              : "rgba(255,255,255,0.03)",
            border: `1px solid ${isMyTurn ? "rgba(244,114,182,0.2)" : "#1e1e1e"}`,
            color: isMyTurn ? palette.accent : "#555",
          }}
        >
          {isMyTurn
            ? "Your turn! Pick a track."
            : `Waiting for ${currentTurn.displayName}'s pick...`}
        </div>
      )}

      {/* Tape warning */}
      {tapeWarning && (
        <div
          style={{
            textAlign: "center",
            padding: "8px 14px",
            marginBottom: 12,
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            color: "#ef4444",
            background: "rgba(239,68,68,0.08)",
            border: `1px solid rgba(239,68,68,0.2)`,
            borderRadius: 8,
          }}
        >
          {tapeWarning}
        </div>
      )}
    </>
  );
}
