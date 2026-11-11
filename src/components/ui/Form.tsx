"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * A form that calls `action(formData)` on submit WITHOUT React 19's automatic form reset,
 * so whatever the user typed survives a validation error.
 */
export function KeepForm({ action, children, ...rest }: Omit<HTMLMotionProps<"form">, "action" | "onSubmit"> & { action: (fd: FormData) => unknown }) {
  return (
    <motion.form
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        void action(new FormData(e.currentTarget));
      }}
    >
      {children}
    </motion.form>
  );
}
