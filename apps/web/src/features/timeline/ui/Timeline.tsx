import { useEffect, useMemo, useRef, useState } from "react";
import type { TimelineItem } from "@atlas/shared";
import { IconButton, IconNext, IconPrev, IconToday } from "../../../shared/ui/Icons";
import { RangeSwitch, type TimeRange } from "../../../shared/ui/RangeSwitch";
import { listTimeline } from "../api";
import {
  daysAround,
  itemsOn,
  monthGrid,
  parseDateKey,
  shiftDateKey,
  shiftMonth,
  todayKeyOf,
  weekOf,
  weekSpanLabel,
  weekdayOf,
} from "../model";
import { HourWheel, type HourWheelHandle } from "./HourWheel";
import { MonthBoard } from "./MonthBoard";
import { WeekBoard } from "./WeekBoard";
import { WeekStrip } from "./WeekStrip";

export const TimelinePage = () => {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [todayKey, setTodayKey] = useState(todayKeyOf);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [range, setRange] = useState<TimeRange>("day");
  const [now, setNow] = useState(() => new Date());
  const wheelRef = useRef<HourWheelHandle>(null);

  useEffect(() => {
    listTimeline()
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date();
      setNow(next);
      setTodayKey(todayKeyOf(next));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = parseDateKey(selectedDate);
  const aroundToday = useMemo(() => daysAround(todayKey, items, todayKey, 3), [todayKey, items]);
  const week = useMemo(() => weekOf(selectedDate, items, todayKey), [selectedDate, items, todayKey]);
  const cells = useMemo(() => monthGrid(selectedDate, items, todayKey), [selectedDate, items, todayKey]);
  const dayItems = useMemo(() => itemsOn(items, selectedDate), [items, selectedDate]);
  const isToday = selectedDate === todayKey;
  const weekCount = week.reduce((sum, day) => sum + day.count, 0);
  const monthCount = cells.filter((cell) => cell.inMonth).reduce((sum, cell) => sum + cell.count, 0);

  const move = (step: number) => {
    if (range === "week") setSelectedDate(shiftDateKey(selectedDate, step * 7));
    else if (range === "month") setSelectedDate(shiftMonth(selectedDate, step));
    else setSelectedDate(shiftDateKey(selectedDate, step));
  };

  const openDay = (next: string) => {
    setSelectedDate(next);
    setRange("day");
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3">
        <div>
          {range === "month" ? (
            <>
              <p className="display text-[1.35rem] leading-none">{date.getMonth() + 1}月</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{date.getFullYear()}</p>
            </>
          ) : range === "week" ? (
            <>
              <p className="display text-[1.2rem] leading-none">{weekSpanLabel(selectedDate)}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{weekCount} 项</p>
            </>
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="display text-[1.5rem] leading-none tracking-tight">
                {String(date.getDate()).padStart(2, "0")}
              </p>
              <div>
                <p className="text-[10px] tracking-[0.14em] text-[var(--muted)]">
                  {date.getFullYear()} / {String(date.getMonth() + 1).padStart(2, "0")}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {isToday ? "今天" : weekdayOf(selectedDate)} · {dayItems.length} 项
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton
            label="回到今天"
            onClick={() => {
              setSelectedDate(todayKey);
              wheelRef.current?.scrollToNow();
            }}
          >
            <IconToday />
          </IconButton>
          <RangeSwitch value={range} onChange={setRange} />
          <IconButton label="上一段" onClick={() => move(-1)}>
            <IconPrev />
          </IconButton>
          <IconButton label="下一段" onClick={() => move(1)}>
            <IconNext />
          </IconButton>
        </div>
      </header>

      {range === "day" ? (
        <div key="day" className="rise flex min-h-0 flex-1 flex-col gap-5">
          <div className="shrink-0">
            <WeekStrip days={aroundToday} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
          <HourWheel key={selectedDate} ref={wheelRef} items={dayItems} isToday={isToday} now={now} />
        </div>
      ) : null}

      {range === "week" ? (
        <div key="week" className="rise min-h-0 flex-1 overflow-y-auto pt-2 soft-scroll">
          <WeekBoard
            days={week}
            items={items}
            selected={selectedDate}
            onSelect={setSelectedDate}
            onOpenDay={openDay}
          />
        </div>
      ) : null}

      {range === "month" ? (
        <div key="month" className="rise min-h-0 flex-1 overflow-y-auto pt-1 soft-scroll">
          <p className="mb-3 text-[12px] text-[var(--muted)]">本月 {monthCount} 项</p>
          <MonthBoard
            cells={cells}
            selected={selectedDate}
            selectedItems={dayItems}
            onSelect={setSelectedDate}
            onOpenDay={openDay}
          />
        </div>
      ) : null}
    </main>
  );
};