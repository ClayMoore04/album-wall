import { useState } from "react";
import { palette } from "../lib/palette";
import { formatMs } from "../hooks/useMixtapeData";

function GatefoldTrack({ track, position, accent, onPlay, isPlaying }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 0",
        borderBottom: `1px solid ${palette.border}08`,
        cursor: track.spotify_id ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onClick={() => track.spotify_id && onPlay(track)}
    >
      {/* Position number */}
      <span
        style={{
          width: 24,
          flexShrink: 0,
          fontSize: 12,
          fontFamily: "'Space Mono', monospace",
          color: isPlaying ? accent : palette.textDim,
          paddingTop: 2,
          textAlign: "right",
        }}
      >
        {isPlaying ? "▶" : String(position).padStart(2, "0")}
      </span>

      {/* Album art thumbnail */}
      {track.album_art_url ? (
        <img
          src={track.album_art_url}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 4,
            background: palette.surface,
            flexShrink: 0,
          }}
        />
      )}

      {/* Track info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              color: isPlaying ? accent : palette.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {track.track_name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              flexShrink: 0,
            }}
          >
            {formatMs(track.duration_ms)}
          </span>
        </div>

        <div
          style={{
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: palette.textMuted,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.artist_name}
          {track.album_name ? ` — ${track.album_name}` : ""}
        </div>

        {/* Liner notes */}
        {track.liner_notes && (
          <div
            style={{
              marginTop: 8,
              paddingLeft: 12,
              borderLeft: `2px solid ${accent}`,
              fontSize: 12,
              fontStyle: "italic",
              color: palette.textMuted,
              lineHeight: 1.5,
            }}
          >
            "{track.liner_notes}"
          </div>
        )}

        {/* Added by (collab tapes) */}
        {(track.profiles?.display_name || track.added_by_name) && (
          <div
            style={{
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              marginTop: 4,
            }}
          >
            added by {track.profiles?.display_name || track.added_by_name}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GatefoldTrackList({
  tracks,
  sideATracks,
  sideBTracks,
  sideBStartIndex,
  sideAMs,
  sideBMs,
  accent,
}) {
  const [playingTrack, setPlayingTrack] = useState(null);

  const handlePlay = (track) => {
    setPlayingTrack(playingTrack?.id === track.id ? null : track);
  };

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Side A header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            letterSpacing: 3,
            textTransform: "uppercase",
            color: accent,
          }}
        >
          SIDE A
        </span>
        <span
          style={{
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
          }}
        >
          {formatMs(sideAMs)}
        </span>
      </div>

      {/* Side A tracks */}
      {sideATracks.map((track, i) => (
        <GatefoldTrack
          key={track.id}
          track={track}
          position={i + 1}
          accent={accent}
          onPlay={handlePlay}
          isPlaying={playingTrack?.id === track.id}
        />
      ))}

      {/* Spotify player for playing track (Side A) */}
      {playingTrack &&
        sideATracks.some((t) => t.id === playingTrack.id) &&
        playingTrack.spotify_id && (
          <div
            style={{
              margin: "12px 0",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <iframe
              key={playingTrack.spotify_id}
              src={`https://open.spotify.com/embed/track/${playingTrack.spotify_id}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 8 }}
            />
          </div>
        )}

      {/* Side B divider */}
      {sideBTracks.length > 0 && (
        <>
          <div
            style={{
              textAlign: "center",
              padding: "28px 0",
              margin: "16px 0",
              borderTop: `1px solid ${palette.border}`,
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: accent,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              FLIP THE RECORD
            </div>
            <div
              style={{
                fontSize: 10,
                fontFamily: "'Space Mono', monospace",
                color: palette.textDim,
                marginTop: 4,
              }}
            >
              — SIDE B —
            </div>
          </div>

          {/* Side B header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                letterSpacing: 3,
                textTransform: "uppercase",
                color: accent,
              }}
            >
              SIDE B
            </span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "'Space Mono', monospace",
                color: palette.textDim,
              }}
            >
              {formatMs(sideBMs)}
            </span>
          </div>

          {/* Side B tracks */}
          {sideBTracks.map((track, i) => (
            <GatefoldTrack
              key={track.id}
              track={track}
              position={sideBStartIndex + i + 1}
              accent={accent}
              onPlay={handlePlay}
              isPlaying={playingTrack?.id === track.id}
            />
          ))}

          {/* Spotify player for playing track (Side B) */}
          {playingTrack &&
            sideBTracks.some((t) => t.id === playingTrack.id) &&
            playingTrack.spotify_id && (
              <div
                style={{
                  margin: "12px 0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <iframe
                  key={playingTrack.spotify_id}
                  src={`https://open.spotify.com/embed/track/${playingTrack.spotify_id}?utm_source=generator&theme=0`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}
        </>
      )}

      {tracks.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: palette.textMuted,
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          This mixtape is empty.
        </div>
      )}
    </div>
  );
}
