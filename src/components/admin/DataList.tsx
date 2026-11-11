"use client";

import { animate, motion, useMotionValue } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

export type Column<T> = { key: string; label: ReactNode; render: (row: T) => ReactNode; className?: string; align?: "right" };

/**
 * Desktop: a table. Mobile (<md): cards. Cards can be swiped left to reveal quick actions.
 */
export function DataList<T>({
  rows, columns, rowKey, href, card, actions, empty, rowClassName,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (r: T) => string;
  href?: (r: T) => string;
  card: (r: T) => ReactNode;
  actions?: (r: T) => ReactNode;
  empty?: ReactNode;
  rowClassName?: (r: T) => string;
}) {
  const router = useRouter();
  if (rows.length === 0) return <>{empty}</>;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-a-border/70">
              {columns.map((c) => (
                <th key={c.key} className={`a-th ${c.align === "right" ? "text-right" : ""} ${c.className ?? ""}`}>
                  {c.label}
                </th>
              ))}
              {actions ? <th className="a-th text-right">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <motion.tr
                key={rowKey(r)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.025 }}
                onClick={href ? (e) => !(e.target as HTMLElement).closest("a,button,input,select,label") && router.push(href(r)) : undefined}
                className={`border-b border-a-border/50 transition-colors last:border-0 hover:bg-a-raised/60 ${href ? "cursor-pointer" : ""} ${rowClassName?.(r) ?? ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`a-td ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.className ?? ""}`}>
                    {c.render(r)}
                  </td>
                ))}
                {actions ? (
                  <td className="a-td text-right">
                    <div className="inline-flex items-center gap-1.5">{actions(r)}</div>
                  </td>
                ) : null}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2.5 p-3 md:hidden">
        {rows.map((r, i) => (
          <motion.li key={rowKey(r)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.03 }}>
            <SwipeCard href={href?.(r)} actions={actions?.(r)} className={rowClassName?.(r)}>
              {card(r)}
            </SwipeCard>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

function SwipeCard({ children, actions, href, className = "" }: { children: ReactNode; actions?: ReactNode; href?: string; className?: string }) {
  const x = useMotionValue(0);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const dragged = useRef(false); // a swipe shouldn't also count as a tap
  const width = () => (actionsRef.current?.offsetWidth ?? 0) + 12;
  const settle = (to: number) => {
    animate(x, to, { type: "spring", stiffness: 500, damping: 40 });
    setOpen(to !== 0);
  };
  const body = (
    <div className="p-4">
      {children}
      {actions ? <p className="mt-2 text-[10.5px] uppercase tracking-[0.18em] text-a-muted/80">← swipe for actions</p> : null}
    </div>
  );
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-a-border/80 bg-a-raised ${className}`}>
      {actions ? (
        <div ref={actionsRef} className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3" aria-hidden={!open}>
          {actions}
        </div>
      ) : null}
      <motion.div
        drag={actions ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: -320, right: 0 }}
        style={{ x, touchAction: "pan-y" }}
        dragElastic={0.08}
        onDragStart={() => (dragged.current = true)}
        onDragEnd={(_, info) => {
          settle(info.offset.x < -40 || info.velocity.x < -300 ? -width() : 0);
          setTimeout(() => (dragged.current = false), 50);
        }}
        className="relative rounded-2xl bg-a-surface shadow-sm"
      >
        {href ? (
          <Link href={href} draggable={false} onDragStart={(e) => e.preventDefault()} onClick={(e) => (open || dragged.current) && (e.preventDefault(), settle(0))} className="block select-none">
            {body}
          </Link>
        ) : (
          body
        )}
      </motion.div>
    </div>
  );
}
