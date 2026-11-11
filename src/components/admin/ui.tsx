"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  createContext, useCallback, useContext, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { CheckIcon, CloseIcon } from "../icons";
import { AlertIcon } from "../icons/admin";

/* ───────────── Layout bits ───────────── */
export function PageHeader({ title, subtitle, actions, eyebrow }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-a-gold">{eyebrow}</div> : null}
        <h1 className="mt-1 font-serif text-[1.9rem] leading-tight text-a-text sm:text-[2.3rem]">{title}</h1>
        <div className="mt-2 h-px w-28 bg-gradient-to-r from-a-gold to-transparent" />
        {subtitle ? <p className="mt-2 max-w-2xl text-[13.5px] text-a-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ children, className = "", title, action, pad = true }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode; pad?: boolean }) {
  return (
    <section className={`a-card ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-a-border/70 px-5 py-4">
          <h2 className="font-serif text-[1.15rem] text-a-text">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`a-skel ${className}`} aria-hidden />;
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      {icon ? <span className="mb-4 grid h-16 w-16 place-items-center rounded-full border border-a-gold/40 bg-a-raised text-a-primary">{icon}</span> : null}
      <p className="font-serif text-xl text-a-text">{title}</p>
      {body ? <p className="mt-1 max-w-sm text-[13.5px] text-a-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const TONES = {
  neutral: "bg-a-raised text-a-muted",
  green: "bg-a-ok-bg text-a-ok",
  gold: "bg-a-warn-bg text-a-warn",
  red: "bg-a-danger-bg text-a-danger",
  blue: "bg-[#e6eef8] text-[#25507e] [[data-theme=dark]_&]:bg-[#1b2c40] [[data-theme=dark]_&]:text-[#9cc2ec]",
  primary: "bg-a-primary text-a-on-primary",
} as const;
export type Tone = keyof typeof TONES;

export function Pill({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONES[tone]} ${className}`}>{children}</span>;
}

/* ───────────── Buttons ───────────── */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "gold" | "ghost" | "danger" | "wa"; size?: "sm" | "md"; icon?: boolean };

function ripple(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const s = document.createElement("span");
  s.className = "ripple";
  s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  s.addEventListener("animationend", () => s.remove());
  el.appendChild(s);
}

export function Btn({ variant = "ghost", size = "md", icon, className = "", onPointerDown, type = "button", ...rest }: BtnProps) {
  return (
    <button
      type={type}
      className={`a-btn a-btn-${variant} ${size === "sm" ? "a-btn-sm" : ""} ${icon ? "a-btn-icon" : ""} ${className}`}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      {...rest}
    />
  );
}

export function BtnLink({ variant = "ghost", size = "md", className = "", children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: BtnProps["variant"]; size?: "sm" | "md" }) {
  return (
    <a className={`a-btn a-btn-${variant} ${size === "sm" ? "a-btn-sm" : ""} ${className}`} onPointerDown={ripple} {...rest}>
      {children}
    </a>
  );
}

/** Submit button that shows a spinner, then a self-drawing check on success. */
export function SaveButton({ pending, status, children = "Save changes", variant = "primary", className = "", ...rest }: BtnProps & { pending: boolean; status: "idle" | "success" | "error" }) {
  return (
    <Btn type="submit" variant={variant} disabled={pending || rest.disabled} className={`min-w-[140px] ${className}`} {...rest}>
      <AnimatePresence mode="wait" initial={false}>
        {pending ? (
          <motion.span key="p" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" /> Saving…
          </motion.span>
        ) : status === "success" ? (
          <motion.span key="s" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="flex items-center gap-1.5">
            <CheckIcon size={18} eager /> Saved
          </motion.span>
        ) : (
          <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Btn>
  );
}

/** Wrap a form: it shakes whenever `trigger` changes (an error came back). */
export function Shake({ trigger, children, className = "" }: { trigger: number; children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    const el = ref.current;
    el.classList.remove("a-shake");
    void el.offsetWidth;
    el.classList.add("a-shake");
  }, [trigger]);
  return (
    <div ref={ref} className={className} onAnimationEnd={(e) => e.currentTarget === e.target && e.currentTarget.classList.remove("a-shake")}>
      {children}
    </div>
  );
}

/* ───────────── Form fields ───────────── */
type FieldBase = { label: ReactNode; error?: string; hint?: ReactNode; className?: string };

export function Field({ label, error, hint, className = "", ...rest }: FieldBase & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <label htmlFor={rest.id ?? id} className={`a-label ${className}`}>
      <span>{label}</span>
      <input id={rest.id ?? id} className="a-input" aria-invalid={!!error || undefined} {...rest} />
      {error ? <span className="text-[12px] font-medium text-a-danger">{error}</span> : hint ? <span className="text-[11.5px] font-normal text-a-muted">{hint}</span> : null}
    </label>
  );
}

export function TextArea({ label, error, hint, className = "", ...rest }: FieldBase & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <label htmlFor={id} className={`a-label ${className}`}>
      <span>{label}</span>
      <textarea id={id} className="a-input" aria-invalid={!!error || undefined} rows={3} {...rest} />
      {error ? <span className="text-[12px] font-medium text-a-danger">{error}</span> : hint ? <span className="text-[11.5px] font-normal text-a-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({ label, error, hint, className = "", children, ...rest }: FieldBase & SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <label htmlFor={id} className={`a-label ${className}`}>
      <span>{label}</span>
      <select id={id} className="a-input appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat !pr-9" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23C9A24B' stroke-width='1.6'/%3E%3C/svg%3E\")" }} aria-invalid={!!error || undefined} {...rest}>
        {children}
      </select>
      {error ? <span className="text-[12px] font-medium text-a-danger">{error}</span> : hint ? <span className="text-[11.5px] font-normal text-a-muted">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ name, label, defaultChecked, checked, onChange, hint }: { name?: string; label: ReactNode; defaultChecked?: boolean; checked?: boolean; onChange?: (v: boolean) => void; hint?: ReactNode }) {
  const [inner, setInner] = useState(!!defaultChecked);
  const on = checked ?? inner;
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-a-border bg-a-surface px-4 py-3">
      <span className="grid gap-0.5">
        <span className="text-[13.5px] font-semibold text-a-text">{label}</span>
        {hint ? <span className="text-[12px] text-a-muted">{hint}</span> : null}
      </span>
      <input
        type="checkbox"
        name={name}
        className="sr-only"
        checked={on}
        onChange={(e) => {
          setInner(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      {name && !on ? <input type="hidden" name={name} value="false" /> : null}
      <span aria-hidden className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-a-primary" : "bg-a-border"}`}>
        <motion.span className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow" animate={{ x: on ? 22 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 30 }} />
      </span>
    </label>
  );
}

/* ───────────── Tabs with sliding gold underline ───────────── */
export function Tabs<T extends string>({ tabs, value, onChange, id }: { tabs: { value: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; id: string }) {
  return (
    <div role="tablist" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button key={t.value} role="tab" aria-selected={active} onClick={() => onChange(t.value)} className={`relative shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${active ? "text-a-on-primary" : "text-a-muted hover:text-a-text"}`}>
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 rounded-full bg-a-primary" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative flex items-center gap-1.5">
              {t.label}
              {t.count != null ? <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-white/20" : "bg-a-raised"}`}>{t.count}</span> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ───────────── Modal & confirm ───────────── */
export function Modal({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid items-end justify-items-center sm:place-items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-[#06130e]/55 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={`relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-a-gold/30 bg-a-surface shadow-2xl sm:rounded-3xl ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-a-border/70 bg-a-surface/95 px-5 py-4 backdrop-blur">
              <h2 className="font-serif text-xl text-a-text">{title}</h2>
              <Btn icon variant="ghost" aria-label="Close" onClick={onClose}>
                <CloseIcon size={16} eager />
              </Btn>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type ConfirmOpts = { title: string; body?: ReactNode; confirm?: string; danger?: boolean; requireText?: string };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);

/** Every delete goes through this dialog. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [typed, setTyped] = useState("");
  const resolver = useRef<(v: boolean) => void>(undefined);
  const ask = useCallback((o: ConfirmOpts) => {
    setTyped("");
    setOpts(o);
    return new Promise<boolean>((res) => (resolver.current = res));
  }, []);
  const close = (v: boolean) => {
    resolver.current?.(v);
    setOpts(null);
  };
  return (
    <ConfirmCtx.Provider value={ask}>
      {children}
      <Modal open={!!opts} onClose={() => close(false)} title={opts?.title ?? ""}>
        <div className="flex gap-4">
          {opts?.danger !== false && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-a-danger-bg text-a-danger">
              <AlertIcon size={24} eager />
            </span>
          )}
          <div className="grid gap-3 text-[14px] text-a-muted">
            {opts?.body}
            {opts?.requireText ? (
              <Field label={<>Type <strong className="text-a-text">{opts.requireText}</strong> to confirm</>} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Btn onClick={() => close(false)}>Cancel</Btn>
          <Btn variant={opts?.danger === false ? "primary" : "danger"} disabled={!!opts?.requireText && typed !== opts.requireText} onClick={() => close(true)} autoFocus={!opts?.requireText}>
            {opts?.confirm ?? "Delete"}
          </Btn>
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);
