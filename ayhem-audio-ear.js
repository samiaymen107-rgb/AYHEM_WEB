// ayhem-audio-ear.js
(function () {
  if (window.AYHEM_AUDIO_EAR) return;

  const ear = {
    stream: null,
    audioCtx: null,
    analyser: null,
    data: null,

    async start() {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(this.stream);

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      source.connect(this.analyser);

      this.data = new Uint8Array(this.analyser.frequencyBinCount);
      console.log("[AYHEM][EAR] السمع نشط");
    },

    listen() {
      if (!this.analyser) return null;
      this.analyser.getByteFrequencyData(this.data);
      return Array.from(this.data);
    },

    stop() {
      if (this.stream) {
        this.stream.getTracks().forEach(t => t.stop());
        this.stream = null;
      }
    }
  };

  window.AYHEM_AUDIO_EAR = ear;

  if (window.AYHEM_NODE_REGISTRY) {
    window.AYHEM_NODE_REGISTRY.register("ear", ear);
  }
})();
