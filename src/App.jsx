import { Routes, Route } from "react-router-dom";
import { palette } from "./lib/palette";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/LandingPage";
import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import DiscoverPage from "./components/DiscoverPage";
import RoomListPage from "./components/RoomListPage";
import RoomJoinPage from "./components/RoomJoinPage";
import RoomPage from "./components/RoomPage";
import MixtapeListPage from "./components/MixtapeListPage";
import MixtapePage from "./components/MixtapePage";
import MixtapeJoinPage from "./components/MixtapeJoinPage";
import LinerNotesPage from "./components/LinerNotesPage";
import WallPage from "./components/WallPage";
import SpotifyCallback from "./components/SpotifyCallback";
import HomeFeed from "./components/HomeFeed";
import InstallPrompt from "./components/InstallPrompt";
import MobileTabBar from "./components/MobileTabBar";
import Sidebar from "./components/Sidebar";
import NavBar from "./components/NavBar";

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
      <Sidebar />
      <NavBar />
      <div
        className="app-content"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "32px 20px 80px",
        }}
      >
        <Routes>
          <Route path="/signup" element={<ErrorBoundary><SignUp /></ErrorBoundary>} />
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/callback" element={<ErrorBoundary><SpotifyCallback /></ErrorBoundary>} />
          <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="/feed" element={<ErrorBoundary><HomeFeed /></ErrorBoundary>} />
          <Route path="/discover" element={<ErrorBoundary><DiscoverPage /></ErrorBoundary>} />
          <Route path="/rooms" element={<ErrorBoundary><RoomListPage /></ErrorBoundary>} />
          <Route path="/room/join/:inviteCode" element={<ErrorBoundary><RoomJoinPage /></ErrorBoundary>} />
          <Route path="/room/:roomId" element={<ErrorBoundary><RoomPage /></ErrorBoundary>} />
          <Route path="/mixtapes" element={<ErrorBoundary><MixtapeListPage /></ErrorBoundary>} />
          <Route path="/mixtape/join/:inviteCode" element={<ErrorBoundary><MixtapeJoinPage /></ErrorBoundary>} />
          <Route path="/mixtape/:id/notes" element={<ErrorBoundary><LinerNotesPage /></ErrorBoundary>} />
          <Route path="/mixtape/:id" element={<ErrorBoundary><MixtapePage /></ErrorBoundary>} />
          <Route path="/:slug" element={<ErrorBoundary><WallPage /></ErrorBoundary>} />
          <Route path="/" element={<ErrorBoundary><LandingPage /></ErrorBoundary>} />
        </Routes>
      </div>
      <MobileTabBar />
      <InstallPrompt />
    </div>
  );
}
