/**
 * Cloudflare Access JWT verification for the AYHEM Worker.
 * Uses the platform Web Crypto API; never trusts an unverified JWT payload.
 */
let cachedJwks = null;
let cachedIssuer = "";
let cachedAt = 0;
const JWKS_TTL_MS = 5 * 60 * 1000;

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJsonSegment(segment) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment)));
}

function normalizeIssuer(teamDomain) {
  const candidate = teamDomain.startsWith("https://")
    ? teamDomain.replace(/\/+$/, "")
    : `https://${teamDomain.replace(/\/+$/, "")}`;
  const url = new URL(candidate);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) {
    throw new TypeError("Invalid Cloudflare Access team domain.");
  }
  return url.origin;
}

async function loadJwks(issuer, fetchImpl, nowMs) {
  if (cachedJwks && cachedIssuer === issuer && nowMs - cachedAt < JWKS_TTL_MS) {
    return cachedJwks;
  }

  const response = await fetchImpl(`${issuer}/cdn-cgi/access/certs`, {
    method: "GET",
    headers: { "Accept": "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("access_jwks_unavailable");
  const data = await response.json();
  if (!Array.isArray(data.keys) || data.keys.length === 0) {
    throw new Error("access_jwks_invalid");
  }

  cachedJwks = data.keys;
  cachedIssuer = issuer;
  cachedAt = nowMs;
  return cachedJwks;
}

export async function verifyCloudflareAccessJWT(token, {
  teamDomain,
  audience,
  fetchImpl = globalThis.fetch,
  cryptoImpl = globalThis.crypto,
  now = Math.floor(Date.now() / 1000),
} = {}) {
  if (!teamDomain || !audience || typeof fetchImpl !== "function" ||
      !cryptoImpl?.subtle || typeof token !== "string" || !token) {
    return { ok: false, reason: "configuration_or_token_missing" };
  }

  try {
    const issuer = normalizeIssuer(teamDomain);
    const parts = token.split(".");
    if (parts.length !== 3) return { ok: false, reason: "invalid_token" };

    const header = decodeJsonSegment(parts[0]);
    const claims = decodeJsonSegment(parts[1]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") {
      return { ok: false, reason: "invalid_token" };
    }

    if (claims.iss !== issuer ||
        !(claims.aud === audience || (Array.isArray(claims.aud) && claims.aud.includes(audience))) ||
        typeof claims.sub !== "string" || !claims.sub ||
        typeof claims.exp !== "number" || claims.exp <= now ||
        (typeof claims.nbf === "number" && claims.nbf > now)) {
      return { ok: false, reason: "invalid_claims" };
    }

    const keys = await loadJwks(issuer, fetchImpl, Date.now());
    const jwk = keys.find(key => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) return { ok: false, reason: "signing_key_not_found" };

    const publicKey = await cryptoImpl.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signature = decodeBase64Url(parts[2]);
    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await cryptoImpl.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature,
      signedData,
    );

    return valid
      ? { ok: true, claims }
      : { ok: false, reason: "invalid_signature" };
  } catch {
    return { ok: false, reason: "verification_unavailable" };
  }
}
