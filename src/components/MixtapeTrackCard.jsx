import { palette } from "../lib/palette";
import { inputStyle } from "../lib/styles";

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function MixtapeTrackCard({
  track,
  index,
  isOwner,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onEditNotes,
  editingNotes,
  notesValue,
  onNotesChange,
  onNotesSave,
}) {
  const smallBtnStyle = {
    width: 24,
    height: 24,
    border: `1px solid ${palette.border}`,
    borderRadius: 6,
    background: "transparent",
    color: palette.textMuted,
    cursor: "pointer",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        background: palette.cardBg,
        border: `1px solid ${palette.border}`,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 14px",
        }}
      >
        {/* Position number */}
        <div
          style={{
            width: 24,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: "'Space Mono', monospace",
            color: palette.textDim,
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        {/* Album art */}
        {track.album_art_url ? (
          <img
            src={track.album_art_url}
            alt=""
            style={{
              width: 42,
              height: 42,
              borderRadius: 4,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 4,
              background: palette.border,
              flexShrink: 0,
            }}
          />
        )}

        {/* Track info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track.track_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: palette.textMuted,
              fontFamily: "'Space Mono', monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {track.artist_name}
            {track.album_name && (
              <span style={{ color: palette.textDim }}>
                {" "}
                &middot; {track.album_name}
              </span>
            )}
          </div>
        </div>

        {/* Duration */}
        <div
          style={{
            fontSize: 12,
            fontFamily: "'Space Mono', monospace",
            color: palette.textMuted,
            flexShrink: 0,
          }}
        >
          {formatMs(track.duration_ms)}
        </div>

        {/* Owner controls */}
        {isOwner && (
          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
            <button
              onClick={onEditNotes}
              style={smallBtnStyle}
              title="Liner notes"
            >
              ✎
            </button>
            {!isFirst && (
              <button onClick={onMoveUp} style={smallBtnStyle} title="Move up">
                ↑
              </button>
            )}
            {!isLast && (
              <button
                onClick={onMoveDown}
                style={smallBtnStyle}
                title="Move down"
              >
                ↓
              </button>
            )}
            <button
              onClick={onRemove}
              style={{ ...smallBtnStyle, borderRadius: 12 }}
              title="Remove"
            >
              &times;
            </button>
          </div>
        )}
      </div>

      {/* Liner notes display (read-only) */}
      {track.liner_notes && !editingNotes && (
        <div
          style={{
            padding: "0 14px 10px 50px",
            fontSize: 12,
            fontStyle: "italic",
            color: palette.textMuted,
            lineHeight: 1.5,
          }}
        >
          {track.liner_notes}
        </div>
      )}

      {/* Liner notes editing */}
      {editingNotes && (
        <div style={{ padding: "0 14px 12px 50px" }}>
          <textarea
            value={notesValue}
            onChange={(e) => onNotesChange(e.target.value.slice(0, 250))}
            maxLength={250}
            placeholder="Add liner notes..."
            rows={2}
            style={{
              ...inputStyle,
              fontSize: 13,
              padding: "10px 12px",
              resize: "none",
            }}
            autoFocus
            onBlur={onNotesSave}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onNotesSave();
              }
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: palette.textDim,
              fontFamily: "'Space Mono', monospace",
              textAlign: "right",
              marginTop: 4,
            }}
          >
            {notesValue.length}/250
          </div>
        </div>
      )}
    </div>
  );
}
