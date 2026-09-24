import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { getUserListHistory, saveUserListSnapshot } from "@/lib/catalog";
import { InvalidListItemsError } from "@/lib/user-catalog";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (userId) => {
  return NextResponse.json({ lists: await getUserListHistory(userId) });
});

/** Saved snapshots remain immutable and owned by the verified server identity. */
export const POST = withAuth(async (userId, request: Request) => {
  const body = await request.json().catch(() => null);
  const notes = typeof body?.notes === "string" ? body.notes.slice(0, 2000) : "";
  const title = typeof body?.title === "string" && body.title.trim()
    ? body.title.trim().slice(0, 150) : "My Shopping List";
  try {
    const list = await saveUserListSnapshot(userId, title, notes, body?.items);
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    if (error instanceof InvalidListItemsError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
});
