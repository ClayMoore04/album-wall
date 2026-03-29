import { palette } from "./palette";

export const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Space Mono', monospace",
  letterSpacing: 1,
  textTransform: "uppercase",
  color: palette.textMuted,
  marginBottom: 8,
};

export const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 10,
  color: palette.text,
  fontSize: 15,
  fontFamily: "'Syne', sans-serif",
  outline: "none",
  transition: "border-color 0.2s",
  boxSizing: "border-box",
};

export const secondaryBtnStyle = {
  padding: "12px 24px",
  background: palette.surface,
  border: `1px solid ${palette.border}`,
  borderRadius: 10,
  color: palette.text,
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Space Mono', monospace",
  cursor: "pointer",
};

export const primaryBtnStyle = {
  padding: "12px 24px",
  border: "none",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  fontFamily: "'Space Mono', monospace",
  cursor: "pointer",
  background: palette.accent,
  color: "#000",
  transition: "all 0.2s",
};

export const smallBtnStyle = {
  padding: "4px 10px",
  border: `1px solid ${palette.border}`,
  borderRadius: 6,
  background: "transparent",
  color: palette.textMuted,
  fontSize: 10,
  fontWeight: 600,
  fontFamily: "'Space Mono', monospace",
  cursor: "pointer",
};

export const cardStyle = {
  background: palette.cardBg,
  border: `1px solid ${palette.border}`,
  borderRadius: 12,
  padding: 20,
};

export const pillBtnStyle = (active) => ({
  padding: "6px 14px",
  borderRadius: 20,
  border: active
    ? `1px solid ${palette.accent}`
    : `1px solid ${palette.border}`,
  background: active ? "rgba(29,185,84,0.15)" : "transparent",
  color: active ? palette.accent : palette.textMuted,
  fontSize: 12,
  fontWeight: 600,
  fontFamily: "'Space Mono', monospace",
  cursor: "pointer",
  transition: "all 0.15s",
  boxShadow: active ? "0 0 8px rgba(29,185,84,0.2)" : "none",
});

export const elevation = {
  flat: { boxShadow: "none" },
  raised: { boxShadow: "0 2px 8px rgba(0,0,0,0.3)" },
  floating: (accentRgb = "236,72,153") => ({
    boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(${accentRgb},0.08)`,
  }),
};

export const toggleSwitchStyle = (on) => ({
  outer: {
    width: 36,
    height: 20,
    borderRadius: 10,
    background: on ? palette.accent : palette.border,
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
    cursor: "pointer",
  },
  knob: {
    width: 16,
    height: 16,
    borderRadius: 8,
    background: "#fff",
    position: "absolute",
    top: 2,
    left: on ? 18 : 2,
    transition: "left 0.2s",
  },
});
