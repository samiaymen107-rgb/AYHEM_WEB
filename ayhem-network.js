import {getMemory,saveMemory} from "./ayhem-memory.js";
import {analyzeInteraction,compressMemory,getLearningContext} from "./ayhem-learning.js";

const API="https://autumn-brook-5828.samiaymen720.workers.dev";

export async function askAYHEM(prompt,persona){
  analyzeInteraction(prompt);

  const memory=getMemory();
  if(memory.length%15===0) compressMemory(memory);

  const learning=getLearningContext();

  const r=await fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      prompt,
      memory,
      learning,
      persona,
      identity:"AYHEM"
    })
  });

  const d=await r.json();
  saveMemory("user",prompt);
  saveMemory("assistant",d.reply);
  return d.reply;
}
