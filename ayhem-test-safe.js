import { ayhemSafeThink } from "./ayhem-core-safe.js";

window.runAyhemSafe = function () {
  const result = ayhemSafeThink("أنا متوتر قليلاً");
  console.log("AYHEM SAFE:", result);
};
