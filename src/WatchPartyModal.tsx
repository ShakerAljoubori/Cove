import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoCopy, IoCheckmark, IoPeople, IoArrowForward } from "react-icons/io5";
import { useWatchParty } from "./WatchPartyContext";

interface WatchPartyModalProps {
  seriesId: string;
  episodeId: number;
  user: { id: string; name: string; avatar?: string } | null;
  initialTab?: "create" | "join";
  onClose: () => void;
}

export default function WatchPartyModal({ seriesId, episodeId, user, initialTab = "create", onClose }: WatchPartyModalProps) {
  const [tab, setTab] = useState<"create" | "join">(initialTab);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { roomCode, members, createParty, joinParty, error, clearError, isInParty } = useWatchParty();
  const alreadyInParty = isInParty && roomCode !== null;
  const handleCreate = () => {
    if (!user) return;
    createParty(seriesId, episodeId, user);
  };

  const handleJoin = () => {
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    clearError();
    const id = `guest-${Date.now()}`;
    const participant = user ?? { id, name: `Guest${Math.floor(Math.random() * 9000) + 1000}` };
    joinParty(joinCode, participant);
    setTimeout(() => { setJoining(false); }, 3000);
  };

  const handleCopy = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0f1428 0%, #0c1020 100%)", border: "1px solid rgba(79,125,247,0.22)", boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(79,125,247,0.15)", border: "1px solid rgba(79,125,247,0.3)" }}>
              <IoPeople className="text-[#4f7df7] text-base" />
            </div>
            <h2 className="text-base font-bold text-white">Watch Party</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-all">
            <IoClose className="text-lg" />
          </button>
        </div>

        {/* Tabs */}
        {!alreadyInParty && (
          <div className="flex mx-5 mt-4 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {(["create", "join"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); clearError(); }}
                className="flex-1 py-2 text-sm font-semibold capitalize transition-all"
                style={tab === t
                  ? { background: "linear-gradient(135deg, #4f7df7, #3461e0)", color: "#fff" }
                  : { color: "rgba(255,255,255,0.4)" }}
              >
                {t === "create" ? "Create Room" : "Join Room"}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {/* ── Create tab ── */}
            {(tab === "create" || alreadyInParty) && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                {!roomCode ? (
                  <>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Start a room and share the code with friends. Everyone syncs in real-time.
                    </p>
                    {!user && (
                      <p className="text-xs text-[#e8997a]/80 bg-[#e8997a]/8 border border-[#e8997a]/20 rounded-xl px-3 py-2">
                        You need to be logged in to host a party.
                      </p>
                    )}
                    <button
                      onClick={handleCreate}
                      disabled={!user}
                      className="w-full py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #3461e0 100%)", boxShadow: "0 0 24px rgba(79,125,247,0.35)" }}
                    >
                      Start Watch Party
                    </button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2">Room Code</p>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(79,125,247,0.08)", border: "1px solid rgba(79,125,247,0.25)" }}>
                        <span className="flex-1 text-2xl font-black tracking-[0.2em] text-white">{roomCode}</span>
                        <button
                          onClick={handleCopy}
                          className="p-2 rounded-lg transition-all hover:scale-110 active:scale-95"
                          style={{ color: copied ? "#4ade80" : "#4f7df7" }}
                          title="Copy code"
                        >
                          {copied ? <IoCheckmark className="text-lg" /> : <IoCopy className="text-lg" />}
                        </button>
                      </div>
                      <p className="text-xs text-white/30 mt-2">Share this code with friends to watch together</p>
                    </div>

                    {members.length > 0 && (
                      <div>
                        <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-2.5">
                          Watching now — {members.length}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {members.map(m => (
                            <div key={m.socketId} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-black overflow-hidden"
                                style={m.avatar ? {} : { background: "linear-gradient(135deg, #7b9df9, #4f7df7)" }}>
                                {m.avatar ? <img src={m.avatar} className="w-full h-full object-cover" alt="" /> : m.userName[0].toUpperCase()}
                              </div>
                              <span className="text-xs text-white/70 font-medium">{m.userName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Join tab ── */}
            {tab === "join" && !alreadyInParty && (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <p className="text-sm text-white/50 leading-relaxed">
                  Enter the room code shared by your friend to join their party.
                </p>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={joinCode}
                    onChange={e => { setJoinCode(e.target.value.toUpperCase()); clearError(); }}
                    onKeyDown={e => e.key === "Enter" && handleJoin()}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-base font-black tracking-[0.15em] text-white placeholder-white/20 focus:outline-none focus:border-[#4f7df7]/50 transition-colors uppercase"
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!joinCode.trim() || joining}
                    className="px-4 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #4f7df7, #3461e0)" }}
                  >
                    {joining ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <IoArrowForward className="text-lg" />
                    )}
                  </button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400/90 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
