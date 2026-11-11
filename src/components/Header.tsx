"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { BagIcon, ClockIcon, CloseIcon, MapPinIcon, MenuIcon, PhoneIcon, SearchIcon, WhatsAppIcon } from "./icons";
import { Button, LinkButton } from "./ui/Button";
import { site } from "@/lib/site";
import { useOrder } from "@/lib/order";
import { telLink } from "@/lib/whatsapp";
import { WaOrderLink } from "./WaOrderLink";

const nav = [
  { href: "#categories", label: "Categories" },
  { href: "#prescription", label: "Prescription" },
  { href: "#products", label: "Products" },
  { href: "#why-us", label: "Why Us" },
  { href: "#faq", label: "FAQ" },
  { href: "#contact", label: "Contact" },
];

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-gradient-to-r from-gold-600 via-gold to-gold-300" style={{ scaleX }} />;
}

function SearchField({ autoFocus, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const { query, setQuery } = useOrder();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
        onDone?.();
      }}
    >
      <label htmlFor={autoFocus ? "q-m" : "q"} className="sr-only">
        Search medicines
      </label>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-800">
        <SearchIcon size={18} strokeWidth={3} />
      </span>
      <input
        ref={ref}
        id={autoFocus ? "q-m" : "q"}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medicines, brands, care…"
        className="h-11 w-full rounded-full border border-cream-300 bg-cream-50/90 pl-10 pr-4 text-[14px] text-charcoal shadow-inner outline-none transition-[box-shadow] placeholder:text-charcoal-50 focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </form>
  );
}

export function Header() {
  const { scrollY } = useScroll();
  const [shrunk, setShrunk] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const { count, setDrawerOpen } = useOrder();

  useMotionValueEvent(scrollY, "change", (y) => setShrunk(y > 40));
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
  }, [menu]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: shrunk ? -32 : 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* utility strip — slides away on scroll */}
      <div className="h-8 bg-emerald-900 text-[11.5px] text-cream-100">
        <div className="container-site flex h-full items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <span className="text-gold-300"><ClockIcon size={14} strokeWidth={3} /></span>
            <span className="truncate">{site.timings}</span>
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <span className="text-gold-300"><MapPinIcon size={14} strokeWidth={3} /></span>
            Home delivery across {site.deliveryArea}
          </span>
          <a href={telLink} className="shrink-0 font-semibold text-gold-300 hover:text-gold">
            {site.phoneDisplay}
          </a>
        </div>
      </div>

      {/* main bar */}
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute inset-0 border-b border-gold/30 bg-cream/90 shadow-[0_10px_30px_-18px_rgba(15,76,58,.35)] backdrop-blur-md"
          initial={false}
          animate={{ opacity: shrunk ? 1 : 0.0 }}
          transition={{ duration: 0.3 }}
        />
        <div className="absolute inset-x-0 bottom-0 hairline" aria-hidden />
        <div className="container-site relative flex h-[72px] items-center gap-3 lg:h-[84px]">
          <motion.div className="min-w-0 shrink-0 origin-left" animate={{ scale: shrunk ? 0.92 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
            <Logo compact={false} />
          </motion.div>

          <nav aria-label="Primary" className="ml-6 hidden xl:block">
            <ul className="flex items-center gap-5 text-[13.5px] font-medium text-emerald-900">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="group relative whitespace-nowrap py-2">
                    {n.label}
                    <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto hidden w-full max-w-[280px] 2xl:block">
            <SearchField />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 lg:gap-2 2xl:ml-3">
            <Button variant="outline" icon className="2xl:hidden" aria-label="Search" aria-expanded={search} onClick={() => setSearch((s) => !s)}>
              <SearchIcon size={20} strokeWidth={3} />
            </Button>
            <LinkButton variant="outline" href={telLink} icon className="hidden sm:inline-flex lg:hidden" aria-label={`Call ${site.phoneDisplay}`}>
              <PhoneIcon size={20} strokeWidth={2.6} />
            </LinkButton>
            <LinkButton variant="outline" href={telLink} className="hidden lg:inline-flex">
              <PhoneIcon size={18} strokeWidth={2.6} /> Call Now
            </LinkButton>
            <WaOrderLink className="hidden lg:inline-flex">
              <WhatsAppIcon size={18} strokeWidth={2.6} /> Order on WhatsApp
            </WaOrderLink>
            <Button variant="outline" icon aria-label={`Your order, ${count} items`} onClick={() => setDrawerOpen(true)} className="relative !overflow-visible">
              <BagIcon size={20} strokeWidth={2.6} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 14 }}
                    className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10.5px] font-bold text-emerald-950"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            <Button variant="outline" icon className="xl:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              <MenuIcon size={20} open={menu} />
            </Button>
          </div>
        </div>

        {/* mobile search drop */}
        <AnimatePresence>
          {search && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute inset-x-0 top-full border-b border-gold/30 bg-cream/95 py-3 shadow-soft backdrop-blur-md 2xl:hidden"
            >
              <div className="container-site">
                <SearchField autoFocus onDone={() => setSearch(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* mobile menu sheet */}
      <AnimatePresence>
        {menu && (
          <>
            <motion.div
              className="absolute inset-x-0 top-0 -z-10 h-[100dvh] bg-emerald-950/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenu(false)}
            />
            <motion.nav
              aria-label="Mobile"
              className="absolute inset-x-3 top-[calc(100%+8px)] rounded-card border border-gold/30 bg-cream-50 p-5 shadow-lift"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
            >
              <ul className="grid gap-1">
                {nav.map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}>
                    <a href={n.href} onClick={() => setMenu(false)} className="flex items-center justify-between rounded-xl px-3 py-3 font-serif text-xl text-emerald-900 hover:bg-cream-200">
                      {n.label}
                      <span className="h-px w-8 bg-gold/60" />
                    </a>
                  </motion.li>
                ))}
              </ul>
              <div className="hairline my-4" />
              <div className="grid grid-cols-2 gap-2">
                <LinkButton variant="outline" href={telLink}>
                  <PhoneIcon size={18} strokeWidth={2.6} /> Call Now
                </LinkButton>
                <WaOrderLink>
                  <WhatsAppIcon size={18} strokeWidth={2.6} /> WhatsApp
                </WaOrderLink>
              </div>
              <button type="button" onClick={() => setMenu(false)} className="mx-auto mt-4 flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-charcoal-50">
                <CloseIcon size={14} /> Close
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
