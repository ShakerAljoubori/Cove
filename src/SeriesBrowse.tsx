import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoHeart, IoHeartOutline, IoChevronBack, IoChevronForward } from "react-icons/io5";
import { allSeries } from "./data";
import type { Series } from "./data";
import { useFavorites } from "./FavoritesContext";

interface SeriesBrowseProps {
  onSelectSeries: (seriesId: string) => void;
  user: { name: string; email: string } | null;
}

const CARD_W = 200;
const SCROLL_AMOUNT = CARD_W * 3 + 48;

function Row({
  title,
  items,
  onSelectSeries,
  user,
}: {
  title: string;
  items: Series[];
  onSelectSeries: (id: string) => void;
  user: { name: string; email: string } | null;
}) {
  const { isSeriesFavorite, toggleSeries } = useFavorites();
  const [pendingHeart, setPendingHeart] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const didDrag = useRef(false);

  const updateArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT, behavior: "smooth" });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = e.pageX - el.offsetLeft;
    dragScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const delta = x - dragStartX.current;
    if (Math.abs(delta) > 4) didDrag.current = true;
    el.scrollLeft = dragScrollLeft.current - delta;
    updateArrows();
  };

  const onMouseUp = () => {
    const el = scrollRef.current;
    if (!el) return;
    isDragging.current = false;
    el.style.cursor = "grab";
    el.style.userSelect = "";
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group/row">
      <h3 className="text-base font-bold text-white/70 uppercase tracking-widest mb-4 px-8">{title}</h3>

      {/* Left arrow */}
      <AnimatePresence>
        {canScrollLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll("left")}
            className="absolute left-0 top-[calc(50%-24px)] z-20 w-10 h-24 flex items-center justify-center rounded-r-xl transition-colors"
            style={{ background: "linear-gradient(90deg, rgba(8,11,24,0.95) 0%, rgba(8,11,24,0.6) 100%)" }}
          >
            <IoChevronBack className="text-white text-2xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right arrow */}
      <AnimatePresence>
        {canScrollRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll("right")}
            className="absolute right-0 top-[calc(50%-24px)] z-20 w-10 h-24 flex items-center justify-center rounded-l-xl transition-colors"
            style={{ background: "linear-gradient(270deg, rgba(8,11,24,0.95) 0%, rgba(8,11,24,0.6) 100%)" }}
          >
            <IoChevronForward className="text-white text-2xl" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        onScroll={updateArrows}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="flex gap-4 overflow-x-auto px-8"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }}
      >
        {items.map((series, i) => {
          const saved = isSeriesFavorite(series.id);
          const isMovie = series.episodes.length === 1;
          return (
            <motion.div
              key={series.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 340, damping: 28, delay: Math.min(i * 0.04, 0.2) }}
              onClick={() => { if (!didDrag.current) onSelectSeries(series.id); }}
              className="group cursor-pointer shrink-0"
              style={{ width: CARD_W }}
            >
              <motion.div
                layoutId={`thumb-${series.id}`}
                className="relative overflow-hidden bg-app-card"
                style={{ aspectRatio: "2/3", borderRadius: 14, border: "1px solid rgba(255,255,255,0.07)" }}
                whileHover={{ scale: 1.04, boxShadow: "0 0 0 2px rgba(79,125,247,0.6), 0 16px 40px rgba(0,0,0,0.6)" }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              >
                {series.thumbnail ? (
                  <img
                    src={series.thumbnail}
                    alt={series.title}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-white/5">
                    <span className="text-white/20 text-5xl">▶</span>
                  </div>
                )}

                {/* Movie / Series badge */}
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm"
                  style={isMovie
                    ? { background: "rgba(30,16,8,0.72)", border: "1px solid rgba(232,153,122,0.55)", color: "#e8997a", boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }
                    : { background: "rgba(8,16,30,0.72)", border: "1px solid rgba(79,125,247,0.55)", color: "#7b9df9", boxShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
                >
                  {isMovie ? "Movie" : "Series"}
                </div>

                {/* Hover overlay */}
                <div
                  className="absolute inset-x-0 bottom-0 h-2/5 opacity-0 group-hover:opacity-100 transition-opacity duration-250 flex items-end pb-3 px-3"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(79,125,247,0.95)" }}
                    >
                      <span className="text-black text-xs ml-0.5">▶</span>
                    </div>
                    <span className="text-xs font-bold text-white">Play</span>
                  </div>
                </div>

                {/* Favorite button */}
                {user && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (pendingHeart === series.id) return;
                      setPendingHeart(series.id);
                      await toggleSeries(series.id);
                      setPendingHeart(null);
                    }}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 active:scale-95 ${
                      saved ? "" : "opacity-0 group-hover:opacity-100"
                    } ${pendingHeart === series.id ? "opacity-50 pointer-events-none" : ""}`}
                    style={
                      saved
                        ? { background: "rgba(8,11,24,0.85)", color: "#4f7df7", boxShadow: "0 2px 10px rgba(0,0,0,0.8)" }
                        : { background: "rgba(0,0,0,0.65)", color: "rgba(255,255,255,0.8)", boxShadow: "0 2px 10px rgba(0,0,0,0.8)" }
                    }
                  >
                    {saved ? <IoHeart className="text-sm" /> : <IoHeartOutline className="text-sm" />}
                  </button>
                )}
              </motion.div>

              <div className="mt-3 px-0.5">
                <h4 className="text-sm font-semibold text-white group-hover:text-[#4f7df7] transition-colors leading-snug line-clamp-2">
                  {series.title}
                </h4>
                <p className="text-xs text-white/40 mt-0.5 truncate">{series.instructor}</p>
                {series.episodes.length > 1 && (
                  <p className="text-xs mt-0.5" style={{ color: "rgba(232,153,122,0.6)" }}>
                    {series.episodes.length} episodes
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function SeriesBrowse({ onSelectSeries, user }: SeriesBrowseProps) {
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(allSeries.map((s) => s.category)))];
  const filtered = activeCategory === "All" ? allSeries : allSeries.filter((s) => s.category === activeCategory);

  const rows: { title: string; items: Series[] }[] =
    activeCategory === "All"
      ? Array.from(new Set(allSeries.map((s) => s.category))).map((cat) => ({
          title: cat,
          items: allSeries.filter((s) => s.category === cat),
        }))
      : [{ title: activeCategory, items: filtered }];

  return (
    <section className="mt-6 mb-16 space-y-10">
      {/* Filter pills */}
      <div className="flex items-center gap-3 px-8 flex-wrap">
        <h3 className="text-lg font-bold text-white">Browse</h3>
        <div className="flex gap-2 ml-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="relative text-xs font-bold px-4 py-1.5 rounded-full transition-colors"
              style={{
                color: activeCategory === cat ? "#000" : "rgba(255,255,255,0.5)",
                border: activeCategory === cat ? "none" : "1px solid rgba(255,255,255,0.08)",
                background: activeCategory === cat ? "transparent" : "rgba(255,255,255,0.05)",
              }}
            >
              {activeCategory === cat && (
                <motion.div
                  layoutId="series-cat-pill"
                  className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 100%)" }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              )}
              <span className="relative z-10">{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rows */}
      {rows.map((row) => (
        <Row
          key={row.title}
          title={row.title}
          items={row.items}
          onSelectSeries={onSelectSeries}
          user={user}
        />
      ))}
    </section>
  );
}

export default SeriesBrowse;
