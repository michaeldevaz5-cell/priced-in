# Priced In: brief for Claude Code

Read this before changing anything. It's the project's working rules and current state.

## What this is

A Wordle-style web game about how markets react to company results. Each card is a real earnings day with the company name hidden. The player reads what investors expected, what the company reported and what else it announced, sees the price candles for the days before, then **trades the reaction** (changed from "call the move" on 18 Oct 2026 after the friend test):

1. **Buy, Short or Stay out**, at the close on results day (results come out after the market shuts)
2. **Size:** 10%, 25% or 50% of the portfolio
3. **The next morning the market opens:** exit at the open, or hold to the close
4. P&L is the real price move on the position: stake × (exit price − results-day close) ÷ results-day close, negated for a short

The lesson running through the game: **prices move on surprise versus expectations, not on whether the news sounds good.**

Live at https://michaeldevaz5-cell.github.io/priced-in (GitHub Pages, deploys from `main`).

## Who does what

- **Michael (the owner)** writes every scenario in `puzzles.json` and makes the product decisions. He's learning to code and finance, so explain jargon and keep explanations short and plain.
- **Claude writes the code.** Michael hand-wrote the first version; the README and the header comment in `game.js` say this, and they must stay accurate.
- **Never write or rewrite scenario text** (`disguise`, `mood`, `otherNews`, `why`, `tag`) unless Michael explicitly asks for that one card. You may check his numbers, fix JSON syntax and point out problems.
- **Every figure must be real and sourced.** Don't invent or "round to look nice". If a number can't be verified, say so.
- **Be honest**, including when the answer is "this doesn't need doing".

## Hard rules

- **Stack:** static site only. Plain HTML, CSS and vanilla JS. No frameworks, no build step, no npm packages in the site, no backend, no accounts, no payments, no analytics.
- **Storage:** `localStorage` only, and every read and write is wrapped in try/catch.
- **CONTENT FIRST (until Fri 6 Nov 2026).** The friend test is done, and the game has changed a lot since (trading, daily mode, charts, the night-city background). Daily cards go live Mon 26 Oct, and week 2 (2–6 Nov) needs 15 more cards. Until the first two daily weeks have run, the priority is cards, not code: only bug fixes, no new features or restyles. If Michael asks for a feature, remind him once, then do what he decides. After 6 Nov, review what players say before building anything new. (Decided by Claude at Michael's request, 19 Oct 2026.)
- **Commits:** end the message with `(code by Claude)`, e.g. `Fix results colours (code by Claude)`. Michael commits and pushes himself in VS Code unless he asks you to.

## Files

| File | What it is |
|---|---|
| `index.html` | Structure. `#home` (start screen) and `#app` (HUD, `main.stage` with `#card` / `#reveal` / `#results` / `#today` / `#week` / `#practice` / `#error` panels, sticky `footer.actions` with button steps and the `#tab-bar`) |
| `style.css` | All styling. Colour and font tokens in `:root`; phone layout under `@media (max-width: 520px)`; reduced-motion overrides at the end |
| `game.js` | All logic (see below) |
| `puzzles.json` | The cards. **Michael's file.** |
| `README.md` | Public description, credits, card format, how to run locally |
| `notes/card-research.md` | **The card research:** which companies are next, the verified figures and sources for each, and how to find the data. Check Michael's cards against it. Not loaded by the site. |

### game.js map

- **Settings at the top:** `START_VALUE` 10000, `STAKES` {low .10, mid .25, high .50}, `SITE_URL`, `DAILY_START`, `CARDS_PER_DAY`.
- **Load:** fetch `puzzles.json`, then `showHome()`. On failure, show the `#error` panel.
- **Home:** `buildTape()` is the scrolling ticker (made-up market words, not real stocks). `startHomeChart()` draws the background scene on `#bg-chart` behind every screen: a night sky (CSS gradient on `body`), a pixel-art city skyline (seeded, so it's the same city every time) with flickering windows and blinking antenna lights, and a faint decorative candlestick chart drifting across the sky (a random walk, not real prices). `body::before` adds faint CRT scanlines above the canvas but below the panels. The home title uses the Silkscreen pixel font (`--pixel`) with a green/red offset. Text is Space Grotesk (`--font`); small data numbers (top-bar values, P&L, the expected/actual table, chips, chart scales, countdown, tower amounts) are JetBrains Mono (`--num`), like a trading terminal; big display numbers (the reveal move, final score, week total) and stats that mix words and numbers stay Space Grotesk. On the card and reveal, the headline, kicker and labels are terminal-style (`--num`, uppercase labels, a "> " prompt before the kicker and a blinking gold "_" cursor after the headline); the mood and news text stay Space Grotesk for reading (changed from Rubik on 21 Oct 2026 at Michael's request, during content-first, after one reminder).
- **Daily mode:** 3 cards every weekday (`CARDS_PER_DAY`, changed from 2 on 19 Oct 2026 at Michael's request), taken from `puzzles.json` **in file order** starting on `DAILY_START` (Mon 26 Oct 2026). No cards at weekends. New cards must be added at the end of the file; moving or deleting one shifts every later day.
  - Dates are local `"YYYY-MM-DD"` keys. `?day=2026-10-27` in the URL pretends it's another day, for testing.
  - `todaysCards(key)`, `tradingDayIndex(key)`, `weekKey(key)` (Monday of that week; weekends belong to the week just ended).
  - **Weekly portfolio:** `loadWeek()` / `storeWeek()` keep `{ week, days: { key: { start, results } } }` in localStorage `pricedInWeek`. Each result is saved as soon as the bet is placed, so leaving mid-day loses nothing. A new week files the old one in `pricedInHistory` and resets to $10,000.
- **Menu:** `showHub(tab)` shows the Today / Week / Practice tabs (`#tab-bar` in the bottom bar). `showToday` (live `startCountdown()` tiles to the next cards, cleared in `showOnly()` when leaving; `showTeasers()` for today's cards; `showWeekStrip()` Mon–Fri mini tiles, locked ahead), `showWeek` (day tiles via `showWeekTiles()`, `drawWeekChart`, stats, `compareWithHolding`, past weeks), `showPractice`.
- **Round:** `startDaily()` or `startPractice()` → `startRound()` → `showCard()` (draws the candles before the results, as % changes, never dollar prices) → `pickSide(long/short)` or Stay out → `placeTrade(level)` → `showOpen()` (the `#open` screen) → `finishTrade(trade, "open"|"close")` → `showReveal()` → next card, or the Today tab (daily), or `showResults()` (practice). Both use `deck`, the cards in this round.
  - `reaction(puzzle)` gives the results-day close (`before`) and the next day's open/high/low/close from `candles`.
  - In daily mode the open trade is saved as `day.pending` **before** the open is shown, so reloading can't change it; `startDaily()` resumes at the open screen.
  - A result stores `side`, `share`, `stake`, `exit`, `pnl`, `dirRight` (right way round), `timingRight` (picked the better exit), `openRet`, `closeRet`.
- **Scoring:** real P&L on the position (see the top of this file). The stake is a share of the *current* portfolio. Stay out = $0.
- **Charts:** `drawCandles(boxId, candles, opts)` draws daily candles trading-platform style (tightly packed candles, faint gridlines at `niceStep()` prices, volume bars along the bottom) as SVG at the box's measured width, so call it *after* the panel is visible. Used three times: the card (days before the results; `percentBase` makes the scale and hover show % change since the first day, never dollar prices, so price levels can't give the company away), the open screen (`openOnlyLast`: the last day is just a gold "open" dash), and the reveal (`axis` price scale with a last-price tag, `hover` via `addChartHover()`). The card and reveal charts go through `showChart()` / `renderChart()`, which add zoom: the `.chart-range` buttons (2W / 1M / 3M, `data-days`) and a trackpad pinch (wheel + ctrlKey) show the last N days; marker/entry/exit indices are shifted to match, and the % scale is measured from the first day shown. `entry` draws a gold dashed line where the trade starts (results-day close: "You trade here" on the card, "Your entry" after); `exit` draws a gold dot where it ended. `smoothPath()` is still used by the week graph.
- **The tower** (built 19 Oct 2026 at Michael's request, during content-first, after one reminder; changed on 20 Oct so the balance sets the level): your portfolio balance decides your level. `LEVELS` at the top: Street below $10,000, Lobby $10,000 (where every week and practice round starts), Trading floor $11,000, Corner office $12,500, Boardroom $15,000, Penthouse $20,000, Rooftop $25,000. Nothing extra is saved: `levelFor(balance)` gives the level, `towerPos(balance)` the level plus how far through it (the street runs from $5,000, the rooftop to $30,000). `showTower(balance)` draws the elevator display (`#floor`, `data-level` 0–6 sets its style), the scale down the left (`#tower` / `#tower-levels`, laptops ≥1180px only, with a gold marker at your balance) and the `#next-level` line ("Next: … at $… · $… to go", below 1180px instead of the scale). After a reveal, `climb(fromBalance, toBalance)` waits 2.6s (until the P&L has counted), then moves the display, the marker and the city; on a new level it bounces the display and shows the `#floor-toast` banner. `finishClimb()` runs it at once if the player moves on first. `setSceneTower(balance)` moves the background, and every level looks clearly different (reworked 20 Oct at Michael's request to be more dramatic): the city is three rows of buildings (`layers`, each drawn once to its own canvas) that fall away at different speeds (`depth`) and fade into haze; you climb through clouds (`drawWisps` overhead at street level, then the cloud bank: `CLOUD_BANK` / `bankTop(alt)` place it off-screen, then through the middle of the screen at the Corner office, then below you as a sea of clouds); each level has its own sky (`SKIES`, including cloud colours) and one big feature: full moon (Street), pink/cyan neon glow (Lobby), the sky chart turning into a bold rising rally (Trading floor), crescent moon and evening star (Corner office), a huge striped retro sun on the clouds (Boardroom), golden rays (Penthouse), the sun blazing above a sea of clouds with three towers poking through (`drawSpires`, Penthouse and Rooftop); and each level adds a touch kept on the levels above: searchlights, blimp, helicopter, gold sparkles, balcony railing, party lights and fireworks. `scene.now` (position, 0–7), `scene.lv` and `scene.fx[i]` ease so changes fade in smoothly. Runs at 60fps on a laptop. The level also appears in the Week stats and the daily share text. **Not in practice** (21 Oct 2026, at Michael's request: the tower is calibrated for weekly gains): `startPractice()` adds `body.in-practice`, which hides the display, scale, next-level line and banner; the city stays at the weekly level; no `climb()`; no level in the practice results line or share text. `showHub()` and `startDaily()` remove the class.
- **Squares:** `squareStates(r)` gives one shared colour rule for the results grid and the share text. First square: right way round (🟩) or not (🟥). Second: better exit (🟩) or not (⬜). Stayed out: ⬜⬜.
- **Stats** are saved in localStorage `pricedInStats`: played, bestValue, streak, lastDay. The streak counts daily days finished on consecutive weekdays; practice doesn't touch it.
- **Every `$("id")` in game.js must exist in index.html.** A missing id throws an error, which shows the error screen. This has happened twice, so grep for it after any HTML change.

## Card format (puzzles.json)

```json
{
  "id": 3,
  "disguise": "Vague description that hides the company",
  "when": "Month Year",
  "mood": "1–2 sentences on how things looked before the results",
  "rows": [
    { "label": "Revenue ($bn)", "expected": 0, "actual": 0 },
    { "label": "EPS ($)", "expected": 0, "actual": 0 }
  ],
  "otherNews": "The forecast or announcement that matters",
  "answer": { "direction": "up", "movePct": 0 },
  "company": "Real name",
  "why": "Two sentences explaining the move",
  "tag": "Short lesson label",
  "source": "https://...",
  "candles": [
    [100.10, 101.50, 99.80, 101.20, 52300000],
    [101.30, 101.90, 100.40, 100.80, 48100000]
  ]
}
```

- `movePct` is negative for a fall. Big means `abs(movePct) >= 5`.
- `candles` holds **60 trading days** as `[open, high, low, close, volume]`. The **last one is the day after the results**, and the one before it is results day. The game needs them for the open; a card without candles skips the open step and has no chart.
- Get them from Yahoo's daily history (Claude can fetch them). Check each candle: low ≤ open, close ≤ high. If the stock has split since (Netflix 10-for-1, Nov 2025), multiply prices back to the real prices of the time and divide volume by the same factor.
- Move % = (close after − close before) ÷ close before × 100, using the last two closes. Check it against `movePct`.
- **Checking a card:**
  - The JSON is valid.
  - `movePct` matches the candles.
  - `direction` matches the sign of `movePct`.
  - Expected/actual figures match the cited source.
  - The disguise doesn't give the company away.
  - The card uses only facts that were public before the move.

## Run and test

```
python3 -m http.server
```

Open http://localhost:8000. Opening index.html from Finder fails, because fetch doesn't work from file://. Hard-refresh with Cmd+Shift+R after changes.

Before saying a change works:

1. Play a full round (every card through to Results) on a laptop width (~1440px) and a phone width (390px).
2. Check the console for errors.

## Current state (19 Oct 2026)

- **Cards:** 16 so far, in `puzzles.json`:
  - Meta, Feb 2023: has `candles`
  - Netflix, Apr 2024: has `candles`; its text fields were drafted by Claude; Michael has decided to keep them (18 Oct 2026)
  - Nike, Jun 2025: has `candles`
  - Palantir, Nov 2025: has `candles`; text fields drafted by Claude at Michael's request
  - Apple, Oct 2024: has `candles`; the first small move (−1.3%); `otherNews` drafted by Claude at Michael's request
  - Intel, Aug 2024: has `candles`; the first control card (bad news → down); `otherNews` and the first two sentences of `why` drafted by Claude at Michael's request (the second uses only facts from the CNBC source)
  - Alphabet, Oct 2024: has `candles`; small move (+2.8%) and a control (good news → up); `otherNews` drafted by Claude at Michael's request
  - Nvidia, Feb 2026: has `candles`; opened −0.7%, closed −5.5% (holding mattered); `otherNews` drafted by Claude, and unsourced claims in Michael's `mood`/`why` (production delays, shrinking margins, whisper numbers) swapped for sourced reasons at his request. Margins actually rose (75.0%, SEC filing).
  - Meta, Feb 2024: has `candles`; second Meta card (disguised differently); opened +16.4%, closed +20.3%; `otherNews` drafted by Claude at Michael's request
  - Oracle, Sep 2025: has `candles`; missed on revenue and EPS but rose 36% on its $455bn contract backlog; opened +32.2%; `otherNews` drafted by Claude, disguise changed from "database" to "enterprise software" at Michael's request
  - Microsoft, Jan 2026: has `candles`; beat but fell 10% (worst day since 2020) on record capex and slowing cloud growth; plays Thu 29 Oct of launch week (it was the first card of week 2 at 2 cards a day); `otherNews` drafted by Claude, disguise tweaked to differ from Alphabet's, at Michael's request
  - Amazon, Feb 2024: has `candles`; control (good news → up); opened +6.2%, closed +7.9%; the revenue forecast straddled consensus, so it isn't called a beat; `otherNews` drafted by Claude, disguise changed from "e-commerce" and "accelerating" ad growth changed to "strong" at Michael's request
  - Tesla, Oct 2024: has `candles`; revenue missed, EPS and margins beat, rose 21.9% (best day in a decade); opened +14.5%, so holding paid off; `otherNews` drafted by Claude, disguise changed from "clean energy and autonomous mobility" at Michael's request
  - Netflix, Jan 2025: has `candles` (×10 for the Nov 2025 split); beat on everything, opened +14.8% but closed +9.7%, so exiting at the open paid off; `otherNews` drafted by Claude; unsupported "conservative guidance" dropped from `why` at Michael's request (the full-year forecast was raised)
  - Meta, Oct 2024: has `candles`; third Meta card; beat but fell 4.1% on an AI-spending warning; opened −1.1%, so holding a short paid off; `otherNews` drafted by Claude, disguise changed from "metaverse pioneer" at Michael's request
  - United Airlines, Oct 2024: has `candles`; first card of week 2 (Mon 2 Nov); opened +2.1%, closed +12.4%, so holding paid; `otherNews` drafted by Claude at Michael's request; mood's fuel-cost fear checked against Brent crude (+13% in early Oct 2024)
- **Every card has 60 `candles` with volume** (fetched from Yahoo on 18 Oct 2026; the last 10 closes match the earlier `prices`). Netflix split 10-for-1 in Nov 2025, so Yahoo now shows its 2024 prices divided by 10; the card uses the real prices of the time (×10).
- **Launch week (26–30 Oct) is full: 15 cards.** Next: 15 for week 2 (2–6 Nov). Michael planned 4 cards on 19 Oct (Tesla, Netflix, Meta done; 1 more for week 2). Tesla Apr 2024 was dropped: its open and close were almost the same. Pick days where the open and close differ a lot.
- **Open vs close matters now:** the best cards are ones where the open and close differ a lot (Alphabet opened +6.5% and closed +2.8%), so "always hold" or "always exit at the open" can't win. The Week tab compares the player with "always hold to the close".
- **Friend test:** done 18 Oct 2026. Friends wanted to trade the reaction rather than call it, so the game switched to trading the same day. A minute-by-minute replay was considered but needs licensed intraday data; not planned.
- **Daily mode built 17 Oct 2026:** 3 cards a weekday from Mon 26 Oct (15 a week), weekly portfolio, Week tab, Practice. With 15 cards, launch week (Mon 26 – Fri 30 Oct) is full; each week after needs 15, or Today says "New cards coming soon". The plan from 6 Nov is a weekly job that drafts cards as a pull request for Michael to edit and approve. Before 26 Oct, the game opens on Practice.
