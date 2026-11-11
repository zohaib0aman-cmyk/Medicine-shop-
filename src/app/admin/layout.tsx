import type { Metadata } from "next";
import "./admin.css";
import { ToastProvider } from "@/components/admin/Toast";
import { ConfirmProvider } from "@/components/admin/ui";
import { MotionConfig } from "framer-motion";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** Sets the saved theme before paint so there is no light→dark flash. */
const themeScript = `(function(){try{var t=localStorage.getItem('adp-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.currentScript.parentElement.dataset.theme=t}catch(e){}})()`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="admin-root" className="admin min-h-dvh" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <MotionConfig reducedMotion="user">
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </MotionConfig>
    </div>
  );
}
