import { useEffect, useMemo, useRef, useState } from "react";
import { IconButton, IconNext, IconPrev, IconToday } from "../../../shared/ui/Icons";
import { RangeSwitch, type TimeRange } from "../../../shared/ui/RangeSwitch";
import { useTimelineItems } from "../useTimelineItems";
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
  const { items, loading, error, retry, upsert, remove } = useTimelineItems();
  const [todayKey, setTodayKey] = useState(todayKeyOf);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [range, setRange] = useState<TimeRange>("day");
  const [now, setNow] = useState(() => new Date());
  const wheelRef = useRef<HourWheelHandle>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date();
      setNow(next);
      setTodayKey(todayKeyOf(next));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = parseDateKey(selectedDate);
  const aroundToday = useMemo(() => daysAround(selectedDate, items, todayKey, 3), [selectedDate, todayKey, items]);
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
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 pb-1">
        <div>
          {range === "month" ? (
            <div className="flex items-baseline gap-2.5">
              <h1 className="display text-[2rem] leading-none sm:text-[2.25rem] font-semibold tracking-tight text-[var(--ink)]">
                {date.getMonth() + 1}月
              </h1>
              <p className="text-xs font-normal text-[var(--faint)] tabular-nums">{date.getFullYear()}</p>
            </div>
          ) : range === "week" ? (
            <div>
              <h1 className="display text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)] text-balance">
                {weekSpanLabel(selectedDate)}
              </h1>
              <p className="mt-1 text-xs font-normal text-[var(--faint)] tabular-nums">{weekCount} 项日程</p>
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="display text-[3rem] sm:text-[3.5rem] font-semibold leading-[0.9] tracking-tighter text-[var(--ink)] tabular-nums">
                {String(date.getDate()).padStart(2, "0")}
              </span>
              <div className="pb-1">
                <p className="text-[11px] font-normal text-[var(--faint)] tabular-nums">
                  {date.getFullYear()}年{date.getMonth() + 1}月
                </p>
                <p className="mt-0.5 text-xs font-normal text-[var(--muted)]">
                  {isToday ? "今天" : weekdayOf(selectedDate)}
                  <span className="mx-1.5 text-[var(--faint)]">·</span>
                  <span className="tabular-nums">{dayItems.length} 项</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
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
          <div className="flex items-center">
            <IconButton label="上一段" onClick={() => move(-1)}>
              <IconPrev />
            </IconButton>
            <IconButton label="下一段" onClick={() => move(1)}>
              <IconNext />
            </IconButton>
          </div>
        </div>
      </header>

      {loading ? <p role="status" className="text-sm text-[var(--muted)]">正在加载日程…</p> : null}
      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          <span>{error}</span>
          <button type="button" onClick={retry} disabled={loading} className="rounded-lg px-3 py-2 font-medium underline underline-offset-4 disabled:opacity-50">重新加载</button>
        </div>
      ) : null}

      {range === "day" && (!loading || items.length > 0) && (!error || items.length > 0) ? (
        <div key="day" className="rise flex min-h-0 flex-1 flex-col gap-5">
          <div className="shrink-0">
            <WeekStrip days={aroundToday} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
          <HourWheel
            key={selectedDate}
            ref={wheelRef}
            items={dayItems}
            isToday={isToday}
            now={now}
            dateKey={selectedDate}
            onCreated={upsert}
            onUpdated={upsert}
            onDeleted={remove}
          />
        </div>
      ) : null}

      {range === "week" && (!loading || items.length > 0) && (!error || items.length > 0) ? (
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

      {range === "month" && (!loading || items.length > 0) && (!error || items.length > 0) ? (
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