"use client";

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, PointerEvent, ReactNode } from "react";

type Variant = "primary" | "gold" | "outline" | "wa";
type Common = { variant?: Variant; className?: string; children: ReactNode; icon?: boolean };

function ripple(e: PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.width = s.style.height = `${size}px`;
  s.style.left = `${e.clientX - r.left - size / 2}px`;
  s.style.top = `${e.clientY - r.top - size / 2}px`;
  s.addEventListener("animationend", () => s.remove());
  el.appendChild(s);
}

const variants: Record<Variant, string> = { primary: "btn-primary", gold: "btn-gold", outline: "btn-outline", wa: "btn-wa" };
const cls = (v: Variant, icon?: boolean, extra = "") => `btn ${variants[v]} ${icon ? "btn-icon" : ""} ${extra}`;

export function Button({ variant = "primary", className, children, icon, onPointerDown, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cls(variant, icon, className)}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", className, children, icon, onPointerDown, ...rest }: Common & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const external = rest.href?.startsWith("http");
  return (
    <a
      className={cls(variant, icon, className)}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
