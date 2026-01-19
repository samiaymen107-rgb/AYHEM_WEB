// TEMPLATE_SESSION_LAYER.js
// طبقة جلسة تشغيل مؤقتة (Session Memory)
// تخزين آني، يُمسح تلقائيًا، مرتبط بـ MEMORY-LINK

export const SessionLayer = (() => {
  const sessionStore = [];

  function write(entry) {
    sessionStore.push({
      entry,
      timestamp: Date.now()
    });
  }

  function read(filter = null) {
    if (!filter) return [...sessionStore];
    return sessionStore.filter(e =>
      JSON.stringify(e.entry).includes(filter)
    );
  }

  function clear() {
    sessionStore.length = 0;
  }

  function meta() {
    return {
      type: "session",
      volatile: true,
      size: sessionStore.length
    };
  }

  return {
    write,
    read,
    clear,
    meta
  };
})();
