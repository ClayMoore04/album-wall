import { palette, getColor } from "../lib/palette";

export default function RoomTrackCard({ track, addedByName, canRemove, onRemove }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
      }}
    >
      {track.album_art_url ? (
        <img
          src={track.album_art_url}
          alt=""
          style={{
            width: 42,
            height: 42,
            borderRadius: track.type === "track" ? 4 : 6,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: track.type === "track" ? 4 : 6,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${getColor(track.artist_name)}, ${getColor(track.album_name)})`,
          }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track.album_name}
          </div>
          {track.type === "track" && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                padding: "1px 5px",
                borderRadius: 3,
                background: "rgba(255,107,107,0.15)",
                color: palette.coral,
              }}
            >
              Song
            </span>
          )}
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
          {track.artist_name}
          {addedByName && (
            <span style={{ color: palette.textDim }}>
              {" "}
              &middot; added by {addedByName}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
        {track.spotify_url && (
          <a
            href={track.spotify_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              color: palette.accent,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ▶
          </a>
        )}
        {canRemove && (
          <button
            onClick={() => onRemove(track.id)}
            style={{
              width: 24,
              height: 24,
              border: `1px solid ${palette.border}`,
              borderRadius: 12,
              background: "transparent",
              color: palette.textMuted,
              cursor: "pointer",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Remove"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
