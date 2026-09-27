import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { type TimelineItem } from "@atlas/shared";
import { periodOf } from "../model";
import { IconBackToNow, IconButton, IconClose, IconNext, IconNow } from "../../../shared/ui/Icons";
import { removeTimeline } from "../api";
import { AddScheduleForm } from "./AddScheduleForm";
import { HourNoteBoard, HourNoteStrip } from "./HourNotes";

const ITEM_HEIGHT = 104;
const TOTAL_HOURS = 24;

const visibleRangeOf = (height: number) => Math.max(3, Math.ceil(height / ITEM_HEIGHT / 2) + 1);

export type HourWheelHandle = {
  scrollToNow: () => void;
};

type Props = {
  items: TimelineItem[];
  isToday: boolean;
  now: Date;
  dateKey: string;
  onCreated: (item: TimelineItem) => void;
  onUpdated: (item: TimelineItem) => void;
  onDeleted: (id: string) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

const offsetOfNow = (now: Date) => now.getHours() * ITEM_HEIGHT;

export const HourWheel = forwardRef<HourWheelHandle, Props>(({ items, isToday, now, dateKey, onCreated, onUpdated, onDeleted }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deletingRef = useRef<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  useEffect(() => {
    const media = window.matchMedia?.("(min-width: 1024px)");
    if (!media) return;
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const [containerHeight, setContainerHeight] = useState(420);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offsetY, setOffsetY] = useState(() =>
    isToday ? offsetOfNow(now) : items[0] ? new Date(items[0].startAt).getHours() * ITEM_HEIGHT : 9 * ITEM_HEIGHT,
  );

  const stateRef = useRef({
    offsetY: 0,
    isDragging: false,
    startY: 0,
    startOffset: 0,
    lastY: 0,
    lastTime: 0,
    velocity: 0,
    animId: 0,
    hasMoved: false,
    wheelTimer: 0,
  });
  stateRef.current.offsetY = offsetY;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientHeight > 0) setContainerHeight(el.clientHeight);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stopAnimation = useCallback(() => {
    window.clearTimeout(stateRef.current.wheelTimer);
    stateRef.current.wheelTimer = 0;
    if (stateRef.current.animId) {
      cancelAnimationFrame(stateRef.current.animId);
      stateRef.current.animId = 0;
    }
  }, []);

  useEffect(() => () => stopAnimation(), [stopAnimation]);

  const smoothScrollToIndex = useCallback(
    (targetIndex: number) => {
      stopAnimation();
      const startY = stateRef.current.offsetY;
      const targetY = Math.round(targetIndex) * ITEM_HEIGHT;
      const dist = targetY - startY;
      if (reducedMotion || Math.abs(dist) < 0.5) {
        setOffsetY(targetY);
        return;
      }
      const duration = Math.min(480, Math.max(220, Math.abs(dist) * 1.5));
      const startTime = performance.now();
      const step = (nowTs: number) => {
        const progress = Math.min(1, (nowTs - startTime) / duration);
        const ease = 1 - (1 - progress) ** 3;
        setOffsetY(startY + dist * ease);
        if (progress < 1) stateRef.current.animId = requestAnimationFrame(step);
        else {
          setOffsetY(targetY);
          stateRef.current.animId = 0;
        }
      };
      stateRef.current.animId = requestAnimationFrame(step);
    },
    [stopAnimation, reducedMotion],
  );

  const scrollToHour = useCallback(
    (targetHour: number) => {
      const curVirtual = stateRef.current.offsetY / ITEM_HEIGHT;
      const curHour = ((Math.round(curVirtual) % TOTAL_HOURS) + TOTAL_HOURS) % TOTAL_HOURS;
      let diff = targetHour - curHour;
      while (diff > 12) diff -= TOTAL_HOURS;
      while (diff < -12) diff += TOTAL_HOURS;
      smoothScrollToIndex(Math.round(curVirtual) + diff);
    },
    [smoothScrollToIndex],
  );

  const scrollToNow = useCallback(() => {
    scrollToHour(new Date().getHours());
  }, [scrollToHour]);

  useImperativeHandle(ref, () => ({ scrollToNow }), [scrollToNow]);

  useEffect(() => {
    if (isToday) scrollToNow();
    else if (items[0]) scrollToHour(new Date(items[0].startAt).getHours());
    else scrollToHour(9);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday]);

  const schedulesByHour = useMemo(() => {
    const map = new Map<number, TimelineItem[]>();
    for (const item of items) {
      const hour = new Date(item.startAt).getHours();
      const list = map.get(hour) ?? [];
      list.push(item);
      map.set(hour, list);
    }
    return map;
  }, [items]);

  const onPointerDown = (event: PointerEvent) => {
    stopAnimation();
    stateRef.current.isDragging = true;
    stateRef.current.startY = event.clientY;
    stateRef.current.startOffset = stateRef.current.offsetY;
    stateRef.current.lastY = event.clientY;
    stateRef.current.lastTime = performance.now();
    stateRef.current.velocity = 0;
    stateRef.current.hasMoved = false;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!stateRef.current.isDragging) return;
    const delta = event.clientY - stateRef.current.startY;
    if (!stateRef.current.hasMoved && Math.abs(delta) > 5) {
      stateRef.current.hasMoved = true;
      try {
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    }
    if (!stateRef.current.hasMoved) return;
    setOpen(false);
    const nowTs = performance.now();
    const dt = Math.max(1, nowTs - stateRef.current.lastTime);
    stateRef.current.velocity = (event.clientY - stateRef.current.lastY) / dt;
    stateRef.current.lastY = event.clientY;
    stateRef.current.lastTime = nowTs;
    setOffsetY(stateRef.current.startOffset - delta);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.isDragging = false;
    try {
      const target = event.currentTarget as HTMLElement;
      if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    const velocity = stateRef.current.velocity;
    if (reducedMotion || !stateRef.current.hasMoved || Math.abs(velocity) < 0.15) {
      smoothScrollToIndex(Math.round(stateRef.current.offsetY / ITEM_HEIGHT));
      return;
    }
    let currentV = -velocity * 14;
    let currentY = stateRef.current.offsetY;
    const momentum = () => {
      currentV *= 0.92;
      currentY += currentV;
      setOffsetY(currentY);
      if (Math.abs(currentV) < 0.8) smoothScrollToIndex(Math.round(currentY / ITEM_HEIGHT));
      else stateRef.current.animId = requestAnimationFrame(momentum);
    };
    stateRef.current.animId = requestAnimationFrame(momentum);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      stopAnimation();
      setOpen(false);
      const next = stateRef.current.offsetY + event.deltaY * 0.7;
      setOffsetY(next);
      window.clearTimeout(stateRef.current.wheelTimer);
      stateRef.current.wheelTimer = window.setTimeout(() => {
        smoothScrollToIndex(Math.round(stateRef.current.offsetY / ITEM_HEIGHT));
      }, 180);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      stopAnimation();
    };
  }, [smoothScrollToIndex, stopAnimation]);

  const currentVirtualIndex = offsetY / ITEM_HEIGHT;
  const centerHourIndex = Math.round(currentVirtualIndex);
  const focusedHour = ((centerHourIndex % TOTAL_HOURS) + TOTAL_HOURS) % TOTAL_HOURS;
  const currentHour = now.getHours();
  const alignedToNow = isToday && focusedHour === currentHour;
  const focusedEvents = schedulesByHour.get(focusedHour) ?? [];

  useEffect(() => {
    setOpen(false);
    setSelectedId(null);
  }, [focusedHour]);

  const wasOpen = useRef(false);
  useEffect(() => {
    if (!open) {
      setSelectedId(null);
      if (wasOpen.current) triggerRef.current?.focus();
    } else closeRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const closePanel = () => setOpen(false);

  const visibleItems = useMemo(() => {
    const centerIdx = Math.round(currentVirtualIndex);
    const viewportHalf = containerHeight / 2;
    const visibleRange = visibleRangeOf(containerHeight);
    const slots = [];
    for (let i = centerIdx - visibleRange; i <= centerIdx + visibleRange; i += 1) {
      const hour = ((i % TOTAL_HOURS) + TOTAL_HOURS) % TOTAL_HOURS;
      const distFromCenter = i * ITEM_HEIGHT - offsetY;
      const norm = distFromCenter / (viewportHalf * 0.92);
      const absNorm = Math.abs(norm);
      slots.push({
        virtualIndex: i,
        hour,
        posY: viewportHalf + distFromCenter - ITEM_HEIGHT / 2,
        scale: Math.max(0.92, 1 - absNorm * 0.08),
        rotateX: 0,
        translateZ: 0,
        opacity: Math.max(0.35, 1 - Math.min(1, absNorm) ** 1.3 * 0.65),
        isNowHour: isToday && hour === currentHour,
        isFocused: Math.abs(distFromCenter) < ITEM_HEIGHT / 2,
        events: schedulesByHour.get(hour) ?? [],
      });
    }
    return slots;
  }, [containerHeight, currentHour, currentVirtualIndex, isToday, offsetY, schedulesByHour]);

  const editing = focusedEvents.find((entry) => entry.id === selectedId) ?? null;

  const dropItem = async (id: string) => {
    if (deletingRef.current) return;
    deletingRef.current = id;
    setDeletingId(id);
    setDeleteError("");
    try {
      await removeTimeline(id);
      setSelectedId((current) => current === id ? null : current);
      onDeleted(id);
    } catch {
      setDeleteError("删除失败，日程已保留。请检查连接后重试。");
    } finally {
      deletingRef.current = null;
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isToday ? (
        <div className="mb-2 flex shrink-0 items-center justify-end px-1 lg:max-w-[480px] xl:max-w-[540px]">
          {alignedToNow ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/[0.04] text-[var(--muted)]" title="现在">
              <IconNow />
            </span>
          ) : (
            <IconButton label="回到现在" onClick={scrollToNow}>
              <IconBackToNow />
            </IconButton>
          )}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
        <div
          inert={open && !isDesktop}
          className="relative flex min-h-0 flex-1 lg:max-w-[480px] xl:max-w-[540px] overflow-hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <div
              ref={containerRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ perspective: "850px", perspectiveOrigin: "50% 50%", touchAction: "none" }}
              className="relative min-h-0 flex-1 cursor-grab overflow-hidden select-none active:cursor-grabbing"
            >
              <div
                className="pointer-events-none absolute right-4 left-1 z-0 rounded-xl bg-black/[0.035]"
                style={{ top: "50%", height: ITEM_HEIGHT, transform: "translateY(-50%)" }}
              />

              {visibleItems.map((item) => (
                <div
                  key={item.virtualIndex}
                  className={`absolute right-7 left-0 flex px-3 will-change-transform ${
                    item.isFocused ? "items-center py-2" : "items-center"
                  }`}
                  style={{
                    minHeight: ITEM_HEIGHT,
                    height: ITEM_HEIGHT,
                    transform: `translateY(${item.posY}px) scale(${item.scale})`,
                    transformOrigin: item.isFocused ? "50% 0%" : "50% 50%",
                    opacity: item.opacity,
                    zIndex: item.isFocused ? 30 : 10,
                    transition: stateRef.current.isDragging ? "none" : "opacity 0.2s var(--ease)",
                  }}
                  onClick={() => {
                    if (!item.isFocused) smoothScrollToIndex(item.virtualIndex);
                  }}
                >
                  <div className={`flex h-14 w-[4.5rem] shrink-0 flex-col justify-center pl-3 ${item.isFocused ? "text-[var(--ink)]" : "text-[var(--faint)]"}`}>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`display text-[1.5rem] leading-none tracking-tight tabular-nums ${item.isFocused ? "font-semibold" : "font-normal"}`}>{pad(item.hour)}</span>
                      <span className="text-[11px] font-normal text-[var(--faint)] tabular-nums">:00</span>
                    </div>
                    {item.isNowHour ? (
                      <span className="mt-1 inline-flex w-fit items-center text-[10px] font-medium text-[var(--ink)]">
                        · 现在
                      </span>
                    ) : (
                      <span className="mt-1 text-[9px] font-normal tracking-wider text-[var(--faint)]/60 uppercase">
                        {item.hour < 12 ? "AM" : "PM"}
                      </span>
                    )}
                  </div>

                  <div className="relative min-w-0 flex-1 pl-3">
                    {item.isFocused ? (
                      <div className="relative flex h-14 items-center gap-2.5 rounded-xl bg-white px-3.5 ring-1 ring-[var(--line)] transition-all duration-200">
                        <button
                          ref={triggerRef}
                          type="button"
                          aria-label={`管理 ${pad(item.hour)}:00 的日程`}
                          aria-expanded={isDesktop || open}
                          aria-controls="hour-editor"
                          className="absolute inset-0 z-10 rounded-xl"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={(event) => {
                            event.stopPropagation();
                            stopAnimation();
                            setDeleteError("");
                            setOpen(true);
                          }}
                        />
                        {item.events.length === 0 ? (
                          <span className="min-w-0 flex-1 truncate text-xs text-[var(--faint)]">此时间段暂无安排</span>
                        ) : (
                          <HourNoteStrip items={item.events} />
                        )}
                        <IconNext className={`ml-auto h-3.5 w-3.5 shrink-0 text-[var(--faint)] duration-200 lg:hidden ${open ? "-rotate-90" : "rotate-90"}`} />
                      </div>
                    ) : item.events.length === 0 ? null : (
                      <HourNoteStrip items={item.events} limit={3} />
                    )}
                  </div>
                </div>
              ))}

              <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-24 bg-gradient-to-b from-[var(--wash)] via-[var(--wash)]/60 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-24 bg-gradient-to-t from-[var(--wash)] via-[var(--wash)]/60 to-transparent" />
            </div>
          </div>

          <div
            inert={open && !isDesktop}
            aria-label="选择小时"
            className="soft-scroll flex w-9 shrink-0 flex-col items-center overflow-y-auto py-3"
          >
            {Array.from({ length: 24 }, (_, hour) => {
              const hasEvents = (schedulesByHour.get(hour)?.length ?? 0) > 0;
              const selected = hour === focusedHour;
              const isNow = isToday && hour === currentHour;
              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => scrollToHour(hour)}
                  className="flex min-h-6 w-full flex-1 shrink-0 items-center justify-center rounded-md py-0.5 hover:bg-black/[0.04] transition-colors"
                  aria-label={`${pad(hour)}:00`}
                  aria-pressed={selected}
                >
                  <span
                    className={`rounded-full transition-all duration-200 ${
                      selected
                        ? "h-2 w-2 bg-[var(--ink)]"
                        : hasEvents
                          ? "h-1.5 w-1.5 bg-[var(--faint)]"
                          : isNow
                            ? "h-1.5 w-1.5 ring-1 ring-[var(--ink)] bg-white"
                            : "h-1 w-1 bg-[var(--line)] hover:bg-[var(--faint)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div
          id="hour-editor"
          role="region"
          aria-label="小时日程编辑"
          inert={!isDesktop && !open}
          aria-hidden={!isDesktop && !open}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              closePanel();
            }
          }}
          className={`hour-expand absolute inset-0 z-40 flex flex-col bg-white ${
            open ? "is-open" : ""
          } lg:static lg:inset-auto lg:z-auto lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-[var(--line)]`}
          style={{ pointerEvents: isDesktop || open ? "auto" : "none" }}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--line-soft)] px-6 py-5">
            <div>
              <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="display text-2xl font-semibold tracking-tight text-[var(--ink)] tabular-nums">{pad(focusedHour)}:00</span>
                <span className="text-[11px] font-normal text-[var(--faint)] uppercase tracking-wider">{periodOf(focusedHour)}</span>
                <span className="text-xs font-normal tabular-nums text-[var(--faint)]">· {focusedEvents.length} 项</span>
              </p>
              <p className="mt-1 text-pretty text-xs text-[var(--faint)]">{dateKey}</p>
            </div>
            <button
              type="button"
              ref={closeRef}
              aria-label="收起"
              onClick={closePanel}
              className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-black/[0.04] hover:text-[var(--ink)] lg:hidden"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
          <div className="soft-scroll min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="flex flex-col gap-4">
              {deleteError ? <p role="alert" className="rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">{deleteError}</p> : null}
              <HourNoteBoard
                deletingId={deletingId}
                items={focusedEvents}
                selectedId={selectedId ?? undefined}
                onSelect={(item) => setSelectedId((current) => (current === item.id ? null : item.id))}
                onDelete={(id) => { void dropItem(id); }}
              />
              <AddScheduleForm
                dateKey={dateKey}
                hour={focusedHour}
                editing={editing}
                onCreated={onCreated}
                onUpdated={onUpdated}
                onDeleted={(id) => {
                  setSelectedId((current) => current === id ? null : current);
                  onDeleted(id);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

HourWheel.displayName = "HourWheel";