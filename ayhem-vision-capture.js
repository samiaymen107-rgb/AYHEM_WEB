// ayhem-vision-capture.js
(function () {
  if (window.AYHEM_VISION_CAPTURE) return;

  const capture = {
    canvas: document.createElement("canvas"),
    ctx: null,

    grab(videoEl) {
      if (!this.ctx) {
        this.ctx = this.canvas.getContext("2d");
      }
      this.canvas.width = videoEl.videoWidth;
      this.canvas.height = videoEl.videoHeight;
      this.ctx.drawImage(videoEl, 0, 0);
      return this.canvas.toDataURL("image/jpeg", 0.6);
    }
  };

  window.AYHEM_VISION_CAPTURE = capture;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("vision-capture", capture);
  }
})();
