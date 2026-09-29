import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { IconFitness, IconPrev } from "../../shared/ui/Icons";
import { filterMovementItems, MOVEMENT_METHODS, MOVEMENT_TYPES, type MovementItem, type MovementTypeId } from "./movementCategories";
import catalogData from "./movementCatalog.json";
import { MovementIcon } from "./MovementIcons";

const CATALOG = catalogData as MovementItem[];

gsap.registerPlugin(useGSAP);

type Props = {
  onBack: () => void;
};

// Smooth deceleration without any overshoot, so nothing "bounces".
const SLIDE_EASE = "power4.out";
const SLIDE_DURATION = 0.55;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * One persistent indicator per group that slides (x/y/width/height) to the selected button.
 * The indicator never unmounts, so the motion is a continuous glide instead of a re-render jump.
 */
const useSlidingIndicator = (
  groupRef: RefObject<HTMLElement | null>,
  indicatorRef: RefObject<HTMLElement | null>,
  selectedKey: string,
  layoutKey: string,
) => {
  const placed = useRef(false);

  useLayoutEffect(() => {
    const group = groupRef.current;
    const indicator = indicatorRef.current;
    if (!group || !indicator) return;

    const place = (animate: boolean) => {
      const target = group.querySelector<HTMLElement>(`[data-key="${CSS.escape(selectedKey)}"]`);
      if (!target) return;
      const box = { x: target.offsetLeft, y: target.offsetTop, width: target.offsetWidth, height: target.offsetHeight };
      if (animate && placed.current && !prefersReducedMotion()) {
        gsap.to(indicator, { ...box, duration: SLIDE_DURATION, ease: SLIDE_EASE, overwrite: true });
      } else {
        gsap.set(indicator, { ...box, opacity: 1 });
      }
      placed.current = true;
    };

    place(true);

    // Keep it aligned when fonts load or the viewport resizes; skip the observer's initial fire.
    if (typeof ResizeObserver === "undefined") return;
    let first = true;
    const observer = new ResizeObserver(() => {
      if (first) {
        first = false;
        return;
      }
      gsap.killTweensOf(indicator);
      place(false);
    });
    observer.observe(group);
    return () => observer.disconnect();
  }, [groupRef, indicatorRef, selectedKey, layoutKey]);
};

type RollProps = { text: string; className?: string; animate: boolean; delay?: number };

/**
 * Label inside a clipped line. When it mounts after user interaction, the text rolls up from
 * below the line instead of fading, so swapped content never blinks.
 */
const Roll = ({ text, className = "", animate, delay = 0 }: RollProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (!animate || !ref.current || prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      ref.current,
      { yPercent: 110 },
      { yPercent: 0, duration: 0.6, ease: SLIDE_EASE, delay, clearProps: "transform" },
    );
    return () => {
      tween.kill();
    };
    // Mount-only: each new label animates exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span className={`inline-flex overflow-hidden align-bottom ${className}`}>
      <span ref={ref} className="block whitespace-nowrap">
        {text}
      </span>
    </span>
  );
};

type CardProps = { item: MovementItem; open: boolean; onToggle: () => void };

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex gap-2">
    <dt className="w-8 shrink-0 text-zinc-400">{label}</dt>
    <dd className="min-w-0 text-zinc-600">{children}</dd>
  </div>
);

// Small tile: icon, name, one-line summary. Clicking expands the rest in place.
const MovementCard = ({ item, open, onToggle }: CardProps) => {
  const detailId = `movement-detail-${item.id}`;
  const cardRef = useRef<HTMLLIElement>(null);
  // After expanding, bring the whole card into view so the details are not cut off at the bottom.
  useEffect(() => {
    if (!open) return;
    const reduced = prefersReducedMotion();
    const timer = window.setTimeout(
      () => cardRef.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" }),
      reduced ? 0 : 320,
    );
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <li
      ref={cardRef}
      className={`rounded-xl bg-white ring-1 ring-inset transition-[box-shadow,background-color] duration-300 ${
        open ? "ring-[var(--kit-color)]/25 shadow-[var(--shadow-sm)]" : "ring-[var(--line)] hover:bg-zinc-50/60"
      }`}
    >
      {/* The button's ::after covers the whole header, so the tile is one click target. */}
      <div className="relative flex items-start gap-2.5 p-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--kit-soft)] text-[var(--kit-color)]">
          <MovementIcon id={item.id} className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold leading-5 text-[var(--ink)]">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailId}
              onClick={onToggle}
              className="rounded-sm text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-[var(--kit-color)]"
            >
              {item.name}
            </button>
          </h3>
          <p className={`text-[12px] leading-[18px] text-zinc-500 ${open ? "" : "truncate"}`}>{item.summary}</p>
        </div>
      </div>
      <div
        id={detailId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <dl className="mx-2.5 mb-2.5 space-y-1 border-t border-[var(--line-soft)] pt-2 text-[12px] leading-[18px]">
            <DetailRow label="肌群">{item.muscles.join("、")}</DetailRow>
            <DetailRow label="适合">{item.suitableFor.join("、")}</DetailRow>
            <DetailRow label="强度">
              {item.intensity} · {item.impact}冲击
            </DetailRow>
            <DetailRow label="要点">{item.tips}</DetailRow>
          </dl>
        </div>
      </div>
    </li>
  );
};

export const MovementBrowser = ({ onBack }: Props) => {
  const [type, setType] = useState<MovementTypeId>("all");
  const [method, setMethod] = useState("all");
  const methods = MOVEMENT_METHODS[type];
  const typeLabel = MOVEMENT_TYPES.find((item) => item.id === type)?.label ?? "";
  const methodLabel = methods.find((item) => item.id === method)?.label ?? "";
  const visibleItems = filterMovementItems(CATALOG, type, method);
  const catalogRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // A new filter shows a new list; start it from the top, collapsed, instead of keeping old state.
  useEffect(() => {
    if (catalogRef.current) catalogRef.current.scrollTop = 0;
    setOpenId(null);
  }, [type, method]);

  const rootRef = useRef<HTMLElement>(null);
  const typeGroupRef = useRef<HTMLDivElement>(null);
  const typeIndicatorRef = useRef<HTMLSpanElement>(null);
  const methodGroupRef = useRef<HTMLDivElement>(null);
  const methodIndicatorRef = useRef<HTMLSpanElement>(null);
  // Labels only roll after the user has changed a filter; the first paint uses the block entrance.
  const [interacted, setInteracted] = useState(false);

  useSlidingIndicator(typeGroupRef, typeIndicatorRef, type, "");
  useSlidingIndicator(methodGroupRef, methodIndicatorRef, method, type);

  const selectType = (nextType: MovementTypeId, target: HTMLElement) => {
    if (nextType === type) return;
    setInteracted(true);
    setType(nextType);
    setMethod("all");
    // On narrow screens the type row scrolls horizontally; bring the chosen tab into view.
    target.scrollIntoView?.({ behavior: prefersReducedMotion() ? "auto" : "smooth", inline: "nearest", block: "nearest" });
  };

  // Entrance: blocks settle in once.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from("[data-anim='block']", {
        opacity: 0,
        y: 8,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.06,
        clearProps: "opacity,transform",
      });
    },
    { scope: rootRef },
  );

  return (
    <main
      ref={rootRef}
      data-kit="fitness"
      aria-labelledby="movement-title"
      className="-m-1 flex h-[calc(100%+0.5rem)] min-h-0 max-w-[calc(64rem+0.5rem)] flex-col overflow-hidden p-1"
    >
      {/* One compact row: breadcrumb-style back link + title on the left, module mark on the right. */}
      <div data-anim="block" className="flex h-10 shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回百宝箱"
            className="-ml-2 inline-flex h-8 items-center gap-0.5 rounded-lg pl-1.5 pr-2 text-[13px] text-zinc-500 transition-colors duration-200 hover:bg-white hover:text-[var(--ink)] focus-visible:outline-offset-2"
          >
            <IconPrev className="h-3.5 w-3.5" />
            百宝箱
          </button>
          <span aria-hidden="true" className="text-zinc-300">/</span>
          <h1 id="movement-title" className="truncate text-lg font-semibold tracking-[-0.01em] text-[var(--ink)]">
            运动
          </h1>
        </div>
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--kit-soft)] text-[var(--kit-color)] ring-1 ring-inset ring-[var(--kit-color)]/15"
        >
          <IconFitness className="h-4 w-4" />
        </span>
      </div>

      <section data-anim="block" aria-label="训练类型筛选" className="mt-3 shrink-0 sm:mt-4">
        <h2 className="sr-only">训练类型</h2>
        <div className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
          <div
            ref={typeGroupRef}
            role="group"
            aria-label="训练类型"
            className="relative flex min-w-max gap-0.5 rounded-[14px] bg-zinc-200/50 p-1 sm:grid sm:min-w-0 sm:grid-cols-5"
          >
            <span
              ref={typeIndicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-[10px] bg-white opacity-0 shadow-[0_1px_2px_rgba(17,19,24,0.06),0_2px_8px_-2px_rgba(17,19,24,0.08)] will-change-transform"
            />
            {MOVEMENT_TYPES.map((item) => {
              const selected = item.id === type;
              return (
                <button
                  key={item.id}
                  data-key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={(event) => selectType(item.id, event.currentTarget)}
                  className={`relative flex h-10 items-center justify-center rounded-[10px] px-4 text-[13px] font-medium transition-colors duration-500 ease-out sm:px-2 lg:px-4 ${
                    selected ? "text-[var(--ink)]" : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  <span className="relative whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-4 grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 sm:mt-5 sm:grid-cols-[176px_minmax(0,1fr)] sm:grid-rows-1 sm:gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
        <aside
          data-anim="block"
          aria-label="器械与动作方式筛选"
          className="min-h-0 min-w-0 sm:-mx-1 sm:overflow-x-hidden sm:overflow-y-auto sm:px-1 sm:py-px sm:soft-scroll"
        >
          <h2 className="mb-2 px-3 text-[11px] font-medium tracking-[0.08em] text-zinc-400 max-sm:sr-only">
            器械与动作方式
          </h2>
          <div className="-mx-4 overflow-x-auto px-4 py-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
            <div
              ref={methodGroupRef}
              data-anim="methods"
              role="group"
              aria-label="器械与动作方式"
              className="relative flex min-w-max gap-1 sm:min-w-0 sm:flex-col sm:gap-0.5"
            >
              <span
                ref={methodIndicatorRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 rounded-[10px] bg-[var(--kit-soft)] opacity-0 ring-1 ring-inset ring-[var(--kit-color)]/10 will-change-transform"
              >
                <span className="absolute inset-y-2.5 left-0 w-[3px] rounded-full bg-[var(--kit-color)] max-sm:hidden" />
              </span>
              {methods.map((item, index) => {
                const selected = item.id === method;
                return (
                  <button
                    key={`${type}-${item.id}`}
                    data-key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      if (item.id === method) return;
                      setInteracted(true);
                      setMethod(item.id);
                    }}
                    className={`relative flex h-10 shrink-0 items-center rounded-[10px] px-3 text-left text-[13px] transition-colors duration-500 ease-out max-sm:ring-1 max-sm:ring-inset max-sm:ring-[var(--line)] ${
                      selected ? "text-[var(--kit-color)]" : "text-zinc-600 hover:text-[var(--ink)]"
                    }`}
                  >
                    <Roll text={item.label} className="relative" animate={interacted} delay={index * 0.035} />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div
          data-anim="block"
          ref={catalogRef}
          role="region"
          aria-label="运动目录内容"
          className="flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto rounded-[20px] bg-white shadow-[var(--shadow-sm)] ring-1 ring-[var(--line)] soft-scroll"
        >
          <div className="sticky top-0 z-10 flex h-12 shrink-0 items-center border-b border-[var(--line-soft)] bg-white/90 px-5 backdrop-blur">
            <p data-anim="crumb" aria-live="polite" className="flex min-w-0 items-center gap-2 text-[13px] leading-5">
              <Roll key={`t-${type}`} text={typeLabel} className="text-zinc-500" animate={interacted} />
              <span aria-hidden="true" className="text-zinc-300">/</span>
              <Roll
                key={`m-${type}-${method}`}
                text={methodLabel}
                className="font-medium text-[var(--ink)]"
                animate={interacted}
                delay={0.05}
              />
            </p>
          </div>
          {visibleItems.length > 0 ? (
            <ul
              aria-label="运动条目"
              className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] items-start gap-2 p-3 sm:p-4"
            >
              {visibleItems.map((item) => (
                <MovementCard
                  key={item.id}
                  item={item}
                  open={openId === item.id}
                  onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
                />
              ))}
            </ul>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center bg-[radial-gradient(circle,rgba(17,19,24,0.045)_1px,transparent_1px)] [background-size:18px_18px]">
              <p className="rounded-full bg-white px-3 py-1 text-[13px] text-zinc-400">暂无内容</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
