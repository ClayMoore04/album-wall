import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { palette } from "../lib/palette";

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message, duration = 2000) => {
    setToast({ message, duration });
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const fadeTimer = setTimeout(() => setVisible(false), toast.duration - 300);
    const clearTimer = setTimeout(() => setToast(null), toast.duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 24px",
            borderRadius: 10,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            color: palette.text,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            zIndex: 9999,
            opacity: visible ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
          }}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
