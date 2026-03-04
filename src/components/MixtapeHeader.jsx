import { Link } from "react-router-dom";
import { palette } from "../lib/palette";
import MixtapeCoverArt from "./MixtapeCoverArt";
import TapeTradeButton from "./TapeTradeButton";

export default function MixtapeHeader({
  mixtapeId,
  user,
  mixtape,
  tracks,
  collaborators,
  editingTitle,
  setEditingTitle,
  titleValue,
  setTitleValue,
  editingTheme,
  setEditingTheme,
  themeValue,
  setThemeValue,
  copied,
  setCopied,
  collabCopied,
  setCollabCopied,
  showCoverPicker,
  setShowCoverPicker,
  isOwner,
  isCollaborator,
  canEdit,
  currentTurn,
  handleSaveTitle,
  handleSaveTheme,
  handleCoverChange,
  handleSaveCustomCover,
  handleToggleCollabMode,
  handleLeave,
  handleDelete,
  onOpenCoverDesigner,
}) {
  return (
    <div style={{ textAlign: "center", marginBottom: 24 }}>
      {/* Cover Art */}
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", position: "relative" }}>
        <MixtapeCoverArt
          tracks={tracks}
          coverArtIndex={mixtape.cover_art_index}
          customCoverUrl={mixtape.custom_cover_url}
          size={120}
        />
        {canEdit && (
          <div style={{ position: "absolute", bottom: -8 }}>
            <button
              onClick={() => setShowCoverPicker(!showCoverPicker)}
              style={{
                padding: "3px 10px",
                borderRadius: 6,
                border: `1px solid ${palette.border}`,
                background: palette.surface,
                color: palette.textMuted,
                fontSize: 9,
                fontFamily: "'Space Mono', monospace",
                cursor: "pointer",
              }}
            >
              Change cover
            </button>
            {showCoverPicker && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  marginTop: 4,
                  background: palette.surface,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 8,
                  padding: 6,
                  zIndex: 10,
                  minWidth: 180,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                <button
                  onClick={() => handleCoverChange(null)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 10px",
                    border: "none",
                    background:
                      mixtape.cover_art_index === null
                        ? "rgba(29,185,84,0.15)"
                        : "transparent",
                    color: palette.text,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 4,
                  }}
                >
                  Auto collage
                </button>
                {tracks.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => handleCoverChange(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "5px 10px",
                      border: "none",
                      background:
                        mixtape.cover_art_index === i
                          ? "rgba(29,185,84,0.15)"
                          : "transparent",
                      color: palette.text,
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 4,
                    }}
                  >
                    {t.album_art_url && (
                      <img
                        src={t.album_art_url}
                        alt=""
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 3,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.track_name}
                    </span>
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${palette.border}`, margin: "6px 0" }} />
                <button
                  onClick={() => {
                    setShowCoverPicker(false);
                    onOpenCoverDesigner();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 10px",
                    border: "none",
                    background: "transparent",
                    color: palette.coral,
                    fontSize: 11,
                    fontFamily: "'Space Mono', monospace",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {mixtape.custom_cover_url ? "Edit custom design" : "Design your own"}
                </button>
                {mixtape.custom_cover_url && (
                  <button
                    onClick={() => {
                      handleSaveCustomCover(
                        mixtape.custom_cover_url,
                        mixtape.custom_cover_data,
                        mixtape.custom_cover_shape
                      );
                      setShowCoverPicker(false);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "6px 10px",
                      border: "none",
                      background:
                        mixtape.custom_cover_url && !mixtape.cover_art_index
                          ? "rgba(29,185,84,0.15)"
                          : "transparent",
                      color: palette.text,
                      fontSize: 11,
                      fontFamily: "'Space Mono', monospace",
                      cursor: "pointer",
                      textAlign: "left",
                      borderRadius: 4,
                    }}
                  >
                    Use custom design
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Collab badge */}
      {mixtape.is_collab && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              color: palette.coral,
              background: "rgba(255,107,107,0.1)",
              padding: "3px 10px",
              borderRadius: 6,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            COLLAB {mixtape.collab_mode === "turns" ? "/ TURNS" : "/ OPEN"}
          </span>
        </div>
      )}

      {editingTitle && canEdit ? (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 8 }}>
          <input
            type="text"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
            autoFocus
            style={{
              padding: "8px 14px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 10,
              color: palette.text,
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "'Syne', sans-serif",
              outline: "none",
              textAlign: "center",
              width: "100%",
              maxWidth: 360,
            }}
          />
          <button
            onClick={handleSaveTitle}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
            }}
          >
            Save
          </button>
        </div>
      ) : (
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 8px",
            cursor: canEdit ? "pointer" : "default",
          }}
          onClick={() => canEdit && setEditingTitle(true)}
          title={canEdit ? "Click to edit title" : ""}
        >
          {mixtape.title}
        </h1>
      )}

      {/* Theme */}
      {editingTheme ? (
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            marginBottom: 6,
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: palette.coral,
              fontFamily: "'Space Mono', monospace",
            }}
          >
            for:
          </span>
          <input
            type="text"
            value={themeValue}
            onChange={(e) => setThemeValue(e.target.value.slice(0, 50))}
            onKeyDown={(e) => e.key === "Enter" && handleSaveTheme()}
            placeholder="long drives, sunday morning..."
            autoFocus
            maxLength={50}
            style={{
              padding: "6px 12px",
              background: palette.surface,
              border: `1px solid ${palette.border}`,
              borderRadius: 8,
              color: palette.text,
              fontSize: 13,
              fontFamily: "'Space Mono', monospace",
              outline: "none",
              width: 200,
            }}
          />
          <button
            onClick={handleSaveTheme}
            style={{
              padding: "6px 12px",
              border: "none",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              background: palette.accent,
              color: "#000",
            }}
          >
            Save
          </button>
        </div>
      ) : mixtape.theme ? (
        <div
          style={{
            fontSize: 13,
            fontStyle: "italic",
            color: palette.coral,
            fontFamily: "'Space Mono', monospace",
            marginBottom: 4,
            cursor: canEdit ? "pointer" : "default",
          }}
          onClick={() => canEdit && setEditingTheme(true)}
          title={canEdit ? "Click to edit theme" : ""}
        >
          for: {mixtape.theme}
        </div>
      ) : canEdit ? (
        <button
          onClick={() => setEditingTheme(true)}
          style={{
            background: "none",
            border: "none",
            color: palette.textDim,
            fontSize: 11,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            marginBottom: 4,
            padding: 0,
          }}
        >
          + add theme
        </button>
      ) : null}

      {/* Credits line */}
      <div
        style={{
          fontSize: 12,
          color: palette.textMuted,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        by{" "}
        <Link
          to={`/${mixtape.profiles?.slug}`}
          style={{ color: palette.accent, textDecoration: "none" }}
        >
          {mixtape.profiles?.display_name || "Unknown"}
        </Link>
        {mixtape.is_collab &&
          collaborators.length > 0 &&
          collaborators.map((c, i) => (
            <span key={c.user_id}>
              {i === collaborators.length - 1 ? " & " : ", "}
              <Link
                to={`/${c.profiles?.slug}`}
                style={{ color: palette.accent, textDecoration: "none" }}
              >
                {c.profiles?.display_name}
              </Link>
            </span>
          ))}
      </div>

      {/* Collaborator badges (turns mode) */}
      {mixtape.is_collab && collaborators.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 12,
              background: palette.surface,
              border: `1px solid ${currentTurn?.userId === mixtape.user_id ? palette.accent : palette.border}`,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color:
                currentTurn?.userId === mixtape.user_id
                  ? palette.accent
                  : palette.text,
            }}
          >
            {mixtape.profiles?.display_name}
            {currentTurn?.userId === mixtape.user_id && " \u2190"}
          </span>
          {collaborators.map((c) => (
            <span
              key={c.user_id}
              style={{
                padding: "4px 10px",
                borderRadius: 12,
                background: palette.surface,
                border: `1px solid ${currentTurn?.userId === c.user_id ? palette.coral : palette.border}`,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "'Space Mono', monospace",
                color:
                  currentTurn?.userId === c.user_id
                    ? palette.coral
                    : palette.text,
              }}
            >
              {c.profiles?.display_name}
              {currentTurn?.userId === c.user_id && " \u2190"}
            </span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 10, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        {tracks.some((t) => t.liner_notes) && (
          <Link
            to={`/mixtape/${mixtapeId}/notes`}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: palette.textMuted,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              textDecoration: "none",
            }}
          >
            Liner notes
          </Link>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            border: `1px solid ${palette.border}`,
            background: "transparent",
            color: copied ? palette.accent : palette.textMuted,
            fontSize: 10,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            transition: "color 0.2s",
          }}
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        {isOwner && mixtape.is_collab && mixtape.invite_code && (
          <button
            onClick={() => {
              const url = `${window.location.origin}/mixtape/join/${mixtape.invite_code}`;
              navigator.clipboard.writeText(url);
              setCollabCopied(true);
              setTimeout(() => setCollabCopied(false), 2000);
            }}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: collabCopied ? palette.accent : palette.textMuted,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
          >
            {collabCopied ? "Invite copied!" : "Copy invite link"}
          </button>
        )}
        {isOwner && mixtape.is_collab && (
          <button
            onClick={handleToggleCollabMode}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: palette.textMuted,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
            }}
          >
            Mode: {mixtape.collab_mode === "turns" ? "Strict turns" : "Open"}
          </button>
        )}
        {user && !isOwner && !isCollaborator && (
          <TapeTradeButton mixtape={mixtape} />
        )}
        {isCollaborator && !isOwner && (
          <button
            onClick={handleLeave}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: palette.coral,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
            }}
          >
            Leave tape
          </button>
        )}
        {isOwner && (
          <button
            onClick={handleDelete}
            style={{
              padding: "4px 12px",
              borderRadius: 6,
              border: `1px solid ${palette.border}`,
              background: "transparent",
              color: palette.textDim,
              fontSize: 10,
              fontFamily: "'Space Mono', monospace",
              cursor: "pointer",
            }}
          >
            Delete mixtape
          </button>
        )}
      </div>
    </div>
  );
}
