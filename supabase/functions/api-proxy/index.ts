import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * API Proxy Edge Function v2
 * Routes client requests to external RapidAPI endpoints while keeping API keys server-side.
 *
 * Security hardening (2026-04-03):
 *   - Strict CORS origin validation (not catch-all wildcard)
 *   - SSRF protection: path sanitisation, no redirect-to-internal
 *   - Rate limiting via in-memory sliding window per Supabase anon key
 *   - Request size limit to prevent payload abuse
 */

// ── Configuration ─────────────────────────────────────────

const API_CONFIG: Record<string, { host: string; key: string }> = {
  booking: {
    host: "booking-com.p.rapidapi.com",
    key: Deno.env.get("RAPIDAPI_KEY") ?? "",
  },
  tripadvisor: {
    host: "tripadvisor16.p.rapidapi.com",
    key: Deno.env.get("RAPIDAPI_KEY") ?? "",
  },
  aerodatabox: {
    host: "aerodatabox.p.rapidapi.com",
    key: Deno.env.get("RAPIDAPI_KEY") ?? "",
  },
};

// Origins allowed to call this function (add your app's production URL)
const ALLOWED_ORIGINS = [
  "http://localhost:8081",       // Expo dev
  "http://localhost:19000",      // Expo dev (alternate port)
  "exp://",                       // Expo Go client
  "https://t2t-travel.app",     // Production (update to real domain)
  Deno.env.get("APP_ORIGIN") ?? "",
].filter(Boolean);

// ── Rate Limiting (in-memory sliding window) ─────────────

const RATE_LIMIT_WINDOW_MS = 60_000;       // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;        // per anon-key per window

interface RateEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateEntry>();

function checkRateLimit(apiKey: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(apiKey);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(apiKey, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count };
}

// ── Path Sanitisation (SSRF Mitigation) ──────────────────

const UNSAFE_PATH_PATTERNS = [
  /\.\./,             // directory traversal
  /\/\/.*@/,          // userinfo injection (http://evil.com@real.com)
  /^[^/]/,             // must start with /
  /%00/,              // null byte
  /\n/,               // header injection via newline
  /\r/,               // header injection
];

function isValidPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  if (path.length > 1024) return false;  // prevent oversized paths

  for (const pattern of UNSAFE_PATH_PATTERNS) {
    if (pattern.test(path)) return false;
  }
  return true;
}

function isValidParams(params: Record<string, unknown>): boolean {
  if (!params || typeof params !== "object") return true; // optional

  const entries = Object.entries(params);
  if (entries.length > 50) return false;  // prevent param bombing

  for (const [k, v] of entries) {
    if (typeof k !== "string" || k.length > 256) return false;
    const sv = String(v);
    if (sv.length > 4096) return false;
    if (sv.includes('\n') || sv.includes('\r')) return false;
  }
  return true;
}

// ── CORS Helper ──────────────────────────────────────────

function getOrigin(req: Request): string {
  return req.headers.get("origin") ?? req.headers.get("referer") ?? "";
}

function corsHeaders(origin: string): Record<string, string> {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    };
  }
  return {
    "Access-Control-Allow-Origin": "",
    "Vary": "Origin",
  };
}

// ── Main Handler ─────────────────────────────────────────

Deno.serve(async (req): Promise<Response> => {
  const origin = getOrigin(req);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(origin),
    });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Rate limiting
  const anonKey = req.headers.get("x-client-info") ?? req.headers.get("apikey") ?? "unknown";
  const rl = checkRateLimit(anonKey);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max " + RATE_LIMIT_MAX_REQUESTS + " requests per minute." }),
      { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60", ...corsHeaders(origin) } },
    );
  }

  // Request size limit (16KB max body)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > 16384) {
    return new Response(
      JSON.stringify({ error: "Request body too large (max 16KB)" }),
      { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Parse request body
  let body: { api?: unknown; path?: unknown; params?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Validate API identifier
  const api = typeof body.api === "string" ? body.api : undefined;
  const config = api ? API_CONFIG[api] : undefined;
  if (!config) {
    return new Response(
      JSON.stringify({ error: "Unknown or unsupported API endpoint" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Validate path (SSRF protection)
  const path = typeof body.path === "string" ? body.path : undefined;
  if (!isValidPath(path ?? "")) {
    return new Response(
      JSON.stringify({ error: "Invalid request path" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Validate params
  const params = body.params;
  if (!isValidParams(params)) {
    return new Response(
      JSON.stringify({ error: "Invalid request parameters" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Build URL (path already validated as starting with /)
  const url = new URL(`https://${config.host}${path}`);
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
  }

  // Forward request
  let upstream: Response;
  try {
    upstream = await fetch(url.toString(), {
      method: req.method,
      headers: {
        "x-rapidapi-key": config.key,
        "x-rapidapi-host": config.host,
        "Accept": "application/json",
      },
      // Disable automatic redirects to prevent SSRF via redirect
      redirect: "manual",
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Upstream request failed" }),
      { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
    );
  }

  // Check for redirects (SSRF via redirect)
  if (upstream.status >= 300 && upstream.status < 400) {
    const redirectLocation = upstream.headers.get("location");
    if (redirectLocation && !redirectLocation.startsWith(`https://${config.host}`)) {
      return new Response(
        JSON.stringify({ error: "Redirect blocked: external target" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } },
      );
    }
  }

  // Read and forward response
  const responseBody = await upstream.text();

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin),
      "X-RateLimit-Remaining": String(rl.remaining),
      "X-Request-Id": crypto.randomUUID(),
    },
  });
});
