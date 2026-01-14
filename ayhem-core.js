import {askAYHEM} from "./ayhem-network.js";
import {speak} from "./ayhem-voice.js";
import {getPersona} from "./ayhem-dashboard.js";

window.AYHEM_SEND=async function(text,addMsg){
  const w=addMsg("أيهم يفكر…","ai");
  try{
    const r=await askAYHEM(text,getPersona());
    w.textContent=r; speak(r);
  }catch{ w.textContent="⚠️ خطأ اتصال"; }
};
