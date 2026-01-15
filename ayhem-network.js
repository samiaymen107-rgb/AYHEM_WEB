const WORKER_URL = "PUT_YOUR_EXISTING_WORKER_URL_HERE";

window.AYHEM_SEND = async function (text) {
  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session: "ayhem-main" })
    });
    const data = await res.json();
    return data.reply || "";
  } catch {
    return "";
  }
};
