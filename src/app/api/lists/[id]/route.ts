import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { deleteUserList, getUserListById, updateUserListTitle } from "@/lib/catalog";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export const GET = withAuth(
  async (userId, _request: Request, { params }: Params) => {
    const list = await getUserListById(userId, (await params).id);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ list });
  },
);

export const PATCH = withAuth(
  async (userId, request: Request, { params }: Params) => {
    const body = await request.json().catch(() => null);
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    const list = await updateUserListTitle(userId, (await params).id, title);
    if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ list });
  },
);

export const DELETE = withAuth(
  async (userId, _request: Request, { params }: Params) => {
    const deleted = await deleteUserList(userId, (await params).id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  },
);
