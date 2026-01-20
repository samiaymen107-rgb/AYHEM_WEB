(function(){
  if (window.AYHEM_ECON_PREDICTOR) return;

  function predict(gap){
    return {
      direction: gap.total > 40 ? "📈 صاعد" : "⚖️ متذبذب",
      window: gap.total > 40 ? "دخول مبكر" : "مراقبة",
      risk: gap.score.sovereignty < 5 ? "مخاطر تنظيمية" : "منخفضة"
    };
  }

  window.AYHEM_ECON_PREDICTOR = { predict };
})();
