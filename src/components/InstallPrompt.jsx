import { useState, useEffect } from "react";
import { palette } from "../lib/palette";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Track visits
    const visits = parseInt(localStorage.getItem("booth_visits") || "0", 10) + 1;
    localStorage.setItem("booth_visits", String(visits));

    const dismissed = localStorage.getItem("booth_install_dismissed");
    if (dismissed || visits < 2) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("booth_install_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <div style={styles.textWrap}>
          <span style={styles.title}>Install The Booth</span>
          <span style={styles.subtitle}>Add to your home screen for the best experience</span>
        </div>
        <div style={styles.actions}>
          <button onClick={handleDismiss} style={styles.dismissBtn}>Not now</button>
          <button onClick={handleInstall} style={styles.installBtn}>Install</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    background: "#111",
    borderTop: "1px solid #1e1e1e",
    padding: "14px 16px",
    paddingBottom: "max(14px, env(safe-area-inset-bottom))",
  },
  content: {
    maxWidth: 600,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  textWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: "#e8e6e3",
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    fontSize: 15,
  },
  subtitle: {
    color: "#555",
    fontFamily: "Space Mono, monospace",
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 8,
    flexShrink: 0,
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "#555",
    fontFamily: "Space Mono, monospace",
    fontSize: 13,
    cursor: "pointer",
    padding: "8px 12px",
  },
  installBtn: {
    background: palette.accent,
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontFamily: "Syne, sans-serif",
    fontWeight: 600,
    fontSize: 14,
    padding: "8px 18px",
    cursor: "pointer",
  },
};
