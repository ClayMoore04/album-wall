import { useEffect } from "react";
import { palette } from "../lib/palette";
import { getThemeAccent } from "../lib/themes";
import GatefoldHero from "./GatefoldHero";
import GatefoldTrackList from "./GatefoldTrackList";
import GatefoldComments from "./GatefoldComments";
import GatefoldFooter from "./GatefoldFooter";

export default function MixtapePublicView({
  mixtapeId,
  user,
  mixtape,
  tracks,
  collaborators,
  totalMs,
  isOwner,
  isCollaborator,
  sideATracks,
  sideBTracks,
  sideBStartIndex,
  sideAMs,
  sideBMs,
}) {
  const accent = getThemeAccent(mixtape.color_theme || "default");

  // Set document title
  useEffect(() => {
    const creator = mixtape.profiles?.display_name || "Unknown";
    document.title = `${mixtape.title} - by ${creator} | The Booth`;
    return () => {
      document.title = "The Booth";
    };
  }, [mixtape.title, mixtape.profiles?.display_name]);

  return (
    <div
      style={{
        maxWidth: 640,
        margin: "0 auto",
        minHeight: "100vh",
        background: palette.bg,
      }}
    >
      <GatefoldHero
        mixtape={mixtape}
        tracks={tracks}
        collaborators={collaborators}
        totalMs={totalMs}
        accent={accent}
      />

      <GatefoldTrackList
        tracks={tracks}
        sideATracks={sideATracks}
        sideBTracks={sideBTracks}
        sideBStartIndex={sideBStartIndex}
        sideAMs={sideAMs}
        sideBMs={sideBMs}
        accent={accent}
      />

      <GatefoldComments
        mixtapeId={mixtapeId}
        accent={accent}
      />

      <GatefoldFooter
        mixtape={mixtape}
        mixtapeId={mixtapeId}
        tracks={tracks}
        totalMs={totalMs}
        user={user}
        isOwner={isOwner}
        isCollaborator={isCollaborator}
        accent={accent}
      />
    </div>
  );
}
