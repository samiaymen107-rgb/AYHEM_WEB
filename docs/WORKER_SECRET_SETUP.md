# AYHEM Worker — Secret Configuration

## Important credential incident
A credential was present in the historical Worker source. Treat it as compromised. Revoke it at the service that issued it and create a replacement. Removing it from the current file does not remove it from Git history. Do not paste the old or replacement value into chat, source files, issues, or commits.

## Configure the Worker secret in Cloudflare
1. Open Cloudflare Dashboard → Workers & Pages.
2. Open the AYHEM Worker that serves the project.
3. Open Settings → Variables and Secrets.
4. Add a **Secret** named `OPENAI_API_KEY`; paste the newly generated OpenAI API key into the secret value field.
5. Add a non-secret text variable named `ALLOWED_ORIGINS` containing the exact website origin(s), comma-separated, for example `https://example.com`. Do not include paths or trailing slashes.
6. Optionally add `OPENAI_MODEL` as a text variable. If omitted, the Worker uses `gpt-4o-mini`.
7. Save and deploy the Worker.

The Worker code reads the credential only from `env.OPENAI_API_KEY`. It never returns the secret to the browser. The health endpoint reports only whether a secret is configured, not its value.

## Verification
- Open the Worker `/health` endpoint. Confirm `service: AYHEM` and `aiConfigured: true`.
- Test one short message from the configured website.
- Confirm requests from an unlisted Origin are rejected.
- Confirm the browser network panel contains no provider API key.
- Review Worker logs for errors without logging request bodies or secrets.

## Remaining operational controls
CORS origin checks are not authentication and do not prevent non-browser abuse. Before public production use, add Cloudflare rate limiting or an authenticated gateway, set budget/usage alerts at the AI provider, and monitor request volume. Keep the API key narrowly scoped and rotate it periodically.

## Current state
The source code has been changed to use a server-side secret binding, but the Cloudflare Dashboard secret and deployment must be configured separately. This repository connection cannot create or rotate a Cloudflare secret.
