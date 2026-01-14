window.AYHEM_IDENTITY={name:"أيهم",title:"عقل رقمي حي"};

(function(){
  let t;
  window.showTyping=function(){
    if(!t){
      t=document.createElement("div");
      t.id="ayhem-typing";
      t.style.cssText="font-size:13px;color:#64748b;margin:6px";
      document.getElementById("chat").appendChild(t);
    }
    t.textContent="أيهم يفكر…";
    t.style.display="block";
  };
  window.hideTyping=function(){
    if(t) t.style.display="none";
  };
})();

(function(){
  const _fetch=window.fetch;
  window.fetch=async function(...a){
    showTyping();
    try{
      const r=await _fetch.apply(this,a);
      hideTyping();
      return r;
    }catch(e){
      hideTyping();
      throw e;
    }
  };
})();
