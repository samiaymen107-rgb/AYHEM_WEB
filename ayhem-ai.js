const AYHEM_API = "https://autumn-brook-5828.samiaymen720.workers.dev";

export async function talkToAyhem(prompt) {
  try {
    const response = await fetch(AYHEM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error("AYHEM is not responding");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      reply: "أيهم صامت الآن... حاول لاحقًا"
    };
  }
}
