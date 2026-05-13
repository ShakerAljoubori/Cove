import { useState, useRef, useEffect, useCallback } from "react";
import { formatTime } from "./utils";

interface VideoPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  initialTimestamp?: number;
  onProgress?: (timestamp: number, duration: number, snapshot?: string) => void;
  poster?: string;
  onPlayStart?: () => void;
  autoPlay?: boolean;
}

const VolumeIcon = ({ level }: { level: number }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    {level > 0 && <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9447 17.1947 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    {level > 0.5 && <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 12C17.004 13.3308 16.4774 14.6024 15.54 15.54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

const FullscreenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 3H21V9M9 21H3V15M21 3L14 10M3 21L10 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SeekBackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SeekForwardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 0 0 0 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const VideoPlayer = ({ url, title, onClose, initialTimestamp, onProgress, poster, onPlayStart, autoPlay }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const lastProgressSaveRef = useRef(0);

  
  // FIX: Using ReturnType<typeof setTimeout> removes the NodeJS namespace error
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const captureSnapshot = (): string | undefined => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return undefined;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      ctx.drawImage(video, 0, 0, 320, 180);
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch {
      return undefined; // CORS failure — silent fallback
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
      setCurrentTime(videoRef.current.currentTime);

      // Save progress every 10 seconds while playing
      if (onProgress && videoRef.current.duration > 0) {
        const now = Date.now();
        if (now - lastProgressSaveRef.current >= 10000) {
          lastProgressSaveRef.current = now;
          onProgress(videoRef.current.currentTime, videoRef.current.duration, captureSnapshot());
        }
      }
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      videoRef.current.muted = newVolume === 0;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      videoRef.current.muted = newMuteState;
      if (newMuteState) {
        setVolume(0);
      } else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const seek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, videoRef.current.duration));
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isBuffering) setShowControls(false);
    }, 3000);
  };

  // Auto-hide controls 3s after playback starts (handles autoplay with no mouse movement).
  // Also keeps controls visible while buffering or paused.
  useEffect(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
  }, [isPlaying, isBuffering]);

  // Keyboard shortcuts — reads from DOM refs so no stale closures
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement).isContentEditable) return;
      const video = videoRef.current;
      if (!video) return;

      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 5);
          break;
        case "m":
        case "M":
          e.preventDefault();
          if (video.muted || video.volume === 0) {
            video.muted = false; video.volume = 1; setVolume(1); setIsMuted(false);
          } else {
            video.muted = true; setVolume(0); setIsMuted(true);
          }
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
          else document.exitFullscreen();
          break;
        case "ArrowUp":
          e.preventDefault();
          { const v = parseFloat(Math.min(1, video.volume + 0.1).toFixed(2)); video.volume = v; video.muted = false; setVolume(v); setIsMuted(false); }
          break;
        case "ArrowDown":
          e.preventDefault();
          { const v = parseFloat(Math.max(0, video.volume - 0.1).toFixed(2)); video.volume = v; video.muted = v === 0; setVolume(v); setIsMuted(v === 0); }
          break;
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []); // stable — all reads go through refs, all setters are stable

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group"
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
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (initialTimestamp && initialTimestamp > 0) {
              videoRef.current.currentTime = initialTimestamp;
            }
            if (autoPlay) videoRef.current.play();
          }
        }}
        onClick={togglePlay}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsPlaying(true); setIsBuffering(false); onPlayStart?.(); }}
        onCanPlay={() => setIsBuffering(false)}
        onPlay={() => { setIsPlaying(true); onPlayStart?.(); }}
        onPause={() => {
          setIsPlaying(false);
          if (onProgress && videoRef.current && videoRef.current.duration > 0) {
            onProgress(videoRef.current.currentTime, videoRef.current.duration, captureSnapshot());
          }
        }}
      />

      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 flex flex-col justify-between p-6 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-white font-bold text-lg drop-shadow-lg">{title}</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4f7df7] animate-pulse" />
              <span className="text-[10px] text-white/60 uppercase tracking-widest font-medium">Now Streaming</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md border border-white/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {!isBuffering && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button onClick={togglePlay} className="w-20 h-20 rounded-full flex items-center justify-center text-black transform transition-all hover:scale-110 active:scale-95" style={{ background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #3461e0 100%)", boxShadow: "0 0 40px rgba(79,125,247,0.45)" }}>
              {isPlaying ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative group/progress h-1.5 flex items-center">
            <input type="range" min="0" max="100" value={progress} onChange={handleProgressChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-100 relative" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #4f7df7 0%, #e8997a 100%)" }}>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => seek(-5)} className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white transition-all">
                <SeekBackIcon />
                <span className="text-[8px] font-bold leading-none tracking-wide">5s</span>
              </button>
              <button onClick={togglePlay} className="text-white hover:text-[#4f7df7] transition-all">
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={() => seek(5)} className="flex flex-col items-center gap-0.5 text-white/60 hover:text-white transition-all">
                <SeekForwardIcon />
                <span className="text-[8px] font-bold leading-none tracking-wide">5s</span>
              </button>
              <div className="flex items-center gap-3 group/volume">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-white/60 hover:text-white transition-all outline-none">
                  <VolumeIcon level={volume} />
                </button>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange}
                  className="w-16 h-1 rounded-full appearance-none cursor-pointer accent-white"
                  style={{ background: `linear-gradient(to right, #4f7df7 0%, #e8997a ${Math.max(volume * 100, volume > 0 ? 3 : 0)}%, rgba(255, 255, 255, 0.2) ${Math.max(volume * 100, volume > 0 ? 3 : 0)}%)` }}
                />
              </div>
              <span className="text-sm font-mono font-bold text-white/90 tabular-nums" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="text-white/60 hover:text-[#4f7df7] transition-all">
              <FullscreenIcon />
            </button>
          </div>
        </div>
      </div>

      {/* Spinner rendered after controls overlay so it stacks on top */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="w-11 h-11 rounded-full border-2 border-white/20 border-t-[#4f7df7] animate-spin" />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;