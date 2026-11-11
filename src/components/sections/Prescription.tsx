"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef } from "react";
import { CameraIcon, CheckIcon, CloseIcon, PhoneIcon, ScooterIcon, UploadIcon, WhatsAppIcon } from "../icons";
import { HoverCard, IconBadge, Reveal, SectionHeading } from "../ui/Motion";
import { Button, LinkButton } from "../ui/Button";
import { useOrder } from "@/lib/order";
import { prescriptionMessage, waLink } from "@/lib/whatsapp";
import { rxNotice } from "@/lib/site";

const steps = [
  { Icon: UploadIcon, title: "Upload photo", text: "Snap a clear photo of your doctor's prescription and add it here." },
  { Icon: PhoneIcon, title: "We confirm on call", text: "Our registered pharmacist verifies it and calls you with price & availability." },
  { Icon: ScooterIcon, title: "Delivered to your door", text: "Packed with care and delivered quickly to your home." },
];

export function Prescription() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const scale = useTransform(progress, [0, 1], [0, 1]);
  const { prescription, setPrescription } = useOrder();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section id="prescription" className="section relative bg-emerald-50/60">
      <div className="absolute inset-x-0 top-0 hairline" aria-hidden />
      <div className="container-site">
        <SectionHeading eyebrow="Upload prescription" title={<>Three simple steps to <em className="italic text-gold-600">your medicines</em></>} sub={rxNotice} />

        {/* steps with scroll-drawn connector */}
        <div ref={ref} className="relative">
          {/* vertical line (mobile) */}
          <div aria-hidden className="absolute bottom-10 left-[34px] top-10 w-px bg-gold/20 md:hidden">
            <motion.div className="h-full w-full origin-top bg-gold" style={{ scaleY: scale }} />
          </div>
          {/* horizontal line (desktop) */}
          <div aria-hidden className="absolute left-[16.6%] right-[16.6%] top-[34px] hidden h-px bg-gold/20 md:block">
            <motion.div className="h-full w-full origin-left bg-gold" style={{ scaleX: scale }} />
          </div>

          <ol className="relative grid gap-6 md:grid-cols-3 md:gap-8">
            {steps.map(({ Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 0.08} className="flex gap-4 md:flex-col md:items-center md:text-center">
                <motion.div initial="rest" whileHover="hover" whileTap="hover" className="relative">
                  <IconBadge size={68}>
                    <Icon size={40} delay={i * 0.08} />
                  </IconBadge>
                  <span className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-800 font-serif text-[13px] text-gold-300 ring-2 ring-cream">{i + 1}</span>
                </motion.div>
                <div className="pt-1 md:pt-3">
                  <h3 className="font-serif text-xl text-emerald-900">{title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-charcoal-70">{text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* upload box */}
        <Reveal className="mx-auto mt-12 max-w-2xl">
          <HoverCard className="overflow-hidden">
            <div className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
              <IconBadge size={84}>
                <CameraIcon size={48} />
              </IconBadge>
              <div className="flex-1">
                <h3 className="font-serif text-2xl text-emerald-900">{prescription ? "Prescription added" : "Add your prescription"}</h3>
                <p className="mt-1 text-[13.5px] text-charcoal-70">
                  {prescription
                    ? "Prescription items are now unlocked. Attach this same photo in the WhatsApp chat when you send your order."
                    : "JPG, PNG or PDF. Your photo stays on your device — you'll attach it in the WhatsApp chat with us."}
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  id="rx-file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setPrescription(f);
                    e.target.value = "";
                  }}
                />
                {prescription ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-cream-50 p-1.5 pr-3">
                      {prescription.isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prescription.url} alt="Your uploaded prescription" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-12 w-12 place-items-center rounded-lg bg-emerald-50 text-xs font-bold text-emerald-800">PDF</span>
                      )}
                      <span className="max-w-[140px] truncate text-[13px] font-medium">{prescription.name}</span>
                      <span className="text-emerald-700">
                        <CheckIcon size={18} />
                      </span>
                    </div>
                    <Button variant="outline" icon aria-label="Remove prescription" onClick={() => setPrescription(null)}>
                      <CloseIcon size={16} />
                    </Button>
                  </div>
                ) : null}
                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                  <Button variant="primary" onClick={() => inputRef.current?.click()}>
                    <UploadIcon size={20} strokeWidth={2.4} className="text-gold-300" /> {prescription ? "Replace photo" : "Upload Prescription"}
                  </Button>
                  <LinkButton variant="wa" href={waLink(prescriptionMessage)}>
                    <WhatsAppIcon size={20} strokeWidth={2.4} /> Send on WhatsApp
                  </LinkButton>
                </div>
              </div>
            </div>
          </HoverCard>
        </Reveal>
      </div>
    </section>
  );
}
