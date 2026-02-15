import { palette } from "../lib/palette";

export default function Header({ profile }) {
  return (
    <header style={{ textAlign: "center", marginBottom: 40 }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: 3,
          textTransform: "uppercase",
          color: palette.accent,
          marginBottom: 12,
          opacity: 0.8,
        }}
      >
        <span style={{ fontSize: 16 }}>💿</span> {profile?.display_name || "Album"}'s Album Wall
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
        Drop me an album<span style={{ color: palette.accent }}>.</span>
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
    </header>
  );
}
