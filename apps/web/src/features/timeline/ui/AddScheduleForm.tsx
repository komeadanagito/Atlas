import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TimelineDraft, TimelineItem } from "@atlas/shared";
import { createTimeline, removeTimeline, updateTimeline } from "../api";
import { IconClose, IconMinus, IconPlus } from "../../../shared/ui/Icons";

type Props = {
  dateKey: string;
  hour: number;
  editing?: TimelineItem | null;
  onCreated: (item: TimelineItem) => void;
  onUpdated: (item: TimelineItem) => void;
  onDeleted: (id: string) => void;
  onCancelEdit?: () => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

const STEP_BUTTON =
  "flex size-6 items-center justify-center rounded-md text-[var(--muted)] transition-[background-color,color,transform] hover:bg-black/[0.05] hover:text-[var(--ink)] active:scale-90 disabled:opacity-40";

const toStartAt = (dateKey: string, hour: number, minute: number) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  return date.toISOString();
};

const clampMinute = (value: number) => Math.min(59, Math.max(0, value));

const parseMinute = (raw: string) => {
  const next = Number.parseInt(raw, 10);
  return Number.isNaN(next) ? null : clampMinute(next);
};

const MinuteField = ({
  label,
  hour,
  minute,
  disabled,
  onChange,
}: {
  label: string;
  hour: number;
  minute: number;
  disabled?: boolean;
  onChange: (minute: number) => void;
}) => {
  const focused = useRef(false);
  const [draft, setDraft] = useState(pad(minute));

  useEffect(() => {
    if (!focused.current) setDraft(pad(minute));
  }, [minute]);

  const commit = (raw: string) => {
    const next = parseMinute(raw);
    if (next === null) {
      setDraft(pad(minute));
      return;
    }
    onChange(next);
    setDraft(pad(next));
  };

  const applyDelta = (delta: number) => {
    if (disabled) return;
    const current = parseMinute(draft) ?? minute;
    const next = clampMinute(current + delta);
    onChange(next);
    setDraft(pad(next));
  };

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
      <div className="flex h-11 items-center justify-between rounded-xl bg-black/[0.025] px-2.5 text-sm tabular-nums ring-1 ring-[var(--line)] transition-[background-color,box-shadow] duration-200 hover:bg-white focus-within:bg-white focus-within:ring-[var(--ink)]/40">
        <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md bg-white text-xs font-semibold text-[var(--ink)] ring-1 ring-[var(--line)]">
          {pad(hour)}
        </span>
        <span className="mx-1 text-xs font-semibold text-[var(--faint)]">:</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            aria-label={`${label}减一分钟`}
            onClick={() => applyDelta(-1)}
            className={STEP_BUTTON}
          >
            <IconMinus className="h-3.5 w-3.5" />
          </button>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            disabled={disabled}
            value={draft}
            aria-label={`${label}分钟`}
            onFocus={(event) => {
              focused.current = true;
              event.target.select();
            }}
            onBlur={() => {
              focused.current = false;
              commit(draft);
            }}
            onChange={(event) => {
              const next = event.target.value.replace(/\D/g, "").slice(0, 2);
              setDraft(next);
              if (next.length === 2) {
                const parsed = parseMinute(next);
                if (parsed !== null) {
                  onChange(parsed);
                  setDraft(pad(parsed));
                }
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit(draft);
                event.currentTarget.blur();
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                applyDelta(1);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                applyDelta(-1);
              }
            }}
            className="h-6 w-7 border-0 bg-transparent p-0 text-center text-sm font-semibold tabular-nums text-[var(--ink)] outline-none select-all"
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={`${label}加一分钟`}
            onClick={() => applyDelta(1)}
            className={STEP_BUTTON}
          >
            <IconPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </label>
  );
};

export const AddScheduleForm = ({ dateKey, hour, editing, onCreated, onUpdated, onDeleted, onCancelEdit }: Props) => {
  const [title, setTitle] = useState("");
  const [startMin, setStartMin] = useState(0);
  const [endMin, setEndMin] = useState(30);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      const start = new Date(editing.startAt).getMinutes();
      setTitle(editing.title);
      setStartMin(start);
      setEndMin(Math.min(59, start + editing.durationMin));
    } else {
      setTitle("");
      setStartMin(0);
      setEndMin(30);
    }
    setError("");
  }, [dateKey, hour, editing]);

  const changeStart = (minute: number) => {
    setStartMin(minute);
    if (endMin <= minute) setEndMin(Math.min(59, minute + 1));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("请填写事件名称");
      return;
    }
    if (endMin <= startMin) {
      setError("结束时间需晚于开始时间");
      return;
    }
    setSaving(true);
    setError("");
    const draft: TimelineDraft = {
      title: nextTitle,
      startAt: toStartAt(dateKey, hour, startMin),
      durationMin: endMin - startMin,
      tag: editing?.tag ?? "plan",
      note: editing?.note,
    };
    try {
      if (editing) {
        const item = await updateTimeline(editing.id, draft);
        onUpdated(item);
      } else {
        const item = await createTimeline(draft);
        onCreated(item);
        setTitle("");
        setStartMin(0);
        setEndMin(30);
      }
    } catch (reason) {
      const fallback = editing ? "保存失败，请确认接口已启动" : "添加失败，请确认接口已启动";
      setError(reason instanceof Error && reason.message ? reason.message : fallback);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing || saving) return;
    setSaving(true);
    setError("");
    try {
      await removeTimeline(editing.id);
      onDeleted(editing.id);
    } catch (reason) {
      setError(reason instanceof Error && reason.message ? reason.message : "删除失败，请确认接口已启动");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl bg-white p-4 ring-1 transition-shadow duration-300 sm:p-5 ${
        editing ? "ring-[var(--ink)]/30" : "ring-[var(--line)]"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 key={editing ? "edit" : "add"} className="swap-in text-sm font-semibold text-balance text-[var(--ink)]">
          {editing ? "编辑日程" : "添加日程"}
        </h3>
        {editing && onCancelEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={onCancelEdit}
            aria-label="取消编辑"
            title="取消编辑"
            className="swap-in flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] transition-[background-color,color,transform] hover:bg-black/[0.04] hover:text-[var(--ink)] active:scale-90 disabled:opacity-50"
          >
            <IconClose className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="space-y-3.5">
        <div>
          <label htmlFor="schedule-title-input" className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
            事件名称
          </label>
          <input
            id="schedule-title-input"
            value={title}
            disabled={saving}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="例如：晨跑、周会、阅读"
            aria-label="事件名称"
            className="w-full rounded-xl bg-black/[0.025] px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none ring-1 ring-[var(--line)] transition-[background-color,box-shadow] duration-200 placeholder:text-[var(--faint)] hover:bg-white focus:bg-white focus:ring-[var(--ink)]/40 disabled:opacity-60"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MinuteField label="开始时间" hour={hour} minute={startMin} disabled={saving} onChange={changeStart} />
          <MinuteField label="结束时间" hour={hour} minute={endMin} disabled={saving} onChange={setEndMin} />
        </div>
      </div>
      {error ? (
        <p role="alert" className="swap-in mt-3.5 rounded-xl bg-[var(--danger-soft)] px-3 py-2 text-xs font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-4 w-full rounded-xl bg-[var(--ink)] py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-black active:scale-[0.99] disabled:opacity-50"
      >
        <span key={`${!!editing}-${saving}`} className="label-in inline-block">
          {saving ? (editing ? "保存中…" : "添加中…") : editing ? "保存修改" : "添加这条日程"}
        </span>
      </button>
      {editing ? (
        <button
          type="button"
          disabled={saving}
          onClick={remove}
          className="swap-in mt-2 w-full rounded-xl py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
        >
          删除这条日程
        </button>
      ) : null}
    </form>
  );
};
