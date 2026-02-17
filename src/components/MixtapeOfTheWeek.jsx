import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import MixtapeCoverArt from "./MixtapeCoverArt";

export default function MixtapeOfTheWeek() {
  const [featured, setFeatured] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !featured) return null;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,107,107,0.08), rgba(29,185,84,0.08))",
        border: `1px solid ${palette.border}`,
        borderRadius: 16,
        padding: 24,
        marginBottom: 28,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          color: palette.coral,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 14,
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
            color: palette.coral,
            fontFamily: "'Space Mono', monospace",
            fontStyle: "italic",
            marginBottom: 4,
          }}
        >
          for: {featured.theme}
        </div>
      )}

      <div
        style={{
          fontSize: 12,
          color: palette.textMuted,
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
          background: palette.coral,
          color: "#000",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
          textDecoration: "none",
        }}
      >
        Listen now
      </Link>
    </div>
  );
}
