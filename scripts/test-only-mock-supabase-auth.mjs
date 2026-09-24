// TEST-ONLY local GoTrue-compatible server. It never runs in the application,
// never receives production credentials, and is not a Supabase replacement.
// It implements only the auth endpoints exercised by the isolation suite:
// anonymous signup, verified user lookup, and global logout.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const port = Number(process.env.MOCK_SUPABASE_PORT ?? 54321);
const usersByToken = new Map();

function send(response, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  response.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function bearer(request) {
  const value = request.headers.authorization ?? "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function userFor(id) {
  const now = new Date().toISOString();
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: "",
    phone: "",
    last_sign_in_at: now,
    app_metadata: { provider: "anonymous", providers: ["anonymous"] },
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: true,
  };
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${port}`);
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    try {
      if (request.method === "POST" && url.pathname === "/auth/v1/signup") {
        const id = randomUUID();
        const user = userFor(id);
        const accessToken = `mock-access-${id}`;
        const refreshToken = `mock-refresh-${id}`;
        usersByToken.set(accessToken, user);
        send(response, 201, {
          access_token: accessToken,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: refreshToken,
          user,
        });
        return;
      }

      if (request.method === "GET" && url.pathname === "/auth/v1/user") {
        const user = usersByToken.get(bearer(request));
        if (!user) {
          send(response, 401, {
            code: 401,
            error_code: "bad_jwt",
            msg: "invalid JWT",
          });
          return;
        }
        send(response, 200, user);
        return;
      }

      if (request.method === "POST" && url.pathname === "/auth/v1/logout") {
        usersByToken.delete(bearer(request));
        response.writeHead(204, { "Content-Length": 0 });
        response.end();
        return;
      }

      send(response, 404, { code: 404, msg: "Not found" });
    } catch (error) {
      send(response, 500, {
        code: 500,
        msg: error instanceof Error ? error.message : "mock server error",
      });
    }
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TEST-ONLY mock GoTrue listening on http://127.0.0.1:${port}`);
});
