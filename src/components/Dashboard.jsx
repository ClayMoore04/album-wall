import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthProvider";
import { palette } from "../lib/palette";
import { THEMES, BANNER_PRESETS, getBannerCss } from "../lib/themes";
import { useToast } from "./Toast";
import { DashboardCardSkeleton } from "./Skeleton";
import ActivityFeed from "./ActivityFeed";
import TapeTradeInbox from "./TapeTradeInbox";
import QRCode from "./QRCode";
import EmbedCodeModal from "./EmbedCodeModal";
import OnboardingChecklist from "./OnboardingChecklist";
import PushOptIn from "./PushOptIn";
import { VIBE_TAGS } from "../lib/tags";
import TasteCard from "./TasteCard";

function hexToRgb(hex = "#ec4899") {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

let dashCssInjected = false;
function injectDashCss() {
  if (dashCssInjected || typeof document === "undefined") return;
  const tag = document.createElement("style");
  tag.textContent = `
    @keyframes itb-shimmer {
      0%   { background-position: -100% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes itb-fadeInUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .itb-dash-input:focus  { outline: none; border-color: var(--itb-dash-accent) !important; }
    .itb-dash-ta:focus     { outline: none; border-color: var(--itb-dash-accent) !important; }
  `;
  document.head.appendChild(tag);
  dashCssInjected = true;
}

const cardStyle = () => ({
  background: "#111",
  borderRadius: 12,
  border: "1px solid #1a1a1a",
  overflow: "hidden",
  marginBottom: 12,
  animation: "itb-fadeInUp 0.3s ease both",
});

const cardHeaderStyle = { padding: "14px 16px 12px", borderBottom: "1px solid #161616" };
const cardBodyStyle = { padding: "14px 16px" };

const labelStyle = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 8, letterSpacing: "0.1em",
  textTransform: "uppercase",
  display: "block", marginBottom: 6,
};

function DashCard({ title, subtitle, children, accent, accentRgb, delay = 0, action }) {
  return (
    <div style={{ ...cardStyle(), animationDelay: `${delay}s` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, rgba(${accentRgb},0.5), transparent)` }} />
      <div style={cardHeaderStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "#e8e6e3", margin: 0, lineHeight: 1.2 }}>{title}</h2>
            {subtitle && <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: "#2e2e2e", letterSpacing: "0.06em", margin: "3px 0 0" }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      </div>
      <div style={cardBodyStyle}>{children}</div>
    </div>
  );
}

function DashInput({ value, onChange, placeholder, multiline = false, maxLength, accent }) {
  const base = {
    width: "100%", background: "#0e0e0e", border: "1px solid #1e1e1e",
    borderRadius: 8, color: "#e8e6e3", fontFamily: "'Syne', sans-serif",
    fontSize: 13, padding: "9px 12px", boxSizing: "border-box",
    transition: "border-color 0.15s", lineHeight: 1.5,
    resize: multiline ? "vertical" : "none",
  };
  return multiline ? (
    <textarea className="itb-dash-ta" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} rows={3} style={base} />
  ) : (
    <input className="itb-dash-input" type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} style={base} />
  );
}

function Toggle({ checked, onChange, accent, label }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
      <div style={{ position: "relative", width: 36, height: 20 }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          background: checked ? accent : "#1e1e1e",
          border: "1px solid #2a2a2a", transition: "background 0.2s",
        }} />
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff", transition: "left 0.2s",
        }} />
      </div>
      {label && <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: "#777" }}>{label}</span>}
    </label>
  );
}

function SaveBtn({ onClick, saving, saved, accent, accentRgb }) {
  return (
    <button onClick={onClick} disabled={saving} style={{
      background: saved ? `rgba(${accentRgb},0.1)` : accent,
      border: saved ? `1px solid rgba(${accentRgb},0.4)` : "none",
      borderRadius: 7, color: saved ? accent : "#000",
      fontFamily: "'Space Mono', monospace", fontSize: 9, fontWeight: 700,
      letterSpacing: "0.08em", padding: "7px 16px",
      cursor: saving ? "default" : "pointer",
      opacity: saving ? 0.6 : 1, transition: "all 0.15s",
    }}>
      {saving ? "SAVING..." : saved ? "✓ SAVED" : "SAVE"}
    </button>
  );
}

function AccordionSection({ title, sectionKey, openSection, setOpenSection, accent, accentRgb, children }) {
  const isOpen = openSection === sectionKey;
  return (
    <div style={{
      background: "#111",
      borderRadius: 12,
      border: `1px solid ${isOpen ? `rgba(${accentRgb},0.2)` : "#1a1a1a"}`,
      marginBottom: 10,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      <div style={{ height: 2, background: isOpen ? `linear-gradient(90deg, rgba(${accentRgb},0.5), transparent)` : `rgba(${accentRgb},0.15)` }} />
      <button
        onClick={() => setOpenSection(isOpen ? null : sectionKey)}
        style={{
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          background: "none", border: "none",
          cursor: "pointer",
          color: "#e8e6e3",
        }}
      >
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 14, fontWeight: 700,
        }}>{title}</span>
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 12, color: "#333",
          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▾</span>
      </button>
      {isOpen && (
        <div style={{ padding: "0 16px 16px", animation: "itb-fadeInUp 0.2s ease both" }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  injectDashCss();

  const navigate = useNavigate();
  const { user, profile, loading, signOut, loadProfile } = useAuth();
  const { showToast } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [theme, setTheme] = useState("default");
  const [bannerStyle, setBannerStyle] = useState("none");
  const [bannerUrl, setBannerUrl] = useState("");
  const [statusText, setStatusText] = useState("");
  const [vibeTags, setVibeTags] = useState([]);
  const [vibeInput, setVibeInput] = useState("");
  const [discoverable, setDiscoverable] = useState(false);

  const [stats, setStats] = useState({ total: 0, listened: 0 });
  const [submissions, setSubmissions] = useState([]);
  const [following, setFollowing] = useState([]);
  const [roomCount, setRoomCount] = useState(0);
  const [mixtapeCount, setMixtapeCount] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [openSection, setOpenSection] = useState("booth");

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [customSaving, setCustomSaving] = useState(false);
  const [customSaved, setCustomSaved] = useState(false);

  const accent = THEMES[theme]?.accent || palette.accent;
  const accentRgb = hexToRgb(accent);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setDiscoverable(profile.discoverable || false);
      setTheme(profile.theme || "default");
      setBannerStyle(profile.banner_style || "none");
      setBannerUrl(profile.banner_url || "");
      setStatusText(profile.status_text || "");
      setVibeTags(profile.vibe_tags || []);
      document.documentElement.style.setProperty("--itb-dash-accent", THEMES[profile.theme]?.accent || palette.accent);
      loadStats(profile.id);
      loadFollowing(user.id);
      loadRoomCount(user.id);
      loadMixtapeCount(user.id);
    }
  }, [profile]);

  const loadStats = async (wallId) => {
    if (!supabase) return;
    const { data } = await supabase.from("submissions").select("*").eq("wall_id", wallId);
    if (data) {
      setSubmissions(data);
      setStats({ total: data.length, listened: data.filter((s) => s.listened).length });
    }
  };

  const loadFollowing = async (userId) => {
    if (!supabase) return;
    const { data } = await supabase.from("follows").select("following_id, profiles!following_id(id, slug, display_name)").eq("follower_id", userId);
    setFollowing(data || []);
  };

  const loadRoomCount = async (userId) => {
    if (!supabase) return;
    const { count } = await supabase.from("room_members").select("*", { count: "exact", head: true }).eq("user_id", userId);
    setRoomCount(count || 0);
  };

  const loadMixtapeCount = async (userId) => {
    if (!supabase) return;
    const { count } = await supabase.from("mixtapes").select("*", { count: "exact", head: true }).eq("user_id", userId);
    setMixtapeCount(count || 0);
  };

  const addVibeTag = () => {
    const t = vibeInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !vibeTags.includes(t) && vibeTags.length < 5) {
      setVibeTags([...vibeTags, t]);
      setVibeInput("");
    }
  };

  const saveProfile = useCallback(async () => {
    if (!supabase || !user) return;
    setProfileSaving(true);
    try {
      await supabase.from("profiles").update({
        display_name: displayName.trim(),
        bio: bio.trim(),
        vibe_tags: vibeTags,
        discoverable,
      }).eq("id", user.id);
      await loadProfile(user.id);
      showToast("Saved!");
    } catch (e) {
      console.error("Failed to save:", e);
    }
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }, [user, displayName, bio, vibeTags, discoverable, loadProfile, showToast]);

  const saveCustomization = useCallback(async () => {
    if (!supabase || !user) return;
    setCustomSaving(true);
    try {
      await supabase.from("profiles").update({
        theme,
        banner_style: bannerStyle === "none" ? null : bannerStyle,
        banner_url: bannerUrl.trim() || null,
        status_text: statusText.trim() || null,
      }).eq("id", user.id);
      document.documentElement.style.setProperty("--itb-dash-accent", THEMES[theme]?.accent || palette.accent);
      await loadProfile(user.id);
      showToast("Saved!");
    } catch (e) {
      console.error("Failed to save:", e);
    }
    setCustomSaving(false);
    setCustomSaved(true);
    setTimeout(() => setCustomSaved(false), 2500);
  }, [user, theme, bannerStyle, bannerUrl, statusText, loadProfile, showToast]);

  const handleDiscoverableToggle = async () => {
    if (!supabase || !user) return;
    const newVal = !discoverable;
    setDiscoverable(newVal);
    await supabase.from("profiles").update({ discoverable: newVal }).eq("id", user.id);
  };

  const handleUnfollow = async (followingId) => {
    if (!supabase || !user) return;
    await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", followingId);
    setFollowing((prev) => prev.filter((f) => f.following_id !== followingId));
  };

  if (loading || !profile) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px", display: "flex", flexDirection: "column", gap: 24 }}>
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", paddingBottom: 80 }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px" }}>

        {/* Page header */}
        <div style={{
          paddingTop: 28, paddingBottom: 24,
          borderBottom: "1px solid #141414",
          marginBottom: 20,
          display: "flex", alignItems: "flex-end",
          justifyContent: "space-between",
        }}>
          <div>
            <div style={{ width: 32, height: 3, background: accent, borderRadius: 2, marginBottom: 10 }} />
            <h1 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: "clamp(28px, 8vw, 38px)",
              fontWeight: 800, color: "#e8e6e3",
              letterSpacing: "-0.02em", lineHeight: 1, margin: 0,
            }}>Dashboard</h1>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9, color: "#2a2a2a",
              letterSpacing: "0.08em", marginTop: 6, marginBottom: 0,
            }}>{profile.display_name || user?.email}</p>
          </div>
          <button
            onClick={signOut}
            style={{
              background: "transparent", border: "1px solid #1e1e1e",
              borderRadius: 7, color: "#2a2a2a",
              fontFamily: "'Space Mono', monospace",
              fontSize: 8, letterSpacing: "0.06em",
              padding: "6px 12px", cursor: "pointer",
            }}
          >LOG OUT</button>
        </div>

        {!profile.onboarding_completed_at && !onboardingDismissed && (
          <div style={{ marginBottom: 12 }}>
            <OnboardingChecklist
              profile={profile}
              stats={stats}
              onDismiss={() => setOnboardingDismissed(true)}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <PushOptIn />
        </div>

        {/* Accordion sections */}
        <AccordionSection title="Your Booth" sectionKey="booth" openSection={openSection} setOpenSection={setOpenSection} accent={accent} accentRgb={accentRgb}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { label: "Albums", value: stats.total },
              { label: "Listened", value: stats.listened },
              { label: "Pending", value: stats.total - stats.listened },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: "#0e0e0e", borderRadius: 8,
                border: "1px solid #1a1a1a", padding: "10px 12px", textAlign: "center",
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 3 }}>{value}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#2e2e2e", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
          {/* Booth link */}
          {profile.slug && (
            <div style={{ marginBottom: 12 }}>
              <Link to={`/${profile.slug}`} style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.06em",
                color: accent, textDecoration: "none",
              }}>{window.location.host}/{profile.slug} →</Link>
            </div>
          )}
          {/* QR + Embed */}
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <button onClick={() => setShowQR(!showQR)} style={{
              background: showQR ? `rgba(${accentRgb},0.1)` : "transparent",
              border: `1px solid ${showQR ? `rgba(${accentRgb},0.3)` : "#1e1e1e"}`,
              borderRadius: 7, color: showQR ? accent : "#333",
              fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.06em",
              padding: "6px 12px", cursor: "pointer",
            }}>QR CODE</button>
            <button onClick={() => setShowEmbed(true)} style={{
              background: "transparent", border: "1px solid #1e1e1e",
              borderRadius: 7, color: "#333",
              fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.06em",
              padding: "6px 12px", cursor: "pointer",
            }}>EMBED</button>
          </div>
          {showQR && profile.slug && <QRCode url={`${window.location.origin}/${profile.slug}`} />}
          <TasteCard profile={profile} submissions={submissions} />
        </AccordionSection>

        <AccordionSection title="Settings" sectionKey="settings" openSection={openSection} setOpenSection={setOpenSection} accent={accent} accentRgb={accentRgb}>
          {/* Profile */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>PROFILE</span>
              <SaveBtn onClick={saveProfile} saving={profileSaving} saved={profileSaved} accent={accent} accentRgb={accentRgb} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Display name</label>
                <DashInput value={displayName} onChange={setDisplayName} placeholder="Your name" maxLength={50} accent={accent} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Bio</label>
                <DashInput value={bio} onChange={setBio} placeholder="A line about your taste..." maxLength={200} multiline accent={accent} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Vibe tags (max 5)</label>
                <div style={{
                  background: "#0e0e0e", border: "1px solid #1e1e1e", borderRadius: 8,
                  padding: "6px 10px", display: "flex", flexWrap: "wrap", gap: 5,
                  alignItems: "center", minHeight: 44,
                }}>
                  {vibeTags.map((tag) => (
                    <span key={tag} style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 8, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: accent,
                      background: `rgba(${accentRgb},0.1)`, border: `1px solid rgba(${accentRgb},0.3)`,
                      borderRadius: 3, padding: "2px 6px", display: "flex", alignItems: "center", gap: 4,
                    }}>
                      {tag}
                      <span onClick={() => setVibeTags(vibeTags.filter((t) => t !== tag))} style={{ cursor: "pointer", opacity: 0.6, fontSize: 10 }}>×</span>
                    </span>
                  ))}
                  {vibeTags.length < 5 && (
                    <input type="text" value={vibeInput}
                      onChange={(e) => setVibeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addVibeTag(); } }}
                      onBlur={addVibeTag}
                      placeholder={vibeTags.length === 0 ? "jazz, late-night..." : ""}
                      style={{ background: "none", border: "none", outline: "none", color: "#e8e6e3", fontFamily: "'Syne', sans-serif", fontSize: 12, flex: 1, minWidth: 80, padding: 0 }}
                    />
                  )}
                </div>
              </div>
              <div onClick={handleDiscoverableToggle} style={{ cursor: "pointer" }}>
                <Toggle checked={discoverable} onChange={() => {}} accent={accent} label="Discoverable — appear in Discover" />
              </div>
            </div>
          </div>
          {/* Customize */}
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>CUSTOMIZE</span>
              <SaveBtn onClick={saveCustomization} saving={customSaving} saved={customSaved} accent={accent} accentRgb={accentRgb} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Accent color</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(THEMES).map(([key, t]) => {
                    const active = theme === key;
                    return (
                      <button key={key} onClick={() => { setTheme(key); document.documentElement.style.setProperty("--itb-dash-accent", t.accent); }} title={t.name} style={{
                        width: 28, height: 28, borderRadius: "50%", background: t.accent,
                        border: active ? "3px solid #e8e6e3" : "2px solid transparent",
                        cursor: "pointer", transform: active ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.12s, border 0.12s", outline: "none", padding: 0,
                      }} />
                    );
                  })}
                </div>
              </div>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Status</label>
                <DashInput value={statusText} onChange={(v) => v.length <= 100 && setStatusText(v)} placeholder="Currently listening to..." maxLength={100} accent={accent} />
              </div>
              <div>
                <label style={{ ...labelStyle, color: accent }}>Banner</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {BANNER_PRESETS.map((b) => {
                    const active = bannerStyle === b.key && !bannerUrl;
                    return (
                      <button key={b.key} onClick={() => { setBannerStyle(b.key); if (b.key !== "none") setBannerUrl(""); }} style={{
                        width: 56, height: 32, borderRadius: 6, background: b.css === "none" ? "#1a1a1a" : b.css,
                        border: `1.5px solid ${active ? accent : "#222"}`, cursor: "pointer", position: "relative", overflow: "hidden", padding: 0,
                      }}>
                        {active && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", background: "rgba(0,0,0,0.3)" }}>✓</span>}
                        {b.key === "none" && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#333" }}>None</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8 }}>
                  <label style={{ ...labelStyle, fontSize: 10, color: "#333" }}>Or paste an image URL</label>
                  <DashInput value={bannerUrl} onChange={(v) => { setBannerUrl(v); if (v) setBannerStyle("none"); }} placeholder="https://..." accent={accent} />
                </div>
              </div>
              {(bannerStyle !== "none" || bannerUrl) && (
                <div>
                  <label style={{ ...labelStyle, fontSize: 10, color: accent }}>Preview</label>
                  <div style={{ height: 60, borderRadius: 8, background: getBannerCss(bannerStyle, bannerUrl), border: `1px solid ${"#1e1e1e"}` }} />
                </div>
              )}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection title="Activity" sectionKey="activity" openSection={openSection} setOpenSection={setOpenSection} accent={accent} accentRgb={accentRgb}>
          {/* Rooms + Mixtapes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              { label: "Rooms", count: roomCount, path: "/rooms", emoji: "🎙" },
              { label: "Mixtapes", count: mixtapeCount, path: "/mixtapes", emoji: "📼" },
            ].map(({ label, count, path, emoji }) => (
              <Link key={path} to={path} style={{ textDecoration: "none" }}>
                <div style={{ background: "#0e0e0e", borderRadius: 8, border: "1px solid #1a1a1a", padding: 14 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: accent, lineHeight: 1, marginBottom: 2 }}>{count}</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 7, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                </div>
              </Link>
            ))}
          </div>
          {/* Tape Trades */}
          <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>TAPE TRADES</div>
            <TapeTradeInbox />
          </div>
        </AccordionSection>

        <AccordionSection title="Social" sectionKey="social" openSection={openSection} setOpenSection={setOpenSection} accent={accent} accentRgb={accentRgb}>
          {/* Following */}
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
            FOLLOWING {following.length > 0 && `(${following.length})`}
          </div>
          {following.length === 0 ? (
            <p style={{ fontSize: 12, color: "#555", fontFamily: "'Space Mono', monospace", margin: "0 0 16px" }}>
              You're not following any walls yet.{" "}
              <Link to="/discover" style={{ color: accent, textDecoration: "none" }}>Discover booths</Link>
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              {following.map((f) => (
                <div key={f.following_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <Link to={`/${f.profiles.slug}`} style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: "#888", textDecoration: "none" }}>
                    {f.profiles.display_name}
                  </Link>
                  <button onClick={() => handleUnfollow(f.following_id)} style={{
                    background: "transparent", border: "1px solid #1e1e1e", borderRadius: 5, color: "#2a2a2a",
                    fontFamily: "'Space Mono', monospace", fontSize: 7, letterSpacing: "0.06em", padding: "3px 8px", cursor: "pointer",
                  }}>UNFOLLOW</button>
                </div>
              ))}
            </div>
          )}
          {/* Activity Feed */}
          {following.length > 0 && (
            <>
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>ACTIVITY</div>
                <ActivityFeed followedWallIds={following.map((f) => f.following_id)} />
              </div>
            </>
          )}
        </AccordionSection>
      </div>

      {showEmbed && (
        <EmbedCodeModal slug={profile.slug} type="wall" onClose={() => setShowEmbed(false)} />
      )}
    </div>
  );
}
