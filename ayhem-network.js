const WORKER_URL = "PUT_YOUR_EXISTING_WORKER_URL_HERE";

window.AYHEM_SEND = async function (text) {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session: "ayhem-main"
      })
    });

    if (!res.ok) {
      return "⚠️ الواركس لم يرد";
    }

    const data = await res.json();

    if (!data || !data.reply) {
      return "⚠️ رد غير صالح من الواركس";
    }

    return data.reply;

  } catch (e) {
    return "⚠️ انقطع الاتصال بالواركس";
  }
};
