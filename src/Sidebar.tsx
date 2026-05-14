import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GrPlay } from "react-icons/gr";
import { IoHeartOutline, IoPeople, IoArrowForward, IoClose } from "react-icons/io5";
import { HiOutlineUserCircle } from "react-icons/hi";
import CoveLogo from "./CoveLogo";
import { useWatchParty } from "./WatchPartyContext";

interface SidebarProps {
  onNavigate: (page: "home" | "login" | "register" | "favorites" | "settings") => void;
  currentPage: string;
  user: { name: string; email: string } | null;
  onLogout: () => void;
  avatar?: string;
  onOpenWatchParty?: () => void;
}

const NAV_ACTIVE_STYLE = {
  background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #e8997a 100%)",
};

const POPUP_STYLE = {
  background: "linear-gradient(145deg, #0f1220 0%, #111111 100%)",
  border: "1px solid rgba(79, 125, 247, 0.18)",
};

const POPUP_MOTION = {
  initial: { opacity: 0, scale: 0.94, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.94, y: 6 },
  transition: { type: "spring", stiffness: 380, damping: 26 },
} as const;

function PopupContent({
  user,
  onNavigate,
  onLogout,
  close,
}: {
  user: { name: string; email: string } | null;
  onNavigate: SidebarProps["onNavigate"];
  onLogout: () => void;
  close: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const spring = { type: "spring", stiffness: 380, damping: 28 } as const;
  const fastExit = { duration: 0.07 };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.div
          key="confirm"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0, transition: spring }}
          exit={{ opacity: 0, transition: fastExit }}
          className="px-4 py-3"
        >
          <p className="text-base font-bold text-white mb-0.5">Sign out?</p>
          <p className="text-sm text-white/40 mb-3">You'll need to log in again.</p>
          <div className="flex gap-2">
            <button
              className="flex-1 py-1.5 rounded-lg text-sm font-bold text-white/60 hover:bg-white/5 transition-colors border border-white/10"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-1.5 rounded-lg text-sm font-bold text-red-400 hover:bg-red-500/15 transition-colors border border-red-500/20"
              onClick={() => { onLogout(); close(); setConfirming(false); }}
            >
              Sign Out
            </button>
          </div>
        </motion.div>
      ) : user ? (
        <motion.div
          key="logged-in"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0, transition: spring }}
          exit={{ opacity: 0, transition: fastExit }}
        >
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-base font-bold text-white truncate">{user.name}</p>
            <p className="text-sm text-white/40 truncate">{user.email}</p>
          </div>
          <button
            className="w-full text-left px-4 py-2 text-base text-white/70 hover:bg-white/5 transition-colors"
            onClick={() => { onNavigate("settings"); close(); }}
          >
            Settings
          </button>
          <button
            className="w-full text-left px-4 py-2 text-base text-red-400 hover:bg-red-500/10 transition-colors"
            onClick={() => setConfirming(true)}
          >
            Sign Out
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="logged-out"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0, transition: spring }}
          exit={{ opacity: 0, transition: fastExit }}
        >
          <button
            className="w-full text-left px-4 py-2 text-base text-white/80 hover:bg-brand-primary/20 hover:text-brand-primary transition-colors"
            onClick={() => { onNavigate("login"); close(); }}
          >
            Login
          </button>
          <button
            className="w-full text-left px-4 py-2 text-base text-white/80 hover:bg-brand-primary/20 hover:text-brand-primary transition-colors"
            onClick={() => { onNavigate("register"); close(); }}
          >
            Register
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Sidebar({ onNavigate, currentPage, user, onLogout, avatar, onOpenWatchParty }: SidebarProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPartyJoin, setShowPartyJoin] = useState(false);
  const [partyTab, setPartyTab] = useState<"create" | "join">("join");
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joining, setJoining] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const partyMenuRef = useRef<HTMLDivElement>(null);
  const close = () => setShowProfileMenu(false);

  const { joinParty, isInParty, error, clearError } = useWatchParty();

  const handleJoin = () => {
    if (!joinCode.trim() || joining) return;
    if (!user && !guestName.trim()) return;
    setJoining(true);
    clearError();
    const participant = user ?? { id: `guest-${Date.now()}`, name: guestName.trim() };
    joinParty(joinCode, participant);
    setTimeout(() => { setJoining(false); setShowPartyJoin(false); setJoinCode(""); setGuestName(""); }, 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!partyMenuRef.current?.contains(target)) setShowPartyJoin(false);
    };
    if (showPartyJoin) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPartyJoin]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = menuRef.current?.contains(target);
      const inMobile = mobileMenuRef.current?.contains(target);
      if (!inDesktop && !inMobile) setShowProfileMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-screen w-20 flex-col items-center py-6 z-60"
        style={{
          background: "linear-gradient(180deg, #0c1228 0%, #091020 35%, #080b18 65%, #080b18 100%)",
          borderRight: "1px solid rgba(79, 125, 247, 0.18)",
        }}
      >
        <div className="mb-12">
          <button
            onClick={() => onNavigate("home")}
            className="cursor-pointer hover:opacity-80 transition-opacity outline-none"
          >
            <CoveLogo size={36} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-8">
          <motion.button
            onClick={() => onNavigate("home")}
            className="p-3 rounded-2xl"
            style={currentPage === "home"
              ? { ...NAV_ACTIVE_STYLE, color: "#000", boxShadow: "0 4px 20px rgba(79, 125, 247, 0.35)" }
              : { color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => { if (currentPage !== "home") (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { if (currentPage !== "home") (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.8, rotate: -12 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
          >
            <GrPlay className="text-xl" />
          </motion.button>

          <motion.button
            onClick={() => onNavigate("favorites")}
            className="p-3 rounded-2xl"
            style={currentPage === "favorites"
              ? { ...NAV_ACTIVE_STYLE, color: "#000", boxShadow: "0 4px 20px rgba(79, 125, 247, 0.35)" }
              : { color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => { if (currentPage !== "favorites") (e.currentTarget as HTMLElement).style.color = "#fff"; }}
            onMouseLeave={e => { if (currentPage !== "favorites") (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.75, rotate: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            <IoHeartOutline className="text-xl" />
          </motion.button>

          {/* Join party */}
          <div className="relative" ref={partyMenuRef}>
            <motion.button
              onClick={() => { setShowPartyJoin(!showPartyJoin); setPartyTab(user ? "create" : "join"); clearError(); }}
              className="p-3 rounded-2xl"
              style={isInParty
                ? { ...NAV_ACTIVE_STYLE, color: "#000", boxShadow: "0 4px 20px rgba(79,125,247,0.35)" }
                : showPartyJoin
                  ? { background: "rgba(79,125,247,0.15)", color: "#4f7df7", border: "1px solid rgba(79,125,247,0.3)" }
                  : { color: "rgba(255,255,255,0.4)" }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.8, rotate: -8 }}
              transition={{ type: "spring", stiffness: 420, damping: 20 }}
              title="Join a watch party"
            >
              <IoPeople className="text-xl" />
            </motion.button>

            <AnimatePresence>
              {showPartyJoin && !isInParty && (
                <motion.div
                  className="absolute left-full ml-3 top-0 z-[120] w-60 rounded-2xl shadow-2xl overflow-hidden"
                  style={POPUP_STYLE}
                  {...POPUP_MOTION}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <p className="text-sm font-bold text-white">Watch Party</p>
                    <button onClick={() => setShowPartyJoin(false)} className="text-white/30 hover:text-white transition-colors">
                      <IoClose className="text-sm" />
                    </button>
                  </div>

                  {/* Tabs — only show Create for logged-in users */}
                  <div className="flex mx-3 mt-3 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    {user && (
                      <button
                        onClick={() => setPartyTab("create")}
                        className="flex-1 py-1.5 text-xs font-semibold transition-all"
                        style={partyTab === "create"
                          ? { background: "linear-gradient(135deg, #4f7df7, #3461e0)", color: "#fff" }
                          : { color: "rgba(255,255,255,0.4)" }}
                      >
                        Create Room
                      </button>
                    )}
                    <button
                      onClick={() => setPartyTab("join")}
                      className="flex-1 py-1.5 text-xs font-semibold transition-all"
                      style={partyTab === "join"
                        ? { background: "linear-gradient(135deg, #4f7df7, #3461e0)", color: "#fff" }
                        : { color: "rgba(255,255,255,0.4)" }}
                    >
                      Join Room
                    </button>
                  </div>

                  <div className="px-3 py-3 space-y-2">
                    {partyTab === "create" ? (
                      <div className="space-y-2">
                        {currentPage === "video" ? (
                          <button
                            onClick={() => { onOpenWatchParty?.(); setShowPartyJoin(false); }}
                            className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                            style={{ background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #3461e0 100%)", boxShadow: "0 0 20px rgba(79,125,247,0.3)" }}
                          >
                            Create Room
                          </button>
                        ) : (
                          <div className="text-center py-2 space-y-1.5">
                            <IoPeople className="text-xl text-[#4f7df7]/50 mx-auto" />
                            <p className="text-xs text-white/35 leading-relaxed">
                              Open a video first, then create a room from here.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {!user && (
                          <input
                            type="text"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleJoin()}
                            placeholder="Your name"
                            maxLength={24}
                            autoFocus
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#4f7df7]/50 transition-colors"
                          />
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={joinCode}
                            onChange={e => { setJoinCode(e.target.value.toUpperCase()); clearError(); }}
                            onKeyDown={e => e.key === "Enter" && handleJoin()}
                            placeholder="ROOM CODE"
                            maxLength={8}
                            autoFocus={!!user}
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm font-bold tracking-widest text-white placeholder-white/20 focus:outline-none focus:border-[#4f7df7]/50 uppercase"
                          />
                          <button
                            onClick={handleJoin}
                            disabled={!joinCode.trim() || joining || (!user && !guestName.trim())}
                            className="px-3 py-2 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-40 shrink-0"
                            style={{ background: "linear-gradient(135deg, #4f7df7, #3461e0)" }}
                          >
                            {joining
                              ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                              : <IoArrowForward className="text-sm" />}
                          </button>
                        </div>
                        {error && <p className="text-xs text-red-400">{error}</p>}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="relative" ref={menuRef}>
          <div style={{ position: "absolute", bottom: "0", left: "64px" }}>
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="absolute bottom-0 z-[120] w-48 rounded-2xl shadow-2xl py-2 overflow-hidden"
                  style={POPUP_STYLE}
                  {...POPUP_MOTION}
                >
                  <PopupContent user={user} onNavigate={onNavigate} onLogout={onLogout} close={close} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="mb-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer font-bold overflow-hidden"
            style={showProfileMenu
              ? { background: "rgba(79,125,247,0.2)", border: "1px solid #4f7df7", color: "#4f7df7" }
              : avatar
                ? { border: "1px solid rgba(232,153,122,0.35)" }
                : { background: "rgba(232,153,122,0.15)", border: "1px solid rgba(232,153,122,0.35)", color: "#e8997a" }}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.82, rotate: 12 }}
            animate={showProfileMenu
              ? { boxShadow: "0 0 0 3px rgba(79,125,247,0.25), 0 0 18px rgba(79,125,247,0.2)" }
              : { boxShadow: "0 0 0 0px rgba(79,125,247,0)" }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
          >
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" />
              : user ? user.name.charAt(0).toUpperCase() : <HiOutlineUserCircle className="text-2xl" />}
          </motion.div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-[110] flex items-center justify-around px-4 h-16"
        style={{
          background: "linear-gradient(180deg, #091020 0%, #080b18 100%)",
          borderTop: "1px solid rgba(79, 125, 247, 0.18)",
        }}
      >
        <button
          onClick={() => onNavigate("home")}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
          style={currentPage === "home" ? { color: "#4f7df7" } : { color: "rgba(255,255,255,0.4)" }}
        >
          <GrPlay className="text-xl" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Home</span>
        </button>

        <button
          onClick={() => onNavigate("favorites")}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
          style={currentPage === "favorites" ? { color: "#4f7df7" } : { color: "rgba(255,255,255,0.4)" }}
        >
          <IoHeartOutline className="text-xl" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Saved</span>
        </button>

        <div className="relative" ref={mobileMenuRef}>
          <div className="absolute bottom-full right-0 mb-2">
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  className="absolute bottom-0 right-0 z-[120] w-48 rounded-2xl shadow-2xl py-2 overflow-hidden"
                  style={POPUP_STYLE}
                  {...POPUP_MOTION}
                >
                  <PopupContent user={user} onNavigate={onNavigate} onLogout={onLogout} close={close} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all font-bold"
            style={showProfileMenu ? { color: "#4f7df7" } : { color: "rgba(255,255,255,0.4)" }}
          >
            <HiOutlineUserCircle className="text-xl" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default Sidebar;
