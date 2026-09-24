import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { initializeUserCatalog } from "@/lib/user-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseConfigurationError } from "@/lib/supabase/config";

export class UnauthenticatedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export class AuthProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthProviderError";
  }
}

export class AuthMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthMappingError";
  }
}

export type AuthenticatedIdentity = {
  userId: number;
  authSubject: string;
  email: string | null;
  isAnonymous: boolean;
};

export type AuthenticatedSupabaseUser = {
  id: string;
  email?: string | null;
  is_anonymous?: boolean;
};

/**
 * Map a *verified* Supabase subject onto the existing application user table.
 * The unique auth_subject index and this transaction make login idempotent:
 * the same subject always reuses one numeric users.id, even concurrently.
 */
export async function mapAuthenticatedUser(
  user: AuthenticatedSupabaseUser,
): Promise<{ userId: number; email: string | null }> {
  const authSubject = user.id?.trim();
  if (!authSubject || authSubject.length > 128) {
    throw new AuthMappingError("Verified Supabase user has an invalid subject");
  }
  const email = user.email?.trim().toLowerCase() || null;
  if (email && email.length > 320) {
    throw new AuthMappingError("Verified Supabase email is too long");
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.authSubject, authSubject))
      .limit(1);

    if (existing) {
      if (email && existing.email !== email) {
        await tx
          .update(users)
          .set({ email, updatedAt: new Date() })
          .where(eq(users.id, existing.id));
      }
      return { userId: existing.id, email: email ?? existing.email };
    }

    const inserted = await tx
      .insert(users)
      .values({ authSubject, email })
      .onConflictDoNothing({ target: users.authSubject })
      .returning({ id: users.id });

    if (inserted[0]) return { userId: inserted[0].id, email };

    // A concurrent request may have inserted the same subject first.
    const [winner] = await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.authSubject, authSubject))
      .limit(1);
    if (winner) return { userId: winner.id, email: email ?? winner.email };

    // No subject conflict means another application user already owns this
    // verified email. Never merge identities automatically.
    throw new AuthMappingError(
      "Authenticated email is already linked to a different identity",
    );
  });
}

type RawSupabaseUser = {
  id: string;
  email?: string | null;
  is_anonymous?: boolean;
};

function bearerToken(request?: Request): string | null {
  if (!request) return null;
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ", 2);
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    throw new UnauthenticatedError("Invalid authorization header");
  }
  return token.trim();
}

/**
 * Single server-side identity boundary. Never accepts a user ID from a body,
 * query, URL, client state, or development cookie.
 */
export async function getAuthenticatedIdentity(
  request?: Request,
): Promise<AuthenticatedIdentity> {
  const supabase = await createSupabaseServerClient();
  const token = bearerToken(request);
  const result = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (result.error) {
    const status = result.error.status;
    if (
      result.error.name === "AuthSessionMissingError"
      || status === 400
      || status === 401
      || status === 403
    ) {
      throw new UnauthenticatedError();
    }
    throw new AuthProviderError(`Supabase authentication failed: ${result.error.message}`);
  }

  const user = result.data.user as RawSupabaseUser | null;
  if (!user) throw new UnauthenticatedError();

  const mapped = await mapAuthenticatedUser(user);
  // Every authenticated identity receives and retains its private catalogue.
  await initializeUserCatalog(mapped.userId);

  return {
    userId: mapped.userId,
    authSubject: user.id,
    email: mapped.email,
    isAnonymous: user.is_anonymous === true,
  };
}

export async function getCurrentUserId(request?: Request): Promise<number> {
  return (await getAuthenticatedIdentity(request)).userId;
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Authentication required" },
    { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
  );
}

function unavailableResponse(error: unknown): NextResponse {
  console.error("Authentication configuration/provider failure", error);
  return NextResponse.json(
    { error: "Authentication service is unavailable" },
    { status: 503 },
  );
}

export function authenticationErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof UnauthenticatedError) return unauthorizedResponse();
  if (
    error instanceof SupabaseConfigurationError
    || error instanceof AuthProviderError
  ) return unavailableResponse(error);
  return null;
}

type AuthHandler<Args extends unknown[]> = (
  userId: number,
  ...args: Args
) => Promise<Response> | Response;

/** Wrap every private Route Handler so unauthenticated requests return 401. */
export function withAuth<Args extends unknown[]>(handler: AuthHandler<Args>) {
  return async (...args: Args): Promise<Response> => {
    try {
      const request = args[0] instanceof Request ? args[0] : undefined;
      const identity = await getAuthenticatedIdentity(request);
      return await handler(identity.userId, ...args);
    } catch (error) {
      const response = authenticationErrorResponse(error);
      if (response) return response;
      throw error;
    }
  };
}
