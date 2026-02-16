import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

const RESERVED_SLUGS = [
  "signup",
  "login",
  "dashboard",
  "callback",
  "api",
  "stats",
  "admin",
  "settings",
  "wall",
  "about",
];

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugChecking, setSlugChecking] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const normalizeSlug = (val) =>
    val
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 30);

  const checkSlug = async (s) => {
    if (!s || s.length < 2) {
      setSlugAvailable(null);
      return;
    }
    if (RESERVED_SLUGS.includes(s)) {
      setSlugAvailable(false);
      return;
    }
    setSlugChecking(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("slug", s)
        .maybeSingle();
      setSlugAvailable(!data);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
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

    if (!slug || slug.length < 2) {
      setError("URL slug must be at least 2 characters.");
      return;
    }
    if (RESERVED_SLUGS.includes(slug)) {
      setError("That URL is reserved. Pick a different one.");
      return;
    }
    if (slugAvailable === false) {
      setError("That URL is already taken.");
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ email, password, displayName, slug });
      navigate(`/${slug}`);
    } catch (err) {
      setError(err.message || "Sign up failed. Please try again.");
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
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
          }}
        >
          Set Up Your Booth
        </h1>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 13,
          }}
        >
          Get your own album recommendation wall
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Wall URL</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={slug}
              onChange={handleSlugChange}
              placeholder="yourname"
              required
              style={{
                ...inputStyle,
                paddingRight: 36,
                border: `1px solid ${
                  slugAvailable === true
                    ? palette.accent
                    : slugAvailable === false
                    ? palette.coral
                    : palette.border
                }`,
              }}
            />
            {slugChecking && (
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 12,
                  color: palette.textMuted,
                }}
              >
                ...
              </span>
            )}
            {!slugChecking && slugAvailable === true && (
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: palette.accent,
                }}
              >
                ✓
              </span>
            )}
            {!slugChecking && slugAvailable === false && (
              <span
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: palette.coral,
                }}
              >
                ✗
              </span>
            )}
          </div>
          {slug && (
            <div
              style={{
                fontSize: 11,
                color: palette.textDim,
                fontFamily: "'Space Mono', monospace",
                marginTop: 4,
              }}
            >
              thebooth.vercel.app/{slug}
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>Password</label>
          <input
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
          {submitting ? "Creating..." : "Open My Booth"}
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
        Already have a wall?{" "}
        <Link
          to="/login"
          style={{ color: palette.accent, textDecoration: "none" }}
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
