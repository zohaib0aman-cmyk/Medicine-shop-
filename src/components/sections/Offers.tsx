import { ScooterIcon, TagIcon } from "../icons";
import { Reveal } from "../ui/Motion";
import { WaOrderLink } from "../WaOrderLink";
import type { Storefront } from "@/lib/types";

export function Offers({ store }: { store: Storefront }) {
  const { offer, shop } = store;
  if (!offer.active) return null;
  return (
    <section aria-label="Offers" className="py-10 sm:py-14">
      <div className="container-site">
        <Reveal>
          <div className="shimmer rounded-card border border-gold bg-gradient-to-r from-cream-200 via-cream-50 to-cream-200 p-[3px] shadow-gold">
            <div className="flex flex-col items-center gap-5 rounded-[13px] border border-gold/40 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
              <div className="flex shrink-0 items-center gap-2 text-emerald-800">
                <TagIcon size={46} />
                <ScooterIcon size={46} delay={0.08} />
              </div>
              <div className="flex-1">
                <p className="eyebrow">
                  {offer.eyebrow} at {shop.name}
                </p>
                <p className="mt-1 font-serif text-2xl leading-tight text-emerald-900 sm:text-[1.7rem]">{offer.title}</p>
                {offer.details ? <p className="mt-1 text-[13.5px] text-charcoal-70">{offer.details}</p> : null}
              </div>
              <WaOrderLink variant="gold" className="shrink-0">
                {offer.cta || "Order now"}
              </WaOrderLink>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
