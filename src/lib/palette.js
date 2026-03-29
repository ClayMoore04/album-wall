export const palette = {
  bg: "#0a0a0a",
  surface: "#161616",
  surfaceHover: "#1e1e1e",
  border: "#2a2a2a",
  accent: "#f472b6",
  text: "#f0eeeb",
  textMuted: "#999",
  textDim: "#6b6b6b",
  coral: "#ff7b7b",
  cardBg: "rgba(255,255,255,0.04)",
};

export const noiseOverlay = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
  backgroundRepeat: "repeat",
  backgroundSize: "256px 256px",
};

export const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < (str || "").length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 55%, 45%)`;
};
