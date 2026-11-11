import { ClockIcon, MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { LinkButton } from "../ui/Button";
import { fullAddress, site } from "@/lib/site";
import { telLink, waLink } from "@/lib/whatsapp";

export function Contact() {
  const mapQuery = site.geo.lat ? `${site.geo.lat},${site.geo.lng}` : `${site.name}, ${fullAddress}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}`;

  const rows = [
    { Icon: MapPinIcon, label: "Visit us", value: fullAddress, href: directions, cta: "Get directions" },
    { Icon: ClockIcon, label: "Timings", value: site.timings },
    { Icon: PhoneIcon, label: "Call", value: site.phoneDisplay, href: telLink, cta: "Tap to call" },
    { Icon: MailIcon, label: "Email", value: site.email, href: `mailto:${site.email}` },
  ];

  return (
    <section id="contact" className="section">
      <div className="container-site">
        <SectionHeading eyebrow="Find us" title={<>Visit {site.name}</>} sub={`Home delivery across ${site.deliveryArea}.`} />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal className="grid gap-3">
            {rows.map(({ Icon, label, value, href, cta }, i) => (
              <HoverCard key={label} className="flex items-center gap-4 p-4 sm:p-5">
                <IconBadge size={56}>
                  <Icon size={32} delay={i * 0.08} />
                </IconBadge>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-600">{label}</p>
                  {href ? (
                    <a href={href} className="block break-words font-serif text-[1.1rem] text-emerald-900 hover:text-emerald-700" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {value}
                      {cta ? <span className="mt-0.5 block font-sans text-[12px] font-semibold text-gold-600">{cta} →</span> : null}
                    </a>
                  ) : (
                    <p className="font-serif text-[1.1rem] text-emerald-900">{value}</p>
                  )}
                </div>
              </HoverCard>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <LinkButton variant="primary" href={telLink}>
                <PhoneIcon size={18} strokeWidth={2.6} className="text-gold-300" /> Call Now
              </LinkButton>
              <LinkButton variant="wa" href={waLink(`Hello ${site.name}!`)}>
                <WhatsAppIcon size={18} strokeWidth={2.6} /> WhatsApp
              </LinkButton>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="card min-h-[320px] overflow-hidden p-2">
            <iframe
              title={`Map showing ${site.name}`}
              src={mapSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[320px] w-full rounded-[12px] border-0 grayscale-[30%] sepia-[15%]"
              allowFullScreen
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
