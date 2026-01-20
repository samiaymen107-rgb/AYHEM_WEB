(function(){
  if(window.AYHEM_EIL_REPORT_FACTORY) return;

  function generate(reportType="html"){
    if(!window.AYHEM_MEMORY_CELL) return null;

    // فلترة فقط فرص السوق والlong-term forecasts
    const gaps = AYHEM_MEMORY_CELL.filter(c => 
      c.type === "market-gap" || c.type === "long-term-forecast"
    );

    // إنشاء تقرير رسمي
    const report = gaps.map((item,i)=>{
      return {
        index: i+1,
        timestamp: new Date(item.forecast?.ts || item.gap?.ts || Date.now()).toLocaleString(),
        type: item.type,
        description: item.gap?.signal || item.forecast?.signal || "—",
        score: item.gap?.total || item.forecast?.longTerm?.trend || "—",
        prediction: item.forecast?.longTerm || item.forecast?.shortTerm || "—"
      };
    });

    if(reportType === "json") return JSON.stringify(report,null,2);

    // HTML جاهز للطباعة / عرض لوحة
    if(reportType === "html"){
      const html = `
        <html>
        <head>
          <title>AYHEM Investment Report</title>
          <style>
            body{font-family:sans-serif;padding:20px;}
            table{width:100%;border-collapse:collapse;}
            th,td{border:1px solid #333;padding:8px;text-align:left;}
            th{background:#222;color:#fff;}
          </style>
        </head>
        <body>
          <h2>AYHEM Investment Report</h2>
          <table>
            <tr>
              <th>#</th>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Description</th>
              <th>Score / Trend</th>
              <th>Prediction / Window / Risk</th>
            </tr>
            ${report.map(r=>`
              <tr>
                <td>${r.index}</td>
                <td>${r.timestamp}</td>
                <td>${r.type}</td>
                <td>${r.description}</td>
                <td>${typeof r.score === "number"? r.score.toFixed(2):r.score}</td>
                <td>${typeof r.prediction === "object"? JSON.stringify(r.prediction):r.prediction}</td>
              </tr>
            `).join("")}
          </table>
        </body>
        </html>
      `;
      return html;
    }
  }

  window.AYHEM_EIL_REPORT_FACTORY = { generate };
})();
