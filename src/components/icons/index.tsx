"use client";

import { D, F, IconBase, S, origin, useUid, type IconProps } from "./IconBase";

/* Every icon: self-drawing outline → soft fill → its own idle loop. */

/* ───────────── Capsule / pill — tilts, floats, halves separate ───────────── */
export function CapsuleIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-float-tilt">
        <g transform="rotate(-35 24 24)">
          <g className="idle i-split-l">
            <S d="M24 17H16a7 7 0 0 0 0 14h8Z" fill="var(--ic-accent)" />
            <D d="M13 21.5h5" stroke="#fff8e6" strokeWidth={1.4} at={0.3} />
          </g>
          <g className="idle i-split-r">
            <S d="M24 17h8a7 7 0 0 1 0 14h-8Z" fill="var(--ic-fill)" />
          </g>
        </g>
      </g>
    </IconBase>
  );
}

/* ───────────── Heart — ECG trace travels, soft pulse ───────────── */
export function HeartIcon(p: IconProps) {
  const id = useUid("ecg");
  const ecg = "M4 25h10l3-6 4 12 4-17 3 11h16";
  return (
    <IconBase {...p}>
      <defs>
        <clipPath id={id}>
          <rect className="idle i-scan" x="0" y="0" width="16" height="48" />
        </clipPath>
      </defs>
      <g className="idle i-pulse">
        <S d="M24 40C12 32 6 25 6 17.5A8.5 8.5 0 0 1 24 13a8.5 8.5 0 0 1 18 4.5C42 25 36 32 24 40Z" fill="var(--ic-soft)" />
      </g>
      <D d={ecg} stroke="var(--ic-accent)" strokeOpacity={0.45} at={0.4} />
      <path d={ecg} stroke="var(--ic-accent)" strokeWidth={2.2} clipPath={`url(#${id})`} />
    </IconBase>
  );
}

/* ───────────── Medical cross — slow glow pulse ───────────── */
export function CrossIcon(p: IconProps) {
  const g = useUid("glow");
  return (
    <IconBase {...p}>
      <defs>
        <radialGradient id={g}>
          <stop offset="0" stopColor="var(--ic-accent)" stopOpacity=".9" />
          <stop offset="1" stopColor="var(--ic-accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle className="idle i-glow" cx="24" cy="24" r="21" fill={`url(#${g})`} stroke="none" />
      <S d="M19.5 7h9a1.5 1.5 0 0 1 1.5 1.5V18h9.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H30v9.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V30H8.5A1.5 1.5 0 0 1 7 28.5v-9A1.5 1.5 0 0 1 8.5 18H18V8.5A1.5 1.5 0 0 1 19.5 7Z" fill="currentColor" />
      <D d="M21 11v9H11" stroke="var(--ic-accent)" strokeWidth={1.2} at={0.5} />
    </IconBase>
  );
}

/* ───────────── Mortar & pestle — pestle grinds in a small circle ───────────── */
export function MortarIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-grind" style={origin(30, 22)}>
        <S d="M26.6 22.6 36.8 6.4a2.6 2.6 0 0 1 4.4 2.8L31 25.4Z" fill="var(--ic-accent)" />
      </g>
      <S d="M7 22h34c0 9-7.6 15-17 15S7 31 7 22Z" fill="var(--ic-fill)" />
      <D d="M5 22h38" />
      <S d="M17 37l-2 4h18l-2-4" fill="var(--ic-soft)" at={0.2} />
      <g className="idle i-blink">
        <F as="circle" cx="14" cy="18" r="1.3" fill="var(--ic-accent)" />
        <F as="circle" cx="19" cy="15.5" r="1" fill="var(--ic-accent)" at={0.1} />
        <F as="circle" cx="12" cy="13.5" r=".9" fill="var(--ic-accent)" at={0.2} />
      </g>
    </IconBase>
  );
}

/* ───────────── Stethoscope — chest piece swings like a pendulum ───────────── */
export function StethoscopeIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <D d="M12 5h-2v11a9 9 0 0 0 18 0V5h-2" />
      <F as="circle" cx="12" cy="5" r="1.6" fill="currentColor" />
      <F as="circle" cx="26" cy="5" r="1.6" fill="currentColor" />
      <g className="idle i-swing" style={origin(19, 25)}>
        <D d="M19 25v5a8 8 0 0 0 16 0v-5" at={0.25} />
        <S as="circle" cx="35" cy="21" r="4.5" fill="var(--ic-accent)" at={0.4} />
        <F as="circle" cx="35" cy="21" r="1.6" fill="#fff8e6" at={0.5} />
      </g>
    </IconBase>
  );
}

/* ───────────── Syrup bottle — liquid level wobbles ───────────── */
const BOTTLE = "M20 13h8v4c5 1 8 4 8 9v12a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4V26c0-5 3-8 8-9Z";
const WAVE = "M0 28q6-3 12 0t12 0 12 0 12 0 12 0 12 0V48H0Z";
export function SyrupIcon(p: IconProps) {
  const c = useUid("bt");
  return (
    <IconBase {...p}>
      <defs>
        <clipPath id={c}>
          <path d={BOTTLE} />
        </clipPath>
      </defs>
      <F d={BOTTLE} fill="#fffaf0" />
      <g clipPath={`url(#${c})`}>
        <g className="idle i-wobble">
          <g className="idle i-wave">
            <F d={WAVE} fill="var(--ic-liquid)" fillOpacity={0.85} />
          </g>
        </g>
      </g>
      <D d={BOTTLE} />
      <S as="rect" x="18" y="6" width="12" height="7" rx="1.6" fill="currentColor" at={0.2} />
      <S as="rect" x="15.5" y="30" width="17" height="8" rx="1.5" fill="#fffaf0" at={0.4} />
      <D d="M24 31.8v4.4M21.8 34h4.4" stroke="#9b2c2c" at={0.6} />
    </IconBase>
  );
}

/* ───────────── Delivery scooter — wheels spin, speed lines ───────────── */
function Wheel({ cx }: { cx: number }) {
  return (
    <g className="idle i-spin" style={origin(cx, 37)}>
      <S as="circle" cx={cx} cy="37" r="5" fill="var(--ic-soft)" at={0.3} />
      <D d={`M${cx - 3} 37h6M${cx} 34v6`} strokeWidth={1.2} at={0.5} />
    </g>
  );
}
export function ScooterIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-speed">
        <D d="M2 20h5" stroke="var(--ic-accent)" />
      </g>
      <g className="idle i-speed" style={{ animationDelay: ".33s" }}>
        <D d="M0 26h6" stroke="var(--ic-accent)" />
      </g>
      <g className="idle i-speed" style={{ animationDelay: ".66s" }}>
        <D d="M3 32h4" stroke="var(--ic-accent)" />
      </g>
      <g className="idle i-float">
        <S as="rect" x="9" y="15" width="12" height="12" rx="2" fill="var(--ic-accent)" />
        <D d="M15 18v6M12 21h6" stroke="#fff8e6" strokeWidth={1.4} at={0.5} />
        <S d="M12 31c0-3 2-4 5-4h11l3-11h6M33 16l1.5-3" fill="none" />
        <S d="M17 31h14l3 6H18c-3 0-6-2-6-6Z" fill="currentColor" at={0.2} />
      </g>
      <Wheel cx={12} />
      <Wheel cx={38} />
    </IconBase>
  );
}

/* ───────────── Prescription sheet — lines write themselves, tick appears ───────────── */
export function PrescriptionIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <S d="M12 5h18l7 7v29a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" fill="#fffaf0" />
      <D d="M30 5v7h7" />
      <D d="M15 11v8m0-8h3.6a2.4 2.4 0 0 1 0 4.8H15m3 0 4.5 5m0-5-4.5 5" stroke="var(--ic-accent)" strokeWidth={1.8} at={0.3} />
      <g className="idle i-write">
        <D d="M15 26h17" at={0.4} />
      </g>
      <g className="idle i-write" style={{ animationDelay: "1.6s" }}>
        <D d="M15 31h13" at={0.5} />
      </g>
      <g className="idle i-write" style={{ animationDelay: "2s" }}>
        <D d="M15 36h8" at={0.6} />
      </g>
      <g className="idle i-tick" style={{ animationDelay: "2.4s" }}>
        <S as="circle" cx="33" cy="37" r="5" fill="currentColor" at={0.7} />
        <D d="m30.8 37 1.6 1.6 3-3.2" stroke="#fff8e6" strokeWidth={1.6} at={0.9} />
      </g>
    </IconBase>
  );
}

/* ───────────── Clock 24×7 — hands rotate ───────────── */
export function ClockIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <S as="circle" cx="24" cy="24" r="17" fill="var(--ic-fill)" />
      <D d="M24 9.5v2.5M24 36v2.5M9.5 24H12M36 24h2.5" stroke="var(--ic-accent)" at={0.3} />
      <g className="idle i-hand-h" style={origin(24, 24)}>
        <D d="M24 24v-7" strokeWidth={2.2} at={0.5} />
      </g>
      <g className="idle i-hand-m" style={origin(24, 24)}>
        <D d="M24 24h9" at={0.6} />
      </g>
      <F as="circle" cx="24" cy="24" r="1.8" fill="var(--ic-accent)" at={0.5} />
    </IconBase>
  );
}

/* ───────────── Shield (genuine) — check mark draws in ───────────── */
export function ShieldIcon(p: IconProps) {
  const c = useUid("sh");
  return (
    <IconBase {...p}>
      <defs>
        <clipPath id={c}>
          <rect className="idle i-reveal" x="15" y="14" width="18" height="18" />
        </clipPath>
      </defs>
      <S d="M24 5 39 10v12c0 10-6.5 17-15 21C15.5 39 9 32 9 22V10Z" fill="var(--ic-soft)" />
      <D d="M24 9.5 35 13v9c0 7.5-4.6 13-11 16" stroke="var(--ic-accent)" strokeWidth={1.1} at={0.4} />
      <g clipPath={`url(#${c})`}>
        <D d="m17 24 5 5 9-10" strokeWidth={2.6} at={0.6} />
      </g>
    </IconBase>
  );
}

/* ───────────── Phone — ring shake every few seconds ───────────── */
const HANDSET =
  "M14 7h4.6l2.8 7.4-3.6 2.6a21 21 0 0 0 11.2 11.2l2.6-3.6 7.4 2.8V32a3 3 0 0 1-3 3C22.6 35 9 21.4 9 10a3 3 0 0 1 3-3Z";
export function PhoneIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-ring" style={origin(22, 22)}>
        <S d={HANDSET} fill="var(--ic-accent)" transform="translate(1 3)" />
      </g>
      <g className="idle i-waves" style={origin(30, 18)}>
        <D d="M30 8a11 11 0 0 1 10 10M30 13a6 6 0 0 1 5 5" stroke="var(--ic-accent)" at={0.4} />
      </g>
    </IconBase>
  );
}

/* ───────────── WhatsApp-style chat bubble — ring shake ───────────── */
export function WhatsAppIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-ring" style={origin(24, 24)}>
        <S d="M24 5a19 19 0 0 0-16.4 28.6L5 43l9.7-2.5A19 19 0 1 0 24 5Z" fill="rgba(255,255,255,.12)" />
        <S
          d="M18 14.5h2.6l1.6 4.2-2 1.6a12 12 0 0 0 5.5 5.5l1.6-2 4.2 1.6v2.6a2 2 0 0 1-2 2C22.8 30 16 23.2 16 16.5a2 2 0 0 1 2-2Z"
          fill="currentColor"
          at={0.3}
        />
      </g>
    </IconBase>
  );
}

/* ───────────── Baby bottle — milk wobbles, teat bobs ───────────── */
const BABY = "M17 18h14v20a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5Z";
export function BabyBottleIcon(p: IconProps) {
  const c = useUid("bb");
  return (
    <IconBase {...p}>
      <defs>
        <clipPath id={c}>
          <path d={BABY} />
        </clipPath>
      </defs>
      <g className="idle i-pop">
        <S d="M21 13c0-4 1.4-7 3-7s3 3 3 7Z" fill="var(--ic-accent)" />
      </g>
      <S as="rect" x="15.5" y="13" width="17" height="5" rx="1.6" fill="currentColor" at={0.2} />
      <F d={BABY} fill="#fffdf8" />
      <g clipPath={`url(#${c})`}>
        <g className="idle i-wobble">
          <g className="idle i-wave">
            <F d={WAVE} transform="translate(0 2)" fill="var(--ic-fill)" />
          </g>
        </g>
      </g>
      <D d={BABY} />
      <D d="M17 26h4M17 32h4M17 38h3" strokeWidth={1.2} at={0.4} />
    </IconBase>
  );
}

/* ───────────── Glucose drop (diabetes) — pulses, a droplet falls ───────────── */
export function GlucoseIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-pulse">
        <S d="M24 5s-12 13.5-12 22a12 12 0 0 0 24 0C36 18.5 24 5 24 5Z" fill="var(--ic-soft)" />
        <D d="M17.5 27h3.5l2-4 3 8 2-4h2.5" stroke="var(--ic-accent)" at={0.4} />
      </g>
      <g className="idle i-drip">
        <F d="M38 33s-2.6 3-2.6 4.8a2.6 2.6 0 0 0 5.2 0C40.6 36 38 33 38 33Z" fill="var(--ic-accent)" at={0.6} />
      </g>
    </IconBase>
  );
}

/* ───────────── Lotion pump (skin care) — pump presses, leaf sways ───────────── */
export function LotionIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-press">
        <S d="M20 9h12v3H20Z" fill="currentColor" />
        <D d="M26 12v5M20 9H15" />
      </g>
      <S as="rect" x="21" y="16" width="10" height="4" rx="1" fill="var(--ic-accent)" at={0.1} />
      <S d="M18 20h16a2 2 0 0 1 2 2v17a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V22a2 2 0 0 1 2-2Z" fill="#fffaf0" at={0.15} />
      <g className="idle i-sway" style={origin(26, 37)}>
        <S d="M26 37c-5-2-6-7-3-12 4 3 5 8 3 12Zm0 0v-6" fill="var(--ic-soft)" at={0.5} />
      </g>
      <g className="idle i-glint">
        <D d="M19.5 25v6" stroke="var(--ic-accent)" at={0.6} />
      </g>
    </IconBase>
  );
}

/* ───────────── First-aid kit — cross glows, kit bobs ───────────── */
export function FirstAidIcon(p: IconProps) {
  const g = useUid("fa");
  return (
    <IconBase {...p}>
      <defs>
        <radialGradient id={g}>
          <stop offset="0" stopColor="#fff3cf" stopOpacity="1" />
          <stop offset="1" stopColor="#fff3cf" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="idle i-float">
        <D d="M18 13V9.5A1.5 1.5 0 0 1 19.5 8h9A1.5 1.5 0 0 1 30 9.5V13" />
        <S as="rect" x="6" y="13" width="36" height="27" rx="4" fill="currentColor" at={0.1} />
        <circle className="idle i-glow" cx="24" cy="26.5" r="11" fill={`url(#${g})`} stroke="none" />
        <S d="M21.5 19h5v5h5v5h-5v5h-5v-5h-5v-5h5Z" fill="var(--ic-accent)" stroke="var(--ic-accent)" at={0.4} />
      </g>
    </IconBase>
  );
}

/* ───────────── Upload — arrow rises from phone ───────────── */
export function UploadIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <S as="rect" x="13" y="5" width="22" height="38" rx="4" fill="#fffaf0" />
      <D d="M21 39h6" at={0.3} />
      <S as="rect" x="16.5" y="12" width="15" height="17" rx="1.6" fill="var(--ic-soft)" at={0.25} />
      <g className="idle i-up">
        <D d="M24 25v-9m-3.5 3.5L24 16l3.5 3.5" stroke="var(--ic-accent)" strokeWidth={2} at={0.5} />
      </g>
    </IconBase>
  );
}

/* ───────────── Pharmacist — badge glows, gentle nod ───────────── */
export function PharmacistIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-wobble">
        <S as="circle" cx="24" cy="14" r="7.5" fill="var(--ic-fill)" />
      </g>
      <S d="M8 43c0-9 7-15 16-15s16 6 16 15Z" fill="#fffaf0" at={0.2} />
      <D d="M24 28v15M18.5 29.5 24 36l5.5-6.5" at={0.4} />
      <g className="idle i-blink">
        <S as="rect" x="29" y="34" width="6" height="6" rx="1.2" fill="var(--ic-accent)" stroke="var(--ic-accent)" at={0.6} />
        <D d="M32 35.4v3.2M30.4 37h3.2" stroke="#fff8e6" strokeWidth={1.2} at={0.8} />
      </g>
    </IconBase>
  );
}

/* ───────────── Price tag — swings from its hole ───────────── */
export function TagIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <D d="M33 5c4 0 5 3 3.5 6" stroke="var(--ic-accent)" />
      <g className="idle i-swing" style={origin(33, 12)}>
        <S d="M27 8h10a2 2 0 0 1 2 2v10L22 37a2.8 2.8 0 0 1-4 0l-7-7a2.8 2.8 0 0 1 0-4Z" fill="var(--ic-fill)" transform="rotate(0)" />
        <S as="circle" cx="33" cy="14" r="2.2" fill="#fffaf0" at={0.3} />
        <D d="m19 26 7-7M19.5 20.5h.01M25.5 25.5h.01" stroke="currentColor" strokeWidth={2.2} at={0.5} />
      </g>
    </IconBase>
  );
}

/* ───────────── Search — lens glints, magnifier wanders ───────────── */
export function SearchIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-grind" style={origin(21, 21)}>
        <S as="circle" cx="21" cy="21" r="12" fill="var(--ic-soft)" />
        <D d="m30 30 10 10" strokeWidth={3} at={0.3} />
        <g className="idle i-glint">
          <D d="M15 18a7 7 0 0 1 5-4" stroke="#fff" strokeWidth={2} at={0.5} />
        </g>
      </g>
    </IconBase>
  );
}

/* ───────────── Order bag — gentle sway ───────────── */
export function BagIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-sway" style={origin(24, 8)}>
        <D d="M17 15v-3a7 7 0 0 1 14 0v3" />
        <S d="M9 15h30l-2 25a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3Z" fill="var(--ic-fill)" at={0.15} />
        <D d="M24 24v9M19.5 28.5h9" stroke="var(--ic-accent)" strokeWidth={2.2} at={0.45} />
      </g>
    </IconBase>
  );
}

/* ───────────── Star — twinkles ───────────── */
export function StarIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-twinkle">
        <S d="m24 5 5.9 12 13.1 1.9-9.5 9.3 2.3 13.1L24 35l-11.8 6.3 2.3-13.1L5 18.9 18.1 17Z" fill="var(--ic-accent)" stroke="var(--ic-accent)" />
      </g>
    </IconBase>
  );
}

/* ───────────── Map pin — bounces with a squashing shadow ───────────── */
export function MapPinIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-shadow">
        <F as="ellipse" cx="24" cy="43" rx="8" ry="2" fill="currentColor" fillOpacity={0.25} />
      </g>
      <g className="idle i-bounce">
        <S d="M24 40s-13-12-13-22a13 13 0 0 1 26 0c0 10-13 22-13 22Z" fill="var(--ic-soft)" />
        <S as="circle" cx="24" cy="18" r="5" fill="var(--ic-accent)" at={0.4} />
      </g>
    </IconBase>
  );
}

/* ───────────── Mail — letter peeks out ───────────── */
export function MailIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-peek">
        <S as="rect" x="13" y="9" width="22" height="18" rx="1.5" fill="#fffaf0" />
        <D d="M17 15h14M17 20h9" stroke="var(--ic-accent)" at={0.3} />
      </g>
      <S d="M6 19h36v20a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="var(--ic-fill)" at={0.15} />
      <D d="m6 20 18 12 18-12" at={0.35} />
    </IconBase>
  );
}

/* ───────────── Blister strip — a tablet pops ───────────── */
export function BlisterIcon(p: IconProps) {
  const pos = [
    [16, 16],
    [32, 16],
    [16, 32],
    [32, 32],
  ];
  return (
    <IconBase {...p}>
      <S as="rect" x="7" y="7" width="34" height="34" rx="6" fill="#eef0ee" />
      {pos.map(([x, y], i) => (
        <g key={i} className={i === 1 ? "idle i-pop" : undefined}>
          <S as="circle" cx={x} cy={y} r="5" fill={i === 1 ? "var(--ic-accent)" : "#fffaf0"} at={0.2 + i * 0.08} />
          <D d={`M${x - 2.5} ${y}h5`} strokeWidth={1.1} at={0.4 + i * 0.08} />
        </g>
      ))}
    </IconBase>
  );
}

/* ───────────── Thermometer — reading rises ───────────── */
export function ThermometerIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <S d="M20 30V9a4 4 0 0 1 8 0v21a8 8 0 1 1-8 0Z" fill="#fffaf0" />
      <g className="idle i-rise">
        <F d="M22.5 34V16h3v18Z" fill="#b8402f" />
      </g>
      <S as="circle" cx="24" cy="36" r="4.4" fill="#b8402f" stroke="none" at={0.2} />
      <D d="M30 12h4M30 18h3M30 24h4" stroke="var(--ic-accent)" at={0.4} />
    </IconBase>
  );
}

/* ───────────── Leaf (ayurvedic accent) — sways ───────────── */
export function LeafIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-sway" style={origin(14, 40)}>
        <S d="M14 40C10 24 20 9 41 7c1 21-12 33-27 33Z" fill="var(--ic-soft)" />
        <D d="M14 40c6-11 13-19 22-26M22 30h7M19 23l1 7" at={0.4} />
      </g>
    </IconBase>
  );
}

/* ───────────── Quote mark — floats ───────────── */
export function QuoteIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <g className="idle i-float">
        <S d="M8 28c0-9 4-15 12-18l1.5 3c-4 2-6 5-6 9h5v12H8Zm19 0c0-9 4-15 12-18l1.5 3c-4 2-6 5-6 9h5v12H27Z" fill="var(--ic-fill)" stroke="var(--ic-accent)" />
      </g>
    </IconBase>
  );
}

/* ───────────── Social icons (generic marks) — spin-pop on hover ───────────── */
export function InstagramIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24">
      <g className="social-ico idle">
        <D as="rect" x="3" y="3" width="18" height="18" rx="5" />
        <D as="circle" cx="12" cy="12" r="4" at={0.2} />
        <F as="circle" cx="17.3" cy="6.7" r="1.1" fill="currentColor" at={0.3} />
      </g>
    </IconBase>
  );
}
export function FacebookIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24">
      <g className="social-ico idle">
        <D as="rect" x="3" y="3" width="18" height="18" rx="5" />
        <D d="M15 8h-1.6A2.4 2.4 0 0 0 11 10.4V21M9 13h5" at={0.2} />
      </g>
    </IconBase>
  );
}
export function ReviewIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24">
      <g className="social-ico idle">
        <D d="M4 5h16v11H9l-5 4Z" />
        <D d="m12 7.6 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2-1.6-1.5 2.2-.3Z" at={0.25} />
      </g>
    </IconBase>
  );
}

/* ───────────── Small UI icons (each still draws in + has motion) ───────────── */
export function ChevronIcon({ dir = "right", ...p }: IconProps & { dir?: "left" | "right" | "down" }) {
  const r = dir === "left" ? 180 : dir === "down" ? 90 : 0;
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <g transform={`rotate(${r} 12 12)`}>
        <g className="idle i-nudge">
          <D d="m9 5 7 7-7 7" />
        </g>
      </g>
    </IconBase>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <D d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

export function MinusIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <D d="M5 12h14" />
    </IconBase>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <D d="M6 6l12 12" />
      <D d="M18 6 6 18" at={0.15} />
    </IconBase>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2.4}>
      <D d="m5 12.5 4.5 4.5L19 7.5" />
    </IconBase>
  );
}

export function ArrowUpIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <g className="idle i-bounce">
        <D d="M12 19V6m-6 6 6-6 6 6" />
      </g>
    </IconBase>
  );
}

export function MenuIcon({ open = false, ...p }: IconProps & { open?: boolean }) {
  return (
    <IconBase {...p} viewBox="0 0 24 24" strokeWidth={p.strokeWidth ?? 2}>
      <g style={{ ...origin(12, 12), transition: "transform .35s cubic-bezier(.34,1.56,.64,1)", transform: open ? "rotate(45deg) translateY(0)" : "translateY(-5px)" }}>
        <D d="M4 12h16" />
      </g>
      <g style={{ transition: "opacity .2s", opacity: open ? 0 : 1 }}>
        <D d="M4 12h16" at={0.1} />
      </g>
      <g style={{ ...origin(12, 12), transition: "transform .35s cubic-bezier(.34,1.56,.64,1)", transform: open ? "rotate(-45deg)" : "translateY(5px)" }}>
        <D d="M4 12h10" at={0.2} />
      </g>
    </IconBase>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <IconBase {...p} viewBox="0 0 24 24">
      <g className="idle i-peek" style={origin(12, 6)}>
        <D d="M4 6h16M9.5 6V4h5v2" />
      </g>
      <D d="M6 6.5 7 20h10l1-13.5" at={0.15} />
    </IconBase>
  );
}

export function CameraIcon(p: IconProps) {
  return (
    <IconBase {...p}>
      <S d="M6 15a3 3 0 0 1 3-3h6l3-4h12l3 4h6a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3Z" fill="var(--ic-fill)" />
      <g className="idle i-pulse">
        <S as="circle" cx="24" cy="25" r="8" fill="#fffaf0" at={0.3} />
        <F as="circle" cx="24" cy="25" r="3.4" fill="var(--ic-accent)" at={0.5} />
      </g>
      <g className="idle i-blink">
        <F as="circle" cx="36.5" cy="17" r="1.4" fill="var(--ic-accent)" at={0.5} />
      </g>
    </IconBase>
  );
}
