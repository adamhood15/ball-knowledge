import { auth } from "@/auth";
import { BottomNavBar } from "@/components/layout/BottomNavBar";

export async function BottomNav() {
  const session = await auth();
  if (!session?.user) return null;

  return <BottomNavBar />;
}
