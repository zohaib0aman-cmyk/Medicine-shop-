"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { useToast } from "./Toast";

type Result<T> = { ok: true; message?: string; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Runs a server action with toast feedback.
 * state: idle → pending → success (check draws) | error (shake), then back to idle.
 */
export function useAction<A extends unknown[], T>(action: (...a: A) => Promise<Result<T>>, opts: { refresh?: boolean; successToast?: boolean } = {}) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);

  const runAction = useCallback(
    (...args: A) =>
      new Promise<Result<T>>((resolve) => {
        start(async () => {
          let r: Result<T>;
          try {
            r = await action(...args);
          } catch {
            r = { ok: false, error: "Network error — please check your connection." };
          }
          if (r.ok) {
            setFieldErrors({});
            setStatus("success");
            if (opts.successToast !== false && r.message) toast({ tone: "success", title: r.message });
            if (opts.refresh !== false) router.refresh();
            setTimeout(() => setStatus("idle"), 1600);
          } else {
            setFieldErrors(r.fieldErrors ?? {});
            setStatus("error");
            setShakeKey((k) => k + 1);
            toast({ tone: "error", title: r.error });
            if (r.error.includes("session has expired")) setTimeout(() => router.push("/admin/login"), 1200);
            setTimeout(() => setStatus("idle"), 600);
          }
          resolve(r);
        });
      }),
    [action, opts.refresh, opts.successToast, router, toast],
  );

  return { run: runAction, pending, status, fieldErrors, shakeKey };
}
