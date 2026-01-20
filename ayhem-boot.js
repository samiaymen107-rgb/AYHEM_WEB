// ayhem-boot.js
(function () {
  console.log("AYHEM BOOT ▶");

  if (window.AYHEM_NODE_REGISTRY) {
    console.log("NODES:", window.AYHEM_NODE_REGISTRY.list());
  }

  if (window.AYHEM_MEMORY_CELL) {
    window.AYHEM_MEMORY_CELL.push({ system: "boot" });
  }
})();
