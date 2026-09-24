import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client stores only Supabase's public session cookies. */
export function createSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  const config = getSupabasePublicConfig();
  browserClient = createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
