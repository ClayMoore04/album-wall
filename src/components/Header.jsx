import { palette } from "../lib/palette";
import { getBannerCss, getThemeAccent } from "../lib/themes";

export default function Header({
  profile,
  followerCount,
  bannerStyle,
  bannerUrl,
  statusText,
  themeAccent,
}) {
  const accent = themeAccent || palette.accent;
  const bannerCss = getBannerCss(bannerStyle, bannerUrl);

  return (
    <header style={{ textAlign: "center", marginBottom: 40, paddingTop: bannerCss ? 0 : 24 }}>
      {/* Banner */}
      {bannerCss && (
        <div
          style={{
            width: "calc(100% + 40px)",
            marginLeft: -20,
            marginBottom: 24,
            height: 120,
            borderRadius: 12,
            background: bannerCss,
            opacity: 0.85,
          }}
        />
      )}

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
        Slide into the booth<span style={{ color: accent }}>.</span>
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
          {followerCount} follower{followerCount !== 1 ? "s" : ""}
        </div>
      )}
    </header>
  );
}
