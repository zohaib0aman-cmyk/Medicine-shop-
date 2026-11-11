import { redirect } from "next/navigation";
import { getStaff } from "@/lib/server/auth";
import { hasDb } from "@/lib/server/db";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!hasDb()) {
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <div className="a-card max-w-md p-8 text-center">
          <h1 className="font-serif text-2xl">Database not configured</h1>
          <p className="mt-2 text-[14px] text-a-muted">Set <code>DATABASE_URL</code> in <code>.env.local</code>, run <code>npm run db:setup</code>, then create the owner account with <code>npm run admin:create-owner</code>. See the README.</p>
        </div>
      </div>
    );
  }
  if (await getStaff()) redirect("/admin");
  const { next } = await searchParams;
  return <LoginForm next={next ?? ""} />;
}
