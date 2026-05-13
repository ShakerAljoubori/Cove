import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoArrowBack, IoCamera } from "react-icons/io5";

const CROP_PREVIEW = 272; // px — diameter of the circular crop area

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface SettingsPageProps {
  user: User;
  onBack: () => void;
  onUserUpdate: (updated: User) => void;
  onDeleteAccount: () => void;
}

const CARD_STYLE = {
  background: "linear-gradient(145deg, #0f1220 0%, #111111 100%)",
  border: "1px solid rgba(79, 125, 247, 0.18)",
};

const DANGER_CARD_STYLE = {
  background: "linear-gradient(145deg, #2e1a1a 0%, #111111 100%)",
  border: "1px solid rgba(239, 68, 68, 0.2)",
};

const INPUT_CLASS =
  "bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 transition-colors w-full";

function StatusBanner({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <motion.div
      className={`text-sm px-4 py-2.5 rounded-xl font-medium ${
        type === "success" ? "bg-green-500/15 text-cyan-400" : "bg-red-500/15 text-red-400"
      }`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      {msg}
    </motion.div>
  );
}

export default function SettingsPage({ user, onBack, onUserUpdate, onDeleteAccount }: SettingsPageProps) {
  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropNatural, setCropNatural] = useState({ w: 1, h: 1 });
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [cropScale, setCropScale] = useState(1);
  const [cropMinScale, setCropMinScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startOffX: 0, startOffY: 0 });

  // Global mouse listeners during drag so cursor leaving the circle doesn't drop the pan
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setCropOffset({
      x: dragRef.current.startOffX + e.clientX - dragRef.current.startX,
      y: dragRef.current.startOffY + e.clientY - dragRef.current.startY,
    });
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({ type: "error", text: "Please select an image file" });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const minScale = Math.max(CROP_PREVIEW / img.naturalWidth, CROP_PREVIEW / img.naturalHeight);
      setCropNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setCropMinScale(minScale);
      setCropScale(minScale);
      setCropOffset({ x: 0, y: 0 });
      setCropSrc(url);
    };
    img.src = url;
  };

  const cancelCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const confirmCrop = async () => {
    if (!cropSrc) return;
    setAvatarSaving(true);
    setAvatarMsg(null);
    try {
      const img = new Image();
      await new Promise<void>((res) => { img.onload = () => res(); img.src = cropSrc; });
      const out = 200;
      const canvas = document.createElement("canvas");
      canvas.width = out;
      canvas.height = out;
      const ctx = canvas.getContext("2d")!;
      // Map display window [0,CROP_PREVIEW]² back to source image coords
      const cx = CROP_PREVIEW / 2 + cropOffset.x;
      const cy = CROP_PREVIEW / 2 + cropOffset.y;
      const sx = (0 - cx) / cropScale + cropNatural.w / 2;
      const sy = (0 - cy) / cropScale + cropNatural.h / 2;
      ctx.drawImage(img, sx, sy, CROP_PREVIEW / cropScale, CROP_PREVIEW / cropScale, 0, 0, out, out);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      const base64 = canvas.toDataURL("image/jpeg", 0.82);
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ avatar: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAvatarMsg({ type: "error", text: data.msg || "Failed to update photo" });
      } else {
        setAvatarPreview(base64);
        onUserUpdate({ ...user, avatar: base64 });
        setAvatarMsg({ type: "success", text: "Photo updated!" });
      }
    } catch {
      setAvatarMsg({ type: "error", text: "Server error. Please try again." });
    }
    setAvatarSaving(false);
  };

  const handleCropDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffX: cropOffset.x, startOffY: cropOffset.y };
  };

  const handleCropWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setCropScale(s => Math.min(Math.max(s - e.deltaY * 0.0008 * s, cropMinScale), cropMinScale * 5));
  };

  const handleCropTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    dragRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, startOffX: cropOffset.x, startOffY: cropOffset.y };
    setIsDragging(true);
  };

  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setCropOffset({
      x: dragRef.current.startOffX + e.touches[0].clientX - dragRef.current.startX,
      y: dragRef.current.startOffY + e.touches[0].clientY - dragRef.current.startY,
    });
  };

  // Display name
  const [name, setName] = useState(user.name);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailPw, setEmailPw] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteCountdown, setDeleteCountdown] = useState(5);

  useEffect(() => {
    if (!showDeleteModal) { setDeleteCountdown(5); return; }
    if (deleteCountdown <= 0) return;
    const t = setTimeout(() => setDeleteCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [showDeleteModal, deleteCountdown]);

  const handleSaveName = async () => {
    setNameSaving(true);
    setNameMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameMsg({ type: "error", text: data.msg || "Failed to update name" });
      } else {
        onUserUpdate({ ...user, name: data.name });
        setNameMsg({ type: "success", text: "Name updated successfully!" });
      }
    } catch {
      setNameMsg({ type: "error", text: "Server error. Please try again." });
    }
    setNameSaving(false);
  };

  const handleSaveEmail = async () => {
    setEmailSaving(true);
    setEmailMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/email", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ newEmail: newEmail.trim(), currentPassword: emailPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailMsg({ type: "error", text: data.msg || "Failed to update email" });
      } else {
        onUserUpdate({ ...user, email: data.email });
        setEmailMsg({ type: "success", text: "Email updated successfully!" });
        setNewEmail("");
        setEmailPw("");
      }
    } catch {
      setEmailMsg({ type: "error", text: "Server error. Please try again." });
    }
    setEmailSaving(false);
  };

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) {
      setPwMsg({ type: "error", text: "New passwords don't match" });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwMsg({ type: "error", text: data.msg || "Failed to change password" });
      } else {
        setPwMsg({ type: "success", text: "Password changed successfully!" });
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      }
    } catch {
      setPwMsg({ type: "error", text: "Server error. Please try again." });
    }
    setPwSaving(false);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/users/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ currentPassword: deletePw }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteMsg({ type: "error", text: data.msg || "Failed to delete account" });
        setDeleting(false);
      } else {
        onDeleteAccount();
      }
    } catch {
      setDeleteMsg({ type: "error", text: "Server error. Please try again." });
      setDeleting(false);
    }
  };

  const nameDirty = name.trim() !== user.name && name.trim().length >= 2;
  const emailDirty = newEmail.trim().length > 0 && emailPw.length > 0;

  return (
    <>
    <motion.div
      className="min-h-screen px-4 md:px-10 pt-24 pb-12 max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={onBack}
          className="p-2 rounded-xl hover:bg-white/5 transition-colors"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <IoArrowBack className="text-xl" />
        </button>
        <div>
          <h1
            className="text-2xl font-black"
            style={{
              background: "linear-gradient(135deg, #7b9df9 0%, #e8997a 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Settings
          </h1>
          <p className="text-xs text-white/40 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile — avatar + display name */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD_STYLE}>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Profile</h2>

          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-black text-3xl"
              style={avatarPreview
                ? { border: "2px solid rgba(79,125,247,0.3)" }
                : { background: "rgba(232,153,122,0.15)", border: "2px solid rgba(232,153,122,0.35)", color: "#e8997a" }}
            >
              {avatarPreview
                ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                : user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              style={{
                background: "rgba(79,125,247,0.12)",
                border: "1px solid rgba(79,125,247,0.4)",
                color: "#4f7df7",
              }}
            >
              <IoCamera className="text-base" />
              {avatarSaving ? "Uploading…" : "Change Photo"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <AnimatePresence>
            {avatarMsg && <StatusBanner type={avatarMsg.type} msg={avatarMsg.text} />}
          </AnimatePresence>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <AnimatePresence>
            {nameMsg && <StatusBanner type={nameMsg.type} msg={nameMsg.text} />}
          </AnimatePresence>
          <button
            onClick={handleSaveName}
            disabled={nameSaving || !nameDirty}
            className="self-start px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4f7df7 0%, #3461e0 100%)", color: "#000" }}
          >
            {nameSaving ? "Saving…" : "Save Name"}
          </button>
        </div>

        {/* Email */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD_STYLE}>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Email</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Current Email</label>
            <input
              type="email"
              value={user.email}
              disabled
              className={`${INPUT_CLASS} opacity-40 cursor-not-allowed`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">New Email</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              className={`${INPUT_CLASS} placeholder:text-white/20`}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50">Current Password (to confirm)</label>
            <input
              type="password"
              value={emailPw}
              onChange={(e) => setEmailPw(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <AnimatePresence>
            {emailMsg && <StatusBanner type={emailMsg.type} msg={emailMsg.text} />}
          </AnimatePresence>
          <button
            onClick={handleSaveEmail}
            disabled={emailSaving || !emailDirty}
            className="self-start px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4f7df7 0%, #3461e0 100%)", color: "#000" }}
          >
            {emailSaving ? "Saving…" : "Save Email"}
          </button>
        </div>

        {/* Security — password change */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={CARD_STYLE}>
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">Security</h2>
          {[
            { label: "Current Password", value: currentPw, setter: setCurrentPw },
            { label: "New Password", value: newPw, setter: setNewPw },
            { label: "Confirm New Password", value: confirmPw, setter: setConfirmPw },
          ].map(({ label, value, setter }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50">{label}</label>
              <input
                type="password"
                value={value}
                onChange={(e) => setter(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          ))}
          <AnimatePresence>
            {pwMsg && <StatusBanner type={pwMsg.type} msg={pwMsg.text} />}
          </AnimatePresence>
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || !currentPw || !newPw || !confirmPw}
            className="self-start px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #4f7df7 0%, #3461e0 100%)", color: "#000" }}
          >
            {pwSaving ? "Changing…" : "Change Password"}
          </button>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl p-6 flex flex-col gap-4" style={DANGER_CARD_STYLE}>
          <h2 className="text-xs font-bold text-red-400/60 uppercase tracking-widest">Danger Zone</h2>
          <p className="text-xs text-white/40 leading-relaxed">
            Permanently delete your account and all associated data — watch history, comments, and saved favorites. This cannot be undone.
          </p>

          <AnimatePresence mode="wait" initial={false}>
            {!showDeleteConfirm ? (
              <motion.button
                key="trigger"
                onClick={() => setShowDeleteConfirm(true)}
                className="self-start px-5 py-2 rounded-xl text-sm font-bold transition-colors"
                style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                whileHover={{ background: "rgba(239,68,68,0.2)" }}
              >
                Delete Account
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
                transition={{ type: "spring", stiffness: 380, damping: 26 }}
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-white/50">Enter your password to confirm</label>
                  <input
                    type="password"
                    value={deletePw}
                    onChange={(e) => setDeletePw(e.target.value)}
                    placeholder="Your current password"
                    className={`${INPUT_CLASS} focus:border-red-500/50 placeholder:text-white/20`}
                    autoFocus
                  />
                </div>
                <AnimatePresence>
                  {deleteMsg && <StatusBanner type={deleteMsg.type} msg={deleteMsg.text} />}
                </AnimatePresence>
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeletePw(""); setDeleteMsg(null); }}
                    className="px-5 py-2 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={!deletePw}
                    className="px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" }}
                  >
                    Permanently Delete
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>

    {/* Portal to document.body so GSAP's residual transform on contentRef
        doesn't break fixed positioning */}
    {createPortal(<AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(false)}
            />

            {/* Dialog */}
            <motion.div
              className="fixed inset-0 z-[201] flex items-center justify-center px-4"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <div
                className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
                style={{
                  background: "linear-gradient(145deg, #2e1a1a 0%, #111111 100%)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon + heading */}
                <div className="flex flex-col items-center gap-3 text-center">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)" }}
                  >
                    ⚠️
                  </div>
                  <h2 className="text-lg font-black text-white">Are you sure?</h2>
                  <p className="text-xs text-white/50 leading-relaxed">
                    This will permanently delete your account, watch history, progress, comments, and all saved data. There is no going back.
                  </p>
                </div>

                {/* Countdown ring */}
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black transition-colors"
                    style={{
                      border: `3px solid ${deleteCountdown > 0 ? "rgba(239,68,68,0.4)" : "#ef4444"}`,
                      color: deleteCountdown > 0 ? "rgba(255,255,255,0.4)" : "#ef4444",
                    }}
                  >
                    {deleteCountdown > 0 ? deleteCountdown : "!"}
                  </div>
                  <p className="text-xs text-white/30">
                    {deleteCountdown > 0 ? `Please wait ${deleteCountdown}s before confirming` : "You may now confirm"}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 transition-colors border border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteCountdown > 0 || deleting}
                    onClick={() => { setShowDeleteModal(false); handleDeleteAccount(); }}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-30 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", color: "#fff" }}
                  >
                    {deleting ? "Deleting…" : "Yes, delete it"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}

    {/* Crop / position modal */}
    {createPortal(
      <AnimatePresence>
        {cropSrc && (
          <>
            <motion.div
              className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={cancelCrop}
            />
            <motion.div
              className="fixed inset-0 z-[301] flex items-center justify-center px-4"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <div
                className="w-full max-w-sm rounded-2xl p-6 flex flex-col items-center gap-5"
                style={{ background: "linear-gradient(145deg, #0f1220 0%, #111111 100%)", border: "1px solid rgba(79,125,247,0.25)", boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <h2 className="text-base font-black text-white">Position your photo</h2>
                  <p className="text-xs text-white/35 mt-1">Drag to reposition · scroll or slider to zoom</p>
                </div>

                {/* Circular crop preview */}
                <div
                  style={{
                    width: CROP_PREVIEW, height: CROP_PREVIEW,
                    borderRadius: "50%", overflow: "hidden", position: "relative",
                    cursor: isDragging ? "grabbing" : "grab",
                    border: "3px solid rgba(79,125,247,0.4)",
                    background: "#111", flexShrink: 0,
                    userSelect: "none",
                  }}
                  onMouseDown={handleCropDragStart}
                  onWheel={handleCropWheel}
                  onTouchStart={handleCropTouchStart}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={() => setIsDragging(false)}
                >
                  <img
                    src={cropSrc}
                    draggable={false}
                    style={{
                      position: "absolute",
                      width: cropNatural.w * cropScale,
                      height: cropNatural.h * cropScale,
                      maxWidth: "none",
                      maxHeight: "none",
                      left: CROP_PREVIEW / 2 + cropOffset.x - (cropNatural.w * cropScale) / 2,
                      top: CROP_PREVIEW / 2 + cropOffset.y - (cropNatural.h * cropScale) / 2,
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => setCropScale(s => Math.max(s - 0.1, cropMinScale))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                  >−</button>
                  <input
                    type="range"
                    min={cropMinScale}
                    max={cropMinScale * 5}
                    step={0.01}
                    value={cropScale}
                    onChange={(e) => setCropScale(Number(e.target.value))}
                    className="flex-1 accent-[#4f7df7]"
                  />
                  <button
                    onClick={() => setCropScale(s => Math.min(s + 0.1, cropMinScale * 5))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 transition-colors hover:bg-white/10"
                    style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                  >+</button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 w-full">
                  <button
                    onClick={cancelCrop}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:bg-white/5 transition-colors border border-white/10"
                  >Cancel</button>
                  <button
                    onClick={confirmCrop}
                    disabled={avatarSaving}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-opacity"
                    style={{ background: "linear-gradient(135deg, #4f7df7 0%, #3461e0 100%)", color: "#000" }}
                  >{avatarSaving ? "Saving…" : "Save Photo"}</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}
