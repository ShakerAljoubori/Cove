import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface ProgressEntry {
  seriesId: string;
  episodeId: number;
  timestamp: number;
  duration: number;
  snapshot?: string;
  updatedAt: string;
}

interface WatchProgressContextType {
  getProgress: (seriesId: string, episodeId: number) => ProgressEntry | null;
  saveProgress: (seriesId: string, episodeId: number, timestamp: number, duration: number, snapshot?: string) => void;
  removeProgress: (seriesId: string, episodeId: number) => void;
  allProgress: Record<string, ProgressEntry>;
}

const API = "http://localhost:5000/api/watch-progress";
const makeKey = (seriesId: string, episodeId: number) => `${seriesId}:${episodeId}`;

const loadFromStorage = (key: string): Record<string, ProgressEntry> => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveToStorage = (key: string, data: Record<string, ProgressEntry>) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const getToken = () => localStorage.getItem("token");

const WatchProgressContext = createContext<WatchProgressContextType | undefined>(undefined);

export const WatchProgressProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId } = useAuth();
  const lsKey = userId ? `cove_watch_progress_${userId}` : "cove_watch_progress_guest";

  const [allProgress, setAllProgress] = useState<Record<string, ProgressEntry>>(() =>
    loadFromStorage(lsKey)
  );

  // When userId changes (login/logout/switch), load the right data source
  useEffect(() => {
    if (!userId) {
      setAllProgress(loadFromStorage("cove_watch_progress_guest"));
      return;
    }

    const token = getToken();
    if (!token) {
      setAllProgress(loadFromStorage(lsKey));
      return;
    }

    // Logged in — fetch from server
    fetch(API, { headers: { "x-auth-token": token } })
      .then((r) => r.json())
      .then((entries: Array<{ seriesId: string; episodeId: number; timestamp: number; duration: number; updatedAt: string }>) => {
        const map: Record<string, ProgressEntry> = {};
        for (const e of entries) {
          map[makeKey(e.seriesId, e.episodeId)] = {
            seriesId: e.seriesId,
            episodeId: e.episodeId,
            timestamp: e.timestamp,
            duration: e.duration,
            updatedAt: e.updatedAt,
          };
        }
        setAllProgress(map);
        // Mirror to localStorage as offline cache
        saveToStorage(lsKey, map);
      })
      .catch(() => {
        // Server unreachable — fall back to cached localStorage
        setAllProgress(loadFromStorage(lsKey));
      });
  }, [userId, lsKey]);

  const saveProgress = useCallback((
    seriesId: string,
    episodeId: number,
    timestamp: number,
    duration: number,
    snapshot?: string
  ) => {
    if (timestamp < 10) return;

    const key = makeKey(seriesId, episodeId);

    // Episode finished — remove from Continue Watching
    if (duration > 0 && timestamp / duration > 0.95) {
      setAllProgress((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        saveToStorage(lsKey, next);
        return next;
      });

      if (userId) {
        const token = getToken();
        if (token) {
          fetch(`${API}/${seriesId}/${episodeId}`, {
            method: "DELETE",
            headers: { "x-auth-token": token },
          }).catch(() => {});
        }
      }
      return;
    }

    const entry: ProgressEntry = {
      seriesId,
      episodeId,
      timestamp,
      duration,
      ...(snapshot ? { snapshot } : {}),
      updatedAt: new Date().toISOString(),
    };

    setAllProgress((prev) => {
      const next = { ...prev, [key]: entry };
      saveToStorage(lsKey, next);
      return next;
    });

    if (userId) {
      const token = getToken();
      if (token) {
        fetch(API, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-auth-token": token },
          body: JSON.stringify({ seriesId, episodeId, timestamp, duration }),
        }).catch(() => {});
      }
    }
  }, [lsKey, userId]);

  const removeProgress = useCallback((seriesId: string, episodeId: number) => {
    const key = makeKey(seriesId, episodeId);
    setAllProgress((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      saveToStorage(lsKey, next);
      return next;
    });

    if (userId) {
      const token = getToken();
      if (token) {
        fetch(`${API}/${seriesId}/${episodeId}`, {
          method: "DELETE",
          headers: { "x-auth-token": token },
        }).catch(() => {});
      }
    }
  }, [lsKey, userId]);

  const getProgress = useCallback(
    (seriesId: string, episodeId: number): ProgressEntry | null =>
      allProgress[makeKey(seriesId, episodeId)] ?? null,
    [allProgress]
  );

  return (
    <WatchProgressContext.Provider value={{ getProgress, saveProgress, removeProgress, allProgress }}>
      {children}
    </WatchProgressContext.Provider>
  );
};

export const useWatchProgress = () => {
  const ctx = useContext(WatchProgressContext);
  if (!ctx) throw new Error("useWatchProgress must be used within WatchProgressProvider");
  return ctx;
};
