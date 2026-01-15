const chat = document.getElementById("chat");
const input = document.getElementById("input");

/* رابط Workers (كما كان يعمل سابقًا) */
const WORKERS_URL = "https://YOUR-WORKER-URL";

function addMsg(text,type){
  const d=document.createElement("div");
  d.className="msg "+type;
  d.textContent=text;
  chat.appendChild(d);
  chat.scrollTop=chat.scrollHeight;
}

window.send = async function(){
  const text = input.value.trim();
  if(!text) return;
  input.value="";
  addMsg(text,"user");

  const res = await fetch(WORKERS_URL,{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ message:text })
  });

  const data = await res.json();
  addMsg(data.reply,"ai");
};
