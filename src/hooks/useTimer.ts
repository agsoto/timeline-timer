import { useCallback, useEffect, useRef, useState } from "react";

export interface TimerState {
  elapsedSeconds: number;
  running: boolean;
  setElapsedSeconds: (seconds: number) => void;
  toggle: () => void;
  pause: () => void;
  start: () => void;
  restart: () => void;
}

export function useTimer(totalSeconds: number): TimerState {
  const [elapsedSeconds, setElapsedState] = useState(0);
  const [running, setRunning] = useState(false);
  const elapsedRef = useRef(0);
  const runningRef = useRef(false);
  const totalRef = useRef(totalSeconds);
  const startedAtRef = useRef(0);
  const startElapsedRef = useRef(0);
  totalRef.current = totalSeconds;

  const setElapsedSeconds = useCallback((seconds: number) => {
    const next = Math.max(0, Math.min(seconds, totalRef.current));
    elapsedRef.current = next;
    startElapsedRef.current = next;
    startedAtRef.current = Date.now();
    setElapsedState(next);
  }, []);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let interval = 0;
    startedAtRef.current = Date.now();
    startElapsedRef.current = elapsedRef.current;

    const syncElapsed = () => {
      if (!runningRef.current) return false;
      const liveTotal = totalRef.current;
      const next = Math.min(liveTotal, startElapsedRef.current + (Date.now() - startedAtRef.current) / 1000);
      elapsedRef.current = next;
      setElapsedState(next);
      if (next >= liveTotal) {
        runningRef.current = false;
        setRunning(false);
        return false;
      }
      return true;
    };

    const animate = () => {
      if (syncElapsed()) frame = requestAnimationFrame(animate);
    };
    const resync = () => { syncElapsed(); };

    frame = requestAnimationFrame(animate);
    interval = window.setInterval(syncElapsed, 250);
    window.addEventListener("focus", resync);
    window.addEventListener("resize", resync);
    document.addEventListener("visibilitychange", resync);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(interval);
      window.removeEventListener("focus", resync);
      window.removeEventListener("resize", resync);
      document.removeEventListener("visibilitychange", resync);
    };
  }, [running]);

  useEffect(() => {
    if (elapsedRef.current > totalSeconds) setElapsedSeconds(totalSeconds);
  }, [setElapsedSeconds, totalSeconds]);

  const start = useCallback(() => {
    if (totalRef.current <= 0) return;
    if (elapsedRef.current >= totalRef.current) setElapsedSeconds(0);
    runningRef.current = true;
    setRunning(true);
  }, [setElapsedSeconds]);

  const pause = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);
  const toggle = useCallback(() => {
    if (totalRef.current <= 0) return;
    if (!runningRef.current && elapsedRef.current >= totalRef.current) setElapsedSeconds(0);
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  }, [setElapsedSeconds]);
  const restart = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    setElapsedSeconds(0);
  }, [setElapsedSeconds]);

  return { elapsedSeconds, running, setElapsedSeconds, toggle, pause, start, restart };
}
