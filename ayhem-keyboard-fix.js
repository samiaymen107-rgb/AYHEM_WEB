/* AYHEM TikTok Keyboard Fix - Safe */
(function(){
  if(!window.visualViewport) return;

  const bar = document.querySelector(".input-bar");
  if(!bar) return;

  function adjust(){
    const vv = window.visualViewport;
    const offset = window.innerHeight - vv.height - vv.offsetTop;
    bar.style.bottom = (offset > 0 ? offset : 0) + "px";
  }

  visualViewport.addEventListener("resize", adjust);
  visualViewport.addEventListener("scroll", adjust);
})();
