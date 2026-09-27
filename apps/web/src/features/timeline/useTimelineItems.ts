import { useCallback, useEffect, useRef, useState } from "react";
import type { TimelineItem } from "@atlas/shared";
import { useAuth } from "../auth/AuthContext";
import { listTimeline } from "./api";

export function useTimelineItems() {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const revision = useRef(0);
  const changes = useRef(new Map<string, { revision: number; item: TimelineItem | null }>());
  const userKey = user?.id ?? "";

  useEffect(() => {
    revision.current = 0;
    changes.current.clear();
    setItems([]);
  }, [userKey]);

  useEffect(() => {
    if (authLoading) return;
    if (!userKey) {
      setLoading(false);
      setError("");
      return;
    }
    const controller = new AbortController();
    const startedAt = revision.current;
    setLoading(true);
    setError("");
    listTimeline(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      const merged = new Map(result.map((item) => [item.id, item]));
      for (const [id, change] of changes.current) {
        if (change.revision > startedAt) {
          if (change.item) merged.set(id, change.item);
          else merged.delete(id);
        }
      }
      setItems([...merged.values()]);
      for (const [id, change] of changes.current) {
        if (change.revision <= startedAt) changes.current.delete(id);
      }
    }).catch((reason: unknown) => {
      const aborted = controller.signal.aborted || (reason instanceof DOMException && reason.name === "AbortError");
      if (!aborted) setError("日程加载失败，请检查连接后重试。");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [attempt, authLoading, userKey]);

  const upsert = useCallback((item: TimelineItem) => {
    changes.current.set(item.id, { revision: ++revision.current, item });
    setItems((prev) => [...prev.filter((entry) => entry.id !== item.id), item]);
  }, []);
  const remove = useCallback((id: string) => {
    changes.current.set(id, { revision: ++revision.current, item: null });
    setItems((prev) => prev.filter((entry) => entry.id !== id));
  }, []);
  return {
    items,
    loading: authLoading || loading,
    error,
    retry: () => setAttempt((value) => value + 1),
    upsert,
    remove,
  };
}
