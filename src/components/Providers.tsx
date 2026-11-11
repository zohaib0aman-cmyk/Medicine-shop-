"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { OrderProvider } from "@/lib/order";
import { StoreProvider } from "@/lib/store";
import type { Storefront } from "@/lib/types";

export function Providers({ store, children }: { store: Storefront; children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <StoreProvider value={store}>
        <OrderProvider>{children}</OrderProvider>
      </StoreProvider>
    </MotionConfig>
  );
}
