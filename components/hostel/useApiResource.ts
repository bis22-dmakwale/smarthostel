"use client";
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export function useApiResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await apiRequest<T>(path));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load this information.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    let active = true;
    apiRequest<T>(path).then((result) => {
      if (!active) return;
      setData(result);
      setError("");
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Unable to load this information.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [path]);
  return { data, setData, error, setError, loading, refresh };
}
