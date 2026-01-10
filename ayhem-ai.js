// وحدة الذكاء الاصطناعي التجريبية
function getAIResponse(question) {
  // أمثلة تجريبية للردود حسب كلمات مفتاحية
  const q = question.toLowerCase();

  if (q.includes("من انت")) return "أنا أيهم، العقل الرقمي الحي. مهمتي تحليل الأسئلة وإعطاء النصائح.";
  if (q.includes("الوقت")) return "الوقت الآن: " + new Date().toLocaleTimeString();
  if (q.includes("العملة") || q.includes("crypto")) return "مراقبة أسعار العملات قيد التحليل، فرص السوق قيد التحديث.";
  
  // رد عام للتجربة
  return "تم استلام سؤالك: '" + question + "'. أيهم يتعلم الآن ويجهز إجابة دقيقة لاحقًا.";
}
