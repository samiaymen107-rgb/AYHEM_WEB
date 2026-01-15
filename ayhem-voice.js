window.speak = function(text){
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA";
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
};
