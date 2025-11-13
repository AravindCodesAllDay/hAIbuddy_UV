import { useCallback, useEffect, useRef } from "react";
import CONFIG from "../config";

export default function useIdleTimer(onIdle, timeout = CONFIG.IDLE_TIMEOUT) {
  const timerRef = useRef(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    timerRef.current = setTimeout(onIdle, timeout);
  }, [clear, onIdle, timeout]);

  useEffect(() => {
    return clear;
  }, [clear]);

  return { start, clear };
}
