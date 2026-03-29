import { useState } from "react";
import { Link } from "react-router-dom";
import { getColor } from "../lib/palette";
import { injectAnimations } from "../lib/animations";
import FollowButton from "./FollowButton";
import CompatibilityBadge from "./CompatibilityBadge";

let discoverCssInjected = false;
function injectDiscoverCss() {
  if (discoverCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(tag);
  discoverCssInjected = true;
}

function hexToRgb(hex = "#f472b6") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function nameToGradient(name = "") {
  const GRADIENTS = [
    ["#f97316", "#f472b6"],
    ["#a855f7", "#3b82f6"],
    ["#06b6d4", "#1DB954"],
    ["#f5d547", "#f97316"],
    ["#f472b6", "#a855f7"],
    ["#3b82f6", "#06b6d4"],
    ["#1DB954", "#059669"],
    ["#dc2626", "#f97316"],
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const [a, b] = GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  return { gradient: `linear-gradient(135deg, ${a}, ${b})`, accent: a };
}

export default function DiscoverWallCard({ wall, entranceIndex = 0 }) {
  injectDiscoverCss();
  injectAnimations();

  const [hovered, setHovered] = useState(false);
  const { gradient, accent } = nameToGradient(wall.display_name);
  const accentRgb = hexToRgb(accent);
  const initials = (wall.display_name || "?")
    .split(" ").map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: "#111",
        borderRadius: 12,
        border: `1px solid ${hovered ? `rgba(${accentRgb},0.35)` : "#1e1e1e"}`,
        overflow: "hidden",
        transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 24px rgba(${accentRgb},0.08)` : "none",
        animation: "booth-fadeInUp 0.3s ease both",
        animationDelay: `${entranceIndex * 0.04}s`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Static trim */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `rgba(${accentRgb},0.35)`,
        opacity: hovered ? 0 : 1,
        transition: "opacity 0.2s",
        zIndex: 1, pointerEvents: "none",
      }} />
      {/* Shimmer trim */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,
          transparent 0%,
          rgba(${accentRgb},0.3) 20%,
          rgba(${accentRgb},1) 50%,
          rgba(${accentRgb},0.3) 80%,
          transparent 100%)`,
        backgroundSize: "200% 100%",
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.2s",
        animation: hovered ? "itb-shimmer 1.2s ease infinite" : "none",
        zIndex: 2, pointerEvents: "none",
      }} />

      <div style={{ padding: "14px 14px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: "50%",
            background: gradient,
            flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Syne', sans-serif",
            fontSize: 14, fontWeight: 800,
            color: "rgba(255,255,255,0.85)",
            userSelect: "none",
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 14, fontWeight: 700,
              color: "#e8e6e3",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              lineHeight: 1.2,
            }}>
              {wall.display_name}
            </div>
            <div style={{
              display: "flex", gap: 8, marginTop: 3,
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, color: "#3a3a3a",
              letterSpacing: "0.05em",
            }}>
              <span style={{ color: accent }}>{wall.follower_count ?? 0}</span>
              <span>followers</span>
              <span style={{ color: "#252525" }}>·</span>
              <span style={{ color: accent }}>{wall.submission_count ?? 0}</span>
              <span>albums</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        {wall.bio && (
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 11, color: "#444",
            lineHeight: 1.55, marginBottom: 10,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {wall.bio}
          </p>
        )}

        {/* Vibe tags */}
        {wall.vibe_tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {wall.vibe_tags.slice(0, 4).map((tag) => (
              <span key={tag} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 7,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accent,
                border: `1px solid rgba(${accentRgb},0.25)`,
                borderRadius: 3,
                padding: "2px 5px",
              }}>{tag}</span>
            ))}
          </div>
        )}

        <CompatibilityBadge userId={wall.id} compact />

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 10,
          borderTop: "1px solid #181818",
        }}>
          <Link
            to={`/${wall.slug}`}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, letterSpacing: "0.06em",
              color: accent,
              textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            VISIT WALL <span style={{ fontSize: 11 }}>→</span>
          </Link>
          <FollowButton wallId={wall.id} />
        </div>
      </div>
    </div>
  );
}
