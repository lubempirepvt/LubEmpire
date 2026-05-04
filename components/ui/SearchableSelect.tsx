"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** Matched by search in addition to label */
  keywords?: string;
};

type SearchableSelectProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  /** Renders an empty choice at the top (e.g. no sticker) */
  optional?: boolean;
  emptyOptionLabel?: string;
  /** Passed through to the trigger for styling parity with other inputs */
  triggerClassName?: string;
};

export function SearchableSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = "Type to search…",
  className = "",
  disabled = false,
  optional = false,
  emptyOptionLabel = "— No selection —",
  triggerClassName = "",
}: SearchableSelectProps) {
  const portalId = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateCoords();
    const onScroll = () => updateCoords();
    const onResize = () => updateCoords();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      const portal = document.getElementById(`ssp-${portalId}`);
      if (portal?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, portalId]);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? options
    : options.filter((o) => {
        const hay = `${o.label} ${o.keywords ?? ""}`.toLowerCase();
        return hay.includes(q);
      });

  const defaultTrigger =
    "w-full p-3 bg-white border border-gray-100 shadow-sm rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-[var(--lub-gold)]/50 transition-all";

  const triggerDisplay =
    selected?.label ?? (optional && value === "" ? emptyOptionLabel : "");

  const panel = open && mounted && (
    <div
      id={`ssp-${portalId}`}
      className="fixed z-[200] rounded-xl border border-gray-200 bg-white shadow-lg max-h-72 flex flex-col overflow-hidden"
      style={{
        top: coords.top,
        left: coords.left,
        width: Math.max(coords.width, 200),
      }}
    >
      <input
        className="w-full border-b border-gray-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--lub-gold)]/30"
        placeholder={searchPlaceholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        autoComplete="off"
        autoFocus
      />
      <ul role="listbox" className="overflow-y-auto flex-1 py-1 min-h-0 max-h-56">
        {optional && (
          <li key="__empty__">
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-amber-50/80 text-gray-600"
              onClick={() => {
                onChange("");
                setOpen(false);
                setQuery("");
              }}
            >
              {emptyOptionLabel}
            </button>
          </li>
        )}
        {filtered.map((o) => (
          <li key={o.value}>
            <button
              type="button"
              className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50/80 break-words ${
                o.value === value ? "bg-amber-100/90 font-semibold" : ""
              }`}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                setQuery("");
              }}
            >
              {o.label}
            </button>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-gray-500">
            No matches
          </li>
        )}
      </ul>
    </div>
  );

  return (
    <div ref={rootRef} className={className}>
      <input type="hidden" name={name} value={value} readOnly />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setQuery("");
        }}
        className={`${defaultTrigger} flex w-full items-center justify-between gap-2 text-left disabled:opacity-50 ${triggerClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`min-w-0 flex-1 line-clamp-2 ${triggerDisplay ? "text-gray-800" : "text-gray-400"}`}
        >
          {triggerDisplay || placeholder}
        </span>
        <span className="text-gray-400 text-[10px] shrink-0" aria-hidden>
          ▾
        </span>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
}
