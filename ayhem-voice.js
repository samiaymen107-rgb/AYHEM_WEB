export function speak(text){
  if(!("speechSynthesis" in window)) return;
  const u=new SpeechSynthesisUtterance(text);
  u.lang="ar-SA"; u.rate=1;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
