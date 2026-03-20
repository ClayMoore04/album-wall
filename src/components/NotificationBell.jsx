import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "./NotificationProvider";
import { palette } from "../lib/palette";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function getNotificationText(n) {
  const name = n.actor?.display_name || n.data?.submitted_by || "Someone";
  switch (n.type) {
    case "new_submission":
      return `${name} recommended ${n.data?.album_name || "an album"}`;
    case "new_follow":
      return `${name} followed your booth`;
    case "tape_trade_request":
      return `${name} sent a tape trade`;
    case "collab_invite":
      return `${name} invited you to a mixtape`;
    default:
      return `${name} did something`;
  }
}

function getNotificationRoute(n) {
  switch (n.type) {
    case "new_submission":
      return n.actor?.slug ? `/${n.actor.slug}` : "/dashboard";
    case "new_follow":
      return n.actor?.slug ? `/${n.actor.slug}` : "/dashboard";
    case "tape_trade_request":
      return "/dashboard";
    case "collab_invite":
      return n.entity_id ? `/mixtape/${n.entity_id}` : "/mixtapes";
    default:
      return "/dashboard";
  }
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleClick = (n) => {
    if (!n.read) markAsRead(n.id);
    setOpen(false);
    navigate(getNotificationRoute(n));
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "8px 10px",
          border: `1px solid ${palette.border}`,
          borderRadius: 8,
          fontSize: 14,
          background: open ? palette.surfaceHover : palette.surface,
          cursor: "pointer",
          position: "relative",
          lineHeight: 1,
          color: palette.text,
        }}
      >
        {"\u{1F514}"}
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: palette.coral,
              color: "#fff",
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 300,
            maxHeight: 400,
            overflowY: "auto",
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            zIndex: 200,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: `1px solid ${palette.border}`,
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                color: palette.text,
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  padding: "2px 8px",
                  border: "none",
                  background: "transparent",
                  color: palette.accent,
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: "'Space Mono', monospace",
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div
              style={{
                padding: "32px 14px",
                textAlign: "center",
                color: palette.textMuted,
                fontSize: 12,
                fontFamily: "'Space Mono', monospace",
              }}
            >
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "12px 14px",
                  border: "none",
                  borderLeft: !n.read
                    ? `3px solid ${palette.accent}`
                    : "3px solid transparent",
                  borderBottom: `1px solid ${palette.border}`,
                  background: !n.read
                    ? "rgba(29,185,84,0.05)"
                    : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: palette.text,
                    lineHeight: 1.4,
                  }}
                >
                  {getNotificationText(n)}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: palette.textDim,
                    fontFamily: "'Space Mono', monospace",
                    marginTop: 4,
                  }}
                >
                  {timeAgo(n.created_at)}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
