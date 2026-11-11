"use client";

import { KeepForm } from "@/components/ui/Form";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Btn, Card, EmptyState, SaveButton, Tabs, TextArea, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/useAction";
import { fmtDate } from "@/components/admin/status";
import { EyeIcon, EyeOffIcon, ReplyIcon } from "@/components/icons/admin";
import { CheckIcon, StarIcon, TrashIcon } from "@/components/icons";
import { deleteReview, replyReview, setReviewStatus } from "@/app/admin/actions/reviews";

type R = { id: string; name: string; rating: number; text: string; source: string; status: string; reply: string | null; created_at: string; replied_at: string | null; replier: string | null };

function ReviewCard({ r, index }: { r: R; index: number }) {
  const status = useAction(setReviewStatus);
  const reply = useAction(replyReview);
  const del = useAction(deleteReview);
  const confirm = useConfirm();
  const [replying, setReplying] = useState(false);
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: Math.min(index, 8) * 0.05 }} className="a-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg">{r.name}</p>
          <p className="text-[12px] text-a-muted">{r.source} · {fmtDate(r.created_at)}</p>
        </div>
        <div className="flex text-gold" aria-label={`${r.rating} out of 5`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < r.rating ? "" : "opacity-20"}><StarIcon size={18} eager delay={i * 0.06} /></span>
          ))}
        </div>
      </div>
      <blockquote className="mt-3 text-[14.5px] leading-relaxed">“{r.text}”</blockquote>
      {r.reply && !replying && (
        <p className="mt-3 rounded-xl border-l-2 border-a-gold bg-a-raised px-3 py-2 text-[13px]">
          <strong>Your reply</strong>{r.replier ? ` (${r.replier})` : ""}: {r.reply}
        </p>
      )}
      <AnimatePresence>
        {replying && (
          <KeepForm
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 grid gap-2 overflow-hidden"
            action={async (fd) => {
              const res = await reply.run(r.id, String(fd.get("reply") ?? ""));
              if (res.ok) setReplying(false);
            }}
          >
            <TextArea label="Public reply (shown under the review)" name="reply" defaultValue={r.reply ?? ""} maxLength={1000} rows={3} autoFocus />
            <div className="flex justify-end gap-2">
              <Btn size="sm" onClick={() => setReplying(false)}>Cancel</Btn>
              <SaveButton size="sm" pending={reply.pending} status={reply.status}>Publish reply</SaveButton>
            </div>
          </KeepForm>
        )}
      </AnimatePresence>
      <div className="mt-4 flex flex-wrap gap-2">
        {r.status !== "approved" && (
          <Btn size="sm" variant="primary" disabled={status.pending} onClick={() => status.run(r.id, "approved")}>
            <CheckIcon size={14} eager /> Approve
          </Btn>
        )}
        {r.status !== "hidden" && (
          <Btn size="sm" disabled={status.pending} onClick={() => status.run(r.id, "hidden")}>
            <EyeOffIcon size={16} eager /> Hide
          </Btn>
        )}
        {r.status === "hidden" && (
          <Btn size="sm" onClick={() => status.run(r.id, "pending")}>
            <EyeIcon size={16} eager /> Back to pending
          </Btn>
        )}
        <Btn size="sm" onClick={() => setReplying((v) => !v)}>
          <ReplyIcon size={16} eager /> {r.reply ? "Edit reply" : "Reply"}
        </Btn>
        <Btn size="sm" icon className="ml-auto text-a-danger" aria-label="Delete review" onClick={async () => (await confirm({ title: "Delete this review?", body: `By ${r.name}. This can't be undone — use Hide to keep it on record.` })) && del.run(r.id)}>
          <TrashIcon size={14} eager />
        </Btn>
      </div>
    </motion.li>
  );
}

export function ReviewsClient({ rows, status, counts }: { rows: R[]; status: string; counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <>
      <div className="mb-4">
        <Tabs
          id="reviews"
          value={status}
          onChange={(v) => router.push(`${pathname}?status=${v}`)}
          tabs={[
            { value: "pending", label: "Pending", count: counts.pending ?? 0 },
            { value: "approved", label: "Published", count: counts.approved ?? 0 },
            { value: "hidden", label: "Hidden", count: counts.hidden ?? 0 },
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={<StarIcon size={32} />} title={status === "pending" ? "No reviews waiting" : "Nothing here yet"} body={status === "pending" ? "New reviews from the website will appear here." : undefined} />
        </Card>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence>
            {rows.map((r, i) => (
              <ReviewCard key={r.id} r={r} index={i} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </>
  );
}
