import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette, noiseOverlay } from "../lib/palette";
import { elevation } from "../lib/styles";
import MixtapeOfTheWeek from "./MixtapeOfTheWeek";

const ACCENT = palette.accent;
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
      border-color: rgba(${ACCENT_RGB},0.4) !important;
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 16px rgba(${ACCENT_RGB},0.08) !important;
    }
    .itb-landing-cta-btn:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(tag);
  landingCssInjected = true;
}

const ctaBtnBase = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "12px 24px",
  borderRadius: 10,
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textDecoration: "none",
  transition: "all 0.15s",
  lineHeight: 1,
};

const sectionLabelStyle = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: palette.textMuted,
  textAlign: "center",
  marginBottom: 8,
};

export default function LandingPage() {
  injectLandingCss();
  const { user, profile } = useAuth();

  const features = [
    { icon: "🧱", title: "Your Wall", desc: "Your personal music recommendation wall. Friends drop albums, you listen, rate, and reply." },
    { icon: "📼", title: "Mixtapes", desc: "Collaborate on 90-minute mixtapes with friends. Liner notes, Side A/B, export to Spotify." },
    { icon: "🚪", title: "Rooms", desc: "Private listening rooms. Invite friends, build playlists together in real time." },
    { icon: "🔍", title: "Discover", desc: "Browse public booths, follow curators, and find new music through the community." },
  ];

  const steps = [
    { title: "Set up your booth", desc: "Sign up and pick a unique URL. Your booth, your rules." },
    { title: "Invite people in", desc: "Share your link. No account needed to drop a rec." },
    { title: "Collect the drops", desc: "Friends search Spotify, pick an album, and drop it in." },
    { title: "Listen, rate, reply", desc: "Mark albums as listened, rate them, and send feedback." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: palette.bg, paddingBottom: 0 }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{
          paddingTop: 80,
          paddingBottom: 64,
          textAlign: "center",
          animation: "itb-fadeInUp 0.5s ease both",
        }}>
          <div style={{
            width: 40, height: 3,
            background: ACCENT,
            borderRadius: 2,
            margin: "0 auto 24px",
          }} />

          <div style={sectionLabelStyle}>
            MUSIC RECOMMENDATION PLATFORM
          </div>

          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(36px, 10vw, 56px)",
            fontWeight: 800,
            color: palette.text,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            margin: "0 0 8px",
          }}>
            The Booth<span style={{ color: ACCENT }}>.</span>
          </h1>

          <p style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            color: palette.textDim,
            lineHeight: 1.6,
            maxWidth: 400,
            margin: "0 auto 36px",
          }}>
            Get album recs from friends, build mixtapes, and share what you're listening to.
          </p>

          {/* CTA buttons — all same height/padding */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {user && profile ? (
              <>
                <Link to={`/${profile.slug}`} className="itb-landing-cta-btn" style={{
                  ...ctaBtnBase,
                  background: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  color: "#000",
                }}>MY BOOTH</Link>
                <Link to="/discover" className="itb-landing-cta-btn" style={{
                  ...ctaBtnBase,
                  background: "transparent",
                  border: "1px solid #333",
                  color: palette.textDim,
                }}>DISCOVER</Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="itb-landing-cta-btn" style={{
                  ...ctaBtnBase,
                  background: ACCENT,
                  border: `1px solid ${ACCENT}`,
                  color: "#000",
                }}>SLIDE IN</Link>
                <Link to="/login" className="itb-landing-cta-btn" style={{
                  ...ctaBtnBase,
                  background: "transparent",
                  border: `1px solid rgba(${ACCENT_RGB},0.4)`,
                  color: ACCENT,
                }}>LOG IN</Link>
                <Link to="/discover" className="itb-landing-cta-btn" style={{
                  ...ctaBtnBase,
                  background: "transparent",
                  border: "1px solid #333",
                  color: palette.textDim,
                }}>DISCOVER</Link>
              </>
            )}
          </div>
        </div>

        {/* Featured Mixtape */}
        <MixtapeOfTheWeek />

        {/* Features */}
        <div style={{ padding: "64px 0" }}>
          <div style={sectionLabelStyle}>FEATURES</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            textAlign: "center",
            fontSize: 22, fontWeight: 800,
            color: palette.text,
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
                  borderLeft: `3px solid rgba(${ACCENT_RGB},0.4)`,
                  borderRadius: 12,
                  padding: "16px 18px",
                  overflow: "hidden",
                  transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                  animation: "itb-fadeInUp 0.3s ease both",
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{feature.icon}</div>
                <div>
                  <div style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 14, fontWeight: 700,
                    color: palette.text,
                    marginBottom: 4,
                  }}>{feature.title}</div>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10, color: palette.textDim,
                    lineHeight: 1.55,
                    letterSpacing: "0.02em",
                  }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ padding: "64px 0" }}>
          <div style={sectionLabelStyle}>HOW IT WORKS</div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            textAlign: "center",
            fontSize: 22, fontWeight: 800,
            color: palette.text,
            letterSpacing: "-0.01em",
            margin: "0 0 24px",
          }}>
            Four steps to your booth<span style={{ color: ACCENT }}>.</span>
          </h2>

          <div style={{ position: "relative" }}>
            {/* Vertical connector line */}
            <div style={{
              position: "absolute",
              left: 13,
              top: 28,
              bottom: 28,
              width: 2,
              background: "#1e1e1e",
              borderRadius: 1,
            }} />

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
                    position: "relative",
                  }}
                >
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
                    position: "relative",
                    zIndex: 1,
                  }}>{i + 1}</div>
                  <div>
                    <div style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 14, fontWeight: 700,
                      color: palette.text,
                      marginBottom: 3,
                    }}>{step.title}</div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10, color: palette.textDim,
                      lineHeight: 1.55,
                      letterSpacing: "0.02em",
                    }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        {!user && (
          <div style={{
            marginBottom: 64,
            textAlign: "center",
            padding: "36px 24px",
            background: `radial-gradient(ellipse at 50% 30%, rgba(${ACCENT_RGB},0.08) 0%, #111 70%)`,
            borderRadius: 16,
            border: "1px solid #1e1e1e",
            position: "relative",
            overflow: "hidden",
            ...elevation.floating(ACCENT_RGB),
          }}>
            {/* Accent strip */}
            <div style={{
              position: "absolute",
              top: 0, left: 0, right: 0, height: 2,
              background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
              pointerEvents: "none",
            }} />
            {/* Noise overlay */}
            <div style={{
              position: "absolute", inset: 0,
              ...noiseOverlay,
              pointerEvents: "none",
              borderRadius: 16,
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 20, fontWeight: 800,
                color: palette.text,
                margin: "0 0 6px",
              }}>Ready to set up your booth?</h3>
              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10, color: palette.textMuted,
                letterSpacing: "0.06em",
                margin: "0 0 20px",
              }}>Free forever. No ads. Just music.</p>
              <Link to="/signup" style={{
                ...ctaBtnBase,
                padding: "12px 32px",
                background: ACCENT,
                border: `1px solid ${ACCENT}`,
                color: "#000",
              }}>SLIDE IN</Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1a1a1a",
        padding: "32px 20px",
        textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 13, fontWeight: 700,
          color: "#333",
          marginBottom: 4,
        }}>
          The Booth<span style={{ color: ACCENT }}>.</span>
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, color: "#333",
          letterSpacing: "0.04em",
          marginBottom: 16,
        }}>Made for music lovers</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16 }}>
          {[
            { to: "/discover", label: "Discover" },
            { to: "/signup", label: "Sign Up" },
            { to: "/login", label: "Log In" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9, color: "#444",
                textDecoration: "none",
                letterSpacing: "0.04em",
                transition: "color 0.15s",
              }}
            >{link.label}</Link>
          ))}
        </div>
        <div style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 8, color: "#222",
          letterSpacing: "0.04em",
        }}>
          {new Date().getFullYear()} The Booth
        </div>
      </footer>
    </div>
  );
}
