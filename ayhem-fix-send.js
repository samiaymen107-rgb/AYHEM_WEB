import { talkToAyhem } from "./integrations/ai-network/legacy-compat.js";

/**
 * Bind the legacy send form only when its elements actually exist.
 * This module is safe to import from the auto-linker without ReferenceErrors.
 */
export function bindLegacySendForm({
  sendButton = globalThis.document?.getElementById("sendButton"),
  inputField = globalThis.document?.getElementById("inputField"),
  outputElement = globalThis.document?.getElementById("aiOutput"),
  displayUser = globalThis.displayUser,
  displayAyhem = globalThis.displayAyhem,
  talk = talkToAyhem,
} = {}) {
  if (!sendButton || !inputField || typeof sendButton.addEventListener !== "function") {
    return false;
  }

  sendButton.addEventListener("click", async () => {
    const userInput = typeof inputField.value === "string" ? inputField.value.trim() : "";
    if (!userInput) {
      if (outputElement) outputElement.textContent = "اكتب سؤالاً أولاً.";
      return;
    }

    sendButton.disabled = true;
    if (typeof displayUser === "function") displayUser(userInput);
    if (outputElement) outputElement.textContent = "جارٍ الاتصال ببوابة أيهم...";

    try {
      const response = await talk(userInput);
      if (typeof displayAyhem === "function") displayAyhem(response.output);
      else if (outputElement) outputElement.textContent = response.output;
    } catch {
      if (outputElement) outputElement.textContent = "تعذر الاتصال ببوابة أيهم. تحقق من الإعدادات ثم أعد المحاولة.";
    } finally {
      sendButton.disabled = false;
    }
  });

  return true;
}

if (typeof document !== "undefined") {
  bindLegacySendForm();
}
