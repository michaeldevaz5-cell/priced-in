// =============================================================
// Priced In: game logic
// Michael wrote the first version of this file by hand (see git
// history up to "Up and Down buttons work"). From then on the code
// was written by Claude; Michael writes the scenarios in puzzles.json.
// =============================================================

// ---------- Settings ----------
const START_VALUE = 10000;       // every week (and every practice round) starts with $10,000
const STAKES = { low: 0.10, mid: 0.25, high: 0.50 };   // share of the portfolio you put on a trade
const SITE_URL = "michaeldevaz5-cell.github.io/priced-in";
const DAILY_START = "2026-10-26";  // the Monday the first daily cards go live
const CARDS_PER_DAY = 3;           // daily cards come from puzzles.json in order, 3 per weekday

// The tower: your portfolio balance decides which level you're on. Every week starts in the
// Lobby with $10,000; fall below that and you're out on the street. The higher levels need
// bigger gains, and each one looks more luxurious than the one below.
const LEVELS = [
    { min: 0, name: "Street" },
    { min: 10000, name: "Lobby" },
    { min: 11000, name: "Trading floor" },
    { min: 12500, name: "Corner office" },
    { min: 15000, name: "Boardroom" },
    { min: 20000, name: "Penthouse" },
    { min: 25000, name: "Rooftop" }
];

// ---------- Game state (the game's "memory") ----------
let puzzles = [];            // every card from puzzles.json
let mode = "practice";       // "daily" (today's cards) or "practice" (every card)
let deck = [];               // the cards in this round
let dailyKey = null;         // the day being played in daily mode, e.g. "2026-10-26"
let cardIndex = 0;           // which card of the deck we're on (0 = first)
let portfolio = START_VALUE; // current portfolio value in dollars
let results = [];            // one entry per finished card

// Shortcut: find an element by its id
const $ = (id) => document.getElementById(id);

// Does the player's system ask for less motion?
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// $12345 -> "$12,345"
const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
// +1234 -> "+$1,234", -1234 -> "−$1,234"
const signedMoney = (n) => (n >= 0 ? "+" : "−") + money(Math.abs(n));
// Short version for the small day tiles: +8750 -> "+$8.8k", -703 -> "−$703"
const compactMoney = (n) => (n >= 0 ? "+" : "−") +
    (Math.abs(n) >= 1000 ? "$" + (Math.abs(n) / 1000).toFixed(1) + "k" : money(Math.abs(n)));


// ---------- 1. Load the cards ----------
fetch("puzzles.json")
    .then(response => response.json())
    .then(data => {
        puzzles = data;
        showHome();
    })
    .catch(error => {
        console.error(error);
        $("home").hidden = true;
        $("app").hidden = false;
        showOnly("error");
        $("dir-buttons").hidden = true;
    });


// ---------- Home screen ----------
$("btn-start").addEventListener("click", () => {
    $("home").hidden = true;
    $("app").hidden = false;
    document.body.classList.add("in-game");   // dims the background scene
    // Before the daily cards begin, Practice is the only thing to play
    showHub(todayKey() < DAILY_START ? "practice" : "today");
});

$("btn-home").addEventListener("click", () => showHub(mode === "practice" ? "practice" : "today"));

function showHome() {
    $("app").hidden = true;
    $("home").hidden = false;
    document.body.classList.remove("in-game");
    $("home-cards").textContent = todayKey() < DAILY_START
        ? `${puzzles.length} cards to practise`
        : `${CARDS_PER_DAY} new cards every weekday`;

    const stats = loadStats();
    $("home-stats").textContent = stats.played > 0
        ? `Rounds played ${stats.played} · Best ${money(stats.bestValue)} · Streak ${stats.streak}`
        : "";

    // The city starts at this week's level of the tower
    setSceneTower(weekBalance(loadWeek()), true);
    buildTape();
    if (!homeChartFrame) startHomeChart();
    window.scrollTo(0, 0);
}

// The ticker tape: market ideas instead of real stocks, so nothing here is made-up data
function buildTape() {
    const items = [
        ["EXPECTATIONS", 2.4], ["SURPRISE", 7.9], ["HYPE", -3.1], ["GUIDANCE", 4.6],
        ["BUYBACK", 1.8], ["PRICED IN", -0.6], ["CONSENSUS", 0.9], ["SELL THE NEWS", -5.2],
        ["LOW BAR", 3.3], ["WHISPER NUMBER", -1.7], ["VALUATION", -2.8], ["BEAT", 1.2], ["MISS", -4.4]
    ];
    const track = $("tape-track");
    track.innerHTML = "";
    // Two copies side by side so the loop is seamless
    for (let copy = 0; copy < 2; copy++) {
        items.forEach(([name, change]) => {
            const span = document.createElement("span");
            const up = change >= 0;
            span.textContent = `${name} `;
            const delta = document.createElement("span");
            delta.className = up ? "t-up" : "t-down";
            delta.textContent = `${up ? "▲" : "▼"} ${Math.abs(change).toFixed(1)}%`;
            span.appendChild(delta);
            track.appendChild(span);
        });
    }
}

// The background scene: a pixel-art city at night, like Wall Street after the closing bell,
// with a giant, faint candlestick chart drifting across the sky (a random walk, purely
// decorative, not real prices).
// It's also the tower. As your balance climbs you rise above the city, and every level
// looks clearly different:
//   - the city is three rows of buildings that fall away at different speeds (the nearest
//     fastest) and fade into haze, until only the tallest towers poke up
//   - you climb through the clouds: wisps overhead, then a cloud bank you pass through,
//     then a sea of clouds below you
//   - each level has its own sky with one big feature in it: a full moon, neon city glow,
//     a bold green rally on the sky chart, a crescent moon and the evening star, a striped
//     setting sun, golden sun rays, and the sun blazing over the clouds
//   - each level adds a touch that stays on the levels above it: searchlights, a blimp,
//     a helicopter, gold sparkles, a balcony railing, party lights and fireworks
let homeChartFrame = null;

// Colours for each level: sky top, middle and horizon; the glow rising from behind the city
// [r, g, b, strength]; and the clouds (lit top and shaded underside)
const SKIES = [
    ["#0b0f1c", "#111830", "#2b2236", [245, 196, 81, 0.16], "#48526e", "#262c44"],    // Street: deep night
    ["#0a1224", "#142650", "#33386a", [130, 170, 255, 0.20], "#5e6894", "#323a5e"],   // Lobby: neon city
    ["#0e1838", "#22377a", "#5a5a9a", [140, 220, 180, 0.20], "#96a0d2", "#50588c"],   // Trading floor: blue hour
    ["#181640", "#3e2f7a", "#9a5c8c", [255, 150, 120, 0.24], "#e6aac8", "#785a8c"],   // Corner office: dusk
    ["#1e1442", "#5a2f78", "#d0707a", [255, 140, 90, 0.30], "#ffbea0", "#aa5f78"],    // Boardroom: sunset
    ["#23164a", "#7a3a72", "#f0a060", [255, 190, 90, 0.36], "#ffd796", "#c8786e"],    // Penthouse: golden hour
    ["#2a1450", "#9a4070", "#ffcf6b", [255, 215, 120, 0.45], "#fff0c8", "#e6aa8c"]    // Rooftop: gold
].map(([top, mid, low, glow, cloud, shade]) => ({
    top: hexRgb(top), mid: hexRgb(mid), low: hexRgb(low), glow, cloud: hexRgb(cloud), shade: hexRgb(shade)
}));

function hexRgb(hex) {
    return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
}

// Where the scene is: "now" (your position on the tower, 0 to 7, see towerPos) and "lv" (your
// level) ease towards their targets so changes are smooth; fx[i] fades in the touch that
// level i adds (0 = hidden, 1 = fully shown).
const scene = { now: 0, target: 0, lv: 0, lvTarget: 0, fx: [0, 0, 0, 0, 0, 0, 0], redraw: null };

function setSceneTower(balance, instant) {
    scene.target = towerPos(balance);
    scene.lvTarget = levelFor(balance);
    if (instant || reduceMotion) {
        scene.now = scene.target;
        scene.lv = scene.lvTarget;
        scene.fx = scene.fx.map((_, i) => (scene.lvTarget >= i ? 1 : 0));
    }
    if (reduceMotion && scene.redraw) scene.redraw();
}

// Where the top of the cloud bank is on screen (as a share of the height) for each position
// on the tower: off the top until the Trading floor, through the middle of the screen at the
// Corner office, then below you as a sea of clouds
const CLOUD_BANK = [[2.6, -0.15], [3.2, 0.08], [3.7, 0.30], [4.2, 0.48], [5, 0.58], [6, 0.68], [7, 0.74]];

function bankTop(alt) {
    if (alt <= CLOUD_BANK[0][0]) return CLOUD_BANK[0][1];
    for (let i = 1; i < CLOUD_BANK.length; i++) {
        const [a0, y0] = CLOUD_BANK[i - 1], [a1, y1] = CLOUD_BANK[i];
        if (alt <= a1) return y0 + (y1 - y0) * (alt - a0) / (a1 - a0);
    }
    return CLOUD_BANK[CLOUD_BANK.length - 1][1];
}

function startHomeChart() {
    const canvas = $("bg-chart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const PX = 3;                     // one "pixel" of pixel art, in screen pixels
    const snap = (v) => Math.round(v / PX) * PX;
    const clamp = (v) => Math.max(0, Math.min(1, v));
    const rgb = (c) => `rgb(${c.join(",")})`;
    const rgba = (c, a) => `rgba(${c.join(",")}, ${Math.max(0, a).toFixed(3)})`;
    let w = 0, h = 0;
    let layers = [];                  // the city: far, middle and near rows of buildings
    let stars = [];
    let candles = [];
    let sparkles = [];                // gold dust drifting up (Boardroom and above)
    let wisps = [];                   // small clouds, high overhead at street level
    let bank = [];                    // the puffy top edge of the cloud bank
    let bursts = [];                  // fireworks (Rooftop)
    let nextBurst = 0;
    let offset = 0;                   // how far the sky chart has drifted
    let drift = 0;                    // how far the clouds have drifted
    let last = performance.now();
    let pal = null;                   // this frame's colours, blended between two levels

    // The same "random" city every time, so it doesn't jump about on resize
    function seeded(seed) {
        return () => {
            seed = (seed + 0x6D2B79F5) | 0;
            let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Each row of buildings is drawn once onto its own canvas. "depth" is how far the row has
    // fallen at the top of the tower, as a share of the screen: the near row drops out of sight
    // first, the far row last.
    function buildCity(rand) {
        layers = [
            { colour: "#1b2236", lowest: 0.10, tallest: 0.40, lit: 0.45, depth: 0.38 },   // far
            { colour: "#111725", lowest: 0.08, tallest: 0.30, lit: 0.7, depth: 0.47 },    // middle
            { colour: "#080b12", lowest: 0.06, tallest: 0.20, lit: 1, depth: 0.58 }       // near
        ];
        layers.forEach(layer => {
            const c = document.createElement("canvas");
            c.width = w * dpr;
            c.height = h * dpr;
            const s = c.getContext("2d");
            s.setTransform(dpr, 0, 0, dpr, 0, 0);
            layer.canvas = c;
            layer.windows = [];
            layer.lights = [];
            let x = -PX * 4;
            while (x < w) {
                const bw = PX * (8 + Math.floor(rand() * 14));
                const bh = snap(h * (layer.lowest + rand() * (layer.tallest - layer.lowest)));
                const top = h - bh;
                s.fillStyle = layer.colour;
                s.fillRect(x, top, bw, bh);
                // A stepped roof or an antenna on some of them
                if (rand() < 0.35) s.fillRect(x + PX * 2, top - PX * 3, bw - PX * 4, PX * 3);
                if (rand() < 0.25 && bh > h * 0.18) {
                    const ax = x + Math.floor(bw / 2 / PX) * PX;
                    s.fillRect(ax, top - PX * 12, PX, PX * 12);
                    if (layer.lit >= 0.7) layer.lights.push({ x: ax, y: top - PX * 13, phase: rand() * 6 });
                }
                // Windows in a grid, some lit gold (dimmer on the rows further away)
                for (let wy = top + PX * 3; wy < h - PX * 3; wy += PX * 3) {
                    for (let wx = x + PX * 2; wx < x + bw - PX * 2; wx += PX * 3) {
                        if (rand() < 0.16 * layer.lit) {
                            if (rand() < 0.08) layer.windows.push({ x: wx, y: wy, on: true });
                            else {
                                s.fillStyle = rand() < 0.8 ? `rgba(245, 196, 81, ${0.55 * layer.lit})` : `rgba(242, 244, 247, ${0.35 * layer.lit})`;
                                s.fillRect(wx, wy, PX, PX);
                            }
                        }
                    }
                }
                x += bw + PX * Math.floor(rand() * 3);
            }
        });
    }

    // A cloud is a few overlapping pixel circles: [dx, dy, radius]
    function makeCloud(rand, size) {
        const n = 3 + Math.floor(rand() * 3);
        const parts = [];
        for (let i = 0; i < n; i++) {
            parts.push([(i - (n - 1) / 2) * size * 0.9 + (rand() - 0.5) * size * 0.4, (rand() - 0.5) * size * 0.3, size * (0.6 + rand() * 0.5)]);
        }
        return parts;
    }

    function build() {
        const rand = seeded(7);
        buildCity(rand);

        stars = [];
        for (let i = 0; i < 90; i++) {
            stars.push({ x: snap(rand() * w), y: snap(rand() * h * 0.55), phase: rand() * 6, size: rand() < 0.12 ? PX : 2 });
        }
        sparkles = [];
        for (let i = 0; i < 70; i++) {
            sparkles.push({ x: rand() * w, y: rand() * h, speed: 0.008 + rand() * 0.02, phase: rand() * 6 });
        }
        wisps = [];
        for (let i = 0; i < 8; i++) {
            wisps.push({ x: rand() * (w + PX * 80), y: (rand() - 0.5) * h * 0.14, speed: 0.6 + rand() * 0.8, parts: makeCloud(rand, PX * (5 + rand() * 4)) });
        }
        bank = [];
        for (let x = 0; x < w + PX * 44; x += PX * 22) {
            bank.push({ x, y: rand() * PX * 6, parts: makeCloud(rand, PX * (9 + rand() * 6)) });
        }
    }

    // This frame's colours: the two nearest levels blended together
    function palette() {
        const i = Math.min(SKIES.length - 2, Math.floor(scene.lv));
        const t = scene.lv - i;
        const a = SKIES[i], b = SKIES[i + 1];
        const mix = (p, q) => p.map((v, k) => Math.round(v + (q[k] - v) * t));
        return {
            top: mix(a.top, b.top), mid: mix(a.mid, b.mid), low: mix(a.low, b.low),
            glow: mix(a.glow.slice(0, 3), b.glow.slice(0, 3)), glowA: a.glow[3] + (b.glow[3] - a.glow[3]) * t,
            cloud: mix(a.cloud, b.cloud), shade: mix(a.shade, b.shade)
        };
    }

    function drawSky() {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, rgb(pal.top));
        sky.addColorStop(0.55, rgb(pal.mid));
        sky.addColorStop(1, rgb(pal.low));
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        const glow = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, Math.max(w, h) * 0.75);
        glow.addColorStop(0, rgba(pal.glow, pal.glowA));
        glow.addColorStop(1, rgba(pal.glow, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
    }

    // Street to Corner office: a big pixel moon, full at night, a thin crescent by dusk
    function drawMoon() {
        const show = clamp(3.8 - scene.lv);
        if (show <= 0) return;
        const R = snap(Math.min(w, h) * 0.065);
        const mx = snap(w * 0.8), my = snap(h * (0.15 - scene.lv * 0.015));
        const phase = clamp((scene.lv - 2.2) / 0.9);            // 0 = full, 1 = crescent (by the Corner office)
        const sx = mx - R * (2.1 - 1.6 * phase);                 // the shadow that makes the crescent

        const halo = ctx.createRadialGradient(mx, my, R * 0.8, mx, my, R * 3.5);
        halo.addColorStop(0, `rgba(220, 230, 255, ${(0.18 * show).toFixed(3)})`);
        halo.addColorStop(1, "rgba(220, 230, 255, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(mx - R * 4, my - R * 4, R * 8, R * 8);

        ctx.globalAlpha = show;
        for (let y = -R; y < R; y += PX) {
            const half = Math.sqrt(R * R - (y + PX / 2) * (y + PX / 2));
            const from = Math.max(mx - half, sx + half);         // the lit part, right of the shadow
            if (from < mx + half) {
                ctx.fillStyle = "#ece8d4";
                ctx.fillRect(snap(from), my + y, snap(mx + half - from), PX);
            }
        }
        // Craters on the full moon
        if (phase < 0.3) {
            ctx.fillStyle = "#cdc8b0";
            [[-0.35, -0.2, 3], [0.2, 0.25, 4], [0.05, -0.5, 2], [-0.1, 0.45, 2]].forEach(([dx, dy, s]) => {
                ctx.fillRect(snap(mx + dx * R), snap(my + dy * R), PX * s, PX * s);
            });
        }
        ctx.globalAlpha = 1;
    }

    // Lobby: pink and cyan neon glowing up from the city
    function drawNeon() {
        const n = clamp(1 - Math.abs(scene.lv - 1) * 0.8);
        if (n <= 0) return;
        [[0.28, [255, 70, 190]], [0.74, [60, 220, 255]]].forEach(([fx, c]) => {
            const g = ctx.createRadialGradient(w * fx, h, 0, w * fx, h, h * 0.75);
            g.addColorStop(0, rgba(c, 0.4 * n));
            g.addColorStop(1, rgba(c, 0));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });
    }

    // Corner office: the evening star, a bright four-pointed twinkle near the moon
    function drawEveningStar(now) {
        const s = clamp(1 - Math.abs(scene.lv - 3) * 0.9);
        if (s <= 0) return;
        const x = snap(w * 0.64), y = snap(h * 0.1);
        const tw = s * (reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(now / 500));
        ctx.fillStyle = `rgba(255, 250, 235, ${tw.toFixed(3)})`;
        ctx.fillRect(x - PX, y - PX, PX * 3, PX * 3);
        for (let k = 2; k <= 6; k++) {
            ctx.fillStyle = `rgba(255, 250, 235, ${(tw * (1 - k / 7)).toFixed(3)})`;
            ctx.fillRect(x - k * PX, y, PX, PX);
            ctx.fillRect(x + k * PX, y, PX, PX);
            ctx.fillRect(x, y - k * PX, PX, PX);
            ctx.fillRect(x, y + k * PX, PX, PX);
        }
    }

    // Boardroom to Rooftop: the sun. At the Boardroom it's a huge retro sun with stripes,
    // sinking into the clouds; higher up it rises clear of them, the stripes close up and
    // golden rays fan out (Penthouse) and spin slowly (Rooftop).
    function drawSun(now, alt) {
        const show = clamp((scene.lv - 3.3) / 0.8);
        if (show <= 0) return;
        const R = snap(Math.min(w, h) * 0.16);
        const lift = 0.45 + Math.min(3, Math.max(0, alt - 4)) / 3 * 0.9;   // how far it sits above the clouds
        const sx = snap(w * 0.5), sy = snap(bankTop(alt) * h - R * lift);

        const glow = ctx.createRadialGradient(sx, sy, R * 0.5, sx, sy, R * 4.5);
        glow.addColorStop(0, `rgba(255, 200, 120, ${(0.5 * show).toFixed(3)})`);
        glow.addColorStop(1, "rgba(255, 200, 120, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const rays = clamp((scene.lv - 4.3) / 0.9) * show;
        if (rays > 0) {
            const L = Math.max(w, h) * 1.3;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(reduceMotion ? 0.2 : now / 40000);
            ctx.fillStyle = `rgba(255, 236, 190, ${(0.12 * rays).toFixed(3)})`;
            for (let i = 0; i < 12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(L, -L * 0.08);
                ctx.lineTo(L, L * 0.08);
                ctx.fill();
            }
            ctx.restore();
        }

        const stripes = clamp(1 - Math.abs(scene.lv - 4) * 0.8);
        const topColour = [255, 230, 125];
        const bottomColour = [255 , Math.round(95 + 90 * rays), Math.round(140 - 40 * rays)];
        ctx.globalAlpha = show;
        for (let y = -R, row = 0; y < R; y += PX, row++) {
            const t = (y + R) / (2 * R);
            if (t > 0.5 && stripes > 0.05) {
                const depth = (t - 0.5) * 2;                          // 0 at the middle, 1 at the bottom
                const gap = Math.round(stripes * (1 + depth * 3));    // stripes get wider lower down
                if (row % 6 < gap) continue;
            }
            const half = Math.sqrt(R * R - (y + PX / 2) * (y + PX / 2));
            ctx.fillStyle = rgb(topColour.map((v, k) => Math.round(v + (bottomColour[k] - v) * t)));
            ctx.fillRect(snap(sx - half), sy + y, snap(half * 2), PX);
        }
        ctx.globalAlpha = 1;
    }

    // Lobby and above: two searchlights sweeping the sky from behind the city
    function drawSearchlights(now) {
        const L = h * 1.3;
        const spread = Math.tan(0.05) * L;
        [[0.22, 0], [0.78, 2.4]].forEach(([fx, phase]) => {
            const angle = reduceMotion ? (phase ? 0.25 : -0.25) : Math.sin(now / 2600 + phase) * 0.45;
            ctx.save();
            ctx.translate(w * fx, h);
            ctx.rotate(angle);
            const beam = ctx.createLinearGradient(0, 0, 0, -L);
            beam.addColorStop(0, `rgba(255, 240, 200, ${(0.16 * scene.fx[1]).toFixed(3)})`);
            beam.addColorStop(1, "rgba(255, 240, 200, 0)");
            ctx.fillStyle = beam;
            ctx.beginPath();
            ctx.moveTo(-PX, 0);
            ctx.lineTo(-spread, -L);
            ctx.lineTo(spread, -L);
            ctx.lineTo(PX, 0);
            ctx.fill();
            ctx.restore();
        });
    }

    // The sky chart: wide, faint candles in the top half of the screen. At the Trading floor
    // it turns bold and tilts into a rally, rising to the right.
    const CW = PX * 4, GAP = PX * 3;
    function nextCandle(prev) {
        const open = prev ? prev.close : h * 0.32;
        let close = open + (Math.random() - 0.5) * h * 0.06;
        close += (h * 0.32 - close) * 0.08;   // drift back towards the middle of the sky
        const high = Math.min(open, close) - Math.random() * h * 0.025;
        const low = Math.max(open, close) + Math.random() * h * 0.025;
        return { open, close, high, low };
    }

    function drawCandles() {
        const rally = clamp(1 - Math.abs(scene.lv - 2) * 0.9);
        const edge = w * 0.18;
        candles.forEach((c, i) => {
            const x = i * (CW + GAP) - offset;
            const fade = Math.max(0, Math.min(1, (x + CW) / edge, (w - x) / edge));
            if (fade === 0) return;
            const tilt = (0.5 - x / w) * h * 0.24 * rally;
            const alpha = ((0.13 + 0.42 * rally) * fade).toFixed(3);
            ctx.fillStyle = c.close <= c.open ? `rgba(76, 195, 138, ${alpha})` : `rgba(242, 109, 109, ${alpha})`;
            ctx.fillRect(x + CW / 2 - 1, snap(c.high + tilt), PX - 1, snap(c.low) - snap(c.high));
            ctx.fillRect(x, snap(Math.min(c.open, c.close) + tilt), CW, Math.max(PX, snap(Math.abs(c.close - c.open))));
        });
    }

    // Trading floor and above: a pixel blimp drifting slowly across the sky
    function drawBlimp(now) {
        const span = w + PX * 60;
        const x = snap(reduceMotion ? w * 0.62 : (now * 0.012) % span - PX * 30);
        const y = snap(h * 0.16);
        ctx.globalAlpha = scene.fx[2];
        // The body, row by row, so it reads as a rounded pixel shape
        [10, 16, 18, 18, 16, 10].forEach((cols, row) => {
            ctx.fillStyle = row === 3 ? "#f5c451" : "#aeb5c4";
            ctx.fillRect(x + (18 - cols) / 2 * PX, y + row * PX, cols * PX, PX);
        });
        ctx.fillStyle = "#7d8494";                                  // tail fins and the cabin
        ctx.fillRect(x - PX * 2, y + PX, PX * 2, PX * 4);
        ctx.fillRect(x + PX * 7, y + PX * 6, PX * 4, PX * 2);
        if (reduceMotion || Math.sin(now / 450) > 0) {               // blinking light on the tail
            ctx.fillStyle = "#f26d6d";
            ctx.fillRect(x - PX * 3, y + PX * 2, PX, PX);
        }
        ctx.globalAlpha = 1;
    }

    // Corner office and above: a helicopter crossing every so often
    function drawHelicopter(now) {
        const cycle = (now % 16000) / 16000;
        if (!reduceMotion && cycle > 0.5) return;
        const x = snap(reduceMotion ? w * 0.3 : w + PX * 20 - cycle * 2 * (w + PX * 40));
        const y = snap(h * 0.3 + (reduceMotion ? 0 : Math.sin(now / 600) * PX * 2));
        ctx.globalAlpha = scene.fx[3];
        ctx.fillStyle = "#1c2230";
        ctx.fillRect(x, y, PX * 6, PX * 3);                   // body
        ctx.fillRect(x + PX * 6, y + PX, PX * 6, PX);         // tail
        ctx.fillRect(x + PX * 2, y - PX, PX, PX);             // rotor mast
        ctx.fillStyle = "#9fb3c8";
        ctx.fillRect(x + PX, y + PX, PX * 2, PX);             // window
        ctx.fillStyle = "#2c3446";                            // spinning rotor: long, then short
        const long = reduceMotion || Math.floor(now / 60) % 2 === 0;
        ctx.fillRect(x + (long ? -PX * 3 : PX), y - PX * 2, long ? PX * 12 : PX * 4, PX);
        if (reduceMotion || Math.sin(now / 300) > 0.4) {
            ctx.fillStyle = "#f26d6d";
            ctx.fillRect(x + PX * 11, y, PX, PX);
        }
        ctx.globalAlpha = 1;
    }

    // Rooftop fireworks: a burst high in the sky every few seconds
    function drawFireworks(now) {
        if (reduceMotion) return;
        if (now > nextBurst) {
            nextBurst = now + 1800 + Math.random() * 2200;
            const colours = ["255, 255, 255", "255, 120, 190", "110, 220, 255", "120, 240, 160"];
            bursts.push({ x: w * (0.12 + Math.random() * 0.76), y: h * (0.08 + Math.random() * 0.2), start: now,
                colour: colours[Math.floor(Math.random() * colours.length)] });
        }
        bursts = bursts.filter(b => now - b.start < 1600);
        bursts.forEach(b => {
            const t = (now - b.start) / 1600;
            const alpha = (0.95 * (1 - t * t) * scene.fx[6]).toFixed(3);
            // Two rings of sparks: a wide outer one and a smaller inner one
            [[20, 95], [12, 55]].forEach(([count, reach]) => {
                const r = 6 + t * reach;
                ctx.fillStyle = `rgba(${b.colour}, ${alpha})`;
                for (let i = 0; i < count; i++) {
                    const a = (i / count) * Math.PI * 2;
                    ctx.fillRect(snap(b.x + Math.cos(a) * r), snap(b.y + Math.sin(a) * r + t * t * 24), PX, PX);
                }
            });
        });
    }

    // The three rows of buildings, each fallen as far as your height puts it, with haze
    // settling over the rows further away
    function drawCity(now, alt) {
        layers.forEach((layer, i) => {
            const sink = snap(Math.min(alt, 7) / 7 * layer.depth * h);
            ctx.drawImage(layer.canvas, 0, sink, w, h);
            layer.windows.forEach(win => {
                if (Math.random() < 0.002) win.on = !win.on;
                if (!win.on) return;
                ctx.fillStyle = `rgba(245, 196, 81, ${0.7 * layer.lit})`;
                ctx.fillRect(win.x, win.y + sink, PX, PX);
            });
            layer.lights.forEach(l => {
                if (Math.sin(now / 500 + l.phase) > 0.3) {
                    ctx.fillStyle = "rgba(242, 109, 109, 0.9)";
                    ctx.fillRect(l.x - 1, l.y + sink, PX + 2, PX);
                }
            });
            const haze = Math.min(0.65, alt / 7 * 0.75) * (i === 0 ? 1 : i === 1 ? 0.5 : 0);
            if (haze > 0.02) {
                const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
                g.addColorStop(0, rgba(pal.low, 0));
                g.addColorStop(1, rgba(pal.low, haze));
                ctx.fillStyle = g;
                ctx.fillRect(0, h * 0.4, w, h * 0.6);
            }
        });
    }

    // A cloud: shaded underside first, then the lit top a little higher, which leaves a
    // shaded rim along the bottom
    function drawCloud(cx, cy, parts, alpha) {
        ctx.globalAlpha = alpha;
        [[pal.shade, 0, 0], [pal.cloud, -PX * 2, PX]].forEach(([colour, lift, shrink]) => {
            ctx.fillStyle = rgb(colour);
            parts.forEach(([dx, dy, r0]) => {
                const r = r0 - shrink;
                for (let y = -r; y < r; y += PX) {
                    const half = Math.sqrt(r * r - (y + PX / 2) * (y + PX / 2));
                    ctx.fillRect(snap(cx + dx - half), snap(cy + dy + y + lift), snap(half * 2), PX);
                }
            });
        });
        ctx.globalAlpha = 1;
    }

    // Small clouds that start high overhead and sink past you as you climb, until the
    // cloud bank swallows them
    function drawWisps(alt) {
        const alpha = 0.85 * clamp((4 - alt) / 0.6);
        if (alpha <= 0) return;
        const span = w + PX * 80;
        const base = h * (0.08 + alt * 0.22);
        wisps.forEach(p => {
            const x = ((p.x + drift * p.speed) % span + span) % span - PX * 40;
            drawCloud(x, base + p.y, p.parts, alpha);
        });
    }

    // The cloud bank: a puffy top edge with fog below it. While you're inside it the fog is thin
    // and the city shows through; above it, it thickens into a sea of clouds.
    function drawBank(alt) {
        const appear = clamp((alt - 2.7) / 0.5);
        if (appear <= 0) return;
        const top = bankTop(alt) * h;
        const body = Math.max(0.25, Math.min(0.92, (alt - 3) / 3.5)) * appear;
        const fog = ctx.createLinearGradient(0, top, 0, h);
        fog.addColorStop(0, rgba(pal.cloud.map((v, k) => Math.round(v * 0.6 + pal.shade[k] * 0.4)), body));
        fog.addColorStop(1, rgba(pal.shade, body));
        ctx.fillStyle = fog;
        ctx.fillRect(0, snap(top + PX * 4), w, h);
        const step = PX * 22;
        const span = bank.length * step;
        bank.forEach(p => {
            const x = ((p.x + drift * 0.5) % span + span) % span - step;
            drawCloud(x, top + p.y, p.parts, 0.95 * appear);
        });
    }

    // Penthouse and Rooftop: the city's three tallest towers, the only buildings that still
    // reach above the clouds. Their bases are lost in the cloud bank (drawn over them next),
    // and they sink lower as you climb, with gold beacons on top at the Rooftop.
    function drawSpires(now, alt) {
        const show = clamp((alt - 4.6) / 0.6);
        if (show <= 0) return;
        const top = bankTop(alt) * h;
        const rise = h * Math.max(0.07, 0.24 - (alt - 5) * 0.06);
        const body = rgb(pal.shade.map(v => Math.round(v * 0.25 + 18)));
        ctx.globalAlpha = show;
        [[0.14, 10, 1], [0.86, 8, 0.8], [0.66, 6, 0.6]].forEach(([fx, cols, tall], i) => {
            const bw = PX * cols;
            const x = snap(w * fx - bw / 2);
            const y = snap(top - rise * tall);
            ctx.fillStyle = body;
            ctx.fillRect(x, y, bw, top + PX * 8 - y);                     // the tower, down into the clouds
            ctx.fillRect(x + PX * 2, y - PX * 4, bw - PX * 4, PX * 4);    // a stepped crown
            ctx.fillRect(x + bw / 2 - PX / 2, y - PX * 14, PX, PX * 10);  // the spire
            ctx.fillStyle = "rgba(245, 196, 81, 0.55)";                   // a few lit windows
            for (let wy = y + PX * 3; wy < top; wy += PX * 4) {
                for (let wx = x + PX * 2; wx < x + bw - PX * 2; wx += PX * 3) {
                    if ((wx * 7 + wy * 3 + i) % 5 === 0) ctx.fillRect(wx, wy, PX, PX);
                }
            }
            if (reduceMotion || Math.sin(now / 500 + i * 2) > 0.2) {
                ctx.fillStyle = scene.fx[6] > 0.5 ? "#ffd75e" : "#f26d6d";
                ctx.fillRect(x + bw / 2 - PX, y - PX * 15, PX * 2, PX * 2);
            }
        });
        ctx.globalAlpha = 1;
    }

    // Boardroom and above: gold dust drifting up through the scene
    function drawSparkles(now, dt) {
        sparkles.forEach(sp => {
            if (!reduceMotion) {
                sp.y -= dt * sp.speed;
                if (sp.y < -PX) { sp.y = h + PX; sp.x = Math.random() * w; }
            }
            // Pale gold so they show against the sunset; at the top of each twinkle a
            // sparkle flashes into a little pixel cross
            const twinkle = 0.5 + 0.5 * Math.sin(now / 300 + sp.phase);
            const x = snap(sp.x), y = snap(sp.y);
            ctx.fillStyle = `rgba(255, 236, 170, ${((0.35 + 0.6 * twinkle) * scene.fx[4]).toFixed(3)})`;
            ctx.fillRect(x, y, PX, PX);
            if (twinkle > 0.85) {
                ctx.fillRect(x - PX, y, PX, PX);
                ctx.fillRect(x + PX, y, PX, PX);
                ctx.fillRect(x, y - PX, PX, PX);
                ctx.fillRect(x, y + PX, PX, PX);
            }
        });
    }

    // A gold balcony railing along the bottom of the screen (Penthouse and above).
    // It slides up into view as its fade goes from 0 to 1.
    function drawRailing(now) {
        const shown = scene.fx[5];
        const railH = PX * 16;
        const top = snap(h - railH + (1 - shown) * railH * 1.5);
        ctx.globalAlpha = shown;
        ctx.fillStyle = "#1a1422";                           // dark marble floor
        ctx.fillRect(0, top + railH - PX * 3, w, PX * 3);
        ctx.fillStyle = "#a9822b";                           // posts
        for (let x = PX * 2; x < w; x += PX * 6) ctx.fillRect(x, top + PX * 3, PX, railH - PX * 6);
        ctx.fillRect(0, top + railH - PX * 5, w, PX);         // bottom rail
        ctx.fillStyle = "#f5c451";                           // polished top rail
        ctx.fillRect(0, top + PX, w, PX * 2);
        ctx.fillStyle = "rgba(255, 240, 200, 0.6)";
        ctx.fillRect(0, top + PX, w, 1);

        // Rooftop: a string of party bulbs hung above the rail, in colours that show
        // against the gold sky, on a dark wire
        if (scene.fx[6] > 0.01) {
            ctx.globalAlpha = scene.fx[6];
            const bulbs = ["#ff6b6b", "#ffffff", "#5bc0ff", "#7dff9a", "#ff9ad5"];
            const hang = (x) => top - PX * 8 + snap(Math.abs(Math.sin((x / w) * Math.PI * 5)) * PX * 4);
            ctx.fillStyle = "#2a1c12";
            for (let x = 0; x < w; x += PX) ctx.fillRect(x, hang(x), PX, 1);
            for (let x = PX * 3, i = 0; x < w; x += PX * 9, i++) {
                const on = reduceMotion || Math.sin(now / 350 + i * 1.3) > -0.5;
                ctx.fillStyle = on ? bulbs[i % bulbs.length] : "#5a4630";
                ctx.fillRect(x, hang(x) + 1, PX * 2, PX * 2);
            }
        }
        ctx.globalAlpha = 1;
    }

    function resize() {
        w = canvas.clientWidth;
        h = canvas.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        build();
        const count = Math.ceil(w / (CW + GAP)) + 3;
        while (candles.length < count) candles.push(nextCandle(candles[candles.length - 1]));
    }

    function draw(now) {
        const dt = Math.min(64, now - last);
        last = now;
        offset += dt * 0.01;    // the sky chart drifts slowly to the left
        while (offset >= CW + GAP) {
            offset -= CW + GAP;
            candles.shift();
            candles.push(nextCandle(candles[candles.length - 1]));
        }
        if (!reduceMotion) drift += dt * 0.01;

        // Ease towards the current position and level, and fade each level's touch in or out
        const ease = Math.min(1, dt * 0.0025);
        scene.now += (scene.target - scene.now) * ease;
        scene.lv += (scene.lvTarget - scene.lv) * ease;
        scene.fx = scene.fx.map((v, i) => v + ((scene.lvTarget >= i ? 1 : 0) - v) * ease);
        const alt = scene.now;
        pal = palette();

        // From the back of the scene to the front
        drawSky();
        const starLight = 1 - 0.85 * scene.lv / (LEVELS.length - 1);   // stars fade as the sky lightens
        stars.forEach(st => {
            ctx.fillStyle = `rgba(242, 244, 247, ${((0.18 + 0.15 * Math.sin(now / 900 + st.phase)) * starLight).toFixed(3)})`;
            ctx.fillRect(st.x, st.y, st.size, st.size);
        });
        drawMoon();
        drawEveningStar(now);
        drawNeon();
        drawSun(now, alt);
        if (scene.fx[1] > 0.01) drawSearchlights(now);
        drawCandles();
        if (scene.fx[2] > 0.01) drawBlimp(now);
        if (scene.fx[3] > 0.01) drawHelicopter(now);
        if (scene.fx[6] > 0.01) drawFireworks(now);
        drawCity(now, alt);
        drawWisps(alt);
        drawSpires(now, alt);
        drawBank(alt);
        if (scene.fx[4] > 0.01) drawSparkles(now, dt);
        if (scene.fx[5] > 0.01) drawRailing(now);

        if (!reduceMotion) homeChartFrame = requestAnimationFrame(draw);
    }

    stopHomeChart();
    resize();
    window.onresize = () => { resize(); if (reduceMotion) requestAnimationFrame(draw); };
    scene.redraw = () => requestAnimationFrame(draw);
    homeChartFrame = requestAnimationFrame(draw);
}

function stopHomeChart() {
    if (homeChartFrame) cancelAnimationFrame(homeChartFrame);
    homeChartFrame = null;
    window.onresize = null;
}


// ---------- 2. Days and weeks ----------
// Days are kept as "YYYY-MM-DD" text in the player's own time zone, which also sorts correctly.
// Add ?day=2026-10-27 to the address to pretend it's another day (for testing).
function todayKey() {
    const override = new URLSearchParams(location.search).get("day");
    if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) return override;
    return dateKey(new Date());
}

function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function parseKey(key) {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function addDays(key, n) {
    const d = parseKey(key);
    d.setDate(d.getDate() + n);
    return dateKey(d);
}

// The market is shut at weekends, so there are no cards on Saturday or Sunday
function isWeekend(key) {
    const day = parseKey(key).getDay();
    return day === 0 || day === 6;
}

// The Monday of the week a day belongs to. Saturday and Sunday belong to the week just ended.
function weekKey(key) {
    const day = parseKey(key).getDay();
    return addDays(key, -(day === 0 ? 6 : day - 1));
}

// How many weekdays there have been from DAILY_START up to (not including) this day
function tradingDayIndex(key) {
    let n = 0;
    for (let k = DAILY_START; k < key; k = addDays(k, 1)) {
        if (!isWeekend(k)) n++;
    }
    return n;
}

function todaysCards(key) {
    if (key < DAILY_START || isWeekend(key)) return [];
    const first = tradingDayIndex(key) * CARDS_PER_DAY;
    return puzzles.slice(first, first + CARDS_PER_DAY);
}

// "Monday 26 October" and "26 Oct"
const longDay = (key) => parseKey(key).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
const shortDay = (key) => parseKey(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

// This week's portfolio, saved in this browser:
// { week: "2026-10-26", days: { "2026-10-26": { start: 10000, results: [...] } } }
// When a new week begins, the old one is filed in the history and the portfolio resets.
function loadWeek() {
    const current = weekKey(todayKey());
    let week = null;
    try { week = JSON.parse(localStorage.getItem("pricedInWeek")); } catch (e) { /* start fresh */ }
    if (!week || typeof week !== "object" || !week.days) week = { week: current, days: {} };
    if (week.week !== current) {
        if (playedDays(week).length) addToHistory(week);
        week = { week: current, days: {} };
        storeWeek(week);
    }
    return week;
}

function storeWeek(week) {
    try { localStorage.setItem("pricedInWeek", JSON.stringify(week)); } catch (e) { /* progress just won't be saved */ }
}

// Days with at least one card played, in order
function playedDays(week) {
    return Object.keys(week.days).sort().filter(key => week.days[key].results.length > 0);
}

function dayEnd(day) {
    return day.start + day.results.reduce((sum, r) => sum + r.pnl, 0);
}

// The portfolio right now: where the last played day finished, or $10,000 if nothing's been played
function weekBalance(week) {
    const days = playedDays(week);
    return days.length ? dayEnd(week.days[days[days.length - 1]]) : START_VALUE;
}

function loadHistory() {
    try {
        const history = JSON.parse(localStorage.getItem("pricedInHistory"));
        return Array.isArray(history) ? history : [];
    } catch (e) {
        return [];
    }
}

function addToHistory(week) {
    const history = loadHistory();
    history.unshift({ week: week.week, end: weekBalance(week) });
    try { localStorage.setItem("pricedInHistory", JSON.stringify(history.slice(0, 52))); } catch (e) { /* not saved */ }
}


// ---------- The tower ----------
// Your level isn't saved anywhere: it comes straight from your portfolio balance.

// Which level a balance is on (0 = Street ... 6 = Rooftop)
function levelFor(balance) {
    let index = 0;
    LEVELS.forEach((level, i) => { if (balance >= level.min) index = i; });
    return index;
}

// Where a balance sits on the tower as one number: the level, plus how far through it you are.
// e.g. $11,750 is halfway through the Trading floor ($11,000 to $12,500), so 2.5.
// The street runs up from $5,000, and the rooftop tops out at $30,000.
function towerPos(balance) {
    const i = levelFor(balance);
    const low = i === 0 ? 5000 : LEVELS[i].min;
    const high = i < LEVELS.length - 1 ? LEVELS[i + 1].min : 30000;
    return i + Math.max(0, Math.min(1, (balance - low) / (high - low)));
}

// "Level 3 · Corner office" (the street has no number)
const levelText = (i) => (i === 0 ? "Street level" : `Level ${i} · ${LEVELS[i].name}`);
// For sentences: "on level 3, the corner office"
const levelPhrase = (i) => (i === 0 ? "out on the street" : `on level ${i}, the ${LEVELS[i].name.toLowerCase()}`);

// Everything that shows your place on the tower: the elevator display in the top bar,
// the scale on the left (laptops) and the "next level" line (phones and tablets)
function showTower(balance) {
    const i = levelFor(balance);

    const box = $("floor");
    box.innerHTML = "";
    box.appendChild(cell("span", i === 0 ? "G" : String(i), "floor-num"));
    box.appendChild(cell("span", LEVELS[i].name, "floor-name"));
    box.dataset.level = i;
    box.setAttribute("aria-label", levelText(i));

    $("next-level").textContent = i < LEVELS.length - 1
        ? `Next: ${LEVELS[i + 1].name} at ${money(LEVELS[i + 1].min)} · ${money(LEVELS[i + 1].min - balance)} to go`
        : "Top of the tower";

    // The scale: one row per level, top to bottom, with a marker at your balance
    const rows = $("tower-levels");
    if (!rows.children.length) {
        LEVELS.slice().reverse().forEach(level => {
            const row = document.createElement("div");
            row.className = "tower-row";
            row.appendChild(cell("span", level.name, "tower-name"));
            row.appendChild(cell("span", level.min ? money(level.min) : "below $10,000", "tower-min"));
            rows.appendChild(row);
        });
        rows.appendChild(cell("div", "", "tower-marker"));
    }
    [...rows.querySelectorAll(".tower-row")].forEach((row, k) => {
        const index = LEVELS.length - 1 - k;
        row.className = "tower-row" + (index === i ? " now" : index < i ? " passed" : "");
    });
    const marker = rows.querySelector(".tower-marker");
    marker.style.bottom = (towerPos(balance) / LEVELS.length * 100).toFixed(2) + "%";
    marker.textContent = money(balance);
}

// After a reveal: the elevator, the scale and the city move to your new balance, and reaching
// a new level gets a banner. Waits until the profit or loss has finished counting.
let climbTimer = null;
let pendingClimb = null;

function climb(from, to) {
    finishClimb();
    if (from === to) return;
    const go = () => {
        pendingClimb = null;
        showTower(to);
        setSceneTower(to);
        const newLevel = levelFor(to), oldLevel = levelFor(from);
        if (newLevel !== oldLevel) {
            replayAnimation($("floor"), newLevel > oldLevel ? "floor-up" : "floor-down");
            const toast = $("floor-toast");
            toast.textContent = newLevel > oldLevel ? `▲ ${LEVELS[newLevel].name}` : `▼ Back to the ${LEVELS[newLevel].name.toLowerCase()}`;
            toast.className = "floor-toast " + (newLevel > oldLevel ? "is-up" : "is-down");
            replayAnimation(toast, "show");
        }
    };
    if (reduceMotion) go();
    else {
        pendingClimb = go;
        climbTimer = setTimeout(go, 2600);
    }
}

// If the player moves on before the elevator has moved, move it now
function finishClimb() {
    clearTimeout(climbTimer);
    if (pendingClimb) pendingClimb();
}

// A new round or the menu starts from a fresh balance, so a climb still waiting is dropped
function cancelClimb() {
    clearTimeout(climbTimer);
    pendingClimb = null;
}


// ---------- 3. The menu: Today, Week and Practice tabs ----------
let currentTab = "today";

$("tab-today").addEventListener("click", () => showHub("today"));
$("tab-week").addEventListener("click", () => showHub("week"));
$("tab-practice").addEventListener("click", () => showHub("practice"));

function showHub(tab) {
    currentTab = tab;
    const key = todayKey();
    const week = loadWeek();
    const day = week.days[key];

    // The top bar shows this week's portfolio and today's squares
    mode = "daily";
    deck = todaysCards(key);
    results = day ? day.results.slice() : [];
    cardIndex = results.length;
    portfolio = weekBalance(week);
    showPortfolio();
    showReturn();
    showSquares();
    $("progress").textContent = deck.length ? "Today" : isWeekend(key) ? "Market closed" : "No new cards";
    cancelClimb();
    showTower(portfolio);
    setSceneTower(portfolio);

    // Show the screen first, so the week graph can measure its width
    showOnly(tab);
    showButtons("tab-bar");
    if (tab === "today") showToday(key, week);
    if (tab === "week") showWeek(key, week);
    if (tab === "practice") showPractice();

    ["today", "week", "practice"].forEach(name => {
        $("tab-" + name).classList.toggle("active", name === tab);
    });
    restartAnimations($(tab));
    window.scrollTo(0, 0);
}

function showToday(key, week) {
    const cards = todaysCards(key);
    const day = week.days[key];
    const done = day ? day.results.length : 0;

    $("today-kicker").textContent = longDay(key);
    $("today-note").textContent = "";
    showTeasers(cards, day);
    showWeekStrip(key, week);

    let title, text, button;
    let countdown = null;   // [label, the day the next cards arrive]
    if (key < DAILY_START) {
        title = "Daily cards start soon";
        text = `${CARDS_PER_DAY} new cards every weekday, with a $10,000 portfolio that carries through the week. Until then, play every card in Practice.`;
        button = "Go to Practice";
        countdown = ["First cards in", DAILY_START];
    } else if (isWeekend(key)) {
        title = "The market's closed";
        text = "See how your week went in the Week tab.";
        button = "See your week";
        countdown = ["Market opens in", nextWeekday(key)];
    } else if (cards.length === 0) {
        title = "New cards coming soon";
        text = "You've reached the end of the cards for now. Try Practice, or check back tomorrow.";
        button = "Go to Practice";
    } else if (done === 0) {
        title = cards.length === 1 ? "1 new card" : `${cards.length} new cards`;
        text = `Your portfolio: ${money(portfolio)} (${weekReturnText()} this week). Read each card and make your trade.`;
        button = cards.length === 1 ? "Play today's card" : "Play today's cards";
    } else if (done < cards.length) {
        title = "Finish today's cards";
        text = `${done} of ${cards.length} played. Your portfolio: ${money(portfolio)}.`;
        button = "Continue";
    } else {
        const dayPnl = dayEnd(day) - day.start;
        title = "Done for today";
        text = `Today ${signedMoney(dayPnl)}. Your portfolio: ${money(portfolio)} (${weekReturnText()} this week).`;
        button = "Share today";
        countdown = ["Next cards in", nextWeekday(key)];
    }
    startCountdown(countdown);
    $("today-title").textContent = title;
    $("today-text").textContent = text;
    $("btn-today").textContent = button;
}

$("btn-today").addEventListener("click", () => {
    const label = $("btn-today").textContent;
    if (label === "Go to Practice") showHub("practice");
    else if (label === "See your week") showHub("week");
    else if (label === "Share today" || label === "Copied!") shareDay();
    else startDaily();
});

function nextWeekday(key) {
    let next = addDays(key, 1);
    while (isWeekend(next)) next = addDays(next, 1);
    return next;
}

// A live countdown to midnight at the start of the given day, in chunky tiles.
// With ?day= in the address, the clock pretends to be on that day.
let countdownTimer = null;

function startCountdown(countdown) {
    clearInterval(countdownTimer);
    countdownTimer = null;
    $("today-countdown").hidden = !countdown;
    if (!countdown) return;

    const [label, targetKey] = countdown;
    $("countdown-label").textContent = label;
    const target = parseKey(targetKey).getTime();

    function tick() {
        const now = new Date();
        const today = parseKey(todayKey());
        today.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        let left = Math.max(0, Math.floor((target - today.getTime()) / 1000));
        const parts = [["days", Math.floor(left / 86400)], ["hrs", Math.floor(left / 3600) % 24], ["min", Math.floor(left / 60) % 60], ["sec", left % 60]];
        const tiles = $("countdown-tiles");
        tiles.innerHTML = "";
        parts.forEach(([name, value], i) => {
            if (i === 0 && value === 0) return;   // no "0 days"
            const tile = document.createElement("div");
            tile.className = "count-tile";
            tile.appendChild(cell("strong", String(value).padStart(2, "0")));
            tile.appendChild(cell("span", name));
            tiles.appendChild(tile);
        });
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
}

// Today's cards as small teasers: card number, month and disguise, ticked off once played
function showTeasers(cards, day) {
    const box = $("today-grid");
    box.innerHTML = "";
    cards.forEach((card, i) => {
        const result = day && day.results[i];
        const row = document.createElement("div");
        row.className = "teaser" + (result ? " played" : "");
        const text = document.createElement("div");
        text.className = "teaser-text";
        text.appendChild(cell("span", `Card ${i + 1} · ${card.when}`, "label"));
        text.appendChild(cell("strong", result ? card.company : card.disguise));
        row.appendChild(text);
        if (result) {
            const squares = document.createElement("div");
            squares.className = "grid-row";
            squareStates(result).forEach(state => squares.appendChild(cell("div", "", "sq " + state)));
            row.appendChild(squares);
            row.appendChild(cell("span", signedMoney(result.pnl), "grid-pnl " + (result.pnl > 0 ? "is-up" : result.pnl < 0 ? "is-down" : "")));
        }
        box.appendChild(row);
    });
}

// Mon–Fri mini tiles for this week (or the first week, before the daily cards start)
function showWeekStrip(key, week) {
    showWeekTiles($("today-week"), key < DAILY_START ? DAILY_START : weekKey(key), week, key);
}

// One tile per weekday: the day's result in green or red, today outlined in gold,
// days still to come locked. Used on the Today tab and the Week tab.
function showWeekTiles(strip, monday, week, key) {
    strip.innerHTML = "";
    ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((name, i) => {
        const dayKey = addDays(monday, i);
        const day = week && week.week === monday ? week.days[dayKey] : null;
        const played = day && day.results.length > 0;
        const dayPnl = played ? dayEnd(day) - day.start : 0;
        const locked = dayKey > key;
        const tile = document.createElement("div");
        tile.className = "day-tile" + (played ? (dayPnl >= 0 ? " up" : " down") : "") +
            (dayKey === key ? " today" : "") + (locked ? " locked" : "");
        tile.appendChild(cell("span", `${name} ${parseKey(dayKey).getDate()}`, "day-name"));
        tile.appendChild(cell("span", played ? compactMoney(dayPnl) : locked ? "🔒" : "—", "day-pnl"));
        tile.appendChild(cell("span", todaysCards(dayKey).length ? `${todaysCards(dayKey).length} cards` : "", "day-sub"));
        strip.appendChild(tile);
    });
}

function weekReturnText() {
    const ret = roundReturn();
    return (ret >= 0 ? "+" : "−") + Math.abs(ret).toFixed(1) + "%";
}

function showPractice() {
    $("practice-text").textContent = `Play all ${puzzles.length} cards in one go, starting with $10,000. Practice doesn't touch your weekly portfolio.`;
}

$("btn-practice").addEventListener("click", startPractice);

// The week: a tile per weekday, a graph of the portfolio, stats and past weeks
function showWeek(key, week) {
    // Before the daily cards start, there's no week to show yet
    if (key < DAILY_START) {
        $("week-kicker").textContent = "Week of " + shortDay(DAILY_START);
        $("week-pnl").textContent = "Your first week";
        $("week-pnl").className = "headline";
        $("week-balance").textContent = "Starts with $10,000 on " + longDay(DAILY_START);
        showWeekTiles($("week-days"), DAILY_START, null, key);
        $("week-chart").innerHTML = "";
        $("week-note").textContent = "Each weekday's result will appear here, with a graph of your portfolio and your stats.";
        $("week-stats").innerHTML = "";
        $("week-compare").textContent = "";
        $("past-weeks").innerHTML = "";
        return;
    }

    const balance = weekBalance(week);
    const pnl = balance - START_VALUE;
    $("week-kicker").textContent = "Week of " + shortDay(week.week);
    $("week-pnl").textContent = signedMoney(pnl);
    $("week-pnl").className = "headline " + (pnl > 0 ? "is-up" : pnl < 0 ? "is-down" : "");
    $("week-balance").textContent = `Portfolio ${money(balance)} · ${weekReturnText()}`;

    // Monday to Friday tiles
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    showWeekTiles($("week-days"), week.week, week, key);

    // The graph: $10,000 at the start, then the portfolio at the end of each weekday so far
    const values = [START_VALUE];
    const labels = ["Start"];
    let value = START_VALUE;
    names.forEach((name, i) => {
        const dayKey = addDays(week.week, i);
        if (dayKey > key) return;
        const day = week.days[dayKey];
        if (day && day.results.length) value = dayEnd(day);
        values.push(value);
        labels.push(name);
    });
    const days = playedDays(week);
    if (days.length) {
        drawWeekChart(values, labels);
        $("week-note").textContent = "Your portfolio at the end of each day. It resets to $10,000 every Monday.";
    } else {
        $("week-chart").innerHTML = "";
        $("week-note").textContent = "Play today's cards to start this week's graph. Your portfolio resets to $10,000 every Monday.";
    }

    // Stats over every card played this week
    const all = days.flatMap(d => week.days[d].results);
    const stats = $("week-stats");
    stats.innerHTML = "";
    $("week-compare").textContent = "";
    if (all.length) {
        const best = all.reduce((a, b) => (b.pnl > a.pnl ? b : a));
        const worst = all.reduce((a, b) => (b.pnl < a.pnl ? b : a));
        const biggest = all.reduce((a, b) => (b.stake > a.stake ? b : a));
        const trades = all.filter(r => r.side !== "out");
        addStat(stats, "Tower", levelText(levelFor(balance)), "gold");
        addStat(stats, "Right way round", `${trades.filter(r => r.dirRight).length} of ${trades.length}`);
        addStat(stats, "Better exit", `${trades.filter(r => r.timingRight).length} of ${trades.length}`);
        addStat(stats, "Biggest trade", `${money(biggest.stake)} · ${biggest.company}`);
        addStat(stats, "Best call", `${signedMoney(best.pnl)} · ${best.company}`, best.pnl >= 0 ? "is-up" : "is-down");
        addStat(stats, worst.pnl >= 0 ? "Smallest win" : "Worst call", `${signedMoney(worst.pnl)} · ${worst.company}`, worst.pnl >= 0 ? "is-up" : "is-down");
        $("week-compare").textContent = compareWithHolding(all, balance);
    }

    // Past weeks
    const past = $("past-weeks");
    past.innerHTML = "";
    loadHistory().slice(0, 8).forEach(h => {
        const ret = (h.end - START_VALUE) / START_VALUE * 100;
        const row = document.createElement("div");
        row.className = "past-row";
        row.appendChild(cell("span", "Week of " + shortDay(h.week)));
        row.appendChild(cell("span", money(h.end), "muted"));
        row.appendChild(cell("span", (ret >= 0 ? "+" : "−") + Math.abs(ret).toFixed(1) + "%", "past-ret " + (ret >= 0 ? "is-up" : "is-down")));
        past.appendChild(row);
    });
    if (past.children.length) past.prepend(cell("span", "Past weeks", "label"));
}

function addStat(box, label, value, className) {
    const stat = document.createElement("div");
    stat.className = "stat";
    stat.appendChild(cell("span", label, "label"));
    stat.appendChild(cell("span", value, "stat-value " + (className || "")));
    box.appendChild(stat);
}

// Replay the week with the same trades, but always holding to the close.
// It shows whether your choices at the open actually helped.
function compareWithHolding(all, balance) {
    if (all.some(r => typeof r.closeRet !== "number")) return "";
    let value = START_VALUE;
    all.forEach(r => {
        const sign = r.side === "long" ? 1 : r.side === "short" ? -1 : 0;
        value += Math.round(Math.round(value * r.share) * sign * r.closeRet);
    });
    const diff = Math.round(balance - value);
    if (diff > 0) return `Your exits beat "always hold to the close" by ${money(diff)}.`;
    if (diff < 0) return `"Always hold to the close" would have made ${money(-diff)} more.`;
    return `You finished level with "always hold to the close".`;
}

// A small line chart of the portfolio over the week, with the $10,000 start as a dashed line
function drawWeekChart(values, labels) {
    const W = Math.max(260, Math.round($("week-chart").clientWidth || 340));
    const H = 120;
    const PAD = 14;
    const isUp = values[values.length - 1] >= START_VALUE;
    const colour = isUp ? "var(--up)" : "var(--down)";

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const x = (i) => PAD + (i / Math.max(1, values.length - 1)) * (W - PAD * 2);
    const y = (v) => H - PAD - ((v - min) / range) * (H - PAD * 2);

    const points = values.map((v, i) => [x(i), y(v)]);
    const linePath = values.length > 1 ? smoothPath(points) : "";
    const startY = y(START_VALUE).toFixed(1);

    // Only numbers and fixed day names go into this string
    $("week-chart").innerHTML = `
        <svg viewBox="0 0 ${W} ${H + 16}" role="img" aria-label="Portfolio over the week">
            <line x1="${PAD}" y1="${startY}" x2="${W - PAD}" y2="${startY}" stroke="var(--border)" stroke-width="1.5" stroke-dasharray="3 4"></line>
            <path d="${linePath}" fill="none" stroke="${colour}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
            ${points.map(([px, py]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${colour}"></circle>`).join("")}
            ${labels.map((label, i) => `<text x="${x(i).toFixed(1)}" y="${H + 14}" fill="var(--muted)" font-family="JetBrains Mono, monospace" font-size="11" text-anchor="middle">${label}</text>`).join("")}
        </svg>`;
}


// ---------- 4. Round flow ----------
function startPractice() {
    mode = "practice";
    deck = puzzles.slice();
    dailyKey = null;
    startRound();
}

function startRound() {
    cardIndex = 0;
    results = [];
    portfolio = START_VALUE;
    showPortfolio();
    showReturn();
    cancelClimb();
    showTower(portfolio);   // a practice round starts in the Lobby with its own $10,000
    setSceneTower(portfolio);
    showCard();
}

// Play (or carry on with) today's cards. The portfolio picks up where this week left off.
function startDaily() {
    const key = todayKey();
    const week = loadWeek();
    if (!week.days[key]) {
        week.days[key] = { start: weekBalance(week), results: [] };
        storeWeek(week);
    }
    const day = week.days[key];

    mode = "daily";
    dailyKey = key;
    deck = todaysCards(key);
    results = day.results.slice();
    cardIndex = results.length;
    portfolio = dayEnd(day);
    showPortfolio();
    showReturn();
    showTower(portfolio);
    setSceneTower(portfolio);
    if (cardIndex >= deck.length) { showHub("today"); return; }
    showCard();
    if (day.pending && day.pending.id === deck[cardIndex].id) {
        trade = day.pending;
        showOpen();
    }
}

// The "Return" box in the HUD: how far the portfolio is up or down
function showReturn() {
    const ret = roundReturn();
    $("return").textContent = (ret >= 0 ? "+" : "−") + Math.abs(ret).toFixed(1) + "%";
    $("return").className = "hud-value " + (ret > 0 ? "is-up" : ret < 0 ? "is-down" : "");
}

// The row of squares in the HUD: gold = this card, green/red = finished cards
function showSquares() {
    const box = $("squares");
    box.innerHTML = "";
    deck.forEach((_, i) => {
        const sq = document.createElement("i");
        if (i < results.length) sq.className = results[i].side === "out" ? "" : results[i].pnl >= 0 ? "hit" : "miss";
        else if (i === cardIndex) sq.className = "now";
        box.appendChild(sq);
    });
}

// Show the current card and the Up/Down buttons
function showCard() {
    const puzzle = deck[cardIndex];
    trade = null;
    finishClimb();

    $("progress").textContent = `Card ${cardIndex + 1} of ${deck.length}`;
    $("when").textContent = puzzle.when;
    $("disguise").textContent = puzzle.disguise;
    $("mood").textContent = puzzle.mood;
    $("other-news").textContent = puzzle.otherNews;
    showRows(puzzle.rows);
    showSquares();

    showOnly("card");
    // The days before the results, without prices, so price levels can't give the company away
    if (puzzle.candles) {
        const before = puzzle.candles.slice(0, -1);
        showChart("card-chart", before, {
            axis: true, hover: true, beforeResults: true, percent: true,
            entry: { index: before.length - 1, price: before[before.length - 1][3], label: "You trade here" }
        });
        $("card-chart-note").textContent = "Daily candles up to the results, as % change since the first day shown. Dollar prices are hidden so they can't give the company away. Zoom with the buttons, hover or tap to see each day.";
    } else {
        $("card-chart").innerHTML = "";
        $("card-chart-note").textContent = "";
    }
    showButtons("dir-buttons");
    replayAnimation($("card"), "enter");
    window.scrollTo(0, 0);
}

// Build the expected-vs-actual table
function showRows(rows) {
    const table = $("rows");
    table.innerHTML = "";

    const header = document.createElement("tr");
    ["", "Expected", "Actual", ""].forEach(text => header.appendChild(cell("th", text)));
    table.appendChild(header);

    rows.forEach(row => {
        let result, chipClass;
        if (row.actual > row.expected) {
            result = "Beat";
            chipClass = "chip-beat";
        } else if (row.actual < row.expected) {
            result = "Miss";
            chipClass = "chip-miss";
        } else {
            result = "In line";
            chipClass = "chip-inline";
        }

        // Show both numbers to the same decimals, so 1.6 vs 1.64 reads as 1.60 vs 1.64
        const places = Math.max(decimals(row.expected), decimals(row.actual));

        const line = document.createElement("tr");
        line.appendChild(cell("td", row.label));
        line.appendChild(cell("td", row.expected.toFixed(places), "num"));
        line.appendChild(cell("td", row.actual.toFixed(places), "num actual"));

        const chipCell = document.createElement("td");
        const chip = document.createElement("span");
        chip.className = "chip " + chipClass;
        chip.textContent = result;
        // How big the surprise was: actual vs expected, in %
        if (row.expected !== 0 && row.actual !== row.expected) {
            const pct = (row.actual - row.expected) / Math.abs(row.expected) * 100;
            const pctSpan = document.createElement("span");
            pctSpan.className = "pct";
            pctSpan.textContent = (pct > 0 ? "+" : "−") + Math.abs(pct).toFixed(1) + "%";
            chip.appendChild(pctSpan);
        }
        chipCell.appendChild(chip);
        line.appendChild(chipCell);

        table.appendChild(line);
    });
}

// How many decimal places a number has, e.g. 1.64 → 2, 32 → 0
function decimals(n) {
    const text = String(n);
    return text.includes(".") ? text.split(".")[1].length : 0;
}

// Make one table cell. textContent (not innerHTML) keeps text as plain text.
function cell(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
}


// ---------- 5. The trade: buy, short or stay out, how much, then when to sell ----------
// The trade starts at the close on results day (the results come out after the market shuts).
// The next morning the player sees the opening price and either takes the profit or loss
// there, or holds until the close. The profit or loss is the real price move on the position.
let trade = null;   // the trade on this card: { side: "long" or "short", share, stake }

$("btn-up").addEventListener("click", () => pickSide("long"));
$("btn-down").addEventListener("click", () => pickSide("short"));
$("btn-out").addEventListener("click", () => finishTrade({ side: "out", share: 0, stake: 0 }, "close"));
$("btn-low").addEventListener("click", () => placeTrade("low"));
$("btn-mid").addEventListener("click", () => placeTrade("mid"));
$("btn-high").addEventListener("click", () => placeTrade("high"));
$("btn-exit-open").addEventListener("click", () => finishTrade(trade, "open"));
$("btn-exit-close").addEventListener("click", () => finishTrade(trade, "close"));

function pickSide(side) {
    trade = { side };
    $("picked-2").textContent = side === "long" ? "BUY" : "SHORT";
    $("picked-2").className = side === "long" ? "is-up" : "is-down";

    // Show how many dollars each level is right now
    $("amt-low").textContent = `${STAKES.low * 100}% · ${money(portfolio * STAKES.low)}`;
    $("amt-mid").textContent = `${STAKES.mid * 100}% · ${money(portfolio * STAKES.mid)}`;
    $("amt-high").textContent = `${STAKES.high * 100}% · ${money(portfolio * STAKES.high)}`;
    showButtons("stake-buttons");
}

function placeTrade(level) {
    trade.share = STAKES[level];
    trade.stake = Math.round(portfolio * trade.share);
    savePending(trade);
    if (reaction(deck[cardIndex]).hasOpen) showOpen();
    else finishTrade(trade, "close");
}

// In daily mode the open trade is saved before the opening price is shown,
// so reloading the page can't be used to change the trade after seeing the open
function savePending(t) {
    if (mode !== "daily") return;
    const week = loadWeek();
    const day = week.days[dailyKey];
    if (!day) return;
    day.pending = { id: deck[cardIndex].id, side: t.side, share: t.share, stake: t.stake };
    storeWeek(week);
}

// The prices that matter on the day after the results
function reaction(puzzle) {
    const c = puzzle.candles;
    if (Array.isArray(c) && c.length >= 2) {
        const day = c[c.length - 1];
        return { before: c[c.length - 2][3], open: day[0], high: day[1], low: day[2], close: day[3], hasOpen: true };
    }
    // A card without candles: only the move from close to close is known
    const before = 100, close = 100 * (1 + puzzle.answer.movePct / 100);
    return { before, open: close, high: Math.max(before, close), low: Math.min(before, close), close, hasOpen: false };
}

const pct = (from, to) => (to - from) / from;
const signedPct = (r) => (r >= 0 ? "+" : "−") + Math.abs(r * 100).toFixed(1) + "%";

// The next morning: the opening price is in
function showOpen() {
    const puzzle = deck[cardIndex];
    const r = reaction(puzzle);
    const openRet = pct(r.before, r.open);
    const sign = trade.side === "long" ? 1 : -1;
    const pnlNow = Math.round(trade.stake * sign * openRet);

    $("open-when").textContent = "The next morning · " + puzzle.when;
    $("open-move").textContent = "Opened " + signedPct(openRet);
    $("open-move").className = "headline " + (openRet >= 0 ? "is-up" : "is-down");
    $("open-text").textContent = `You ${trade.side === "long" ? "bought" : "shorted"} ${money(trade.stake)} at the close before the results. ` +
        `At the open you're ${pnlNow >= 0 ? "up" : "down"} ${money(Math.abs(pnlNow))}.`;
    $("exit-open-pnl").textContent = signedMoney(pnlNow);

    showOnly("open");
    if (puzzle.candles) {
        const n = puzzle.candles.length;
        drawCandles("open-chart", puzzle.candles, {
            openOnlyLast: true, marker: n - 2,
            entry: { index: n - 2, price: puzzle.candles[n - 2][3], label: "Your entry" }
        });
    }
    showButtons("exit-buttons");
    replayAnimation($("open"), "enter");
    window.scrollTo(0, 0);
}

function finishTrade(t, exit) {
    const puzzle = deck[cardIndex];
    const r = reaction(puzzle);
    const openRet = pct(r.before, r.open);
    const closeRet = pct(r.before, r.close);
    const sign = t.side === "long" ? 1 : t.side === "short" ? -1 : 0;
    const exitRet = exit === "open" ? openRet : closeRet;
    const otherRet = exit === "open" ? closeRet : openRet;
    const pnl = Math.round(t.stake * sign * exitRet);

    const result = {
        id: puzzle.id, company: puzzle.company,
        side: t.side, share: t.share, stake: t.stake, exit, pnl,
        dirRight: t.side === "out" ? null : sign * closeRet > 0,           // was the trade the right way round?
        timingRight: t.side === "out" ? null : sign * exitRet >= sign * otherRet,   // did you pick the better exit?
        openRet, closeRet
    };
    results.push(result);
    trade = null;

    const before = portfolio;
    portfolio += pnl;

    // Daily results are saved straight away, so leaving halfway through loses nothing
    if (mode === "daily") {
        const week = loadWeek();
        const day = week.days[dailyKey];
        if (day) {
            day.results.push(result);
            delete day.pending;
            storeWeek(week);
        }
    }

    showReveal(puzzle, result, before);
    climb(before, portfolio);
}


// ---------- 6. The reveal ----------
function showReveal(puzzle, result, before) {
    const move = puzzle.answer.movePct;
    const isUp = puzzle.answer.direction === "up";
    const r = reaction(puzzle);

    $("reveal-when").textContent = "Next-day close · " + puzzle.when;
    $("company").textContent = "It was " + puzzle.company + ".";
    $("move").className = "move-number " + (isUp ? "is-up" : "is-down");
    $("why").textContent = puzzle.why;
    $("tag").textContent = "Lesson: " + puzzle.tag;
    $("source").href = puzzle.source;

    // Position and exit boxes
    if (result.side === "out") {
        setVerdict("verdict-dir", "Stayed out", null);
        setVerdict("verdict-size", "—", null);
    } else {
        setVerdict("verdict-dir", result.side === "long" ? "Bought" : "Shorted", result.dirRight);
        setVerdict("verdict-size", result.exit === "open" ? "At the open" : "Held", result.timingRight);
    }

    // What happened, in dollars and prices
    $("pnl").className = "stat-value " + (result.pnl > 0 ? "is-up" : result.pnl < 0 ? "is-down" : "");
    const exitPrice = result.exit === "open" ? r.open : r.close;
    let detail;
    if (result.side === "out") {
        detail = `You stayed out. It opened ${signedPct(result.openRet)} and closed ${signedPct(result.closeRet)}.`;
    } else {
        const verb = result.side === "long" ? "bought" : "shorted";
        const exitVerb = result.side === "long" ? "sold" : "bought back";
        detail = r.hasOpen
            ? `You ${verb} ${money(result.stake)} at $${r.before.toFixed(2)} and ${exitVerb} ${result.exit === "open" ? "at the open" : "at the close"} at $${exitPrice.toFixed(2)}.`
            : `You ${verb} ${money(result.stake)}. It moved ${signedPct(result.closeRet)} by the close.`;
        if (r.hasOpen && !result.timingRight) {
            const sign = result.side === "long" ? 1 : -1;
            const other = Math.round(result.stake * sign * (result.exit === "open" ? result.closeRet : result.openRet));
            detail += ` ${result.exit === "open" ? "Holding to the close" : "Taking it at the open"} would have made ${signedMoney(other)}.`;
        }
    }
    $("pnl-detail").textContent = detail;

    showSquares();
    showReturn();

    // Numbers tick: the % move, then your profit/loss, then the portfolio in the top bar
    const places = Number.isInteger(Math.abs(move)) ? 0 : 1;
    const moveSign = move >= 0 ? "+" : "−";
    animateNumber($("move"), 0, Math.abs(move), v => moveSign + v.toFixed(places) + "%", 250);
    animateNumber($("pnl"), 0, result.pnl, v => signedMoney(v), 1500);
    animateNumber($("portfolio"), before, portfolio, v => money(v), 1500);

    showOnly("reveal");
    drawChart(puzzle, result);   // drawn after the panel is visible, so it can measure its width
    restartAnimations($("reveal"));
    if (result.pnl !== 0) flash(result.pnl > 0);
    if (result.pnl < 0) replayAnimation($("pnl").parentElement, "shake");

    const lastCard = cardIndex === deck.length - 1;
    $("btn-next").textContent = !lastCard ? "Next card" : mode === "daily" ? "Finish today" : "See results";
    showButtons("next-step");
    window.scrollTo(0, 0);
}

// right: true (green tick), false (red cross) or null (no verdict)
function setVerdict(id, text, right) {
    $(id).textContent = text + (right === true ? " ✓" : right === false ? " ✗" : "");
    $(id).className = "stat-value " + (right === true ? "is-up" : right === false ? "is-down" : "");
}

// Make a number count from one value to another, fast at first then slowing down
// Show the portfolio in the top bar straight away, stopping any count still running from
// the last reveal (otherwise a quick "Play again" could end on the old round's number)
function showPortfolio() {
    $("portfolio").counting = null;
    $("portfolio").textContent = money(portfolio);
}

function animateNumber(el, from, to, format, delay) {
    if (reduceMotion) { el.counting = null; el.textContent = format(to); return; }

    const duration = 1100;
    const start = performance.now() + delay;
    el.textContent = format(from);
    // Remember which count is running, so a newer one (or showPortfolio) can stop this one
    const token = {};
    el.counting = token;

    function tick(now) {
        if (el.counting !== token) return;
        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// The reveal chart: every candle, with hover for the real prices
function drawChart(puzzle, result) {
    if (!puzzle.candles) {
        $("chart").innerHTML = "";
        $("chart-note").textContent = "";
        return;
    }
    const n = puzzle.candles.length;
    const traded = result && result.side !== "out";
    showChart("chart", puzzle.candles, {
        marker: n - 2, axis: true, hover: true, popLast: true,
        entry: traded ? { index: n - 2, price: puzzle.candles[n - 2][3], label: "Your entry" } : null,
        exit: traded ? { index: n - 1, price: result.exit === "open" ? puzzle.candles[n - 1][0] : puzzle.candles[n - 1][3] } : null
    });
    $("chart-note").textContent = traded
        ? "The gold line is where you got in, the gold dot where you got out. Zoom with the buttons, hover or tap to see each day's prices."
        : "Daily candles with volume along the bottom. Zoom with the buttons, hover or tap to see each day's prices.";
}

// ---------- Zooming ----------
// A zoomable chart remembers all its candles and how many days are showing.
// The range buttons (2W / 1M / 3M) and a trackpad pinch change the number of days;
// each new card starts zoomed right out.
const chartViews = {};
const MIN_DAYS = 8;

function showChart(boxId, candles, opts) {
    chartViews[boxId] = { candles, opts, days: candles.length };
    renderChart(boxId);
}

function renderChart(boxId) {
    const view = chartViews[boxId];
    const total = view.candles.length;
    const days = Math.max(Math.min(MIN_DAYS, total), Math.min(Math.round(view.days), total));
    const offset = total - days;
    // Markers are given as positions in the full list, so move them to the zoomed-in list
    const move = (index) => (index != null && index - offset >= 0 ? index - offset : null);
    const moveMark = (mark) => (mark && move(mark.index) != null ? { ...mark, index: move(mark.index) } : null);
    const opts = {
        ...view.opts,
        marker: move(view.opts.marker),
        entry: moveMark(view.opts.entry),
        exit: moveMark(view.opts.exit),
        percentBase: view.opts.percent ? view.candles[offset][3] : undefined,
        // The pop-in animation plays only the first time. Zooming redraws the chart,
        // and replaying it would hide the last candle for a moment on every zoom.
        popLast: view.opts.popLast && !view.drawn
    };
    drawCandles(boxId, view.candles.slice(offset), opts);
    view.drawn = true;

    // Light up the matching range button
    document.querySelectorAll(`.chart-range[data-chart="${boxId}"] button`).forEach(b => {
        const target = b.dataset.days === "all" ? total : Number(b.dataset.days);
        b.classList.toggle("active", Math.min(target, total) === days);
    });

    // Pinch on a trackpad (the browser reports it as a wheel event with ctrlKey)
    $(boxId).querySelector("svg").addEventListener("wheel", e => {
        if (!e.ctrlKey) return;
        e.preventDefault();
        view.days = Math.max(MIN_DAYS, Math.min(total, days * (e.deltaY > 0 ? 1.12 : 0.89)));
        renderChart(boxId);
    }, { passive: false });
}

document.querySelectorAll(".chart-range button").forEach(button => {
    button.addEventListener("click", () => {
        const boxId = button.parentElement.dataset.chart;
        const view = chartViews[boxId];
        if (!view) return;
        view.days = button.dataset.days === "all" ? view.candles.length : Number(button.dataset.days);
        renderChart(boxId);
    });
});

// Draw daily candles as an SVG, trading-platform style: tightly packed candles,
// faint gridlines, volume bars along the bottom and (optionally) a price scale.
// Each candle is [open, high, low, close, volume]. Green when it closed above its open, red when below.
// Options: marker = index of results day (a dashed line after it),
// openOnlyLast = draw the last day as just its opening price,
// axis = show a scale on the right, hover = show each day's numbers on hover,
// percentBase = show % change from this price instead of dollars (used before the reveal,
// so price levels can't give the company away), beforeResults = the last candle is results day,
// popLast = animate the last candle and the exit dot in.
// entry = { index, price, label }: a gold dashed line where the trade starts.
// exit = { index, price }: a gold dot where the trade ended.
function drawCandles(boxId, candles, opts) {
    const box = $(boxId);
    const W = Math.max(260, Math.round(box.clientWidth || 340));
    const H = W > 500 ? 260 : 210;
    const AXIS = opts.axis ? 48 : 0;          // room for the price scale on the right
    const TOP = 16;                           // room for the "results" label
    const PRICE_BOTTOM = Math.round(H * 0.76); // candles above, volume below
    const n = candles.length;
    const lastOnlyOpen = (i) => opts.openOnlyLast && i === n - 1;

    const highs = candles.map((k, i) => (lastOnlyOpen(i) ? k[0] : k[1]));
    const lows = candles.map((k, i) => (lastOnlyOpen(i) ? k[0] : k[2]));
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const pad = (max - min) * 0.06 || 1;
    const lo = min - pad, hi = max + pad;
    const plotW = W - AXIS;
    const slot = plotW / n;
    const x = (i) => slot * (i + 0.5);
    const y = (v) => TOP + (hi - v) / (hi - lo) * (PRICE_BOTTOM - TOP);
    const body = Math.max(1.5, slot * 0.7);
    const f = (v) => v.toFixed(1);

    // Volume bars along the bottom (not for a day that has only opened)
    const volumes = candles.map((k, i) => (lastOnlyOpen(i) ? 0 : k[4] || 0));
    const maxVol = Math.max(...volumes) || 1;
    const VOL_TOP = PRICE_BOTTOM + 8;

    // Only numbers go into this string, never text from the cards
    let parts = "";

    // Gridlines at round prices (or round percentages), labelled on the right when the scale is shown
    const base = opts.percentBase;
    const toUnit = (v) => (base ? (v / base - 1) * 100 : v);
    const fromUnit = (u) => (base ? base * (1 + u / 100) : u);
    const step = niceStep((toUnit(hi) - toUnit(lo)) / 4);
    const label = (u) => (base ? (u > 0 ? "+" : u < 0 ? "−" : "") + Math.abs(u).toFixed(step < 1 ? 1 : 0) + "%" : u.toFixed(step < 1 ? 2 : 0));
    for (let u = Math.ceil(toUnit(lo) / step) * step; u <= toUnit(hi); u += step) {
        const gy = f(y(fromUnit(u)));
        parts += `<line x1="0" y1="${gy}" x2="${plotW}" y2="${gy}" stroke="var(--border-soft)" stroke-width="1"></line>`;
        if (opts.axis) {
            parts += `<text x="${W - 4}" y="${f(y(fromUnit(u)) + 4)}" fill="var(--muted)" font-family="JetBrains Mono, monospace" font-size="10" text-anchor="end">${label(Math.round(u * 100) / 100)}</text>`;
        }
    }
    parts += `<line x1="0" y1="${PRICE_BOTTOM}" x2="${plotW}" y2="${PRICE_BOTTOM}" stroke="var(--border)" stroke-width="1"></line>`;

    if (opts.marker != null) {
        const mx = f(x(opts.marker) + slot / 2);
        parts += `<line x1="${mx}" y1="${TOP - 4}" x2="${mx}" y2="${H}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"></line>
            <text x="${mx}" y="10" fill="var(--muted)" font-family="JetBrains Mono, monospace" font-size="10" text-anchor="end">results&#8202;</text>`;
    }

    candles.forEach((k, i) => {
        const [o, h, l, c] = k;
        if (lastOnlyOpen(i)) {
            // The opening price as a gold dash, labelled just above (or below, if it's at the top)
            const labelY = y(o) < TOP + 14 ? y(o) + 16 : y(o) - 8;
            parts += `<g class="dot-pop"><line x1="${f(x(i) - Math.max(body, 6))}" y1="${f(y(o))}" x2="${f(x(i) + Math.max(body, 6))}" y2="${f(y(o))}" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"></line>
                <text x="${f(x(i))}" y="${f(labelY)}" fill="var(--gold)" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" text-anchor="end">open</text></g>`;
            return;
        }
        const colour = c >= o ? "var(--up)" : "var(--down)";
        const top = y(Math.max(o, c));
        const height = Math.max(1, Math.abs(y(o) - y(c)));
        const volH = volumes[i] / maxVol * (H - VOL_TOP);
        const cls = opts.popLast && i === n - 1 ? ' class="dot-pop"' : "";
        parts += `<g${cls}>
            <rect x="${f(x(i) - body / 2)}" y="${f(H - volH)}" width="${f(body)}" height="${f(volH)}" fill="${colour}" opacity="0.3"></rect>
            <line x1="${f(x(i))}" y1="${f(y(h))}" x2="${f(x(i))}" y2="${f(y(l))}" stroke="${colour}" stroke-width="1"></line>
            <rect x="${f(x(i) - body / 2)}" y="${f(top)}" width="${f(body)}" height="${f(height)}" fill="${colour}"></rect></g>`;
    });

    // Where the trade starts: a gold dashed line from the entry candle to the right edge
    if (opts.entry) {
        const ey = y(opts.entry.price);
        const ex = x(opts.entry.index);
        parts += `<line x1="${f(ex)}" y1="${f(ey)}" x2="${plotW}" y2="${f(ey)}" stroke="var(--gold)" stroke-width="1.5" stroke-dasharray="4 3"></line>
            <circle cx="${f(ex)}" cy="${f(ey)}" r="3.5" fill="var(--gold)"></circle>`;

        // The label goes above the line if the recent candles sit below it, otherwise below,
        // on a small dark tag so it never reads on top of a candle
        const recent = candles.slice(Math.max(0, opts.entry.index - 10), opts.entry.index);
        const below = recent.filter(k => (k[1] + k[2]) / 2 < opts.entry.price).length;
        const above = recent.length - below;
        const tagH = 18;
        const tagW = opts.entry.label.length * 6.4 + 14;
        let tagY = below >= above ? ey - tagH - 8 : ey + 8;
        tagY = Math.min(Math.max(tagY, TOP), PRICE_BOTTOM - tagH);
        const tagX = Math.max(0, ex - tagW + 6);
        parts += `<rect x="${f(tagX)}" y="${f(tagY)}" width="${f(tagW)}" height="${tagH}" rx="5" fill="var(--bg)" stroke="var(--gold)" stroke-width="1"></rect>
            <text x="${f(tagX + tagW / 2)}" y="${f(tagY + 12.5)}" fill="var(--gold)" font-family="JetBrains Mono, monospace" font-size="11" font-weight="600" text-anchor="middle">${opts.entry.label}</text>`;
    }
    // Where the trade ended
    if (opts.exit) {
        parts += `<circle${opts.popLast ? ' class="dot-pop"' : ""} cx="${f(x(opts.exit.index))}" cy="${f(y(opts.exit.price))}" r="5" fill="var(--gold)" stroke="var(--bg)" stroke-width="2"></circle>`;
    }

    // The last price, tagged on the scale like a trading platform
    if (opts.axis) {
        const last = candles[n - 1];
        const colour = last[3] >= candles[n - 2][3] ? "var(--up)" : "var(--down)";
        parts += `<rect x="${plotW + 2}" y="${f(y(last[3]) - 8)}" width="${AXIS - 2}" height="16" rx="3" fill="${colour}"></rect>
            <text x="${W - 4}" y="${f(y(last[3]) + 4)}" fill="var(--bg)" font-family="JetBrains Mono, monospace" font-size="10" font-weight="700" text-anchor="end">${base ? signedPct(pct(base, last[3])) : last[3].toFixed(2)}</text>`;
    }

    if (opts.hover) {
        parts += `<line class="hover-line" y1="${TOP - 4}" y2="${H}" stroke="var(--text-soft)" stroke-width="1" stroke-dasharray="2 2" visibility="hidden"></line>`;
    }

    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily price candles">${parts}</svg>`;
    if (opts.hover) addChartHover(box, candles, x, opts);
}

// A round gap between gridlines: 1, 2, 2.5 or 5 times a power of ten
function niceStep(rough) {
    const power = Math.pow(10, Math.floor(Math.log10(rough)));
    const r = rough / power;
    return power * (r < 1.5 ? 1 : r < 2.25 ? 2 : r < 3.5 ? 2.5 : r < 7.5 ? 5 : 10);
}

// Hover (or tap and drag on a phone) along the chart to see each day's prices
// With opts.percentBase it shows % changes only, never dollar prices.
function addChartHover(box, candles, x, opts) {
    const svg = box.querySelector("svg");
    const line = svg.querySelector(".hover-line");
    const last = candles.length - 1;

    const tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.hidden = true;
    const tipDay = document.createElement("span");
    const tipPrice = document.createElement("strong");
    const tipChange = document.createElement("span");
    tip.append(tipDay, tipPrice, tipChange);
    box.appendChild(tip);

    const resultsIndex = opts.beforeResults ? last : last - 1;
    function dayLabel(i) {
        if (i > resultsIndex) return "Day after results";
        if (i === resultsIndex) return "Results day";
        const n = resultsIndex - i;
        return n === 1 ? "1 trading day before" : n + " trading days before";
    }

    function show(clientX) {
        const rect = svg.getBoundingClientRect();
        const scale = svg.viewBox.baseVal.width / rect.width;
        const svgX = (clientX - rect.left) * scale;

        // The closest day to the pointer
        let i = 0;
        for (let j = 1; j <= last; j++) {
            if (Math.abs(x(j) - svgX) < Math.abs(x(i) - svgX)) i = j;
        }
        line.setAttribute("x1", x(i));
        line.setAttribute("x2", x(i));
        line.setAttribute("visibility", "visible");

        const [o, , , c] = candles[i];
        tipDay.textContent = dayLabel(i);
        tipPrice.textContent = opts.percentBase
            ? `${signedPct(pct(opts.percentBase, c))} since first day shown`
            : `Open $${o.toFixed(2)} · Close $${c.toFixed(2)}`;
        if (i > 0) {
            const change = pct(candles[i - 1][3], c);
            tipChange.textContent = signedPct(change);
            tipChange.className = change >= 0 ? "is-up" : "is-down";
        } else {
            tipChange.textContent = "";
        }

        // Keep the label inside the chart at both ends
        tip.hidden = false;
        const half = tip.offsetWidth / 2;
        tip.style.left = Math.min(Math.max(x(i) / scale, half), rect.width - half) + "px";
    }

    function hide() {
        line.setAttribute("visibility", "hidden");
        tip.hidden = true;
    }

    svg.addEventListener("pointermove", e => show(e.clientX));
    svg.addEventListener("pointerdown", e => show(e.clientX));
    svg.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") hide(); });   // on a phone, the label stays after you lift your finger
}

// Turn a list of points into a smooth curve that still passes through every point.
// "Monotone" smoothing: the curve never bulges above a peak or below a dip,
// so it doesn't invent prices that weren't there.
function smoothPath(pts) {
    const n = pts.length;
    const f = (v) => v.toFixed(1);
    if (n < 2) return "";
    if (n === 2) return `M${f(pts[0][0])} ${f(pts[0][1])} L${f(pts[1][0])} ${f(pts[1][1])}`;

    const dx = [], slope = [], tan = [];
    for (let i = 0; i < n - 1; i++) {
        dx[i] = pts[i + 1][0] - pts[i][0];
        slope[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
    }
    tan[0] = slope[0];
    tan[n - 1] = slope[n - 2];
    for (let i = 1; i < n - 1; i++) {
        tan[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2;
    }
    for (let i = 0; i < n - 1; i++) {
        if (slope[i] === 0) { tan[i] = 0; tan[i + 1] = 0; continue; }
        const a = tan[i] / slope[i], b = tan[i + 1] / slope[i];
        const s = a * a + b * b;
        if (s > 9) {
            const k = 3 / Math.sqrt(s);
            tan[i] = k * a * slope[i];
            tan[i + 1] = k * b * slope[i];
        }
    }

    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const h = dx[i] / 3;
        d += ` C${f(x0 + h)} ${f(y0 + tan[i] * h)} ${f(x1 - h)} ${f(y1 - tan[i + 1] * h)} ${f(x1)} ${f(y1)}`;
    }
    return d;
}

// Green or red flash across the whole screen
function flash(right) {
    const el = $("flash");
    el.className = "flash " + (right ? "flash-up" : "flash-down");
    void el.offsetWidth;   // forces the browser to notice the change so the animation restarts
    el.classList.add("go");
}


// ---------- 7. Next card / results ----------
$("btn-next").addEventListener("click", () => {
    if (cardIndex < deck.length - 1) {
        cardIndex++;
        showCard();
    } else if (mode === "daily") {
        saveStats(dailyKey);
        showHub("today");
    } else {
        showResults();
    }
});

function roundReturn() {
    return (portfolio - START_VALUE) / START_VALUE * 100;
}

function showResults() {
    const ret = roundReturn();
    const retText = (ret >= 0 ? "+" : "−") + Math.abs(ret).toFixed(1) + "%";

    $("progress").textContent = "Done";
    $("final-score").className = "headline big fade-up d1 " + (ret >= 0 ? "is-up" : "is-down");
    showSquares();
    animateNumber($("final-score"), START_VALUE, portfolio, v => money(v), 300);
    $("final-line").textContent = `${retText} on your $10,000, and you finished ${levelPhrase(levelFor(portfolio))}. ${scoreLine(ret, results.filter(r => r.dirRight === false).length)}`;

    $("grid").innerHTML = "";
    buildGrid($("grid"), results);

    saveStats(null);
    showOnly("results");
    restartAnimations($("results"));
    $("btn-share").textContent = "Share result";
    showButtons("end-step");
    window.scrollTo(0, 0);
}

// One row per card: two squares, the company and the profit or loss
function buildGrid(grid, list) {
    list.forEach(r => {
        const row = document.createElement("div");
        row.className = "grid-row";
        // Same colours as the HUD: wrong direction = red; right direction = green,
        // with the second square green (size right) or grey (size wrong)
        squareStates(r).forEach(state => {
            const sq = document.createElement("div");
            sq.className = "sq " + state;
            row.appendChild(sq);
        });
        const name = document.createElement("span");
        name.className = "grid-name";
        name.textContent = r.company;
        row.appendChild(name);
        const pnl = document.createElement("span");
        pnl.className = "grid-pnl " + (r.pnl >= 0 ? "is-up" : "is-down");
        pnl.textContent = signedMoney(r.pnl);
        row.appendChild(pnl);
        grid.appendChild(row);
    });
}

// First square: was the trade the right way round? Second: did you pick the better exit?
// Staying out is two grey squares.
function squareStates(r) {
    if (r.side === "out") return ["half", "half"];
    if (r.side) return [r.dirRight ? "hit" : "miss", r.timingRight ? "hit" : "half"];
    // Results saved before trading was added
    if (!r.dirRight) return ["miss", "miss"];
    return ["hit", r.sizeRight ? "hit" : "half"];
}

// The message depends on the return AND on how many directions were wrong
function scoreLine(ret, wrong) {
    const fooled = wrong === 0 ? "The market didn't fool you once."
        : wrong === 1 ? "The market fooled you once."
        : `The market fooled you ${wrong} times.`;
    if (ret >= 50) return `Outstanding. ${fooled}`;
    if (ret >= 15) return `Strong. ${fooled}`;
    if (ret >= 0) return `You stayed in the green. ${fooled}`;
    return `${fooled} That's the point: good news isn't always good for the price.`;
}

$("btn-replay").addEventListener("click", startPractice);

// Spoiler-free squares, Wordle-style
function shareSquares(list) {
    const emoji = { hit: "🟩", half: "⬜", miss: "🟥" };
    return list.map(r => squareStates(r).map(s => emoji[s]).join("")).join(" ");
}

$("btn-share").addEventListener("click", () => {
    const text = `Priced In practice: ${money(portfolio)} (${weekReturnText()})\n${shareSquares(results)}\n🏢 ${levelText(levelFor(portfolio))}\n${SITE_URL}`;
    share(text, $("btn-share"));
});

// e.g. "Priced In #3 · 28 Oct / 🟩🟩 🟩⬜ / Today +$1,250 · Week +12.5%"
function shareDay() {
    const key = todayKey();
    const week = loadWeek();
    const day = week.days[key];
    if (!day) return;
    const number = tradingDayIndex(key) + 1;
    const text = `Priced In #${number} · ${shortDay(key)}\n${shareSquares(day.results)}\n` +
        `Today ${signedMoney(dayEnd(day) - day.start)} · Week ${weekReturnText()}\n🏢 ${levelText(levelFor(weekBalance(week)))}\n${SITE_URL}`;
    share(text, $("btn-today"));
}

// Phones get the share sheet; computers copy to the clipboard
function share(text, button) {
    if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => { button.textContent = "Copied!"; }).catch(() => {});
    }
}


// ---------- 8. Stats saved in this browser ----------
// localStorage can fail (private browsing, blocked storage), so every use is wrapped in try/catch.
function loadStats() {
    const blank = { played: 0, bestValue: 0, streak: 0, lastDay: null };
    try {
        return Object.assign(blank, JSON.parse(localStorage.getItem("pricedInStats")) || {});
    } catch (e) {
        return blank;
    }
}

// key is the day just finished in daily mode, or null for practice.
// The streak counts daily cards finished on weekdays in a row; weekends don't break it.
function saveStats(key) {
    const stats = loadStats();

    if (key && stats.lastDay !== key) {
        let previous = addDays(key, -1);
        while (isWeekend(previous)) previous = addDays(previous, -1);
        stats.streak = stats.lastDay === previous ? stats.streak + 1 : 1;
        stats.lastDay = key;
    }
    stats.played += 1;
    stats.bestValue = Math.max(stats.bestValue, portfolio);

    try { localStorage.setItem("pricedInStats", JSON.stringify(stats)); } catch (e) { /* stats just won't be saved */ }

    $("stats").textContent = `Rounds played: ${stats.played} · Best portfolio: ${money(stats.bestValue)} · Day streak: ${stats.streak}`;
}


// ---------- Helpers ----------
// Show one screen and hide the others
function showOnly(screenId) {
    ["card", "open", "reveal", "results", "today", "week", "practice", "error"].forEach(id => { $(id).hidden = id !== screenId; });
    if (screenId !== "today") { clearInterval(countdownTimer); countdownTimer = null; }
}

// Show one group of buttons and hide the others
function showButtons(groupId) {
    ["dir-buttons", "stake-buttons", "exit-buttons", "next-step", "end-step", "tab-bar"].forEach(id => { $(id).hidden = id !== groupId; });
}

// Re-run a one-off animation on an element
function replayAnimation(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
}

// Re-run every fade-in inside a screen (each time it's shown)
function restartAnimations(container) {
    container.querySelectorAll(".fade-up").forEach(el => {
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "";
    });
}
