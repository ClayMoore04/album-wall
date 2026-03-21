import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import { getThemeAccent } from "../lib/themes";
import NotificationBell from "./NotificationBell";

let navCssInjected = false;
function injectNavCss() {
  if (navCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(tag);
  navCssInjected = true;
}

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function NavLink({ to, label, isActive, accent, accentRgb }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        textDecoration: "none",
        color: isActive ? accent : hov ? "#888" : "#333",
        transition: "color 0.15s",
        position: "relative",
        paddingBottom: 2,
      }}
    >
      {label}
      <span style={{
        position: "absolute",
        bottom: -2, left: 0, right: 0,
        height: 1,
        background: accent,
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.15s",
        borderRadius: 1,
      }} />
    </Link>
  );
}

const HIDDEN_PATHS = ["/", "/login", "/signup", "/callback"];

export default function NavBar() {
  injectNavCss();

  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [brandHov, setBrandHov] = useState(false);

  // Hide on auth pages when not logged in
  if (!user && HIDDEN_PATHS.includes(location.pathname)) return null;

  const accent = getThemeAccent(profile?.theme);
  const accentRgb = hexToRgb(accent);
  const isActive = (path) => location.pathname === path;
  // Determine if user is on their own wall
  const isOwner = profile && location.pathname === `/${profile.slug}`;

  return (
    <nav style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      width: "100vw",
      marginLeft: "calc(-50vw + 50%)",
      background: "rgba(10,10,10,0.95)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid #1a1a1a",
      marginBottom: 8,
    }}>
      {/* Accent strip */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0,
        height: 2,
        background: `rgba(${accentRgb},0.4)`,
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
      }}>
        {/* Brand */}
        <Link
          to="/"
          onMouseEnter={() => setBrandHov(true)}
          onMouseLeave={() => setBrandHov(false)}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 15,
            fontWeight: 800,
            color: brandHov ? accent : "#e8e6e3",
            letterSpacing: "-0.02em",
            transition: "color 0.15s",
          }}>
            The Booth
          </span>
          <span style={{
            width: 6, height: 6,
            borderRadius: "50%",
            background: accent,
            flexShrink: 0,
            opacity: 0.8,
          }} />
        </Link>

        {/* Nav links */}
        <div
          className="desktop-nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          {user && profile ? (
            <>
              <NavLink to="/discover" label="Discover" isActive={isActive("/discover")} accent={accent} accentRgb={accentRgb} />
              <NavLink to="/feed" label="Feed" isActive={isActive("/feed")} accent={accent} accentRgb={accentRgb} />
              <NavLink to="/rooms" label="Rooms" isActive={isActive("/rooms")} accent={accent} accentRgb={accentRgb} />
              <NavLink to="/mixtapes" label="Mixtapes" isActive={isActive("/mixtapes")} accent={accent} accentRgb={accentRgb} />
              {isOwner ? (
                <NavLink to="/dashboard" label="Dashboard" isActive={isActive("/dashboard")} accent={accent} accentRgb={accentRgb} />
              ) : (
                <NavLink to={`/${profile.slug}`} label="My Booth" isActive={isActive(`/${profile.slug}`)} accent={accent} accentRgb={accentRgb} />
              )}
              <NotificationBell />
              <button
                onClick={signOut}
                style={{
                  background: "transparent",
                  border: "1px solid #222",
                  borderRadius: 6,
                  color: "#333",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
              >
                LOG OUT
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" label="Log in" isActive={isActive("/login")} accent={accent} accentRgb={accentRgb} />
              <Link
                to="/signup"
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.06em",
                  fontWeight: 700,
                  textDecoration: "none",
                  background: accent,
                  color: "#000",
                  padding: "5px 12px",
                  borderRadius: 6,
                }}
              >
                SLIDE IN
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
