import http from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";

const port = Number(process.env.PORT ?? 10256);
const allowedCallback = process.env.ONECLI_CALLBACK_ORIGIN ?? "http://127.0.0.1:10254";

const send = (res, status, body) => {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (req.method !== "GET" || url.pathname !== "/connect") {
    send(res, 404, "Not found");
    return;
  }

  const callback = url.searchParams.get("callback");
  const token = url.searchParams.get("token");
  const returnUrl = url.searchParams.get("return") ?? "http://127.0.0.1:10254";
  if (!callback || !token || !callback.startsWith(`${allowedCallback}/`)) {
    send(res, 400, "Invalid OneCLI callback");
    return;
  }

  send(res, 200, "Chromium opened. Complete LinkedIn login in the browser window.");

  const profile = await mkdtemp(join(tmpdir(), "onecli-linkedin-"));
  let context;
  try {
    context = await chromium.launchPersistentContext(profile, {
      headless: false,
    });
    const page = context.pages()[0] ?? (await context.newPage());
    await page.goto("https://www.linkedin.com/login");
    await page.waitForURL(
      (value) => value.hostname.endsWith("linkedin.com") && !value.pathname.startsWith("/login"),
      { timeout: 5 * 60 * 1000 },
    );

    const storageState = await context.storageState();
    const response = await fetch(callback, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token,
        storageState,
        metadata: { name: "LinkedIn Chromium" },
      }),
    });
    if (!response.ok) throw new Error(`OneCLI callback failed: ${response.status}`);
    console.log(`LinkedIn session saved; return to ${returnUrl}`);
  } catch (error) {
    console.error("LinkedIn browser connection failed", error);
  } finally {
    await context?.close();
    await rm(profile, { recursive: true, force: true });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LinkedIn browser worker listening on http://127.0.0.1:${port}`);
});
