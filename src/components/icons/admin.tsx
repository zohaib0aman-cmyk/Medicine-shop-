"use client";

import { D, F, IconBase, S, origin, type IconProps } from "./IconBase";

/* Admin icons — same system as the storefront: outline draws in, fill fades, then a subtle idle loop.
   24×24 grid, drawn at the IconBase default stroke. */
const V = "0 0 24 24";
const P = (p: IconProps) => ({ viewBox: V, strokeWidth: p.strokeWidth ?? 1.7, ...p });

export function GridIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S as="rect" x="3" y="3" width="7.5" height="7.5" rx="2" />
      <g className="idle i-pop">
        <S as="rect" x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="var(--ic-accent)" at={0.1} />
      </g>
      <S as="rect" x="3" y="13.5" width="7.5" height="7.5" rx="2" at={0.2} />
      <S as="rect" x="13.5" y="13.5" width="7.5" height="7.5" rx="2" at={0.3} />
    </IconBase>
  );
}

export function ReceiptIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M5 3h14v18l-2.3-1.5L14.3 21 12 19.5 9.7 21l-2.4-1.5L5 21Z" />
      <g className="idle i-write">
        <D d="M8.5 8h7" at={0.3} />
      </g>
      <g className="idle i-write" style={{ animationDelay: "1.5s" }}>
        <D d="M8.5 12h7" at={0.4} />
      </g>
      <D d="M8.5 16h4" stroke="var(--ic-accent)" at={0.5} />
    </IconBase>
  );
}

export function BoxIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-peek" style={origin(12, 8)}>
        <D d="M3.5 7.5 12 3l8.5 4.5L12 12Z" at={0.15} />
      </g>
      <S d="M3.5 7.5V17L12 21.5 20.5 17V7.5L12 12Z" />
      <D d="M12 12v9.5" at={0.3} />
      <D d="m7.8 5.3 8.4 4.5" stroke="var(--ic-accent)" at={0.45} />
    </IconBase>
  );
}

export function LayersIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-float" style={{ animationDelay: ".4s" }}>
        <D d="m3 16.5 9 4.5 9-4.5" at={0.3} />
      </g>
      <g className="idle i-float" style={{ animationDelay: ".2s" }}>
        <D d="m3 12 9 4.5 9-4.5" at={0.15} />
      </g>
      <g className="idle i-float">
        <S d="M12 3 3 7.5 12 12l9-4.5Z" fill="var(--ic-accent)" />
      </g>
    </IconBase>
  );
}

export function UsersIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-wobble">
        <S as="circle" cx="9" cy="8" r="3.5" />
      </g>
      <S d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6Z" at={0.15} />
      <g className="idle i-pop" style={{ animationDelay: ".5s" }}>
        <S as="circle" cx="17" cy="9" r="2.6" fill="var(--ic-accent)" at={0.3} />
        <D d="M17.5 14.2c2.4.4 4 2.3 4 4.8" at={0.4} />
      </g>
    </IconBase>
  );
}

export function TicketIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-swing" style={origin(12, 4)}>
        <S d="M3 7.5A1.5 1.5 0 0 1 4.5 6h15A1.5 1.5 0 0 1 21 7.5V10a2 2 0 0 0 0 4v2.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 16.5V14a2 2 0 0 0 0-4Z" />
        <D d="M14.5 6v12" strokeDasharray="1.5 2" at={0.3} />
        <D d="m7 14.5 4-5M7.3 10h.01M10.7 14h.01" stroke="var(--ic-accent)" strokeWidth={2} at={0.4} />
      </g>
    </IconBase>
  );
}

export function PenIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <D d="M4 20h7" stroke="var(--ic-accent)" at={0.5} />
      <g className="idle i-grind" style={origin(17, 7)}>
        <S d="m15.5 4.5 4 4L9 19l-5 1 1-5Z" />
        <D d="m13.5 6.5 4 4" at={0.3} />
      </g>
    </IconBase>
  );
}

export function ChartIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <D d="M3 3v18h18" />
      <g className="idle i-rise" style={{ animationDelay: ".1s" }}>
        <S as="rect" x="6.5" y="12" width="3" height="6" rx="1" at={0.2} />
      </g>
      <g className="idle i-rise" style={{ animationDelay: ".5s" }}>
        <S as="rect" x="11.5" y="8" width="3" height="10" rx="1" fill="var(--ic-accent)" at={0.3} />
      </g>
      <g className="idle i-rise" style={{ animationDelay: ".9s" }}>
        <S as="rect" x="16.5" y="5" width="3" height="13" rx="1" at={0.4} />
      </g>
    </IconBase>
  );
}

export function StaffIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M12 2.5 19.5 5v6c0 5-3.3 8.6-7.5 10.5C7.8 19.6 4.5 16 4.5 11V5Z" />
      <g className="idle i-pulse">
        <S as="circle" cx="12" cy="9.5" r="2.4" fill="var(--ic-accent)" at={0.3} />
      </g>
      <D d="M8.2 16c.7-1.8 2.1-2.8 3.8-2.8s3.1 1 3.8 2.8" at={0.4} />
    </IconBase>
  );
}

export function GearIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle" style={{ ...origin(12, 12), animation: "i-spin 12s linear 1s infinite" }}>
        <S d="M10.3 2.8h3.4l.5 2.4 1.9.8 2-1.4 2.4 2.4-1.4 2 .8 1.9 2.4.5v3.4l-2.4.5-.8 1.9 1.4 2-2.4 2.4-2-1.4-1.9.8-.5 2.4h-3.4l-.5-2.4-1.9-.8-2 1.4-2.4-2.4 1.4-2-.8-1.9-2.4-.5v-3.4l2.4-.5.8-1.9-1.4-2 2.4-2.4 2 1.4 1.9-.8Z" />
        <S as="circle" cx="12" cy="12" r="3.2" fill="var(--ic-accent)" at={0.3} />
      </g>
    </IconBase>
  );
}

export function BellIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
      <g className="idle i-swing" style={origin(12, 18)}>
        <D d="M10 20.5a2 2 0 0 0 4 0" stroke="var(--ic-accent)" at={0.3} />
      </g>
      <D d="M12 3v2" at={0.2} />
    </IconBase>
  );
}

export function LogoutIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M14 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" />
      <g className="idle i-nudge">
        <D d="M10 12h10m-3-3.5L20.5 12 17 15.5" stroke="var(--ic-accent)" at={0.3} />
      </g>
    </IconBase>
  );
}

export function SunIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S as="circle" cx="12" cy="12" r="4" fill="var(--ic-accent)" />
      <g className="idle" style={{ ...origin(12, 12), animation: "i-spin 20s linear infinite" }}>
        <D d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" at={0.2} />
      </g>
    </IconBase>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-float-tilt">
        <S d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" fill="var(--ic-accent)" />
      </g>
      <g className="idle i-twinkle">
        <D d="M17 4v3M15.5 5.5h3" at={0.4} />
      </g>
    </IconBase>
  );
}

export function UserIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-wobble">
        <S as="circle" cx="12" cy="8.5" r="4" />
      </g>
      <S d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7Z" fill="var(--ic-accent)" at={0.2} />
    </IconBase>
  );
}

export function DownloadIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <D d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <g className="idle i-bounce" style={{ animationDuration: "2s" }}>
        <D d="M12 3.5v11m-4-4 4 4 4-4" stroke="var(--ic-accent)" strokeWidth={2} at={0.2} />
      </g>
    </IconBase>
  );
}

export function UploadArrowIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <D d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <g className="idle i-up">
        <D d="M12 15V4m-4 4 4-4 4 4" stroke="var(--ic-accent)" strokeWidth={2} at={0.2} />
      </g>
    </IconBase>
  );
}

export function PrinterIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M7 9V3h10v6" />
      <S as="rect" x="3" y="9" width="18" height="8" rx="2" at={0.15} />
      <g className="idle i-peek" style={{ animationDirection: "reverse" }}>
        <S d="M7 14h10v7H7Z" fill="var(--ic-accent)" at={0.3} />
      </g>
      <F as="circle" cx="17.5" cy="12" r="1" fill="currentColor" at={0.4} />
    </IconBase>
  );
}

export function EditIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-wobble">
        <S d="m16 3.5 4.5 4.5L9 19.5l-5.5 1 1-5.5Z" fill="var(--ic-accent)" />
      </g>
    </IconBase>
  );
}

export function EyeIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <g className="idle i-nudge">
        <S as="circle" cx="12" cy="12" r="3" fill="var(--ic-accent)" at={0.3} />
      </g>
    </IconBase>
  );
}

export function EyeOffIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <D as="circle" cx="12" cy="12" r="3" at={0.2} />
      <g className="idle i-blink">
        <D d="M4 4l16 16" stroke="var(--ic-accent)" strokeWidth={2} at={0.4} />
      </g>
    </IconBase>
  );
}

export function DragIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-float">
        {[6, 12, 18].map((y, i) => (
          <g key={y}>
            <F as="circle" cx="9" cy={y} r="1.5" fill="currentColor" at={i * 0.08} />
            <F as="circle" cx="15" cy={y} r="1.5" fill="currentColor" at={i * 0.08 + 0.04} />
          </g>
        ))}
      </g>
    </IconBase>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-pulse">
        <S d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" fill="var(--ic-fill)" />
      </g>
      <D d="M12 9v4.5" strokeWidth={2} at={0.3} />
      <F as="circle" cx="12" cy="17" r="1.1" fill="currentColor" at={0.4} />
    </IconBase>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S as="rect" x="3" y="5" width="18" height="16" rx="2.5" />
      <D d="M3 10h18M8 3v4M16 3v4" at={0.2} />
      <g className="idle i-pop">
        <S as="rect" x="13" y="13.5" width="4" height="4" rx="1" fill="var(--ic-accent)" stroke="var(--ic-accent)" at={0.35} />
      </g>
    </IconBase>
  );
}

export function ZoomIcon({ out = false, ...p }: IconProps & { out?: boolean }) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-grind" style={origin(10.5, 10.5)}>
        <S as="circle" cx="10.5" cy="10.5" r="6.5" />
        <D d="m15.5 15.5 5 5" strokeWidth={2.2} at={0.2} />
        <D d={out ? "M7.5 10.5h6" : "M7.5 10.5h6M10.5 7.5v6"} stroke="var(--ic-accent)" strokeWidth={2} at={0.35} />
      </g>
    </IconBase>
  );
}

export function RotateIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle" style={{ ...origin(12, 12), animation: "i-spin 6s linear 1s infinite" }}>
        <D d="M20 12a8 8 0 1 1-2.4-5.7" />
        <D d="M20 4v4.5h-4.5" stroke="var(--ic-accent)" strokeWidth={2} at={0.3} />
      </g>
    </IconBase>
  );
}

export function LinkIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-split-l">
        <D d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      </g>
      <g className="idle i-split-r">
        <D d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" stroke="var(--ic-accent)" at={0.2} />
      </g>
    </IconBase>
  );
}

export function ReplyIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-nudge" style={{ animationDirection: "reverse" }}>
        <D d="M9.5 6 4 11.5 9.5 17" stroke="var(--ic-accent)" strokeWidth={2} />
      </g>
      <D d="M4 11.5h9a7 7 0 0 1 7 7v1" at={0.2} />
    </IconBase>
  );
}

export function HistoryIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <D d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <D d="M3 3.5V8h4.5" at={0.2} />
      <g className="idle i-hand-m" style={origin(12, 12)}>
        <D d="M12 12V7.5" stroke="var(--ic-accent)" strokeWidth={2} at={0.3} />
      </g>
      <D d="M12 12l3 2" at={0.4} />
    </IconBase>
  );
}

export function RupeeIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-pulse">
        <S as="circle" cx="12" cy="12" r="9.5" />
        <D d="M8.5 7.5h7M8.5 10.5h7M11 7.5a3 3 0 0 1 0 6H8.5l5.5 4.5" stroke="var(--ic-accent)" strokeWidth={1.8} at={0.3} />
      </g>
    </IconBase>
  );
}

export function MoreIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      {[6, 12, 18].map((x, i) => (
        <g key={x} className="idle i-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
          <S as="circle" cx={x} cy="12" r="1.8" fill="currentColor" at={i * 0.08} />
        </g>
      ))}
    </IconBase>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-peek">
        <D d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" />
      </g>
      <S as="rect" x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="var(--ic-accent)" at={0.2} />
      <D d="M12 14.5v2.5" stroke="currentColor" strokeWidth={2} at={0.4} />
    </IconBase>
  );
}

export function FilterIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <S d="M3.5 5h17l-6.5 7.5V19l-4 2v-8.5Z" />
      <g className="idle i-drip">
        <F as="circle" cx="12" cy="9" r="1.3" fill="var(--ic-accent)" at={0.3} />
      </g>
    </IconBase>
  );
}

export function SparkIcon(p: IconProps) {
  return (
    <IconBase {...P(p)}>
      <g className="idle i-twinkle">
        <S d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7Z" fill="var(--ic-accent)" />
      </g>
      <g className="idle i-blink">
        <D d="M19 16v4M17 18h4" at={0.3} />
      </g>
    </IconBase>
  );
}

export function CollapseIcon({ collapsed = false, ...p }: IconProps & { collapsed?: boolean }) {
  return (
    <IconBase {...P(p)}>
      <S as="rect" x="3" y="4" width="18" height="16" rx="2.5" />
      <D d="M9 4v16" at={0.2} />
      <g style={{ ...origin(15, 12), transition: "transform .4s cubic-bezier(.34,1.56,.64,1)", transform: collapsed ? "rotate(180deg)" : "none" }}>
        <D d="m16.5 9.5-2.5 2.5 2.5 2.5" stroke="var(--ic-accent)" strokeWidth={2} at={0.3} />
      </g>
    </IconBase>
  );
}

export function VolumeIcon({ muted = false, ...p }: IconProps & { muted?: boolean }) {
  return (
    <IconBase {...P(p)}>
      <S d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="var(--ic-accent)" />
      {muted ? (
        <D d="m16 9.5 5 5m0-5-5 5" at={0.3} />
      ) : (
        <g className="idle i-waves" style={origin(14, 12)}>
          <D d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" at={0.3} />
        </g>
      )}
    </IconBase>
  );
}
