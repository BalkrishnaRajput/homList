import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const OTP_TYPES = new Set<EmailOtpType>([
  "signup", "invite", "magiclink", "recovery", "email_change",
]);

function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  // Same-origin relative paths only; protocol-relative URLs are rejected.
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const redirectToLogin = (reason: string) => {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", reason);
    return NextResponse.redirect(url);
  };

  if (!code && !(tokenHash && type && OTP_TYPES.has(type))) {
    return redirectToLogin("missing-code");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : await supabase.auth.exchangeCodeForSession(code!);

    if (error) {
      console.error("Supabase auth callback failed", error.message);
      return redirectToLogin("sign-in-failed");
    }

    const url = request.nextUrl.clone();
    url.pathname = next;
    url.search = "";
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return redirectToLogin("configuration");
    }
    throw error;
  }
}
