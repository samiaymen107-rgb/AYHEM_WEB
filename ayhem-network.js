import {getMemory, saveMemory} from "./ayhem-memory.js";
import {extractFacts, smartCompress, getSmartContext} from "./ayhem-smart-memory.js";

const API = "https://autumn-brook-5828.samiaymen720.workers.dev";

export async function askAYHEM(prompt, persona){
  extractFacts(prompt);

  const memory = getMemory();
  const compressedMemory = smartCompress(memory);
  const smart = getSmartContext();

  const r = await fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({
      prompt,
      memory: compressedMemory,
      smart,
      persona,
      identity:"AYHEM"
    })
  });

  const d = await r.json();
  saveMemory("user", prompt);
  saveMemory("assistant", d.reply);
  return d.reply;
}
