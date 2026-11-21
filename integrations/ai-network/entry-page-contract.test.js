import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("main entry page loads the AI gateway UI and required controls", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /integrations\/ai-network\/ayhem-ai-ui\.js/);
  assert.match(html, /id="aiConnectionStatus"/);
  assert.match(html, /id="aiPrompt"/);
  assert.match(html, /id="aiSendBtn"[^>]*disabled/);
  assert.match(html, /id="aiOutput"/);
});

test("main entry page does not embed an AI provider key", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(html, /sk-[A-Za-z0-9_-]{16,}/);
  assert.doesNotMatch(html, /OPENAI_API_KEY\s*[:=]/);
});
