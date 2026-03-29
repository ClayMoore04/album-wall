import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { palette, noiseOverlay } from "../lib/palette";
import { extractColor, hexToRgb } from "../lib/colorExtract";
import { injectAnimations } from "../lib/animations";
import MixtapeCoverArt from "./MixtapeCoverArt";

// Inject ambient pulse keyframes once
const PULSE_CSS = `
@keyframes ambientPulse {
  0%, 100% { opacity: 0.03; }
  50% { opacity: 0.07; }
}
`;
let pulseInjected = false;
function injectPulse() {
  if (pulseInjected) return;
  pulseInjected = true;
  const style = document.createElement("style");
  style.textContent = PULSE_CSS;
  document.head.appendChild(style);
}

export default function MixtapeOfTheWeek() {
  const [featured, setFeatured] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [artColor, setArtColor] = useState(null);

  useEffect(() => {
    injectPulse();
    injectAnimations();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase.rpc("get_mixtape_of_the_week");
      if (data && data.length > 0) {
        setFeatured(data[0]);
        // Fetch first 4 tracks for cover art
        const { data: trackData } = await supabase
          .from("mixtape_tracks")
          .select("album_art_url")
          .eq("mixtape_id", data[0].id)
          .order("position", { ascending: true })
          .limit(4);
        setTracks(trackData || []);

        // Extract dominant color from cover art
        const coverUrl = data[0].custom_cover_url
          || (trackData && trackData.find((t) => t.album_art_url)?.album_art_url);
        if (coverUrl) {
          extractColor(coverUrl).then((c) => { if (c) setArtColor(c); });
        }
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !featured) return null;

  const glowColor = artColor || "#ef4444";
  const glowRgb = hexToRgb(glowColor);

  return (
    <div
      style={{
        position: "relative",
        background: `radial-gradient(ellipse at 50% 60%, rgba(${glowRgb},0.10) 0%, transparent 70%)`,
        border: "1px solid #1e1e1e",
        borderRadius: 16,
        padding: 24,
        marginBottom: 28,
        textAlign: "center",
        overflow: "hidden",
        transition: "background 0.6s ease",
      }}
    >
      {/* Pulsing ambient glow layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(${glowRgb},0.15) 0%, transparent 60%)`,
          animation: "ambientPulse 4s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Noise texture overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          ...noiseOverlay,
          pointerEvents: "none",
          borderRadius: 16,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            color: glowColor,
            letterSpacing: 2,
            textTransform: "uppercase",
            marginBottom: 14,
            transition: "color 0.6s ease",
          }}
        >
          MIXTAPE OF THE WEEK
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <MixtapeCoverArt
            tracks={tracks}
            coverArtIndex={featured.cover_art_index}
            customCoverUrl={featured.custom_cover_url}
            size={100}
          />
        </div>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          {featured.title}
        </div>

        {featured.theme && (
          <div
            style={{
              fontSize: 12,
              color: glowColor,
              fontFamily: "'Space Mono', monospace",
              fontStyle: "italic",
              marginBottom: 4,
              transition: "color 0.6s ease",
            }}
          >
            for: {featured.theme}
          </div>
        )}

        <div
          style={{
            fontSize: 12,
            color: "#555",
            fontFamily: "'Space Mono', monospace",
            marginBottom: 14,
          }}
        >
          by{" "}
          <Link
            to={`/${featured.slug}`}
            style={{ color: palette.accent, textDecoration: "none" }}
          >
            {featured.display_name}
          </Link>
          {" \u00B7 "}
          {featured.track_count} track{featured.track_count !== 1 ? "s" : ""}
          {" \u00B7 "}
          {featured.comment_count} reaction
          {featured.comment_count !== 1 ? "s" : ""}
        </div>

        <Link
          to={`/mixtape/${featured.id}`}
          style={{
            display: "inline-block",
            padding: "10px 24px",
            borderRadius: 10,
            background: glowColor,
            color: "#000",
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            textDecoration: "none",
            transition: "background 0.6s ease",
          }}
        >
          Listen now
        </Link>
      </div>
    </div>
  );
}
