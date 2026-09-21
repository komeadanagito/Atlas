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
import { IconBackToNow, IconButton, IconNext, IconNow } from "../../../shared/ui/Icons";
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
      if (Math.abs(dist) < 0.5) {
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
    [stopAnimation],
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
    if (!stateRef.current.hasMoved || Math.abs(velocity) < 0.15) {
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
    return () => el.removeEventListener("wheel", onWheel);
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

  useEffect(() => {
    if (!open) setSelectedId(null);
  }, [open]);

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
        scale: Math.max(0.84, 1.02 - absNorm * 0.18),
        rotateX: Math.max(-28, Math.min(28, -norm * 24)),
        translateZ: Math.max(-28, (Math.cos(Math.min(Math.PI / 2, absNorm * 1.35)) - 1) * 32),
        opacity: Math.max(0.28, 1 - Math.min(1, absNorm) ** 1.45 * 0.62),
        isNowHour: isToday && hour === currentHour,
        isFocused: Math.abs(distFromCenter) < ITEM_HEIGHT / 2,
        events: schedulesByHour.get(hour) ?? [],
      });
    }
    return slots;
  }, [containerHeight, currentHour, currentVirtualIndex, isToday, offsetY, schedulesByHour]);

  const editing = focusedEvents.find((entry) => entry.id === selectedId) ?? null;

  const dropItem = async (id: string) => {
    await removeTimeline(id);
    if (selectedId === id) setSelectedId(null);
    onDeleted(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isToday ? (
        <div className="mb-3 flex shrink-0 items-center justify-end px-1">
          {alignedToNow ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]" title="现在">
              <IconNow />
            </span>
          ) : (
            <IconButton label="回到现在" onClick={scrollToNow}>
              <IconBackToNow />
            </IconButton>
          )}
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
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
            className="pointer-events-none absolute right-6 left-1 z-0 rounded-2xl border-y border-[var(--accent)]/20 bg-[var(--accent-soft)]"
            style={{ top: "50%", height: ITEM_HEIGHT, transform: "translateY(-50%)" }}
          >
            <div className="absolute top-1/2 left-[5.35rem] h-5 w-1 -translate-y-1/2 rounded-full bg-[var(--accent)]" />
          </div>

          {visibleItems.map((item) => (
            <div
              key={item.virtualIndex}
              className={`absolute right-8 left-0 flex px-3 will-change-transform ${
                item.isFocused ? "items-center py-2" : "items-center"
              }`}
              style={{
                minHeight: ITEM_HEIGHT,
                height: ITEM_HEIGHT,
                transform: item.isFocused
                  ? `translateY(${item.posY}px)`
                  : `translateY(${item.posY}px) translateZ(${item.translateZ}px) rotateX(${item.rotateX}deg) scale(${item.scale})`,
                transformOrigin: item.isFocused ? "50% 0%" : "50% 50%",
                opacity: item.opacity,
                zIndex: item.isFocused ? 30 : 10,
                transition: stateRef.current.isDragging ? "none" : "opacity 0.2s var(--ease)",
              }}
              onClick={() => {
                if (!item.isFocused) smoothScrollToIndex(item.virtualIndex);
              }}
            >
              <div className={`flex h-14 w-[4.6rem] shrink-0 flex-col justify-center pl-3 ${item.isFocused ? "text-[var(--ink)]" : "text-[var(--faint)]"}`}>
                <div className="flex items-baseline gap-0.5">
                  <span className="display text-[1.7rem] leading-none">{pad(item.hour)}</span>
                  <span className="text-[11px] text-[var(--muted)]">:00</span>
                </div>
                {item.isNowHour ? (
                  <span className="mt-1 text-[10px] tracking-wide text-[var(--accent)]">现在</span>
                ) : (
                  <span className="mt-1 text-[10px] text-[var(--faint)]">{item.hour < 12 ? "AM" : "PM"}</span>
                )}
              </div>

              <div
                className="min-w-0 flex-1 pl-3"
                onPointerDown={(event) => {
                  if (item.isFocused) event.stopPropagation();
                }}
                onClick={(event) => {
                  if (!item.isFocused) return;
                  event.stopPropagation();
                  setOpen((value) => !value);
                }}
              >
                {item.isFocused ? (
                  <div className="flex h-14 cursor-pointer items-center gap-2 rounded-xl bg-white/90 px-3">
                    {item.events.length === 0 ? (
                      <span className="min-w-0 flex-1 truncate text-xs text-[var(--muted)]">这一小时还没有安排</span>
                    ) : (
                      <HourNoteStrip items={item.events} />
                    )}
                    <IconNext className={`ml-auto h-3.5 w-3.5 shrink-0 text-[var(--muted)] duration-200 ${open ? "-rotate-90" : "rotate-90"}`} />
                  </div>
                ) : item.events.length === 0 ? null : (
                  <HourNoteStrip items={item.events} limit={3} />
                )}
              </div>
            </div>
          ))}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-16 bg-gradient-to-b from-white to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
        </div>

        <div className="flex w-8 shrink-0 flex-col items-center justify-between border-l border-[var(--line)] py-6">
          {Array.from({ length: 24 }, (_, hour) => {
            const hasEvents = (schedulesByHour.get(hour)?.length ?? 0) > 0;
            const selected = hour === focusedHour;
            const isNow = isToday && hour === currentHour;
            return (
              <button
                key={hour}
                onClick={() => scrollToHour(hour)}
                className="flex w-full items-center justify-center py-0.5"
                aria-label={`${pad(hour)}:00`}
              >
                <span
                  className={`rounded-full duration-200 ${
                    selected
                      ? "h-2 w-2 bg-[var(--accent)]"
                      : hasEvents
                        ? "h-1.5 w-1.5 bg-[var(--accent)]/50"
                        : isNow
                          ? "h-1.5 w-1.5 ring-1 ring-[var(--accent)]"
                          : "h-1 w-1 bg-[var(--line)]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div
          className={`hour-expand absolute inset-0 z-40 flex flex-col bg-[var(--accent-soft)] ${open ? "is-open" : ""}`}
          style={{ pointerEvents: open ? "auto" : "none" }}
        >
          <div className="flex shrink-0 items-center justify-between px-5 py-3">
            <p className="flex items-baseline gap-2">
              <span className="display text-lg tracking-tight">{pad(focusedHour)}:00</span>
              <span className="text-[var(--muted)]">{periodOf(focusedHour)}</span>
            </p>
            <button
              type="button"
              aria-label="收起"
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-white/70 hover:text-[var(--ink)]"
            >
              <IconNext className="h-4 w-4 -rotate-90" />
            </button>
          </div>
          <div className="soft-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-3">
              <HourNoteBoard
                items={focusedEvents}
                selectedId={selectedId ?? undefined}
                onSelect={(item) => setSelectedId((current) => (current === item.id ? null : item.id))}
                onDelete={(id) => {
                  dropItem(id).catch(() => undefined);
                }}
              />
              <AddScheduleForm
                dateKey={dateKey}
                hour={focusedHour}
                editing={editing}
                onCreated={onCreated}
                onUpdated={onUpdated}
                onDeleted={(id) => {
                  setSelectedId(null);
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