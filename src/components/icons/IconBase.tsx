"use client";

import { createContext, useContext, useId, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Icon animation system
 * ─────────────────────
 * 1. <IconBase> watches its own visibility. When it scrolls into view every
 *    <D> (draw) child strokes itself in (pathLength / stroke-dashoffset, 0.8s)
 *    and every <F> (fill) child fades in softly afterwards.
 * 2. Idle loops are plain CSS keyframes on <g className="idle i-…"> groups
 *    (transform + opacity only) — see globals.css.
 * 3. `delay` lets grids stagger icons (index × 80ms).
 * 4. prefers-reduced-motion: no line-draw, only a simple fade; CSS loops off.
 */

type Ctx = { delay: number; reduced: boolean };
const IconCtx = createContext<Ctx>({ delay: 0, reduced: false });

export type IconProps = {
  size?: number | string;
  /** seconds before the draw-in begins (used for staggering) */
  delay?: number;
  className?: string;
  /** accessible label; omit for decorative icons */
  title?: string;
  strokeWidth?: number;
  /** animate when mounted instead of when scrolled into view */
  eager?: boolean;
  style?: CSSProperties;
};

export function IconBase({
  size = 48,
  delay = 0,
  className = "",
  title,
  strokeWidth = 1.7,
  eager = false,
  viewBox = "0 0 48 48",
  style,
  children,
}: IconProps & { viewBox?: string; children: ReactNode }) {
  const reduced = !!useReducedMotion();
  const trigger = eager
    ? { animate: "visible" as const }
    : { whileInView: "visible" as const, viewport: { once: true, amount: 0.35 } };

  return (
    <IconCtx.Provider value={{ delay, reduced }}>
      <motion.svg
        viewBox={viewBox}
        width={size}
        height={size}
        className={`overflow-visible ${className}`}
        style={style}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        focusable="false"
        initial="hidden"
        {...trigger}
      >
        {title ? <title>{title}</title> : null}
        {children}
      </motion.svg>
    </IconCtx.Provider>
  );
}

type El = "path" | "circle" | "rect" | "line" | "ellipse" | "polyline" | "polygon";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Geo = { as?: El; at?: number; [key: string]: any };

const EASE = [0.65, 0, 0.35, 1] as const;

function drawVariants(delay: number, reduced: boolean): Variants {
  if (reduced) return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.4, delay } } };
  return {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { pathLength: { duration: 0.8, ease: EASE, delay }, opacity: { duration: 0.12, delay } },
    },
  };
}

function fillVariants(delay: number, reduced: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.55, ease: "easeOut", delay: reduced ? delay : delay + 0.55 } },
  };
}

/** Stroke that draws itself in. */
export function D({ as = "path", at = 0, ...rest }: Geo) {
  const { delay, reduced } = useContext(IconCtx);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = (motion as any)[as];
  return <C fill="none" variants={drawVariants(delay + at, reduced)} {...rest} />;
}

/** Fill that fades in once the stroke has drawn. */
export function F({ as = "path", at = 0, fill = "var(--ic-fill)", ...rest }: Geo) {
  const { delay, reduced } = useContext(IconCtx);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const C = (motion as any)[as];
  return <C stroke="none" fill={fill} variants={fillVariants(delay + at, reduced)} {...rest} />;
}

/** Filled shape with a self-drawing outline. */
export function S({ fill = "var(--ic-fill)", stroke, strokeWidth, ...geo }: Geo) {
  return (
    <>
      <F fill={fill} {...geo} />
      <D stroke={stroke} strokeWidth={strokeWidth} {...geo} />
    </>
  );
}

/** Stable, selector-safe id for clipPaths / gradients. */
export function useUid(prefix = "i") {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** Inline style to rotate/scale around an exact point in viewBox units. */
export const origin = (x: number, y: number): CSSProperties => ({
  transformBox: "view-box",
  transformOrigin: `${x}px ${y}px`,
});
