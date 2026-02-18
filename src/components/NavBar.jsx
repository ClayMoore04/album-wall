import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";

export default function NavBar({ wallSlug, isOwner }) {
  const { user, profile, signOut } = useAuth();

  const linkStyle = {
    padding: "8px 14px",
    border: `1px solid ${palette.border}`,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
    fontFamily: "'Space Mono', monospace",
    textDecoration: "none",
    color: palette.text,
    transition: "all 0.2s",
    cursor: "pointer",
    background: palette.surface,
    whiteSpace: "nowrap",
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        width: "100vw",
        marginLeft: "calc(-50vw + 50%)",
        background: `${palette.bg}ee`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${palette.border}`,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Left: Brand */}
        <Link
          to="/"
          style={{
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'Syne', sans-serif",
            color: palette.text,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          The Booth
        </Link>

        {/* Right: Nav links */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          <Link to="/discover" style={linkStyle}>
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
                  My Booth
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
                }}
              >
                Slide In
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
      </div>
    </nav>
  );
}
