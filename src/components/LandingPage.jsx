import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function LandingPage() {
  const { user, profile } = useAuth();

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "80px 20px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎙</div>
        <h1
          style={{
            fontSize: "clamp(32px, 7vw, 48px)",
            fontWeight: 800,
            lineHeight: 1.1,
            margin: "0 0 16px",
            letterSpacing: "-0.02em",
          }}
        >
          The Booth<span style={{ color: palette.coral }}>.</span>
        </h1>
        <p
          style={{
            color: palette.textMuted,
            fontSize: 16,
            lineHeight: 1.6,
            fontFamily: "'Space Mono', monospace",
            maxWidth: 420,
            margin: "0 auto 40px",
          }}
        >
          Slide into the booth. Get album recommendations from friends,
          build mixtapes, and share what you're listening to.
        </p>

        {user && profile ? (
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to={`/${profile.slug}`}
              style={{
                display: "inline-block",
                padding: "14px 28px",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
                background: palette.accent,
                color: "#000",
              }}
            >
              My Booth
            </Link>
            <Link
              to="/discover"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
                color: palette.textMuted,
              }}
            >
              Discover
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                border: "none",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
                background: palette.accent,
                color: "#000",
              }}
            >
              Slide In
            </Link>
            <Link
              to="/discover"
              style={{
                display: "inline-block",
                padding: "14px 28px",
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
                color: palette.textMuted,
              }}
            >
              Discover
            </Link>
          </div>
        )}
      </div>

      {/* How it works */}
      <div style={{ marginTop: 80 }}>
        <h2
          style={{
            textAlign: "center",
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          How it works<span style={{ color: palette.accent }}>.</span>
        </h2>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          {[
            {
              icon: "🎙",
              title: "Set up your booth",
              desc: "Sign up and pick a unique URL. Your booth, your rules.",
            },
            {
              icon: "🔗",
              title: "Invite people in",
              desc: "Share your link. No account needed to slide in and drop a rec.",
            },
            {
              icon: "💿",
              title: "Collect the drops",
              desc: "Friends search Spotify, pick an album, and drop it in your booth.",
            },
            {
              icon: "🎧",
              title: "Listen, rate, and reply",
              desc: "Mark albums as listened, rate them, and send feedback.",
            },
          ].map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                background: palette.cardBg,
                border: `1px solid ${palette.border}`,
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 28, flexShrink: 0 }}>{step.icon}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    lineHeight: 1.5,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
