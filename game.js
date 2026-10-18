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
const CARDS_PER_DAY = 2;           // daily cards come from puzzles.json in order, 2 per weekday

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
    document.body.classList.add("in-game");   // dims the background line
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
        : "2 new cards every weekday";

    const stats = loadStats();
    $("home-stats").textContent = stats.played > 0
        ? `Rounds played ${stats.played} · Best ${money(stats.bestValue)} · Streak ${stats.streak}`
        : "";

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

// Background price line that keeps drawing itself across the home screen.
// It's a random walk, purely decorative.
let homeChartFrame = null;

function startHomeChart() {
    const canvas = $("bg-chart");
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
        if (points.length === 0) {
            const [lo, hi] = band();
            let v = (lo + hi) / 2;
            for (let i = 0; i < count; i++) { v = nextValue(v); points.push(v); }
        }
        while (points.length < count) points.push(nextValue(points[points.length - 1]));
    }

    // The strip of screen the line is allowed to use. On the home screen it stays
    // below the title and button so it never runs through the text.
    function band() {
        const h = canvas.clientHeight;
        if ($("home").hidden) return [h * 0.3, h * 0.92];
        const contentBottom = document.querySelector(".home-inner").getBoundingClientRect().bottom - 48;
        const lo = Math.min(contentBottom + 32, h - 70);
        return [lo, h - 16];
    }

    // Each new price drifts with noise, pulled towards the middle of the band.
    // If the band moves, the line glides into it rather than jumping.
    function nextValue(v) {
        const [lo, hi] = band();
        const noise = (Math.random() - 0.5) * Math.min(14, (hi - lo) / 5);
        const pull = ((lo + hi) / 2 - v) * 0.03;
        const target = Math.min(hi, Math.max(lo, v - 0.35 + pull + noise));
        return v + Math.max(-4, Math.min(4, target - v));
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

        // Gold line
        ctx.strokeStyle = "rgba(245, 196, 81, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Faint fill underneath
        const lastX = (points.length - 1) * step - offset;
        ctx.lineTo(lastX, h);
        ctx.lineTo(-offset, h);
        ctx.closePath();
        const fill = ctx.createLinearGradient(0, h * 0.3, 0, h);
        fill.addColorStop(0, "rgba(245, 196, 81, 0.06)");
        fill.addColorStop(1, "rgba(245, 196, 81, 0)");
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
    $("portfolio").textContent = money(portfolio);
    showReturn();
    showSquares();
    $("progress").textContent = deck.length ? "Today" : isWeekend(key) ? "Market closed" : "No new cards";

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
    $("today-grid").innerHTML = "";
    if (done) buildGrid($("today-grid"), day.results);

    let title, text, button;
    if (key < DAILY_START) {
        title = "Daily cards start soon";
        text = `The first daily cards go live on ${longDay(DAILY_START)}. Until then, play every card in Practice.`;
        button = "Go to Practice";
    } else if (isWeekend(key)) {
        title = "The market's closed";
        text = "New cards on Monday. See how your week went in the Week tab.";
        button = "See your week";
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
        $("today-note").textContent = nextCardsText(key);
    }
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

// "New cards tomorrow" or "New cards on Monday"
function nextCardsText(key) {
    let next = addDays(key, 1);
    while (isWeekend(next)) next = addDays(next, 1);
    return next === addDays(key, 1) ? "New cards tomorrow." : "New cards on Monday.";
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
    const balance = weekBalance(week);
    const pnl = balance - START_VALUE;
    $("week-kicker").textContent = "Week of " + shortDay(week.week);
    $("week-pnl").textContent = signedMoney(pnl);
    $("week-pnl").className = "headline " + (pnl > 0 ? "is-up" : pnl < 0 ? "is-down" : "");
    $("week-balance").textContent = `Portfolio ${money(balance)} · ${weekReturnText()}`;

    // Monday to Friday tiles
    const tiles = $("week-days");
    tiles.innerHTML = "";
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    names.forEach((name, i) => {
        const dayKey = addDays(week.week, i);
        const day = week.days[dayKey];
        const played = day && day.results.length > 0;
        const dayPnl = played ? dayEnd(day) - day.start : 0;

        const tile = document.createElement("div");
        tile.className = "day-tile" +
            (played ? (dayPnl >= 0 ? " up" : " down") : "") +
            (dayKey === key ? " today" : "") +
            (dayKey > key ? " future" : "");
        tile.appendChild(cell("span", `${name} ${parseKey(dayKey).getDate()}`, "day-name"));
        tile.appendChild(cell("span", played ? compactMoney(dayPnl) : "—", "day-pnl"));
        tile.appendChild(cell("span", played ? (day.results.length === 1 ? "1 card" : `${day.results.length} cards`) : "", "day-sub"));
        tiles.appendChild(tile);
    });

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
            ${labels.map((label, i) => `<text x="${x(i).toFixed(1)}" y="${H + 14}" fill="var(--muted)" font-family="Rubik, sans-serif" font-size="11" text-anchor="middle">${label}</text>`).join("")}
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
    $("portfolio").textContent = money(portfolio);
    showReturn();
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
    $("portfolio").textContent = money(portfolio);
    showReturn();
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
            parts += `<text x="${W - 4}" y="${f(y(fromUnit(u)) + 4)}" fill="var(--muted)" font-family="Rubik, sans-serif" font-size="10" text-anchor="end">${label(Math.round(u * 100) / 100)}</text>`;
        }
    }
    parts += `<line x1="0" y1="${PRICE_BOTTOM}" x2="${plotW}" y2="${PRICE_BOTTOM}" stroke="var(--border)" stroke-width="1"></line>`;

    if (opts.marker != null) {
        const mx = f(x(opts.marker) + slot / 2);
        parts += `<line x1="${mx}" y1="${TOP - 4}" x2="${mx}" y2="${H}" stroke="var(--muted)" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"></line>
            <text x="${mx}" y="10" fill="var(--muted)" font-family="Rubik, sans-serif" font-size="10" text-anchor="end">results&#8202;</text>`;
    }

    candles.forEach((k, i) => {
        const [o, h, l, c] = k;
        if (lastOnlyOpen(i)) {
            // The opening price as a gold dash, labelled just above (or below, if it's at the top)
            const labelY = y(o) < TOP + 14 ? y(o) + 16 : y(o) - 8;
            parts += `<g class="dot-pop"><line x1="${f(x(i) - Math.max(body, 6))}" y1="${f(y(o))}" x2="${f(x(i) + Math.max(body, 6))}" y2="${f(y(o))}" stroke="var(--gold)" stroke-width="3" stroke-linecap="round"></line>
                <text x="${f(x(i))}" y="${f(labelY)}" fill="var(--gold)" font-family="Rubik, sans-serif" font-size="11" font-weight="600" text-anchor="end">open</text></g>`;
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
            <text x="${f(tagX + tagW / 2)}" y="${f(tagY + 12.5)}" fill="var(--gold)" font-family="Rubik, sans-serif" font-size="11" font-weight="600" text-anchor="middle">${opts.entry.label}</text>`;
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
            <text x="${W - 4}" y="${f(y(last[3]) + 4)}" fill="var(--bg)" font-family="Rubik, sans-serif" font-size="10" font-weight="700" text-anchor="end">${base ? signedPct(pct(base, last[3])) : last[3].toFixed(2)}</text>`;
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
    $("final-line").textContent = `${retText} on your $10,000. ${scoreLine(ret, results.filter(r => r.dirRight === false).length)}`;

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
    const text = `Priced In practice: ${money(portfolio)} (${weekReturnText()})\n${shareSquares(results)}\n${SITE_URL}`;
    share(text, $("btn-share"));
});

// e.g. "Priced In #3 · 28 Oct / 🟩🟩 🟩⬜ / Today +$1,250 · Week +12.5%"
function shareDay() {
    const key = todayKey();
    const day = loadWeek().days[key];
    if (!day) return;
    const number = tradingDayIndex(key) + 1;
    const text = `Priced In #${number} · ${shortDay(key)}\n${shareSquares(day.results)}\n` +
        `Today ${signedMoney(dayEnd(day) - day.start)} · Week ${weekReturnText()}\n${SITE_URL}`;
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
