import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { palette } from "./lib/palette";
import ErrorBoundary from "./components/ErrorBoundary";
import PageTransition from "./components/PageTransition";
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
  const location = useLocation();
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
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/signup" element={<ErrorBoundary><PageTransition><SignUp /></PageTransition></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary><PageTransition><Login /></PageTransition></ErrorBoundary>} />
            <Route path="/callback" element={<ErrorBoundary><SpotifyCallback /></ErrorBoundary>} />
            <Route path="/dashboard" element={<ErrorBoundary><PageTransition><Dashboard /></PageTransition></ErrorBoundary>} />
            <Route path="/feed" element={<ErrorBoundary><PageTransition><HomeFeed /></PageTransition></ErrorBoundary>} />
            <Route path="/discover" element={<ErrorBoundary><PageTransition><DiscoverPage /></PageTransition></ErrorBoundary>} />
            <Route path="/rooms" element={<ErrorBoundary><PageTransition><RoomListPage /></PageTransition></ErrorBoundary>} />
            <Route path="/room/join/:inviteCode" element={<ErrorBoundary><PageTransition><RoomJoinPage /></PageTransition></ErrorBoundary>} />
            <Route path="/room/:roomId" element={<ErrorBoundary><PageTransition><RoomPage /></PageTransition></ErrorBoundary>} />
            <Route path="/mixtapes" element={<ErrorBoundary><PageTransition><MixtapeListPage /></PageTransition></ErrorBoundary>} />
            <Route path="/mixtape/join/:inviteCode" element={<ErrorBoundary><PageTransition><MixtapeJoinPage /></PageTransition></ErrorBoundary>} />
            <Route path="/mixtape/:id/notes" element={<ErrorBoundary><PageTransition><LinerNotesPage /></PageTransition></ErrorBoundary>} />
            <Route path="/mixtape/:id" element={<ErrorBoundary><PageTransition><MixtapePage /></PageTransition></ErrorBoundary>} />
            <Route path="/:slug" element={<ErrorBoundary><PageTransition><WallPage /></PageTransition></ErrorBoundary>} />
            <Route path="/" element={<ErrorBoundary><PageTransition><LandingPage /></PageTransition></ErrorBoundary>} />
          </Routes>
        </AnimatePresence>
      </div>
      <MobileTabBar />
      <InstallPrompt />
    </div>
  );
}
