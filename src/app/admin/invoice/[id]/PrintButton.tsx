"use client";

import { Btn } from "@/components/admin/ui";
import { PrinterIcon } from "@/components/icons/admin";

export function PrintButton() {
  return (
    <Btn variant="primary" onClick={() => window.print()}>
      <PrinterIcon size={18} eager /> Print / Save PDF
    </Btn>
  );
}
