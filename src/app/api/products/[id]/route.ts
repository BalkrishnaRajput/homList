import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { deleteUserProduct, updateUserProduct } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

function parseProductId(raw: string): number | null {
  const productId = Number(raw);
  return Number.isSafeInteger(productId) && productId > 0 ? productId : null;
}

export const PATCH = withAuth(
  async (userId, request: Request, { params }: Params) => {
    const productId = parseProductId((await params).id);
    if (!productId) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    const body = await request.json().catch(() => null);
    const patch: { name?: string; quantity?: number; unit?: string; categoryId?: number } = {};
    if (typeof body?.name === "string" && body.name.trim().length <= 150 && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (Number.isInteger(body?.quantity) && body.quantity > 0 && body.quantity <= 1_000_000) {
      patch.quantity = body.quantity;
    }
    if (typeof body?.unit === "string" && body.unit.trim() && body.unit.length <= 20) {
      patch.unit = body.unit.trim();
    }
    if (Number.isSafeInteger(body?.categoryId) && body.categoryId > 0) {
      patch.categoryId = body.categoryId;
    }
    if (!Object.keys(patch).length) {
      return NextResponse.json({ error: "No valid product changes" }, { status: 400 });
    }
    const product = await updateUserProduct(userId, productId, patch);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product });
  },
);

export const DELETE = withAuth(
  async (userId, _request: Request, { params }: Params) => {
    const productId = parseProductId((await params).id);
    if (!productId) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    const deleted = await deleteUserProduct(userId, productId);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  },
);
