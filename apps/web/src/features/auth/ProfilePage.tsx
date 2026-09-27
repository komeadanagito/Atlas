import { useEffect, useMemo, useState } from "react";
import { TAG_META, type TimelineItem } from "@atlas/shared";
import { useAuth } from "./AuthContext";
import { ChangePasswordModal } from "./AuthModal";
import { listTimeline } from "../timeline/api";
import { IconLock, IconShieldCheck, IconUser } from "../../shared/ui/Icons";

const formatJoinedAt = (value: string) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月 ${date.getDate()} 日`;
};

const formatHours = (minutes: number) => {
  if (minutes <= 0) return "0";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
};

export const ProfilePage = () => {
  const { user } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setStatsError(false);
    listTimeline(controller.signal)
      .then((list) => { if (!controller.signal.aborted) setItems(list); })
      .catch(() => { if (!controller.signal.aborted) setStatsError(true); });
    return () => controller.abort();
  }, []);

  const stats = useMemo(() => {
    const plans = items.filter((item) => item.tag === "plan");
    const notes = items.filter((item) => item.tag === "note");
    const minutes = plans.reduce((sum, item) => sum + item.durationMin, 0);
    return { plans: plans.length, notes: notes.length, minutes };
  }, [items]);

  if (!user) return null;
  const initial = user.username.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto soft-scroll">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 pb-8">
        <section className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:gap-5 sm:p-6">
          <div
            aria-hidden
            className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-semibold text-white sm:size-16 sm:text-2xl"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">{user.username}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
              <IconUser className="h-3.5 w-3.5" />
              注册于 {formatJoinedAt(user.createdAt)}
            </p>
          </div>
        </section>

        <section aria-label="时间轴统计" className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center sm:p-5">
            <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{stats.plans}</p>
            <p className="mt-1 text-xs text-slate-500">{TAG_META.plan.label}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center sm:p-5">
            <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{stats.notes}</p>
            <p className="mt-1 text-xs text-slate-500">{TAG_META.note.label}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-center sm:p-5">
            <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{formatHours(stats.minutes)}</p>
            <p className="mt-1 text-xs text-slate-500">累计安排（小时）</p>
          </div>
        </section>
        {statsError ? (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">统计数据加载失败，请稍后重试。</p>
        ) : null}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <IconShieldCheck className="h-4 w-4 text-slate-500" />
            账号安全
          </h2>
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800">登录密码</p>
              <p className="mt-0.5 text-xs text-slate-500">修改后所有设备将退出登录</p>
            </div>
            <button
              type="button"
              onClick={() => setPasswordOpen(true)}
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              <IconLock className="h-3.5 w-3.5" />
              修改密码
            </button>
          </div>
        </section>
      </div>
      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
};
