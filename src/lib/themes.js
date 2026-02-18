export const THEMES = {
  default: { name: "Spotify Green", accent: "#1DB954", emoji: "🟢" },
  coral: { name: "Coral", accent: "#ff6b6b", emoji: "🔴" },
  purple: { name: "Purple", accent: "#a855f7", emoji: "🟣" },
  ocean: { name: "Ocean", accent: "#3b82f6", emoji: "🔵" },
  gold: { name: "Gold", accent: "#f59e0b", emoji: "🟡" },
  rose: { name: "Rose", accent: "#ec4899", emoji: "🩷" },
  mono: { name: "Mono", accent: "#999999", emoji: "⚪" },
  neon: { name: "Neon", accent: "#06b6d4", emoji: "🩵" },
};

export const BANNER_PRESETS = [
  {
    key: "none",
    label: "None",
    css: "none",
  },
  {
    key: "gradient-1",
    label: "Sunset",
    css: "linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)",
  },
  {
    key: "gradient-2",
    label: "Ocean",
    css: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)",
  },
  {
    key: "gradient-3",
    label: "Forest",
    css: "linear-gradient(135deg, #059669 0%, #1DB954 50%, #84cc16 100%)",
  },
  {
    key: "gradient-4",
    label: "Midnight",
    css: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
  },
  {
    key: "gradient-5",
    label: "Ember",
    css: "linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #f97316 100%)",
  },
  {
    key: "gradient-6",
    label: "Aurora",
    css: "linear-gradient(135deg, #06b6d4 0%, #10b981 33%, #8b5cf6 66%, #ec4899 100%)",
  },
];

export const getBannerCss = (bannerStyle, bannerUrl) => {
  if (bannerUrl) return `url(${bannerUrl}) center/cover no-repeat`;
  if (!bannerStyle || bannerStyle === "none") return null;
  const preset = BANNER_PRESETS.find((b) => b.key === bannerStyle);
  return preset ? preset.css : null;
};

export const getThemeAccent = (themeName) => {
  return THEMES[themeName]?.accent || THEMES.default.accent;
};
