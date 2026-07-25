import http from "node:http";
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

  const context = await chromium.launchPersistentContext(".linkedin-profile", {
    headless: false,
  });
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://www.linkedin.com/login");
  await page.waitForURL(
    (value) => value.hostname.endsWith("linkedin.com") && !value.pathname.startsWith("/login"),
    { timeout: 5 * 60 * 1000 },
  );

  const storageState = await context.storageState();
  await fetch(callback, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      token,
      storageState,
      metadata: { name: "LinkedIn Chromium" },
    }),
  });
  await context.close();
  console.log(`LinkedIn session saved; return to ${returnUrl}`);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`LinkedIn browser worker listening on http://127.0.0.1:${port}`);
});
