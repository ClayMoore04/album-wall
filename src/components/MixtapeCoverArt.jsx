import { palette } from "../lib/palette";

export default function MixtapeCoverArt({ tracks, coverArtIndex, size = 120 }) {
  // Single art from a specific track
  if (
    coverArtIndex !== null &&
    coverArtIndex !== undefined &&
    tracks[coverArtIndex]?.album_art_url
  ) {
    return (
      <img
        src={tracks[coverArtIndex].album_art_url}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          objectFit: "cover",
        }}
      />
    );
  }

  // Collage from first 4 tracks with art
  const arts = tracks
    .filter((t) => t.album_art_url)
    .slice(0, 4)
    .map((t) => t.album_art_url);

  if (arts.length === 0) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 8,
          background: palette.surface,
          border: `1px solid ${palette.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.3,
          color: palette.textDim,
          fontFamily: "'Space Mono', monospace",
          fontWeight: 700,
        }}
      >
        M
      </div>
    );
  }

  // Fill to 4 slots
  while (arts.length < 4) arts.push(null);

  const half = size / 2;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        width: size,
        height: size,
        borderRadius: 8,
        overflow: "hidden",
        gap: 1,
        background: palette.border,
      }}
    >
      {arts.map((url, i) =>
        url ? (
          <img
            key={i}
            src={url}
            alt=""
            style={{
              width: half,
              height: half,
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : (
          <div
            key={i}
            style={{
              width: half,
              height: half,
              background: palette.surface,
            }}
          />
        )
      )}
    </div>
  );
}
