import { useState, useEffect, useRef } from "react";
import { palette } from "../lib/palette";
import { injectAnimations } from "../lib/animations";
import { useToast } from "./Toast";
import { useAuth } from "./AuthProvider";
import CompatibilityBadge from "./CompatibilityBadge";

const BOOTH_PHRASES = [
  "Step into the booth.",
  "Drop into the booth.",
  "Get into the booth.",
  "Welcome to the booth.",
];

function hexToRgb(hex = "#f472b6") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function getBoothPhrase(slug = "") {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  return BOOTH_PHRASES[Math.abs(hash) % BOOTH_PHRASES.length];
}

let headerCssInjected = false;
function injectHeaderCss() {
  if (headerCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-follower-pulse {
      0%   { transform: scale(1); }
      30%  { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(tag);
  headerCssInjected = true;
}

export default function Header({ profile, followerCount, statusText, themeAccent }) {
  injectHeaderCss();
  useEffect(() => { injectAnimations(); }, []);
  const { user } = useAuth();
  const { showToast } = useToast();
  const [pulsing, setPulsing] = useState(false);
  const prevCount = useRef(followerCount);

  const accent = themeAccent || palette.accent;
  const accentRgb = hexToRgb(accent);
  const isOwnWall = user && profile && user.id === profile.id;
  const phrase = getBoothPhrase(profile?.slug || "");

  useEffect(() => {
    if (prevCount.current !== followerCount) {
      prevCount.current = followerCount;
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 400);
      return () => clearTimeout(t);
    }
  }, [followerCount]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Copied!");
  };

  return (
    <header style={{ marginBottom: 24, position: "relative" }}>

      {/* Accent strip */}
      <div style={{
        width: "100%",
        height: 3,
        background: `linear-gradient(90deg, ${accent}, rgba(${accentRgb},0.1))`,
        borderRadius: 2,
        marginBottom: 20,
      }} />

      {/* Main header content */}
      <div style={{ padding: "0 0px" }}>

        {/* Booth label */}
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: accent,
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span>🎙</span>
          <span>{profile?.display_name ? `${profile.display_name}'s Booth` : "The Booth"}</span>
        </div>

        {/* Big name */}
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(28px, 8vw, 42px)",
          fontWeight: 800,
          color: "#e8e6e3",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: "0 0 4px",
        }}>
          {profile?.display_name || "Anonymous"}
        </h1>

        {/* Phrase */}
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14,
          color: `rgba(${accentRgb},0.6)`,
          margin: "0 0 12px",
          fontStyle: "italic",
        }}>
          {phrase}
        </p>

        {/* Bio */}
        <p style={{
          fontFamily: "'Space Mono', monospace",
          color: "#555",
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 440,
          margin: "0 0 8px",
        }}>
          {profile?.bio || "Search for your favorite album on Spotify and tell me why I need to hear it."}
        </p>

        {/* Status text */}
        {statusText && (
          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 12,
            color: "#444",
            fontStyle: "italic",
            margin: "0 0 12px",
          }}>
            "{statusText}"
          </p>
        )}

        {/* Vibe tags */}
        {profile?.vibe_tags?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
            {profile.vibe_tags.map((tag) => (
              <span key={tag} style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 8,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: accent,
                border: `1px solid rgba(${accentRgb},0.3)`,
                borderRadius: 3,
                padding: "2px 7px",
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Footer row: follower count + actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          {followerCount > 0 && (
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: "#3a3a3a",
              letterSpacing: "0.06em",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}>
              <span
                style={{
                  color: accent,
                  fontWeight: 700,
                  display: "inline-block",
                  ...(pulsing ? { animation: "itb-follower-pulse 0.4s ease" } : {}),
                }}
              >
                {followerCount}
              </span>
              <span>FOLLOWERS</span>
            </div>
          )}

          <button
            onClick={handleCopyLink}
            style={{
              background: "transparent",
              border: "1px solid #222",
              borderRadius: 6,
              color: "#333",
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            COPY LINK
          </button>

          {user && profile && !isOwnWall && (
            <CompatibilityBadge userId={profile.id} />
          )}
        </div>
      </div>
    </header>
  );
}
