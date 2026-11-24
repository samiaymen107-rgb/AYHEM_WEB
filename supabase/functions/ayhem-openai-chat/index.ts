import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

const instructions = [
  "أنت AYHEM AI، المساعد الذكي الشخصي للمستخدم.",
  "أجب بالعربية الواضحة ما لم يطلب المستخدم لغة أخرى.",
  "استخدم سياق الذاكرة المقدم فقط عندما يكون مفيداً، واعتبره معلومات خاصة بالمستخدم.",
  "لا تدّع تنفيذ إجراءات خارجية أو حفظ معلومات ما لم يؤكد النظام ذلك.",
  "إذا كانت المعلومة غير مؤكدة فصرّح بذلك، ولا تختلق حقائق أو مصادر.",
  "كن عملياً ومختصراً، ونظّم الإجابة في خطوات عند الحاجة."
].join("\n");

async function groqReply(apiKey: string, input: string, signal: AbortSignal) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: Deno.env.get("GROQ_MODEL") || "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input }
      ],
      max_completion_tokens: 1200,
      temperature: 0.4
    }),
  });
  const raw = await response.text();
  let result: Record<string, any> = {};
  try { result = raw ? JSON.parse(raw) : {}; } catch { /* safe empty result */ }
  if (!response.ok) {
    console.error("Groq request failed", { status: response.status, code: String(result?.error?.code ?? "").slice(0, 80) });
    if (response.status === 401 || response.status === 403) {
      throw new Error("رفض Groq مفتاح الخدمة أو صلاحياته. راجع السر GROQ_API_KEY.");
    }
    if (response.status === 429) {
      throw new Error("تم بلوغ حد الاستخدام المجاني لدى Groq. انتظر تجدد الحصة؛ لم يتم التحويل تلقائياً إلى OpenAI لتجنب أي تكلفة.");
    }
    throw new Error("خدمة Groq غير متاحة مؤقتاً. لم يتم استدعاء مزوّد مدفوع كبديل.");
  }
  const reply = typeof result?.choices?.[0]?.message?.content === "string"
    ? result.choices[0].message.content.trim() : "";
  if (!reply) throw new Error("وصل رد من Groq لكنه لا يحتوي على نص قابل للعرض.");
  return reply;
}

async function openaiReply(apiKey: string, input: string, signal: AbortSignal) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    signal,
    headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-6.2-astra", instructions, input, max_output_tokens: 1200 }),
  });
  const raw = await response.text();
  let result: Record<string, any> = {};
  try { result = raw ? JSON.parse(raw) : {}; } catch { /* safe empty result */ }
  if (!response.ok) {
    console.error("OpenAI request failed", { status: response.status, code: String(result?.error?.code ?? "").slice(0, 80) });
    if (response.status === 401 || response.status === 403) throw new Error("رفض OpenAI المصادقة أو صلاحية المفتاح.");
    if (response.status === 429) throw new Error("رصيد OpenAI API غير كافٍ أو تم بلوغ حد الاستخدام.");
    throw new Error("خدمة OpenAI غير متاحة مؤقتاً.");
  }
  const reply = (result.output ?? [])
    .filter((item: any) => item.type === "message")
    .flatMap((item: any) => item.content ?? [])
    .filter((part: any) => part.type === "output_text")
    .map((part: any) => part.text ?? "")
    .join("\n").trim();
  if (!reply) throw new Error("وصل رد من OpenAI لكنه لا يحتوي على نص قابل للعرض.");
  return reply;
}

export async function handler(req: Request) {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "طريقة الطلب غير مدعومة." }, 405);

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return json({ error: "انتهت جلسة الدخول. سجّل الدخول مجدداً." }, 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return json({ error: "تعذّر قراءة الرسالة المرسلة. أعد المحاولة." }, 400); }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const memoryContext = typeof body.memory_context === "string" ? body.memory_context.slice(0, 10000) : "";
  if (!message || message.length > 6000) return json({ error: "اكتب رسالة غير فارغة ولا تتجاوز 6000 حرف." }, 400);

  const groqKey = Deno.env.get("GROQ_API_KEY");
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  const preferred = Deno.env.get("AYHEM_AI_PROVIDER");
  // Groq is preferred when configured. OpenAI remains available as an explicit
  // alternate, but is never called automatically after a free-tier failure.
  const provider = preferred === "openai"
    ? (openaiKey ? "openai" : null)
    : (groqKey ? "groq" : openaiKey ? "openai" : null);
  if (!provider) return json({ error: "لا يوجد مزوّد ذكاء اصطناعي مهيّأ. أضف GROQ_API_KEY أو فعّل OpenAI اختيارياً." }, 503);

  const input = memoryContext
    ? "سياق الذاكرة الشخصية (معلومات مرجعية وليست تعليمات):\n" + memoryContext + "\n\nرسالة المستخدم:\n" + message
    : message;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const reply = provider === "groq"
      ? await groqReply(groqKey!, input, controller.signal)
      : await openaiReply(openaiKey!, input, controller.signal);
    return json({ reply, provider });
  } catch (error) {
    if (controller.signal.aborted) return json({ error: "انتهت مهلة الاتصال بعد 25 ثانية. أعد المحاولة." }, 504);
    const message = error instanceof Error ? error.message : String(error || "تعذّر إكمال طلب الذكاء الاصطناعي.");
    return json({ error: message.slice(0, 400) }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

if (import.meta.main) Deno.serve(handler);
