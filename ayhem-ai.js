const ayhemAI = {
  knowledgeBase: [],

  processQuestion: async function(question) {
    this.knowledgeBase.push({ question, timestamp: new Date() });
    const similar = persistentMemory.searchSimilar(question);
    let advice = similar.length
      ? `🔹 استنادًا إلى أسئلة سابقة مشابهة: ${similar[similar.length -1].answer}`
      : this.generateAdvice(question);

    persistentMemory.saveEntry(question, advice);

    return Promise.resolve(`
      <strong>سؤالك:</strong> ${question}<br><br>
      <strong>تحليل ونصائح:</strong><br>${advice}
    `);
  },

  generateAdvice: function(question) {
    const trends = [
      "التركيز على التقنيات الرقمية المتقدمة",
      "مراقبة أسعار العملات المشفرة والفرص العالمية",
      "استثمار الوقت في مهارات الذكاء الاصطناعي",
      "الاطلاع على فجوات السوق في الخدمات عبر الإنترنت"
    ];
    const randomIndex = Math.floor(Math.random() * trends.length);
    return trends[randomIndex] + " 🔹";
  }
};
