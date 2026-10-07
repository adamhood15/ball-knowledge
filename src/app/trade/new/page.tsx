import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TradeWizard } from "@/components/trade/TradeWizard";

export default async function NewTradePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const leagues = await prisma.league.findMany({
    where: { createdByUserId: session.user.id },
    select: { id: true, name: true, mode: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="mx-auto font-display text-2xl text-body-text">Trade builder</h1>
      <div className="mx-auto w-full max-w-md">
        <TradeWizard leagues={leagues} />
      </div>
    </div>
  );
}
