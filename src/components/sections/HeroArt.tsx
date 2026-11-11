"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { D, F, IconBase, S, useUid } from "../icons/IconBase";
import { CapsuleIcon, CrossIcon, LeafIcon, MortarIcon } from "../icons";

function HeroBottle() {
  const c = useUid("hb");
  const body = "M38 40h44v10c16 4 26 15 26 31v54a14 14 0 0 1-14 14H26a14 14 0 0 1-14-14V81c0-16 10-27 26-31Z";
  return (
    <IconBase viewBox="0 0 120 160" size="100%" strokeWidth={2.2} eager delay={1.15} className="text-emerald-900">
      <defs>
        <clipPath id={c}>
          <path d={body} />
        </clipPath>
        <linearGradient id={c + "g"} x1="0" x2="1">
          <stop offset="0" stopColor="#7a4a17" />
          <stop offset=".5" stopColor="#b07226" />
          <stop offset="1" stopColor="#6b3f12" />
        </linearGradient>
      </defs>
      <F d={body} fill={`url(#${c}g)`} />
      <g clipPath={`url(#${c})`}>
        <g className="idle i-wobble">
          <g className="idle i-wave" style={{ animationDuration: "4s" }}>
            <F d="M-12 92q12-6 24 0t24 0 24 0 24 0 24 0 24 0 24 0V170H-12Z" fill="#e0a54a" fillOpacity={0.55} />
          </g>
        </g>
        <F d="M24 60c-6 14-6 60 0 84" stroke="#fff3d6" strokeOpacity={0.45} strokeWidth={5} fill="none" />
      </g>
      <D d={body} />
      <S as="rect" x="34" y="14" width="52" height="27" rx="5" fill="#0f4c3a" stroke="#0b3a2c" at={0.2} />
      <D d="M40 22v12M50 22v12M60 22v12M70 22v12M80 22v12" stroke="#c9a24b" strokeWidth={1.2} at={0.4} />
      <S as="rect" x="22" y="88" width="76" height="44" rx="5" fill="#faf6ee" stroke="#c9a24b" at={0.45} />
      <D d="M30 96h60M30 124h60" stroke="#c9a24b" strokeWidth={1} at={0.6} />
      <S d="M56 100h8v6h6v8h-6v6h-8v-6h-6v-8h6Z" fill="#0f4c3a" stroke="#0f4c3a" strokeWidth={1} at={0.7} />
    </IconBase>
  );
}

function Tablet({ tone = "#fffaf0" }: { tone?: string }) {
  return (
    <IconBase size="100%" delay={1.4} eager className="text-emerald-800/70">
      <S as="circle" cx="24" cy="24" r="18" fill={tone} />
      <D d="M12 24h24" at={0.3} />
    </IconBase>
  );
}

function Layer({ depth, mx, my, p, className, children, float = "float-mid" }: { depth: number; mx: MotionValue<number>; my: MotionValue<number>; p: MotionValue<number>; className: string; children: ReactNode; float?: string }) {
  const x = useTransform(mx, (v) => v * depth * 16);
  const yMouse = useTransform(my, (v) => v * depth * 12);
  const yScroll = useTransform(p, [0, 1], [0, -depth * 110]);
  const y = useTransform([yMouse, yScroll] as MotionValue<number>[], ([a, b]: number[]) => a + b);
  return (
    <motion.div className={`absolute ${className}`} style={{ x, y }}>
      <div className={`h-full w-full ${float}`}>{children}</div>
    </motion.div>
  );
}

export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });
  const zero = useMotionValue(0);
  const p = reduced ? zero : scrollYProgress;

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[520px]"
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        rawX.set(((e.clientX - r.left) / r.width - 0.5) * 2);
        rawY.set(((e.clientY - r.top) / r.height - 0.5) * 2);
      }}
      onPointerLeave={() => {
        rawX.set(0);
        rawY.set(0);
      }}
      aria-hidden
    >
      {/* arched apothecary window */}
      <Layer depth={0.15} mx={mx} my={my} p={p} className="bottom-[4%] left-[10%] right-[10%] top-[6%]" float="">
        <div className="relative h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[28px] border border-gold/50 bg-gradient-to-b from-emerald-700 via-emerald-800 to-emerald-950 shadow-lift">
          <div className="absolute inset-[10px] rounded-t-[999px] rounded-b-[20px] border border-gold/35" />
          <div className="absolute inset-x-[14%] bottom-[24%] h-px bg-gold/40" />
          <div className="absolute inset-x-[14%] bottom-[46%] h-px bg-gold/25" />
          <div className="absolute -left-1/4 top-0 h-full w-1/2 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      </Layer>

      {/* slow gold ring */}
      <Layer depth={0.25} mx={mx} my={my} p={p} className="inset-[2%]" float="">
        <svg viewBox="0 0 200 200" className="spin-slow h-full w-full text-gold/60">
          <circle cx="100" cy="100" r="97" fill="none" stroke="currentColor" strokeWidth=".6" strokeDasharray="2 6" />
        </svg>
      </Layer>

      <Layer depth={0.5} mx={mx} my={my} p={p} className="left-[30%] top-[24%] w-[40%]" float="float-slow">
        <HeroBottle />
      </Layer>

      <Layer depth={0.9} mx={mx} my={my} p={p} className="right-[2%] top-[8%] w-[22%]" float="float-fast">
        <div className="grid aspect-square place-items-center rounded-full border border-gold/50 bg-cream-50 text-emerald-800 shadow-lift">
          <CrossIcon size="58%" eager delay={1.3} />
        </div>
      </Layer>

      <Layer depth={1.2} mx={mx} my={my} p={p} className="left-[2%] top-[30%] w-[22%] text-emerald-800" float="float-mid">
        <CapsuleIcon size="100%" eager delay={1.35} strokeWidth={1.4} />
      </Layer>
      <Layer depth={1.4} mx={mx} my={my} p={p} className="right-[6%] top-[52%] w-[17%] text-emerald-800" float="float-slow">
        <CapsuleIcon size="100%" eager delay={1.45} strokeWidth={1.5} />
      </Layer>
      <Layer depth={1.1} mx={mx} my={my} p={p} className="bottom-[8%] left-[12%] w-[13%]" float="float-fast">
        <Tablet />
      </Layer>
      <Layer depth={1.6} mx={mx} my={my} p={p} className="left-[18%] top-[6%] w-[10%]" float="float-mid">
        <Tablet tone="#f3e6c4" />
      </Layer>
      <Layer depth={0.8} mx={mx} my={my} p={p} className="bottom-[2%] right-[14%] w-[24%] text-emerald-800" float="float-mid">
        <div className="rounded-full border border-gold/40 bg-cream-50/90 p-[14%] shadow-lift">
          <MortarIcon size="100%" eager delay={1.5} strokeWidth={1.5} />
        </div>
      </Layer>
      <Layer depth={1.3} mx={mx} my={my} p={p} className="bottom-[28%] left-[4%] w-[14%] text-emerald-700" float="float-slow">
        <LeafIcon size="100%" eager delay={1.55} strokeWidth={1.5} />
      </Layer>
    </div>
  );
}
