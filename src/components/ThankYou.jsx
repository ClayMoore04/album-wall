import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

const secondaryBtnStyle = {
  padding: "10px 24px",
  border: "1px solid #1e1e1e",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Space Mono', monospace",
  cursor: "pointer",
  background: "transparent",
  color: "#555",
  transition: "all 0.2s",
};

export default function ThankYou({ onAnother, onViewWall, ownerName = "They", submitterName = "" }) {
  const { user } = useAuth();

  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 0",
        animation: "fadeIn 0.3s ease-out",
      }}
    >
      <div style={{ fontSize: 56, marginBottom: 16 }}>🎶</div>
      <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
        You're the best<span style={{ color: palette.accent }}>.</span>
      </h2>
      <p
        style={{
          color: "#555",
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        {ownerName} will listen to the whole album and
        <br />
        get back to you with thoughts.
      </p>
      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button onClick={onAnother} style={secondaryBtnStyle}>
          Submit Another
        </button>
        <button onClick={onViewWall} style={secondaryBtnStyle}>
          View the Wall →
        </button>
      </div>

      {/* Conversion CTA for non-logged-in visitors */}
      {!user && (
        <div
          style={{
            marginTop: 40,
            padding: 24,
            background: `linear-gradient(135deg, rgba(29,185,84,0.08), rgba(255,107,107,0.06))`,
            border: "1px solid #1e1e1e",
            borderRadius: 14,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            You clearly have taste<span style={{ color: palette.accent }}>.</span>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "#555",
              fontFamily: "'Space Mono', monospace",
              lineHeight: 1.5,
              marginBottom: 16,
            }}
          >
            Get your own booth and let friends recommend albums to you.
            <br />
            Takes 30 seconds.
          </p>
          <Link
            to={`/signup${submitterName ? `?name=${encodeURIComponent(submitterName)}` : ""}`}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
              background: palette.accent,
              color: "#000",
            }}
          >
            Open My Booth
          </Link>
        </div>
      )}
    </div>
  );
}
