import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getUserCatalog } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (userId) => {
  const categories = await getUserCatalog(userId);
  return NextResponse.json({ categories });
});
