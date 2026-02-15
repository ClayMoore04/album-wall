import { palette } from "../lib/palette";
import { getColor } from "../lib/palette";

export default function AlbumPreview({ album, onClear }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      {album.imageUrl ? (
        <img
          src={album.imageUrl}
          alt={album.name}
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${getColor(album.artist)}, ${getColor(album.name)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'Syne', sans-serif",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          }}
        >
          {album.name[0]?.toUpperCase()}
        </div>
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
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {album.name}
          </div>
          {album.type && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                padding: "1px 5px",
                borderRadius: 3,
                background:
                  album.type === "track"
                    ? "rgba(255,107,107,0.15)"
                    : "rgba(29,185,84,0.15)",
                color:
                  album.type === "track" ? palette.coral : palette.accent,
              }}
            >
              {album.type === "track" ? "Song" : "Album"}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {album.artist}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <a
          href={album.spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "6px 12px",
            background: palette.accent,
            color: "#000",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            textDecoration: "none",
            fontFamily: "'Space Mono', monospace",
          }}
        >
          ▶ Spotify
        </a>
        <button
          onClick={onClear}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            border: `1px solid ${palette.border}`,
            borderRadius: 20,
            background: "transparent",
            color: palette.textMuted,
            cursor: "pointer",
            fontSize: 14,
          }}
          title="Clear selection"
        >
          ×
        </button>
      </div>
    </div>
  );
}
