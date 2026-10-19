# Priced In

A game about how markets react to news. Each card is a real company results day, with the name hidden. You read what investors expected, what the company reported and what else it announced, then trade it: **buy**, **short** or stay out before the results, and the next morning decide whether to **exit at the open** or **hold to the close**. Your profit or loss is the real price move.

The lesson running through it: prices move on **surprise versus expectations**, not on whether the news sounds good.

**Two new cards every weekday.** Your portfolio carries over from day to day and resets to $10,000 every Monday. The Week tab shows each day's result, a graph of your portfolio and your stats. Practice plays every card in one go.

**Play:** https://michaeldevaz5-cell.github.io/priced-in

## Who made what

- **Idea, game design and scenarios:** Michael. Every card in `puzzles.json` is a real event with the real price move and a source link. Claude helped research and check the figures, and at Michael's request drafted some card text: the Netflix card, the Palantir card (apart from its lesson tag), the "also announced" line on the Apple, Intel and Alphabet cards, the first two sentences of Intel's explanation, the "also announced" line on the second Meta, Oracle, Microsoft and Amazon cards, and the "also announced" line plus parts of the mood and explanation on the Nvidia card (replacing claims the sources didn't support).
- **Code:** Michael hand-wrote the first version (page skeleton, loading the cards, results table, Up/Down buttons). The current code, including the styling and animations, was written by Claude (Anthropic's AI) at Michael's request. Commits say which is which.

## Adding a card

Add an object to `puzzles.json`:

```json
{
  "id": 3,
  "disguise": "A vague description that hides the company",
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

- Numbers go in without units; the unit goes in the label.
- `movePct` is negative for a fall. Big means 5% or more.
- **Order matters.** Daily cards come from `puzzles.json` in order, 2 per weekday, starting Monday 26 October 2026. Always add new cards at the end. Moving or deleting a card shifts every day after it.
- `candles` are 60 trading days as `[open, high, low, close, volume]`, with the **last one being the day after the results**. The game uses its open for the "exit at the open" choice.

## Run it locally

```
python3 -m http.server
```

Then open http://localhost:8000. To see the game as it would look on another day, add `?day=` to the address, e.g. http://localhost:8000/?day=2026-10-27.
