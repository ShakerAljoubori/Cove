import { useState, useRef, useEffect, useCallback } from "react";
import { IoSearchOutline } from "react-icons/io5";
import { allSeries } from "./data";
import type { Series } from "./data";

interface NavbarProps {
  onSelectSeries: (seriesId: string, episodeId?: number) => void;
  onShowMore: (query: string) => void;
}

function Navbar({ onSelectSeries, onShowMore }: NavbarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Series[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    const lower = q.toLowerCase().trim();
    if (!lower) { setResults([]); return; }
    setResults(
      allSeries.filter(s =>
        s.title.toLowerCase().includes(lower) ||
        s.instructor.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower)
      ).slice(0, 5)
    );
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 150);
  };

  const clearSearch = () => { setQuery(""); setResults([]); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") clearSearch();
    if (e.key === "Enter" && query.trim()) { onShowMore(query.trim()); clearSearch(); }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) clearSearch();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isOpen = query.trim().length > 0;

  return (
    <nav className="fixed top-0 left-0 w-full z-[55] flex items-center justify-between pl-24 pr-8 py-4 backdrop-blur-md" style={{ background: "linear-gradient(180deg, rgba(8,11,24,0.92) 0%, rgba(6,9,18,0.7) 100%)", borderBottom: "1px solid rgba(79, 125, 247, 0.18)" }}>

      <div className="flex-1 hidden md:block" />

      <div className="flex-1 flex justify-center items-center">
        <div ref={containerRef} className="relative flex items-center group">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-primary transition-colors text-lg z-10" />

          <input
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search movies, series..."
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm text-text-main placeholder:text-text-muted/40 focus:outline-none focus:ring-1 focus:ring-brand-primary/30 focus:bg-white/10 transition-all duration-300 ease-in-out w-40 focus:w-[min(320px,calc(100vw-2rem))]"
          />

          {isOpen && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-[min(320px,calc(100vw-2rem))] rounded-xl shadow-2xl overflow-hidden z-50" style={{ background: "linear-gradient(145deg, #0f1220 0%, #111111 100%)", border: "1px solid rgba(79, 125, 247, 0.15)" }}>
              {results.length > 0 ? (
                <>
                  {results.map(s => (
                    <button
                      key={s.id}
                      onMouseDown={() => { onSelectSeries(s.id); clearSearch(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors"
                    >
                      {s.thumbnail
                        ? <img src={s.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0" />}
                      <div className="min-w-0">
                        <div className="text-sm text-white truncate">{s.title}</div>
                        <div className="text-xs text-white/40">{s.instructor} · {s.category}</div>
                      </div>
                    </button>
                  ))}
                  <button
                    onMouseDown={() => { onShowMore(query); clearSearch(); }}
                    className="w-full px-4 py-3 text-sm font-medium transition-colors border-t border-white/5 text-center"
                    style={{ color: "#4f7df7" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(79,125,247,0.06)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "")}
                  >
                    Show all results for "{query}"
                  </button>
                </>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-white/30">
                  No results for "{query}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 hidden md:block" />
    </nav>
  );
}

export default Navbar;
