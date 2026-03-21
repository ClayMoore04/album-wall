import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import MixtapeOfTheWeek from "./MixtapeOfTheWeek";

const ACCENT = "#ec4899";
const ACCENT_RGB = "236,72,153";

let landingCssInjected = false;
function injectLandingCss() {
  if (landingCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-fadeInUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes itb-glow-pulse {
      0%, 100% { opacity: 0.4; }
      50%      { opacity: 0.8; }
    }
    .itb-landing-feature:hover {
      border-color: rgba(${ACCENT_RGB},0.3) !important;
      transform: translateY(-2px) !important;
    }
  `;
  document.head.appendChild(tag);
  landingCssInjected = true;
}

export default function LandingPage() {
  injectLandingCss();
  const { user, profile } = useAuth();

  const features = [
    {
      icon: "🧱",
      title: "Your Wall",
      desc: "Your personal music recommendation wall. Friends drop albums, you listen, rate, and reply.",
    },
    {
      icon: "📼",
      title: "Mixtapes",
      desc: "Collaborate on 90-minute mixtapes with friends. Liner notes, Side A/B, export to Spotify.",
    },
    {
      icon: "🚪",
      title: "Rooms",
      desc: "Private listening rooms. Invite friends, build playlists together in real time.",
    },
    {
      icon: "🔍",
      title: "Discover",
      desc: "Browse public booths, follow curators, and find new music through the community.",
    },
  ];

  const steps = [
    { icon: "🎙", title: "Set up your booth", desc: "Sign up and pick a unique URL. Your booth, your rules." },
    { icon: "🔗", title: "Invite people in", desc: "Share your link. No account needed to drop a rec." },
    { icon: "💿", title: "Collect the drops", desc: "Friends search Spotify, pick an album, and drop it in." },
    { icon: "🎧", title: "Listen, rate, reply", desc: "Mark albums as listened, rate them, and send feedback." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 80 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{
          paddingTop: 80,
          textAlign: "center",
          animation: "itb-fadeInUp 0.5s ease both",
        }}>
          {/* Accent strip */}
          <div style={{
            width: 40, height: 3,
            background: ACCENT,
            borderRadius: 2,
            margin: "0 auto 24px",
          }} />

          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: `rgba(${ACCENT_RGB},0.6)`,
            marginBottom: 12,
          }}>
            MUSIC RECOMMENDATION PLATFORM
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(36px, 10vw, 56px)",
            fontWeight: 800,
            color: "#e8e6e3",
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            margin: "0 0 8px",
          }}>
            The Booth<span style={{ color: ACCENT }}>.</span>
          </h1>

          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            color: "#555",
            lineHeight: 1.6,
            maxWidth: 400,
            margin: "0 auto 36px",
          }}>
            Get album recs from friends, build mixtapes, and share what you're listening to.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
          }}>
            {user && profile ? (
              <>
                <Link to={`/${profile.slug}`} style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: ACCENT,
                  borderRadius: 8,
                  border: "none",
                  color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  transition: "opacity 0.15s",
                }}>
                  MY BOOTH
                </Link>
                <Link to="/discover" style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: "transparent",
                  borderRadius: 8,
                  border: "1px solid #222",
                  color: "#555",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                  transition: "all 0.15s",
                }}>
                  DISCOVER
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: ACCENT,
                  borderRadius: 8,
                  border: "none",
                  color: "#000",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                }}>
                  SLIDE IN
                </Link>
                <Link to="/login" style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: "transparent",
                  borderRadius: 8,
                  border: `1px solid rgba(${ACCENT_RGB},0.3)`,
                  color: ACCENT,
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                }}>
                  LOG IN
                </Link>
                <Link to="/discover" style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  background: "transparent",
                  borderRadius: 8,
                  border: "1px solid #222",
                  color: "#444",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textDecoration: "none",
                }}>
                  DISCOVER
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Featured Mixtape */}
        <div style={{ marginTop: 64 }}>
          <MixtapeOfTheWeek />
        </div>

        {/* Features */}
        <div style={{ marginTop: 56 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: ACCENT,
            textAlign: "center",
            marginBottom: 8,
          }}>
            FEATURES
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            textAlign: "center",
            fontSize: 22,
            fontWeight: 800,
            color: "#e8e6e3",
            letterSpacing: "-0.01em",
            margin: "0 0 24px",
          }}>
            Everything you need to share music<span style={{ color: ACCENT }}>.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {features.map((feature, i) => (
              <div
                key={i}
                className="itb-landing-feature"
                style={{
                  position: "relative",
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  background: "#111",
                  border: "1px solid #1e1e1e",
                  borderRadius: 12,
                  padding: "16px 18px",
                  overflow: "hidden",
                  transition: "transform 0.18s ease, border-color 0.18s ease",
                  animation: "itb-fadeInUp 0.3s ease both",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                {/* Accent trim */}
                <div style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, height: 2,
                  background: `rgba(${ACCENT_RGB},0.2)`,
                  pointerEvents: "none",
                }} />

                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{feature.icon}</div>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 700,
                    color: "#e8e6e3",
                    marginBottom: 4,
                  }}>
                    {feature.title}
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10, color: "#444",
                    lineHeight: 1.55,
                    letterSpacing: "0.02em",
                  }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginTop: 56 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: ACCENT,
            textAlign: "center",
            marginBottom: 8,
          }}>
            HOW IT WORKS
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            textAlign: "center",
            fontSize: 22,
            fontWeight: 800,
            color: "#e8e6e3",
            letterSpacing: "-0.01em",
            margin: "0 0 24px",
          }}>
            Four steps to your booth<span style={{ color: ACCENT }}>.</span>
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  padding: "16px 0",
                  borderBottom: i < steps.length - 1 ? "1px solid #161616" : "none",
                  animation: "itb-fadeInUp 0.3s ease both",
                  animationDelay: `${0.3 + i * 0.06}s`,
                }}
              >
                {/* Step number */}
                <div style={{
                  width: 28, height: 28,
                  borderRadius: "50%",
                  background: `rgba(${ACCENT_RGB},0.1)`,
                  border: `1px solid rgba(${ACCENT_RGB},0.25)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10, fontWeight: 700,
                  color: ACCENT,
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 700,
                    color: "#e8e6e3",
                    marginBottom: 3,
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10, color: "#444",
                    lineHeight: 1.55,
                    letterSpacing: "0.02em",
                  }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        {!user && (
          <div style={{
            marginTop: 56,
            textAlign: "center",
            padding: "32px 20px",
            background: "#111",
            borderRadius: 12,
            border: "1px solid #1e1e1e",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              pointerEvents: "none",
            }} />
            <h3 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20, fontWeight: 800,
              color: "#e8e6e3",
              margin: "0 0 6px",
            }}>
              Ready to set up your booth?
            </h3>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, color: "#333",
              letterSpacing: "0.06em",
              margin: "0 0 20px",
            }}>
              Free forever. No ads. Just music.
            </p>
            <Link to="/signup" style={{
              display: "inline-block",
              padding: "12px 32px",
              background: ACCENT,
              borderRadius: 8,
              color: "#000",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.08em",
              textDecoration: "none",
            }}>
              SLIDE IN
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
