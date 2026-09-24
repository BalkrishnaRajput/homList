import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { addUserProduct, getUserCatalog } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (userId) => {
  const categories = await getUserCatalog(userId);
  return NextResponse.json({ products: categories.flatMap((category) => category.products) });
});

export const POST = withAuth(async (userId, request: Request) => {
  const body = await request.json().catch(() => null);
  const categoryId = body?.categoryId;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const quantity = body?.quantity ?? 1;
  const unit = body?.unit ?? "kg";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !name || name.length > 150
    || !Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000
    || typeof unit !== "string" || !unit.trim() || unit.length > 20) {
    return NextResponse.json(
      { error: "Valid name, category, quantity and unit are required" },
      { status: 400 },
    );
  }
  const product = await addUserProduct(userId, {
    categoryId, name, quantity, unit: unit.trim(),
  });
  if (!product) return NextResponse.json({ error: "Category not found" }, { status: 404 });
  return NextResponse.json({ product }, { status: 201 });
});
