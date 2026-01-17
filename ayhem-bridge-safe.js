const AYHEM_ENDPOINT = "https://ayhem-core.yourname.workers.dev";

export async function talkToAyhem(input) {
  try {
    const res = await fetch(AYHEM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ input })
    });

    if (!res.ok) {
      throw new Error("AYHEM NETWORK ERROR");
    }

    const data = await res.json();
    return data;

  } catch (e) {
    return {
      state: "offline",
      output: "أيهم صامت الآن",
      error: e.message
    };
  }
}
