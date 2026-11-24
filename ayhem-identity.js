// AYHEM identity module: named export for ES modules and legacy browser global.
export const AyhemIdentity = Object.freeze({
  init() {
    return Object.freeze({ name: "AYHEM", lang: "ar" });
  }
});

if (typeof window !== "undefined") {
  window.AYHEM_IDENTITY = Object.freeze({ name: "AYHEM", lang: "ar" });
}
