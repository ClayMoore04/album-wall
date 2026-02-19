import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, profile } = useAuth();
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
      // Check for pending room join redirect
      const pendingJoin = sessionStorage.getItem("room_join_return");
      if (pendingJoin) {
        sessionStorage.removeItem("room_join_return");
        navigate(`/room/join/${pendingJoin}`, { replace: true });
        return;
      }
      // Check for pending mixtape join redirect
      const mixtapeJoin = sessionStorage.getItem("mixtape_join_return");
      if (mixtapeJoin) {
        sessionStorage.removeItem("mixtape_join_return");
        navigate(`/mixtape/join/${mixtapeJoin}`, { replace: true });
        return;
      }
      // Profile will load via onAuthStateChange — navigate after a tick
      setTimeout(() => {
        navigate("/dashboard");
      }, 300);
    } catch (err) {
      setError(err.message || "Login failed. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    color: palette.text,
    fontSize: 14,
    fontFamily: "'Syne', sans-serif",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 600,
    color: palette.textMuted,
    fontFamily: "'Space Mono', monospace",
    marginBottom: 6,
    letterSpacing: "0.03em",
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: "60px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>💿</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
          Log In
        </h1>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
          }}
        >
          Welcome back to the booth
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoFocus
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            style={inputStyle}
          />
        </div>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: palette.coral,
              fontFamily: "'Space Mono', monospace",
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            cursor: submitting ? "not-allowed" : "pointer",
            background: palette.accent,
            color: "#000",
            opacity: submitting ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {submitting ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: 13,
          color: palette.textMuted,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        Don't have a wall?{" "}
        <Link
          to="/signup"
          style={{ color: palette.accent, textDecoration: "none" }}
        >
          Create one
        </Link>
      </div>
    </div>
  );
}
