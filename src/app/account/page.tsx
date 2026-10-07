import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/auth/signOutAction";
import { Button } from "@/components/ui/Button";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-lg border border-card-border/40 bg-background p-8">
        <h1 className="font-display text-2xl text-body-text">Account</h1>
        {session.user.email ? <p className="text-sm text-muted-text">{session.user.email}</p> : null}
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" className="w-full">
            Sign Out
          </Button>
        </form>
      </div>
    </div>
  );
}
