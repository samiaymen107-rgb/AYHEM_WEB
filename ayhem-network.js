import {getMemory,saveMemory} from "./ayhem-memory.js";
import {getLongMemory,saveLongMemory} from "./ayhem-long-memory.js";

const API="https://autumn-brook-5828.samiaymen720.workers.dev";

export async function askAYHEM(prompt,persona){
  const shortMemory = getMemory();
  const longMemory  = getLongMemory().slice(-5); // فقط الأهم

  const r = await fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      prompt,
      memory: shortMemory,
      longMemory,
      persona,
      identity:"AYHEM"
    })
  });

  const d = await r.json();

  saveMemory("user",prompt);
  saveMemory("assistant",d.reply);

  // حفظ فقط إذا كان مفيدًا
  if(d.reply.length > 50){
    saveLongMemory(d.reply);
  }

  return d.reply;
}
