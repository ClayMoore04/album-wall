import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";

const ACCENT = "#ec4899";
const ACCENT_RGB = "236,72,153";

const RESERVED_SLUGS = [
  "signup", "login", "dashboard", "callback", "api",
  "stats", "admin", "settings", "wall", "about",
  "discover", "feed", "rooms", "mixtapes",
];

let signupCssInjected = false;
function injectSignupCss() {
  if (signupCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .itb-signup-input:focus {
      outline: none;
      border-color: ${ACCENT} !important;
    }
    .itb-signup-btn:active { transform: scale(0.97); }
  `;
  document.head.appendChild(tag);
  signupCssInjected = true;
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "#0e0e0e",
  border: "1px solid #1e1e1e",
  borderRadius: 8,
  color: "#e8e6e3",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const labelStyle = {
  display: "block",
  fontFamily: "'Space Mono', monospace",
  fontSize: 8, letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: ACCENT, marginBottom: 6,
};

export default function SignUp() {
  injectSignupCss();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const prefillName = searchParams.get("name") || "";
  const referralSource = searchParams.get("ref") || "";
  const isReferred = referralSource === "wall";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(prefillName);
  const [slug, setSlug] = useState(
    prefillName ? prefillName.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30) : ""
  );
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizeSlug = (val) =>
    val.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 30);

  const checkSlug = async (s) => {
    if (!s || s.length < 2) { setSlugAvailable(null); return; }
    if (RESERVED_SLUGS.includes(s)) { setSlugAvailable(false); return; }
    setSlugChecking(true);
    try {
      const { data } = await supabase
        .from("profiles").select("id").eq("slug", s).maybeSingle();
      setSlugAvailable(!data);
    } catch { setSlugAvailable(null); }
    finally { setSlugChecking(false); }
  };

  const handleSlugChange = (e) => {
    const val = normalizeSlug(e.target.value);
    setSlug(val);
    setSlugAvailable(null);
    clearTimeout(handleSlugChange._timer);
    handleSlugChange._timer = setTimeout(() => checkSlug(val), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!slug || slug.length < 2) { setError("URL must be at least 2 characters."); return; }
    if (RESERVED_SLUGS.includes(slug)) { setError("That URL is reserved."); return; }
    if (slugAvailable === false) { setError("That URL is already taken."); return; }

    setSubmitting(true);
    try {
      await signUp({ email, password, displayName, slug });
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a" }}>
      <div style={{
        maxWidth: 380, margin: "0 auto", padding: "80px 20px",
        animation: "itb-fadeInUp 0.4s ease both",
      }}>
        {/* Accent strip */}
        <div style={{
          width: 32, height: 3,
          background: ACCENT, borderRadius: 2,
          margin: "0 auto 20px",
        }} />

        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28, fontWeight: 800,
            color: "#e8e6e3",
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
          }}>
            {isReferred ? "Open Your Booth" : "Set Up Your Booth"}
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9, color: "#2e2e2e",
            letterSpacing: "0.08em",
            margin: 0,
          }}>
            {isReferred
              ? "NOW IT'S YOUR TURN TO COLLECT RECS"
              : "GET YOUR OWN ALBUM RECOMMENDATION WALL"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Display Name</label>
            <input
              className="itb-signup-input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Wall URL</label>
            <div style={{ position: "relative" }}>
              <input
                className="itb-signup-input"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                placeholder="yourname"
                required
                style={{
                  ...inputStyle,
                  paddingRight: 36,
                  borderColor: slugAvailable === true
                    ? ACCENT
                    : slugAvailable === false
                    ? "#ef4444"
                    : "#1e1e1e",
                }}
              />
              {slugChecking && (
                <span style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12, color: "#333",
                }}>...</span>
              )}
              {!slugChecking && slugAvailable === true && (
                <span style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  color: ACCENT, fontSize: 14,
                }}>✓</span>
              )}
              {!slugChecking && slugAvailable === false && (
                <span style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)",
                  color: "#ef4444", fontSize: 14,
                }}>✗</span>
              )}
            </div>
            {slug && (
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 8, color: "#252525",
                letterSpacing: "0.04em",
                marginTop: 4,
              }}>
                {window.location.host}/{slug}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              className="itb-signup-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              className="itb-signup-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, color: "#ef4444",
              letterSpacing: "0.04em",
              textAlign: "center",
              marginBottom: 16,
            }}>
              {error}
            </p>
          )}

          <button
            className="itb-signup-btn"
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              padding: "13px",
              border: "none",
              borderRadius: 8,
              background: ACCENT,
              color: "#000",
              fontFamily: "'Space Mono', monospace",
              fontSize: 11, fontWeight: 700,
              letterSpacing: "0.1em",
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            {submitting ? "CREATING..." : "OPEN MY BOOTH"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, color: "#2e2e2e",
          letterSpacing: "0.04em",
        }}>
          Already have a wall?{" "}
          <Link to="/login" style={{ color: ACCENT, textDecoration: "none" }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
