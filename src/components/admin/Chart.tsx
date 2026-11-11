"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";

export type Point = { label: string; value: number; sub?: string };

const nice = (max: number) => {
  if (max <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / p / (max / p > 5 ? 2 : 1)) * p * (max / p > 5 ? 2 : 1);
};
const compact = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(n >= 1e6 ? 0 : 1)}L` : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(Math.round(n)));

/**
 * Single-series column chart (one hue, so no legend — the card title names the series).
 * Thin bars with 4px rounded tops anchored to the baseline, recessive grid,
 * per-bar hover tooltip with a hit target taller than the bar, and a table fallback for screen readers.
 */
export function BarChart({ data, format, height = 240, label }: { data: Point[]; format: (n: number) => string; height?: number; label: string }) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 8, t: 14, b: 28 };
  const max = useMemo(() => nice(Math.max(...data.map((d) => d.value), 0)), [data]);
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const step = iw / Math.max(data.length, 1);
  const bw = Math.max(3, Math.min(28, step - 2));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const labelEvery = Math.ceil(data.length / 8);
  const h = hover != null ? data[hover] : null;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="rgb(var(--a-border))" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 4"} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--a-muted))">
              {compact(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * step + (step - bw) / 2;
          const bh = Math.max(d.value > 0 ? 2 : 0, ih - (y(d.value) - pad.t));
          const r = Math.min(4, bw / 2, bh);
          const path = `M${x},${pad.t + ih} V${pad.t + ih - bh + r} q0,-${r} ${r},-${r} H${x + bw - r} q${r},0 ${r},${r} V${pad.t + ih} Z`;
          return (
            <g key={d.label + i}>
              <motion.path
                d={path}
                fill="rgb(var(--a-series))"
                opacity={hover == null || hover === i ? 1 : 0.45}
                style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
                initial={reduced ? { opacity: 0 } : { scaleY: 0 }}
                animate={reduced ? { opacity: 1 } : { scaleY: 1 }}
                transition={{ duration: 0.7, delay: reduced ? 0 : i * (0.5 / data.length), ease: [0.2, 0.7, 0.2, 1] }}
              />
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="rgb(var(--a-muted))">
                  {d.label}
                </text>
              )}
              {/* generous hit target */}
              <rect
                x={pad.l + i * step}
                y={pad.t}
                width={step}
                height={ih}
                fill="transparent"
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onClick={() => setHover(i)}
              />
            </g>
          );
        })}
      </svg>
      {h && hover != null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl border border-a-border bg-a-surface px-3 py-2 text-[12px] shadow-lg"
          style={{ left: `${((pad.l + hover * step + step / 2) / W) * 100}%`, top: `${(y(h.value) / H) * 100}%` }}
        >
          <p className="font-semibold text-a-text">{h.sub ?? h.label}</p>
          <p className="tabular-nums text-a-muted">{format(h.value)}</p>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <th>{d.sub ?? d.label}</th>
              <td>{format(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Horizontal bars for rankings (top sellers). Value is printed as text, never in the series colour. */
export function RankBars({ rows, suffix = "" }: { rows: { label: string; value: number; sub?: string }[]; suffix?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="grid gap-3">
      {rows.map((r, i) => (
        <li key={r.label + i} className="grid gap-1">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium text-a-text">
              <span className="mr-2 font-serif text-a-gold">{i + 1}.</span>
              {r.label}
            </span>
            <span className="shrink-0 tabular-nums text-a-muted">
              {r.value.toLocaleString("en-IN")}
              {suffix}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-a-raised">
            <motion.div className="h-full origin-left rounded-full bg-a-series" initial={{ scaleX: 0 }} animate={{ scaleX: r.value / max }} transition={{ duration: 0.8, delay: i * 0.06, ease: [0.2, 0.7, 0.2, 1] }} />
          </div>
          {r.sub ? <span className="text-[11.5px] text-a-muted">{r.sub}</span> : null}
        </li>
      ))}
    </ol>
  );
}
