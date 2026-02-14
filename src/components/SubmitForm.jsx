import { useState } from "react";
import { palette } from "../lib/palette";
import { inputStyle, labelStyle } from "../lib/styles";
import SpotifySearch from "./SpotifySearch";
import AlbumPreview from "./AlbumPreview";

export default function SubmitForm({ onSubmit }) {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = selectedAlbum && name.trim() && email.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({
      album_name: selectedAlbum.name,
      artist_name: selectedAlbum.artist,
      album_art_url: selectedAlbum.imageUrl,
      spotify_url: selectedAlbum.spotifyUrl,
      spotify_id: selectedAlbum.id,
      submitted_by: name.trim(),
      email: email.trim(),
      note: note.trim(),
    });
    setSubmitting(false);
  };

  return (
    <div>
      {/* Spotify Search or Preview */}
      {selectedAlbum ? (
        <AlbumPreview
          album={selectedAlbum}
          onClear={() => setSelectedAlbum(null)}
        />
      ) : (
        <SpotifySearch onSelect={setSelectedAlbum} />
      )}

      {/* Your Name */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Your name <span style={{ color: palette.coral }}>*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="So Daniel knows who sent this"
          style={inputStyle}
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>
          Your email <span style={{ color: palette.coral }}>*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="So Daniel can let you know what he thinks"
          style={inputStyle}
        />
      </div>

      {/* Note */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>
          Why this album?{" "}
          <span style={{ color: palette.textDim }}>(optional)</span>
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Changed my life, perfect road trip album, you NEED to hear track 5..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        style={{
          width: "100%",
          padding: "16px 24px",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          letterSpacing: "0.02em",
          cursor: !canSubmit ? "not-allowed" : "pointer",
          background: !canSubmit ? palette.border : palette.accent,
          color: !canSubmit ? palette.textDim : "#000",
          transition: "all 0.25s",
          transform: submitting ? "scale(0.98)" : "scale(1)",
        }}
      >
        {submitting ? "Sending..." : "Send to Daniel 🎧"}
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
