import { useState, type ReactNode } from "react";
import { IconCheck, IconCopy } from "../../shared/ui/Icons";

/**
 * Minimal, XSS-safe Markdown renderer: builds React elements only, never injects HTML.
 * Covers what chat answers use: fences, headings, lists (incl. tasks), tables, quotes, rules, paragraphs, inline code/bold/italic/links.
 */
type Align = "left" | "center" | "right" | null;

type Block =
  | { kind: "code"; lang: string; text: string }
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; align: Align[]; head: string[]; rows: string[][] }
  | { kind: "quote"; text: string }
  | { kind: "rule" }
  | { kind: "para"; text: string };

const FENCE = /^\s*```\s*([\w+-]*)\s*$/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*+]\s+(.*)$/;
const ORDERED = /^\s*\d+[.)]\s+(.*)$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_RULE = /^\s*\|(\s*:?-+:?\s*\|)+\s*$/;
const TASK = /^\[( |x|X)\]\s+(.*)$/;

const cells = (line: string) => line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());

const alignOf = (cell: string): Align =>
  cell.startsWith(":") && cell.endsWith(":") ? "center" : cell.endsWith(":") ? "right" : cell.startsWith(":") ? "left" : null;

const isTableStart = (lines: string[], i: number) => TABLE_ROW.test(lines[i] ?? "") && TABLE_RULE.test(lines[i + 1] ?? "");

const startsBlock = (lines: string[], i: number) => {
  const line = lines[i];
  return FENCE.test(line) || HEADING.test(line) || BULLET.test(line) || ORDERED.test(line) || QUOTE.test(line) || RULE.test(line) || isTableStart(lines, i);
};

export const parseBlocks = (source: string): Block[] => {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  const collect = (match: RegExp) => {
    const out: string[] = [];
    while (i < lines.length) {
      const hit = match.exec(lines[i]);
      if (!hit) break;
      out.push(hit[1]);
      i++;
    }
    return out;
  };
  while (i < lines.length) {
    const line = lines[i];
    const fence = FENCE.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      // An unclosed fence (mid-stream) swallows the rest, which is exactly what should render.
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push({ kind: "code", lang: fence[1], text: body.join("\n") });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      i++;
      continue;
    }
    if (isTableStart(lines, i)) {
      const head = cells(lines[i]);
      const align = cells(lines[i + 1]).map(alignOf);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(cells(lines[i++]));
      blocks.push({ kind: "table", align, head, rows });
      continue;
    }
    if (RULE.test(line)) { blocks.push({ kind: "rule" }); i++; continue; }
    if (QUOTE.test(line)) { blocks.push({ kind: "quote", text: collect(QUOTE).join("\n") }); continue; }
    if (BULLET.test(line)) { blocks.push({ kind: "list", ordered: false, items: collect(BULLET) }); continue; }
    if (ORDERED.test(line)) { blocks.push({ kind: "list", ordered: true, items: collect(ORDERED) }); continue; }
    if (!line.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && (para.length === 0 || !startsBlock(lines, i))) para.push(lines[i++]);
    blocks.push({ kind: "para", text: para.join("\n") });
  }
  return blocks;
};

export const safeHref = (raw: string) => {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch { return null; }
};

const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?，。；：！？])/g;

const link = (href: string | null, label: ReactNode, key: number) =>
  href ? (
    <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="underline decoration-black/25 underline-offset-2 hover:decoration-black/70">
      {label}
    </a>
  ) : <span key={key}>{label}</span>;

export const renderInline = (text: string): ReactNode[] => {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE)) {
    const [token, code, bold, italic, md] = match;
    if (match.index > last) out.push(text.slice(last, match.index));
    if (code) out.push(<code key={key++} className="ai-inline-code">{code.slice(1, -1)}</code>);
    else if (bold) out.push(<strong key={key++} className="font-semibold">{renderInline(bold.slice(2, -2))}</strong>);
    else if (italic) out.push(<em key={key++}>{renderInline(italic.slice(1, -1))}</em>);
    else if (md) {
      const split = md.indexOf("](");
      out.push(link(safeHref(md.slice(split + 2, -1)), renderInline(md.slice(1, split)), key++));
    } else out.push(link(safeHref(token), token, key++));
    last = match.index + token.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
};

export const useCopy = (text: string) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }
    catch { /* clipboard blocked: nothing to do */ }
  };
  return { copied, copy: () => { void copy(); } };
};

const CodeBlock = ({ lang, text }: { lang: string; text: string }) => {
  const { copied, copy } = useCopy(text);
  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-black/[0.06] bg-white">
      <div data-find-skip className="pointer-events-none absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover/code:pointer-events-auto group-hover/code:opacity-100 group-focus-within/code:pointer-events-auto group-focus-within/code:opacity-100">
        {lang ? <span className="px-1 font-mono text-[10px] text-[var(--faint)]">{lang}</span> : null}
        <button type="button" onClick={copy} aria-label={copied ? "已复制" : "复制代码"} className="flex h-6 items-center gap-1 rounded-md border border-black/[0.06] bg-white px-1.5 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]">
          {copied ? <IconCheck className="h-3 w-3" /> : <IconCopy className="h-3 w-3" />}
          {copied ? "已复制" : "复制"}
        </button>
      </div>
      <pre className="soft-scroll overflow-x-auto px-3.5 py-3 font-mono text-[12px] leading-[1.6] text-[var(--ink)]"><code>{text}</code></pre>
    </div>
  );
};

const ListItem = ({ text }: { text: string }) => {
  const task = TASK.exec(text);
  if (!task) return <li className="pl-0.5">{renderInline(text)}</li>;
  const done = task[1] !== " ";
  return (
    <li className="-ml-5 flex list-none items-start gap-2">
      <span aria-hidden="true" className={`mt-[0.3em] flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border ${done ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/20"}`}>
        {done ? <IconCheck className="h-2.5 w-2.5" /> : null}
      </span>
      <span className={done ? "text-[var(--muted)] line-through decoration-black/20" : ""}>
        <span className="sr-only">{done ? "已完成：" : "未完成："}</span>
        {renderInline(task[2])}
      </span>
    </li>
  );
};

const HEADING_CLASS = { 1: "text-[17px]", 2: "text-[15px]", 3: "text-[14px]" } as const;
// Page already owns h1/h2; answer headings sit below them in the outline.
const HEADING_TAG = { 1: "h3", 2: "h4", 3: "h5" } as const;

const renderBlock = (block: Block, index: number) => {
  switch (block.kind) {
    case "code": return <CodeBlock key={index} lang={block.lang} text={block.text} />;
    case "heading": {
      const Tag = HEADING_TAG[block.level];
      return <Tag key={index} className={`mb-1.5 mt-4 font-semibold ${HEADING_CLASS[block.level]}`}>{renderInline(block.text)}</Tag>;
    }
    case "rule": return <hr key={index} className="my-4 border-black/[0.08]" />;
    case "quote": return <blockquote key={index} className="my-2 whitespace-pre-wrap border-l-2 border-black/10 pl-3 text-[var(--muted)]">{renderInline(block.text)}</blockquote>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List key={index} className={`my-2 space-y-1 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-[var(--faint)]`}>
          {block.items.map((item, i) => <ListItem key={i} text={item} />)}
        </List>
      );
    }
    case "table": return (
      <div key={index} className="soft-scroll my-3 overflow-x-auto rounded-xl border border-black/[0.06] bg-white">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-black/[0.02]">
            <tr>{block.head.map((cell, c) => <th key={c} scope="col" style={{ textAlign: block.align[c] ?? "left" }} className="border-b border-black/[0.06] px-3 py-2 font-semibold whitespace-nowrap">{renderInline(cell)}</th>)}</tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} className="border-b border-black/[0.04] last:border-0">
                {block.head.map((_, c) => <td key={c} style={{ textAlign: block.align[c] ?? "left" }} className="px-3 py-2 align-top">{renderInline(row[c] ?? "")}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    case "para": return <p key={index} className="my-2 whitespace-pre-wrap">{renderInline(block.text)}</p>;
  }
};

export const Markdown = ({ source }: { source: string }) => <div className="ai-prose">{parseBlocks(source).map(renderBlock)}</div>;