import {askAYHEM} from "./ayhem-network.js";
import {speak} from "./ayhem-voice.js";

/* ===== ذاكرة الاسم (حاكمة) ===== */
function getName(){
  return localStorage.getItem("AYHEM_OWNER_NAME");
}

function saveName(text){
  const m = text.match(/اسمي\s+(.+)/);
  if(m){
    localStorage.setItem("AYHEM_OWNER_NAME", m[1].trim());
  }
}

window.AYHEM_SEND = async function(text, addMsg){
  // خزّن الاسم فورًا
  saveName(text);

  // اعتراض سؤال الاسم محليًا (بدون API)
  if (/ما\s+اسمي|هل\s+تتذكر\s+اسمي/.test(text)) {
    const name = getName();
    const reply = name
      ? `نعم، اسمك ${name}.`
      : "لم تخبرني باسمك بعد.";
    const w = addMsg(reply,"ai");
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
