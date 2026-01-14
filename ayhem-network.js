import {getMemory,saveMemory} from "./ayhem-memory.js";
const API="https://autumn-brook-5828.samiaymen720.workers.dev";
export async function askAYHEM(prompt,persona){
  const memory=getMemory();
  const r=await fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({prompt,memory,persona,identity:"AYHEM"})
  });
  const d=await r.json();
  saveMemory("user",prompt);
  saveMemory("assistant",d.reply);
  return d.reply;
}
