import { useState, useEffect, useRef, useCallback } from "react";
import { searchAlbums } from "../lib/spotify";
import { palette } from "../lib/palette";
import { inputStyle, labelStyle } from "../lib/styles";

export default function SpotifySearch({ onSelect }) {
  const [query, setQuery] = useState("");
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
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      // Track this request so stale responses are ignored
      const id = ++requestIdRef.current;

      try {
        const albums = await searchAlbums(query, controller.signal);
        // Only update if this is still the latest request
        if (id !== requestIdRef.current) return;
        setResults(albums);
        setOpen(albums.length > 0);
        if (albums.length === 0) setError("No albums found");
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
  }, [query]);

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
    (album) => {
      onSelect(album);
      setQuery("");
      setResults([]);
      setOpen(false);
      setError(null);
    },
    [onSelect]
  );

  return (
    <div ref={containerRef} style={{ position: "relative", marginBottom: 16 }}>
      <label style={labelStyle}>
        Search Spotify <span style={{ color: palette.coral }}>*</span>
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          placeholder="Search for an album..."
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
          {results.map((album) => (
            <button
              key={album.id}
              onClick={() => handleSelect(album)}
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
              {album.imageUrl ? (
                <img
                  src={album.imageUrl}
                  alt=""
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    background: palette.border,
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
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
                  {album.name}
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
                  {album.artist}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
