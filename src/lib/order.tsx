"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useStore } from "./store";
import type { StoreProduct } from "./types";

type Prescription = { name: string; url: string; isImage: boolean; file: File } | null;

type OrderState = {
  items: Record<string, number>;
  lines: { p: StoreProduct; qty: number }[];
  count: number;
  subtotal: number;
  prescription: Prescription;
  query: string;
  category: string;
  drawerOpen: boolean;
  toast: { id: number; msg: string; tone: "ok" | "warn" } | null;
  /** returns false when blocked (Rx item without prescription, or out of stock) */
  add: (id: string) => boolean;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  setPrescription: (file: File | null) => void;
  setQuery: (q: string) => void;
  setCategory: (c: string) => void;
  setDrawerOpen: (o: boolean) => void;
  notify: (msg: string, tone?: "ok" | "warn") => void;
  productById: (id: string) => StoreProduct | undefined;
  rxBlocked: boolean;
};

const Ctx = createContext<OrderState | null>(null);
const KEY = "adpharma-order-v2";

export function OrderProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const byId = useMemo(() => new Map(store.products.map((p) => [p.id, p])), [store.products]);
  const productById = useCallback((id: string) => byId.get(id), [byId]);

  const [items, setItems] = useState<Record<string, number>>({});
  const [prescription, setRx] = useState<Prescription>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState<OrderState["toast"]>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, number>;
        // drop products that no longer exist or went out of stock
        setItems(Object.fromEntries(Object.entries(saved).filter(([id, q]) => byId.get(id)?.inStock && q > 0)));
      }
    } catch {}
    loaded.current = true;
  }, [byId]);
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
      const p = byId.get(id);
      if (!p) return false;
      if (!p.inStock) {
        notify("Sorry, this is out of stock right now.", "warn");
        return false;
      }
      if (p.rx && !prescription) {
        notify("Prescription required — please upload it first.", "warn");
        document.getElementById("prescription")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return false;
      }
      setItems((s) => ({ ...s, [id]: Math.min((s[id] ?? 0) + 1, 99) }));
      notify(`Added: ${p.name}`);
      return true;
    },
    [byId, prescription, notify],
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
        return file ? { name: file.name, url: URL.createObjectURL(file), isImage: file.type.startsWith("image/"), file } : null;
      });
      if (file) notify("Prescription added — Rx items unlocked.");
    },
    [notify],
  );

  const lines = Object.entries(items)
    .map(([id, qty]) => ({ p: byId.get(id)!, qty }))
    .filter((l) => l.p);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.p.price * l.qty, 0);
  const rxBlocked = !prescription && lines.some((l) => l.p.rx);

  const value: OrderState = {
    items, lines, count, subtotal, prescription, query, category, drawerOpen, toast, rxBlocked, productById,
    add, setQty, clear: () => setItems({}), setPrescription, setQuery, setCategory, setDrawerOpen, notify,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOrder() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useOrder must be used inside <OrderProvider>");
  return c;
}
