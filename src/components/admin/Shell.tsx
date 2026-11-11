"use client";

import { KeepForm } from "@/components/ui/Form";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CrossIcon } from "../icons";
import { BellIcon, CollapseIcon, LockIcon, LogoutIcon, MoonIcon, MoreIcon, SunIcon, UserIcon, VolumeIcon } from "../icons/admin";
import { SearchIcon } from "../icons";
import { NAV, isActive } from "./nav";
import { chime, unlockAudio } from "./sound";
import { useToast } from "./Toast";
import { Btn, Field, Modal, SaveButton, Shake } from "./ui";
import { useAction } from "./useAction";
import { ROLE_LABEL, type Module, type Role } from "@/lib/permissions";
import { changeOwnPassword, logoutAction } from "@/app/admin/actions/auth";
import { globalSearch, type SearchHit } from "@/app/admin/actions/search";
import { inr } from "@/lib/types";

type Me = { name: string; email: string; role: Role };
type Counts = { newOrders: number; pendingRx: number };

/* ───────────── Sidebar ───────────── */
function NavItem({ item, active, collapsed, badge, index }: { item: (typeof NAV)[number]; active: boolean; collapsed: boolean; badge?: number; index: number }) {
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold ${active ? "text-cream-50" : "text-cream-200/70 hover:text-cream-50"}`}
    >
      {active && (
        <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-white/[.07]" transition={{ type: "spring", stiffness: 380, damping: 32 }}>
          <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r-full bg-gold shadow-[0_0_12px_rgba(201,162,75,.8)]" />
        </motion.span>
      )}
      <motion.span className={`relative shrink-0 ${active ? "text-gold-300" : ""}`} whileHover={{ scale: 1.18, rotate: -6 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 500, damping: 10 }}>
        <Icon size={22} eager delay={0.1 + index * 0.06} />
      </motion.span>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className="relative truncate">
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {badge ? (
        <span className={`relative ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10.5px] font-bold text-emerald-950 ${collapsed ? "absolute right-1.5 top-1" : ""}`}>{badge > 99 ? "99+" : badge}</span>
      ) : null}
    </Link>
  );
}

function Sidebar({ modules, counts, collapsed, onToggle, shopName }: { modules: Module[]; counts: Counts; collapsed: boolean; onToggle: () => void; shopName: string }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => modules.includes(n.module));
  return (
    <motion.aside
      animate={{ width: collapsed ? 84 : 264 }}
      transition={{ type: "spring", stiffness: 300, damping: 32 }}
      className="admin-no-print sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-gold/20 bg-a-side text-cream-100 md:flex"
    >
      <div className="flex h-[72px] items-center gap-3 px-5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-gold/50 bg-emerald-900 text-gold">
          <CrossIcon size={22} eager />
        </span>
        {!collapsed && (
          <span className="min-w-0 leading-none">
            <span className="block truncate font-serif text-lg text-cream-50">{shopName}</span>
            <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.24em] text-gold-300">Admin</span>
          </span>
        )}
      </div>
      <div className="mx-5 h-px bg-gradient-to-r from-gold/50 to-transparent" />
      <LayoutGroup id="sidebar">
        <nav aria-label="Admin" className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <ul className="grid gap-1">
            {items.map((item, i) => (
              <li key={item.href}>
                <NavItem item={item} index={i} collapsed={collapsed} active={isActive(pathname, item.href)} badge={item.module === "orders" ? counts.newOrders : item.module === "prescriptions" ? counts.pendingRx : undefined} />
              </li>
            ))}
          </ul>
        </nav>
      </LayoutGroup>
      <div className="border-t border-gold/15 p-3">
        <button onClick={onToggle} className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[13px] text-cream-200/70 hover:bg-white/5 hover:text-cream-50" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <CollapseIcon size={20} eager collapsed={collapsed} />
          {!collapsed && "Collapse"}
        </button>
        <a href="/" target="_blank" rel="noopener" className={`mt-1 flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] text-cream-200/70 hover:bg-white/5 hover:text-cream-50 ${collapsed ? "justify-center" : ""}`}>
          <span className="text-gold-300">↗</span>
          {!collapsed && "View website"}
        </a>
      </div>
    </motion.aside>
  );
}

/* ───────────── Mobile bottom tabs ───────────── */
function BottomTabs({ modules, counts }: { modules: Module[]; counts: Counts }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => modules.includes(n.module));
  const primary = items.slice(0, items.length > 5 ? 4 : 5);
  const rest = items.slice(primary.length);
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);
  const tab = (item: (typeof NAV)[number], i: number) => {
    const active = isActive(pathname, item.href);
    const badge = item.module === "orders" ? counts.newOrders : item.module === "prescriptions" ? counts.pendingRx : 0;
    return (
      <Link key={item.href} href={item.href} className={`relative flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10.5px] font-medium ${active ? "text-gold-300" : "text-cream-200/70"}`}>
        {active && <motion.span layoutId="tab-active" className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-gold" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
        <span className="relative">
          <item.Icon size={22} eager delay={i * 0.06} />
          {badge ? <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[9.5px] font-bold text-emerald-950">{badge}</span> : null}
        </span>
        <span className="max-w-full truncate px-1">{item.label.split(" ")[0]}</span>
      </Link>
    );
  };
  return (
    <>
      <nav aria-label="Admin" className="admin-no-print fixed inset-x-0 bottom-0 z-40 flex border-t border-gold/25 bg-a-side pb-[env(safe-area-inset-bottom)] md:hidden">
        <LayoutGroup id="tabs">
          {primary.map(tab)}
          {rest.length > 0 && (
            <button onClick={() => setMore(true)} className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10.5px] font-medium ${rest.some((r) => isActive(pathname, r.href)) ? "text-gold-300" : "text-cream-200/70"}`}>
              <MoreIcon size={22} eager />
              More
            </button>
          )}
        </LayoutGroup>
      </nav>
      <AnimatePresence>
        {more && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-gold/30 bg-a-side p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 340, damping: 34 }}>
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-cream-200/30" />
              <div className="grid grid-cols-3 gap-2">
                {rest.map((item, i) => (
                  <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-2 rounded-2xl p-3 text-center text-[12px] ${isActive(pathname, item.href) ? "bg-white/10 text-gold-300" : "text-cream-100"}`}>
                    <item.Icon size={26} eager delay={i * 0.06} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────── Global search ───────────── */
function GlobalSearch() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (q.trim().length < 2) {
      setHits(null);
      return;
    }
    const t = setTimeout(async () => setHits(await globalSearch(q)), 220);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        box.current?.querySelector("input")?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  const groups = hits ? (["order", "product", "customer"] as const).map((k) => ({ k, items: hits.filter((h) => h.kind === k) })).filter((g) => g.items.length) : [];
  return (
    <div ref={box} className="relative w-full max-w-md">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-a-gold">
        <SearchIcon size={18} strokeWidth={3} eager />
      </span>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hits?.[0]) {
            router.push(hits[0].href);
            setOpen(false);
          }
        }}
        type="search"
        placeholder="Search…"
        aria-label="Search orders, products and customers"
        className="a-input !h-10 !rounded-full !pl-10 !pr-12"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-a-border px-1.5 text-[10px] text-a-muted lg:block">⌘K</kbd>
      <AnimatePresence>
        {open && hits && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute left-0 right-0 top-12 z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-a-border bg-a-surface p-2 shadow-2xl">
            {groups.length === 0 ? (
              <p className="px-3 py-4 text-center text-[13px] text-a-muted">No matches for “{q}”.</p>
            ) : (
              groups.map((g) => (
                <div key={g.k} className="py-1">
                  <p className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-a-gold">{g.k}s</p>
                  {g.items.map((h) => (
                    <Link key={h.href} href={h.href} onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[13.5px] hover:bg-a-raised">
                      <span className="min-w-0 truncate text-a-text">{h.title}</span>
                      <span className="shrink-0 text-[12px] text-a-muted">{h.sub}</span>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── Notifications (polling) ───────────── */
type Poll = Counts & { latestAt: string | null; latest: { id: string; number: string; name: string; total: number; created_at: string }[] };

function Bell({ counts, onCounts }: { counts: Counts; onCounts: (c: Counts) => void }) {
  const [data, setData] = useState<Poll | null>(null);
  const [shake, setShake] = useState(0);
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(true);
  const seen = useRef<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    try {
      setSound(localStorage.getItem("adp-sound") !== "off");
    } catch {}
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/poll", { cache: "no-store" });
      if (res.status === 401) return router.push("/admin/login");
      if (!res.ok) return;
      const d: Poll = await res.json();
      setData(d);
      onCounts({ newOrders: d.newOrders, pendingRx: d.pendingRx });
      if (seen.current && d.latestAt && d.latestAt > seen.current) {
        const fresh = d.latest.filter((o) => o.created_at > seen.current!);
        setShake((s) => s + 1);
        if (localStorage.getItem("adp-sound") !== "off") chime();
        toast({ tone: "order", title: fresh.length > 1 ? `${fresh.length} new orders` : `New order ${fresh[0]?.number ?? ""}`, body: fresh[0] ? `${fresh[0].name} · ${inr(fresh[0].total)}` : undefined });
        router.refresh();
      }
      if (d.latestAt && (!seen.current || d.latestAt > seen.current)) seen.current = d.latestAt;
    } catch {}
  }, [onCounts, router, toast]);

  useEffect(() => {
    poll();
    const t = setInterval(() => document.visibilityState === "visible" && poll(), 15000);
    return () => clearInterval(t);
  }, [poll]);

  const total = counts.newOrders + counts.pendingRx;
  return (
    <div className="relative">
      <Btn icon variant="ghost" aria-label={`Notifications${total ? `, ${total} pending` : ""}`} onClick={() => setOpen((o) => !o)}>
        <span key={shake} className={shake ? "a-bell-shake" : ""}>
          <BellIcon size={20} eager />
        </span>
      </Btn>
      {total > 0 && <span aria-hidden key={"b" + shake} className={`pointer-events-none absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10.5px] font-bold text-emerald-950 ${shake ? "a-badge-pulse" : ""}`}>{total}</span>}
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-12 z-50 w-[min(340px,calc(100vw-24px))] rounded-2xl border border-a-border bg-a-surface p-2 shadow-2xl">
              <div className="flex items-center justify-between px-3 py-2">
                <p className="font-serif text-lg">Notifications</p>
                <button
                  onClick={() => {
                    const next = !sound;
                    setSound(next);
                    try {
                      localStorage.setItem("adp-sound", next ? "on" : "off");
                    } catch {}
                    if (next) chime();
                  }}
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-a-muted hover:bg-a-raised"
                  aria-label={sound ? "Mute new-order sound" : "Unmute new-order sound"}
                >
                  <VolumeIcon size={16} eager muted={!sound} /> {sound ? "Sound on" : "Muted"}
                </button>
              </div>
              {counts.pendingRx > 0 && (
                <Link href="/admin/prescriptions" onClick={() => setOpen(false)} className="mx-1 mb-1 flex items-center justify-between rounded-xl bg-a-warn-bg px-3 py-2.5 text-[13px] text-a-warn">
                  {counts.pendingRx} prescription{counts.pendingRx > 1 ? "s" : ""} waiting for review <span>→</span>
                </Link>
              )}
              {data?.latest.length ? (
                data.latest.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`} onClick={() => setOpen(false)} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 hover:bg-a-raised">
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-semibold">{o.number} · {o.name}</span>
                      <span className="text-[11.5px] text-a-muted">{new Date(o.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                    </span>
                    <span className="text-[13px] tabular-nums">{inr(o.total)}</span>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-6 text-center text-[13px] text-a-muted">No new orders right now.</p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────── Theme ───────────── */
function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const el = document.getElementById("admin-root");
    setTheme(el?.dataset.theme === "dark" ? "dark" : "light");
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    const el = document.getElementById("admin-root");
    if (el) el.dataset.theme = next;
    try {
      localStorage.setItem("adp-theme", next);
    } catch {}
  };
  return { theme, toggle };
}

/* ───────────── Profile ───────────── */
function Profile({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(false);
  const change = useAction(changeOwnPassword, { refresh: false });
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full border border-a-border bg-a-surface py-1 pl-1 pr-3 hover:border-a-gold/60" aria-haspopup="menu" aria-expanded={open}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-a-primary font-serif text-[15px] text-a-on-primary">{me.name.slice(0, 1).toUpperCase()}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[120px] truncate text-[13px] font-semibold">{me.name}</span>
          <span className="block text-[11px] text-a-gold">{ROLE_LABEL[me.role]}</span>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div role="menu" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-a-border bg-a-surface p-2 shadow-2xl">
              <div className="flex items-center gap-3 px-3 py-3">
                <span className="text-a-primary">
                  <UserIcon size={28} eager />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{me.name}</span>
                  <span className="block truncate text-[12px] text-a-muted">{me.email}</span>
                </span>
              </div>
              <div className="my-1 h-px bg-a-border" />
              <button role="menuitem" onClick={() => (setPw(true), setOpen(false))} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] hover:bg-a-raised">
                <LockIcon size={18} eager /> Change password
              </button>
              <form action={logoutAction}>
                <button role="menuitem" className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13.5px] text-a-danger hover:bg-a-danger-bg">
                  <LogoutIcon size={18} eager /> Sign out
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <Modal open={pw} onClose={() => setPw(false)} title="Change your password">
        <Shake trigger={change.shakeKey}>
          <KeepForm
            className="grid gap-4"
            action={async (fd) => {
              const r = await change.run(fd);
              if (r.ok) setTimeout(() => setPw(false), 900);
            }}
          >
            <Field label="Current password" name="current" type="password" autoComplete="current-password" required error={change.fieldErrors.current} />
            <Field label="New password" name="next" type="password" autoComplete="new-password" required minLength={10} hint="At least 10 characters with letters and a number." error={change.fieldErrors.next} />
            <p className="text-[12px] text-a-muted">Your other signed-in devices will be signed out.</p>
            <div className="flex justify-end">
              <SaveButton pending={change.pending} status={change.status}>Update password</SaveButton>
            </div>
          </KeepForm>
        </Shake>
      </Modal>
    </div>
  );
}

/* ───────────── Shell ───────────── */
export function AdminShell({ me, modules, counts: initial, shopName, children }: { me: Me; modules: Module[]; counts: Counts; shopName: string; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [counts, setCounts] = useState(initial);
  const { theme, toggle } = useTheme();
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("adp-sidebar") === "collapsed");
    } catch {}
  }, []);
  useEffect(() => setCounts(initial), [initial]);
  const onCounts = useCallback((c: Counts) => setCounts(c), []);

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        modules={modules}
        counts={counts}
        collapsed={collapsed}
        shopName={shopName}
        onToggle={() => {
          const n = !collapsed;
          setCollapsed(n);
          try {
            localStorage.setItem("adp-sidebar", n ? "collapsed" : "open");
          } catch {}
        }}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="admin-no-print sticky top-0 z-30 border-b border-a-border/70 bg-a-bg/85 backdrop-blur-md">
          <div className="flex h-[64px] items-center gap-2 px-3 sm:gap-3 sm:px-6 md:h-[72px]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-gold/50 bg-emerald-900 text-gold md:hidden">
              <CrossIcon size={18} eager />
            </span>
            <GlobalSearch />
            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Btn icon variant="ghost" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
                    {theme === "dark" ? <SunIcon size={20} eager /> : <MoonIcon size={20} eager />}
                  </motion.span>
                </AnimatePresence>
              </Btn>
              <Bell counts={counts} onCounts={onCounts} />
              <Profile me={me} />
            </div>
          </div>
        </header>
        <main className="flex-1 px-3 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8">{children}</main>
      </div>
      <BottomTabs modules={modules} counts={counts} />
    </div>
  );
}
