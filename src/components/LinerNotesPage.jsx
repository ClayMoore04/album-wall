import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";
import MixtapeCoverArt from "./MixtapeCoverArt";

export default function LinerNotesPage() {
  const { id: mixtapeId } = useParams();
  const [mixtape, setMixtape] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!supabase || !mixtapeId) return;

    (async () => {
      const { data: mixtapeData, error } = await supabase
        .from("mixtapes")
        .select("*, profiles!user_id(display_name, slug)")
        .eq("id", mixtapeId)
        .single();

      if (error || !mixtapeData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setMixtape(mixtapeData);

      const { data: trackData } = await supabase
        .from("mixtape_tracks")
        .select("*")
        .eq("mixtape_id", mixtapeId)
        .order("position", { ascending: true });

      setTracks(trackData || []);
      setLoading(false);
    })();
  }, [mixtapeId]);

  if (loading) {
    return (
      <div
        style={{ textAlign: "center", padding: 80, color: palette.textMuted }}
      >
        Loading...
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
          Not Found
        </h2>
        <p
          style={{
            color: palette.textMuted,
            fontFamily: "'Space Mono', monospace",
            fontSize: 14,
          }}
        >
          This mixtape doesn't exist or is private.
        </p>
      </div>
    );
  }

  const tracksWithNotes = tracks.filter((t) => t.liner_notes);

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <MixtapeCoverArt
              tracks={tracks}
              coverArtIndex={mixtape.cover_art_index}
              size={100}
            />
          </div>
          <h1
            style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px" }}
          >
            {mixtape.title}
          </h1>
          {mixtape.theme && (
            <div
              style={{
                fontSize: 12,
                color: palette.coral,
                fontFamily: "'Space Mono', monospace",
                fontStyle: "italic",
                marginBottom: 2,
              }}
            >
              for: {mixtape.theme}
            </div>
          )}
          <div
            style={{
              fontSize: 12,
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              marginBottom: 6,
            }}
          >
            by{" "}
            <Link
              to={`/${mixtape.profiles?.slug}`}
              style={{ color: palette.accent, textDecoration: "none" }}
            >
              {mixtape.profiles?.display_name || "Unknown"}
            </Link>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: palette.textDim,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginTop: 10,
            }}
          >
            Liner Notes
          </div>
        </div>

        {/* Notes list */}
        {tracksWithNotes.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: palette.textMuted,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            No liner notes on this mixtape yet.
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {tracksWithNotes.map((track) => (
              <div key={track.id} style={{ display: "flex", gap: 14 }}>
                {track.album_art_url ? (
                  <img
                    src={track.album_art_url}
                    alt=""
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 4,
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 4,
                      background: palette.border,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {track.track_name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: palette.textMuted,
                      fontFamily: "'Space Mono', monospace",
                      marginBottom: 8,
                    }}
                  >
                    {track.artist_name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: palette.text,
                      lineHeight: 1.6,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{track.liner_notes}&rdquo;
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link
            to={`/mixtape/${mixtapeId}`}
            style={{
              color: palette.accent,
              fontSize: 12,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
            }}
          >
            &larr; Back to mixtape
          </Link>
        </div>
      </div>
    </>
  );
}
