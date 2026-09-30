import type { ReactNode, SVGProps } from "react";
import { IconFitness } from "../../shared/ui/Icons";

// Line icons for catalog entries. 24×24 grid, 1.6 stroke, round joins so they sit next to lucide icons.
const Svg = ({ children, ...props }: SVGProps<SVGSVGElement> & { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

const ICONS: Record<string, ReactNode> = {
  treadmill: (
    <>
      <path d="M3 19h14l3-4" />
      <path d="M20 15 18 6h-4" />
      <path d="M6 16h10" />
    </>
  ),
  "curved-treadmill": (
    <>
      <path d="M3 12c2 5 4.5 7 9 7s7-2 9-7" />
      <path d="M19 14.5V6h-3" />
      <path d="M6 21h12" />
    </>
  ),
  "upright-bike": (
    <>
      <path d="M4 20h16" />
      <circle cx="16" cy="14" r="3" />
      <path d="M8 20l2-8h6" />
      <path d="M10 12 9 7" />
      <path d="M7 7h4" />
      <path d="M16 11l1-5h2" />
    </>
  ),
  "spin-bike": (
    <>
      <path d="M3 20h18" />
      <circle cx="17" cy="15.5" r="3" />
      <path d="M6 20l4-10h7" />
      <path d="M10 10 9 6" />
      <path d="M7 6h4" />
      <path d="M17 10l2-4h2" />
    </>
  ),
  "recumbent-bike": (
    <>
      <path d="M3 20h18" />
      <path d="M5 8l2 8h6" />
      <path d="M13 16l4-5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M7 16v4" />
    </>
  ),
  "air-bike": (
    <>
      <path d="M3 20h18" />
      <circle cx="16" cy="13" r="5" />
      <path d="M16 8v10M11 13h10" />
      <path d="M4 6h4" />
      <path d="M6 6l2 7h3" />
      <path d="M12 4l2 4" />
    </>
  ),
  elliptical: (
    <>
      <path d="M3 21h18" />
      <ellipse cx="12" cy="16.5" rx="6" ry="2.5" />
      <path d="M7 16 9 4" />
      <path d="M17 16 15 4" />
      <path d="M8 4h2M14 4h2" />
    </>
  ),
  "rowing-machine": (
    <>
      <path d="M2 18h20" />
      <rect x="5" y="14" width="5" height="2.5" rx="1" />
      <circle cx="18" cy="11" r="3.5" />
      <path d="M14.5 11H10" />
      <path d="M10 9v4" />
      <path d="M4 18v2M20 18v2" />
    </>
  ),
  "stair-climber": (
    <>
      <path d="M3 20h4v-4h4v-4h4V8h4" />
      <path d="M19 8V3h2" />
      <path d="M3 20h18" />
    </>
  ),
  stepper: (
    <>
      <rect x="3" y="17" width="18" height="3" rx="1.5" />
      <path d="M5 13h5" />
      <path d="M14 9h5" />
      <path d="M7.5 13v4" />
      <path d="M16.5 9v8" />
    </>
  ),
  "vertical-climber": (
    <>
      <path d="M12 3v18" />
      <path d="M6 21h12" />
      <path d="M8 6h3M13 8h3" />
      <path d="M8 15h3M13 13h3" />
    </>
  ),
  "ski-erg": (
    <>
      <rect x="9" y="3" width="6" height="14" rx="1.5" />
      <path d="M12 17v4M6 21h12" />
      <path d="M10 7 6 13" />
      <path d="M14 7l4 6" />
      <path d="M4.5 13h3M16.5 13h3" />
    </>
  ),
  "arm-ergometer": (
    <>
      <path d="M8 21V10" />
      <path d="M4 21h8" />
      <circle cx="12" cy="8" r="2.5" />
      <path d="M14 6l2.5-2.5M10 10l-2.5 2.5" />
      <path d="M15.5 2.5h2.5M5.5 13.5h2.5" />
    </>
  ),

  // ── 有氧心肺：跑步／户外 ──
  "outdoor-jogging": (
    <>
      <circle cx="14" cy="4.5" r="2" />
      <path d="M13.5 6.8 11.5 12" />
      <path d="M11.5 12 8 15l-2 5" />
      <path d="M11.5 12l3.5 3.5V21" />
      <path d="M12.8 8.5 9 10.5M12.8 8.5 17 10" />
    </>
  ),
  "interval-running": (
    <>
      <circle cx="15" cy="5" r="2" />
      <path d="M14.5 7.2 12.5 12.5" />
      <path d="M12.5 12.5 9 15.5l-1.5 4.5" />
      <path d="M12.5 12.5l3.5 3V21" />
      <path d="M13.5 9 10 11M13.5 9l4 1.5" />
      <path d="M3 7h4M2 11h5M3 15h4" />
    </>
  ),
  "trail-running": (
    <>
      <path d="M3 19l5.5-9 4 6.5L16 12l5 7" />
      <circle cx="17.5" cy="5.5" r="1.8" />
      <path d="M3 19h18" />
    </>
  ),
  "stair-climbing": (
    <>
      <path d="M3 20h4v-4h4v-4h4V8h5" />
      <path d="M16.5 5 20 8l3.5-3" />
      <path d="M20 8V2.5" />
    </>
  ),
  "brisk-walking": (
    <>
      <circle cx="13" cy="4.5" r="2" />
      <path d="M13 6.8V13" />
      <path d="M13 13l-4.5 3L7 21" />
      <path d="M13 13l2.5 3.5L18 21" />
      <path d="M13 8.5 9.5 11M13 8.5 16.5 10.5" />
    </>
  ),
  "nordic-walking": (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.8V13" />
      <path d="M12 13l-3.5 3L7 21" />
      <path d="M12 13l2.5 3.5L17 21" />
      <path d="M12 8.5 8.5 11l-3 8" />
      <path d="M12 8.5l3.5 2 3 8" />
    </>
  ),

  // ── 有氧心肺：骑行 ──
  "road-cycling": (
    <>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M6 17 10 9h5l3 8" />
      <path d="M12.5 5h2L15 9" />
      <path d="M15 9h3c1.2 0 1.6 1.2.5 2" />
    </>
  ),
  "mountain-biking": (
    <>
      <circle cx="6" cy="15.5" r="3" />
      <circle cx="18" cy="15.5" r="3" />
      <path d="M6 15.5 10 8h5l3 7.5" />
      <path d="M13 4.5h4L15 8" />
      <path d="M2 21.5l4-1.5 4 1.5 4-1.5 4 1.5 4-1.5" />
    </>
  ),
  "commuter-cycling": (
    <>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M6 17 10 9h5l3 8" />
      <path d="M12.5 5h2L15 9" />
      <path d="M4.5 12.5h5" />
      <path d="M15 9h3" />
    </>
  ),
  "indoor-cycling-trainer": (
    <>
      <circle cx="15" cy="15" r="4" />
      <path d="M15 11v8M11 15h8" />
      <path d="M11 19l-2 2M19 19l2 2" />
      <path d="M5 21h4" />
      <path d="M7 21l2-9h6" />
      <path d="M9 12 8 7H5.5" />
    </>
  ),
  "gravel-riding": (
    <>
      <circle cx="6" cy="15.5" r="3" />
      <circle cx="18" cy="15.5" r="3" />
      <path d="M6 15.5 10 8h5l3 7.5" />
      <path d="M12.5 4.5h2L15 8" />
      <path d="M3.5 20.5h1M8 21h1M12.5 20.5h1M17 21h1M20.5 20.5h1" />
    </>
  ),

  // ── 有氧心肺：划船／水上 ──
  swimming: (
    <>
      <path d="M2 17c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M2 21c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <circle cx="7" cy="12" r="1.8" />
      <path d="M9.5 13.5c2.5-4 6.5-4 9-1.5" />
    </>
  ),
  kayaking: (
    <>
      <path d="M3 16c4.5 2.5 13.5 2.5 18 0-4.5-2-13.5-2-18 0Z" />
      <path d="M6 5.5 18 18.5" />
      <path d="M4.5 3.5l2.5 2.5M16.5 19.5l2.5 2.5" />
    </>
  ),
  "sup-paddling": (
    <>
      <path d="M3 19.5c5 1.5 13 1.5 18 0" />
      <circle cx="11" cy="5" r="1.8" />
      <path d="M11 7v8l-1.5 4" />
      <path d="M11 7l1.5 8 2 4" />
      <path d="M11 9l4.5-2" />
      <path d="M15.5 3v13" />
    </>
  ),
  "aqua-aerobics": (
    <>
      <path d="M2 17c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M2 21c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <circle cx="12" cy="6.5" r="2" />
      <path d="M12 8.5V14" />
      <path d="M12 9.5 7 5M12 9.5 17 5" />
    </>
  ),
  "dragon-boat": (
    <>
      <path d="M2 16c5 3 15 3 20 0l-1.5-2.5H3.5L2 16Z" />
      <circle cx="8" cy="10" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="18" cy="10" r="1.5" />
      <path d="M9 11.5 7 20M14 11.5 12 20M19 11.5 17 20" />
    </>
  ),
  "open-water-swimming": (
    <>
      <path d="M2 16c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <path d="M2 20c2-1.6 4-1.6 6 0s4 1.6 6 0 4-1.6 6 0" />
      <circle cx="7" cy="11" r="1.8" />
      <path d="M9.5 12.5c2.5-4 6.5-4 9-1.5" />
      <circle cx="19" cy="5.5" r="2" />
    </>
  ),

  // ── 有氧心肺：团体有氧 ──
  "jump-rope": (
    <>
      <circle cx="12" cy="6" r="1.8" />
      <path d="M12 8v4" />
      <path d="M12 12l-2.5 3M12 12l2.5 3" />
      <path d="M9.5 15 8 17M14.5 15 16 17" />
      <path d="M8 17c0 4 8 4 8 0" />
      <path d="M12 9.5 8 11M12 9.5 16 11" />
    </>
  ),
  "jumping-jack-workout": (
    <>
      <circle cx="12" cy="4.5" r="2" />
      <path d="M12 6.8V13" />
      <path d="M12 8.5 7 3.5M12 8.5 17 3.5" />
      <path d="M12 13l-4 8M12 13l4 8" />
    </>
  ),
  "cardio-kickboxing": (
    <>
      <path d="M7 11a4.5 4.5 0 0 1 9 0v3a4.5 4.5 0 0 1-9 0v-3Z" />
      <path d="M16 11c1.8 0 1.8 3 0 3" />
      <path d="M8.5 18.5V21h6v-2.5" />
      <path d="M3.5 6l2-2M20.5 6l-2-2M12 3.5v-2" />
    </>
  ),
  zumba: (
    <>
      <circle cx="12.5" cy="4" r="2" />
      <path d="M12.5 6.2c-1.5 4 1 6-.5 9.8" />
      <path d="M12.3 8.5 16.5 4.5" />
      <path d="M12.3 8.5 7.5 10" />
      <path d="M12 16l-4 5M12 16l2.5 2L17 21" />
    </>
  ),
  "dance-cardio": (
    <>
      <circle cx="7.5" cy="18" r="2.2" />
      <circle cx="16.5" cy="16" r="2.2" />
      <path d="M9.7 18V7.5l9-2V16" />
      <path d="M9.7 10.5l9-2" />
    </>
  ),
  "hiit-class": (
    <>
      <circle cx="12" cy="14" r="6.5" />
      <path d="M12 10.5V14l2.5 2.5" />
      <path d="M9.5 2.5h5" />
      <path d="M12 2.5V5" />
      <path d="M19.5 7.5 21 6" />
    </>
  ),
  "battle-ropes": (
    <>
      <path d="M6 9.5c2.5-3 5 3 7.5 0s5 3 7.5 0" />
      <path d="M6 15.5c2.5-3 5 3 7.5 0s5 3 7.5 0" />
      <path d="M3 8.5 6 9.5M3 14.5l3 1" />
    </>
  ),
  "kettlebell-swing": (
    <>
      <circle cx="13" cy="15.5" r="4.2" />
      <path d="M10 12.2c0-3.6 6-3.6 6 0" />
      <path d="M3.5 8.5c2-3.2 5.5-4.3 8-3.6" />
      <path d="M3.5 8.5 3 5.2M3.5 8.5l3.3-.5" />
    </>
  ),

  // ── 力量／抗阻：固定器械 ──
  "chest-press-machine": (
    <>
      <rect x="3" y="6" width="4" height="13" rx="1" />
      <path d="M7 9.5h6M7 14.5h6" />
      <circle cx="15.5" cy="9.5" r="1.6" />
      <circle cx="15.5" cy="14.5" r="1.6" />
      <path d="M3 19v2M21 21H9" />
    </>
  ),
  "lat-pulldown": (
    <>
      <path d="M4 5h16" />
      <path d="M4 5 2.5 7M20 5l1.5 2" />
      <path d="M12 5v6" />
      <path d="M10 13h4" />
      <path d="M12 13v4" />
      <path d="M8.5 21h7" />
      <path d="M12 21v-2" />
    </>
  ),
  "seated-row": (
    <>
      <path d="M4 21h6M10 21v-5H4" />
      <circle cx="19" cy="16.5" r="1.8" />
      <path d="M17.2 16.5H10" />
      <path d="M10 16.5 8 14.5M10 16.5 8 18.5" />
      <path d="M18.5 21v-2.5" />
    </>
  ),
  "leg-press": (
    <>
      <path d="M6 4.5 14 12.5" />
      <path d="M14 12.5h5" />
      <path d="M19 9.5v6" />
      <path d="M4 20h7M11 20v-4" />
      <path d="M14.5 15.5 19 20" />
    </>
  ),
  "leg-curl": (
    <>
      <path d="M3 13.5h13" />
      <path d="M5 13.5V21M14 13.5V21" />
      <circle cx="18.5" cy="14.5" r="2.5" />
      <path d="M16.5 12.5 20 10" />
    </>
  ),
  "pec-deck": (
    <>
      <circle cx="12" cy="19" r="1.6" />
      <path d="M12 19 7 8M12 19l5-11" />
      <path d="M5.5 5v6M18.5 5v6" />
      <path d="M12 19v2" />
    </>
  ),
  "smith-machine": (
    <>
      <path d="M6 3v18M18 3v18" />
      <path d="M6 9h12" />
      <path d="M4.5 7v4M19.5 7v4" />
      <path d="M6 12.5h1.5M6 16h1.5M18 12.5h-1.5M18 16h-1.5" />
    </>
  ),
  "shoulder-press-machine": (
    <>
      <path d="M4 21V9" />
      <path d="M4 21h6" />
      <path d="M10 21v-5" />
      <path d="M12 6h5M12 10.5h5" />
      <path d="M14.5 3.5V6M14.5 10.5V13" />
      <path d="M17 6v4.5" />
    </>
  ),

  // ── 力量／抗阻：自由重量 ──
  "barbell-back-squat": (
    <>
      <path d="M3 8h18" />
      <path d="M3.5 5.5v5M6 6.5v3M18 6.5v3M20.5 5.5v5" />
      <path d="M8 21v-8M16 21v-8" />
      <path d="M8 13h2M16 13h-2" />
    </>
  ),
  "barbell-bench-press": (
    <>
      <path d="M4 16h12" />
      <path d="M6 16v5M14 16v5" />
      <path d="M3 8h18" />
      <path d="M3.5 5.5v5M20.5 5.5v5" />
      <path d="M7 16V8M15 16V8" />
    </>
  ),
  deadlift: (
    <>
      <circle cx="6" cy="15.5" r="3.5" />
      <circle cx="18" cy="15.5" r="3.5" />
      <path d="M9.5 15.5h5" />
      <path d="M2 19.5h20" />
    </>
  ),
  "dumbbell-shoulder-press": (
    <>
      <path d="M8 13h8" />
      <path d="M6 10v6M8.5 11v4M15.5 11v4M18 10v6" />
      <path d="M12 8V3.5" />
      <path d="M10 5.5 12 3.5l2 2" />
    </>
  ),
  "dumbbell-row": (
    <>
      <path d="M3 14.5h10" />
      <path d="M5 14.5V21M11 14.5V21" />
      <path d="M15.5 18.5h5" />
      <path d="M14 16.5v4M22 16.5v4" />
    </>
  ),
  "overhead-press": (
    <>
      <path d="M3 6h18" />
      <path d="M3.5 3.5v5M20.5 3.5v5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v7" />
      <path d="M12 15.5 8.5 7M12 15.5 15.5 7" />
    </>
  ),
  "dumbbell-curl": (
    <>
      <path d="M9 15.5h6" />
      <path d="M7.5 13v5M9.8 14v3M14.2 14v3M16.5 13v5" />
      <path d="M20 10a4.5 4.5 0 0 0-5-4.5" />
      <path d="M15.5 3 15 5.5l2.5.5" />
    </>
  ),
  "romanian-deadlift": (
    <>
      <path d="M4 12.5h16" />
      <path d="M4.5 9.5v6M19.5 9.5v6" />
      <path d="M2 20h20" />
      <path d="M9 20l2.5-4 3 1" />
    </>
  ),

  // ── 力量／抗阻：自重训练 ──
  "push-up": (
    <>
      <circle cx="5" cy="10.5" r="1.7" />
      <path d="M6.7 11.5 16 13.5" />
      <path d="M13.5 13v5" />
      <path d="M6.5 12 4.5 18" />
      <path d="M2 18h20" />
    </>
  ),
  "pull-up": (
    <>
      <path d="M3 5h18" />
      <circle cx="12" cy="10" r="1.9" />
      <path d="M12 12v6" />
      <path d="M12 13 8.5 6M12 13l3.5-7" />
      <path d="M12 18l-2 3M12 18l2 3" />
    </>
  ),
  "bodyweight-squat": (
    <>
      <circle cx="12.5" cy="4.5" r="1.9" />
      <path d="M12.3 6.6 11 13" />
      <path d="M11 13l-5 1.5" />
      <path d="M6 14.5V20" />
      <path d="M12 8.5 17.5 10" />
      <path d="M4 20h5" />
    </>
  ),
  lunge: (
    <>
      <circle cx="12" cy="4" r="1.9" />
      <path d="M12 6v7" />
      <path d="M12 13l-6 2v5" />
      <path d="M12 13l5 2 2 5" />
      <path d="M12 8.5 9 11M12 8.5l3 2.5" />
      <path d="M3 20h6M16 20h5" />
    </>
  ),
  plank: (
    <>
      <circle cx="4.8" cy="11" r="1.7" />
      <path d="M6.5 12h9.5" />
      <path d="M15 12l-1.5 5h-2" />
      <path d="M6.5 12 5 17" />
      <path d="M2 17h20" />
    </>
  ),
  dip: (
    <>
      <path d="M4 10h5M15 10h5" />
      <path d="M4 10v11M20 10v11" />
      <circle cx="12" cy="7.5" r="1.8" />
      <path d="M12 9.5V16" />
      <path d="M12 11 9.5 10.5M12 11l2.5-.5" />
      <path d="M12 16l-1.5 3M12 16l1.5 3" />
    </>
  ),
  crunch: (
    <>
      <path d="M2 18h20" />
      <circle cx="5.5" cy="13.5" r="1.7" />
      <path d="M7 14.5 12 16.5" />
      <path d="M12 16.5l3.5-4.5" />
      <path d="M15.5 12l3.5 3.5" />
      <path d="M19 15.5l2 2.5" />
    </>
  ),
  "glute-bridge": (
    <>
      <path d="M2 18h20" />
      <circle cx="4.8" cy="14.5" r="1.6" />
      <path d="M6.5 15.5H9" />
      <path d="M9 15.5l5-4.5" />
      <path d="M14 11l2.5 4.5" />
      <path d="M16.5 15.5H20" />
    </>
  ),

  // ── 力量／抗阻：弹力带／小工具 ──
  "resistance-band-row": (
    <>
      <path d="M4 5v14" />
      <path d="M4 12c3.5 2 7 2 10 0" />
      <path d="M14 12l3.5-2M14 12l3.5 2" />
      <path d="M17.5 10v4" />
    </>
  ),
  "resistance-band-lateral-raise": (
    <>
      <circle cx="13" cy="4.5" r="1.9" />
      <path d="M13 6.6V14" />
      <path d="M13 14l-3 6M13 14l3 6" />
      <path d="M13 9H6" />
      <path d="M6 9C4 13.5 5.5 17.5 10 20" />
    </>
  ),
  "resistance-band-squat": (
    <>
      <circle cx="12" cy="4.5" r="1.9" />
      <path d="M12 6.6V13" />
      <path d="M12 13l-4 2v5M12 13l4 2v5" />
      <path d="M12 8.5 9 10M12 8.5l3 1.5" />
      <path d="M9 10C7.5 14 7.5 17.5 8 20M15 10c1.5 4 1.5 7.5 1 10" />
    </>
  ),
  "trx-row": (
    <>
      <path d="M6 4h12" />
      <path d="M12 4l-3 10M12 4l3 10" />
      <path d="M8 14h3M13 14h3" />
      <circle cx="12" cy="4" r="1" />
      <path d="M9.5 14v2.5M14.5 14v2.5" />
    </>
  ),
  "medicine-ball-slam": (
    <>
      <circle cx="12" cy="9" r="3.6" />
      <path d="M8.8 7.5c2 1.8 4.4 1.8 6.4 0" />
      <path d="M5 19.5h14" />
      <path d="M8.5 19.5 7 21.5M12 19.5V22M15.5 19.5 17 21.5" />
    </>
  ),
  "mini-band-lateral-walk": (
    <>
      <ellipse cx="12" cy="14" rx="7" ry="3" />
      <path d="M9 17v3.5M15 17v3.5" />
      <path d="M9 11V8M15 11V8" />
      <path d="M18.5 5H21" />
      <path d="M19.8 3.8 21 5l-1.2 1.2" />
    </>
  ),

  // ── 柔韧／活动度：动态拉伸 ──
  "arm-circles": (
    <>
      <circle cx="12" cy="6" r="1.9" />
      <path d="M12 8v7" />
      <path d="M12 10H7M12 10h5" />
      <path d="M12 12.5l-2.5 7M12 12.5l2.5 7" />
      <path d="M4.5 6.5a3.2 3.2 0 0 1 4-1.5" />
      <path d="M8.5 3.5 8.6 5.7 6.7 4.7" />
      <path d="M19.5 13.5a3.2 3.2 0 0 1-4 1.5" />
      <path d="M15.5 16.5l-.1-2.2 1.9 1" />
    </>
  ),
  inchworm: (
    <>
      <path d="M2 19h20" />
      <path d="M6 19l6-9.5L16.5 16" />
      <circle cx="17" cy="14" r="1.5" />
      <path d="M17.5 15.5 19 19" />
      <path d="M6 19h2.5" />
    </>
  ),
  "leg-swings": (
    <>
      <circle cx="10" cy="4.5" r="1.9" />
      <path d="M10 6.6V14" />
      <path d="M10 14v6" />
      <path d="M10 14l5.5 3" />
      <path d="M10 9H6M10 9h4" />
      <path d="M18.5 11a6.5 6.5 0 0 1-1.5 6" />
      <path d="M15.5 17.5 17.2 17l.3-2" />
    </>
  ),
  "lunge-with-twist": (
    <>
      <circle cx="12" cy="4" r="1.9" />
      <path d="M12 6v7" />
      <path d="M12 13l-6 2v5M12 13l5 2 2 5" />
      <path d="M8.5 7.5a4.2 4.2 0 0 1 7 0" />
      <path d="M15.5 5.5 15.6 7.6l-2-.8" />
      <path d="M3 20h6M16 20h5" />
    </>
  ),
  "worlds-greatest-stretch": (
    <>
      <path d="M2 20h20" />
      <circle cx="16" cy="5.5" r="1.7" />
      <path d="M15.5 7.2 13 13" />
      <path d="M13 13H8v7" />
      <path d="M13 13l5 2 2 5" />
      <path d="M15 8.5 18.5 5" />
      <path d="M14 9.5 10 13.5" />
    </>
  ),

  // ── 柔韧／活动度：静态拉伸 ──
  "chest-stretch": (
    <>
      <path d="M19 4v16" />
      <circle cx="10" cy="5.5" r="1.9" />
      <path d="M10 7.5V15" />
      <path d="M10 15l-2 5.5M10 15l2 5.5" />
      <path d="M10 9.5 19 8.5" />
    </>
  ),
  "childs-pose": (
    <>
      <path d="M2 18.5h20" />
      <circle cx="6.8" cy="15" r="1.7" />
      <path d="M8.5 15.5c4-3.5 8-2 8 3" />
      <path d="M8 16.8 3.5 18.3" />
      <path d="M16.5 18.5h-4" />
    </>
  ),
  "pigeon-pose": (
    <>
      <path d="M2 19h20" />
      <circle cx="11" cy="6.5" r="1.8" />
      <path d="M11 8.4V15" />
      <path d="M11 15H5.5v4" />
      <path d="M11 15l7 4" />
      <path d="M11 10 8 12M11 10l3 2" />
    </>
  ),
  "seated-forward-fold": (
    <>
      <path d="M2 18.5h20" />
      <path d="M10.5 18.5H21" />
      <circle cx="13.5" cy="9.5" r="1.7" />
      <path d="M12.6 11 10.5 18.5" />
      <path d="M12 12.5l7 4.5" />
    </>
  ),
  "standing-quad-stretch": (
    <>
      <circle cx="11" cy="4.5" r="1.9" />
      <path d="M11 6.6V14" />
      <path d="M11 14v6" />
      <path d="M11 14l3.5 2-1-4" />
      <path d="M11 9.5 8 11M11 9.5l2.5 2.5" />
      <path d="M9 20h4" />
    </>
  ),

  // ── 柔韧／活动度：瑜伽 ──
  "bridge-pose": (
    <>
      <path d="M2 17.5h20" />
      <path d="M5.5 17.5c2.5-7 10.5-7 13 0" />
      <circle cx="4.3" cy="15.6" r="1.5" />
      <path d="M6 16.8h3" />
    </>
  ),
  "cat-cow": (
    <>
      <path d="M6 20v-3.5M17.5 20v-3.5" />
      <path d="M6 16.5c4-4.5 7.5-4.5 11.5 0" />
      <path d="M6 16.5c4 2.5 7.5 2.5 11.5 0" />
      <circle cx="19.8" cy="14" r="1.5" />
      <path d="M18.8 15.2l-1.3 1.3" />
    </>
  ),
  "downward-facing-dog": (
    <>
      <path d="M2 20h20" />
      <path d="M5 20l6.5-11L18 16.5" />
      <circle cx="16.2" cy="15.2" r="1.6" />
      <path d="M17 16.8 18.5 20" />
      <path d="M5 20h2.5" />
    </>
  ),
  "warrior-two": (
    <>
      <circle cx="12" cy="4" r="1.9" />
      <path d="M12 6v7" />
      <path d="M5 9.5h14" />
      <path d="M12 13l-5 1v6" />
      <path d="M12 13l6 2 1 5" />
      <path d="M4 20h6M16 20h5" />
    </>
  ),

  // ── 柔韧／活动度：普拉提 ──
  "pelvic-curl": (
    <>
      <path d="M2 18h20" />
      <circle cx="4.8" cy="14.8" r="1.5" />
      <path d="M6.3 15.8H9" />
      <path d="M9 15.8l5-4.3" />
      <path d="M14 11.5l2.5 4" />
      <path d="M16.5 15.5H20" />
      <path d="M11 8.5l1-1.8 1 1.8 1-1.8 1 1.8" />
    </>
  ),
  "pilates-hundred": (
    <>
      <path d="M2 19h20" />
      <path d="M5.5 19l4-4.5" />
      <circle cx="10.8" cy="12.6" r="1.6" />
      <path d="M9.5 14.5 18 9.5" />
      <path d="M8 15.8h5" />
      <path d="M9 17.5h1.2M11 17.5h1.2" />
    </>
  ),
  "single-leg-stretch": (
    <>
      <path d="M2 19h20" />
      <path d="M4.5 19l4-4" />
      <circle cx="9.8" cy="13.2" r="1.6" />
      <path d="M8.5 15l3-3 1.5 3" />
      <path d="M11.5 15l7.5-2.5" />
      <path d="M10.5 14.3l1.8-1.6" />
    </>
  ),
  "spine-stretch-forward": (
    <>
      <path d="M2 19h20" />
      <path d="M11 19h10" />
      <circle cx="13.2" cy="8.8" r="1.7" />
      <path d="M12.2 10.4C10 13 10 16 11 19" />
      <path d="M11.8 12.5 18 15.5" />
    </>
  ),

  // ── 柔韧／活动度：泡沫轴／放松 ──
  "foam-roll-calves": (
    <>
      <path d="M2 20h20" />
      <rect x="9" y="14.5" width="9" height="3.5" rx="1.75" />
      <circle cx="18" cy="16.2" r="1.75" />
      <path d="M3 11.5 10 13.5" />
      <path d="M3 11.5 1.8 9.5" />
    </>
  ),
  "foam-roll-it-band": (
    <>
      <path d="M2 18.5h20" />
      <circle cx="12" cy="15.5" r="2.3" />
      <circle cx="4.3" cy="9.8" r="1.6" />
      <path d="M5.8 10.8 12 13.2" />
      <path d="M12 13.2l8 1.3" />
      <path d="M8 12.5v4" />
    </>
  ),
  "foam-roll-thoracic": (
    <>
      <path d="M2 18.5h20" />
      <circle cx="11" cy="15.3" r="2.2" />
      <circle cx="5" cy="12.8" r="1.6" />
      <path d="M6.5 13.8 9.5 15" />
      <path d="M13 15.5l4-1.5" />
      <path d="M17 14l2 4.5" />
    </>
  ),
  "lacrosse-ball-foot": (
    <>
      <path d="M2 20h20" />
      <circle cx="12" cy="17" r="1.4" />
      <path d="M8 12.5h6l3 3h-9" />
      <path d="M8 12.5V6" />
      <path d="M10 6H8" />
    </>
  ),

  // ── 平衡／协调：平衡训练 ──
  "balance-pad-training": (
    <>
      <rect x="6" y="17" width="12" height="4" rx="2" />
      <circle cx="12" cy="4.5" r="1.9" />
      <path d="M12 6.6V13" />
      <path d="M12 13v4" />
      <path d="M12 13l3.5 1.5" />
      <path d="M12 9H8M12 9h4" />
    </>
  ),
  "bosu-squat": (
    <>
      <path d="M6 18a6 6 0 0 1 12 0" />
      <path d="M6 18h12" />
      <circle cx="12" cy="4" r="1.8" />
      <path d="M12 5.9 11.3 11" />
      <path d="M11.3 11 8 12.3M11.3 11l3.3 1.3" />
      <path d="M11.8 7.5 8.5 9M11.8 7.5 15 9" />
    </>
  ),
  "single-leg-stand": (
    <>
      <circle cx="12" cy="4.5" r="1.9" />
      <path d="M12 6.6V13" />
      <path d="M12 13v7" />
      <path d="M12 13l5-1.5" />
      <path d="M8 9h8" />
      <path d="M10 20h4" />
    </>
  ),
  "single-leg-rdl": (
    <>
      <circle cx="4" cy="11.3" r="1.7" />
      <path d="M5.7 12.3H12" />
      <path d="M12 12.3V20" />
      <path d="M12 12.3l7-1.8" />
      <path d="M7.5 12.3v4.5" />
      <path d="M10 20h4" />
    </>
  ),

  // ── 平衡／协调：核心稳定 ──
  "bird-dog": (
    <>
      <path d="M2 19h20" />
      <path d="M8 19v-3.5M14 19v-3.5" />
      <path d="M8 15.5h6" />
      <circle cx="4.5" cy="13.3" r="1.6" />
      <path d="M8 15.5 3.5 13.8" />
      <path d="M14 15.5l6-2" />
    </>
  ),
  "dead-bug": (
    <>
      <path d="M2 19h20" />
      <path d="M5 17h7" />
      <circle cx="4" cy="15" r="1.6" />
      <path d="M6.5 16.5 5 11" />
      <path d="M12 17l2.5-4.5" />
      <path d="M14.5 12.5H19" />
    </>
  ),
  "pallof-press": (
    <>
      <path d="M19.5 4v16" />
      <circle cx="10" cy="5.5" r="1.9" />
      <path d="M10 7.5v6" />
      <path d="M10 13.5l-3 6.5M10 13.5l3 6.5" />
      <path d="M10 9.5l5.5 2.3" />
      <path d="M15.5 11.8h4" />
    </>
  ),
  "side-plank": (
    <>
      <path d="M2 19h20" />
      <path d="M17.5 19 9 14.3" />
      <circle cx="7.2" cy="12.3" r="1.6" />
      <path d="M9 14.3l1 4.7" />
      <path d="M9.3 13.5 10.5 8" />
      <path d="M17.5 19h2" />
    </>
  ),

  // ── 平衡／协调：敏捷／协调 ──
  "agility-ladder": (
    <>
      <path d="M8 3 5 21M16 3l3 18" />
      <path d="M7.4 7h9.2M6.8 11h10.4M6.2 15h11.6M5.6 19h12.8" />
    </>
  ),
  "double-unders": (
    <>
      <circle cx="12" cy="4.6" r="1.8" />
      <path d="M12 6.5v5" />
      <path d="M12 11.5l-2 3M12 11.5l2 3" />
      <path d="M12 8.5 8.5 10M12 8.5l3.5 1.5" />
      <path d="M8.5 10c0 7.5 7 7.5 7 0" />
      <path d="M9.8 10c0 5 4.4 5 4.4 0" />
    </>
  ),
  "shuttle-run": (
    <>
      <path d="M4 19h16" />
      <path d="M6.5 16.8 4 19l2.5 2.2M17.5 16.8 20 19l-2.5 2.2" />
      <circle cx="12" cy="4.6" r="1.8" />
      <path d="M11.8 6.6 10.3 12" />
      <path d="M10.3 12l-3 3M10.3 12l3 2.5" />
      <path d="M11 8.5 8 9.5M11 8.5l3.5 1" />
    </>
  ),

  // ── 平衡／协调：本体感觉 ──
  "ankle-proprioception-drill": (
    <>
      <path d="M12 3.5V13" />
      <path d="M12 13v4h6" />
      <path d="M12 17h-1" />
      <path d="M8 11.5a5 5 0 0 1 2.5-3" />
      <path d="M10.5 6.5 10.6 8.7l-2-.8" />
      <path d="M16.5 16.5a5 5 0 0 1-2.5 3" />
      <path d="M14 21.5l-.1-2.2 2 .8" />
    </>
  ),
  "eyes-closed-single-leg": (
    <>
      <circle cx="12" cy="4.5" r="1.9" />
      <path d="M10.6 4.3l1 .8M13.4 4.3l-1 .8" />
      <path d="M12 6.6V13" />
      <path d="M12 13v7" />
      <path d="M12 13l4.5-2" />
      <path d="M8.5 9h7" />
      <path d="M10 20h4" />
    </>
  ),
  "unstable-surface-training": (
    <>
      <path d="M7 16h10" />
      <path d="M8.5 16a3.5 3.5 0 0 0 7 0" />
      <circle cx="12" cy="4.5" r="1.9" />
      <path d="M12 6.6V12" />
      <path d="M12 12l-2 4M12 12l2 4" />
      <path d="M8 9h8" />
    </>
  ),
};

type Props = { id: string; className?: string };

// Merged equipment entries reuse the icon of a representative movement instead of new SVGs.
const ALIASES: Record<string, string> = {
  barbell: "barbell-back-squat",
  dumbbell: "dumbbell-shoulder-press",
  "cable-crossover": "smith-machine",
  "resistance-band": "resistance-band-row",
  kettlebell: "kettlebell-swing",
  trx: "trx-row",
  "pec-deck-machine": "chest-press-machine",
  "pull-up-bar": "lat-pulldown",
  "foam-roller": "foam-roll-thoracic",
  "medicine-ball": "medicine-ball-slam",
};

export const MovementIcon = ({ id, className }: Props) => {
  const icon = ICONS[id] ?? (ALIASES[id] ? ICONS[ALIASES[id]] : undefined);
  if (!icon) return <IconFitness className={className} />;
  return <Svg className={className}>{icon}</Svg>;
};
