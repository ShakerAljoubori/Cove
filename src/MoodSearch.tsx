import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoSparkles, IoArrowForward, IoClose } from "react-icons/io5";
import { allSeries } from "./data";
import type { Series } from "./data";

const MOOD_CHIPS = [
  { label: "Hype me up", emoji: "🔥" },
  { label: "Something chill", emoji: "😌" },
  { label: "Make me cry", emoji: "😭" },
  { label: "Action-packed", emoji: "⚡" },
  { label: "Make me laugh", emoji: "😂" },
  { label: "Magical & beautiful", emoji: "✨" },
];

interface MoodSearchProps {
  onSelectSeries: (seriesId: string) => void;
}

export default function MoodSearch({ onSelectSeries }: MoodSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Series[] | null>(null);
  const [usedQuery, setUsedQuery] = useState("");
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (mood: string) => {
    const q = mood.trim();
    if (!q || loading) return;
    setLoading(true);
    setResults(null);
    setError(null);
    setAiUnavailable(false);
    setUsedQuery(q);

    try {
      const res = await fetch("http://localhost:5000/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: q }),
      });

      if (res.status === 503) {
        setAiUnavailable(true);
        return;
      }

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        return;
      }

      const { ids } = await res.json();
      const matched = (ids as string[])
        .map(id => allSeries.find(s => s.id === id))
        .filter((s): s is Series => s !== undefined);
      setResults(matched.length > 0 ? matched : []);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (label: string) => {
    setQuery(label);
    search(label);
  };

  const clear = () => {
    setResults(null);
    setUsedQuery("");
    setQuery("");
    setError(null);
    setAiUnavailable(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <section className="px-8 md:px-12 py-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: "rgba(232,153,122,0.12)", border: "1px solid rgba(232,153,122,0.3)" }}>
            <IoSparkles className="text-[#e8997a] text-sm" />
          </div>
          <h2 className="text-base font-bold text-white/80">Discover by mood</h2>
        </div>

        {/* Mood chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {MOOD_CHIPS.map(({ label, emoji }) => (
            <button
              key={label}
              onClick={() => handleChip(label)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search(query)}
              placeholder="Describe what you're in the mood for…"
              className="w-full bg-white/4 border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/25 focus:outline-none focus:border-[#e8997a]/40 transition-colors pr-10"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors">
                <IoClose className="text-base" />
              </button>
            )}
          </div>
          <button
            onClick={() => search(query)}
            disabled={!query.trim() || loading}
            className="px-5 py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg, #e8b07a 0%, #e8997a 100%)", boxShadow: "0 0 20px rgba(232,153,122,0.25)" }}
          >
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
              : <IoArrowForward className="text-lg" />}
          </button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {(results !== null || aiUnavailable || error) && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-white/40">
                  {aiUnavailable
                    ? "AI not configured"
                    : error
                      ? error
                      : results && results.length === 0
                        ? `No matches for "${usedQuery}"`
                        : `Showing picks for "${usedQuery}"`}
                </p>
                <button onClick={clear} className="text-xs text-white/30 hover:text-white transition-colors">
                  Clear
                </button>
              </div>


              {results && results.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {results.map((s, i) => (
                    <motion.button
                      key={s.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.22, ease: "easeOut" }}
                      onClick={() => onSelectSeries(s.id)}
                      className="group text-left rounded-2xl overflow-hidden transition-all hover:scale-[1.03] active:scale-[0.98]"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <div className="relative aspect-video overflow-hidden">
                        {s.thumbnail ? (
                          <img
                            src={s.thumbnail}
                            alt={s.title}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-2xl">🎬</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-1.5 left-2 right-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full" style={{ background: "rgba(232,153,122,0.2)", color: "#e8997a", border: "1px solid rgba(232,153,122,0.3)" }}>
                            {s.category}
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors leading-snug line-clamp-2">{s.title}</p>
                        <p className="text-[10px] text-white/30 mt-0.5 truncate">{s.instructor}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
