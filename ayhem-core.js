(function () {
  const input = document.getElementById("input");
  const sendBtn = document.getElementById("sendBtn");
  const chat = document.getElementById("chat");

  function addMsg(text, who) {
    const div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;

    addMsg(text, "me");
    input.value = "";
    addMsg("…", "ai");

    if (typeof window.AYHEM_SEND === "function") {
      const reply = await window.AYHEM_SEND(text);
      chat.lastChild.textContent = reply;
    } else {
      chat.lastChild.textContent = "⚠️ الربط غير متوفر";
    }
  }

  sendBtn.onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
})();
