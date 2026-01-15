const WORKER_URL = "PUT_YOUR_OLD_WORKER_URL_HERE";

window.AYHEM_SEND = async function (text) {
  if (!text || !text.trim()) return null;

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
    return data.reply || null;

  } catch (e) {
    console.error("AYHEM NETWORK ERROR", e);
    return null;
  }
};
