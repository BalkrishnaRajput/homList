import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getUserActiveList, saveUserActiveList } from "@/lib/catalog";
import { InvalidListItemsError } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (userId) => {
  const list = await getUserActiveList(userId);
  return NextResponse.json({ list });
});

/** Persist selections only when every product belongs to this authenticated user. */
export const PUT = withAuth(async (userId, request: Request) => {
  const body = await request.json().catch(() => null);
  const notes = typeof body?.notes === "string" ? body.notes.slice(0, 2000) : "";
  try {
    const result = await saveUserActiveList(userId, body?.items, notes);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InvalidListItemsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
});
