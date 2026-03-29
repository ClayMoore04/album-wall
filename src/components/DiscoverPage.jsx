import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import { getThemeAccent } from "../lib/themes";
import { VIBE_TAGS } from "../lib/tags";

import DiscoverWallCard from "./DiscoverWallCard";
import MixtapeOfTheWeek from "./MixtapeOfTheWeek";
import WeeklyChallenge from "./WeeklyChallenge";
import { DiscoverCardSkeleton } from "./Skeleton";

const SORT_OPTIONS = [
  { key: "popular", label: "Popular" },
  { key: "albums", label: "Most Albums" },
  { key: "recent", label: "Recent" },
];

function hexToRgb(hex = "#f472b6") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

let discoverPageCssInjected = false;
function injectDiscoverPageCss() {
  if (discoverPageCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    .itb-discover-search:focus {
      border-color: var(--itb-discover-accent) !important;
      outline: none;
    }
  `;
  document.head.appendChild(tag);
  discoverPageCssInjected = true;
}

export default function DiscoverPage() {
  injectDiscoverPageCss();

  const { user, profile } = useAuth();
  const accent = getThemeAccent(profile?.theme);
  const accentRgb = hexToRgb(accent);

  const [walls, setWalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    document.documentElement.style.setProperty("--itb-discover-accent", accent);
  }, [accent]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("get_discoverable_walls");
      if (!error && data) setWalls(data);
      setLoading(false);
    })();
  }, []);

  const availableTags = useMemo(() => {
    const tagSet = new Set();
    walls.forEach((w) => (w.vibe_tags || []).forEach((t) => tagSet.add(t)));
    return VIBE_TAGS.filter((t) => tagSet.has(t));
  }, [walls]);

  const filtered = useMemo(() => {
    let result = walls;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((w) =>
        w.display_name?.toLowerCase().includes(q) ||
        w.bio?.toLowerCase().includes(q)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((w) =>
        selectedTags.some((t) => (w.vibe_tags || []).includes(t))
      );
    }

    if (sort === "popular") result = [...result].sort((a, b) => (b.follower_count ?? 0) - (a.follower_count ?? 0));
    if (sort === "albums") result = [...result].sort((a, b) => (b.submission_count ?? 0) - (a.submission_count ?? 0));
    if (sort === "recent") result = [...result].sort((a, b) => {
      const aDate = a.last_submission_at || "";
      const bDate = b.last_submission_at || "";
      return bDate.localeCompare(aDate);
    });

    return result;
  }, [walls, search, sort, selectedTags]);

  return (
    <>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 0" }}>

        {/* Weekly Challenge */}
        <WeeklyChallenge />

        {/* MixtapeOfTheWeek */}
        <div style={{ marginBottom: 28 }}>
          <MixtapeOfTheWeek />
        </div>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "clamp(32px, 9vw, 48px)",
            fontWeight: 800,
            color: "#e8e6e3",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            margin: "0 0 4px",
          }}>
            Discover
            <span style={{ color: accent, marginLeft: 2 }}>.</span>
          </h1>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            letterSpacing: "0.1em",
            color: "#2e2e2e",
            textTransform: "uppercase",
            margin: 0,
          }}>
            {walls.length} booths · find your people
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input
            className="itb-discover-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search booths..."
            style={{
              width: "100%",
              background: "#111",
              border: "1px solid #1e1e1e",
              borderRadius: 8,
              color: "#e8e6e3",
              fontFamily: "'Syne', sans-serif",
              fontSize: 13,
              padding: "10px 14px",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
          />
        </div>

        {/* Sort + tag filters */}
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 20,
        }}>
          {SORT_OPTIONS.map((opt) => {
            const active = sort === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: active ? `1px solid ${accent}` : "1px solid #1e1e1e",
                  background: active ? accent : "transparent",
                  color: active ? "#000" : "#555",
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{opt.label}</button>
            );
          })}

          {availableTags.length > 0 && (
            <span style={{ width: 1, height: 14, background: "#1e1e1e", flexShrink: 0 }} />
          )}

          {availableTags.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    active ? prev.filter((t) => t !== tag) : [...prev, tag]
                  )
                }
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 7,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "3px 8px",
                  borderRadius: 20,
                  border: `1px solid ${active ? `rgba(${accentRgb},0.5)` : "#1a1a1a"}`,
                  background: active ? `rgba(${accentRgb},0.1)` : "transparent",
                  color: active ? accent : "#2a2a2a",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{tag}</button>
            );
          })}

          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTags([])}
              style={{
                padding: "4px 10px",
                borderRadius: 16,
                border: "none",
                background: "transparent",
                color: "#333",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {[0, 1, 2, 3].map((i) => (
              <DiscoverCardSkeleton key={i} delay={i * 0.12} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#111",
            border: "1px solid #1e1e1e",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>
              {search ? "🔍" : "🎙"}
            </div>
            <div style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 16, fontWeight: 700,
              color: "#e8e6e3",
              marginBottom: 6,
            }}>
              {search ? "No booths found" : "No booths yet"}
            </div>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11, color: "#555",
              marginBottom: 20,
              lineHeight: 1.5,
            }}>
              {search ? "Try a different search term." : "Be the first to set up your booth."}
            </div>
            {!search && (
              <Link to="/signup" style={{
                display: "inline-block",
                padding: "10px 24px",
                background: accent,
                borderRadius: 10,
                color: "#000",
                fontSize: 12, fontWeight: 700,
                fontFamily: "'Space Mono', monospace",
                textDecoration: "none",
              }}>
                Create your booth
              </Link>
            )}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}>
            {filtered.map((wall, i) => (
              <DiscoverWallCard key={wall.id} wall={wall} entranceIndex={i} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
