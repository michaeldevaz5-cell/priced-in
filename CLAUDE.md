# Priced In: brief for Claude Code

Read this before changing anything. It's the project's working rules and current state.

## What this is

A Wordle-style web game about how markets react to company results. Each card is a real earnings day with the company name hidden. The player reads what investors expected, what the company reported and what else it announced, then calls the next-day stock move:

1. **Up or Down**
2. **Big (5%+) or Small**
3. **Bet** 10%, 25% or 50% of a $10,000 portfolio

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
- **DESIGN FREEZE is on.** The layout was redesigned 4 times while the game had 2 cards. Don't add features or restyle anything. Only bug fixes are allowed until Michael has written his next batch of cards and run the friend test. If he asks for a new feature, remind him of the freeze once, then do what he decides.
- **Commits:** end the message with `(code by Claude)`, e.g. `Fix results colours (code by Claude)`. Michael commits and pushes himself in VS Code unless he asks you to.

## Files

| File | What it is |
|---|---|
| `index.html` | Structure. `#home` (start screen) and `#app` (HUD, `main.stage` with `#card` / `#reveal` / `#results` / `#error` panels, sticky `footer.actions` with button steps) |
| `style.css` | All styling. Colour and font tokens in `:root`; phone layout under `@media (max-width: 520px)`; reduced-motion overrides at the end |
| `game.js` | All logic (see below) |
| `puzzles.json` | The cards. **Michael's file.** |
| `README.md` | Public description, credits, card format, how to run locally |

### game.js map

- **Settings at the top:** `BIG_MOVE` 5, `START_VALUE` 10000, `STAKES` {low .10, mid .25, high .50}, `HALF_WIN` 0.5, `SITE_URL`.
- **Load:** fetch `puzzles.json`, then `showHome()`. On failure, show the `#error` panel.
- **Home:** `buildTape()` is the scrolling ticker (made-up market words, not real stocks). `startHomeChart()` is the gold random-walk line on `#bg-chart`. Its `band()` keeps the line below the home text.
- **Round:** `startRound()` → `showCard()` → `pickDirection` → `pickSizeChoice` → `placeBet(level)` → `showReveal()` → next card or `showResults()`.
- **Scoring:**
  - Both calls right: +stake.
  - Right direction, wrong size: +stake × 0.5.
  - Wrong direction: −stake.
  - The stake is a share of the *current* portfolio.
- **Reveal chart:** `drawChart()` draws a smooth monotone-cubic SVG path (`smoothPath()`) at the panel's measured width. It must be called *after* the reveal panel is visible. Without `prices` it falls back to a 3-point line.
- **Squares:** `squareStates(r)` gives one shared colour rule for the results grid and the share text:
  - wrong direction: 🟥🟥
  - right direction, right size: 🟩🟩
  - right direction, wrong size: 🟩⬜
- **Stats** are saved in localStorage: played, bestValue, streak, lastDay.
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
  "prices": [101.2, 100.8, 102.0]
}
```

- `movePct` is negative for a fall. Big means `abs(movePct) >= 5`.
- `prices` holds about 10 daily closes. The **last one is the close the day after the results**, and the one before it is the close on results day.
- Move % = (close after − close before) ÷ close before × 100. Check it against `prices` whenever a card has them.
- **Checking a card:**
  - The JSON is valid.
  - `movePct` matches the prices.
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

## Current state (9 Oct 2026)

- **Cards:** 2 so far, in `puzzles.json`:
  - Meta, Feb 2023
  - Netflix, Apr 2024: its text fields were drafted by Claude and Michael plans to rewrite them
- **Neither card has `prices` yet,** so the reveal chart is the 3-point fallback. Adding real prices is the biggest visual improvement left, and it's content, not code.
- **Michael is writing about 10 more cards:**
  - Nike Jun 2025
  - Palantir Nov 2025
  - Microsoft Jan 2026
  - Tesla Apr 2024
  - Oracle Sep 2025
  - Nvidia Feb 2026
  - Meta Feb 2024
  - Amazon Feb 2024
  - Intel Aug 2024
  - Apple Oct 2024
- **Small moves needed:** almost every card is a big move, so the game needs some small-move cards to stop "always pick Big" from winning.
- **Friend test:** 18 Oct 2026.
- **Possible later change (not decided):** 1 card a day plus a Practice mode, instead of playing every card in one round. Don't build this unless Michael asks.
