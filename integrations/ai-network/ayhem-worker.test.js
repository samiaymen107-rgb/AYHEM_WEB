import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../../AYHEM_JS_Worker.js";

const encoder = new TextEncoder();
const b64 = value => Buffer.from(value).toString("base64url");
const pair = await webcrypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const jwk = await webcrypto.subtle.exportKey("jwk", pair.publicKey);
jwk.kid = "worker-test-key";
jwk.alg = "RS256";
const issuer = "https://worker-test.cloudflareaccess.com";
const audience = "worker-test-audience";

async function token() {
  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT", kid: jwk.kid }));
  const payload = b64(JSON.stringify({
    iss: issuer, aud: audience, sub: "ayhem-test-user",
    exp: Math.floor(Date.now() / 1000) + 300,
  }));
  const data = `${header}.${payload}`;
  const sig = await webcrypto.subtle.sign("RSASSA-PKCS1-v1_5", pair.privateKey, encoder.encode(data));
  return `${data}.${b64(sig)}`;
}

const baseEnv = limiter => ({
  CF_ACCESS_TEAM_DOMAIN: issuer,
  CF_ACCESS_AUD: audience,
  OPENAI_API_KEY: "test-secret-not-real",
  ALLOWED_ORIGINS: "https://app.example",
  AI_RATE_LIMITER: limiter,
});

function installFetch({ upstreamStatus = 200 } = {}) {
  const original = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async url => {
    const target = String(url);
    if (target.endsWith("/cdn-cgi/access/certs")) {
      return new Response(JSON.stringify({ keys: [jwk] }), { status: 200 });
    }
    if (target === "https://api.openai.com/v1/chat/completions") {
      upstreamCalls++;
      return new Response(JSON.stringify({
        choices: [{ message: { content: "AYHEM response" } }],
      }), { status: upstreamStatus });
    }
    throw new Error("Unexpected outbound URL");
  };
  return { restore: () => { globalThis.fetch = original; }, upstreamCalls: () => upstreamCalls };
}

test("rejects unauthenticated AI requests before provider access", async () => {
  const mock = installFetch();
  try {
    const response = await worker.fetch(new Request("https://gateway.example/", {
      method: "POST", headers: { Origin: "https://app.example", "Content-Type": "application/json" },
      body: JSON.stringify({ input: "hello" }),
    }), baseEnv({ limit: async () => ({ success: true }) }));
    assert.equal(response.status, 401);
    assert.equal(mock.upstreamCalls(), 0);
  } finally { mock.restore(); }
});

test("enforces per-user rate limits before calling the AI provider", async () => {
  const mock = installFetch();
  try {
    const jwt = await token();
    const response = await worker.fetch(new Request("https://gateway.example/", {
      method: "POST",
      headers: {
        Origin: "https://app.example",
        "Cf-Access-Jwt-Assertion": jwt,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: "hello" }),
    }), baseEnv({ limit: async ({ key }) => {
      assert.equal(key, "ayhem-test-user");
      return { success: false };
    } }));
    assert.equal(response.status, 429);
    assert.equal(mock.upstreamCalls(), 0);
  } finally { mock.restore(); }
});

test("serves an authenticated request through the secured gateway", async () => {
  const mock = installFetch();
  try {
    const jwt = await token();
    const response = await worker.fetch(new Request("https://gateway.example/", {
      method: "POST",
      headers: {
        Origin: "https://app.example",
        "Cf-Access-Jwt-Assertion": jwt,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: "hello" }),
    }), baseEnv({ limit: async () => ({ success: true }) }));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.output, "AYHEM response");
    assert.equal(data.unit, "U01-Σ");
    assert.equal(typeof data.requestId, "string");
    assert.equal(mock.upstreamCalls(), 1);
  } finally { mock.restore(); }
});

test("rejects origins outside the explicit allow-list", async () => {
  const mock = installFetch();
  try {
    const response = await worker.fetch(new Request("https://gateway.example/health", {
      method: "GET", headers: { Origin: "https://evil.example" },
    }), baseEnv({ limit: async () => ({ success: true }) }));
    assert.equal(response.status, 403);
    assert.equal(mock.upstreamCalls(), 0);
  } finally { mock.restore(); }
});
