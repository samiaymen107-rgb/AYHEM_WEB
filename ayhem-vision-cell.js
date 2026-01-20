// ayhem-vision-cell.js
(function () {
  if (window.AYHEM_VISION) return;

  const vision = {
    stream: null,
    async start(videoEl) {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoEl.srcObject = this.stream;
      videoEl.play();
    },
    stop() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
    }
  };

  window.AYHEM_VISION = vision;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("vision", vision);
  }
})();
