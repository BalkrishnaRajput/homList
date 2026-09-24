import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/SignInPanel";
import {
  AuthProviderError,
  UnauthenticatedError,
  getAuthenticatedIdentity,
} from "@/lib/auth";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function AuthNotice({ title, body }: { title: string; body: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-10">
      <section className="w-full max-w-[520px] rounded-[26px] border border-line bg-white p-8 shadow-[0_24px_60px_rgba(16,24,40,0.10)]">
        <h1 className="display text-[28px] leading-tight text-forest">{title}</h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink/75">{body}</p>
      </section>
    </main>
  );
}

export default async function LoginPage() {
  try {
    await getAuthenticatedIdentity();
    redirect("/");
  } catch (error) {
    if (error instanceof UnauthenticatedError) return <SignInPanel />;
    if (error instanceof SupabaseConfigurationError) {
      console.error(error.message);
      return (
        <AuthNotice
          title="Authentication is not configured"
          body="Set NEXT_PUBLIC_SUPABASE_URL to the Supabase project base URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) to the public browser key, then restart the application. Server database keys must remain private."
        />
      );
    }
    if (error instanceof AuthProviderError) {
      console.error(error.message);
      return (
        <AuthNotice
          title="Authentication is temporarily unavailable"
          body="Supabase Auth could not verify a session. Check the public Supabase configuration and provider status, then reload this page."
        />
      );
    }
    throw error;
  }
}
