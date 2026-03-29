import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const ACCENT = "#ec4899";
const ACCENT_RGB = "236,72,153";

let loginCssInjected = false;
function injectLoginCss() {
  if (loginCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .itb-login-input:focus {
      outline: none;
      border-color: ${ACCENT} !important;
      box-shadow: 0 0 0 2px rgba(${ACCENT_RGB},0.25) !important;
    }
    .itb-login-btn:active { transform: scale(0.97); }
  `;
  document.head.appendChild(tag);
  loginCssInjected = true;
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  background: "#141414",
  border: "1px solid #1e1e1e",
  borderRadius: 8,
  color: "#e8e6e3",
  fontSize: 13,
  fontFamily: "'Syne', sans-serif",
  boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const labelStyle = {
  display: "block",
  fontFamily: "'Space Mono', monospace",
  fontSize: 9, letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: ACCENT, marginBottom: 8,
};

export default function Login() {
  injectLoginCss();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      const pendingJoin = sessionStorage.getItem("room_join_return");
      if (pendingJoin) {
        sessionStorage.removeItem("room_join_return");
        navigate(`/room/join/${pendingJoin}`, { replace: true });
        return;
      }
      const mixtapeJoin = sessionStorage.getItem("mixtape_join_return");
      if (mixtapeJoin) {
        sessionStorage.removeItem("mixtape_join_return");
        navigate(`/mixtape/join/${mixtapeJoin}`, { replace: true });
        return;
      }
      setTimeout(() => navigate("/dashboard"), 300);
    } catch (err) {
      setError(err.message || "Login failed. Check your email and password.");
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
          background: ACCENT,
          borderRadius: 2,
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
            Log In
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9, color: "#2e2e2e",
            letterSpacing: "0.08em",
            margin: 0,
          }}>
            WELCOME BACK TO THE BOOTH
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              className="itb-login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Password</label>
            <input
              className="itb-login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
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
            className="itb-login-btn"
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
            {submitting ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <div style={{
          textAlign: "center",
          marginTop: 24,
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, color: "#2e2e2e",
          letterSpacing: "0.04em",
        }}>
          Don't have a wall?{" "}
          <Link to="/signup" style={{ color: ACCENT, textDecoration: "none" }}>
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
