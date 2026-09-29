import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { IconButton, IconNext, IconPrev, IconToday } from "../../../shared/ui/Icons";
import { Figures } from "../../../shared/ui/Figures";
import { RangeSwitch, type TimeRange } from "../../../shared/ui/RangeSwitch";
import { useTimelineItems } from "../useTimelineItems";
import {
  itemsOn,
  monthGrid,
  parseDateKey,
  shiftDateKey,
  shiftMonth,
  startOfWeek,
  todayKeyOf,
  weekOf,
  weekSpanLabel,
  weekdayOf,
} from "../model";
import { HourWheel } from "./HourWheel";
import { MonthBoard } from "./MonthBoard";
import { WeekBoard } from "./WeekBoard";
import { WeekStrip } from "./WeekStrip";

const STEP_LABELS: Record<TimeRange, readonly [string, string]> = {
  day: ["前一天", "后一天"],
  week: ["上一周", "下一周"],
  month: ["上个月", "下个月"],
};

export const TimelinePage = () => {
  const { items, loading, error, retry, upsert, remove } = useTimelineItems();
  const [todayKey, setTodayKey] = useState(todayKeyOf);
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [range, setRange] = useState<TimeRange>("day");
  const [now, setNow] = useState(() => new Date());
  // -1 / 1 drives the direction the day view slides in from; 0 = no directional motion.
  const [direction, setDirection] = useState(0);

  const selectDate = (next: string) => {
    if (next === selectedDate) return;
    setDirection(next > selectedDate ? 1 : -1);
    setSelectedDate(next);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date();
      setNow(next);
      setTodayKey(todayKeyOf(next));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const date = parseDateKey(selectedDate);
  const weekKey = startOfWeek(selectedDate);
  const week = useMemo(() => weekOf(selectedDate, items, todayKey), [selectedDate, items, todayKey]);
  const cells = useMemo(() => monthGrid(selectedDate, items, todayKey), [selectedDate, items, todayKey]);
  const dayItems = useMemo(() => itemsOn(items, selectedDate), [items, selectedDate]);
  const isToday = selectedDate === todayKey;
  const weekCount = week.reduce((sum, day) => sum + day.count, 0);
  const monthCount = cells.filter((cell) => cell.inMonth).reduce((sum, cell) => sum + cell.count, 0);

  const move = (step: number) => {
    if (range === "week") selectDate(shiftDateKey(selectedDate, step * 7));
    else if (range === "month") selectDate(shiftMonth(selectedDate, step));
    else selectDate(shiftDateKey(selectedDate, step));
  };

  const openDay = (next: string) => {
    selectDate(next);
    setRange("day");
  };

  const [prevLabel, nextLabel] = STEP_LABELS[range];

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-5">
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-4 pb-1">
        {/* Hard height (not min-height): the tallest title (day view) fits, so neither the controls nor the content below move between views. */}
        <div key={range} className="label-in flex h-16 items-end">
          {range === "month" ? (
            <div className="flex items-baseline gap-2.5">
              <h1 className="flex items-baseline gap-1 leading-none text-[var(--ink)]">
                <span className="numeral text-[2.75rem] sm:text-[3rem] font-semibold leading-[0.85]">{date.getMonth() + 1}</span>
                <span className="text-base font-medium">月</span>
              </h1>
              <p className="numeral text-sm text-[var(--faint)]">{date.getFullYear()}</p>
            </div>
          ) : range === "week" ? (
            <div>
              <h1 className="flex items-baseline text-[var(--ink)] text-balance">
                <Figures
                  text={weekSpanLabel(selectedDate)}
                  figureClassName="text-[1.75rem] sm:text-[2rem] font-semibold leading-none"
                  textClassName="px-0.5 text-sm font-medium"
                />
              </h1>
              <p className="mt-1 text-xs font-normal text-[var(--faint)] tabular-nums">{weekCount} 项日程</p>
            </div>
          ) : (
            <div className="flex items-baseline gap-3">
              <span className="numeral text-[3.5rem] sm:text-[4rem] font-semibold leading-[0.8] text-[var(--ink)]">
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
          {/* Selecting today remounts the wheel, which aligns itself to the current hour. */}
          <IconButton label="回到今天" disabled={isToday} onClick={() => selectDate(todayKey)}>
            <IconToday />
          </IconButton>
          <RangeSwitch value={range} onChange={setRange} />
          <div className="flex items-center">
            <IconButton label={prevLabel} onClick={() => move(-1)}>
              <IconPrev />
            </IconButton>
            <IconButton label={nextLabel} onClick={() => move(1)}>
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
          {/* Anchored to the calendar week: within a week only the pill moves; crossing weeks slides the strip. */}
          <div
            key={weekKey}
            className="day-slide shrink-0"
            style={{ "--dir": direction } as CSSProperties}
          >
            <WeekStrip days={week} selected={selectedDate} onSelect={selectDate} />
          </div>
          <div
            key={selectedDate}
            className="day-slide flex min-h-0 flex-1 flex-col"
            style={{ "--dir": direction } as CSSProperties}
          >
            <HourWheel
              items={dayItems}
              isToday={isToday}
              now={now}
              dateKey={selectedDate}
              onCreated={upsert}
              onUpdated={upsert}
              onDeleted={remove}
            />
          </div>
        </div>
      ) : null}

      {range === "week" && (!loading || items.length > 0) && (!error || items.length > 0) ? (
        <div key="week" className="rise min-h-0 flex-1 overflow-y-auto pt-2 soft-scroll">
          <WeekBoard
            days={week}
            items={items}
            selected={selectedDate}
            onSelect={selectDate}
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
            onSelect={selectDate}
            onOpenDay={openDay}
          />
        </div>
      ) : null}
    </main>
  );
};