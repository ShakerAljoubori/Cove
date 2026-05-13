import { useState } from "react";
import { IoHeart, IoHeartOutline } from "react-icons/io5";
import { useFavorites } from "./FavoritesContext";
import { allSeries } from "./data";

interface HeroProps {
  onPlay: (seriesId: string) => void;
  user: { name: string; email: string } | null;
}

function Hero({ onPlay, user }: HeroProps) {
  const [featured] = useState(() => allSeries[Math.floor(Math.random() * allSeries.length)]);
  const { isSeriesFavorite, toggleSeries } = useFavorites();
  const saved = isSeriesFavorite(featured.id);

  return (
    <main className="relative min-h-[85vh] flex flex-col justify-center px-12 text-text-main overflow-hidden">

      {/* Background image */}
      <div
        className="absolute inset-0 z-0 bg-cover"
        style={{ backgroundImage: `url('${featured.backdrop ?? featured.thumbnail}')`, backgroundPosition: "right center" }}
      />

      {/* Left fade — image bleeds to black cleanly */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(90deg, #080b18 20%, rgba(8,11,24,0.6) 45%, rgba(8,11,24,0.0) 70%)" }} />

      {/* Bottom fade — hero floor connects to page */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to top, #080b18 0%, rgba(8,11,24,0.5) 20%, transparent 50%)" }} />

      {/* Top fade */}
      <div className="absolute inset-0 z-10" style={{ background: "linear-gradient(to bottom, rgba(8,11,24,0.4) 0%, transparent 30%)" }} />

      <div className="relative z-20 max-w-2xl mt-28">

        {/* Featured badge — gold */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-6 rounded-full" style={{ background: "rgba(232,153,122,0.1)", border: "1px solid rgba(232,153,122,0.3)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#e8997a" }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#e8997a" }}>Featured</span>
        </div>

        <div className="mb-4">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-md">
            {featured.title}
          </h2>
        </div>

        <p className="text-sm font-medium text-text-muted mb-6">
          {featured.instructor} • {featured.episodes.length} Episodes • {featured.category}
        </p>

        <p className="text-text-muted max-w-lg leading-relaxed mb-10 line-clamp-3">
          {featured.description}
        </p>

        <div className="flex gap-4 items-center">

          {/* Primary CTA — green gradient with glow */}
          <button
            onClick={() => onPlay(featured.id)}
            className="flex items-center gap-2 text-black px-8 py-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 hover:brightness-110 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #7b9df9 0%, #4f7df7 60%, #3461e0 100%)",
              boxShadow: "0 0 28px rgba(79,125,247,0.45), 0 4px 12px rgba(0,0,0,0.4)",
            }}
          >
            <span className="text-lg">▶</span>
            Watch Now
          </button>

          {user && (
            <button
              onClick={() => toggleSeries(featured.id)}
              className="p-3 rounded-lg font-bold transition-all duration-300 hover:scale-105 cursor-pointer"
              style={saved
                ? { background: "rgba(79,125,247,0.15)", border: "1px solid rgba(79,125,247,0.4)", color: "#4f7df7" }
                : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)" }}
              title={saved ? "Remove from favorites" : "Save to favorites"}
            >
              {saved ? <IoHeart className="text-xl" /> : <IoHeartOutline className="text-xl" />}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

export default Hero;
