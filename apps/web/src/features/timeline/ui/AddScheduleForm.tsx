import { useEffect, useRef, useState, type FormEvent } from "react";
import type { TimelineDraft, TimelineItem } from "@atlas/shared";
import { createTimeline, removeTimeline, updateTimeline } from "../api";

type Props = {
  dateKey: string;
  hour: number;
  editing?: TimelineItem | null;
  onCreated: (item: TimelineItem) => void;
  onUpdated: (item: TimelineItem) => void;
  onDeleted: (id: string) => void;
};

const pad = (n: number) => String(n).padStart(2, "0");

const toStartAt = (dateKey: string, hour: number, minute: number) => {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setHours(hour, minute, 0, 0);
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
  onChange,
}: {
  label: string;
  hour: number;
  minute: number;
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
    const current = parseMinute(draft) ?? minute;
    const next = clampMinute(current + delta);
    onChange(next);
    setDraft(pad(next));
  };

  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-[var(--muted)]">{label}</span>
      <div className="flex h-10 items-center rounded-xl border border-[var(--line)] bg-white px-3 text-sm leading-none text-[var(--ink)] tabular-nums">
        <span className="inline-flex h-6 w-6 items-center justify-center">{pad(hour)}</span>
        <span className="w-2 text-center text-[var(--faint)]">:</span>
        <button
          type="button"
          aria-label={`${label}减一分钟`}
          onClick={() => applyDelta(-1)}
          className="flex h-6 w-6 items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
        >
          −
        </button>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
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
          className="h-6 w-6 border-0 bg-transparent p-0 text-center outline-none"
        />
        <button
          type="button"
          aria-label={`${label}加一分钟`}
          onClick={() => applyDelta(1)}
          className="flex h-6 w-6 items-center justify-center text-[var(--muted)] hover:text-[var(--ink)]"
        >
          +
        </button>
      </div>
    </label>
  );
};

export const AddScheduleForm = ({ dateKey, hour, editing, onCreated, onUpdated, onDeleted }: Props) => {
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
      if (editing) onUpdated(await updateTimeline(editing.id, draft));
      else {
        onCreated(await createTimeline(draft));
        setTitle("");
        setStartMin(0);
        setEndMin(30);
      }
    } catch {
      setError(editing ? "保存失败，请确认接口已启动" : "添加失败，请确认接口已启动");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await removeTimeline(editing.id);
      onDeleted(editing.id);
    } catch {
      setError("删除失败，请确认接口已启动");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/90 p-3">
      <p className="mb-2 text-[12px] font-medium text-[var(--ink)]">{editing ? "编辑日程" : "添加日程"}</p>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="事件名称"
        className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none placeholder:text-[var(--faint)] focus:border-[var(--accent)]"
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <MinuteField label="开始" hour={hour} minute={startMin} onChange={changeStart} />
        <MinuteField label="结束" hour={hour} minute={endMin} onChange={setEndMin} />
      </div>
      {error ? <p className="mt-2 text-[11px] text-[#9b4a4a]">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-3 w-full rounded-xl bg-[var(--accent)] py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (editing ? "保存中…" : "添加中…") : editing ? "保存" : "添加"}
      </button>
      {editing ? (
        <button
          type="button"
          disabled={saving}
          onClick={remove}
          className="mt-2 w-full rounded-xl py-1.5 text-[12px] text-[var(--muted)] hover:text-[#9b4a4a] disabled:opacity-50"
        >
          删除这条日程
        </button>
      ) : null}
    </form>
  );
};