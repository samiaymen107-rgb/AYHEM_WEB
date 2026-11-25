const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function reply(body: unknown, status = 403) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Hard server-side kill switch: no TinyFish API request and no wallet debit.
export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ ok: false, error: "method_not_allowed" }, 405);
  return reply({
    ok: false,
    stage: "zero_cost_policy",
    error: "tinyfish_disabled_no_topups",
    message: "تم إيقاف أتمتة TinyFish نهائياً في وضع صفر تكلفة. لا يتم الاتصال بمزوّد الخدمة أو خصم أي رصيد.",
  }, 403);
}

if (import.meta.main) Deno.serve(handler);
