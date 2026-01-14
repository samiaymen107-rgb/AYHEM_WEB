const PKEY="AYHEM_PERSONA";
export function getPersona(){
  return JSON.parse(localStorage.getItem(PKEY)||JSON.stringify({
    tone:"متزن",style:"واضح",verbosity:"متوسط"
  }));
}
export function setPersona(p){localStorage.setItem(PKEY,JSON.stringify(p));}
export function renderDashboard(){
  const p=getPersona();
  const d=document.createElement("div");
  d.style.cssText="position:fixed;bottom:70px;left:10px;background:#fff;padding:10px;border-radius:10px;z-index:9999";
  d.innerHTML=`
  <select id="tone"><option>متزن</option><option>ودي</option><option>حازم</option></select>
  <button>حفظ</button>`;
  d.querySelector("select").value=p.tone;
  d.querySelector("button").onclick=()=>setPersona({tone:d.querySelector("select").value});
  document.body.appendChild(d);
}
