// Public Supabase configuration is safe for the browser: base project URL and
// publishable/anon key only. Server secrets are never read or returned here.
export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export function tryGetSupabasePublicConfig(): SupabasePublicConfig | null {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  if (!rawUrl || !publishableKey) return null;

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL",
    );
  }

  const isLocal = parsed.hostname === "localhost"
    || parsed.hostname === "127.0.0.1"
    || parsed.hostname === "[::1]";
  if (parsed.protocol !== "https:" && !(isLocal && parsed.protocol === "http:")) {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTPS (HTTP is allowed only for localhost)",
    );
  }
  if (parsed.pathname !== "/" && parsed.pathname !== "") {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must be the Supabase project base URL, not a /rest/v1 endpoint",
    );
  }
  if (parsed.search || parsed.hash) {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must not contain a query string or fragment",
    );
  }

  return { url: parsed.origin, publishableKey };
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const config = tryGetSupabasePublicConfig();
  if (!config) {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are required",
    );
  }
  return config;
}
