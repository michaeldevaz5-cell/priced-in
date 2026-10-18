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
- **DESIGN FREEZE is on.** The layout was redesigned 4 times while the game had 2 cards, then restyled once more on 16 Oct 2026 (one font, Rubik; simpler flat colours; chunky buttons with a bottom edge). On 17 Oct Michael chose to build daily mode (see below) before the friend test. Don't add features or restyle anything else. Only bug fixes are allowed until Michael has run the friend test. If he asks for a new feature, remind him of the freeze once, then do what he decides.
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
- **Home:** `buildTape()` is the scrolling ticker (made-up market words, not real stocks). `startHomeChart()` is the gold random-walk line on `#bg-chart`. Its `band()` keeps the line below the home text.
- **Daily mode:** 2 cards every weekday (`CARDS_PER_DAY`), taken from `puzzles.json` **in file order** starting on `DAILY_START` (Mon 26 Oct 2026). No cards at weekends. New cards must be added at the end of the file; moving or deleting one shifts every later day.
  - Dates are local `"YYYY-MM-DD"` keys. `?day=2026-10-27` in the URL pretends it's another day, for testing.
  - `todaysCards(key)`, `tradingDayIndex(key)`, `weekKey(key)` (Monday of that week; weekends belong to the week just ended).
  - **Weekly portfolio:** `loadWeek()` / `storeWeek()` keep `{ week, days: { key: { start, results } } }` in localStorage `pricedInWeek`. Each result is saved as soon as the bet is placed, so leaving mid-day loses nothing. A new week files the old one in `pricedInHistory` and resets to $10,000.
- **Menu:** `showHub(tab)` shows the Today / Week / Practice tabs (`#tab-bar` in the bottom bar). `showToday`, `showWeek` (day tiles, `drawWeekChart`, stats, `compareWithAlwaysBig`, past weeks), `showPractice`.
- **Round:** `startDaily()` or `startPractice()` → `startRound()` → `showCard()` (draws the candles before the results, without prices) → `pickSide(long/short)` or Stay out → `placeTrade(level)` → `showOpen()` (the `#open` screen) → `finishTrade(trade, "open"|"close")` → `showReveal()` → next card, or the Today tab (daily), or `showResults()` (practice). Both use `deck`, the cards in this round.
  - `reaction(puzzle)` gives the results-day close (`before`) and the next day's open/high/low/close from `candles`.
  - In daily mode the open trade is saved as `day.pending` **before** the open is shown, so reloading can't change it; `startDaily()` resumes at the open screen.
  - A result stores `side`, `share`, `stake`, `exit`, `pnl`, `dirRight` (right way round), `timingRight` (picked the better exit), `openRet`, `closeRet`.
- **Scoring:** real P&L on the position (see the top of this file). The stake is a share of the *current* portfolio. Stay out = $0.
- **Charts:** `drawCandles(boxId, candles, opts)` draws daily candles trading-platform style (tightly packed candles, faint gridlines at `niceStep()` prices, volume bars along the bottom) as SVG at the box's measured width, so call it *after* the panel is visible. Used three times: the card (days before the results, no price scale or hover, so price levels can't give the company away), the open screen (`openOnlyLast`: the last day is just a gold "open" dash), and the reveal (`axis` price scale with a last-price tag, `hover` via `addChartHover()`). `smoothPath()` is still used by the week graph.
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

## Current state (17 Oct 2026)

- **Cards:** 7 so far, in `puzzles.json`:
  - Meta, Feb 2023: has `candles`
  - Netflix, Apr 2024: has `candles`; its text fields were drafted by Claude and Michael plans to rewrite them
  - Nike, Jun 2025: has `candles`
  - Palantir, Nov 2025: has `candles`; text fields drafted by Claude at Michael's request
  - Apple, Oct 2024: has `candles`; the first small move (−1.3%); `otherNews` drafted by Claude at Michael's request
  - Intel, Aug 2024: has `candles`; the first control card (bad news → down); `otherNews` and the first sentence of `why` drafted by Claude at Michael's request
  - Alphabet, Oct 2024: has `candles`; small move (+2.8%) and a control (good news → up); `otherNews` drafted by Claude at Michael's request
- **Every card has 60 `candles` with volume** (fetched from Yahoo on 18 Oct 2026; the last 10 closes match the earlier `prices`). Netflix split 10-for-1 in Nov 2025, so Yahoo now shows its 2024 prices divided by 10; the card uses the real prices of the time (×10).
- **Michael is writing about 10 more cards.** The full list, with figures and sources, is in `notes/card-research.md`.
- **Open vs close matters now:** the best cards are ones where the open and close differ a lot (Alphabet opened +6.5% and closed +2.8%), so "always hold" or "always exit at the open" can't win. The Week tab compares the player with "always hold to the close".
- **Friend test:** done 18 Oct 2026. Friends wanted to trade the reaction rather than call it, so the game switched to trading the same day. A minute-by-minute replay was considered but needs licensed intraday data; not planned.
- **Daily mode built 17 Oct 2026:** 2 cards a weekday from Mon 26 Oct, weekly portfolio, Week tab, Practice. With 7 cards, daily cards run Mon 26 – Thu 29 Oct; after that Today says "New cards coming soon" until more are added. Tomorrow's friend test uses Practice.
