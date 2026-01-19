// MEMORY-LINK.js
// طبقة ربط مركزية بين جميع وحدات الذاكرة (قصيرة / طويلة / ذكية)
// تصميم قابل للتوسع – بدون تبعيات خارجية

export const MemoryLink = (() => {
  const layers = new Map(); // { layerName => { read, write, meta } }
  const links = new Set();  // روابط منطقية بين الطبقات

  function registerLayer(name, api) {
    if (!api || typeof api.read !== "function" || typeof api.write !== "function") {
      throw new Error("Invalid memory layer API");
    }
    layers.set(name, { ...api, meta: api.meta || {} });
    return true;
  }

  function linkLayers(from, to, rule = () => true) {
    if (!layers.has(from) || !layers.has(to)) return false;
    links.add({ from, to, rule });
    return true;
  }

  function write(layerName, payload) {
    const layer = layers.get(layerName);
    if (!layer) return false;

    layer.write(payload);

    // بث ذكي إلى الطبقات المرتبطة
    for (const l of links) {
      if (l.from === layerName && l.rule(payload)) {
        layers.get(l.to)?.write({
          source: layerName,
          payload,
          timestamp: Date.now()
        });
      }
    }
    return true;
  }

  function read(layerName, query) {
    const layer = layers.get(layerName);
    if (!layer) return null;
    return layer.read(query);
  }

  function status() {
    return {
      layers: [...layers.keys()],
      links: links.size,
      timestamp: Date.now()
    };
  }

  return {
    registerLayer,
    linkLayers,
    write,
    read,
    status
  };
})();
