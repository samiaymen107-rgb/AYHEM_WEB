import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { verifyCloudflareAccessJWT } from "./cloudflare-access.js";

const encoder = new TextEncoder();
const base64url = bytes => Buffer.from(bytes).toString("base64url");
const json64 = value => base64url(encoder.encode(JSON.stringify(value)));

const pair = await webcrypto.subtle.generateKey(
  { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
  true,
  ["sign", "verify"],
);
const publicJwk = await webcrypto.subtle.exportKey("jwk", pair.publicKey);
publicJwk.kid = "ayhem-test-key";
publicJwk.alg = "RS256";
const issuer = "https://ayhem-test.cloudflareaccess.com";
const audience = "ayhem-test-audience";

async function makeToken(overrides = {}, signingKey = pair.privateKey) {
  const header = json64({ alg: "RS256", typ: "JWT", kid: "ayhem-test-key" });
  const payload = json64({
    iss: issuer, aud: audience, sub: "user-123",
    exp: Math.floor(Date.now() / 1000) + 300,
    ...overrides,
  });
  const input = `${header}.${payload}`;
  const signature = await webcrypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", signingKey, encoder.encode(input),
  );
  return `${input}.${base64url(signature)}`;
}

function fetchJwks() {
  return async url => {
    assert.equal(url, `${issuer}/cdn-cgi/access/certs`);
    return new Response(JSON.stringify({ keys: [publicJwk] }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  };
}

test("accepts a valid signed Access JWT with matching issuer and audience", async () => {
  const token = await makeToken();
  const result = await verifyCloudflareAccessJWT(token, {
    teamDomain: issuer, audience, fetchImpl: fetchJwks(), cryptoImpl: webcrypto,
  });
  assert.equal(result.ok, true);
  assert.equal(result.claims.sub, "user-123");
});

test("rejects wrong audience and expired tokens", async () => {
  const wrongAudience = await makeToken({ aud: "wrong-audience" });
  const wrong = await verifyCloudflareAccessJWT(wrongAudience, {
    teamDomain: issuer, audience, fetchImpl: fetchJwks(), cryptoImpl: webcrypto,
  });
  assert.equal(wrong.ok, false);

  const expired = await makeToken({ exp: Math.floor(Date.now() / 1000) - 5 });
  const old = await verifyCloudflareAccessJWT(expired, {
    teamDomain: issuer, audience, fetchImpl: fetchJwks(), cryptoImpl: webcrypto,
  });
  assert.equal(old.ok, false);
});

test("rejects malformed tokens and missing configuration", async () => {
  const malformed = await verifyCloudflareAccessJWT("not.a.jwt", {
    teamDomain: issuer, audience, fetchImpl: fetchJwks(), cryptoImpl: webcrypto,
  });
  assert.equal(malformed.ok, false);

  const missing = await verifyCloudflareAccessJWT("", { cryptoImpl: webcrypto });
  assert.equal(missing.ok, false);
});
