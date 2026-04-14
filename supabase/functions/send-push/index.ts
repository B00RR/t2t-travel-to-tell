import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * send-push — delivers Expo push notifications.
 *
 * Invocation:
 *   POST /functions/v1/send-push
 *   Authorization: Bearer <SERVICE_ROLE_KEY>      (from the DB trigger)
 *   Body: { notification_id, user_id, actor_id, type, target_id }
 *
 * This function is called by the `trg_notifications_push` trigger on
 * `public.notifications`. It looks up every Expo push token enrolled
 * for the recipient and dispatches a single batched request to the
 * Expo push API. Errors are logged but never surfaced to the trigger
 * (the notification row is already persisted).
 */

// ── CORS ────────────────────────────────────────────────
// Service-role invocation only — the web client never calls this function
// directly, so we lock CORS down hard.
const corsHeaders = {
  "Access-Control-Allow-Origin": "null",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Types ───────────────────────────────────────────────
type NotificationType = "like" | "comment" | "follow" | "diary_invitation" | "badge" | string;

interface TriggerPayload {
  notification_id: string;
  user_id: string;       // recipient
  actor_id: string;      // who did the action
  type: NotificationType;
  target_id: string;     // diary/comment/follow id
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data: {
    notification_id: string;
    type: NotificationType;
    target_id: string;
    actor_id: string;
  };
  sound: "default";
  channelId?: string;
}

// ── Copy helpers ────────────────────────────────────────
const BADGE_EMOJI: Record<string, string> = {
  first_journey: "✈️",
  storyteller: "📖",
  elite_traveler: "🏆",
  globetrotter: "🌍",
  explorer: "🧭",
  marco_polo: "🗺️",
  popular: "❤️",
  influencer: "🌟",
  social_butterfly: "🤝",
};

function buildCopy(
  type: NotificationType,
  actorName: string,
  targetId?: string,
): { title: string; body: string } {
  switch (type) {
    case "like":
      return { title: "T2T", body: `${actorName} ha messo mi piace al tuo diario` };
    case "comment":
      return { title: "T2T", body: `${actorName} ha commentato il tuo diario` };
    case "follow":
      return { title: "T2T", body: `${actorName} ha iniziato a seguirti` };
    case "diary_invitation":
      return { title: "T2T", body: `${actorName} ti ha invitato a collaborare a un diario` };
    case "badge":
      const emoji = BADGE_EMOJI[targetId ?? ""] ?? "🏆";
      return { title: `${emoji} Badge guadagnato!`, body: `${actorName} ha guadagnato un nuovo badge` };
    default:
      return { title: "T2T", body: `${actorName} ha interagito con te` };
  }
}

// ── Handler ─────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    console.error("send-push: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
  }

  // Only accept calls that carry the service-role key — this function
  // must never be callable from anonymous clients.
  const auth = req.headers.get("Authorization") ?? "";
  if (auth !== `Bearer ${serviceKey}`) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  let payload: TriggerPayload;
  try {
    payload = (await req.json()) as TriggerPayload;
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
  }
  if (!payload?.user_id || !payload?.type || !payload?.notification_id) {
    return new Response("Missing fields", { status: 400, headers: corsHeaders });
  }

  const client = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  // Lookup recipient tokens + actor display name in parallel.
  const [tokensRes, actorRes] = await Promise.all([
    client
      .from("push_tokens")
      .select("token, platform")
      .eq("user_id", payload.user_id),
    client
      .from("profiles")
      .select("username, display_name")
      .eq("id", payload.actor_id)
      .maybeSingle(),
  ]);

  if (tokensRes.error) {
    console.error("send-push: tokens query failed", tokensRes.error.message);
    return new Response("DB error", { status: 500, headers: corsHeaders });
  }

  const tokens = (tokensRes.data ?? []).map((row) => row.token);
  if (tokens.length === 0) {
    // Nothing to deliver — this is not an error, many users will not
    // have push enrolled.
    return new Response(JSON.stringify({ delivered: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const actorName =
    actorRes.data?.display_name?.trim() ||
    actorRes.data?.username?.trim() ||
    "Qualcuno";
  const { title, body } = buildCopy(payload.type, actorName, payload.target_id);

  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title,
    body,
    data: {
      notification_id: payload.notification_id,
      type: payload.type,
      target_id: payload.target_id,
      actor_id: payload.actor_id,
    },
    sound: "default",
    channelId: "default",
  }));

  try {
    const expoResp = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!expoResp.ok) {
      const text = await expoResp.text();
      console.error("send-push: Expo push API error", expoResp.status, text);
      return new Response("Push API failed", { status: 502, headers: corsHeaders });
    }

    const result = await expoResp.json();
    // Expo returns receipts indicating per-token delivery status. If a
    // token is "DeviceNotRegistered" we clean it up so we don't keep
    // retrying dead devices.
    const tickets: Array<{ status: string; details?: { error?: string } }> =
      result?.data ?? [];

    const deadTokens: string[] = [];
    tickets.forEach((ticket, idx) => {
      if (
        idx < tokens.length &&
        ticket?.status === "error" &&
        ticket?.details?.error === "DeviceNotRegistered"
      ) {
        deadTokens.push(tokens[idx]);
      }
    });

    if (deadTokens.length > 0) {
      await client
        .from("push_tokens")
        .delete()
        .eq("user_id", payload.user_id)
        .in("token", deadTokens);
    }

    return new Response(
      JSON.stringify({ delivered: tokens.length - deadTokens.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-push: fetch failed", err);
    return new Response("Upstream failure", { status: 502, headers: corsHeaders });
  }
});
