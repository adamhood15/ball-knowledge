import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreateCustomLeagueWizard } from "@/components/leagues/CreateCustomLeagueWizard";
import { createCustomLeagueAction } from "@/app/leagues/new/actions";

export default async function CreateCustomLeaguePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto font-display text-2xl text-body-text">Create a Custom League</h1>
      <div className="mx-auto w-full max-w-md">
        <CreateCustomLeagueWizard createCustomLeagueAction={createCustomLeagueAction} />
      </div>
    </div>
  );
}
