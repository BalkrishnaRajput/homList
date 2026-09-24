import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { tryGetSupabasePublicConfig } from "@/lib/supabase/config";

/** Refresh verified Supabase cookies for pages that cannot set cookies. */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  let config;
  try {
    config = tryGetSupabasePublicConfig();
  } catch (error) {
    // Login/page handlers render the precise public configuration error.
    console.error(error instanceof Error ? error.message : error);
    return supabaseResponse;
  }
  if (!config) return supabaseResponse;

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set({ name, value });
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates the JWT with Supabase; getSession() would not.
  await supabase.auth.getUser();
  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/login"],
};
