import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <p className="max-w-md text-body-text">
        Evaluate fantasy football trades with a scoring-settings-aware, roster-context-aware
        grade — not just a gut check.
      </p>
      <Link
        href="/sign-in"
        className="rounded-md border border-card-border px-5 py-2 font-medium text-body-text transition hover:bg-card-border/10"
      >
        Get started
      </Link>
    </div>
  );
}
