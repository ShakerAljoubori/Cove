import { useMemo } from "react";
import { IoArrowBack } from "react-icons/io5";
import { allSeries, allAudioBooks } from "./data";
import type { Series, AudioBook } from "./data";

interface SearchResultsPageProps {
  query: string;
  onSelectSeries: (seriesId: string) => void;
  onSelectBook: (bookId: string) => void;
  onBack: () => void;
}

function SearchResultsPage({ query, onSelectSeries, onSelectBook, onBack }: SearchResultsPageProps) {
  const lower = query.toLowerCase().trim();

  const series = useMemo(() => allSeries.filter(s =>
    s.title.toLowerCase().includes(lower) ||
    s.instructor.toLowerCase().includes(lower) ||
    s.category.toLowerCase().includes(lower)
  ), [lower]);

  const books = useMemo(() => allAudioBooks.filter(b =>
    b.title.toLowerCase().includes(lower) ||
    b.author.toLowerCase().includes(lower)
  ), [lower]);

  const totalResults = series.length + books.length;

  return (
    <div className="pt-20 px-6 md:px-10 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8 mt-4">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
          >
            <IoArrowBack className="text-white/70 text-lg" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              Results for <span style={{ color: "#16c47f" }}>"{query}"</span>
            </h1>
            <p className="text-xs text-white/40 mt-0.5">{totalResults} result{totalResults !== 1 ? "s" : ""} found</p>
          </div>
        </div>

        {totalResults === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4 opacity-20">🔍</div>
            <p className="text-white/40 text-base">No results for "{query}"</p>
            <p className="text-white/20 text-sm mt-1">Try a different keyword or check your spelling</p>
          </div>
        ) : (
          <>
            {series.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Series</h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: "#f5c451", background: "rgba(245,196,81,0.1)", border: "1px solid rgba(245,196,81,0.2)" }}
                  >
                    {series.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {series.map((s: Series) => (
                    <button
                      key={s.id}
                      onClick={() => onSelectSeries(s.id)}
                      className="group text-left w-[200px] shrink-0"
                    >
                      <div
                        className="relative aspect-video rounded-xl overflow-hidden mb-2 transition-all duration-300"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(22,196,127,0.5), 0 8px 32px rgba(22,196,127,0.18)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}
                      >
                        {s.thumbnail ? (
                          <img
                            src={s.thumbnail}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-white/5" />
                        )}
                      </div>
                      <div className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                        {s.title}
                      </div>
                      <div className="text-xs text-white/40 truncate mt-0.5">{s.instructor} · {s.category}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {books.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider">Audiobooks</h2>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ color: "#f5c451", background: "rgba(245,196,81,0.1)", border: "1px solid rgba(245,196,81,0.2)" }}
                  >
                    {books.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {books.map((b: AudioBook) => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBook(b.id)}
                      className="group text-left w-[160px] shrink-0"
                    >
                      <div
                        className="relative aspect-square rounded-xl overflow-hidden mb-2 transition-all duration-300"
                        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 0 0 1px rgba(22,196,127,0.5), 0 8px 32px rgba(22,196,127,0.18)")}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = "")}
                      >
                        <img
                          src={b.image}
                          alt={b.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="text-sm font-semibold text-white truncate group-hover:text-green-400 transition-colors">
                        {b.title}
                      </div>
                      <div className="text-xs text-white/40 truncate mt-0.5">{b.author}</div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResultsPage;
