import { useState, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import gsap from "gsap";
import Navbar from "./Navbar";
import Hero from "./Hero";
import ContinueWatching from "./ContinueWatching";
import SeriesBrowse from "./SeriesBrowse";
import Sidebar from "./Sidebar";
import VideoDetailsPage from "./VideoDetailsPage";
import Login from "./Login";
import Register from "./Register";
import Favorites from "./Favorites";
import SettingsPage from "./SettingsPage";
import SearchResultsPage from "./SearchResultsPage";
import { useFavorites } from "./FavoritesContext";
import { useAuth } from "./AuthContext";
import { allSeries } from "./data";
import type { Series } from "./data";

type Page = "home" | "video" | "login" | "register" | "favorites" | "settings" | "search";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [initialEpisodeId, setInitialEpisodeId] = useState<number | undefined>();
  const [initialTimestamp, setInitialTimestamp] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedOutToast, setSignedOutToast] = useState(false);

  const prevPageRef = useRef<Page>("home");
  const savedScrollRef = useRef(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  const { fetchFavorites, clearFavorites } = useFavorites();
  const { setUserId } = useAuth();

  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch("http://localhost:5000/api/users/me", {
            headers: { "x-auth-token": token },
          });
          if (response.ok) {
            const userData = await response.json();
            const id = userData._id ?? userData.id;
            setUser({ id, name: userData.name, email: userData.email, avatar: userData.avatar || '' });
            setUserId(id);
            fetchFavorites();
          } else {
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  const handleOpenVideo = (seriesId: string, episodeId?: number, timestamp?: number) => {
    const series = allSeries.find((s) => s.id === seriesId);
    if (series) {
      savedScrollRef.current = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollRef.current}px`;
      document.body.style.width = "100%";

      prevPageRef.current = currentPage;
      setSelectedSeries(series);
      setInitialEpisodeId(episodeId);
      setInitialTimestamp(timestamp);
      setCurrentPage("video");
    }
  };

  const runPageTransition = (
    exitVars: gsap.TweenVars,
    enterFrom: gsap.TweenVars,
    enterTo: gsap.TweenVars,
    onMid: () => void
  ) => {
    gsap.to(contentRef.current, {
      ...exitVars,
      onComplete: () => {
        flushSync(onMid);
        gsap.fromTo(contentRef.current, enterFrom, {
          ...enterTo,
          onComplete: () => { isTransitioningRef.current = false; },
        });
      },
    });
  };

  const navigateTo = (page: Page) => {
    if (page === currentPage) return;

    if (currentPage === "video") {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, savedScrollRef.current);
      prevPageRef.current = "video";
      setCurrentPage(page);
      setSelectedSeries(null);
      setInitialEpisodeId(undefined);
      setInitialTimestamp(undefined);
      return;
    }

    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    prevPageRef.current = currentPage;

    const toSettings = page === "settings";
    const fromSettings = currentPage === "settings";

    const exitVars = toSettings
      ? { opacity: 0, x: -24, duration: 0.2, ease: "power2.in" }
      : fromSettings
        ? { opacity: 0, x: 24, duration: 0.2, ease: "power2.in" }
        : { opacity: 0, y: -10, duration: 0.18, ease: "power2.in" };

    const enterFrom = toSettings
      ? { opacity: 0, x: 48 }
      : fromSettings
        ? { opacity: 0, x: -24 }
        : { opacity: 0, y: 14 };

    const enterTo = toSettings || fromSettings
      ? { opacity: 1, x: 0, duration: 0.38, ease: "power3.out" }
      : { opacity: 1, y: 0, duration: 0.36, ease: "power3.out" };

    runPageTransition(exitVars, enterFrom, enterTo, () => {
      setCurrentPage(page);
      setSelectedSeries(null);
      setInitialEpisodeId(undefined);
      setInitialTimestamp(undefined);
      window.scrollTo(0, 0);
    });
  };

  const handleShowMore = (q: string) => {
    setSearchQuery(q);
    navigateTo("search");
  };

  const handleUserUpdate = (updated: User) => setUser(updated);

  const handleDeleteAccount = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUserId(null);
    clearFavorites();
    setCurrentPage("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setUserId(null);
    clearFavorites();
    setCurrentPage("home");
    setSignedOutToast(true);
    setTimeout(() => setSignedOutToast(false), 3000);
  };

  if (loading) return <div className="min-h-screen bg-app-bg" />;

  return (
    <LayoutGroup>
      <div className="min-h-screen bg-app-bg text-white relative">
        <Sidebar
          onNavigate={navigateTo}
          currentPage={currentPage}
          user={user}
          onLogout={handleLogout}
          avatar={user?.avatar}
        />

        <div className="pl-0 md:pl-20">
          <Navbar onSelectSeries={handleOpenVideo} onShowMore={handleShowMore} />

          <main className={currentPage === "login" || currentPage === "register" ? "" : "pb-24"}>
            <div ref={contentRef}>
              {currentPage === "home" && (
                <div className="pt-4">
                  <Hero onPlay={handleOpenVideo} user={user} />
                  <ContinueWatching onSelectVideo={handleOpenVideo} />
                  <SeriesBrowse onSelectSeries={handleOpenVideo} user={user} />
                </div>
              )}

              {currentPage === "login" && (
                <Login
                  onSwitch={() => setCurrentPage("register")}
                  onLogin={(userData: User) => {
                    isTransitioningRef.current = true;
                    runPageTransition(
                      { opacity: 0, scale: 0.96, duration: 0.22, ease: "power2.in" },
                      { opacity: 0, scale: 1.04 },
                      { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
                      () => {
                        setUser(userData);
                        setUserId(userData.id);
                        fetchFavorites();
                        setCurrentPage("home");
                        window.scrollTo(0, 0);
                      }
                    );
                  }}
                />
              )}

              {currentPage === "register" && (
                <Register
                  onSwitch={() => setCurrentPage("login")}
                  onRegister={(userData: User) => {
                    isTransitioningRef.current = true;
                    runPageTransition(
                      { opacity: 0, scale: 0.96, duration: 0.22, ease: "power2.in" },
                      { opacity: 0, scale: 1.04 },
                      { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" },
                      () => {
                        setUser(userData);
                        setUserId(userData.id);
                        fetchFavorites();
                        setCurrentPage("home");
                        window.scrollTo(0, 0);
                      }
                    );
                  }}
                />
              )}

              {currentPage === "favorites" && (
                <Favorites
                  user={user}
                  onLogin={() => setCurrentPage("login")}
                  onRegister={() => setCurrentPage("register")}
                  onSelectSeries={(seriesId, episodeId) => handleOpenVideo(seriesId, episodeId)}
                />
              )}

              {currentPage === "settings" && user && (
                <SettingsPage
                  user={user}
                  onBack={() => navigateTo("home")}
                  onUserUpdate={handleUserUpdate}
                  onDeleteAccount={handleDeleteAccount}
                />
              )}

              {currentPage === "search" && (
                <SearchResultsPage
                  query={searchQuery}
                  onSelectSeries={handleOpenVideo}
                  onBack={() => navigateTo("home")}
                />
              )}
            </div>
          </main>
        </div>

        <AnimatePresence>
          {currentPage === "video" && selectedSeries && (
            <VideoDetailsPage
              key={selectedSeries.id}
              series={selectedSeries}
              user={user}
              onBack={() => navigateTo("home")}
              initialEpisodeId={initialEpisodeId}
              initialTimestamp={initialTimestamp}
              onSelectSeries={(seriesId) => {
                const next = allSeries.find((s) => s.id === seriesId);
                if (next) {
                  setSelectedSeries(next);
                  setInitialEpisodeId(undefined);
                  setInitialTimestamp(undefined);
                }
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {signedOutToast && (
            <motion.div
              className="fixed bottom-10 left-0 right-0 mx-auto w-fit z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl pointer-events-none"
              style={{
                background: "linear-gradient(145deg, #0f1220 0%, #080e1c 100%)",
                border: "1px solid rgba(79, 125, 247, 0.35)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,125,247,0.1)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(79,125,247,0.15)", border: "1px solid #4f7df7" }}
              >
                <span style={{ color: "#4f7df7", fontSize: "11px", fontWeight: 900 }}>✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none mb-0.5">Signed out</p>
                <p className="text-xs text-white/40">See you next time</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

export default App;
