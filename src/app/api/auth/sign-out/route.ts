import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Idempotent sign-out: clears the request's verified Supabase session cookies. */
export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    if (error && error.name !== "AuthSessionMissingError") {
      console.error("Supabase sign-out failed", error.message);
      return NextResponse.json({ error: "Sign out failed" }, { status: 500 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return NextResponse.json(
        { error: "Authentication service is unavailable" },
        { status: 503 },
      );
    }
    throw error;
  }
}
