# Card research: companies, figures and sources

Raw facts for Michael to write his cards from. **Michael writes the card text himself**; this file only holds the verified numbers and where they came from. Items marked ⚠ still need checking before they go in the game.

*Researched by Claude, 26 Sep and 6 Oct 2026.*

## Status

| Card | Event | Status |
|---|---|---|
| 1 | Meta, Feb 2023 | ✅ In `puzzles.json`, with `candles` |
| 2 | Netflix, Apr 2024 | ✅ In `puzzles.json`, with `candles` (text to be rewritten by Michael) |
| 3 | Nike, Jun 2025 | ✅ In `puzzles.json`, with `candles` (move +15.2%: $62.54 → $72.04) |
| 4 | Palantir, Nov 2025 | ✅ In `puzzles.json`, with `candles` (move −7.9%: $207.18 → $190.74) |
| 5 | Microsoft, Jan 2026 | To write |
| 6 | Tesla, Apr 2024 | To write |
| 7 | Oracle, Sep 2025 | To write |
| 8 | Nvidia, Feb 2026 | To write |
| 9 | Meta, Feb 2024 (control) | To write |
| 10 | Amazon, Feb 2024 (control) | To write |
| 11 | Intel, Aug 2024 (control) | ✅ In `puzzles.json`, with `candles` (move −26.1%: $29.05 → $21.48) |
| 12 | Apple, Oct 2024 (small move) | ✅ In `puzzles.json`, with `candles` (move −1.3%: $225.91 → $222.91) |
| 13 | Alphabet, Oct 2024 (small move, control) | ✅ In `puzzles.json`, with `candles` (move +2.8%: $169.68 → $174.46) |

Not used for now:

- **Nvidia Aug 2024:** too similar to Nvidia Feb 2026. Use one or the other, not both.
- **US jobs report Jan 2025:** a macro event that doesn't fit the company card format.

**Balance problem:** almost every card is a **big** move. The game needs more small-move cards (stock moved under 3%), or "always pick Big" wins.

## Where to find each piece of info

1. **Expected vs actual (revenue, EPS):** search "[company] earnings [quarter] CNBC". CNBC's results-day article lists both, with estimates from LSEG. Use one consensus source per card.
2. **Also announced** (guidance, buybacks, job cuts): the same article, or the company's own press release (search "[company] investor relations [quarter] results").
3. **Mood before:** the price chart for the 3–6 months before, plus one line on what investors were worried about.
4. **Next-day move and `candles`:** go to `finance.yahoo.com/quote/TICKER/history` (or ask Claude to fetch them).
   - Most companies report after the market closes, so the move happens the next trading day.
   - Move % = (close the day after − close on results day) ÷ close on results day × 100.
   - Copy about 10 trading days into `candles` as `[open, high, low, close]`. The last one must be the day after the results.
   - Good cards for trading have a big gap between the next day's open and close (e.g. Alphabet: opened +6.5%, closed +2.8%).
5. **Source:** the link to the article you used.

## How to read the numbers

- **Consensus / "expected":** the average analyst forecast. LSEG, FactSet and Zacks publish slightly different averages, so it can vary by a cent or two between sources.
- **EPS:** earnings per share, which is profit divided by the number of shares.
- **Guidance:** the company's own forecast for next quarter. It often matters more than the quarter just reported.
- **Move:** the close-to-close change on the first full trading day after the results.

---

## Beat, but fell

**Netflix, reported 18 Apr 2024 (Q1 2024)** (card 2)
- EPS $5.28 vs $4.52 expected; revenue $9.37bn vs $9.28bn; 9.33m new subscribers, nearly double estimates.
- But Q2 revenue guidance was $9.49bn vs $9.54bn expected, and it said it would **stop reporting subscriber numbers** from 2025.
- Stock fell 9.1% on 19 Apr to $555.04, its biggest drop in two years.
- Sources: [CNBC](https://www.cnbc.com/2024/04/18/netflix-nflx-earnings-q1-2024.html), [BizNews/Bloomberg](https://www.biznews.com/global-investing/2024/04/22/netflix-shares-plunge)

**Palantir, reported 3 Nov 2025 (Q3 2025)**
- Revenue $1.18bn vs $1.09bn expected (+63% year on year); adjusted EPS $0.21 vs $0.17.
- Q4 revenue guidance $1.3bn+ vs $1.2bn expected; full-year guidance raised to $4.4bn from $4.15bn.
- Stock fell 7.95% on 4 Nov.
- Why: valuation. Its forward P/E (price ÷ next year's expected EPS) was about 230, vs about 35 for the "Magnificent Seven". Jefferies said the valuation was "susceptible to any downtick in the AI hype cycle."
- Source: [Yahoo Finance](https://finance.yahoo.com/news/palantir-stock-falls-nearly-8-on-valuation-fears-after-results-top-wall-street-estimates-211457379.html)

**Microsoft, reported 28 Jan 2026 (fiscal Q2 2026)**
- Revenue $81.3bn (+17%) vs ~$80.3bn expected; EPS $4.14 vs ~$3.91 (Yahoo) or $3.97 (TrendSpider), because consensus sources differ.
- Azure (cloud) growth 39%, in line; quarterly capex (spending on data centres and chips) ~$37.5bn, above estimates.
- Stock fell 9.99% on 29 Jan, its worst day since 2020 ($357bn of market value).
- Sources: [Yahoo Finance](https://finance.yahoo.com/news/microsoft-stock-plunges-10-earnings-215433298.html), [TrendSpider](https://trendspider.com/blog/microsoft-stock-plunges-10-after-q2-earnings-beat/)

**Nvidia, reported 25 Feb 2026 (fiscal Q4 2026)**
- Revenue $68.1bn vs $65.8bn expected; EPS $1.62 vs $1.53; data centre $62.3bn vs $60.2bn.
- Q1 guidance $76.4–79.6bn vs $72.8bn expected: a beat **and** a raise.
- Stock fell 5.46% on 26 Feb (~$260bn of value).
- Why: the stock was up 300%+ in five quarters, and Goldman said 2026 growth was "fully priced in."
- Sources: [Yahoo Finance](https://finance.yahoo.com/news/nvidia-stock-falls-as-q4-beat-guidance-fail-to-satisfy-wall-street-170306228.html), [TradingKey](https://www.tradingkey.com/analysis/stocks/us-stocks/261628049-nvidia-nvda-earnings-q4-stock-price-investors-value-tradingkey)

## Missed (or bad news), but rose

**Meta, reported 1 Feb 2023 (Q4 2022)** (card 1)
- EPS $1.76 vs $2.26 expected: a **big miss**. Revenue $32.17bn vs $31.65bn, but down 4% on the year.
- Also announced: a $40bn buyback, 2023 cost guidance cut to $89–95bn (from $94–100bn), and the "year of efficiency."
- Stock rose 23.3% on 2 Feb ($153.12 → $188.77, Yahoo closes).
- Sources: [Yahoo Finance](https://finance.yahoo.com/news/meta-earnings-stock-spikes-after-better-than-expected-revenue-buyback-announcement-211912404.html), [CNBC](https://www.cnbc.com/2023/02/02/meta-stock-rockets-20percent-on-solid-earnings-analyst-reactions.html)

**Tesla, reported 23 Apr 2024 (Q1 2024)**
- Revenue $21.3bn vs ~$22.3bn expected (−9% on the year); EPS $0.45 vs $0.52 expected; net income down 48%.
- Also announced: cheaper models brought forward to the first half of 2025 (from the second half).
- Stock rose ~12% on 24 Apr, its best day since Jan 2022.
- Sources: [Teslarati](https://www.teslarati.com/tesla-q1-2024-earnings-results/), [Euronews](https://www.euronews.com/2024/04/24/teslas-stock-surges-on-optimism-for-musks-affordable-car-line-up), [Benzinga](https://benzinga.com/analyst-ratings/analyst-color/24/04/38415577/tesla-posts-strongest-session-since-january-2022-is-a-trend-reversal-underway)

**Nike, reported 26 Jun 2025 (fiscal Q4 2025)**
- Revenue $11.1bn, **down 12%**; EPS $0.14, down from $0.99 a year earlier; ~$1bn tariff cost warning.
- But it beat the (very low) expectations of $10.72bn revenue and $0.13 EPS. It had said this would be "the low point."
- Stock rose ~15% on 27 Jun, its biggest one-day gain since 2021.
- Sources: [Fast Company](https://www.fastcompany.com/91359723/nike-stock-price-today-shares-rise-despite-tariffs-revenue-drop), [Sportico](https://www.sportico.com/business/commerce/2025/nike-stock-up-biggest-day-gain-since-2021-1234858416/), [Motley Fool](https://www.fool.com/investing/2025/06/27/nike-earnings-revenue-and-profit-plunge)

**Oracle, reported 9 Sep 2025 (fiscal Q1 2026)**
- Revenue $14.9bn vs ~$15.0bn expected (a small miss); non-GAAP EPS $1.47, in line to one cent short depending on the source.
- But RPO (contracted revenue not yet delivered) was **$455bn, up 359%**, with four multi-billion-dollar contracts. It forecast cloud infrastructure revenue of $18bn this year, rising to $144bn in four years.
- Stock rose ~36% on 10 Sep 2025, its best day since 1992.
- Sources: [Oracle release](https://investor.oracle.com/investor-news/news-details/2025/Oracle-Announces-Fiscal-Year-2026-First-Quarter-Financial-Results/default.aspx), [Yahoo/Zacks](https://finance.yahoo.com/news/oracle-q1-earnings-match-estimates-180900939.html), [CNBC](https://www.cnbc.com/2025/09/10/oracle-stock-cloud-backlog-ai.html)

## Controls (the price did what the news suggested)

If every card is a trick, players learn to "always pick the opposite," which turns the game into a coin flip in disguise. Aim for roughly one control in three.

**Meta, reported 1 Feb 2024 (Q4 2023): good → up**
- EPS $5.33 vs $4.94; revenue $40.11bn vs $39.01bn; Q1 guidance $34.6–37bn vs $33.6bn expected; a first-ever dividend plus a $50bn buyback.
- Stock rose 20%+ on 2 Feb 2024, adding ~$200bn of value, a record at the time.
- Disguise it differently from card 1, since both are Meta.
- Source: [Yahoo Finance](https://finance.yahoo.com/news/meta-stock-jumps-20-after-earnings-in-biggest-market-cap-jump-in-stock-market-history-212511451.html)

**Amazon, reported 1 Feb 2024 (Q4 2023): good → up**
- Revenue $170.0bn vs $166.2bn expected; EPS $1.00 vs $0.80; AWS $24.2bn (+13%), in line; operating income $13.2bn vs $2.7bn a year earlier.
- Q1 2024 guidance: revenue $138–143.5bn, operating income $8–12bn.
- Stock rose on 2 Feb 2024; Motley Fool says 6.8%. ⚠ Confirm the close on Yahoo.
- Sources: [Motley Fool](https://www.fool.com/investing/2024/02/02/why-amazon-stock-was-surging-today), [CNBC preview with LSEG estimates](https://www.cnbc.com/2024/02/01/amazon-amzn-q4-earnings-report-2023.html)

**Intel, reported 1 Aug 2024 (Q2 2024): bad → down**
- Revenue $12.8bn, $200m below the midpoint of its own guidance; adjusted EPS $0.02 vs $0.10 expected; net loss $1.61bn.
- Q2 consensus (LSEG): revenue $12.94bn, EPS $0.10. Q3 guidance: revenue $12.5–13.5bn, adjusted EPS −$0.03, vs $14.35bn and $0.31 expected. Source: [CNBC](https://www.cnbc.com/2024/08/01/intel-intc-q2-earnings-report-2024.html)
- Also announced: dividend suspended, 15%+ of staff cut, $10bn cost-cutting plan.
- Stock fell 26% on 2 Aug 2024 to $21.48, its worst day in 50 years.
- Sources: [CNBC via NBC Chicago](https://nbcchicago.com/news/business/money-report/intels-22-share-plunge-drags-down-global-chip-stocks-from-tsmc-to-samsung/3509519/?amp=1), [Motley Fool](https://www.fool.com/data-news/2024/08/01/intel-q2-losses-trigger-layoffs-other-cuts)

## Small move

**Apple, reported 31 Oct 2024 (fiscal Q4 2024)**
- Revenue $94.93bn vs $94.58bn expected; adjusted EPS $1.64 vs $1.60; iPhone $46.22bn vs $45.47bn. (Reported EPS was $0.97 because of a one-off EU tax charge.)
- But next-quarter guidance was only "low to mid single digit" growth, below hopes.
- Stock fell on 1 Nov 2024, roughly 1–2%: a **small down**. ⚠ Get the exact close from Yahoo.
- Sources: [investingLive](https://investinglive.com/news/apple-earnings-eps-of-164-vs-160-estimate-20241031/amp), [Finbold](https://finbold.com/why-apple-aapl-stock-is-crashing/)

---

## Writing a card

**Front (what the market knew)**

- **disguise:** must not give the name away. Remove giveaways like a famous product, a customer name or a unique number.
- **mood:** 1–2 lines on how things looked before the results.
- **rows:** 2–3 rows of expected vs actual.
- **otherNews:** always include it. Without it the answer can't be worked out.

**Back (the reveal)**

- **why:** two lines, in your own words.
- **tag:** a short lesson label, e.g. *Priced in · Guidance beats results · Low bar · Valuation · One big number*.

**Fairness:**

- Use only facts that were public before the move.
- Use one consensus source per card.
