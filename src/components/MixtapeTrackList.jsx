import SpotifySearch from "./SpotifySearch";
import MixtapeTrackCard from "./MixtapeTrackCard";

export default function MixtapeTrackList({
  user,
  mixtape,
  tracks,
  sideATracks,
  sideBTracks,
  sideBStartIndex,
  isOwner,
  isCollaborator,
  canAddTrack,
  canAddTrackNow,
  contributorName,
  setContributorName,
  playingTrackId,
  setPlayingTrackId,
  editingNotesId,
  setEditingNotesId,
  notesValue,
  setNotesValue,
  handleAddTrack,
  handleRemove,
  handleMove,
  handleSaveNotes,
}) {
  return (
    <>
      {/* Search */}
      {(canAddTrack || !mixtape.is_collab) && (
        <div
          style={{
            background: "#111",
            border: `1px solid #1e1e1e`,
            borderRadius: 14,
            padding: 20,
            marginBottom: 20,
            opacity: canAddTrackNow ? 1 : 0.4,
            pointerEvents: canAddTrackNow ? "auto" : "none",
            transition: "opacity 0.3s",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
              color: "#555",
              letterSpacing: 1,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Add a track
          </div>
          {!isOwner && !isCollaborator && (
            <input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="Your name..."
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "#0e0e0e",
                border: `1px solid #1e1e1e`,
                borderRadius: 10,
                color: "#e8e6e3",
                fontSize: 14,
                fontFamily: "'Syne', sans-serif",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 12,
              }}
            />
          )}
          <SpotifySearch onSelect={handleAddTrack} forceType="track" />
        </div>
      )}

      {/* Track list header */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          color: "#555",
          letterSpacing: 1,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Tracklist ({tracks.length} track{tracks.length !== 1 ? "s" : ""})
      </div>

      {/* Track list */}
      {tracks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#555",
            fontSize: 13,
            fontFamily: "'Space Mono', monospace",
          }}
        >
          {isOwner || isCollaborator
            ? "No tracks yet. Search and add some!"
            : "This mixtape is empty."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sideATracks.map((track, i) => {
            const index = i;
            return (
              <MixtapeTrackCard
                key={track.id}
                track={track}
                index={index}
                isOwner={isOwner}
                isCollaborator={isCollaborator}
                isTrackAuthor={user && track.added_by_user_id === user.id}
                isFirst={index === 0}
                isLast={index === tracks.length - 1}
                addedByName={
                  track.profiles?.display_name || track.added_by_name
                }
                isPlaying={playingTrackId === track.id}
                onPlay={() =>
                  setPlayingTrackId(
                    playingTrackId === track.id ? null : track.id
                  )
                }
                onMoveUp={() => handleMove(index, -1)}
                onMoveDown={() => handleMove(index, 1)}
                onRemove={() => handleRemove(track.id)}
                onEditNotes={() => {
                  if (editingNotesId === track.id) {
                    handleSaveNotes();
                  } else {
                    setEditingNotesId(track.id);
                    setNotesValue(track.liner_notes || "");
                  }
                }}
                editingNotes={editingNotesId === track.id}
                notesValue={notesValue}
                onNotesChange={setNotesValue}
                onNotesSave={handleSaveNotes}
              />
            );
          })}

          {/* Side B divider */}
          {sideBTracks.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 0",
                margin: "8px 0",
              }}
            >
              <div
                style={{ flex: 1, height: 1, background: "#1e1e1e" }}
              />
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  color: "#ef4444",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                FLIP — SIDE B
              </div>
              <div
                style={{ flex: 1, height: 1, background: "#1e1e1e" }}
              />
            </div>
          )}

          {sideBTracks.map((track, i) => {
            const index = sideBStartIndex + i;
            return (
              <MixtapeTrackCard
                key={track.id}
                track={track}
                index={index}
                isOwner={isOwner}
                isCollaborator={isCollaborator}
                isTrackAuthor={user && track.added_by_user_id === user.id}
                isFirst={index === 0}
                isLast={index === tracks.length - 1}
                addedByName={
                  track.profiles?.display_name || track.added_by_name
                }
                isPlaying={playingTrackId === track.id}
                onPlay={() =>
                  setPlayingTrackId(
                    playingTrackId === track.id ? null : track.id
                  )
                }
                onMoveUp={() => handleMove(index, -1)}
                onMoveDown={() => handleMove(index, 1)}
                onRemove={() => handleRemove(track.id)}
                onEditNotes={() => {
                  if (editingNotesId === track.id) {
                    handleSaveNotes();
                  } else {
                    setEditingNotesId(track.id);
                    setNotesValue(track.liner_notes || "");
                  }
                }}
                editingNotes={editingNotesId === track.id}
                notesValue={notesValue}
                onNotesChange={setNotesValue}
                onNotesSave={handleSaveNotes}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
