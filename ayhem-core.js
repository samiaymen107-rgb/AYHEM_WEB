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
  const r = await window.AYHEM_SEND(t);
  addMsg(r || "…", "ai");
};
