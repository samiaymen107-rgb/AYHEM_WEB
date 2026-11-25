/**
 * AYHEM Verification Core v1
 * Local deterministic quality checks. This is NOT a fact-checking database,
 * web search, legal authority, or language model. It flags risk patterns only.
 */
const MAX_TEXT = 12000;
const normalize = value => String(value || "").normalize("NFKC").toLocaleLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآ]/g, "ا").replace(/\s+/g, " ").trim();
const includesAny = (value, terms) => terms.some(term => value.includes(normalize(term)));

export function buildAyhemVerificationContext(prompt) {
  const p = String(prompt || "").slice(0, 4000);
  return [
    "تعليمات تحقق إلزامية من AYHEM VERIFICATION CORE:",
    "لا تخترع أسماء مؤسسات أو وزارات أو قوانين أو حدوداً جغرافية أو أرقاماً.",
    "لا تعتبر الذاكرة المحلية أو السحابية دليلاً مستقلاً.",
    "صنّف المعلومات إلى: مؤكدة بمصدر، مقدمة من المستخدم، سياق سابق، استنتاج، أو تحتاج إلى تحقق.",
    "عند ذكر مؤسسة أو قانون، اذكر مصدراً رسمياً محدداً إن كان متاحاً؛ وإلا قل إن الاسم أو الاختصاص يحتاج إلى تحقق.",
    "إذا كان الجواب ناقصاً أو لا تعرف، صرّح بذلك بدلاً من ملء الفراغ بالتخمين.",
    "أجب عن جميع أجزاء السؤال، ولا تعرض جدولاً أو قائمة مبتورة."
  ].join("\n");
}

/**
 * Returns transparent heuristic warnings. A clean result means only that no
 * configured pattern fired; it does not prove factual correctness.
 */
export function verifyAyhemAnswer(prompt, answer) {
  const p = normalize(prompt).slice(0, MAX_TEXT);
  const a = normalize(answer).slice(0, MAX_TEXT);
  const findings = [];
  const add = (code, severity, message) => findings.push({ code, severity, message });

  if (!a) add("empty_answer", "high", "لم يصل محتوى كافٍ لفحص الإجابة.");
  if (includesAny(p, ["سيدي بوزيد"]) && includesAny(a, ["المملكة المغربية", "المغرب", "المغربية"])) {
    add("geography_conflict", "high", "توجد إشارة إلى المغرب في إجابة عن سيدي بوزيد؛ راجع الدولة والحدود الجغرافية.");
  }

  const asksAuthorities = includesAny(p, ["جهات رسمية", "الجهات الرسمية", "مؤسسات رسمية", "الجهات الادارية", "الجهات الإدارية", "وزارات", "السلطات المختصة"]);
  const suspectInstitutionNames = [
    "وزارة التنمية الريفية",
    "وزارة الزراعة",
    "الهيئة الوطنية للبيئة",
    "الهيئة الوطنية للبحوث الزراعية",
    "institut national de la recherche agronomique",
    "inra"
  ];
  const foundNames = suspectInstitutionNames.filter(name => a.includes(normalize(name)));
  if (asksAuthorities && foundNames.length) {
    add("institution_name_unverified", "high", "تتضمن الإجابة أسماء مؤسسات تحتاج إلى مطابقة مع التسمية التونسية الرسمية: " + foundNames.join("، ") + ".");
  } else if (asksAuthorities && /وزارة|وكالة|ديوان|مندوبية|معهد|هيئة/.test(a) && !/https?:\/\/|\.gov\.tn|مصدر رسمي|الموقع الرسمي/.test(a)) {
    add("authority_without_source", "medium", "ذُكرت جهات أو مؤسسات دون إظهار مصدر رسمي؛ لا يمكن اعتماد أسمائها أو اختصاصاتها قبل التثبت.");
  }

  const asksEvidence = includesAny(p, ["مؤكدة", "الحقائق", "الافتراضات", "تحتاج إلى تحقق", "ميّز بين"]);
  if (asksEvidence && !includesAny(a, ["مؤكد", "موثق", "موثّق", "يحتاج إلى تحقق", "تحتاج إلى تحقق", "افتراض", "استنتاج"])) {
    add("evidence_labels_missing", "medium", "لم تظهر بوضوح تصنيفات الأدلة المطلوبة في السؤال.");
  }

  const trimmed = String(answer || "").trim();
  const looksTruncated = /(?:\|\s*\*\*[^\n]{0,50}$|\b(?:من|في|على|إلى|عن|و)\s*$|\b(?:the|and|of|to)\s*$)/iu.test(trimmed)
    || (trimmed.length > 0 && /(?:\|\s*$|\*\*[^*]*$)/.test(trimmed));
  if (looksTruncated) add("possible_truncation", "high", "يبدو أن نهاية الإجابة أو الجدول مبتورة؛ يلزم استكمالها قبل اعتمادها.");

  if (p.length > 120 && trimmed.length < 100) {
    add("possible_incomplete_answer", "medium", "الإجابة قصيرة جداً مقارنة بطلب متعدد العناصر؛ افحص اكتمال جميع النقاط.");
  }

  const high = findings.some(item => item.severity === "high");
  return Object.freeze({
    version: "1.0.0",
    mode: "local_heuristic_checks",
    status: high ? "review_required" : findings.length ? "caution" : "no_pattern_detected",
    passed: findings.length === 0,
    findings,
    disclaimer: "هذا فحص آلي محلي للأنماط وليس تحققاً من الحقائق أو مصدراً خارجياً. عدم ظهور تحذير لا يثبت صحة الإجابة."
  });
}
