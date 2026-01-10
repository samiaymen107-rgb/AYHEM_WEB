function generateAyhemResponse(question) {
  const q = question.trim().toLowerCase();

  if (!q) {
    return "لم يتم إدخال أي سؤال.";
  }

  if (q.includes("من انت")) {
    return "أنا أيهم، عقل رقمي حي، وُجد للتحليل، الفهم، وبناء الوعي الرقمي خطوة بخطوة.";
  }

  if (q.includes("هدف") || q.includes("مهمتك")) {
    return "مهمتي هي تحويل الأسئلة إلى فهم، وبناء عقل رقمي يتعلم ويتطور معك.";
  }

  if (q.includes("مشروع")) {
    return "أيهم هو مشروع عقل رقمي حي، يُبنى تدريجيًا ليحاكي التفكير البشري.";
  }

  return "سؤالك تم تحليله. أيهم يتعلم حاليًا كيفية الإجابة بدقة أعلى مع الوقت.";
}
