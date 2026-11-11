"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { OrderProvider } from "@/lib/order";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <OrderProvider>{children}</OrderProvider>
    </MotionConfig>
  );
}
