import {askAYHEM} from "./ayhem-network.js";
import {speak} from "./ayhem-voice.js";
import {rememberNameFromText, getRememberedName} from "./ayhem-memory.js";

window.AYHEM_SEND = async function(text, addMsg){

  // حفظ الاسم دائمًا
  rememberNameFromText(text);

  // اعتراض محلي حاسم لسؤال الاسم
  if (/ما\s+اسمي|هل\s+تتذكر\s+اسمي/.test(text)) {
    const name = getRememberedName();
    const reply = name ? `نعم، اسمك ${name}.` : "لم تخبرني باسمك بعد.";
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
