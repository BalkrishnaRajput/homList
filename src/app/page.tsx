import { redirect } from "next/navigation";
import App from "@/components/App";
import {
  AuthProviderError,
  UnauthenticatedError,
  getAuthenticatedIdentity,
} from "@/lib/auth";
import { getUserActiveList } from "@/lib/catalog";
import { getUserCatalog } from "@/lib/user-catalog";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function Page() {
  let identity;
  try {
    identity = await getAuthenticatedIdentity();
  } catch (error) {
    if (error instanceof UnauthenticatedError) redirect("/login");
    if (error instanceof SupabaseConfigurationError) redirect("/login");
    if (error instanceof AuthProviderError) {
      console.error(error.message);
      redirect("/login");
    }
    throw error;
  }

  const [categories, list] = await Promise.all([
    getUserCatalog(identity.userId),
    getUserActiveList(identity.userId),
  ]);

  const accountLabel = identity.email
    ?? (identity.isAnonymous ? "Guest account" : "Signed in");

  return (
    <App
      initialCategories={categories}
      initialItems={list.items}
      initialNotes={list.notes}
      currentUserId={identity.userId}
      accountLabel={accountLabel}
    />
  );
}
