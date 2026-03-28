import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * API Proxy Edge Function
 * Routes client requests to external APIs, keeping API keys server-side.
 *
 * Usage: POST /api-proxy
 * Body: { "api": "booking"|"tripadvisor"|"aerodatabox", "path": "/v1/hotels/search", "params": {...} }
 */

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

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { api, path, params } = await req.json();

    const config = API_CONFIG[api];
    if (!config) {
      return new Response(JSON.stringify({ error: `Unknown API: ${api}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build URL
    const url = new URL(`https://${config.host}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.set(k, String(v))
      );
    }

    // Forward request with server-side API key
    const upstream = await fetch(url.toString(), {
      headers: {
        "x-rapidapi-key": config.key,
        "x-rapidapi-host": config.host,
      },
    });

    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
