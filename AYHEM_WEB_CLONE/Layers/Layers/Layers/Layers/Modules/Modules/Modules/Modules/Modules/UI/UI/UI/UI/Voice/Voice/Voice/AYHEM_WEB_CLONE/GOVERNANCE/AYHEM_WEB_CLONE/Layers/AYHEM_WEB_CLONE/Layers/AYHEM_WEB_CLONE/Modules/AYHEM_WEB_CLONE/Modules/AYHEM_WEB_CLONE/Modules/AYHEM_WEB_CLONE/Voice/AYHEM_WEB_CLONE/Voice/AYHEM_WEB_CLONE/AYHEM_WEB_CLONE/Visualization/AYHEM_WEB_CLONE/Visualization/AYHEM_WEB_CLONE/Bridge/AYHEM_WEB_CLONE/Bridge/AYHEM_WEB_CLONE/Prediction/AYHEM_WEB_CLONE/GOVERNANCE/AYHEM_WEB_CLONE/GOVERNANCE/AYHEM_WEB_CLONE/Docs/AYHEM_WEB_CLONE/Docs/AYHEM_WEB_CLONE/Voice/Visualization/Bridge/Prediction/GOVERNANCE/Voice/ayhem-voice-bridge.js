/**
 * Voice Bridge
 * يربط ayhem-voice-out.js دون تعديل عليه
 */

(function(){
  if(typeof window !== "undefined") {
    window.AYHEM_VOICE = {
      status: "LINKED",
      source: "ayhem-voice-out.js"
    };
    console.log("[AYHEM] Voice bridge connected");
  }
})();
