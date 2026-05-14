import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  IoHeart, IoHeartOutline, IoBookmark, IoBookmarkOutline, IoClose,
  IoThumbsUp, IoThumbsUpOutline, IoThumbsDown, IoThumbsDownOutline,
  IoFlag, IoFlagOutline, IoPaperPlane, IoTrash, IoPencil, IoCheckmark,
  IoReturnDownForward, IoPeople, IoCopy,
} from "react-icons/io5";
import VideoPlayer, { type ReactionBucket, type VideoPlayerHandle } from "./VideoPlayer";
import WatchPartyModal from "./WatchPartyModal";
import { useFavorites } from "./FavoritesContext";
import { useWatchProgress } from "./WatchProgressContext";
import { useWatchParty } from "./WatchPartyContext";
import { allSeries } from "./data";
import type { Series, Episode } from "./data";
import { formatTime } from "./utils";

interface CommentType {
  _id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
  editedAt?: string;
  likes: string[];
  dislikes: string[];
  parentId?: string | null;
  replies?: CommentType[];
}

interface VideoDetailsProps {
  series: Series;
  user: { id: string; name: string; email: string; avatar?: string } | null;
  onBack: () => void;
  initialEpisodeId?: number;
  initialTimestamp?: number;
  onSelectSeries?: (seriesId: string) => void;
  onRegisterPartyOpener?: (fn: () => void) => void;
}

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const metaContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.42 } },
};

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } },
};


const NowPlayingBars = () => (
  <div className="flex items-end gap-[2.5px] shrink-0" style={{ height: 13, width: 13 }}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="flex-1 rounded-full bg-brand-primary origin-bottom"
        animate={{ scaleY: [0.3, 1, 0.5, 0.85, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.16, ease: "easeInOut" }}
        style={{ height: "100%" }}
      />
    ))}
  </div>
);

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function VideoDetailsPage({ series, user, onBack, initialEpisodeId, initialTimestamp, onSelectSeries, onRegisterPartyOpener }: VideoDetailsProps) {
  const startEpisode = series.episodes.find((e) => e.id === initialEpisodeId) ?? series.episodes[0];
  const [currentEpisode, setCurrentEpisode] = useState<Episode>(startEpisode);
  const [seekTo, setSeekTo] = useState<number | undefined>(initialTimestamp);
  const [durations, setDurations] = useState<{ [key: number]: string }>({});
  const [shouldAutoPlay, setShouldAutoPlay] = useState(!!initialEpisodeId);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [postingReply, setPostingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);

  const commentListRef = useRef<HTMLDivElement>(null);
  const newCommentFlag = useRef(false);
  const editedCommentIdRef = useRef<string | null>(null);
  const newReplyParentIdRef = useRef<string | null>(null);
  const replyListRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [momentReactions, setMomentReactions] = useState<ReactionBucket[]>([]);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const playerRef = useRef<VideoPlayerHandle>(null);
  const suppressPartyRef = useRef(0);

  const {
    roomCode, members, isHost, isInParty,
    emitPlay, emitPause, emitSeek, emitChangeEpisode,
    subscribePlay, subscribePause, subscribeSeek, subscribeEpisodeChange,
    leaveParty,
  } = useWatchParty();

  const [userReaction, setUserReaction] = useState<"like" | "dislike" | null>(null);
  const [reactionCounts, setReactionCounts] = useState({ likes: 0, dislikes: 0 });
  const [pendingReaction, setPendingReaction] = useState(false);
  const [reported, setReported] = useState(false);
  const [pendingSeries, setPendingSeries] = useState(false);
  const [pendingEpisode, setPendingEpisode] = useState(false);

  const activeEpisodeRef = useRef<HTMLDivElement>(null);


  const { isSeriesFavorite, toggleSeries, isVideoEpisodeSaved, toggleVideoEpisode } = useFavorites();
  const { saveProgress } = useWatchProgress();
  const seriesSaved = isSeriesFavorite(series.id);
  const episodeBookmarked = isVideoEpisodeSaved(series.id, currentEpisode.id);

  useEffect(() => {
    onRegisterPartyOpener?.(() => setShowPartyModal(true));
    return () => { onRegisterPartyOpener?.(null as unknown as () => void); };
  }, [onRegisterPartyOpener]);

  useEffect(() => {
    series.episodes.forEach((ep) => {
      if (ep.duration) { setDurations((prev) => ({ ...prev, [ep.id]: ep.duration! })); return; }
      const video = document.createElement("video");
      video.src = ep.url;
      video.preload = "metadata";
      video.onloadedmetadata = () => { setDurations((prev) => ({ ...prev, [ep.id]: formatTime(video.duration) })); };
    });
  }, [series]);

  useEffect(() => {
    activeEpisodeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentEpisode.id]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/comments/${series.id}/${currentEpisode.id}`);
      if (res.ok) setComments(await res.json());
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchReactions = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:5000/api/video-reactions/${series.id}/${currentEpisode.id}`,
      token ? { headers: { "x-auth-token": token } } : {}
    );
    if (res.ok) {
      const data = await res.json();
      setReactionCounts({ likes: data.likes, dislikes: data.dislikes });
      setUserReaction(data.userReaction);
    }
  };

  const fetchMomentReactions = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/moment-reactions/${series.id}/${currentEpisode.id}`);
      if (res.ok) setMomentReactions(await res.json());
    } catch {
      // non-critical — heatmap just won't show
    }
  };

  const handleMomentReact = async (emoji: string, timestamp: number) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/moment-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token },
        body: JSON.stringify({ seriesId: series.id, episodeId: currentEpisode.id, timestamp, emoji }),
      });
      if (res.ok) {
        const { added } = await res.json();
        const bucket = Math.floor(timestamp / 5);
        setMomentReactions(prev => {
          const existing = prev.find(r => r.bucket === bucket);
          if (!existing) {
            if (!added) return prev;
            return [...prev, { bucket, count: 1, topEmoji: emoji }].sort((a, b) => a.bucket - b.bucket);
          }
          const newCount = added ? existing.count + 1 : Math.max(0, existing.count - 1);
          if (newCount === 0) return prev.filter(r => r.bucket !== bucket);
          return prev.map(r => r.bucket === bucket ? { ...r, count: newCount } : r);
        });
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchComments();
    fetchReactions();
    fetchMomentReactions();
    setReported(false);
    setReplyingToId(null);
    setExpandedReplies([]);
  }, [series.id, currentEpisode.id]);

  // ── Watch party sync ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInParty) return;

    const suppress = (fn: () => void) => {
      suppressPartyRef.current++;
      fn();
      setTimeout(() => { suppressPartyRef.current = Math.max(0, suppressPartyRef.current - 1); }, 250);
    };

    const unsubPlay = subscribePlay((t) => {
      suppress(() => {
        playerRef.current?.seekTo(t);
        playerRef.current?.play();
      });
    });
    const unsubPause = subscribePause((t) => {
      suppress(() => {
        playerRef.current?.seekTo(t);
        playerRef.current?.pause();
      });
    });
    const unsubSeek = subscribeSeek((t) => {
      suppress(() => { playerRef.current?.seekTo(t); });
    });
    const unsubEpisode = subscribeEpisodeChange((id) => {
      const ep = series.episodes.find(e => e.id === id);
      if (ep) { suppress(() => { setCurrentEpisode(ep); setSeekTo(undefined); setShouldAutoPlay(true); }); }
    });

    return () => { unsubPlay(); unsubPause(); unsubSeek(); unsubEpisode(); };
  }, [isInParty, subscribePlay, subscribePause, subscribeSeek, subscribeEpisodeChange, series.episodes]);

  const handlePartyPlay = (t: number) => {
    if (isInParty && suppressPartyRef.current === 0) emitPlay(t);
  };
  const handlePartyPause = (t: number) => {
    if (isInParty && suppressPartyRef.current === 0) emitPause(t);
  };
  const handlePartySeek = (t: number) => {
    if (isInParty && suppressPartyRef.current === 0) emitSeek(t);
  };

  const handleCopyCode = async () => {
    if (!roomCode) return;
    await navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Updates a comment (or reply nested inside one) by id
  const updateCommentInState = (id: string, updater: (c: CommentType) => CommentType) => {
    setComments(prev => prev.map(c => {
      if (c._id === id) return updater(c);
      if (c.replies?.some(r => r._id === id)) {
        return { ...c, replies: c.replies!.map(r => r._id === id ? updater(r) : r) };
      }
      return c;
    }));
  };

  // GSAP comment animations
  useLayoutEffect(() => {
    // ── New top-level comment entrance ──
    if (newCommentFlag.current && commentListRef.current) {
      newCommentFlag.current = false;
      const card = commentListRef.current.firstElementChild as HTMLElement | null;
      if (card) {
        const avatar  = card.querySelector<HTMLElement>(".ca");
        const body    = card.querySelector<HTMLElement>(".cb");
        const actions = card.querySelector<HTMLElement>(".cc");

        gsap.set(card,    { opacity: 0, y: -28, scale: 0.9, transformOrigin: "top left", borderRadius: 16 });
        gsap.set(avatar,  { scale: 0, rotate: -25, transformOrigin: "center" });
        gsap.set(body,    { opacity: 0, x: -14 });
        gsap.set(actions, { opacity: 0 });

        gsap.timeline({ defaults: { ease: "power3.out" } })
          .to(card,    { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.5)" })
          .to(avatar,  { scale: 1, rotate: 0, duration: 0.42, ease: "back.out(2.5)" }, "-=0.28")
          .to(body,    { opacity: 1, x: 0, duration: 0.3 }, "-=0.22")
          .to(actions, { opacity: 1, duration: 0.2 }, "-=0.1");
      }
    }

    // ── New reply entrance ──
    if (newReplyParentIdRef.current) {
      const parentId = newReplyParentIdRef.current;
      newReplyParentIdRef.current = null;
      const container = replyListRefs.current.get(parentId);
      const lastReply = container?.lastElementChild as HTMLElement | null;
      if (lastReply) {
        const avatar = lastReply.querySelector<HTMLElement>(".ca");
        const body   = lastReply.querySelector<HTMLElement>(".cb");
        gsap.set(lastReply, { opacity: 0, x: -16, scale: 0.96, transformOrigin: "top left" });
        if (avatar) gsap.set(avatar, { scale: 0, rotate: -15, transformOrigin: "center" });
        if (body)   gsap.set(body,   { opacity: 0, x: -10 });
        gsap.timeline({ defaults: { ease: "power3.out" } })
          .to(lastReply, { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: "back.out(1.5)" })
          .to(avatar,    { scale: 1, rotate: 0, duration: 0.35, ease: "back.out(2.5)" }, "-=0.22")
          .to(body,      { opacity: 1, x: 0, duration: 0.25 }, "-=0.18");

        // Wait for the height animation to finish opening, then scroll the reply into view
        setTimeout(() => {
          lastReply.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 320);
      }
    }

    // ── Edit confirmation flash ──
    if (editedCommentIdRef.current && commentListRef.current) {
      const id = editedCommentIdRef.current;
      editedCommentIdRef.current = null;
      const card = commentListRef.current.querySelector<HTMLElement>(`[data-comment-id="${id}"]`);
      const body = card?.querySelector<HTMLElement>(".cb");
      if (card && body) {
        gsap.timeline()
          .to(card, { scale: 1.02, duration: 0.15, ease: "power2.out" })
          .to(card, { scale: 1, duration: 0.35, ease: "back.out(2.5)" })
          .fromTo(body, { color: "rgba(79,125,247,1)" }, { color: "rgba(255,255,255,0.65)", duration: 1, ease: "power2.out" }, "<");
      }
    }
  }, [comments]);

  const postComment = async () => {
    if (!commentText.trim() || !user || postingComment) return;
    setPostingComment(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ seriesId: series.id, episodeId: currentEpisode.id, text: commentText.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        newCommentFlag.current = true;
        setComments((prev) => [{ ...newComment, replies: [] }, ...prev]);
        setCommentText("");
      }
    } finally {
      setPostingComment(false);
    }
  };

  const postReply = async (parentId: string) => {
    if (!replyText.trim() || !user || postingReply) return;
    setPostingReply(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ seriesId: series.id, episodeId: currentEpisode.id, text: replyText.trim(), parentId }),
      });
      if (res.ok) {
        const newReply = await res.json();
        newReplyParentIdRef.current = parentId;
        setComments(prev => prev.map(c =>
          c._id === parentId ? { ...c, replies: [...(c.replies ?? []), newReply] } : c
        ));
        setExpandedReplies(prev => prev.includes(parentId) ? prev : [...prev, parentId]);
        setReplyingToId(null);
        setReplyText("");
      }
    } finally {
      setPostingReply(false);
    }
  };

  const deleteComment = (commentId: string, parentId?: string | null) => {
    const card = commentListRef.current?.querySelector<HTMLElement>(`[data-comment-id="${commentId}"]`);

    const performDelete = async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { "x-auth-token": token! },
      });
      if (res.ok) {
        if (parentId) {
          setComments(prev => prev.map(c =>
            c._id === parentId ? { ...c, replies: (c.replies ?? []).filter(r => r._id !== commentId) } : c
          ));
        } else {
          setComments(prev => prev.filter(c => c._id !== commentId));
        }
      }
    };

    if (card) {
      gsap.set(card, { height: card.offsetHeight, overflow: "hidden" });
      gsap.timeline({ onComplete: performDelete })
        .to(card, { x: -40, opacity: 0, duration: 0.28, ease: "power2.in" })
        .to(card, { height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.25, ease: "power2.in" }, "-=0.05");
    } else {
      performDelete();
    }
  };

  const editComment = async (commentId: string) => {
    if (!editText.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:5000/api/comments/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-auth-token": token! },
        body: JSON.stringify({ text: editText.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        editedCommentIdRef.current = commentId;
        updateCommentInState(commentId, () => updated);
        setEditingId(null);
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleCommentReaction = async (commentId: string, type: "like" | "dislike") => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`http://localhost:5000/api/comments/${commentId}/${type}`, {
      method: "POST",
      headers: { "x-auth-token": token! },
    });
    if (res.ok) {
      const { likes, dislikes } = await res.json();
      updateCommentInState(commentId, c => ({ ...c, likes, dislikes }));
    }
  };

  function toggleReplies(id: string) {
    setExpandedReplies(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const suggestedSeries = allSeries.filter((s) => s.id !== series.id);

  // Shared comment card renderer (used for both top-level and replies)
  function renderCommentCard(c: CommentType, parentId?: string) {
    const isOwn       = user?.id === c.userId;
    const isEditing   = editingId === c._id;
    const userLiked   = user ? c.likes.map(String).includes(user.id) : false;
    const userDisliked= user ? c.dislikes.map(String).includes(user.id) : false;
    const isReply     = !!parentId;

    return (
      <div key={c._id} data-comment-id={c._id} className={`flex gap-3 group${isReply ? " relative pl-4 border-l-2 border-[#4f7df7]/15" : ""}`}>
        {/* Avatar */}
        {user?.id === c.userId && user?.avatar ? (
          <div
            className="ca rounded-full shrink-0 overflow-hidden"
            style={{ minWidth: isReply ? 32 : 36, minHeight: isReply ? 32 : 36, width: isReply ? 32 : 36, height: isReply ? 32 : 36 }}
          >
            <img src={user.avatar} alt="" className="w-full h-full object-cover" style={{ maxWidth: "none" }} />
          </div>
        ) : (
          <div
            className="ca w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-black"
            style={{ background: "linear-gradient(135deg, #7b9df9, #4f7df7)", minWidth: isReply ? 32 : 36, minHeight: isReply ? 32 : 36, width: isReply ? 32 : 36, height: isReply ? 32 : 36 }}
          >
            {c.userName[0].toUpperCase()}
          </div>
        )}

        {/* Body */}
        <div className="cb flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-semibold text-white/90">{c.userName}</span>
            <span className="text-sm text-white/30">{formatRelativeTime(c.createdAt)}</span>
            {c.editedAt && <span className="text-[10px] text-white/20 italic">edited</span>}
          </div>

          {isEditing ? (
            <div className="mt-1.5 flex gap-2 items-start">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") editComment(c._id); if (e.key === "Escape") setEditingId(null); }}
                maxLength={1000}
                autoFocus
                className="flex-1 bg-white/5 border border-brand-primary/40 rounded-lg px-3 py-1.5 text-base text-white focus:outline-none"
              />
              <button onClick={() => editComment(c._id)} disabled={savingEdit} className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all disabled:opacity-40">
                <IoCheckmark className="text-base" />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1.5 text-white/30 hover:text-white rounded-lg transition-all">
                <IoClose className="text-base" />
              </button>
            </div>
          ) : (
            <p className="text-base text-white/65 mt-1 leading-relaxed break-words">
              {(() => {
                const match = c.text.match(/^(@\S+)([\s\S]*)$/);
                if (match) return <><span className="text-brand-primary font-medium">{match[1]}</span>{match[2]}</>;
                return c.text;
              })()}
            </p>
          )}

          {/* Actions row */}
          {!isEditing && (
            <div className="cc flex items-center gap-3 mt-2">
              <button
                onClick={() => toggleCommentReaction(c._id, "like")}
                className={`flex items-center gap-1 text-sm transition-all hover:scale-110 active:scale-95 ${userLiked ? "text-brand-primary" : "text-white/30 hover:text-white/60"}`}
              >
                {userLiked ? <IoThumbsUp className="text-sm" /> : <IoThumbsUpOutline className="text-sm" />}
                {c.likes.length > 0 && <span>{c.likes.length}</span>}
              </button>
              <button
                onClick={() => toggleCommentReaction(c._id, "dislike")}
                className={`flex items-center gap-1 text-sm transition-all hover:scale-110 active:scale-95 ${userDisliked ? "text-red-400" : "text-white/30 hover:text-white/60"}`}
              >
                {userDisliked ? <IoThumbsDown className="text-sm" /> : <IoThumbsDownOutline className="text-sm" />}
                {c.dislikes.length > 0 && <span>{c.dislikes.length}</span>}
              </button>
              {/* Reply button */}
              {user && (
                <button
                  onClick={() => {
                    if (!isReply) {
                      // Top-level: toggle open/close
                      const toggling = replyingToId === c._id;
                      setReplyingToId(toggling ? null : c._id);
                      setReplyText("");
                    } else {
                      // Reply: open parent thread and pre-fill @mention
                      const mention = `@${c.userName} `;
                      const alreadyOpen = replyingToId === parentId;
                      setReplyingToId(parentId!);
                      setReplyText(mention);
                      setTimeout(() => {
                        const input = replyInputRef.current;
                        if (!input) return;
                        input.focus();
                        input.setSelectionRange(mention.length, mention.length);
                      }, alreadyOpen ? 0 : 60);
                    }
                  }}
                  className="flex items-center gap-1 text-sm text-white/30 hover:text-brand-primary transition-all"
                >
                  <IoReturnDownForward className="text-sm" />
                  <span>Reply</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Own-comment actions */}
        {isOwn && !isEditing && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0 self-start mt-1 transition-all">
            <button
              onClick={() => { setEditingId(c._id); setEditText(c.text); }}
              className="p-1.5 text-white/25 hover:text-brand-primary rounded-lg transition-all"
            >
              <IoPencil className="text-sm" />
            </button>
            <button
              onClick={() => deleteComment(c._id, parentId)}
              className="p-1.5 text-white/25 hover:text-red-400 rounded-lg transition-all"
            >
              <IoTrash className="text-sm" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={onBack}
      />

      <motion.div
        className="fixed inset-0 z-50 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="sticky top-0 z-10 flex justify-end px-6 pt-5 pb-0 pointer-events-none">
          <motion.button
            onClick={onBack}
            className="pointer-events-auto w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.48, duration: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
          >
            <IoClose className="text-lg" />
          </motion.button>
        </div>

        <div className="pl-24 pr-6 md:pl-28 md:pr-10 pt-4 pb-16 max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

            {/* ── Left column: video + actions + comments ── */}
            <div className="min-w-0">

              {/* Video player */}
              <motion.div
                layoutId={`thumb-${series.id}`}
                className="relative aspect-video bg-black overflow-hidden border border-white/5 shadow-2xl shadow-black/60"
                style={{ borderRadius: 16 }}
                transition={SPRING}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentEpisode.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.025 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.975 }}
                    transition={{
                      opacity: { duration: 0.22, ease: "easeInOut" },
                      scale: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    }}
                  >
                    <VideoPlayer
                      ref={playerRef}
                      url={currentEpisode.url}
                      title={`${series.title} — ${currentEpisode.title}`}
                      onClose={onBack}
                      initialTimestamp={seekTo}
                      poster={series.backdrop ?? series.thumbnail}
                      autoPlay={shouldAutoPlay}
                      onProgress={(timestamp, duration, snapshot) =>
                        saveProgress(series.id, currentEpisode.id, timestamp, duration, snapshot)
                      }
                      reactions={momentReactions}
                      onReact={user ? handleMomentReact : undefined}
                      canReact={!!user}
                      onUserPlay={handlePartyPlay}
                      onUserPause={handlePartyPause}
                      onUserSeek={handlePartySeek}
                    />
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* Metadata + actions + comments */}
              <motion.div className="mt-6" variants={metaContainer} initial="hidden" animate="show">

                {/* Title + meta */}
                <motion.div variants={staggerItem}>
                  <h1 className="text-2xl md:text-3xl font-bold text-text-main leading-tight">{series.title}</h1>
                  <div className="mt-1.5 flex gap-3 text-sm font-medium uppercase tracking-widest">
                    <span style={{ color: "rgba(79,125,247,0.8)" }}>{series.category}</span>
                    <span className="text-white/20">|</span>
                    <span className="text-text-muted">{series.instructor}</span>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div variants={staggerItem} className="mt-5 flex items-center gap-2.5 flex-wrap">

                  <button
                    onClick={async () => { if (!user || pendingSeries) return; setPendingSeries(true); await toggleSeries(series.id); setPendingSeries(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      seriesSaved ? "bg-[#4f7df7]/10 border-[#4f7df7]/30 text-[#4f7df7]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    } ${!user ? "opacity-40 cursor-not-allowed" : ""} ${pendingSeries ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {seriesSaved ? <IoHeart className="text-base" /> : <IoHeartOutline className="text-base" />}
                    <span>{seriesSaved ? "Saved" : "Favorite"}</span>
                  </button>

                  <button
                    onClick={async () => { if (!user || pendingEpisode) return; setPendingEpisode(true); await toggleVideoEpisode(series.id, currentEpisode.id); setPendingEpisode(false); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      episodeBookmarked ? "bg-[#e8997a]/10 border-[#e8997a]/30 text-[#e8997a]" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    } ${!user ? "opacity-40 cursor-not-allowed" : ""} ${pendingEpisode ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {episodeBookmarked ? <IoBookmark className="text-base" /> : <IoBookmarkOutline className="text-base" />}
                    <span>{episodeBookmarked ? "Bookmarked" : "Bookmark"}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!user || pendingReaction) return;
                      setPendingReaction(true);
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch("http://localhost:5000/api/video-reactions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-auth-token": token! },
                          body: JSON.stringify({ seriesId: series.id, episodeId: currentEpisode.id, reaction: "like" }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setReactionCounts({ likes: data.likes, dislikes: data.dislikes });
                          setUserReaction(data.userReaction);
                        }
                      } finally {
                        setPendingReaction(false);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      userReaction === "like" ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    } ${!user ? "opacity-40 cursor-not-allowed" : ""} ${pendingReaction ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {userReaction === "like" ? <IoThumbsUp className="text-base" /> : <IoThumbsUpOutline className="text-base" />}
                    <span>Like{reactionCounts.likes > 0 ? ` ${reactionCounts.likes}` : ""}</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!user || pendingReaction) return;
                      setPendingReaction(true);
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch("http://localhost:5000/api/video-reactions", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "x-auth-token": token! },
                          body: JSON.stringify({ seriesId: series.id, episodeId: currentEpisode.id, reaction: "dislike" }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setReactionCounts({ likes: data.likes, dislikes: data.dislikes });
                          setUserReaction(data.userReaction);
                        }
                      } finally {
                        setPendingReaction(false);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      userReaction === "dislike" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    } ${!user ? "opacity-40 cursor-not-allowed" : ""} ${pendingReaction ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    {userReaction === "dislike" ? <IoThumbsDown className="text-base" /> : <IoThumbsDownOutline className="text-base" />}
                    <span>Dislike{reactionCounts.dislikes > 0 ? ` ${reactionCounts.dislikes}` : ""}</span>
                  </button>

                  <button
                    onClick={() => setReported((prev) => !prev)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      reported ? "bg-orange-500/10 border-orange-500/30 text-orange-400 cursor-default" : "bg-white/5 border-white/10 text-white/50 hover:text-red-400 hover:border-red-500/30"
                    }`}
                  >
                    {reported ? <IoFlag className="text-base" /> : <IoFlagOutline className="text-base" />}
                    <span>{reported ? "Reported" : "Report"}</span>
                  </button>

                  <button
                    onClick={() => setShowPartyModal(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border transition-all hover:scale-105 active:scale-95 ${
                      isInParty
                        ? "bg-[#4f7df7]/10 border-[#4f7df7]/30 text-[#4f7df7]"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/25"
                    }`}
                  >
                    <IoPeople className="text-base" />
                    <span>{isInParty ? `Party · ${members.length}` : "Watch Party"}</span>
                  </button>
                </motion.div>

                {/* ── Party bar ── */}
                {isInParty && roomCode && (
                  <motion.div
                    variants={staggerItem}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl flex-wrap"
                    style={{ background: "rgba(79,125,247,0.07)", border: "1px solid rgba(79,125,247,0.2)" }}
                  >
                    <div className="flex items-center gap-2 mr-1">
                      <span className="w-2 h-2 rounded-full bg-[#4f7df7] animate-pulse shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-widest text-[#4f7df7]">Live Party</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(79,125,247,0.1)", border: "1px solid rgba(79,125,247,0.25)" }}>
                      <span className="text-sm font-black tracking-[0.18em] text-white">{roomCode}</span>
                      <button onClick={handleCopyCode} className="text-white/40 hover:text-[#4f7df7] transition-colors ml-1">
                        {copiedCode ? <IoCheckmark className="text-xs" /> : <IoCopy className="text-xs" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap flex-1">
                      {members.map(m => (
                        <div key={m.socketId} title={m.userName} className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-black overflow-hidden border-2"
                          style={m.socketId === members[0]?.socketId && isHost ? { borderColor: "#4f7df7" } : { borderColor: "transparent" }}>
                          {m.avatar
                            ? <img src={m.avatar} className="w-full h-full object-cover" alt={m.userName} style={{ background: "linear-gradient(135deg, #7b9df9, #4f7df7)" }} />
                            : <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7b9df9, #4f7df7)" }}>{m.userName[0].toUpperCase()}</div>
                          }
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={leaveParty}
                      className="text-xs text-white/30 hover:text-red-400 transition-colors font-medium ml-auto shrink-0"
                    >
                      Leave
                    </button>
                  </motion.div>
                )}

                {/* Like/dislike ratio bar */}
                {(reactionCounts.likes + reactionCounts.dislikes) > 0 && (
                  <motion.div variants={staggerItem} className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <IoThumbsUp className="text-[10px] text-[#4f7df7]" />
                        <span className="text-sm font-semibold text-[#4f7df7] tabular-nums">{reactionCounts.likes}</span>
                      </div>
                      <span className="text-[10px] text-white/25 tabular-nums">
                        {Math.round((reactionCounts.likes / (reactionCounts.likes + reactionCounts.dislikes)) * 100)}% liked
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white/30 tabular-nums">{reactionCounts.dislikes}</span>
                        <IoThumbsDown className="text-[10px] text-white/30" />
                      </div>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #4f7df7, #7b9df9)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.round((reactionCounts.likes / (reactionCounts.likes + reactionCounts.dislikes)) * 100)}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Description */}
                <motion.p variants={staggerItem} className="text-text-muted mt-5 leading-relaxed text-base">
                  {series.description}
                </motion.p>

                {/* Comments */}
                <motion.div variants={staggerItem} className="mt-10">
                  <h3 className="text-lg font-bold mb-5" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Comments{" "}
                    <span className="text-white/30 font-normal text-base">({comments.length})</span>
                  </h3>

                  {/* Top-level input */}
                  {user ? (
                    <div className="flex gap-3 mb-7">
                      <div
                        className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-black"
                        style={{ background: "linear-gradient(135deg, #7b9df9, #4f7df7)" }}
                      >
                        {user.name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="relative">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && postComment()}
                            placeholder="Add a comment..."
                            maxLength={1000}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-11 text-base text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/50 transition-colors"
                          />
                          <button
                            onClick={postComment}
                            disabled={!commentText.trim() || postingComment}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-brand-primary disabled:opacity-30 hover:bg-brand-primary/10 transition-all"
                          >
                            <IoPaperPlane className="text-base" />
                          </button>
                        </div>
                        {commentText.length > 0 && (
                          <span
                            className="text-right text-[10px] tabular-nums pr-1 transition-colors"
                            style={{ color: commentText.length > 900 ? "#e8997a" : "rgba(255,255,255,0.2)" }}
                          >
                            {commentText.length}/1000
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/30 text-base mb-7 italic">Log in to leave a comment.</p>
                  )}

                  {/* Comment list */}
                  {commentsLoading ? (
                    <div className="space-y-5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                          <div className="w-9 h-9 rounded-full bg-white/10 shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-2.5 bg-white/10 rounded w-24" />
                            <div className="h-2.5 bg-white/10 rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-white/20 text-base italic">No comments yet. Be the first!</p>
                  ) : (
                    <div className="space-y-6" ref={commentListRef}>
                      {comments.map((c) => (
                        <div key={c._id} className="space-y-2">
                          {/* Top-level comment card */}
                          {renderCommentCard(c)}

                          {/* Inline reply input */}
                          <AnimatePresence>
                            {replyingToId === c._id && user && (
                              <motion.div
                                className="overflow-hidden"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={SPRING}
                              >
                              <div className="flex gap-2.5 ml-11 pt-1">
                                <div
                                  className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-black mt-1"
                                  style={{ background: "linear-gradient(135deg, #7b9df9, #4f7df7)" }}
                                >
                                  {user.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 flex gap-2 items-center">
                                  <div className="relative flex-1">
                                    <input
                                      ref={replyInputRef}
                                      type="text"
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") postReply(c._id);
                                        if (e.key === "Escape") { setReplyingToId(null); setReplyText(""); }
                                      }}
                                      placeholder={`Reply to ${c.userName}…`}
                                      maxLength={1000}
                                      autoFocus
                                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pr-10 text-base text-white placeholder-white/30 focus:outline-none focus:border-brand-primary/40 transition-colors"
                                    />
                                    <button
                                      onClick={() => postReply(c._id)}
                                      disabled={!replyText.trim() || postingReply}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-brand-primary disabled:opacity-30 hover:bg-brand-primary/10 transition-all"
                                    >
                                      <IoPaperPlane className="text-sm" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => { setReplyingToId(null); setReplyText(""); }}
                                    className="text-sm text-white/30 hover:text-white/60 transition-colors shrink-0"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Replies */}
                          {(c.replies?.length ?? 0) > 0 && (
                            <div className="ml-11">
                              <button
                                onClick={() => toggleReplies(c._id)}
                                className="flex items-center gap-1.5 text-sm text-brand-primary/80 hover:text-brand-primary font-medium transition-colors mb-2"
                              >
                                <IoReturnDownForward className={`text-sm transition-transform duration-200 ${expandedReplies.includes(c._id) ? "rotate-180" : ""}`} />
                                {expandedReplies.includes(c._id)
                                  ? "Hide replies"
                                  : `${c.replies!.length} ${c.replies!.length === 1 ? "reply" : "replies"}`}
                              </button>

                              <AnimatePresence>
                                {expandedReplies.includes(c._id) && (
                                  <motion.div
                                    className="overflow-hidden"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={SPRING}
                                  >
                                    <div
                                      className="space-y-4 pt-1"
                                      ref={(el) => {
                                        if (el) replyListRefs.current.set(c._id, el);
                                        else replyListRefs.current.delete(c._id);
                                      }}
                                    >
                                      {c.replies!.map((r) => renderCommentCard(r, c._id))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </div>

            {/* ── Right column: sticky episode list + suggested ── */}
            <div className="lg:sticky lg:top-6 lg:self-start space-y-4">

              {/* Episode list */}
              <motion.div
                className="rounded-2xl flex flex-col overflow-hidden"
                style={{
                  background: "linear-gradient(180deg, #101428 0%, #111111 100%)",
                  border: "1px solid rgba(79,125,247,0.14)",
                  maxHeight: "52vh",
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, type: "spring", stiffness: 300, damping: 30 }}
              >
                <div className="p-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-lg font-bold">Course Content</h2>
                  <p className="text-sm mt-0.5 font-medium" style={{ color: "rgba(232,153,122,0.9)" }}>
                    {series.episodes.length} episodes
                  </p>
                </div>

                <motion.div
                  className="overflow-y-auto flex-1 p-2 space-y-1"
                  variants={listContainer}
                  initial="hidden"
                  animate="show"
                >
                  {series.episodes.map((ep) => {
                    const isActive = currentEpisode.id === ep.id;
                    const isBookmarked = isVideoEpisodeSaved(series.id, ep.id);

                    return (
                      <motion.div key={ep.id} ref={isActive ? activeEpisodeRef : null} variants={staggerItem} className="relative rounded-xl">
                        {isActive && (
                          <motion.div layoutId="active-episode-bg" className="absolute inset-0 rounded-xl bg-brand-primary/10 border border-brand-primary/50" transition={SPRING} />
                        )}
                        <button
                          onClick={() => {
                            setCurrentEpisode(ep);
                            setSeekTo(undefined);
                            setShouldAutoPlay(true);
                            if (isInParty) emitChangeEpisode(ep.id);
                          }}
                          className="relative z-10 w-full text-left p-3 flex items-center gap-2.5 rounded-xl"
                        >
                          <span className={`shrink-0 text-[10px] font-mono tabular-nums w-5 text-center transition-colors duration-300 ${isActive ? "text-brand-primary" : "text-white/25"}`}>
                            {String(ep.id).padStart(2, "0")}
                          </span>
                          <span className={`flex-1 text-sm font-medium truncate transition-colors duration-300 ${isActive ? "text-brand-primary" : "text-text-muted"}`}>
                            {ep.title}
                          </span>
                          <AnimatePresence>
                            {isActive && (
                              <motion.span className="shrink-0" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ duration: 0.2 }}>
                                <NowPlayingBars />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-white/25 tabular-nums">{durations[ep.id] || "—"}</span>
                            {user && (
                              <span
                                role="button"
                                onClick={(e) => { e.stopPropagation(); toggleVideoEpisode(series.id, ep.id); }}
                                className={`transition-all hover:scale-110 active:scale-95 cursor-pointer ${isBookmarked ? "text-[#4f7df7]" : "text-white/30 hover:text-white/70"}`}
                              >
                                {isBookmarked ? <IoBookmark className="text-xs" /> : <IoBookmarkOutline className="text-xs" />}
                              </span>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>

              {/* Suggested videos */}
              {suggestedSeries.length > 0 && (
                <motion.div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "linear-gradient(180deg, #101428 0%, #111111 100%)", border: "1px solid rgba(79,125,247,0.14)" }}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.32, type: "spring", stiffness: 300, damping: 30 }}
                >
                  <div className="p-4 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <h2 className="text-lg font-bold">Suggested</h2>
                  </div>
                  <div className="p-2 space-y-1">
                    {suggestedSeries.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onSelectSeries?.(s.id)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors text-left group"
                      >
                        <img
                          src={s.thumbnail}
                          alt={s.title}
                          className="w-16 h-10 object-cover rounded-lg shrink-0 opacity-75 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white/75 group-hover:text-white truncate transition-colors leading-snug">{s.title}</p>
                          <p className="text-[10px] text-white/30 mt-0.5 truncate">{s.instructor} · {s.episodes.length} ep</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPartyModal && (
          <WatchPartyModal
            seriesId={series.id}
            episodeId={currentEpisode.id}
            user={user}
            initialTab={user ? "create" : "join"}
            onClose={() => setShowPartyModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default VideoDetailsPage;
