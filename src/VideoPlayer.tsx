import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { formatTime } from "./utils";

export interface ReactionBucket {
  bucket: number;
  count: number;
  topEmoji: string;
}

export interface VideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
}

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  initialTimestamp?: number;
  onProgress?: (timestamp: number, duration: number, snapshot?: string) => void;
  poster?: string;
  onPlayStart?: () => void;
  autoPlay?: boolean;
  reactions?: ReactionBucket[];
  onReact?: (emoji: string, timestamp: number) => void;
  canReact?: boolean;
  onUserPlay?: (currentTime: number) => void;
  onUserPause?: (currentTime: number) => void;
  onUserSeek?: (currentTime: number) => void;
}

const EMOJIS = ['🔥', '😭', '❤️', '💀', '⚡'] as const;

const VolumeIcon = ({ level }: { level: number }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {level > 0 && <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    {level > 0.5 && <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(function VideoPlayer(
  { url, title, onClose, initialTimestamp, onProgress, poster, onPlayStart, autoPlay, reactions, onReact, canReact, onUserPlay, onUserPause, onUserSeek },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onUserPlayRef = useRef(onUserPlay);
  const onUserPauseRef = useRef(onUserPause);
  const onUserSeekRef = useRef(onUserSeek);
  useEffect(() => { onUserPlayRef.current = onUserPlay; }, [onUserPlay]);
  useEffect(() => { onUserPauseRef.current = onUserPause; }, [onUserPause]);
  useEffect(() => { onUserSeekRef.current = onUserSeek; }, [onUserSeek]);

  useImperativeHandle(ref, () => ({
    play: () => { videoRef.current?.play().catch(() => {}); },
    pause: () => { videoRef.current?.pause(); },
    seekTo: (time: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = time;
      if (v.duration > 0) { setProgress((time / v.duration) * 100); setCurrentTime(time); }
    },
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
  }));

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);
  const [showPulse, setShowPulse] = useState(false);
  const floatCounter = useRef(0);
  const lastProgressSaveRef = useRef(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const maxCount = reactions && reactions.length > 0 ? Math.max(...reactions.map(r => r.count)) : 1;

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      onUserPause?.(v.currentTime);
    } else {
      v.play().catch(() => {});
      onUserPlay?.(v.currentTime);
    }
    setIsPlaying(!isPlaying);
    setShowPulse(true);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = setTimeout(() => setShowPulse(false), 600);
  }, [isPlaying, onUserPlay, onUserPause]);

  const captureSnapshot = (): string | undefined => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.drawImage(video, 0, 0, 320, 180);
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch { return undefined; }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    setCurrentTime(videoRef.current.currentTime);
    if (onProgress && videoRef.current.duration > 0) {
      const now = Date.now();
      if (now - lastProgressSaveRef.current >= 10000) {
        lastProgressSaveRef.current = now;
        onProgress(videoRef.current.currentTime, videoRef.current.duration, captureSnapshot());
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = (Number(e.target.value) / 100) * videoRef.current.duration;
    videoRef.current.currentTime = time;
    setProgress(Number(e.target.value));
  };

  const handleScrubEnd = () => {
    if (videoRef.current) onUserSeek?.(videoRef.current.currentTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; setIsMuted(v === 0); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const mute = !isMuted;
    setIsMuted(mute);
    videoRef.current.muted = mute;
    if (mute) { setVolume(0); } else { setVolume(1); videoRef.current.volume = 1; }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const seek = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + seconds, v.duration));
    onUserSeek?.(v.currentTime);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isBuffering) setShowControls(false);
    }, 3000);
  };

  const handleReact = (emoji: string, e: React.MouseEvent) => {
    if (!onReact || !videoRef.current) return;
    onReact(emoji, videoRef.current.currentTime);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const x = containerRect ? rect.left - containerRect.left + rect.width / 2 : 0;
    const id = floatCounter.current++;
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(f => f.id !== id)), 1200);
  };

  useEffect(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
  }, [isPlaying, isBuffering]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case " ": case "k": case "K":
          e.preventDefault();
          if (video.paused) { video.play().catch(() => {}); onUserPlayRef.current?.(video.currentTime); }
          else { video.pause(); onUserPauseRef.current?.(video.currentTime); }
          break;
        case "ArrowLeft": e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); onUserSeekRef.current?.(video.currentTime); break;
        case "ArrowRight": e.preventDefault(); video.currentTime = Math.min(video.duration || 0, video.currentTime + 5); onUserSeekRef.current?.(video.currentTime); break;
        case "m": case "M": e.preventDefault();
          if (video.muted || video.volume === 0) { video.muted = false; video.volume = 1; setVolume(1); setIsMuted(false); }
          else { video.muted = true; setVolume(0); setIsMuted(true); }
          break;
        case "f": case "F": e.preventDefault();
          if (!document.fullscreenElement) containerRef.current?.requestFullscreen(); else document.exitFullscreen(); break;
        case "ArrowUp": e.preventDefault(); { const v = parseFloat(Math.min(1, video.volume + 0.1).toFixed(2)); video.volume = v; video.muted = false; setVolume(v); setIsMuted(false); } break;
        case "ArrowDown": e.preventDefault(); { const v = parseFloat(Math.max(0, video.volume - 0.1).toFixed(2)); video.volume = v; video.muted = v === 0; setVolume(v); setIsMuted(v === 0); } break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden"
      onMouseMove={handleMouseMove}
      style={{ cursor: showControls ? "default" : "none" }}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (!videoRef.current) return;
          setDuration(videoRef.current.duration);
          if (initialTimestamp && initialTimestamp > 0) videoRef.current.currentTime = initialTimestamp;
          if (autoPlay) videoRef.current.play();
        }}
        onClick={togglePlay}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsPlaying(true); setIsBuffering(false); onPlayStart?.(); }}
        onCanPlay={() => setIsBuffering(false)}
        onPlay={() => { setIsPlaying(true); onPlayStart?.(); }}
        onPause={() => {
          setIsPlaying(false);
          if (onProgress && videoRef.current && videoRef.current.duration > 0)
            onProgress(videoRef.current.currentTime, videoRef.current.duration, captureSnapshot());
        }}
      />

      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.85) 100%)" }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-start justify-between px-5 pt-4">
          <div>
            <p className="text-white font-semibold text-sm leading-snug drop-shadow">{title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f7df7] animate-pulse" />
              <span className="text-[9px] text-white/50 uppercase tracking-[0.15em] font-medium">Now Streaming</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* ── Bottom controls ── */}
        <div className="px-5 pb-4 space-y-2">

          {/* Heatmap */}
          {reactions && duration > 0 && reactions.length > 0 && (
            <div className="relative w-full h-5 pointer-events-none">
              {reactions.map(({ bucket, count, topEmoji }) => {
                const pct = Math.min((bucket * 5 / duration) * 100, 99.5);
                const h = Math.max(3, Math.round((count / maxCount) * 18));
                return (
                  <div
                    key={bucket}
                    className="absolute bottom-0 rounded-t-sm"
                    style={{ left: `${pct}%`, width: "2px", height: h, background: "rgba(79,125,247,0.6)", transform: "translateX(-50%)" }}
                    title={`${topEmoji} × ${count}`}
                  />
                );
              })}
            </div>
          )}

          {/* Scrubber */}
          <div className="relative group/progress h-4 flex items-center">
            <input
              type="range" min="0" max="100" value={progress}
              onChange={handleProgressChange} onMouseUp={handleScrubEnd} onTouchEnd={handleScrubEnd}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="w-full h-[3px] group-hover/progress:h-[5px] bg-white/20 rounded-full overflow-visible transition-all duration-150 relative">
              <div
                className="h-full rounded-full relative"
                style={{ width: `${progress}%`, background: "linear-gradient(90deg, #4f7df7, #818cf8)" }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">

            {/* Left cluster */}
            <div className="flex items-center gap-4">
              {/* Seek back */}
              <button onClick={() => seek(-10)} className="relative flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
                </svg>
                <span className="absolute text-[7px] font-black" style={{ marginTop: "1px" }}>10</span>
              </button>

              {/* Play/pause */}
              <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center text-white hover:text-[#4f7df7] transition-colors">
                {isPlaying ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                )}
              </button>

              {/* Seek forward */}
              <button onClick={() => seek(10)} className="relative flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" fill="currentColor"/>
                </svg>
                <span className="absolute text-[7px] font-black" style={{ marginTop: "1px" }}>10</span>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white/60 hover:text-white transition-colors outline-none">
                  <VolumeIcon level={isMuted ? 0 : volume} />
                </button>
                <div className="w-0 overflow-hidden group-hover/vol:w-16 transition-all duration-200">
                  <input
                    type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-[3px] rounded-full appearance-none cursor-pointer accent-white"
                    style={{ background: `linear-gradient(to right, white 0%, white ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)` }}
                  />
                </div>
              </div>

              {/* Time */}
              <span className="text-xs font-mono text-white/60 tabular-nums select-none">
                {formatTime(currentTime)} <span className="text-white/30">/</span> {formatTime(duration)}
              </span>
            </div>

            {/* Right cluster — emoji reactions + fullscreen */}
            <div className="flex items-center gap-3">
              {/* Reaction strip */}
              <div className="flex items-center gap-1">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => { e.stopPropagation(); if (canReact) handleReact(emoji, e); }}
                    title={canReact ? undefined : "Log in to react"}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all select-none ${
                      canReact
                        ? "hover:scale-125 active:scale-90 cursor-pointer hover:bg-white/10"
                        : "opacity-30 cursor-default"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
                {reactions && reactions.length > 0 && (
                  <span className="text-[10px] text-white/25 ml-1 tabular-nums">
                    {reactions.reduce((s, r) => s + r.count, 0).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Fullscreen */}
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click-to-play pulse */}
      {showPulse && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", animation: "pulse-fade 0.5s ease-out forwards" }}
          >
            {isPlaying ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
            )}
          </div>
        </div>
      )}

      {/* Floating emoji bursts */}
      {floatingEmojis.map(({ id, emoji, x }) => (
        <div
          key={id}
          className="moment-float pointer-events-none"
          style={{ bottom: "80px", left: x, transform: "translateX(-50%)" }}
        >
          {emoji}
        </div>
      ))}

      {/* Buffering spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
        </div>
      )}
    </div>
  );
});

export default VideoPlayer;
