const AYHEM_API = "https://autumn-brook-5828.samiaymen720.workers.dev";

async function talkToAyhem(prompt) {
  try {
    const response = await fetch(AYHEM_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      reply: "أيهم صامت الآن... حاول لاحقًا"
    };
  }
}
