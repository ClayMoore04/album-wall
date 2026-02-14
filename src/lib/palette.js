export const palette = {
  bg: "#0a0a0a",
  surface: "#141414",
  surfaceHover: "#1a1a1a",
  border: "#222",
  accent: "#1DB954",
  text: "#e8e6e3",
  textMuted: "#777",
  textDim: "#555",
  coral: "#ff6b6b",
  cardBg: "rgba(255,255,255,0.03)",
};

export const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
};
