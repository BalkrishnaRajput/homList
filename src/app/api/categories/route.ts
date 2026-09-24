import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { addUserCategory, getUserCatalog } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (userId) => {
  return NextResponse.json({ categories: await getUserCatalog(userId) });
});

export const POST = withAuth(async (userId, request: Request) => {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 150) {
    return NextResponse.json(
      { error: "A category name (up to 150 characters) is required" },
      { status: 400 },
    );
  }
  const category = await addUserCategory(userId, {
    name,
    icon: typeof body?.icon === "string" ? body.icon.slice(0, 40) : "grid",
    tint: typeof body?.tint === "string" ? body.tint.slice(0, 40) : "#EDEFF2",
  });
  return NextResponse.json({ category }, { status: 201 });
});
