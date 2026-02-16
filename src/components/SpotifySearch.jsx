import { useState, useEffect, useRef, useCallback } from "react";
import { searchSpotify } from "../lib/spotify";
import { palette } from "../lib/palette";
import { inputStyle, labelStyle } from "../lib/styles";

export default function SpotifySearch({ onSelect, forceType }) {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState(forceType || "album");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  // Debounced search with abort + stale-request guard
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const id = ++requestIdRef.current;

      try {
        const items = await searchSpotify(query, searchType, controller.signal);
        if (id !== requestIdRef.current) return;
        setResults(items);
        setOpen(items.length > 0);
        if (items.length === 0)
          setError(
            searchType === "album" ? "No albums found" : "No songs found"
          );
      } catch (e) {
        if (e.name === "AbortError") return;
        if (id !== requestIdRef.current) return;
        setResults([]);
        setError("Search failed — try again");
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timer);
    };
  }, [query, searchType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (item) => {
      onSelect(item);
      setQuery("");
      setResults([]);
      setOpen(false);
      setError(null);
    },
    [onSelect]
  );

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
    <div ref={containerRef} style={{ position: "relative", marginBottom: 16 }}>
      <label style={labelStyle}>
        Search Spotify <span style={{ color: palette.coral }}>*</span>
      </label>

      {/* Album / Song toggle */}
      {!forceType && (
        <div
          style={{
            display: "inline-flex",
            gap: 2,
            background: palette.surface,
            borderRadius: 10,
            padding: 3,
            marginBottom: 8,
            border: `1px solid ${palette.border}`,
          }}
        >
          <button
            type="button"
            onClick={() => setSearchType("album")}
            style={toggleStyle(searchType === "album")}
          >
            Albums
          </button>
          <button
            type="button"
            onClick={() => setSearchType("track")}
            style={toggleStyle(searchType === "track")}
          >
            Songs
          </button>
        </div>
      )}

      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder={
            searchType === "album"
              ? "Search for an album..."
              : "Search for a song..."
          }
          style={inputStyle}
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 12,
              color: palette.accent,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            searching...
          </div>
        )}
      </div>

      {/* Error message */}
      {error && !loading && !open && query.trim() && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {error}
        </div>
      )}

      {/* Dropdown results */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 100,
            maxHeight: 320,
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {results.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => handleSelect(item)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 14px",
                border: "none",
                borderBottom: `1px solid ${palette.border}`,
                background: "transparent",
                color: palette.text,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = palette.surfaceHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: item.type === "track" ? 4 : 6,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: item.type === "track" ? 4 : 6,
                    background: palette.border,
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Syne', sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.name}
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      fontSize: 9,
                      fontWeight: 700,
                      fontFamily: "'Space Mono', monospace",
                      textTransform: "uppercase",
                      padding: "1px 5px",
                      borderRadius: 3,
                      background:
                        item.type === "track"
                          ? "rgba(255,107,107,0.15)"
                          : "rgba(29,185,84,0.15)",
                      color:
                        item.type === "track" ? palette.coral : palette.accent,
                    }}
                  >
                    {item.type === "track" ? "Song" : "Album"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: palette.textMuted,
                    fontFamily: "'Space Mono', monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.artist}
                  {item.type === "track" && item.albumName
                    ? ` · ${item.albumName}`
                    : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
