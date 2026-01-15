const chat = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");

function addMsg(text, type) {
  const d = document.createElement("div");
  d.className = "msg " + type;
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}

sendBtn.onclick = async () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addMsg(text, "user");

  const reply = await window.AYHEM_SEND(text);
  addMsg(reply, "ai");
};
