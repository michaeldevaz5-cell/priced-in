# Priced In

A game about how markets react to news. Each card is a real company results day, with the name hidden. You read what investors expected, what the company reported and what else it announced, then call it: did the stock go **up or down** the next day, and was the move **big or small**?

The lesson running through it: prices move on **surprise versus expectations**, not on whether the news sounds good.

**Play:** https://michaeldevaz5-cell.github.io/priced-in

## Who made what

- **Idea, game design and scenarios:** Michael. Every card in `puzzles.json` is a real event with the real price move and a source link.
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
- `prices` is optional: daily closing prices, with the **last one being the day after the results**. Without it, the chart shows just the close before and the close after.

## Run it locally

```
python3 -m http.server
```

Then open http://localhost:8000.
