const WORKER_URL = "https://YOUR-WORKER.yourname.workers.dev";

window.AYHEM_SEND = async function (text, addMsg) {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session: "ayhem-main"
      })
    });

    const data = await res.json();
    addMsg(data.reply || "…", "ai");
  } catch (e) {
    addMsg("⚠️ تعذر الاتصال بالواركس", "ai");
  }
};
