import test from "node:test";
import assert from "node:assert/strict";
import { bindLegacySendForm } from "../../ayhem-fix-send.js";

function element(value = "") {
  return {
    value, disabled: false, textContent: "", handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
  };
}

test("legacy send handler imports safely when no page elements exist", () => {
  assert.equal(bindLegacySendForm({ sendButton: null, inputField: null }), false);
});

test("legacy send handler delegates to the gateway adapter and renders output", async () => {
  const sendButton = element();
  const inputField = element("  test message ");
  const outputElement = element();
  let displayed = "";
  let sent = "";

  assert.equal(bindLegacySendForm({
    sendButton, inputField, outputElement,
    talk: async input => { sent = input; return { output: "AI answer" }; },
    displayAyhem: value => { displayed = value; },
  }), true);

  await sendButton.handlers.click();
  assert.equal(sent, "test message");
  assert.equal(displayed, "AI answer");
  assert.equal(sendButton.disabled, false);
});

test("legacy send handler reports a gateway failure without fabricating a reply", async () => {
  const sendButton = element();
  const inputField = element("hello");
  const outputElement = element();

  bindLegacySendForm({
    sendButton, inputField, outputElement,
    talk: async () => { throw new Error("offline"); },
  });

  await sendButton.handlers.click();
  assert.match(outputElement.textContent, /تعذر الاتصال/);
  assert.equal(sendButton.disabled, false);
});
