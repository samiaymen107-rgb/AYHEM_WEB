/**
 * AYHEM Reasoning Core v1
 * Deterministic, offline planning scaffold. It does not claim model-level reasoning.
 * No network, provider, storage, or external side effects.
 */
const MAX_PROMPT = 4000;
const MAX_CONTEXT = 2600;

function clean(value) {
  return typeof value === "string" ? value.trim().slice(0, MAX_PROMPT) : "";
}

function classify(prompt) {
  const p = prompt.toLocaleLowerCase();
  const has = (...terms) => terms.some(term => p.includes(term));
  if (has("قارن", "مقارنة", "الفرق بين", "compare", "versus", " vs ")) return "compare";
  if (has("حلل", "تحليل", "لماذا", "سبب", "analy", "evaluate")) return "analyze";
  if (has("اختر", "هل أ", "قرار", "أفضل خيار", "should i", "decide")) return "decision";
  if (has("خطوات", "قائمة", "checklist", "todo", "مهام")) return "checklist";
  if (has("خطة", "أريد أن", "اريد ان", "كيف أبدأ", "كيف ابدأ", "نفذ", "أنجز", "انجز", "plan", "build", "create")) return "plan";
  return "unknown";
}

const templates = {
  plan: {
    label: "تخطيط هدف",
    steps: ["تحديد النتيجة المطلوبة ومعيار النجاح", "جمع المعطيات والقيود والموارد المتاحة", "تقسيم الهدف إلى مراحل صغيرة مرتبة", "تنفيذ خطوة قابلة للتحقق في كل مرة", "مراجعة النتيجة وتحديث الخطة"],
  },
  compare: {
    label: "مقارنة خيارات",
    steps: ["تحديد الخيارات محل المقارنة", "اختيار معايير موحدة وعادلة", "جمع الأدلة لكل خيار مع مصدرها", "مقارنة المنافع والتكاليف والمخاطر", "إظهار النتيجة وما قد يغيّرها"],
  },
  analyze: {
    label: "تحليل مسألة",
    steps: ["صياغة السؤال أو المشكلة بدقة", "فصل الوقائع عن الافتراضات", "تحديد الأسباب والعوامل المؤثرة", "اختبار التفسيرات البديلة", "عرض الاستنتاج وحدود الثقة"],
  },
  decision: {
    label: "دعم قرار",
    steps: ["تحديد القرار والموعد والقيود", "حصر البدائل الواقعية", "تقييم كل بديل وفق المعايير نفسها", "فحص المخاطر والنتائج غير القابلة للعكس", "تقديم توصية مشروطة مع سببها"],
  },
  checklist: {
    label: "قائمة تنفيذ",
    steps: ["حصر الأعمال المطلوبة", "ترتيبها حسب الاعتماد والأولوية", "تحديد دليل إنجاز لكل عمل", "تمييز ما ينتظر معلومة أو موافقة", "مراجعة العناصر غير المكتملة"],
  },
  unknown: {
    label: "فهم الطلب",
    steps: ["استخراج المطلوب الأساسي", "تحديد المعلومات الناقصة المؤثرة", "اختيار طريقة المعالجة المناسبة", "التحقق من الإجابة قبل عرضها"],
  },
};

function risks(prompt, kind) {
  const result = ["قد تكون بعض المعلومات ناقصة أو قديمة؛ يلزم التحقق من المصادر عند الحاجة."];
  if (/(قانون|قانوني|صحة|دواء|طبي|مال|استثمار|تمويل|عقد|إداري)/iu.test(prompt)) {
    result.push("الموضوع قد تكون له تبعات قانونية أو صحية أو مالية أو إدارية؛ لا تعتمد على الاستنتاج الآلي وحده.");
  }
  if (kind === "decision") result.push("لا تُنفّذ قراراً خارجياً أو غير قابل للعكس دون موافقة صريحة.");
  return result;
}

/** @returns {object} A bounded, inspectable reasoning plan. */
export function createAyhemReasoningPlan(input, options = {}) {
  const prompt = clean(input);
  const kind = classify(prompt);
  const template = templates[kind];
  const steps = template.steps.map((title, index) => ({
    id: index + 1,
    title,
    depends_on: index ? [index] : [],
    completion_check: index === template.steps.length - 1 ? "النتيجة موثقة ويمكن مراجعتها" : "توجد مخرجات واضحة قبل الانتقال",
  }));
  return Object.freeze({
    version: "1.0.0",
    mode: "local_deterministic_scaffold",
    intent: kind,
    intent_label: template.label,
    goal: prompt.slice(0, 600),
    steps,
    evidence_policy: [
      "مؤكد: ما تم التحقق منه مباشرة",
      "موثق: ما يسنده مستند أو مصدر محدد",
      "سياق: معلومات سابقة مساعدة وليست إثباتاً",
      "يحتاج تحققاً: معلومة لم تُفحص بعد",
      "استنتاج: نتيجة تحليلية وليست حقيقة مستقلة",
    ],
    assumptions: ["لا تُعامل الذاكرة أو التصحيحات السابقة كحقائق مؤكدة دون فحص."],
    risks: risks(prompt, kind),
    completion_criteria: ["الإجابة تعالج الطلب الأصلي", "تمييز الوقائع عن الافتراضات والاستنتاجات", "ذكر النواقص والمخاطر المهمة"],
    requires_clarification: kind === "unknown" && prompt.length < 24,
  });
}

/** Compact context for an optional language provider; never performs a request. */
export function buildAyhemReasoningContext(plan, { maxChars = MAX_CONTEXT } = {}) {
  if (!plan || plan.mode !== "local_deterministic_scaffold") return "";
  const lines = [
    "مخطط محلي مساعد من AYHEM (ليس نتيجة نهائية ولا دليلاً):",
    "نوع الطلب: " + plan.intent_label,
    "الهدف: " + plan.goal,
    "خطوات مقترحة:",
    ...plan.steps.map(step => step.id + ". " + step.title + " — معيار الإكمال: " + step.completion_check),
    "سياسة الأدلة: " + plan.evidence_policy.join("؛ "),
    "افتراضات ومخاطر: " + [...plan.assumptions, ...plan.risks].join("؛ "),
    "تحقق من الوقائع ولا تدّع تنفيذ أي خطوة خارجية.",
  ];
  return lines.join("\n").slice(0, Math.max(300, Math.min(MAX_CONTEXT, maxChars)));
}
