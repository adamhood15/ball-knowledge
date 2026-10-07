import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchPlayers } from "@/lib/trade/searchPlayers";

export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const leagueId = searchParams.get("leagueId") ?? undefined;

  const results = await searchPlayers({ prisma, query, leagueId });
  return NextResponse.json({ results });
}
