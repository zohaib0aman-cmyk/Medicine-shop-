"use client";

import { motion } from "framer-motion";
import { useActionState, useEffect, useState } from "react";
import { CapsuleIcon, CrossIcon, MortarIcon, ShieldIcon } from "@/components/icons";
import { EyeIcon, EyeOffIcon, LockIcon } from "@/components/icons/admin";
import { Shake } from "@/components/admin/ui";
import { loginAction } from "../actions/auth";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, null as null | { error?: string; locked?: boolean; email?: string });
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(0);
  useEffect(() => {
    if (state?.error) setShake((s) => s + 1);
  }, [state]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-emerald-900 text-cream-100 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(201,162,75,.22),transparent_60%)]" />
        <div className="absolute inset-10 rounded-t-[999px] rounded-b-[32px] border border-gold/30" />
        <div className="relative flex h-full flex-col justify-between p-14">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 text-gold">
              <CrossIcon size={28} eager />
            </span>
            <span className="font-serif text-2xl">A.D Pharma</span>
          </div>
          <div className="relative mx-auto grid h-64 w-64 place-items-center">
            <div className="float-slow absolute left-0 top-6 w-20 text-gold-300"><CapsuleIcon size="100%" eager delay={0.3} /></div>
            <div className="float-mid absolute bottom-2 right-0 w-24 text-gold-300"><MortarIcon size="100%" eager delay={0.5} /></div>
            <div className="float-fast w-28 text-gold"><ShieldIcon size="100%" eager delay={0.4} /></div>
          </div>
          <div>
            <p className="font-serif text-4xl leading-tight">The dispensary, <em className="text-gold-300">in order.</em></p>
            <p className="mt-3 max-w-sm text-[14px] text-cream-200/70">Orders, prescriptions, stock and expiry — one quiet, careful place for the whole team.</p>
          </div>
        </div>
      </aside>

      <main className="grid place-items-center px-5 py-12">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }} className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 bg-emerald-900 text-gold">
              <CrossIcon size={26} eager />
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-a-gold">Staff only</p>
          <h1 className="mt-2 font-serif text-4xl text-a-text">Welcome back</h1>
          <div className="mt-3 h-px w-24 bg-gradient-to-r from-a-gold to-transparent" />
          <Shake trigger={shake}>
            <form action={action} className="mt-8 grid gap-4">
              <input type="hidden" name="next" value={next} />
              <label className="a-label">
                Email
                <input name="email" type="email" required autoComplete="username" defaultValue={state?.email ?? ""} key={state?.email ?? "e"} className="a-input" aria-invalid={!!state?.error || undefined} />
              </label>
              <label className="a-label">
                Password
                <span className="relative">
                  <input name="password" type={show ? "text" : "password"} required autoComplete="current-password" className="a-input !pr-12" aria-invalid={!!state?.error || undefined} />
                  <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-a-muted hover:bg-a-raised" aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOffIcon size={18} eager /> : <EyeIcon size={18} eager />}
                  </button>
                </span>
              </label>
              {state?.error ? (
                <p role="alert" className={`rounded-xl px-3 py-2 text-[13px] ${state.locked ? "bg-a-warn-bg text-a-warn" : "bg-a-danger-bg text-a-danger"}`}>
                  {state.error}
                </p>
              ) : null}
              <button disabled={pending} className="a-btn a-btn-primary mt-2 !h-12 text-[15px]">
                <LockIcon size={18} eager /> {pending ? "Signing in…" : "Sign in"}
              </button>
              <p className="text-center text-[12px] text-a-muted">Sessions expire after 2 hours of inactivity.</p>
            </form>
          </Shake>
        </motion.div>
      </main>
    </div>
  );
}
