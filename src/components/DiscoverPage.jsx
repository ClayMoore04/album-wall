import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";
import DiscoverWallCard from "./DiscoverWallCard";

export default function DiscoverPage() {
  const { user, profile } = useAuth();
  const [walls, setWalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("popular");

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

  const filtered = walls
    .filter((w) =>
      w.display_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === "popular") return b.follower_count - a.follower_count;
      if (sort === "albums") return b.submission_count - a.submission_count;
      return 0;
    });

  const toggleStyle = (active) => ({
    padding: "5px 14px",
    borderRadius: 8,
    border: "none",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Space Mono', monospace",
    cursor: "pointer",
    background: active ? palette.accent : "transparent",
    color: active ? "#000" : palette.textMuted,
    transition: "all 0.15s",
  });

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 0" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Discover Walls<span style={{ color: palette.accent }}>.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            color: palette.textMuted,
            fontSize: 14,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 28,
          }}
        >
          Find walls to follow and explore new music.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 20,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            style={{
              flex: 1,
              padding: "10px 14px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              color: palette.text,
              fontSize: 14,
              fontFamily: "'Syne', sans-serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "inline-flex",
              gap: 2,
              background: palette.surface,
              borderRadius: 10,
              padding: 3,
              border: `1px solid ${palette.border}`,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => setSort("popular")}
              style={toggleStyle(sort === "popular")}
            >
              Popular
            </button>
            <button
              type="button"
              onClick={() => setSort("albums")}
              style={toggleStyle(sort === "albums")}
            >
              Most Albums
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: palette.textMuted,
              fontSize: 14,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: palette.textMuted,
              fontSize: 14,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            {search
              ? "No walls match your search."
              : "No discoverable walls yet. Be the first!"}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 14,
            }}
          >
            {filtered.map((wall) => (
              <DiscoverWallCard key={wall.id} wall={wall} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
