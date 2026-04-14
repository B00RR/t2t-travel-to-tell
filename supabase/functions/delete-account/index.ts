import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * delete-account — authenticated endpoint that permanently removes
 * the caller's user record.
 *
 * Flow:
 *   1. Verify the Authorization bearer against the Supabase auth API
 *      to resolve the caller's user_id — never trust a client-supplied id.
 *   2. Use the service role key to call `auth.admin.deleteUser(user_id)`
 *      which cascades via ON DELETE to every table that references
 *      profiles(id) / auth.users(id).
 *
 * CORS is explicit: we only accept calls from the known app origins
 * and the Authorization header is required.
 */

const ALLOWED_ORIGINS = [
  "http://localhost:8081",
  "http://localhost:19000",
  "exp://",
  "https://t2t-travel.app",
  Deno.env.get("APP_ORIGIN") ?? "",
].filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o));
  return {
    "Access-Control-Allow-Origin": allowed ? (origin as string) : "null",
    "Access-Control-Allow-Headers": "authorization, content-type, apikey",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const cors = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error("delete-account: missing env");
    return new Response("Server misconfigured", { status: 500, headers: cors });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  // Resolve the caller's identity via the anon client (which will use
  // the JWT from Authorization). We do NOT trust any body-provided id.
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData?.user?.id) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }
  const userId = userData.user.id;

  // Use service role to perform the actual deletion. ON DELETE cascades
  // from profiles(id) / auth.users(id) will wipe diaries, day_entries,
  // comments, likes, follows, push_tokens, notifications, etc.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error("delete-account: admin.deleteUser failed", deleteError.message);
    return new Response("Delete failed", { status: 500, headers: cors });
  }

  return new Response(
    JSON.stringify({ ok: true, user_id: userId }),
    { status: 200, headers: { ...cors, "Content-Type": "application/json" } },
  );
});
