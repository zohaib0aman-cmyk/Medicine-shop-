"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { productById, type CategoryId } from "@/data/catalog";

type Prescription = { name: string; url: string; isImage: boolean } | null;

type OrderState = {
  items: Record<string, number>;
  count: number;
  prescription: Prescription;
  query: string;
  category: CategoryId | "all";
  drawerOpen: boolean;
  toast: { id: number; msg: string; tone: "ok" | "warn" } | null;
  /** returns false when blocked (Rx item without prescription) */
  add: (id: string) => boolean;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setPrescription: (file: File | null) => void;
  setQuery: (q: string) => void;
  setCategory: (c: CategoryId | "all") => void;
  setDrawerOpen: (o: boolean) => void;
  notify: (msg: string, tone?: "ok" | "warn") => void;
  rxBlocked: boolean;
};

const Ctx = createContext<OrderState | null>(null);
const KEY = "adpharma-order-v1";

export function OrderProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Record<string, number>>({});
  const [prescription, setRx] = useState<Prescription>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<OrderState["toast"]>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const notify = useCallback((msg: string, tone: "ok" | "warn" = "ok") => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), msg, tone });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const add = useCallback(
    (id: string) => {
      const p = productById(id);
      if (!p) return false;
      if (p.rx && !prescription) {
        notify("Prescription required — please upload it first.", "warn");
        document.getElementById("prescription")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return false;
      }
      setItems((s) => ({ ...s, [id]: (s[id] ?? 0) + 1 }));
      notify(`Added: ${p.name}`);
      return true;
    },
    [prescription, notify],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((s) => {
      const n = { ...s };
      if (qty <= 0) delete n[id];
      else n[id] = Math.min(qty, 99);
      return n;
    });
  }, []);

  const setPrescription = useCallback(
    (file: File | null) => {
      setRx((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return file ? { name: file.name, url: URL.createObjectURL(file), isImage: file.type.startsWith("image/") } : null;
      });
      if (file) notify("Prescription added — Rx items unlocked.");
    },
    [notify],
  );

  const count = Object.values(items).reduce((a, b) => a + b, 0);
  const rxBlocked = !prescription && Object.keys(items).some((id) => productById(id)?.rx);

  const value = useMemo<OrderState>(
    () => ({
      items, count, prescription, query, category, drawerOpen, toast, rxBlocked,
      add, setQty, clear: () => setItems({}), setPrescription, setQuery, setCategory, setDrawerOpen, notify,
    }),
    [items, count, prescription, query, category, drawerOpen, toast, rxBlocked, add, setQty, setPrescription, notify],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrder() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOrder must be used inside <OrderProvider>");
  return c;
}
