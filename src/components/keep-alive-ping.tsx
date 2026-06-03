"use client";

import { useEffect, useRef } from "react";

export function KeepAlivePing() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function ping() {
      fetch("/api/keep-alive", { cache: "no-store" }).catch(() => {});
    }
    ping();
    intervalRef.current = setInterval(ping, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
