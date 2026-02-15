import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function NavBar({ wallSlug, isOwner }) {
  const { user, profile, signOut } = useAuth();

  const linkStyle = {
    padding: "6px 14px",
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    textDecoration: "none",
    color: palette.textDim,
    transition: "all 0.2s",
    cursor: "pointer",
    background: "transparent",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 8,
        marginBottom: -28,
      }}
    >
      {user && profile ? (
        <>
          {isOwner ? (
            <Link to="/dashboard" style={linkStyle}>
              Dashboard
            </Link>
          ) : (
            <Link to={`/${profile.slug}`} style={linkStyle}>
              My Wall
            </Link>
          )}
          <button
            onClick={signOut}
            style={{
              ...linkStyle,
              border: `1px solid rgba(29,185,84,0.3)`,
              background: "rgba(29,185,84,0.1)",
              color: palette.accent,
            }}
          >
            Log out
          </button>
        </>
      ) : (
        <>
          <Link
            to="/signup"
            style={{
              ...linkStyle,
              border: "none",
              color: palette.textMuted,
              fontSize: 10,
            }}
          >
            Create Your Wall
          </Link>
          <Link
            to="/login"
            style={{
              ...linkStyle,
              border: `1px solid rgba(29,185,84,0.3)`,
              color: palette.accent,
            }}
          >
            Log in
          </Link>
        </>
      )}
    </div>
  );
}
