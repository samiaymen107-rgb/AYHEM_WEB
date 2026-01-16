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
    return div;
  }

  async function send() {
    const text = input.value.trim();
    if (!text) return;

    addMsg(text, "me");
    input.value = "";

    // أيهم يفكر
    const aiMsg = addMsg("🤔 أيهم يفكّر...", "ai");

    // تأخير ذكي (نظرة)
    await new Promise(r => setTimeout(r, 600));
    aiMsg.textContent = "👀 أيهم يراجع...";

    // تأخير (يكتب)
    await new Promise(r => setTimeout(r, 600));
    aiMsg.textContent = "✍️ أيهم يكتب...";

    if (typeof window.AYHEM_SEND === "function") {
      const reply = await window.AYHEM_SEND(text);
      aiMsg.textContent = reply;
    } else {
      aiMsg.textContent = "⚠️ الربط غير متوفر";
    }
  }

  sendBtn.onclick = send;
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") send();
  });
})();
