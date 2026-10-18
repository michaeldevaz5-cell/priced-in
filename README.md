# Priced In

A game about how markets react to news. Each card is a real company results day, with the name hidden. You read what investors expected, what the company reported and what else it announced, then call it: did the stock go **up or down** the next day, and was the move **big or small**?

The lesson running through it: prices move on **surprise versus expectations**, not on whether the news sounds good.

**Two new cards every weekday.** Your portfolio carries over from day to day and resets to $10,000 every Monday. The Week tab shows each day's result, a graph of your portfolio and your stats. Practice plays every card in one go.

**Play:** https://michaeldevaz5-cell.github.io/priced-in

## Who made what

- **Idea, game design and scenarios:** Michael. Every card in `puzzles.json` is a real event with the real price move and a source link. Claude helped research and check the figures, and at Michael's request drafted some card text: the Netflix card, the Palantir card (apart from its lesson tag), the "also announced" line on the Apple, Intel and Alphabet cards, and the first sentence of Intel's explanation.
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
  "prices": [101.2, 100.8, 102.0, 99.5, 100.1]
}
```

- Numbers go in without units; the unit goes in the label.
- `movePct` is negative for a fall. Big means 5% or more.
- **Order matters.** Daily cards come from `puzzles.json` in order, 2 per weekday, starting Monday 26 October 2026. Always add new cards at the end. Moving or deleting a card shifts every day after it.
- `prices` is optional: daily closing prices, with the **last one being the day after the results**. Without it, the chart shows just the close before and the close after.

## Run it locally

```
python3 -m http.server
```

Then open http://localhost:8000. To see the game as it would look on another day, add `?day=` to the address, e.g. http://localhost:8000/?day=2026-10-27.
