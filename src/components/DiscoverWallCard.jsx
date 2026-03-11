import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { palette, getColor } from "../lib/palette";
import { injectAnimations } from "../lib/animations";
import FollowButton from "./FollowButton";
import CompatibilityBadge from "./CompatibilityBadge";

export default function DiscoverWallCard({ wall, entranceIndex }) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => { injectAnimations(); }, []);

  const entranceDelay = entranceIndex != null ? `${Math.min(entranceIndex, 8) * 0.06}s` : undefined;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: palette.cardBg,
        border: `1px solid ${hovered ? "rgba(29,185,84,0.3)" : palette.border}`,
        borderRadius: 14,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 20px rgba(29,185,84,0.12)" : "none",
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        ...(entranceDelay != null ? {
          animation: "booth-fadeInUp 0.35s ease both",
          animationDelay: entranceDelay,
        } : {}),
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

      <CompatibilityBadge userId={wall.id} compact />

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
