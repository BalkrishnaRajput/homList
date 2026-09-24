import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { deleteUserCategory, updateUserCategory } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

function parseCategoryId(raw: string): number | null {
  const categoryId = Number(raw);
  return Number.isSafeInteger(categoryId) && categoryId > 0 ? categoryId : null;
}

export const PATCH = withAuth(
  async (userId, request: Request, { params }: Params) => {
    const categoryId = parseCategoryId((await params).id);
    if (!categoryId) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    const patch: { name?: string; icon?: string; tint?: string } = {};
    if (typeof body?.name === "string" && body.name.trim().length <= 150 && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (typeof body?.icon === "string" && body.icon.length <= 40) patch.icon = body.icon;
    if (typeof body?.tint === "string" && body.tint.length <= 40) patch.tint = body.tint;
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "No valid category changes" }, { status: 400 });
    }
    const category = await updateUserCategory(userId, categoryId, patch);
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ category });
  },
);

export const DELETE = withAuth(
  async (userId, _request: Request, { params }: Params) => {
    const categoryId = parseCategoryId((await params).id);
    if (!categoryId) {
      return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
    }
    const deleted = await deleteUserCategory(userId, categoryId);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  },
);
