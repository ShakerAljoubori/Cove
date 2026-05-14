import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

export interface PartyMember {
  socketId: string;
  userId: string;
  userName: string;
  avatar?: string;
}

export interface JoinNavTarget {
  seriesId: string;
  episodeId: number;
  currentTime: number;
}

interface WatchPartyCtx {
  roomCode: string | null;
  members: PartyMember[];
  isHost: boolean;
  isInParty: boolean;
  error: string | null;
  joinNavTarget: JoinNavTarget | null;
  clearJoinNavTarget: () => void;
  clearError: () => void;
  createParty: (seriesId: string, episodeId: number, user: { id: string; name: string; avatar?: string }) => void;
  joinParty: (code: string, user: { id: string; name: string; avatar?: string }) => void;
  leaveParty: () => void;
  emitPlay: (t: number) => void;
  emitPause: (t: number) => void;
  emitSeek: (t: number) => void;
  emitChangeEpisode: (episodeId: number) => void;
  subscribePlay: (cb: (t: number) => void) => () => void;
  subscribePause: (cb: (t: number) => void) => () => void;
  subscribeSeek: (cb: (t: number) => void) => () => void;
  subscribeEpisodeChange: (cb: (id: number) => void) => () => void;
}

const WatchPartyContext = createContext<WatchPartyCtx | null>(null);

export function WatchPartyProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinNavTarget, setJoinNavTarget] = useState<JoinNavTarget | null>(null);

  const playCallbacks = useRef<Set<(t: number) => void>>(new Set());
  const pauseCallbacks = useRef<Set<(t: number) => void>>(new Set());
  const seekCallbacks = useRef<Set<(t: number) => void>>(new Set());
  const episodeCallbacks = useRef<Set<(id: number) => void>>(new Set());

  const getSocket = useCallback((): Socket => {
    if (socketRef.current) return socketRef.current;

    const s = io("http://localhost:5000");

    s.on("party:play", ({ currentTime }: { currentTime: number }) => {
      playCallbacks.current.forEach(cb => cb(currentTime));
    });
    s.on("party:pause", ({ currentTime }: { currentTime: number }) => {
      pauseCallbacks.current.forEach(cb => cb(currentTime));
    });
    s.on("party:seek", ({ currentTime }: { currentTime: number }) => {
      seekCallbacks.current.forEach(cb => cb(currentTime));
    });
    s.on("party:change-episode", ({ episodeId }: { episodeId: number }) => {
      episodeCallbacks.current.forEach(cb => cb(episodeId));
    });
    s.on("party:member-joined", ({ member }: { member: PartyMember }) => {
      setMembers(prev => [...prev, member]);
    });
    s.on("party:member-left", ({ socketId }: { socketId: string }) => {
      setMembers(prev => prev.filter(m => m.socketId !== socketId));
    });
    s.on("party:host-changed", ({ socketId }: { socketId: string }) => {
      if (s.id === socketId) setIsHost(true);
    });
    s.on("party:error", ({ message }: { message: string }) => {
      setError(message);
    });

    socketRef.current = s;
    return s;
  }, []);

  const createParty = useCallback((
    seriesId: string,
    episodeId: number,
    user: { id: string; name: string; avatar?: string }
  ) => {
    setError(null);
    const s = getSocket();

    s.once("party:created", ({ roomCode: code }: { roomCode: string }) => {
      setRoomCode(code);
      setIsHost(true);
    });
    s.once("party:joined", ({ members: m }: { members: PartyMember[]; state: unknown }) => {
      setMembers(m);
    });

    s.emit("party:create", { seriesId, episodeId, userId: user.id, userName: user.name, avatar: user.avatar });
  }, [getSocket]);

  const joinParty = useCallback((
    code: string,
    user: { id: string; name: string; avatar?: string }
  ) => {
    setError(null);
    const s = getSocket();

    s.once("party:joined", ({
      members: m,
      state,
    }: {
      members: PartyMember[];
      state: { isPlaying: boolean; currentTime: number; seriesId: string; episodeId: number };
    }) => {
      setMembers(m);
      setRoomCode(code);
      setIsHost(false);
      setJoinNavTarget({ seriesId: state.seriesId, episodeId: state.episodeId, currentTime: state.currentTime });
    });

    s.emit("party:join", { roomCode: code.trim().toUpperCase(), userId: user.id, userName: user.name, avatar: user.avatar });
  }, [getSocket]);

  const leaveParty = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("party:leave");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setRoomCode(null);
    setMembers([]);
    setIsHost(false);
    setError(null);
  }, []);

  const emitPlay = useCallback((t: number) => {
    socketRef.current?.emit("party:play", { currentTime: t });
  }, []);

  const emitPause = useCallback((t: number) => {
    socketRef.current?.emit("party:pause", { currentTime: t });
  }, []);

  const emitSeek = useCallback((t: number) => {
    socketRef.current?.emit("party:seek", { currentTime: t });
  }, []);

  const emitChangeEpisode = useCallback((episodeId: number) => {
    socketRef.current?.emit("party:change-episode", { episodeId });
  }, []);

  const subscribePlay = useCallback((cb: (t: number) => void) => {
    playCallbacks.current.add(cb);
    return () => { playCallbacks.current.delete(cb); };
  }, []);

  const subscribePause = useCallback((cb: (t: number) => void) => {
    pauseCallbacks.current.add(cb);
    return () => { pauseCallbacks.current.delete(cb); };
  }, []);

  const subscribeSeek = useCallback((cb: (t: number) => void) => {
    seekCallbacks.current.add(cb);
    return () => { seekCallbacks.current.delete(cb); };
  }, []);

  const subscribeEpisodeChange = useCallback((cb: (id: number) => void) => {
    episodeCallbacks.current.add(cb);
    return () => { episodeCallbacks.current.delete(cb); };
  }, []);

  const clearJoinNavTarget = useCallback(() => setJoinNavTarget(null), []);
  const clearError = useCallback(() => setError(null), []);

  return (
    <WatchPartyContext.Provider value={{
      roomCode,
      members,
      isHost,
      isInParty: roomCode !== null,
      error,
      joinNavTarget,
      clearJoinNavTarget,
      clearError,
      createParty,
      joinParty,
      leaveParty,
      emitPlay,
      emitPause,
      emitSeek,
      emitChangeEpisode,
      subscribePlay,
      subscribePause,
      subscribeSeek,
      subscribeEpisodeChange,
    }}>
      {children}
    </WatchPartyContext.Provider>
  );
}

export function useWatchParty() {
  const ctx = useContext(WatchPartyContext);
  if (!ctx) throw new Error("useWatchParty must be used within WatchPartyProvider");
  return ctx;
}
