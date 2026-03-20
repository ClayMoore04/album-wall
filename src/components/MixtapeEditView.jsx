import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { palette } from "../lib/palette";
import NavBar from "./NavBar";
import MixtapeHeader from "./MixtapeHeader";
import MixtapeVisibilityToggle from "./MixtapeVisibilityToggle";
import MixtapeProgress from "./MixtapeProgress";
import MixtapeTrackList from "./MixtapeTrackList";
import MixtapeExportModal from "./MixtapeExportModal";
import MixtapeComments from "./MixtapeComments";
import CoverDesigner from "./CoverDesigner";

export default function MixtapeEditView(props) {
  const {
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
    editingNotesId,
    setEditingNotesId,
    notesValue,
    setNotesValue,
    tapeWarning,
    contributorName,
    setContributorName,
    copied,
    setCopied,
    collabCopied,
    setCollabCopied,
    showCoverPicker,
    setShowCoverPicker,
    playingTrackId,
    setPlayingTrackId,
    topPlayerIndex,
    setTopPlayerIndex,
    copiedTracks,
    setCopiedTracks,
    showExportModal,
    setShowExportModal,
    playlistName,
    setPlaylistName,
    isPublic,
    setIsPublic,
    exporting,
    exportResult,
    setExportResult,
    exportError,
    handleExport,
    totalMs,
    remainingMs,
    isOwner,
    isCollaborator,
    canEdit,
    connected,
    currentTurn,
    isMyTurn,
    canAddTrack,
    canAddTrackNow,
    sideBStartIndex,
    sideATracks,
    sideBTracks,
    sideAMs,
    sideBMs,
    progressPercent,
    isOverTime,
    isNearFull,
    MAX_DURATION_MS,
    handleAddTrack,
    handleRemove,
    handleMove,
    handleSaveNotes,
    handleSaveTitle,
    handleSaveTheme,
    handleCoverChange,
    handleSaveCustomCover,
    handleDelete,
    handleToggleCollabMode,
    handleToggleVisibility,
    handleLeave,
    startSpotifyAuth,
  } = props;

  const [showCoverDesigner, setShowCoverDesigner] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <NavBar />
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "40px 0" }}>
        <button
          onClick={() => navigate("/mixtapes")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 0",
            border: "none",
            background: "transparent",
            color: palette.textMuted,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Space Mono', monospace",
            cursor: "pointer",
            marginBottom: 12,
            transition: "color 0.15s",
          }}
        >
          ← Back to Mixtapes
        </button>
        <MixtapeHeader
          mixtapeId={mixtapeId}
          user={user}
          mixtape={mixtape}
          tracks={tracks}
          collaborators={collaborators}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          titleValue={titleValue}
          setTitleValue={setTitleValue}
          editingTheme={editingTheme}
          setEditingTheme={setEditingTheme}
          themeValue={themeValue}
          setThemeValue={setThemeValue}
          copied={copied}
          setCopied={setCopied}
          collabCopied={collabCopied}
          setCollabCopied={setCollabCopied}
          showCoverPicker={showCoverPicker}
          setShowCoverPicker={setShowCoverPicker}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
          canEdit={canEdit}
          currentTurn={currentTurn}
          handleSaveTitle={handleSaveTitle}
          handleSaveTheme={handleSaveTheme}
          handleCoverChange={handleCoverChange}
          handleSaveCustomCover={handleSaveCustomCover}
          handleToggleCollabMode={handleToggleCollabMode}
          handleLeave={handleLeave}
          handleDelete={handleDelete}
          onOpenCoverDesigner={() => setShowCoverDesigner(true)}
        />

        {isOwner && (
          <MixtapeVisibilityToggle
            mixtape={mixtape}
            onToggle={handleToggleVisibility}
          />
        )}

        <MixtapeProgress
          tracks={tracks}
          totalMs={totalMs}
          remainingMs={remainingMs}
          progressPercent={progressPercent}
          isOverTime={isOverTime}
          isNearFull={isNearFull}
          MAX_DURATION_MS={MAX_DURATION_MS}
          sideAMs={sideAMs}
          sideBMs={sideBMs}
          tapeWarning={tapeWarning}
          topPlayerIndex={topPlayerIndex}
          setTopPlayerIndex={setTopPlayerIndex}
          playingTrackId={playingTrackId}
          setPlayingTrackId={setPlayingTrackId}
          mixtape={mixtape}
          currentTurn={currentTurn}
          isMyTurn={isMyTurn}
        />

        <MixtapeTrackList
          user={user}
          mixtape={mixtape}
          tracks={tracks}
          sideATracks={sideATracks}
          sideBTracks={sideBTracks}
          sideBStartIndex={sideBStartIndex}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
          canAddTrack={canAddTrack}
          canAddTrackNow={canAddTrackNow}
          contributorName={contributorName}
          setContributorName={setContributorName}
          playingTrackId={playingTrackId}
          setPlayingTrackId={setPlayingTrackId}
          editingNotesId={editingNotesId}
          setEditingNotesId={setEditingNotesId}
          notesValue={notesValue}
          setNotesValue={setNotesValue}
          handleAddTrack={handleAddTrack}
          handleRemove={handleRemove}
          handleMove={handleMove}
          handleSaveNotes={handleSaveNotes}
        />

        <MixtapeComments mixtapeId={mixtapeId} isOwner={isOwner} />

        <MixtapeExportModal
          mixtapeId={mixtapeId}
          mixtape={mixtape}
          tracks={tracks}
          totalMs={totalMs}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
          showExportModal={showExportModal}
          setShowExportModal={setShowExportModal}
          playlistName={playlistName}
          setPlaylistName={setPlaylistName}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          exporting={exporting}
          exportResult={exportResult}
          setExportResult={setExportResult}
          exportError={exportError}
          handleExport={handleExport}
          connected={connected}
          startSpotifyAuth={startSpotifyAuth}
          copiedTracks={copiedTracks}
          setCopiedTracks={setCopiedTracks}
          setCopied={setCopied}
        />
      </div>

      {showCoverDesigner && (
        <CoverDesigner
          mixtapeId={mixtapeId}
          userId={user.id}
          initialShape={mixtape.custom_cover_shape}
          initialData={mixtape.custom_cover_data}
          onSave={handleSaveCustomCover}
          onClose={() => setShowCoverDesigner(false)}
        />
      )}
    </>
  );
}
