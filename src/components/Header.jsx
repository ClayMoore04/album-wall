import { useState, useEffect, useRef } from "react";
import { palette } from "../lib/palette";
import { injectAnimations } from "../lib/animations";
import { useToast } from "./Toast";

const boothPhrases = [
  "Step into the booth",
  "Drop into the booth",
  "Get into the booth",
];

export default function Header({
  profile,
  followerCount,
  statusText,
  themeAccent,
}) {
  const accent = themeAccent || palette.accent;
  const [boothPhrase] = useState(() => boothPhrases[Math.floor(Math.random() * boothPhrases.length)]);
  const { showToast } = useToast();
  const prevCount = useRef(followerCount);
  const [pulsing, setPulsing] = useState(false);

  useEffect(() => { injectAnimations(); }, []);

  useEffect(() => {
    if (prevCount.current !== followerCount) {
      prevCount.current = followerCount;
      setPulsing(true);
      const t = setTimeout(() => setPulsing(false), 300);
      return () => clearTimeout(t);
    }
  }, [followerCount]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Copied!");
  };

  return (
    <header style={{ textAlign: "center", marginBottom: 40, paddingTop: 24 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: 3,
          textTransform: "uppercase",
          color: accent,
          marginBottom: 12,
          opacity: 0.8,
        }}
      >
        <span style={{ fontSize: 16 }}>🎙</span> {profile?.display_name || "Someone"}'s Booth
      </div>
      <h1
        style={{
          fontSize: "clamp(28px, 6vw, 42px)",
          fontWeight: 800,
          lineHeight: 1.1,
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        {boothPhrase}<span style={{ color: accent }}>.</span>
      </h1>
      <p
        style={{
          color: palette.textMuted,
          fontSize: 15,
          lineHeight: 1.5,
          maxWidth: 440,
          margin: "0 auto",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        {profile?.bio || "Search for your favorite album on Spotify and tell me why I need to hear it."}
      </p>

      {/* Status text */}
      {statusText && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            color: accent,
            fontStyle: "italic",
            opacity: 0.7,
          }}
        >
          {statusText}
        </div>
      )}

      {followerCount > 0 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
          }}
        >
          <span style={pulsing ? { display: "inline-block", animation: "booth-countPulse 0.3s ease" } : undefined}>
            {followerCount} follower{followerCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <button
        onClick={handleCopyLink}
        style={{
          marginTop: 12,
          padding: "8px 16px",
          borderRadius: 8,
          border: `1px solid ${palette.border}`,
          background: "transparent",
          color: palette.textMuted,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          cursor: "pointer",
          transition: "color 0.2s",
        }}
      >
        Copy booth link
      </button>
    </header>
  );
}
