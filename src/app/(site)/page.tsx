import { Header, ScrollProgress } from "@/components/Header";
import { Hero } from "@/components/sections/Hero";
import { Categories } from "@/components/sections/Categories";
import { Prescription } from "@/components/sections/Prescription";
import { Products } from "@/components/sections/Products";
import { WhyUs } from "@/components/sections/WhyUs";
import { Offers } from "@/components/sections/Offers";
import { Reviews } from "@/components/sections/Reviews";
import { Faq } from "@/components/sections/Faq";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/Footer";
import { FloatingButtons, OrderDrawer, Toast } from "@/components/Floating";
import { getStorefront } from "@/lib/server/storefront";

export default async function Home() {
  const store = await getStorefront();
  return (
    <>
      {/* page-load intro: the logo cross draws itself, then fades away */}
      <div className="intro" aria-hidden>
        <div className="grid place-items-center gap-3">
          <svg width="64" height="64" viewBox="0 0 48 48" fill="none" stroke="#0F4C3A" strokeWidth="1.8" strokeLinejoin="round">
            <path className="intro-fill" d="M19.5 7h9a1.5 1.5 0 0 1 1.5 1.5V18h9.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H30v9.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V30H8.5A1.5 1.5 0 0 1 7 28.5v-9A1.5 1.5 0 0 1 8.5 18H18V8.5A1.5 1.5 0 0 1 19.5 7Z" fill="#0F4C3A" stroke="none" />
            <path d="M19.5 7h9a1.5 1.5 0 0 1 1.5 1.5V18h9.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H30v9.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V30H8.5A1.5 1.5 0 0 1 7 28.5v-9A1.5 1.5 0 0 1 8.5 18H18V8.5A1.5 1.5 0 0 1 19.5 7Z" stroke="#C9A24B" />
          </svg>
          <span className="intro-fill font-serif text-xl tracking-wide text-emerald-900">{store.shop.name}</span>
        </div>
      </div>

      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-emerald-800 focus:px-4 focus:py-2 focus:text-cream-50">
        Skip to content
      </a>
      <ScrollProgress />
      <Header />
      <main id="main">
        <Hero store={store} />
        <div className="hairline container-site" />
        <Categories />
        <Prescription />
        <Products />
        <WhyUs />
        <Offers store={store} />
        <Reviews />
        <Faq />
        <Contact store={store} />
      </main>
      <Footer store={store} />
      <FloatingButtons />
      <OrderDrawer />
      <Toast />
    </>
  );
}
