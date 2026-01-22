fetch("config.json")
  .then(res => res.json())
  .then(config => {
    const app = document.getElementById("app");
    Object.keys(config).forEach(section => {
      const secDiv = document.createElement("div");
      secDiv.innerHTML = `<h2>${section.toUpperCase()}</h2>`;
      config[section].forEach(file => {
        const fileDiv = document.createElement("div");
        fileDiv.innerHTML = `<strong>${file.name}</strong> — <em>محتوى القالب هنا</em>`;
        secDiv.appendChild(fileDiv);
      });
      app.appendChild(secDiv);
    });
  });
