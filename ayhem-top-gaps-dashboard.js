(function(){
  if (window.AYHEM_TOP_GAPS_DASHBOARD) return;

  function render(containerId = "ayhem-top-gaps"){
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!window.AYHEM_MARKET_GAP_ENGINE) {
      el.innerHTML = "⚠️ Market Gap Engine غير متوفر";
      return;
    }

    const gaps = AYHEM_MARKET_GAP_ENGINE.top(5);

    el.innerHTML = `
      <h3>🌍 Top Global Market Gaps</h3>
      <ul>
        ${gaps.map(g => {
          const p = window.AYHEM_ECON_PREDICTOR
            ? AYHEM_ECON_PREDICTOR.predict(g)
            : {};

          return `
            <li style="margin-bottom:12px">
              <strong>إشارة:</strong> ${g.signal}<br/>
              <strong>القيمة:</strong> ${g.total.toFixed(1)} / 60<br/>
              <strong>الاتجاه:</strong> ${p.direction || "-"}<br/>
              <strong>نافذة الدخول:</strong> ${p.window || "-"}<br/>
              <strong>المخاطر:</strong> ${p.risk || "-"}
            </li>
          `;
        }).join("")}
      </ul>
    `;
  }

  window.AYHEM_TOP_GAPS_DASHBOARD = { render };
})();
