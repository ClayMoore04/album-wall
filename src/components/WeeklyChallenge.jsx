import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { palette, noiseOverlay } from "../lib/palette";
import { injectAnimations } from "../lib/animations";

let challengeCssInjected = false;
function injectChallengeCss() {
  if (challengeCssInjected) return;
  challengeCssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes challengeGradient {
      0% { border-color: #ef4444; }
      33% { border-color: #ec4899; }
      66% { border-color: #8b5cf6; }
      100% { border-color: #ef4444; }
    }
  `;
  document.head.appendChild(style);
}

function formatTimeLeft(endsAt) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

export default function WeeklyChallenge() {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectAnimations();
    injectChallengeCss();
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.rpc("get_current_challenge");
      if (data && data.length > 0) setChallenge(data[0]);
      setLoading(false);
    })();
  }, []);

  if (loading || !challenge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        position: "relative",
        padding: 24,
        borderRadius: 16,
        border: "2px solid #ef4444",
        animation: "challengeGradient 10s linear infinite",
        background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(139,92,246,0.06))",
        marginBottom: 28,
        overflow: "hidden",
      }}
    >
      {/* Noise texture */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...noiseOverlay,
          pointerEvents: "none",
          borderRadius: 14,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Badge + countdown */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: "#ef4444",
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            WEEKLY CHALLENGE
          </span>
          <span
            style={{
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              color: "#555",
            }}
          >
            {formatTimeLeft(challenge.ends_at)}
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            marginBottom: 8,
            lineHeight: 1.2,
          }}
        >
          {challenge.title}
        </div>

        {/* Prompt */}
        <div
          style={{
            fontSize: 13,
            color: "#777",
            lineHeight: 1.5,
            marginBottom: 16,
          }}
        >
          {challenge.prompt}
        </div>

        {/* Stats + CTA */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#555",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {challenge.entry_count} entr{challenge.entry_count === 1 ? "y" : "ies"}
          </span>
          <Link
            to="/mixtapes"
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              background: "#ef4444",
              color: "#000",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
            }}
          >
            Enter challenge
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
