# The Booth — Ideas & Roadmap

## Look & Feel

### Dark Mode Polish
- Add subtle noise/grain texture to the background for a vinyl/analog feel
- Introduce a warm amber accent alongside the Spotify green — coral is already there, lean into a dual-accent system (green = actions, coral = creative/mixtape features)
- Animate page transitions with a smooth slide or fade (react-router + CSS transitions)
- Add a subtle parallax scroll on the landing page

### Album Art as Atmosphere
- Pull dominant color from album art and use it as a soft glow/gradient behind the card — makes each wall feel alive and unique
- On the wall grid, add a slight tilt/shadow on hover so albums feel like physical records
- Full-bleed album art header on individual mixtape pages

### Typography & Branding
- Custom wordmark for "The Booth" — a hand-drawn or slightly distressed logo that feels like a sticker on a DJ booth
- Animate the landing page tagline with a typewriter effect: "Slide into the booth."
- Add a subtle cassette tape or vinyl SVG motif as a section divider

### Mobile Experience
- Bottom tab bar on mobile instead of top nav (Discover, My Booth, Mixtapes, Rooms)
- Swipe-to-navigate between wall tabs (Submit / Wall / Playlist / Stats)
- Pull-to-refresh on wall and discover pages
- Haptic feedback patterns on mobile actions (if supported)

---

## Features

### Booth Customization
- **Themes**: Let users pick a color scheme or vibe for their booth (dark, warm, neon, pastel) — the booth URL reflects their personality
- **Pinned albums**: Owner can pin 1-3 albums to the top of their wall as "current rotation"
- **Custom banner image**: Upload or pick from album art on the wall
- **Booth status**: Short text like "accepting recs" or "listening through the queue" shown on the wall header

### Listening Experience
- **Album of the Day**: Auto-highlight one unlistened album daily with a special card treatment
- **Listening queue**: Owner can drag albums into an ordered queue and work through them
- **Listening journal**: When marking an album as listened, prompt for a quick reaction (1-2 sentences, favorite track, mood) — more structured than the current rating
- **Streak tracker**: "You've listened to 5 albums this week" — gamify the listening without making it annoying

### Mixtape Enhancements
- **Mixtape cover art**: Auto-generate a collage from the first 4 track album arts, or let users pick one
- **Side A / Side B**: Split the 90 minutes into two 45-minute sides with a visual flip animation
- **Mixtape themes**: Add a "for" field — "for: long drives", "for: sunday morning", "for: heartbreak" — shown as a subtitle
- **Liner notes page**: A single full-page view of all liner notes together, like reading the insert of a CD case
- **Mixtape comments**: Visitors can leave a short reaction after listening
- **Tape trading**: Users can "trade" mixtapes — send one, get one back from the other person
- **Mixtape of the week**: Featured mixtape on the discover page, curated or voted

### Social & Discovery
- **Genre tags on booths**: Users tag their booth with genres (hip-hop, indie, jazz) — filter on discover page
- **Weekly digest email**: "3 new albums were submitted to your booth this week" + activity from followed booths
- **Booth recommendations**: "If you follow X, you might like Y" based on overlapping followers or similar album submissions
- **Guest book**: Visitors can leave a short message on someone's booth without submitting an album
- **Listener profiles**: Even non-booth-owners can have a lightweight profile showing what booths they follow and mixtapes they've contributed to

### Rooms Expansion
- **Room chat**: Simple text chat alongside the collaborative playlist — discuss what to add next
- **Room themes/constraints**: "Only 90s hip-hop" or "Songs under 3 minutes" — the room has rules
- **Voting in rooms**: Members vote on tracks, highest-voted float to top
- **Room playlists export**: Like mixtapes, export the room playlist to Spotify
- **Scheduled listening sessions**: Set a time, everyone joins and listens together (sync play state)

### Spotify Integration
- **Now Playing widget**: If connected to Spotify, show what you're currently listening to on your booth
- **Auto-mark listened**: When Spotify detects you played a submitted album, auto-mark it as listened
- **30-second previews on wall**: Play previews directly on album cards without needing a full Spotify embed
- **Spotify stats integration**: Show your top genres/artists on your booth profile (optional, with permission)

---

## Growth & Community

### Sharing & Virality
- **OG image generation**: Dynamic open graph images for walls and mixtapes — when shared on social media, show album art grid or mixtape cover
- **Embeddable widget**: A small iframe other sites can embed showing your booth's latest additions
- **QR codes**: Generate a QR code for your booth URL — print it, put it on a sticker, hand it out at shows
- **"Submit to my booth" button**: A simple HTML snippet users can add to their Linktree, blog, or social bio

### Gamification (Light Touch)
- **Booth milestones**: "50 albums submitted!", "First mixtape created", "10 followers" — small celebrations, not leaderboards
- **Listener badges**: Subtle badges on your profile for things like "listened to 100 albums", "made 5 mixtapes", "joined 3 rooms"
- **Seasonal events**: "Summer Mixtape Challenge" — make a mixtape with a theme, get featured on discover

### Content & Curation
- **Staff picks**: A curated section on discover highlighting interesting booths or mixtapes
- **Genre charts**: Aggregate most-submitted albums across all booths — "trending on The Booth"
- **Mixtape playlists**: Curated collections of mixtapes by theme ("Road Trip Tapes", "Late Night Tapes")

---

## Technical Improvements

### Performance
- Lazy load album art images with blur-up placeholders
- Virtualize long wall lists (react-window) for booths with 100+ albums
- Service worker for offline browsing of your own booth
- Optimistic UI updates for all mutations (add track, follow, rate)

### Infrastructure
- Edge functions for Spotify search (faster cold starts)
- Image CDN for album art (resize + cache)
- Rate limiting on public endpoints (submit, search)
- Database indexes audit as data grows

### Developer Experience
- Component library extraction (Button, Card, Input, Toggle as reusable primitives)
- Move from inline styles to CSS modules or Tailwind for maintainability
- Add error boundaries around each page
- Basic analytics (page views, feature usage) with something privacy-friendly like Plausible

---

## Moonshot Ideas

- **AI DJ**: Given your wall's albums, generate a "you might also like" recommendation using embeddings
- **Vinyl mode**: A skeuomorphic view where your wall looks like a record crate you flip through
- **Audio messages**: Record a 15-second voice note as a liner note on a mixtape track
- **Local Booth meetups**: Map view of booths near you — meet other music people IRL
- **Booth radio**: Auto-play through all albums on a wall as a continuous radio stream (using Spotify playback SDK)
