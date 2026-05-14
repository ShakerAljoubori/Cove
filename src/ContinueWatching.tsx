import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { allSeries } from "./data";
import { useWatchProgress } from "./WatchProgressContext";

interface ContinueWatchingProps {
  onSelectVideo: (seriesId: string, episodeId: number, timestamp: number) => void;
}

function EpisodeThumbnail({ url, fallback, alt }: { url: string; fallback?: string; alt: string }) {
  const [ready, setReady] = useState(false);

  return (
    <div className="absolute inset-0">
      {/* Fallback visible until the video frame is ready */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${ready ? "opacity-0" : "opacity-100"}`}>
        {fallback
          ? <img src={fallback} alt={alt} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center bg-white/5">
              <span className="text-white/20 text-4xl">▶</span>
            </div>
        }
      </div>

      {/* Video seeks to 20% of duration — displayed as a static frame */}
      {url && (
        <video
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${ready ? "opacity-100" : "opacity-0"}`}
          src={url}
          preload="metadata"
          muted
          playsInline
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) v.currentTime = v.duration * 0.2;
          }}
          onSeeked={() => setReady(true)}
        />
      )}
    </div>
  );
}

type ModalTarget = { seriesId: string; episodeId: number } | null;

function ContinueWatching({ onSelectVideo }: ContinueWatchingProps) {
  const { allProgress, removeProgress } = useWatchProgress();
  const [modalTarget, setModalTarget] = useState<ModalTarget>(null);

  const entries = Object.values(allProgress)
    .filter((prog) => prog.seriesId && allSeries.some((s) => s.id === prog.seriesId))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (entries.length === 0) return null;

  const modalSeries = modalTarget ? allSeries.find((s) => s.id === modalTarget.seriesId) : null;
  const modalEpisode = modalTarget && modalSeries ? modalSeries.episodes.find((e) => e.id === modalTarget.episodeId) : null;

  function handleConfirmRemove() {
    if (!modalTarget) return;
    removeProgress(modalTarget.seriesId, modalTarget.episodeId);
    setModalTarget(null);
  }

  return (
    <>
      <section className="px-8 mt-12 mb-4">
        <h3 className="text-lg font-bold mb-4 text-text-main">Continue <span style={{ background: "linear-gradient(135deg, #e8997a 0%, #d4785a 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Watching</span></h3>

        <div className="flex flex-wrap gap-4">
          {entries.map((prog) => {
            const series = allSeries.find((s) => s.id === prog.seriesId);
            if (!series) return null;
            const episode = series.episodes.find((e) => e.id === prog.episodeId);
            const pct = prog.duration > 0 ? Math.min((prog.timestamp / prog.duration) * 100, 100) : 0;

            return (
              <div
                key={`${prog.seriesId}:${prog.episodeId}`}
                onClick={() => onSelectVideo(prog.seriesId, prog.episodeId, prog.timestamp)}
                className="group cursor-pointer w-[220px]"
              >
                <motion.div
                  layoutId={`thumb-cw-${series.id}`}
                  className="relative aspect-video rounded-xl overflow-hidden bg-app-card transition-all duration-300"
                  style={{ borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}
                  whileHover={{ boxShadow: "0 0 0 1px rgba(79,125,247,0.5), 0 8px 32px rgba(79,125,247,0.18)" }}
                  whileTap={{ scale: 0.97 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <EpisodeThumbnail
                    url={episode?.url ?? ""}
                    fallback={series.thumbnail}
                    alt={series.title}
                  />

                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setModalTarget({ seriesId: prog.seriesId, episodeId: prog.episodeId }); }}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-all duration-200 active:scale-95"
                    title="Remove from Continue Watching"
                  >
                    <IoClose className="text-sm" />
                  </button>

                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: `${pct}%`, background: "linear-gradient(90deg, #4f7df7 0%, #e8997a 100%)" }}
                    />
                  </div>
                </motion.div>

                <div className="mt-2">
                  <h4 className="text-base font-semibold text-text-main group-hover:text-brand-primary transition-colors truncate">
                    {series.title}
                  </h4>
                  <p className="text-sm text-text-muted truncate">
                    {episode?.title ?? "Episode"} · {Math.round(pct)}% watched
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Removal confirmation modal — portalled to body to escape GSAP transform on contentRef */}
      {createPortal(
        <AnimatePresence>
          {modalTarget && modalSeries && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setModalTarget(null)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              <motion.div
                className="relative z-10 rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "linear-gradient(160deg, rgba(18,32,24,0.98) 0%, rgba(10,18,14,0.99) 100%)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                  width: 300,
                }}
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative w-full aspect-video">
                  <EpisodeThumbnail
                    url={modalEpisode?.url ?? ""}
                    fallback={modalSeries.thumbnail}
                    alt={modalSeries.title}
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,18,14,0.9) 0%, transparent 60%)" }} />
                </div>

                <div className="px-5 pt-3 pb-5 flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-text-muted mb-0.5">Remove from Continue Watching?</p>
                    <p className="text-base font-semibold text-text-main leading-snug">{modalSeries.title}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalTarget(null)}
                      className="flex-1 py-2 rounded-lg text-base font-medium text-text-muted transition-colors"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmRemove}
                      className="flex-1 py-2 rounded-lg text-base font-semibold text-white transition-opacity hover:opacity-90 active:scale-95"
                      style={{ background: "linear-gradient(135deg, #e53e3e 0%, #c53030 100%)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default ContinueWatching;
