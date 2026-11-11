"use client";

import { motion, useMotionValue } from "framer-motion";
import { useEffect, useState } from "react";
import { Btn, Modal } from "./ui";
import { RotateIcon, ZoomIcon } from "../icons/admin";

/** Zoomable / pannable / rotatable prescription viewer. Files are served from private storage via an authenticated route. */
export function RxViewer({ id, type, open, onClose, title = "Prescription" }: { id: string; type: string; open: boolean; onClose: () => void; title?: string }) {
  const [scale, setScale] = useState(1);
  const [rot, setRot] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reset = () => {
    setScale(1);
    setRot(0);
    x.set(0);
    y.set(0);
  };
  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);
  const src = `/admin/api/rx/${id}`;
  const pdf = type === "application/pdf";
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      {pdf ? (
        <object data={src} type="application/pdf" className="h-[70dvh] w-full rounded-xl border border-a-border">
          <a href={src} target="_blank" rel="noopener" className="text-a-gold underline">Open PDF</a>
        </object>
      ) : (
        <>
          <div
            className="relative h-[62dvh] touch-none overflow-hidden rounded-2xl border border-a-border bg-[repeating-conic-gradient(rgb(var(--a-raised))_0_25%,rgb(var(--a-surface))_0_50%)] bg-[length:24px_24px]"
            onWheel={(e) => setScale((s) => Math.min(5, Math.max(0.5, s - e.deltaY * 0.0015)))}
            onDoubleClick={() => setScale((s) => (s > 1.5 ? 1 : 2.5))}
          >
            <motion.div drag dragMomentum={false} style={{ x, y }} className="grid h-full w-full cursor-grab place-items-center active:cursor-grabbing">
              <motion.img src={src} alt="Uploaded prescription" draggable={false} animate={{ scale, rotate: rot }} transition={{ type: "spring", stiffness: 260, damping: 28 }} className="max-h-full max-w-full select-none object-contain" />
            </motion.div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-a-muted">Scroll or double-click to zoom · drag to pan</p>
            <div className="flex gap-1.5">
              <Btn icon aria-label="Zoom out" onClick={() => setScale((s) => Math.max(0.5, s - 0.5))}>
                <ZoomIcon out size={18} eager />
              </Btn>
              <span className="grid w-14 place-items-center text-[13px] tabular-nums">{Math.round(scale * 100)}%</span>
              <Btn icon aria-label="Zoom in" onClick={() => setScale((s) => Math.min(5, s + 0.5))}>
                <ZoomIcon size={18} eager />
              </Btn>
              <Btn icon aria-label="Rotate" onClick={() => setRot((r) => r + 90)}>
                <RotateIcon size={18} eager />
              </Btn>
              <Btn size="sm" onClick={reset}>Reset</Btn>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
