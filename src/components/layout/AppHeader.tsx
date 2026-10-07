import { auth } from "@/auth";
import { AppHeaderBar } from "@/components/layout/AppHeaderBar";

export async function AppHeader() {
  const session = await auth();
  if (!session?.user) return null;

  return <AppHeaderBar />;
}
