"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Storefront } from "./types";

const Ctx = createContext<Storefront | null>(null);

export function StoreProvider({ value, children }: { value: Storefront; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside <StoreProvider>");
  return s;
}
