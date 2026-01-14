import {askAYHEM} from "./ayhem-network.js";
import {speak} from "./ayhem-voice.js";
import {loadIdentity, extractIdentity} from "./ayhem-identity.js";

window.AYHEM_SEND = async function(text, addMsg){

  // استخراج وتخزين الهوية
  extractIdentity(text);

  const identity = loadIdentity();

  // اعتراض سؤال الاسم (ذاكرة حقيقية)
  if (/ما\s+اسمي|هل\s+تتذكر\s+اسمي/.test(text)) {
    const reply = identity.name
      ? `نعم، اسمك ${identity.name}.`
      : "لم تخبرني باسمك بعد.";
    addMsg(reply,"ai");
    speak(reply);
    return;
  }

  const w = addMsg("أيهم يفكر…","ai");
  try{
    const r = await askAYHEM(text);
    w.textContent = r;
    speak(r);
  }catch{
    w.textContent = "⚠️ خطأ اتصال";
  }
};
