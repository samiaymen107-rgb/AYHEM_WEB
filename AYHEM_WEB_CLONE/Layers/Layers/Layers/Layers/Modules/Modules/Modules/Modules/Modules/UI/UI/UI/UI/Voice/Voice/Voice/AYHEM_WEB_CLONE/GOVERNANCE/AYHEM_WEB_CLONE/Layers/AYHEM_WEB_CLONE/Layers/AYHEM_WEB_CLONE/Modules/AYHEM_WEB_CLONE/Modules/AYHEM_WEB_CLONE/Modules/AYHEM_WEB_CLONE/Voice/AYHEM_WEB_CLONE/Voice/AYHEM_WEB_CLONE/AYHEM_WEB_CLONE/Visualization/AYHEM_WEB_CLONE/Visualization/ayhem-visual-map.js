fetch("../config.json")
  .then(r => r.json())
  .then(cfg => {
    const map = document.getElementById("map");
    Object.keys(cfg).forEach(section => {
      const box = document.createElement("div");
      box.className = "node";
      box.innerHTML = `<h3>${section}</h3>`;
      cfg[section].forEach(f => {
        const el = document.createElement("div");
        el.textContent = f.name;
        box.appendChild(el);
      });
      map.appendChild(box);
    });
  });
