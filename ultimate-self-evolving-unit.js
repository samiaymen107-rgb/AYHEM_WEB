export const UltimateSelfEvolvingUnit = (() => {
  let patterns = [];

  function init() {
    console.log("🚀 Ultimate Self-Evolving Unit جاهزة!");
    return { learn, getPatterns, clearPatterns };
  }

  function learn(entry) {
    const record = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      text: entry,
      priority: Math.floor(Math.random()*10)+1
    };
    patterns.push(record);
    persist();
  }

  function getPatterns() {
    return [...patterns].sort((a,b)=>b.priority - a.priority);
  }

  function clearPatterns() {
    patterns = [];
    persist();
  }

  function persist() {
    localStorage.setItem("AYHEM_ULTIMATE_PATTERNS", JSON.stringify(patterns));
  }

  return { init, learn, getPatterns, clearPatterns };
})();
