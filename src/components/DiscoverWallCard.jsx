import { Link } from "react-router-dom";
import { palette, getColor } from "../lib/palette";
import FollowButton from "./FollowButton";

export default function DiscoverWallCard({ wall }) {
  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: `linear-gradient(135deg, ${getColor(wall.display_name)}, ${getColor(wall.slug)})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 800,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'Syne', sans-serif",
            flexShrink: 0,
          }}
        >
          {wall.display_name[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {wall.display_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              display: "flex",
              gap: 10,
            }}
          >
            <span>
              {wall.follower_count} follower
              {wall.follower_count !== 1 ? "s" : ""}
            </span>
            <span>
              {wall.submission_count} album
              {wall.submission_count !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {wall.bio && (
        <div
          style={{
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            lineHeight: 1.5,
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {wall.bio}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Link
          to={`/${wall.slug}`}
          style={{
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            color: palette.accent,
            textDecoration: "none",
          }}
        >
          Visit wall {"\u2192"}
        </Link>
        <FollowButton wallId={wall.id} />
      </div>
    </div>
  );
}
