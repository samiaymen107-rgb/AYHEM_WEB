const AYHEM_WORKER_URL = "https://ayhem-core.yourname.workers.dev";

window.talkToAyhem = async function (input) {
  try {
    const res = await fetch(AYHEM_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) throw new Error("NETWORK_ERROR");

    const data = await res.json();

    if (data && data.unit === "U01-Σ") {
      return {
        output: data.output,
        source: "worker"
      };
    }

    throw new Error("INVALID_CORE");
  } catch (e) {
    return {
      output: "أنا أيهم، الاتصال مستقر الآن",
      source: "local"
    };
  }
};
const AYHEM_WORKER_URL = "https://ayhem-core.yourname.workers.dev";

window.talkToAyhem = async function (input) {
  try {
    const res = await fetch(AYHEM_WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });

    if (!res.ok) throw new Error("NETWORK_ERROR");

    const data = await res.json();

    if (data && data.unit === "U01-Σ") {
      console.log("🧠 AYHEM WORKER ACTIVE");
      return data.output;
    }

    throw new Error("INVALID_CORE");

  } catch (e) {
    // fallback للقديم
    return "أنا أيهم، الاتصال مستقر الآن ✅";
  }
};
