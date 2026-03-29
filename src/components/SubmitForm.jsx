import { useState } from "react";
import { motion } from "framer-motion";
import { palette } from "../lib/palette";
import { TAGS } from "../lib/tags";
import SpotifySearch from "./SpotifySearch";
import AlbumPreview from "./AlbumPreview";

function hexToRgb(hex = "#f472b6") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

let submitCssInjected = false;
function injectSubmitCss() {
  if (submitCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-slot-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
    .itb-submit-input:focus {
      outline: none;
      border-color: var(--itb-submit-accent) !important;
    }
    .itb-submit-textarea:focus {
      outline: none;
      border-color: var(--itb-submit-accent) !important;
    }
    .itb-submit-btn:active { transform: scale(0.97); }
  `;
  document.head.appendChild(tag);
  submitCssInjected = true;
}

const SLOT_COPY = [
  "Drop an album into the booth.",
  "What should they hear next?",
  "Slide a record into the slot.",
  "Leave something worth listening to.",
  "What's the one they need to hear?",
];

function getSlotCopy(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return SLOT_COPY[Math.abs(hash) % SLOT_COPY.length];
}

function Field({ label, children, accent }) {
  return (
    <div style={{ marginBottom: 14, animation: "itb-slot-in 0.25s ease both" }}>
      <label style={{
        display: "block",
        fontFamily: "'Space Mono', monospace",
        fontSize: 8,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: accent,
        marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputBase = {
  width: "100%",
  background: "#0e0e0e",
  border: "1px solid #1e1e1e",
  borderRadius: 8,
  color: "#e8e6e3",
  fontFamily: "'Syne', sans-serif",
  fontSize: 13,
  padding: "10px 12px",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
  lineHeight: 1.4,
  outline: "none",
};

export default function SubmitForm({ onSubmit, ownerName = "them", accent = palette.accent }) {
  injectSubmitCss();

  const accentRgb = hexToRgb(accent);
  const slotCopy = getSlotCopy(ownerName);

  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [hovering, setHovering] = useState(false);

  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--itb-submit-accent", accent);
  }

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

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
      tags: selectedTags,
      website: honeypot,
    });
    setSubmitting(false);
  };

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        position: "relative",
        background: "#111",
        borderRadius: 12,
        border: `1px solid ${hovering ? `rgba(${accentRgb},0.25)` : "#1e1e1e"}`,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, width: 0 }}
      />

      {/* Static trim */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `rgba(${accentRgb},0.35)`,
        opacity: hovering ? 0 : 1,
        transition: "opacity 0.2s",
        zIndex: 1, pointerEvents: "none",
      }} />
      {/* Shimmer trim */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,
          transparent 0%,
          rgba(${accentRgb},0.3) 20%,
          rgba(${accentRgb},1) 50%,
          rgba(${accentRgb},0.3) 80%,
          transparent 100%)`,
        backgroundSize: "200% 100%",
        opacity: hovering ? 1 : 0,
        transition: "opacity 0.2s",
        animation: hovering ? "itb-shimmer 1.2s ease infinite" : "none",
        zIndex: 2, pointerEvents: "none",
      }} />

      <div style={{ padding: "18px 18px 16px" }}>

        {/* Header copy */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 8,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: `rgba(${accentRgb},0.6)`,
            marginBottom: 4,
          }}>
            REC SUBMISSION
          </div>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 18, fontWeight: 800,
            color: "#e8e6e3",
            letterSpacing: "-0.01em",
            margin: 0,
          }}>
            {slotCopy}
          </h2>
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9, color: "#2e2e2e",
            letterSpacing: "0.04em",
            margin: "4px 0 0",
          }}>
            submitting to <span style={{ color: "#444" }}>{ownerName}</span>
          </p>
        </div>

        {/* Spotify Search or Preview */}
        <div style={{ marginBottom: 16 }}>
          {selectedAlbum ? (
            <AlbumPreview
              album={selectedAlbum}
              onClear={() => setSelectedAlbum(null)}
            />
          ) : (
            <SpotifySearch onSelect={setSelectedAlbum} />
          )}
        </div>

        {/* Your Name */}
        <Field label="Your name *" accent={accent}>
          <input
            className="itb-submit-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`So ${ownerName} knows who sent this`}
            style={inputBase}
          />
        </Field>

        {/* Email */}
        <Field label="Your email *" accent={accent}>
          <input
            className="itb-submit-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`So ${ownerName} can let you know what they think`}
            style={inputBase}
          />
        </Field>

        {/* Note */}
        <Field label="Why this album? (optional)" accent={accent}>
          <textarea
            className="itb-submit-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Changed my life, perfect road trip album, you NEED to hear track 5..."
            rows={3}
            style={{ ...inputBase, resize: "vertical", minHeight: 80 }}
          />
        </Field>

        {/* Tags */}
        <Field label="Vibes (optional)" accent={accent}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 8,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: `1px solid ${active ? `rgba(${accentRgb},0.5)` : "#1e1e1e"}`,
                    background: active ? `rgba(${accentRgb},0.1)` : "transparent",
                    color: active ? accent : "#333",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Submit */}
        <motion.button
          className="itb-submit-btn"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          whileTap={canSubmit && !submitting ? { scaleY: 0.93, scaleX: 0.99 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{
            width: "100%",
            background: !canSubmit ? "#1a1a1a" : accent,
            border: "none",
            borderRadius: 8,
            color: !canSubmit ? "#333" : "#000",
            fontFamily: "'Space Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.1em",
            padding: "13px",
            cursor: !canSubmit ? "not-allowed" : "pointer",
            transition: "background 0.2s, color 0.2s",
          }}
        >
          {submitting ? "DROPPING..." : `DROP IT IN THE BOOTH`}
        </motion.button>
      </div>
    </div>
  );
}
