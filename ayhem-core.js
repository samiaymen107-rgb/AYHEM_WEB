const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

function addMsg(text, type){
  const d = document.createElement("div");
  d.className = "msg " + type;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

sendBtn.onclick = async () => {
  const t = input.value.trim();
  if (!t) return;

  input.value = "";
  addMsg(t, "user");

  addMsg("...", "ai"); // مؤقت

  const reply = await window.AYHEM_SEND(t);

  // إزالة الثلاث نقاط
  chat.removeChild(chat.lastChild);

  if (reply && reply.trim()) {
    addMsg(reply, "ai");
  } else {
    addMsg("⚠️ الواركس لم يُرجع رد", "ai");
  }
};
