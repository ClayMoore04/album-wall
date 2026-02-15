import { Routes, Route } from "react-router-dom";
import { palette } from "./lib/palette";
import LandingPage from "./components/LandingPage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import DiscoverPage from "./components/DiscoverPage";
import RoomListPage from "./components/RoomListPage";
import RoomJoinPage from "./components/RoomJoinPage";
import RoomPage from "./components/RoomPage";
import WallPage from "./components/WallPage";
import SpotifyCallback from "./components/SpotifyCallback";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: palette.bg,
        color: palette.text,
        fontFamily: "'Syne', 'Helvetica Neue', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background gradient */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(29,185,84,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(255,107,107,0.04) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<SpotifyCallback />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/rooms" element={<RoomListPage />} />
          <Route path="/room/join/:inviteCode" element={<RoomJoinPage />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
          <Route path="/:slug" element={<WallPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </div>
    </div>
  );
}
