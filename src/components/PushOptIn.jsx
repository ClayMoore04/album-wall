import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "../lib/pushNotifications";

const DISMISS_KEY = "push-optin-dismissed";

export default function PushOptIn() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!isPushSupported()) {
        setChecking(false);
        return;
      }
      setSupported(true);

      if (localStorage.getItem(DISMISS_KEY) === "true") {
        setDismissed(true);
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setSubscribed(!!sub);
      } catch {
        // ignore
      }
      setChecking(false);
    };
    check();
  }, []);

  const handleEnable = async () => {
    if (!user) return;
    setLoading(true);
    const result = await subscribeToPush(user.id);
    if (result.success) {
      setSubscribed(true);
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    await unsubscribeFromPush();
    setSubscribed(false);
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  };

  if (checking || !supported) return null;

  // If subscribed, show status with toggle
  if (subscribed) {
    return (
      <div
        style={{
          background: "#111",
          border: "1px solid #1e1e1e",
          borderRadius: 12,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                color: "#f472b6",
                letterSpacing: "0.03em",
              }}
            >
              Push notifications enabled
            </div>
          </div>
          <button
            onClick={handleDisable}
            disabled={loading}
            style={{
              padding: "6px 14px",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              background: "transparent",
              color: "#555",
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "..." : "Turn off"}
          </button>
        </div>
      </div>
    );
  }

  // If dismissed and not subscribed, don't show
  if (dismissed) return null;

  return (
    <div
      style={{
        background: "#111",
        border: "1px solid #1e1e1e",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        position: "relative",
      }}
    >
      <button
        onClick={handleDismiss}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          background: "transparent",
          border: "none",
          color: "#555",
          fontSize: 16,
          cursor: "pointer",
          padding: "4px 8px",
          lineHeight: 1,
        }}
        aria-label="Dismiss"
      >
        x
      </button>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          color: "#e8e6e3",
          margin: "0 0 8px",
        }}
      >
        Stay in the loop
      </h3>
      <p
        style={{
          fontSize: 12,
          fontFamily: "'Space Mono', monospace",
          color: "#555",
          margin: "0 0 16px",
          lineHeight: 1.5,
        }}
      >
        Get notified when someone drops an album on your wall, sends you a tape
        trade, or follows you.
      </p>
      <button
        onClick={handleEnable}
        disabled={loading}
        style={{
          padding: "10px 20px",
          border: "none",
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          cursor: loading ? "not-allowed" : "pointer",
          background: "#f472b6",
          color: "#000",
          opacity: loading ? 0.6 : 1,
          transition: "all 0.2s",
        }}
      >
        {loading ? "Enabling..." : "Enable notifications"}
      </button>
    </div>
  );
}
