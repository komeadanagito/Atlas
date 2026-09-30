import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";
import { IconFitness, IconGrid, IconLayers, IconList, IconPrev } from "../../shared/ui/Icons";
import {
  BODY_PARTS,
  browseCatalog,
  methodsForPart,
  type BodyPartId,
  type MovementItem,
  type MovementSubItem,
} from "./movementCategories";
import catalogData from "./movementCatalog.json";
import { MovementIcon } from "./MovementIcons";

const CATALOG = catalogData as MovementItem[];

gsap.registerPlugin(useGSAP, Flip);

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

// After expanding, bring the whole card into view so the details are not cut off at the bottom.
const useRevealWhenOpen = (ref: RefObject<HTMLElement | null>, open: boolean, delay: number) => {
  useEffect(() => {
    if (!open) return;
    const reduced = prefersReducedMotion();
    const timer = window.setTimeout(
      () => ref.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" }),
      reduced ? 0 : delay,
    );
    return () => window.clearTimeout(timer);
  }, [ref, open, delay]);
};

type HeaderProps = { item: MovementItem; open: boolean; controls: string; onToggle: () => void; aside?: ReactNode };

// Shared by every top-level card so icon, title and summary line up whatever the card type.
const CardHeader = ({ item, open, controls, onToggle, aside }: HeaderProps) => (
  // The button's ::after covers the whole header, so the tile is one click target.
  <div className="relative flex items-start gap-2.5 p-2.5">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--kit-soft)] text-[var(--kit-color)]">
      <MovementIcon id={item.id} className="h-[18px] w-[18px]" />
    </span>
    <div className="min-w-0 flex-1">
      <h3 className="text-[13px] font-semibold leading-5 text-[var(--ink)]">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={controls}
          onClick={onToggle}
          className="rounded-sm text-left after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-[var(--kit-color)]"
        >
          {item.name}
        </button>
      </h3>
      <p className={`text-[12px] leading-[18px] text-zinc-500 ${open ? "" : "truncate"}`}>{item.summary}</p>
    </div>
    {aside}
  </div>
);

type TileProps = { movement: MovementSubItem; focus: boolean; active: boolean; controls: string; onSelect: () => void };

const MovementTile = ({ movement, focus, active, controls, onSelect }: TileProps) => (
  <li data-tile>
    <button
      type="button"
      aria-pressed={active}
      aria-controls={controls}
      onClick={onSelect}
      className={`relative flex h-full w-full flex-col items-start rounded-lg px-2.5 py-2 text-left ring-1 ring-inset transition-[background-color,box-shadow,color,transform] duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--kit-color)] ${
        active
          ? "bg-[var(--kit-soft)] text-[var(--kit-color)] ring-[var(--kit-color)]/25"
          : "bg-zinc-50 text-[var(--ink)] ring-transparent hover:ring-[var(--line)]"
      }`}
    >
      {focus && <span aria-hidden="true" className="absolute right-2 top-2 size-1.5 rounded-full bg-[var(--kit-color)]" />}
      <span className="pr-3 text-[13px] font-medium leading-5">{movement.name}</span>
      {/* Muscles repeat in the detail panel; hidden from the name so the tile reads as the movement. */}
      <span aria-hidden="true" className="truncate text-[11px] leading-4 text-zinc-400">
        {movement.muscles.slice(0, 2).join(" · ")}
      </span>
    </button>
  </li>
);

const VIEWS = [
  { id: "grid", label: "卡片视图", Icon: IconGrid },
  { id: "list", label: "列表视图", Icon: IconList },
] as const;
type View = (typeof VIEWS)[number]["id"];

type EquipmentProps = {
  item: MovementItem;
  focus: MovementSubItem[];
  partLabel: string | null;
  open: boolean;
  onToggle: () => void;
};

/**
 * Same tile as a standalone movement while collapsed, marked as a stack. Opening grows it to the
 * full row (the parent animates that with Flip) and reveals every movement, related ones first.
 */
const EquipmentCard = ({ item, focus, partLabel, open, onToggle }: EquipmentProps) => {
  const movements = item.movements ?? [];
  const ordered = [...focus, ...movements.filter((movement) => !focus.includes(movement))];
  const [view, setView] = useState<View>("grid");
  const [activeId, setActiveId] = useState<string | null>(null);
  // Keeps the last movement rendered while the detail panel collapses.
  const [shownId, setShownId] = useState<string | null>(null);
  const shown = movements.find((movement) => movement.id === shownId);
  const panelId = `movement-panel-${item.id}`;
  const detailId = `movement-detail-${item.id}`;
  const cardRef = useRef<HTMLLIElement>(null);
  const movesRef = useRef<HTMLElement | null>(null);
  const setMoves = (node: HTMLElement | null) => {
    movesRef.current = node;
  };
  const partial = partLabel !== null && focus.length < movements.length;

  useRevealWhenOpen(cardRef, open, 560);

  // Every open or view switch deals the movements in one by one.
  useLayoutEffect(() => {
    if (!open || !movesRef.current || prefersReducedMotion()) return;
    const tween = gsap.from(movesRef.current.querySelectorAll("[data-tile]"), {
      opacity: 0,
      y: 10,
      scale: 0.96,
      duration: 0.42,
      ease: "power3.out",
      stagger: 0.035,
      delay: 0.12,
      clearProps: "opacity,transform",
    });
    return () => {
      tween.revert();
    };
  }, [open, view]);

  const select = (id: string) => {
    setActiveId((current) => (current === id ? null : id));
    setShownId(id);
  };

  return (
    <li ref={cardRef} data-equipment={item.id} className={`relative ${open ? "col-span-full overflow-hidden rounded-xl" : "mb-1.5"}`}>
      {/* Two offset sheets behind the tile read as "a stack of movements". */}
      {!open && (
        <>
          <span aria-hidden="true" className="absolute inset-x-3 -bottom-1.5 top-3 rounded-xl bg-white ring-1 ring-inset ring-[var(--line)]" />
          <span aria-hidden="true" className="absolute inset-x-1.5 -bottom-[3px] top-1.5 rounded-xl bg-white ring-1 ring-inset ring-[var(--line)]" />
        </>
      )}
      <div
        className={`relative rounded-xl bg-white ring-1 ring-inset transition-[box-shadow,background-color] duration-300 ${
          open ? "ring-[var(--kit-color)]/25 shadow-[var(--shadow-sm)]" : "ring-[var(--line)] hover:bg-zinc-50"
        }`}
      >
        <CardHeader
          item={item}
          open={open}
          controls={panelId}
          onToggle={onToggle}
          aside={
            <span
              role="img"
              aria-label={partial ? `${movements.length} 个动作，其中 ${focus.length} 个练${partLabel}` : `${movements.length} 个动作`}
              className="relative flex h-6 shrink-0 items-center gap-1 rounded-full bg-[var(--kit-soft)] px-2 text-[11px] font-medium tabular-nums text-[var(--kit-color)] ring-1 ring-inset ring-[var(--kit-color)]/15"
            >
              <IconLayers className="h-3 w-3" />
              {partial ? `${focus.length}/${movements.length}` : movements.length}
            </span>
          }
        />

        {open && (
          <div id={panelId} className="px-2.5 pb-2.5">
            <div className="flex items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-2">
              <p className="text-[12px] text-zinc-500">
                全部 {movements.length} 个动作
                {partial && (
                  <span className="ml-1.5 inline-flex items-center gap-1 text-[var(--kit-color)]">
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--kit-color)]" />
                    {focus.length} 个练{partLabel}
                  </span>
                )}
              </p>
              <div role="group" aria-label="动作展示方式" className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5">
                {VIEWS.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-label={label}
                    aria-pressed={view === id}
                    onClick={() => setView(id)}
                    className={`flex size-7 items-center justify-center rounded-md transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--kit-color)] ${
                      view === id ? "bg-white text-[var(--ink)] shadow-[0_1px_2px_rgba(17,19,24,0.08)]" : "text-zinc-400 hover:text-zinc-700"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {view === "grid" ? (
              <>
                <ul
                  ref={setMoves}
                  aria-label={`${item.name}动作`}
                  className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-1.5"
                >
                  {ordered.map((movement) => (
                    <MovementTile
                      key={movement.id}
                      movement={movement}
                      focus={partial && focus.includes(movement)}
                      active={movement.id === activeId}
                      controls={detailId}
                      onSelect={() => select(movement.id)}
                    />
                  ))}
                </ul>
                <div
                  id={detailId}
                  aria-hidden={!activeId}
                  inert={!activeId}
                  className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                    activeId ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    {shown && (
                      <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2">
                        <p className="text-[13px] font-medium leading-5 text-[var(--ink)]">{shown.name}</p>
                        <p className="text-[12px] leading-[18px] text-zinc-500">{shown.summary}</p>
                        <dl className="mt-1.5 space-y-1 text-[12px] leading-[18px]">
                          <DetailRow label="肌群">{shown.muscles.join("、")}</DetailRow>
                          <DetailRow label="强度">{shown.intensity}</DetailRow>
                          <DetailRow label="要点">{shown.tips}</DetailRow>
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <ol ref={setMoves} aria-label={`${item.name}动作`} className="mt-2 divide-y divide-[var(--line-soft)]">
                {ordered.map((movement, index) => (
                  <li key={movement.id} data-tile className="flex gap-3 py-2">
                    <span aria-hidden="true" className="w-5 shrink-0 pt-px text-right text-[12px] tabular-nums text-zinc-300">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-[13px] font-medium leading-5 text-[var(--ink)]">{movement.name}</p>
                        {partial && focus.includes(movement) && (
                          <span className="rounded-full bg-[var(--kit-soft)] px-1.5 text-[10px] leading-4 text-[var(--kit-color)]">
                            练{partLabel}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400">强度 {movement.intensity}</span>
                      </div>
                      <p className="text-[12px] leading-[18px] text-zinc-500">{movement.muscles.join("、")}</p>
                      <p className="text-[12px] leading-[18px] text-zinc-600">{movement.tips}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <dl className="mt-2 space-y-1 border-t border-[var(--line-soft)] pt-2 text-[12px] leading-[18px]">
              <DetailRow label="适合">{item.suitableFor.join("、")}</DetailRow>
              <DetailRow label="要点">{item.tips}</DetailRow>
            </dl>
          </div>
        )}
      </div>
    </li>
  );
};

// Standalone movement: same tile as equipment, expands its details in place.
const MovementCard = ({ item, open, onToggle }: CardProps) => {
  const detailId = `movement-detail-${item.id}`;
  const cardRef = useRef<HTMLLIElement>(null);
  useRevealWhenOpen(cardRef, open, 320);
  return (
    <li
      ref={cardRef}
      className={`rounded-xl bg-white ring-1 ring-inset transition-[box-shadow,background-color] duration-300 ${
        open ? "ring-[var(--kit-color)]/25 shadow-[var(--shadow-sm)]" : "ring-[var(--line)] hover:bg-zinc-50"
      }`}
    >
      <CardHeader item={item} open={open} controls={detailId} onToggle={onToggle} />
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
  const [part, setPart] = useState<BodyPartId>("all");
  const [method, setMethod] = useState("all");
  const methods = methodsForPart(CATALOG, part);
  const partLabel = BODY_PARTS.find((item) => item.id === part)?.label ?? "";
  const methodLabel = methods.find((item) => item.id === method)?.label ?? "";
  const entries = browseCatalog(CATALOG, part, method);
  const catalogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  // Snapshot of the card layout taken just before an equipment card changes size.
  const flipState = useRef<Flip.FlipState | null>(null);
  const focusedPart = part === "all" || part === "fullbody" ? null : partLabel;

  const toggleCard = (id: string) => {
    const equipmentChanges = [id, openId].some((cardId) => cardId && entries.find(({ item }) => item.id === cardId)?.item.movements);
    if (equipmentChanges && listRef.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(listRef.current.children);
    }
    setOpenId((current) => (current === id ? null : id));
  };

  // Equipment opens across the full row; glide every card to its new spot instead of jumping.
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state) return;
    flipState.current = null;
    Flip.from(state, { duration: 0.5, ease: SLIDE_EASE, simple: true });
  }, [openId]);
  // A new filter shows a new list; start it from the top, collapsed, instead of keeping old state.
  useEffect(() => {
    if (catalogRef.current) catalogRef.current.scrollTop = 0;
    setOpenId(null);
  }, [part, method]);

  const rootRef = useRef<HTMLElement>(null);
  const partGroupRef = useRef<HTMLDivElement>(null);
  const partIndicatorRef = useRef<HTMLSpanElement>(null);
  const methodGroupRef = useRef<HTMLDivElement>(null);
  const methodIndicatorRef = useRef<HTMLSpanElement>(null);
  // Labels only roll after the user has changed a filter; the first paint uses the block entrance.
  const [interacted, setInteracted] = useState(false);

  useSlidingIndicator(partGroupRef, partIndicatorRef, part, "");
  useSlidingIndicator(methodGroupRef, methodIndicatorRef, method, part);

  const selectPart = (nextPart: BodyPartId, target: HTMLElement) => {
    if (nextPart === part) return;
    setInteracted(true);
    setPart(nextPart);
    setMethod("all");
    // On narrow screens the part row scrolls horizontally; bring the chosen tab into view.
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

      <section data-anim="block" aria-label="训练部位筛选" className="mt-3 shrink-0 sm:mt-4">
        <h2 className="sr-only">训练部位</h2>
        <div className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:overflow-visible sm:px-0">
          <div
            ref={partGroupRef}
            role="group"
            aria-label="训练部位"
            className="relative flex min-w-max gap-0.5 rounded-[14px] bg-zinc-200/50 p-1 sm:grid sm:min-w-0 sm:grid-cols-8"
          >
            <span
              ref={partIndicatorRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-[10px] bg-white opacity-0 shadow-[0_1px_2px_rgba(17,19,24,0.06),0_2px_8px_-2px_rgba(17,19,24,0.08)] will-change-transform"
            />
            {BODY_PARTS.map((item) => {
              const selected = item.id === part;
              return (
                <button
                  key={item.id}
                  data-key={item.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={(event) => selectPart(item.id, event.currentTarget)}
                  className={`relative flex h-10 items-center justify-center rounded-[10px] px-4 text-[13px] font-medium transition-colors duration-500 ease-out sm:px-1 lg:px-2 ${
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
                    key={`${part}-${item.id}`}
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
              <Roll key={`t-${part}`} text={partLabel} className="text-zinc-500" animate={interacted} />
              <span aria-hidden="true" className="text-zinc-300">/</span>
              <Roll
                key={`m-${part}-${method}`}
                text={methodLabel}
                className="font-medium text-[var(--ink)]"
                animate={interacted}
                delay={0.05}
              />
            </p>
          </div>
          {entries.length > 0 ? (
            <ul
              ref={listRef}
              aria-label="运动条目"
              className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] items-start gap-2 p-3 sm:p-4"
            >
              {entries.map(({ item, focus }) =>
                item.movements ? (
                  // Keyed by filter so a new part starts with a fresh selection and view.
                  <EquipmentCard
                    key={`${part}-${method}-${item.id}`}
                    item={item}
                    focus={focus}
                    partLabel={focusedPart}
                    open={openId === item.id}
                    onToggle={() => toggleCard(item.id)}
                  />
                ) : (
                  <MovementCard key={item.id} item={item} open={openId === item.id} onToggle={() => toggleCard(item.id)} />
                ),
              )}
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
