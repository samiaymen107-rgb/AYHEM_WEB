// ayhem-voice-out.js
(function () {
  if (window.AYHEM_VOICE_OUT) return;

  const voice = {
    speak(text, lang = "ar-SA") {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;
      speechSynthesis.speak(utter);
      console.log("[AYHEM][VOICE] نطق");
    }
  };

  window.AYHEM_VOICE_OUT = voice;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("voice", voice);
  }
})();
