async function askAI(question) {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question })
  });
  const data = await res.json();
  return data.output_text || data; 
}

document.getElementById("btnAsk").addEventListener("click", async () => {
  const q = document.getElementById("txtAsk").value;
  const reply = await askAI(q);
  document.getElementById("divAnswer").innerText = reply;
});
