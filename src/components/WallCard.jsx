import { palette, getColor } from "../lib/palette";

export default function WallCard({ submission }) {
  const sub = submission;

  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        padding: 16,
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
      }}
    >
      {/* Album art or gradient fallback */}
      {sub.album_art_url ? (
        <img
          src={sub.album_art_url}
          alt={sub.album_name}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            objectFit: "cover",
            flexShrink: 0,
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        />
      ) : (
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            flexShrink: 0,
            background: `linear-gradient(135deg, ${getColor(sub.artist_name)}, ${getColor(sub.album_name)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 800,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'Syne', sans-serif",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
          }}
        >
          {(sub.album_name || "?")[0]?.toUpperCase()}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
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
                fontSize: 12,
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
          {sub.spotify_url && (
            <a
              href={sub.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flexShrink: 0,
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
                whiteSpace: "nowrap",
              }}
            >
              ▶ Spotify
            </a>
          )}
        </div>
        {sub.note && (
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              color: palette.textMuted,
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            "{sub.note}"
          </div>
        )}
        <div
          style={{
            marginTop: 6,
            fontSize: 11,
            color: palette.textDim,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          from {sub.submitted_by}
        </div>
      </div>
    </div>
  );
}
