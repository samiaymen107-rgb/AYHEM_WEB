import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve(process.cwd(), "../..");
let appServer;
let gatewayServer;
let browser;
let appOrigin;
let gatewayOrigin;
let gatewayRequests = [];
let preflightCount = 0;

function listen(server) {
  return new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
}

function close(server) {
  return new Promise(resolveClose => server?.close(resolveClose));
}

before(async () => {
  appServer = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
      if (pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
          .end("<!doctype html><html><body>AYHEM browser CORS test</body></html>");
        return;
      }
      const target = resolve(root, "." + pathname);
      if (target !== root && !target.startsWith(root + sep)) {
        response.writeHead(403).end();
        return;
      }
      const content = await readFile(target);
      const type = extname(target) === ".js" ? "text/javascript; charset=utf-8" : "application/octet-stream";
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" }).end(content);
    } catch {
      response.writeHead(404).end("not_found");
    }
  });
  await listen(appServer);
  appOrigin = `http://127.0.0.1:${appServer.address().port}`;

  gatewayServer = createServer(async (request, response) => {
    if (request.url === "/set-cookie" && request.method === "GET") {
      response.writeHead(200, {
        "Set-Cookie": "CF_Authorization=browser-test-session; Path=/; SameSite=Lax",
        "Cache-Control": "no-store",
      }).end("cookie_set");
      return;
    }

    const requestOrigin = request.headers.origin;
    if (requestOrigin !== appOrigin) {
      response.writeHead(403).end("origin_not_allowed");
      return;
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": appOrigin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    };

    if (request.method === "OPTIONS") {
      preflightCount++;
      response.writeHead(204, corsHeaders).end();
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      gatewayRequests.push({ method: "GET", cookie: request.headers.cookie || "" });
      response.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" }).end(JSON.stringify({
        service: "AYHEM",
        status: "online",
        mode: "authenticated-gateway",
        aiConfigured: true,
        rateLimitConfigured: true,
        originConfigured: true,
        ready: true,
      }));
      return;
    }

    if (request.method === "POST" && request.url === "/") {
      let body = "";
      for await (const chunk of request) body += chunk;
      gatewayRequests.push({ method: "POST", cookie: request.headers.cookie || "", body });
      response.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" }).end(JSON.stringify({
        unit: "U01-Σ",
        output: "browser CORS session verified",
        requestId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      }));
      return;
    }

    response.writeHead(404, corsHeaders).end("not_found");
  });
  await listen(gatewayServer);
  gatewayOrigin = `http://127.0.0.1:${gatewayServer.address().port}`;
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  await close(gatewayServer);
  await close(appServer);
});

test("real Chromium: cross-origin Access cookie, CORS preflight, health and AI POST", async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${gatewayOrigin}/set-cookie`);
    await page.goto(appOrigin);
    const result = await page.evaluate(async endpoint => {
      const { createAyhemAIClient } = await import("/integrations/ai-network/ayhem-ai-client.js");
      const client = createAyhemAIClient({ endpoint });
      const health = await client.health();
      const answer = await client.ask("hello");
      return { ready: health.ready, output: answer.output, requestId: answer.requestId };
    }, gatewayOrigin);

    assert.equal(result.ready, true);
    assert.equal(result.output, "browser CORS session verified");
    assert.equal(result.requestId, "f47ac10b-58cc-4372-a567-0e02b2c3d479");
    assert.equal(preflightCount, 1, "JSON POST must complete one CORS OPTIONS preflight");
    assert.deepEqual(gatewayRequests.map(item => item.method), ["GET", "POST"]);
    assert.ok(
      gatewayRequests.every(item => item.cookie.includes("CF_Authorization=browser-test-session")),
      "both cross-origin requests must include the Access session cookie",
    );
    assert.equal(JSON.parse(gatewayRequests[1].body).input, "hello");
  } finally {
    await page.close();
  }
});
