import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function NavBar({ wallSlug, isOwner }) {
  const { user, profile, signOut } = useAuth();

  const linkStyle = {
    padding: "6px 10px",
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    textDecoration: "none",
    color: palette.textDim,
    transition: "all 0.2s",
    cursor: "pointer",
    background: "transparent",
    whiteSpace: "nowrap",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        gap: 5,
        marginBottom: -28,
        flexWrap: "wrap",
      }}
    >
      <Link
        to="/discover"
        style={{ ...linkStyle, border: "none", color: palette.textMuted }}
      >
        Discover
      </Link>
      {user && profile ? (
        <>
          <Link to="/rooms" style={linkStyle}>
            Rooms
          </Link>
          <Link to="/mixtapes" style={linkStyle}>
            Mixtapes
          </Link>
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
