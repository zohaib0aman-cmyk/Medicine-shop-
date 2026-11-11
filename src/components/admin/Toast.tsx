"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckIcon, CloseIcon } from "../icons";
import { AlertIcon, BellIcon } from "../icons/admin";

type Tone = "success" | "error" | "info" | "order";
type Toast = { id: number; tone: Tone; title: string; body?: string };
const Ctx = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const n = useRef(0);
  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++n.current;
    setToasts((all) => [...all.slice(-3), { ...t, id }]);
    setTimeout(() => dismiss(id), t.tone === "error" ? 6000 : 3800);
  }, []);

  return (
    <Ctx.Provider value={push}>
      {children}
      <div aria-live="polite" className="admin-no-print pointer-events-none fixed inset-x-3 top-3 z-[90] flex flex-col items-end gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-[360px]">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              role={t.tone === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border p-3.5 pr-2 shadow-[0_18px_40px_-16px_rgba(0,0,0,.35)] ${
                t.tone === "error" ? "a-shake border-a-danger/30 bg-a-danger-bg text-a-text" : "border-a-gold/40 bg-a-surface text-a-text"
              }`}
            >
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${t.tone === "error" ? "bg-a-danger text-white" : t.tone === "order" ? "bg-gold text-emerald-950" : "bg-a-primary text-a-on-primary"}`}>
                {t.tone === "error" ? <AlertIcon size={18} eager /> : t.tone === "order" ? <BellIcon size={18} eager /> : <CheckIcon size={18} eager />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold">{t.title}</p>
                {t.body ? <p className="mt-0.5 text-[12.5px] text-a-muted">{t.body}</p> : null}
              </div>
              <button aria-label="Dismiss" onClick={() => dismiss(t.id)} className="grid h-7 w-7 place-items-center rounded-full text-a-muted hover:bg-a-raised">
                <CloseIcon size={14} eager />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
