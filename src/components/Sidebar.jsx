import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useNotifications } from "./NotificationProvider";
import { getThemeAccent } from "../lib/themes";

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

const NAV_ITEMS = [
  {
    path: "/discover",
    label: "Discover",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    path: "/feed",
    label: "Feed",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
    hasNotif: true,
  },
  {
    path: "/rooms",
    label: "Rooms",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: "/mixtapes",
    label: "Mixtapes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="12" rx="2"/><path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
        <circle cx="8.5" cy="14" r="1.5"/><circle cx="15.5" cy="14" r="1.5"/>
        <path d="M8.5 14h7"/>
      </svg>
    ),
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  if (!user || !profile) return null;

  const accent = getThemeAccent(profile?.theme);
  const accentRgb = hexToRgb(accent);

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className="sidebar-nav"
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      style={{
        position: "fixed",
        top: 0, left: 0, bottom: 0,
        width: collapsed ? 64 : 200,
        background: "rgba(10,10,10,0.98)",
        borderRight: "1px solid #1a1a1a",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        transition: "width 0.2s ease",
        overflow: "hidden",
      }}
    >
      {/* Accent strip */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, bottom: 0, width: 2,
        background: `rgba(${accentRgb},0.3)`,
        pointerEvents: "none",
      }} />

      {/* Brand */}
      <Link
        to="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 20px",
          marginBottom: 32,
          textDecoration: "none",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{
          width: 24, height: 24,
          borderRadius: "50%",
          background: accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, flexShrink: 0,
        }}>🎙</span>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, fontWeight: 800,
          color: "#e8e6e3",
          letterSpacing: "-0.02em",
          opacity: collapsed ? 0 : 1,
          transition: "opacity 0.15s",
        }}>
          The Booth
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 20px",
                textDecoration: "none",
                color: active ? accent : "#444",
                background: active ? `rgba(${accentRgb},0.08)` : "transparent",
                borderRight: active ? `2px solid ${accent}` : "2px solid transparent",
                transition: "all 0.15s",
                position: "relative",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", position: "relative" }}>
                {item.icon}
                {item.hasNotif && unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: -4, right: -4,
                    minWidth: 12, height: 12,
                    borderRadius: 6,
                    background: accent,
                    fontSize: 7, fontWeight: 700,
                    color: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 2px",
                    border: "1.5px solid #0a0a0a",
                    fontFamily: "'Space Mono', monospace",
                  }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 9, letterSpacing: "0.06em",
                textTransform: "uppercase",
                opacity: collapsed ? 0 : 1,
                transition: "opacity 0.15s",
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Bottom: logout */}
      <button
        onClick={signOut}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 20px",
          background: "none",
          border: "none",
          color: "#2a2a2a",
          cursor: "pointer",
          whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 9, letterSpacing: "0.06em",
          textTransform: "uppercase",
          opacity: collapsed ? 0 : 1,
          transition: "opacity 0.15s",
        }}>
          Log Out
        </span>
      </button>
    </nav>
  );
}
