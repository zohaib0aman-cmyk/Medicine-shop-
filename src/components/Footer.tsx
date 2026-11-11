import { FacebookIcon, InstagramIcon, ReviewIcon } from "./icons";
import { Logo } from "./Logo";
import { fullAddress, rxNotice, type Storefront } from "@/lib/types";
import { telHref } from "@/lib/whatsapp";

const links = [
  ["Categories", "#categories"],
  ["Upload Prescription", "#prescription"],
  ["Products", "#products"],
  ["Why Us", "#why-us"],
  ["FAQ", "#faq"],
  ["Contact", "#contact"],
];

export function Footer({ store }: { store: Storefront }) {
  const site = store.shop;
  const telLink = telHref(site.phoneE164);
  const social = [
    { label: "Instagram", href: site.instagram, Icon: InstagramIcon },
    { label: "Facebook", href: site.facebook, Icon: FacebookIcon },
    { label: "Google reviews", href: site.google, Icon: ReviewIcon },
  ].filter((s) => s.href);
  return (
    <footer className="relative bg-emerald-950 pb-28 pt-16 text-cream-200 sm:pb-12">
      <div className="absolute inset-x-0 top-0 hairline" aria-hidden />
      <div className="container-site">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-sm text-[14px] leading-relaxed text-cream-200/75">
              A trusted family chemist in {site.city}. Genuine medicines, honest advice and quick home delivery across {site.deliveryArea}.
            </p>
            <ul className="mt-5 flex gap-2" aria-label="Social media">
              {social.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer" className="social grid h-10 w-10 place-items-center rounded-full border border-gold/40 text-gold-300 transition-colors hover:bg-gold hover:text-emerald-950">
                    <Icon size={18} strokeWidth={1.8} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Footer">
            <p className="font-serif text-lg text-cream-50">Quick links</p>
            <ul className="mt-4 grid grid-cols-2 gap-2 text-[14px] md:grid-cols-1">
              {links.map(([l, h]) => (
                <li key={h}>
                  <a href={h} className="text-cream-200/80 hover:text-gold-300">{l}</a>
                </li>
              ))}
            </ul>
          </nav>
          <address className="not-italic">
            <p className="font-serif text-lg text-cream-50">Pharmacy details</p>
            <dl className="mt-4 grid gap-2 text-[13.5px] text-cream-200/80">
              <div><dt className="inline text-gold-300">Drug Licence No.: </dt><dd className="inline">{site.drugLicence}</dd></div>
              <div><dt className="inline text-gold-300">GSTIN: </dt><dd className="inline">{site.gstin}</dd></div>
              <div><dt className="inline text-gold-300">Pharmacist: </dt><dd className="inline">{site.pharmacist}</dd></div>
              <div><dt className="sr-only">Address</dt><dd>{fullAddress(site)}</dd></div>
              <div><dt className="sr-only">Phone</dt><dd><a href={telLink} className="hover:text-gold-300">{site.phoneDisplay}</a></dd></div>
              <div><dt className="sr-only">Timings</dt><dd>{site.timings}</dd></div>
            </dl>
          </address>
        </div>

        <div className="hairline my-10" />
        <div className="grid gap-3 text-[12px] leading-relaxed text-cream-200/60">
          <p><strong className="text-cream-200/85">{rxNotice}</strong></p>
          <p>
            Disclaimer: Information on this website is for general awareness only and is not a substitute for professional medical advice, diagnosis or
            treatment. Always consult a qualified doctor. Product images are illustrative; prices are indicative and confirmed at billing. Schedule H/H1/X
            drugs are sold only as per the Drugs and Cosmetics Act, 1940 and Rules.
          </p>
          <p>© {new Date().getFullYear()} {site.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
