"use client";

import { useState } from "react";
import { BrandMark } from "@/components/icons";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

type BusyMethod = "email" | "google" | "guest" | null;

function callbackUrl(): string {
  return `${window.location.origin}/auth/callback?next=/`;
}

export function SignInPanel() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<BusyMethod>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function run(method: Exclude<BusyMethod, null>, action: () => Promise<{ error: { message: string } | null }>) {
    setBusy(method);
    setMessage(null);
    try {
      const { error } = await action();
      if (error) throw new Error(error.message);
      if (method === "email") {
        setMessage({ kind: "success", text: "Check your inbox for a secure sign-in link." });
      } else {
        window.location.assign("/");
      }
    } catch (cause) {
      const text = cause instanceof SupabaseConfigurationError
        ? "Authentication is not configured for this deployment."
        : cause instanceof Error ? cause.message : "Sign-in failed. Please try again.";
      setMessage({ kind: "error", text });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-10">
      <section className="w-full max-w-[440px] overflow-hidden rounded-[26px] border border-line bg-white shadow-[0_24px_60px_rgba(16,24,40,0.10)]">
        <div className="border-b border-line bg-mint px-7 py-7">
          <div className="flex items-center gap-3">
            <BrandMark size={42} />
            <div>
              <p className="display text-[24px] leading-none text-forest">HomeList</p>
              <p className="tracked mt-1.5 text-[9px] font-bold text-mute">
                Household shopping list
              </p>
            </div>
          </div>
          <h1 className="display mt-6 text-[30px] leading-[1.05] text-forest">
            Your list, only yours.
          </h1>
          <p className="mt-2 text-[14px] text-ink/75">
            Sign in to keep your private catalogue, quantities, notes and saved lists separate.
          </p>
        </div>

        <div className="space-y-4 px-7 py-7">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const normalized = email.trim().toLowerCase();
              if (!normalized) return;
              void run("email", () =>
                createSupabaseBrowserClient().auth.signInWithOtp({
                  email: normalized,
                  options: {
                    shouldCreateUser: true,
                    emailRedirectTo: callbackUrl(),
                  },
                }),
              );
            }}
          >
            <label htmlFor="email" className="tracked block text-[9.5px] font-bold text-mute">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-xl border border-line bg-cream px-3 text-[15px] outline-none transition-colors focus:border-sage"
            />
            <button
              type="submit"
              disabled={busy !== null}
              className="mt-3 h-11 w-full rounded-xl bg-forest px-4 text-[14.5px] font-semibold text-white transition-colors hover:bg-[#1d4d2f] disabled:cursor-wait disabled:opacity-60"
            >
              {busy === "email" ? "Sending sign-in link…" : "Email me a sign-in link"}
            </button>
          </form>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="tracked text-[9px] font-bold text-mute">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void run("google", () =>
                createSupabaseBrowserClient().auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: callbackUrl() },
                }),
              )
            }
            className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[14.5px] font-semibold text-ink transition-colors hover:bg-mint disabled:cursor-wait disabled:opacity-60"
          >
            {busy === "google" ? "Opening Google…" : "Continue with Google"}
          </button>

          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              void run("guest", () =>
                createSupabaseBrowserClient().auth.signInAnonymously(),
              )
            }
            className="h-11 w-full rounded-xl border border-dashed border-sage bg-mint/50 px-4 text-[14.5px] font-semibold text-forest transition-colors hover:bg-mint disabled:cursor-wait disabled:opacity-60"
          >
            {busy === "guest" ? "Creating your private list…" : "Continue as guest"}
          </button>

          {message && (
            <p
              role="status"
              className={`rounded-xl px-3 py-2.5 text-[13px] ${
                message.kind === "success"
                  ? "border border-[#cfe4d4] bg-mint text-forest"
                  : "border border-[#f0d3cb] bg-[#fdf1ed] text-[#8f3d20]"
              }`}
            >
              {message.text}
            </p>
          )}

          <p className="text-center text-[12px] leading-relaxed text-mute">
            Each sign-in receives an independent private catalogue. No shared shopping data.
          </p>
        </div>
      </section>
    </main>
  );
}
