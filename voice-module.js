import { AyhemCore } from "./ayhem-core.js";

export const VoiceModule = (() => {
  let recognition;
  let speechSupported = false;

  function init() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = "ar-TN";
      recognition.continuous = false;
      speechSupported = true;

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        console.log("🎙️ تم التعرف على الصوت:", text);
        AyhemCore.archive({ text });
      };

      recognition.onerror = (err) => console.error("⚠️ خطأ في التعرف على الصوت:", err);
    } else {
      console.warn("⚠️ التعرف على الصوت غير مدعوم في هذا المتصفح");
    }

    console.log("✅ وحدة الصوت الرقمي جاهزة");
    return { startListening, stopListening };
  }

  function startListening() {
    if (speechSupported && recognition) recognition.start();
  }

  function stopListening() {
    if (speechSupported && recognition) recognition.stop();
  }

  return { init, startListening, stopListening };
})();
