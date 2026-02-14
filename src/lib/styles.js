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
