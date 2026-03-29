import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

const ACCENT = palette.accent;
const ACCENT_RGB = "244,114,182";

// Mock album cards for the booth preview
const MOCK_ALBUMS = [
  { gradient: "linear-gradient(135deg,#f97316,#f472b6)", initials: "OK" },
  { gradient: "linear-gradient(135deg,#06b6d4,#3b82f6)", initials: "KA" },
  { gradient: "linear-gradient(135deg,#a855f7,#f472b6)", initials: "IF" },
];

function MockBoothPreview({ name }) {
  const slug = (name || "you").toLowerCase().replace(/\s+/g, "").slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 14,
        padding: "20px 18px 16px",
        position: "relative",
        overflow: "hidden",
        maxWidth: 320,
        margin: "0 auto",
      }}
    >
      {/* Top accent strip */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `rgba(${ACCENT_RGB},0.35)`,
        pointerEvents: "none",
      }} />

      {/* Booth header */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 18,
          fontWeight: 800,
          color: "#e8e6e3",
          lineHeight: 1.1,
        }}>
          {name || "Your"}'s Booth<span style={{ color: ACCENT }}>.</span>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 8,
          color: "#333",
          letterSpacing: "0.08em",
          marginTop: 4,
        }}>
          thebooth.app/{slug}
        </div>
      </div>

      {/* Mock album cards — staggered entrance */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {MOCK_ALBUMS.map((album, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.5 + i * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 24,
            }}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              background: "rgba(255,255,255,0.02)",
              borderRadius: 8,
              padding: "8px 10px",
              border: "1px solid #181818",
            }}
          >
            <div style={{
              width: 36, height: 36,
              borderRadius: 5,
              background: album.gradient,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
              fontSize: 10,
              fontWeight: 800,
              color: "rgba(255,255,255,0.3)",
            }}>
              {album.initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 8,
                width: "70%",
                background: "#1e1e1e",
                borderRadius: 4,
                marginBottom: 4,
              }} />
              <div style={{
                height: 6,
                width: "45%",
                background: "#161616",
                borderRadius: 3,
              }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Frosted glass overlay to show it's a preview */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 40,
        background: "linear-gradient(transparent, #111)",
        pointerEvents: "none",
      }} />
    </motion.div>
  );
}

export default function ThankYou({ onAnother, onViewWall, ownerName = "They", submitterName = "", accent = ACCENT }) {
  const { user } = useAuth();
  const accentRgb = ACCENT_RGB;

  return (
    <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div style={{
          width: 48, height: 48,
          borderRadius: "50%",
          background: `rgba(${accentRgb},0.1)`,
          border: `1px solid rgba(${accentRgb},0.3)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 14px",
          fontSize: 22,
        }}>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 15 }}
          >
            &#10003;
          </motion.span>
        </div>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          color: "#e8e6e3",
          margin: "0 0 6px",
        }}
      >
        Album dropped<span style={{ color: accent }}>.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "#444",
          letterSpacing: "0.04em",
          lineHeight: 1.6,
          margin: "0 0 20px",
        }}
      >
        {ownerName} will listen and get back to you.
      </motion.p>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: user ? 0 : 28,
        }}
      >
        <button
          onClick={onAnother}
          style={{
            padding: "8px 18px",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: "transparent",
            color: "#555",
            transition: "all 0.15s",
            letterSpacing: "0.04em",
          }}
        >
          DROP ANOTHER
        </button>
        <button
          onClick={onViewWall}
          style={{
            padding: "8px 18px",
            border: "1px solid #1e1e1e",
            borderRadius: 8,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            background: "transparent",
            color: "#555",
            transition: "all 0.15s",
            letterSpacing: "0.04em",
          }}
        >
          VIEW THE WALL
        </button>
      </motion.div>

      {/* Conversion funnel — only for non-logged-in visitors */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          style={{
            padding: "24px 16px 20px",
            background: `linear-gradient(180deg, rgba(${accentRgb},0.06) 0%, transparent 100%)`,
            border: "1px solid #1a1a1a",
            borderRadius: 14,
          }}
        >
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: `rgba(${accentRgb},0.5)`,
            marginBottom: 8,
          }}>
            YOU CLEARLY HAVE TASTE
          </div>

          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 16,
            fontWeight: 800,
            color: "#e8e6e3",
            lineHeight: 1.2,
            marginBottom: 4,
          }}>
            Get your own booth<span style={{ color: accent }}>.</span>
          </div>

          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: "#333",
            lineHeight: 1.5,
            marginBottom: 16,
            letterSpacing: "0.03em",
          }}>
            Let friends recommend albums to you. Takes 30 seconds.
          </p>

          {/* Mock booth preview showing what THEIR booth would look like */}
          <MockBoothPreview name={submitterName} />

          {/* CTA button with ambient glow */}
          <div style={{ marginTop: 18, position: "relative" }}>
            {/* Ambient glow behind button */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 200, height: 40,
              borderRadius: 20,
              background: accent,
              filter: "blur(24px)",
              opacity: 0.15,
              pointerEvents: "none",
            }} />

            <Link
              to={`/signup${submitterName ? `?name=${encodeURIComponent(submitterName)}&ref=wall` : "?ref=wall"}`}
              style={{
                position: "relative",
                display: "inline-block",
                padding: "12px 28px",
                border: "none",
                borderRadius: 8,
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textDecoration: "none",
                background: accent,
                color: "#000",
                transition: "transform 0.15s",
              }}
            >
              OPEN MY BOOTH
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
