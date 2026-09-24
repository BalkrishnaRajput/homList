"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });
      if (!response.ok) throw new Error(`Sign out failed (${response.status})`);
      router.replace("/login");
      router.refresh();
    } catch (cause) {
      console.error(cause);
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="block">
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className={`rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-forest transition-colors hover:bg-mint disabled:cursor-wait disabled:opacity-60 ${className}`}
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <span className="mt-1 block text-[11px] text-[#a3442b]">{error}</span>}
    </span>
  );
}
