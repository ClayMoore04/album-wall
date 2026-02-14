import { palette } from "../lib/palette";
import { secondaryBtnStyle } from "../lib/styles";

export default function ThankYou({ onAnother, onViewWall }) {
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
          color: palette.textMuted,
          fontFamily: "'Space Mono', monospace",
          fontSize: 14,
          lineHeight: 1.6,
          marginBottom: 32,
        }}
      >
        Daniel will listen to the whole album and
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
    </div>
  );
}
