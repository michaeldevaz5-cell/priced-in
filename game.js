// =============================================================
// Priced In: game logic
// Michael wrote the first version of this file by hand (see git
// history up to "Up and Down buttons work"). From then on the code
// was written by Claude; Michael writes the scenarios in puzzles.json.
// =============================================================

// ---------- Settings ----------
const BIG_MOVE = 5;              // a move of 5% or more counts as "big"
const START_VALUE = 10000;       // every round starts with a $10,000 portfolio
const STAKES = { low: 0.10, mid: 0.25, high: 0.50 };   // share of the portfolio you bet
const HALF_WIN = 0.5;            // right direction, wrong size: win half your bet
const SITE_URL = "michaeldevaz5-cell.github.io/priced-in";

// ---------- Game state (the game's "memory") ----------
let puzzles = [];            // every card from puzzles.json
let cardIndex = 0;           // which card we're on (0 = first)
let pickedDir = null;        // "up" or "down"
let pickedSize = null;       // "small" or "big"
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


// ---------- 1. Load the cards ----------
fetch("puzzles.json")
    .then(response => response.json())
    .then(data => {
        puzzles = data;
        showStreak();
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
    stopHomeChart();
    $("home").hidden = true;
    $("app").hidden = false;
    startRound();
});

$("btn-home").addEventListener("click", showHome);

function showHome() {
    $("app").hidden = true;
    $("home").hidden = false;
    $("home-cards").textContent = `${puzzles.length} cards`;

    const stats = loadStats();
    $("home-stats").textContent = stats.played > 0
        ? `Rounds played ${stats.played} · Best ${money(stats.bestValue)} · Streak ${stats.streak}`
        : "";

    buildTape();
    startHomeChart();
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

// Background price line that keeps drawing itself across the home screen.
// It's a random walk, purely decorative.
let homeChartFrame = null;

function startHomeChart() {
    const canvas = $("home-chart");
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const step = 6;                 // pixels between points
    let points = [];
    let offset = 0;
    let last = performance.now();

    function resize() {
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.ceil(canvas.clientWidth / step) + 3;
        const mid = canvas.clientHeight * 0.7;
        if (points.length === 0) {
            let v = mid;
            for (let i = 0; i < count; i++) { v = nextValue(v); points.push(v); }
        }
        while (points.length < count) points.push(nextValue(points[points.length - 1]));
    }

    // Each new price drifts slightly up, with noise, and is pulled back if it wanders off-screen
    function nextValue(v) {
        const h = canvas.clientHeight;
        const pull = (h * 0.62 - v) * 0.02;
        return Math.min(h * 0.92, Math.max(h * 0.3, v - 0.35 + pull + (Math.random() - 0.5) * 14));
    }

    function draw(now) {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        const dt = Math.min(64, now - last);
        last = now;
        offset += dt * 0.03;                       // scroll speed
        while (offset >= step) {
            offset -= step;
            points.shift();
            points.push(nextValue(points[points.length - 1]));
        }

        ctx.clearRect(0, 0, w, h);
        ctx.beginPath();
        points.forEach((v, i) => {
            const x = i * step - offset;
            if (i === 0) ctx.moveTo(x, v); else ctx.lineTo(x, v);
        });

        // Glowing gold line
        ctx.strokeStyle = "rgba(232, 176, 74, 0.55)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(232, 176, 74, 0.6)";
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Faint fill underneath
        const lastX = (points.length - 1) * step - offset;
        ctx.lineTo(lastX, h);
        ctx.lineTo(-offset, h);
        ctx.closePath();
        const fill = ctx.createLinearGradient(0, h * 0.3, 0, h);
        fill.addColorStop(0, "rgba(232, 176, 74, 0.10)");
        fill.addColorStop(1, "rgba(232, 176, 74, 0)");
        ctx.fillStyle = fill;
        ctx.fill();

        if (!reduceMotion) homeChartFrame = requestAnimationFrame(draw);
    }

    stopHomeChart();
    resize();
    window.onresize = resize;
    homeChartFrame = requestAnimationFrame(draw);
}

function stopHomeChart() {
    if (homeChartFrame) cancelAnimationFrame(homeChartFrame);
    homeChartFrame = null;
    window.onresize = null;
}


// ---------- 2. Round flow ----------
function startRound() {
    cardIndex = 0;
    results = [];
    portfolio = START_VALUE;
    $("portfolio").textContent = money(portfolio);
    showCard();
}

// Show the current card and the Up/Down buttons
function showCard() {
    const puzzle = puzzles[cardIndex];
    pickedDir = null;
    pickedSize = null;

    $("progress").textContent = `Card ${cardIndex + 1} of ${puzzles.length}`;
    $("when").textContent = puzzle.when;
    $("disguise").textContent = puzzle.disguise;
    $("mood").textContent = puzzle.mood;
    $("other-news").textContent = puzzle.otherNews;
    showRows(puzzle.rows);
    showDots();
    showHeadlineCheck(puzzle.rows);
    $("tip").innerHTML = TIPS[cardIndex % TIPS.length];   // tips are our own fixed text, not card data

    showOnly("card");
    showButtons("dir-buttons");
    restartAnimations($("card"));
    window.scrollTo(0, 0);
}

// Short "think like a trader" nudges, one per card
const TIPS = [
    "Prices already include what investors expected. Ask yourself: <strong>what here is a genuine surprise?</strong>",
    "Last quarter matters less than the next one. <strong>Did the company change its forecast?</strong>",
    "A stock that has already risen a lot needs a <strong>bigger beat</strong> just to hold its price.",
    "Bad news can push a stock up if it was <strong>less bad than feared</strong>.",
    "Watch for one big number that changes the story: a buyback, a forecast, a <strong>new contract</strong>."
];

// One dot per card: green or red for finished cards, gold for the current one
function showDots() {
    const dots = $("card-dots");
    dots.innerHTML = "";
    puzzles.forEach((_, i) => {
        const dot = document.createElement("i");
        if (i < results.length) dot.className = results[i].dirRight ? "done-hit" : "done-miss";
        else if (i === cardIndex) dot.className = "now";
        dots.appendChild(dot);
    });
}

// "Headline check": how the results look on paper, worked out from the beat/miss rows
function showHeadlineCheck(rows) {
    const meter = $("meter");
    meter.innerHTML = "";
    let beats = 0, misses = 0;
    rows.forEach((row, i) => {
        const seg = document.createElement("span");
        if (row.actual > row.expected) { seg.className = "m-beat"; beats++; }
        else if (row.actual < row.expected) { seg.className = "m-miss"; misses++; }
        else seg.className = "m-inline";
        seg.style.animationDelay = (0.3 + i * 0.12) + "s";
        meter.appendChild(seg);
    });

    let verdict;
    if (misses === 0 && beats > 0) verdict = "<strong>Looks great on paper.</strong> Every number beat expectations.";
    else if (beats === 0 && misses > 0) verdict = "<strong>Looks bad on paper.</strong> Every number missed expectations.";
    else verdict = `<strong>Mixed.</strong> ${beats} beat${beats === 1 ? "" : "s"}, ${misses} miss${misses === 1 ? "" : "es"}.`;
    $("headline-verdict").innerHTML = verdict + " But is that what the market cares about?";
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

        const line = document.createElement("tr");
        line.appendChild(cell("td", row.label));
        line.appendChild(cell("td", row.expected, "num"));
        line.appendChild(cell("td", row.actual, "num actual"));

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

// Make one table cell. textContent (not innerHTML) keeps text as plain text.
function cell(tag, text, className) {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    return el;
}


// ---------- 3. The player's three choices: direction, size, bet ----------
$("btn-up").addEventListener("click", () => pickDirection("up"));
$("btn-down").addEventListener("click", () => pickDirection("down"));
$("btn-small").addEventListener("click", () => pickSizeChoice("small"));
$("btn-big").addEventListener("click", () => pickSizeChoice("big"));
$("btn-low").addEventListener("click", () => placeBet("low"));
$("btn-mid").addEventListener("click", () => placeBet("mid"));
$("btn-high").addEventListener("click", () => placeBet("high"));

function pickDirection(dir) {
    pickedDir = dir;
    $("picked").textContent = dir === "up" ? "UP" : "DOWN";
    $("picked").className = dir === "up" ? "is-up" : "is-down";
    showButtons("size-buttons");
}

function pickSizeChoice(size) {
    pickedSize = size;
    $("picked-2").textContent = (pickedDir === "up" ? "UP" : "DOWN") + " · " + size.toUpperCase();
    $("picked-2").className = pickedDir === "up" ? "is-up" : "is-down";

    // Show how many dollars each bet level is right now
    $("amt-low").textContent = `${STAKES.low * 100}% · ${money(portfolio * STAKES.low)}`;
    $("amt-mid").textContent = `${STAKES.mid * 100}% · ${money(portfolio * STAKES.mid)}`;
    $("amt-high").textContent = `${STAKES.high * 100}% · ${money(portfolio * STAKES.high)}`;
    showButtons("stake-buttons");
}

function placeBet(level) {
    const puzzle = puzzles[cardIndex];
    const move = puzzle.answer.movePct;
    const actualSize = Math.abs(move) >= BIG_MOVE ? "big" : "small";
    const dirRight = pickedDir === puzzle.answer.direction;
    const sizeRight = pickedSize === actualSize;

    // Work out the profit or loss on the bet
    const stake = Math.round(portfolio * STAKES[level]);
    let pnl;
    if (dirRight && sizeRight) pnl = stake;                        // both right: win the bet
    else if (dirRight) pnl = Math.round(stake * HALF_WIN);          // right way, wrong size: win half
    else pnl = -stake;                                              // wrong way: lose the bet

    const before = portfolio;
    portfolio += pnl;

    results.push({ dirRight, sizeRight, company: puzzle.company, pnl, stake, level });
    showReveal(puzzle, dirRight, sizeRight, actualSize, stake, pnl, before);
}


// ---------- 4. The reveal ----------
function showReveal(puzzle, dirRight, sizeRight, actualSize, stake, pnl, before) {
    const move = puzzle.answer.movePct;
    const isUp = puzzle.answer.direction === "up";

    $("reveal-when").textContent = "Next-day close · " + puzzle.when;
    $("company").textContent = "It was " + puzzle.company + ".";
    $("move").className = "move-number " + (isUp ? "is-up" : "is-down");
    $("why").textContent = puzzle.why;
    $("tag").textContent = "Lesson: " + puzzle.tag;
    $("source").href = puzzle.source;

    setVerdict("verdict-dir", isUp ? "Up" : "Down", dirRight);
    setVerdict("verdict-size", actualSize === "big" ? "Big" : "Small", sizeRight);

    // The bet result: green if you made money, red if you lost
    $("pnl").className = "pnl-number " + (pnl >= 0 ? "is-up" : "is-down");
    let outcome;
    if (dirRight && sizeRight) outcome = "Both calls right: you win your bet.";
    else if (dirRight) outcome = "Right direction, wrong size: you win half.";
    else outcome = "Wrong direction: you lose your bet.";
    $("pnl-detail").textContent = `Bet ${money(stake)}. ${outcome}`;

    drawChart(puzzle, isUp);

    // Numbers tick: the % move, then your profit/loss, then the portfolio in the top bar
    const decimals = Number.isInteger(Math.abs(move)) ? 0 : 1;
    const moveSign = move >= 0 ? "+" : "−";
    animateNumber($("move"), 0, Math.abs(move), v => moveSign + v.toFixed(decimals) + "%", 250);
    animateNumber($("pnl"), 0, pnl, v => signedMoney(v), 1500);
    animateNumber($("portfolio"), before, portfolio, v => money(v), 1500);

    showOnly("reveal");
    restartAnimations($("reveal"));
    flash(dirRight);
    if (!dirRight) replayAnimation($("verdict-dir").parentElement, "shake");

    const lastCard = cardIndex === puzzles.length - 1;
    $("btn-next").textContent = lastCard ? "See results" : "Next card";
    showButtons("next-step");
    window.scrollTo(0, 0);
}

function setVerdict(id, answerText, right) {
    $(id).textContent = answerText + (right ? " · you got it" : " · you missed");
    $(id).className = "verdict-text " + (right ? "is-up" : "is-down");
}

// Make a number count from one value to another, fast at first then slowing down
function animateNumber(el, from, to, format, delay) {
    if (reduceMotion) { el.textContent = format(to); return; }

    const duration = 1100;
    const start = performance.now() + delay;
    el.textContent = format(from);

    function tick(now) {
        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// Draw the price line. If a card has "prices" (daily closes, the last one
// being the day after the results), they're used. Otherwise the line just
// goes from the previous close to the next-day close.
function drawChart(puzzle, isUp) {
    const W = 340, H = 150, PAD = 10;
    const colour = isUp ? "var(--up)" : "var(--down)";

    let prices = puzzle.prices;
    let note;
    if (Array.isArray(prices) && prices.length >= 2) {
        note = "Daily closing prices. The dashed line marks the results.";
    } else {
        prices = [100, 100, 100 * (1 + puzzle.answer.movePct / 100)];
        note = "Close before the results → close the day after.";
    }

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const x = (i) => PAD + (i / (prices.length - 1)) * (W - PAD * 2);
    const y = (p) => H - PAD - ((p - min) / range) * (H - PAD * 2);

    const linePath = smoothPath(prices.map((p, i) => [x(i), y(p)]));
    const areaPath = linePath + ` L${x(prices.length - 1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z`;
    const markerX = x(prices.length - 2).toFixed(1);   // the last close before the results
    const endX = x(prices.length - 1).toFixed(1);
    const endY = y(prices[prices.length - 1]).toFixed(1);

    // Only numbers go into this string, never text from the cards
    $("chart").innerHTML = `
        <svg viewBox="0 0 ${W} ${H + 14}" role="img" aria-label="Price line ${isUp ? "rising" : "falling"} after the results">
            <line x1="${markerX}" y1="0" x2="${markerX}" y2="${H}" stroke="#3A4350" stroke-width="1" stroke-dasharray="3 4"></line>
            <text x="${markerX}" y="${H + 12}" fill="#8A939E" font-family="IBM Plex Mono, monospace" font-size="10" text-anchor="middle">results</text>
            <path class="area-fade" d="${areaPath}" fill="${colour}" fill-opacity="0.10"></path>
            <path class="line-draw" pathLength="1" d="${linePath}" fill="none" stroke="${colour}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
            <circle class="dot-pop" cx="${endX}" cy="${endY}" r="6" fill="${colour}"></circle>
        </svg>`;
    $("chart-note").textContent = note;
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


// ---------- 5. Next card / results ----------
$("btn-next").addEventListener("click", () => {
    if (cardIndex < puzzles.length - 1) {
        cardIndex++;
        showCard();
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
    $("final-score").className = "headline fade-up d1 " + (ret >= 0 ? "is-up" : "is-down");
    animateNumber($("final-score"), START_VALUE, portfolio, v => money(v), 300);
    $("final-line").textContent = `${retText} on your $10,000. ${scoreLine(ret)}`;

    const grid = $("grid");
    grid.innerHTML = "";
    results.forEach(r => {
        const row = document.createElement("div");
        row.className = "grid-row";
        [r.dirRight, r.sizeRight].forEach(hit => {
            const sq = document.createElement("div");
            sq.className = "sq" + (hit ? " hit" : "");
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

    saveStats();
    showOnly("results");
    restartAnimations($("results"));
    $("btn-share").textContent = "Share result";
    showButtons("end-step");
    window.scrollTo(0, 0);
}

function scoreLine(ret) {
    if (ret >= 50) return "Outstanding. You read the expectations, not the headlines.";
    if (ret >= 15) return "Strong. You're starting to think like the market.";
    if (ret >= 0) return "You stayed in the green. The market fooled you a few times.";
    return "The market got you. That's the point: good news isn't always good for the price.";
}

$("btn-replay").addEventListener("click", startRound);

// Copy a spoiler-free result, Wordle-style
$("btn-share").addEventListener("click", () => {
    const ret = roundReturn();
    const retText = (ret >= 0 ? "+" : "−") + Math.abs(ret).toFixed(1) + "%";
    const squares = results.map(r => (r.dirRight ? "🟩" : "⬜") + (r.sizeRight ? "🟩" : "⬜")).join(" ");
    const text = `Priced In: ${money(portfolio)} (${retText})\n${squares}\n${SITE_URL}`;

    if (navigator.share && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        navigator.share({ text }).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => { $("btn-share").textContent = "Copied!"; });
    }
});


// ---------- 6. Stats saved in this browser ----------
// localStorage can fail (private browsing, blocked storage), so every use is wrapped in try/catch.
function loadStats() {
    const blank = { played: 0, bestValue: 0, streak: 0, lastDay: null };
    try {
        return Object.assign(blank, JSON.parse(localStorage.getItem("pricedInStats")) || {});
    } catch (e) {
        return blank;
    }
}

function saveStats() {
    const stats = loadStats();
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (stats.lastDay !== today) {
        stats.streak = stats.lastDay === yesterday ? stats.streak + 1 : 1;
        stats.lastDay = today;
    }
    stats.played += 1;
    stats.bestValue = Math.max(stats.bestValue, portfolio);

    try { localStorage.setItem("pricedInStats", JSON.stringify(stats)); } catch (e) { /* stats just won't be saved */ }

    $("stats").textContent = `Rounds played: ${stats.played} · Best portfolio: ${money(stats.bestValue)} · Day streak: ${stats.streak}`;
    showStreak();
}

function showStreak() {
    const stats = loadStats();
    $("streak").textContent = stats.streak > 1 ? `Streak ${stats.streak}` : "";
}


// ---------- Helpers ----------
// Show one screen and hide the others
function showOnly(screenId) {
    ["card", "reveal", "results", "error"].forEach(id => { $(id).hidden = id !== screenId; });
}

// Show one group of buttons and hide the others
function showButtons(groupId) {
    ["dir-buttons", "size-buttons", "stake-buttons", "next-step", "end-step"].forEach(id => { $(id).hidden = id !== groupId; });
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
