// Records a Priced In reel (reel.html) to an MP4 with headless Chrome. Needs only Node and Chrome.
//
//   node tools/reels/make-reel.mjs "mode=teaser&id=1"              today's card, no answer
//   node tools/reels/make-reel.mjs "mode=reveal&id=10"             yesterday's card with the answer
//   node tools/reels/make-reel.mjs "mode=list&list=beat-fell&played=15"   a top 5 from the first 15 cards
//
// Videos are saved in tools/reels/out/ (not committed).
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9333;

const query = process.argv[2] || "mode=teaser&id=1";
const q = new URLSearchParams(query);
const name = [q.get("mode"), q.get("id") || q.get("list")].filter(Boolean).join("-");
fs.mkdirSync(path.join(HERE, "out"), { recursive: true });
const out = process.argv[3] || path.join(HERE, "out", name + ".mp4");

// A tiny local web server for the project folder (fetch doesn't work from file://)
const TYPES = { ".html": "text/html", ".json": "application/json", ".js": "text/javascript", ".css": "text/css" };
const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        return res.end();
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));
const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    "--window-size=540,960", "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "about:blank"
], { stdio: "ignore" });
const finish = () => { chrome.kill(); server.close(); };

const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
    await sleep(200);
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === "page"); } catch {}
}
if (!target) { finish(); throw new Error("Chrome didn't start"); }

// Talk to Chrome over its debugging connection
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let n = 0;
const waiting = new Map();
ws.addEventListener("message", e => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
});
const send = (method, params = {}) => new Promise(r => { waiting.set(++n, r); ws.send(JSON.stringify({ id: n, method, params })); });
const evaluate = async (expression, awaitPromise = false) =>
    (await send("Runtime.evaluate", { expression, awaitPromise, returnByValue: true })).result?.result?.value;

await send("Page.navigate", { url: `${base}/tools/reels/reel.html?${query}&rec` });
for (let i = 0; i < 100 && !(await evaluate("window.ready === true")); i++) await sleep(200);
if (!(await evaluate("window.ready === true"))) { finish(); throw new Error("The reel page didn't load. Check the card id."); }

console.log("Recording", query, "(plays in real time, about 20 seconds)...");
const video = await evaluate("record()", true);
fs.writeFileSync(out, Buffer.from(video.data, "base64"));
console.log(`Saved ${path.relative(process.cwd(), out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
ws.close();
finish();
