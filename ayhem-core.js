import { getMemory, saveMemory } from "./ayhem-memory.js";
import { analyzeInteraction, compressMemory, getLearningContext } from "./ayhem-learning.js";

const API = "https://autumn-brook-5828.samiaymen720.workers.dev";

window.AYHEM_SEND = async function(prompt, addMsg){

  analyzeInteraction(prompt);

  const memory = getMemory();
  if (memory.length % 15 === 0) compressMemory(memory);

  const learning = getLearningContext();

  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      memory,
      learning,
      identity: "AYHEM"
    })
  });

  const d = await r.json();

  saveMemory("user", prompt);
  saveMemory("assistant", d.reply);

  addMsg(d.reply, "ai");
};
