import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useNotifications } from "./NotificationProvider";
import { getThemeAccent } from "../lib/themes";

const HIDDEN_PATHS = ["/", "/login", "/signup", "/callback"];

const TABS = [
  {
    path: "/discover",
    label: "Discover",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
  },
  {
    path: "/feed",
    label: "Feed",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>
    ),
    hasNotif: true,
  },
  {
    path: "/rooms",
    label: "Rooms",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    path: "/mixtapes",
    label: "Mixtapes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="8" width="20" height="12" rx="2"/><path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
        <circle cx="8.5" cy="14" r="1.5"/><circle cx="15.5" cy="14" r="1.5"/>
        <path d="M8.5 14h7"/>
      </svg>
    ),
  },
  {
    path: "/dashboard",
    label: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
];

let tabBarCssInjected = false;
function injectTabBarCss() {
  if (tabBarCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-notif-pulse {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.2); }
    }
  `;
  document.head.appendChild(tag);
  tabBarCssInjected = true;
}

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

export default function MobileTabBar() {
  injectTabBarCss();

  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const location = useLocation();

  if (!user || !profile) return null;
  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const accent = getThemeAccent(profile?.theme);
  const accentRgb = hexToRgb(accent);

  return (
    <nav
      className="mobile-tab-bar"
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        height: 56,
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "rgba(10,10,10,0.96)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #1a1a1a",
        zIndex: 200,
        display: "none",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 8px",
      }}
    >
      {TABS.map((tab) => {
        const isActive = location.pathname === tab.path ||
          (tab.path === "/dashboard" && location.pathname.startsWith("/dashboard"));

        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              height: "100%",
              textDecoration: "none",
              position: "relative",
              padding: "4px 0",
            }}
          >
            {/* Filled pill behind active icon */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 44,
              height: 30,
              borderRadius: 15,
              background: isActive ? `rgba(${accentRgb},0.15)` : "transparent",
              transition: "background 0.2s ease",
              pointerEvents: "none",
            }} />

            {/* Icon */}
            <div style={{
              position: "relative",
              color: isActive ? accent : "#333",
              transition: "color 0.2s ease",
              transform: isActive ? "translateY(-1px)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {tab.icon}

              {/* Notification badge */}
              {tab.hasNotif && unreadCount > 0 && (
                <div style={{
                  position: "absolute",
                  top: -4, right: -5,
                  minWidth: 14, height: 14,
                  borderRadius: 7,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7,
                  fontWeight: 700,
                  color: "#000",
                  padding: "0 3px",
                  animation: "itb-notif-pulse 2s ease infinite",
                  border: "1.5px solid #0a0a0a",
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </div>
              )}
            </div>

            {/* Label */}
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 8,
              letterSpacing: "0.04em",
              color: isActive ? accent : "#2e2e2e",
              transition: "color 0.2s ease",
              lineHeight: 1,
              textTransform: "uppercase",
            }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
