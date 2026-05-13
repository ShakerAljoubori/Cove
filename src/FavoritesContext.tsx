import React, { createContext, useContext, useState } from "react";

interface FavoritesState {
  seriesIds: string[];
  videoEpisodes: { seriesId: string; episodeId: number }[];
}

interface FavoritesContextType extends FavoritesState {
  fetchFavorites: () => Promise<void>;
  clearFavorites: () => void;
  toggleSeries: (seriesId: string) => Promise<void>;
  toggleVideoEpisode: (seriesId: string, episodeId: number) => Promise<void>;
  isSeriesFavorite: (id: string) => boolean;
  isVideoEpisodeSaved: (seriesId: string, episodeId: number) => boolean;
}

const empty: FavoritesState = {
  seriesIds: [],
  videoEpisodes: [],
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const API = "http://localhost:5000/api/users/favorites";
const headers = (token: string) => ({
  "Content-Type": "application/json",
  "x-auth-token": token,
});

export const FavoritesProvider = ({ children }: { children: React.ReactNode }) => {
  const [fav, setFav] = useState<FavoritesState>(empty);

  const token = () => localStorage.getItem("token");

  const fetchFavorites = async () => {
    const t = token();
    if (!t) return;
    try {
      const res = await fetch(API, { headers: headers(t) });
      if (res.ok) setFav(await res.json());
    } catch {}
  };

  const clearFavorites = () => setFav(empty);

  const toggle = async (
    optimisticUpdate: (prev: FavoritesState) => FavoritesState,
    endpoint: string,
    body: object
  ) => {
    const t = token();
    if (!t) return;
    setFav(optimisticUpdate);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: headers(t),
        body: JSON.stringify(body),
      });
      if (res.ok) setFav(await res.json());
      else setFav(fav);
    } catch {
      setFav(fav);
    }
  };

  const toggleSeries = (seriesId: string) =>
    toggle(
      (prev) => ({
        ...prev,
        seriesIds: prev.seriesIds.includes(seriesId)
          ? prev.seriesIds.filter((id) => id !== seriesId)
          : [...prev.seriesIds, seriesId],
      }),
      `${API}/series`,
      { seriesId }
    );

  const toggleVideoEpisode = (seriesId: string, episodeId: number) =>
    toggle(
      (prev) => {
        const exists = prev.videoEpisodes.some(
          (e) => e.seriesId === seriesId && e.episodeId === episodeId
        );
        return {
          ...prev,
          videoEpisodes: exists
            ? prev.videoEpisodes.filter(
                (e) => !(e.seriesId === seriesId && e.episodeId === episodeId)
              )
            : [...prev.videoEpisodes, { seriesId, episodeId }],
        };
      },
      `${API}/episodes/video`,
      { seriesId, episodeId }
    );

  return (
    <FavoritesContext.Provider
      value={{
        ...fav,
        fetchFavorites,
        clearFavorites,
        toggleSeries,
        toggleVideoEpisode,
        isSeriesFavorite: (id) => fav.seriesIds.includes(id),
        isVideoEpisodeSaved: (seriesId, episodeId) =>
          fav.videoEpisodes.some(
            (e) => e.seriesId === seriesId && e.episodeId === episodeId
          ),
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
