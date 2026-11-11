import { HeroArt } from "./HeroArt";
import { ScooterIcon, ShieldIcon, CrossIcon, UploadIcon, WhatsAppIcon } from "../icons";
import { LinkButton } from "../ui/Button";
import { site, rxNotice } from "@/lib/site";
import { WaOrderLink } from "../WaOrderLink";

const chips = [
  { label: "Genuine Medicines", Icon: ShieldIcon },
  { label: "Licensed Pharmacy", Icon: CrossIcon },
  { label: "Fast Home Delivery", Icon: ScooterIcon },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pb-16 pt-[calc(var(--header-h)+28px)] sm:pb-20 lg:pb-24 lg:pt-[calc(var(--header-h)+48px)]">
      {/* soft background ornaments */}
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(201,162,75,.18),transparent_65%)]" />
      <div aria-hidden className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(15,76,58,.10),transparent_65%)]" />

      <div className="container-site page-enter grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div className="text-center lg:text-left">
          <span className="eyebrow">
            <span className="h-px w-6 bg-gold" /> Est. family chemist · {site.city}
          </span>
          <h1 className="h-display mt-5">
            Your Trusted <em className="font-serif italic text-gold-600">Family Chemist</em> in {site.city}
          </h1>
          <p className="lead mx-auto mt-5 max-w-xl lg:mx-0">
            Genuine medicines, honest advice from a qualified pharmacist, and quick home delivery across {site.deliveryArea}. Send your
            prescription — we&apos;ll take care of the rest.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <LinkButton variant="primary" href="#prescription" className="px-6 py-3.5 text-[15px]">
              <UploadIcon size={22} strokeWidth={2.4} className="text-gold-300" /> Upload Prescription
            </LinkButton>
            <WaOrderLink className="px-6 py-3.5 text-[15px]">
              <WhatsAppIcon size={22} strokeWidth={2.4} /> Order on WhatsApp
            </WaOrderLink>
          </div>

          <ul className="mt-8 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="Why customers trust us">
            {chips.map(({ label, Icon }, i) => (
              <li key={label} className="chip">
                <span className="text-emerald-800">
                  <Icon size={20} delay={1.3 + i * 0.08} strokeWidth={2.2} />
                </span>
                {label}
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] text-charcoal-50">{rxNotice}</p>
        </div>

        <HeroArt />
      </div>
    </section>
  );
}
