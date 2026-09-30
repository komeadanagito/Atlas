import { useCallback, useEffect, useState, type RefObject } from "react";

/** Case-insensitive text ranges inside `root`; matches spanning formatting boundaries are not found. */
export const findRanges = (root: HTMLElement, needle: string): Range[] => {
  const query = needle.trim().toLowerCase();
  if (!query) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement?.closest("[data-find-skip]") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const ranges: Range[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = (node.nodeValue ?? "").toLowerCase();
    for (let at = text.indexOf(query); at >= 0; at = text.indexOf(query, at + query.length)) {
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + query.length);
      ranges.push(range);
    }
  }
  return ranges;
};

const supportsHighlights = () => typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";

/**
 * Ctrl/Cmd+F opens an in-transcript finder. `revision` should change whenever transcript text changes
 * so ranges are recomputed against the live DOM.
 */
export const useFindInChat = (root: RefObject<HTMLElement | null>, revision: unknown) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [ranges, setRanges] = useState<Range[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f" && root.current) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [root]);

  useEffect(() => {
    const el = root.current;
    const next = open && el ? findRanges(el, query) : [];
    setRanges(next);
    setIndex((current) => (next.length ? Math.min(current, next.length - 1) : 0));
  }, [open, query, revision, root]);

  useEffect(() => {
    if (!supportsHighlights()) return;
    const current = ranges[index];
    CSS.highlights.set("ai-find", new Highlight(...ranges.filter((r) => r !== current)));
    if (current) CSS.highlights.set("ai-find-current", new Highlight(current));
    else CSS.highlights.delete("ai-find-current");
    return () => { CSS.highlights.delete("ai-find"); CSS.highlights.delete("ai-find-current"); };
  }, [ranges, index]);

  useEffect(() => {
    const target = ranges[index]?.startContainer.parentElement;
    target?.scrollIntoView?.({ block: "center", behavior: "smooth" });
  }, [ranges, index]);

  const step = useCallback((delta: number) => {
    setIndex((current) => (ranges.length ? (current + delta + ranges.length) % ranges.length : 0));
  }, [ranges.length]);

  const close = useCallback(() => { setOpen(false); setQuery(""); }, []);

  return { open, show: () => setOpen(true), query, setQuery, count: ranges.length, index, next: () => step(1), prev: () => step(-1), close };
};