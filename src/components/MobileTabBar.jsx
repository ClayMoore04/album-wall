import { Link, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useNotifications } from "./NotificationProvider";
import { palette } from "../lib/palette";

const tabs = [
  { path: "/discover", label: "Discover", icon: "M21 21l-5.2-5.2m2.2-4.8a7 7 0 11-14 0 7 7 0 0114 0z" },
  { path: "/feed", label: "Feed", icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" },
  { path: "/rooms", label: "Rooms", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { path: "/mixtapes", label: "Mixtapes", icon: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" },
  { path: "/dashboard", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function MobileTabBar() {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotifications() || {};
  const location = useLocation();

  if (!user || !profile) return null;

  // Hide on landing, login, signup, and public wall pages
  const hiddenPaths = ["/", "/login", "/signup", "/callback"];
  if (hiddenPaths.includes(location.pathname)) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: palette.surface,
        borderTop: `1px solid ${palette.border}`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        display: "none",
      }}
      className="mobile-tab-bar"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          maxWidth: 480,
          margin: "0 auto",
          height: 56,
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                textDecoration: "none",
                color: active ? palette.accent : palette.textMuted,
                fontSize: 10,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                transition: "color 0.15s",
                position: "relative",
                padding: "4px 12px",
              }}
            >
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={tab.icon} />
              </svg>
              {tab.label}
              {tab.path === "/feed" && unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 4,
                    minWidth: 14,
                    height: 14,
                    borderRadius: 7,
                    background: palette.coral,
                    color: "#fff",
                    fontSize: 8,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
