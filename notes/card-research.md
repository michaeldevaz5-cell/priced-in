# Card research: companies, figures and sources

Raw facts for Michael to write his cards from. **Michael writes the card text himself**; this file only holds the verified numbers and where they came from. Items marked ⚠ still need checking before they go in the game.

*Researched by Claude, 26 Sep, 6 Oct and 19 Oct 2026 (week 2 candidates).*

## Status

| Card | Event | Status |
|---|---|---|
| 1 | Meta, Feb 2023 | ✅ In `puzzles.json`, with `candles` |
| 2 | Netflix, Apr 2024 | ✅ In `puzzles.json`, with `candles` (text drafted by Claude, kept by Michael) |
| 3 | Nike, Jun 2025 | ✅ In `puzzles.json`, with `candles` (move +15.2%: $62.54 → $72.04) |
| 4 | Palantir, Nov 2025 | ✅ In `puzzles.json`, with `candles` (move −7.9%: $207.18 → $190.74) |
| 5 | Microsoft, Jan 2026 | ✅ In `puzzles.json`, with `candles` (opened −8.6%, closed −10.0%: $481.63 → $433.50) |
| 6 | Tesla, Apr 2024 | Dropped: open +12.6% vs close +12.1%, so the exit choice doesn't matter. Replaced by Tesla Oct 2024 (✅ in `puzzles.json`: opened +14.5%, closed +21.9%, $213.65 → $260.48) |
| 14 | Netflix, Jan 2025 | ✅ In `puzzles.json`, with `candles` (opened +14.8%, closed +9.7%: $869.68 → $953.99, pre-split prices) |
| 15 | Meta, Oct 2024 | ✅ In `puzzles.json`, with `candles` (opened −1.1%, closed −4.1%: $591.80 → $567.58) |
| 7 | Oracle, Sep 2025 | ✅ In `puzzles.json`, with `candles` (opened +32.2%, closed +36.0%: $241.51 → $328.33) |
| 8 | Nvidia, Feb 2026 | ✅ In `puzzles.json`, with `candles` (opened −0.7%, closed −5.5%: $195.56 → $184.89) |
| 9 | Meta, Feb 2024 (control) | ✅ In `puzzles.json`, with `candles` (opened +16.4%, closed +20.3%: $394.78 → $474.99) |
| 10 | Amazon, Feb 2024 (control) | ✅ In `puzzles.json`, with `candles` (opened +6.2%, closed +7.9%: $159.28 → $171.81) |
| 11 | Intel, Aug 2024 (control) | ✅ In `puzzles.json`, with `candles` (move −26.1%: $29.05 → $21.48) |
| 12 | Apple, Oct 2024 (small move) | ✅ In `puzzles.json`, with `candles` (move −1.3%: $225.91 → $222.91) |
| 13 | Alphabet, Oct 2024 (small move, control) | ✅ In `puzzles.json`, with `candles` (move +2.8%: $169.68 → $174.46) |

Not used for now:

- **Nvidia Aug 2024:** too similar to Nvidia Feb 2026. Use one or the other, not both.
- **US jobs report Jan 2025:** a macro event that doesn't fit the company card format.

**Balance problem:** almost every card in week 1 is a **big** move by a big US tech company. With trading, that means "always go 50% in the obvious direction" wins too often. Week 2 needs small moves (under 3%), days where the open and close went opposite ways, and other industries. See "Week 2 candidates" below.

## Where to find each piece of info

1. **Expected vs actual (revenue, EPS):** search "[company] earnings [quarter] CNBC". CNBC's results-day article lists both, with estimates from LSEG. Use one consensus source per card.
2. **Also announced** (guidance, buybacks, job cuts): the same article, or the company's own press release (search "[company] investor relations [quarter] results").
3. **Mood before:** the price chart for the 3–6 months before, plus one line on what investors were worried about.
4. **Next-day move and `candles`:** go to `finance.yahoo.com/quote/TICKER/history` (or ask Claude to fetch them).
   - Most companies report after the market closes, so the move happens the next trading day.
   - Move % = (close the day after − close on results day) ÷ close on results day × 100.
   - Copy 60 trading days into `candles` as `[open, high, low, close, volume]` (Claude can fetch these). The last one must be the day after the results.
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

## Week 2 candidates (2–6 Nov)

*Researched by Claude, 19 Oct 2026. Michael picks 15 of these 16 and writes the text.*

How they were chosen:
- **No big tech.** 16 different industries.
- **All reported after the market closed,** so the game's "Results day" candle and "the next morning" are accurate. (Companies that report before the open are listed separately at the end.)
- **The open and close differ a lot** (3 points or more), or the card is a small move. Six of them opened one way and closed the other.
- **Open and close** come from Yahoo daily prices, checked on 19 Oct 2026. "Open" = what exiting at the open gets; "close" = what holding gets. Both are measured from the results-day close.
- **Expected figures** use LSEG where a source gave it, otherwise the source named. Consensus sources differ by a cent or two, so pick one per card.

| # | Company, results day | Industry | Open | Close | Type |
|---|---|---|---|---|---|
| A | Lyft, 13 Feb 2024 | Ride hailing | +23.5% | +35.1% | Good → up, holding paid. ✅ Card 19 (draft) |
| B | United Airlines, 15 Oct 2024 | Airline | +2.1% | +12.4% | Good → up, holding paid a lot. ✅ Card 16 |
| C | Mattel, 23 Jul 2025 | Toys | −6.5% | −16.4% | Bad → down, got worse all day. ✅ Card 26 (draft) |
| D | Align Technology, 30 Jul 2025 | Dental (clear braces) | −30.0% | −36.6% | Bad → down. ✅ Card 30 (draft) |
| E | Carvana, 19 Feb 2025 | Used cars online | −6.0% | −12.1% | Beat, but fell. ✅ Card 18 |
| F | Starbucks, 29 Jul 2025 | Coffee chain | +5.2% | −0.2% | Missed, opened up, faded to flat (small) |
| G | e.l.f. Beauty, 6 Feb 2025 | Cosmetics | −25.1% | −19.6% | Guidance cut → down, recovered a bit. ✅ Card 17 |
| H | Ford, 24 Jul 2024 | Car maker | −13.7% | −18.4% | Bad → down. ✅ Card 23 (draft) |
| I | Rivian, 7 May 2024 | Electric vehicles | −7.2% | +0.2% | Missed, opened down, closed flat (small). ✅ Card 27 (draft) |
| J | Gap, 21 Nov 2024 | Clothing retail | +17.1% | +12.8% | Good → up, exiting at the open paid. ✅ Card 22 (draft) |
| K | Booking Holdings, 20 Feb 2025 | Online travel | +3.9% | −0.5% | Beat, opened up, faded (small) |
| L | Chipotle, 29 Oct 2025 | Restaurants | −21.4% | −18.2% | Bad → down. ✅ Card 20 (draft) |
| M | Mondelez, 4 Feb 2025 | Snacks (chocolate, biscuits) | −3.3% | +2.3% | Missed and weak outlook, but rose (small) |
| N | Capital One, 22 Jul 2025 | Bank / credit cards | +4.8% | +0.9% | Beat, opened up, faded (small). ✅ Card 21 (draft) |
| O | Monster Beverage, 8 May 2025 | Energy drinks | −2.2% | +1.4% | Sales miss, opened down, closed up (small). ✅ Card 24 (draft) |
| P | Deckers, 30 Jan 2025 | Footwear | −12.1% | −20.5% | Beat and raised, but fell. ✅ Card 25 (draft) |

Balance: 8 closed up, 8 closed down; 6 small moves. On 9, a trade in the direction of the open did better exiting at the open (F, G, I, J, K, L, M, N, O); on 7, holding did better (A, B, C, D, E, H, P). So neither "always exit" nor "always hold" wins. **Clashes:** F and L are both restaurants; H and I are both car makers, and Tesla is already in week 1. Pick one of each pair, or space them apart.

**Splits:** Carvana (5-for-1, May 2026), Booking (25-for-1, Apr 2026) and Monster (2-for-1, Aug 2026) have split since, so Yahoo shows their old prices divided. Their `candles` must be multiplied back (×5, ×25, ×2) and volume divided, as with Netflix. Chipotle and Deckers split before their 60-day windows, so no change.

### A. Lyft, reported 13 Feb 2024 after the close (Q4 2023)
- Revenue ~$1.22bn, in line with estimates; adjusted EPS ~$0.18 vs ~$0.08 expected (Motley Fool; other outlets say $0.16–0.19, so check one source). Gross bookings +17%.
- **The twist:** the press release said 2024 margin would expand by **500** basis points (5 percentage points). Shares jumped 60%+ after hours. On the call, the CFO corrected it to **50**: "one zero too many". Shares gave back much of the jump but stayed well up.
- Prices: $12.13 → opened $14.98 (+23.5%) → closed $16.39 (+35.1%).
- Fairness: the correction came on the call the same evening, so it was public before the next open. It belongs in `otherNews`.
- ⚠ The typo was big news, so players may recognise it. The disguise needs care.
- Sources: [AP via The Gazette](https://gazettedev.gazette.com/2024/02/14/lyft-shares-rocket-62-over-a-typo-in-the-companys-earnings-release/), [Motley Fool](https://fool.com/investing/2024/02/14/why-lyft-stock-is-skyrocketing-today)

### B. United Airlines, reported 15 Oct 2024 after the close (Q3 2024)
- Adjusted EPS $3.33 vs $3.17 expected; revenue $14.84bn vs $14.78bn (LSEG).
- Also announced: a **$1.5bn share buyback**, its first since before Covid; Q4 EPS guidance $2.50–3.00 vs $2.68 expected.
- Prices: $64.05 → opened $65.40 (+2.1%) → closed $72.02 (+12.4%). Almost all of the move happened after the open.
- Source: [CNBC via NBC Connecticut](https://www.nbcconnecticut.com/news/business/money-report/united-airlines-plans-1-5-billion-share-buyback-beats-estimates-for-third-quarter/3409898/)

### C. Mattel, reported 23 Jul 2025 after the close (Q2 2025)
- Revenue $1.02bn vs $1.05bn expected (LSEG), down 6%; adjusted EPS $0.19 vs $0.15 expected (LSEG). North American sales −16%; the CEO blamed US retailers delaying orders, and analysts said they were keeping stock low because of tariffs.
- Also announced: a lower 2025 forecast (adjusted EPS $1.54–1.66, from $1.66–1.72). ⚠ Check the old range against Mattel's earlier release.
- Prices: $20.20 → opened $18.88 (−6.5%) → closed $16.89 (−16.4%). Shares were down only ~3.5% after hours.
- Sources: [Mattel release (SEC)](https://www.sec.gov/Archives/edgar/data/63276/000162828025035714/matq22025earningsrelease.htm), [Reuters via Globe and Mail](https://www.theglobeandmail.com/investing/article-mattel-sales-decline-weak-barbie-demand), [Reuters via FBC News](https://www.fbcnews.com.fj/?p=733737)

### D. Align Technology, reported 30 Jul 2025 after the close (Q2 2025)
- Revenue $1.01bn vs ~$1.06bn expected; adjusted EPS $2.49 vs $2.57 expected. Clear-aligner (Invisalign) volumes weak in Europe and North America.
- Also announced: 2025 revenue outlook cut to roughly flat (from +3.5–5.5%), plus job cuts and restructuring charges.
- Prices: $203.57 → opened $142.50 (−30.0%) → closed $129.01 (−36.6%).
- ⚠ Consensus here is Zacks/other, not LSEG.
- Sources: [Align release (SEC)](https://www.sec.gov/Archives/edgar/data/1097149/000109714925000055/algn-q225earningspressrele.htm), [Barchart](https://www.barchart.com/story/news/33781253/algn-stock-falls-on-q2-earnings-and-revenue-miss-margins-down)

### E. Carvana, reported 19 Feb 2025 after the close (Q4 2024)
- Revenue $3.55bn vs $3.31bn expected; EPS $0.56 vs $0.29 (LSEG). Revenue +46%.
- But the 2025 outlook only promised "significant growth" in units and profit, with no numbers. Analysts blamed high expectations and the vague forecast.
- Prices (×5 for the split): $281.80 → opened $264.90 (−6.0%) → closed $247.70 (−12.1%). The $281.80 matches CNBC's reported close of $281.82.
- Source: [CNBC via NBC News](https://www.nbcnews.com/business/autos/carvana-expects-another-strong-year-topping-fourth-quarter-expectation-rcna193037)

### F. Starbucks, reported 29 Jul 2025 after the close (fiscal Q3 2025)
- Revenue $9.46bn vs ~$9.31bn expected; adjusted EPS $0.50 vs ~$0.65 expected (Zacks). Global same-store sales −2% (transactions −2%, average spend +1%).
- Prices: $92.96 → opened $97.83 (+5.2%) → closed $92.76 (−0.2%).
- ⚠ No LSEG figures found, and no source explains why it opened up and then faded. Find one (e.g. a CNBC or Reuters next-day story) before writing `why`.
- Sources: [Starbucks release](https://www.businesswire.com/news/home/20250729489541/en/Starbucks-Reports-Q3-Fiscal-Year-2025-Results), [AP via WTOP](https://wtop.com/news/2025/07/starbucks-fiscal-q3-earnings-snapshot)

### G. e.l.f. Beauty, reported 6 Feb 2025 after the close (fiscal Q3 2025)
- Revenue $355m vs $330m expected; adjusted EPS $0.74 vs $0.75 (LSEG).
- But it **cut full-year guidance** after a soft January, blaming post-holiday discounting and the TikTok ban saga: revenue $1.30–1.31bn (from ~$1.34bn), adjusted EPS $3.27–3.32 (from $3.47–3.53).
- Prices: $88.49 → opened $66.30 (−25.1%) → closed $71.13 (−19.6%).
- Source: [CNBC via NBC Los Angeles](https://nbclosangeles.com/news/business/money-report/e-l-f-cuts-guidance-after-soft-january-citing-tiktok-ban-saga-and-la-wildfires-as-headwinds/3626623/?os=iosdf)

### H. Ford, reported 24 Jul 2024 after the close (Q2 2024)
- Adjusted EPS $0.47 vs $0.68 expected (FactSet); revenue $47.8bn vs $47.79bn.
- Why: warranty costs of $2.3bn, $700m more than a year earlier, mostly on 2021 and older models. Full-year profit guidance kept at $10–12bn.
- Prices: $13.67 → opened $11.80 (−13.7%) → closed $11.16 (−18.4%).
- Sources: [TT News (AP)](https://www.ttnews.com/articles/ford-earnings-q2-2024), [MarketBeat](https://www.marketbeat.com/articles/ford-stock-eps-disappoints-shares-plummet-after-hours/)

### I. Rivian, reported 7 May 2024 after the close (Q1 2024)
- Revenue ~$1.20bn vs ~$1.15bn expected; adjusted loss per share $1.24 vs $1.15 expected (Reuters): a wider loss than expected.
- Also: kept its 2024 production target of 57,000 vehicles and cut planned spending by $550m by moving its first R2 line to its existing Illinois plant.
- Prices: $10.25 → opened $9.51 (−7.2%) → closed $10.27 (+0.2%).
- ⚠ No source yet for why it recovered during the day.
- Sources: [Reuters via Investing.com](https://investing.com/news/stock-market-news/rivians-q1-earnings-come-short-production-outlook-reaffirmed-shares-slip-432SI-3425542), [Electrek](https://electrek.co/2024/05/07/rivian-rivn-q1-results-revenue-beat-earnings-miss-slight-margin-increase/)

### J. Gap, reported 21 Nov 2024 after the close (Q3 2024)
- EPS $0.72 vs $0.57–0.58 expected; revenue $3.83bn vs $3.81bn. Comparable sales +1%; operating margin 9.3%.
- Also: raised its full-year outlook for the third time in 2024.
- Prices: $22.04 → opened $25.80 (+17.1%) → closed $24.87 (+12.8%).
- ⚠ Consensus is Benzinga/other, not LSEG.
- Sources: [Gap release](https://investors.gapinc.com/press-releases/news-details/2024/Gap-Inc.-Reports-Third-Quarter-Fiscal-2024-Results-Raises-Full-Year-Outlook/default.aspx), [Nasdaq](https://www.nasdaq.com/articles/gap-earnings-gap-stock-rises-13-strong-financial-results-and-raised-guidance)

### K. Booking Holdings, reported 20 Feb 2025 after the close (Q4 2024)
- Revenue $5.47bn vs $5.18bn expected; adjusted EPS $41.55 vs $35.89 (Benzinga Pro). Room nights +13%, beating its own forecast by 5 points.
- Also: dividend raised to $9.60 from $8.75; Q1 room-night growth guided to 5–7%.
- Prices (×25 for the split): $5,018.25 → opened $5,213.50 (+3.9%) → closed $4,990.75 (−0.5%).
- ⚠ No source yet for why the gain faded.
- Sources: [Booking release (SEC)](https://www.sec.gov/Archives/edgar/data/1075531/000107553125000009/bnkgq42024earningspressr.htm), [Benzinga](https://benzinga.com/news/earnings/25/02/43866519/booking-holdings-q4-earnings-revenue-beat-eps-beat-dividend-increase-shares-move-higher)

### L. Chipotle, reported 29 Oct 2025 after the close (Q3 2025)
- Same-store sales +0.3% vs +1.36% expected (LSEG); revenue $3.0bn vs ~$3.02bn; adjusted EPS $0.29, in line.
- Also: cut its 2025 outlook for the third time this year, to a low-single-digit **fall** in same-store sales (from about flat), as younger diners cut back.
- Prices: $39.76 → opened $31.27 (−21.4%) → closed $32.53 (−18.2%). Its worst day since 2012.
- Sources: [Yahoo Finance](https://finance.yahoo.com/news/chipotle-trims-same-store-sales-154624120.html), [Bloomberg via BGov](https://news.bgov.com/antitrust/chipotle-cuts-outlook-for-third-time-in-2025-on-weak-traffic-1), [Sherwood](https://sherwood.news/markets/chipotle-tumbles-weak-sales-outlook-younger-consumers-pull-back-burritos-bowls/)

### M. Mondelez, reported 4 Feb 2025 after the close (Q4 2024)
- Adjusted EPS $0.65 vs $0.66 expected; revenue $9.60bn vs $9.69bn (Zacks).
- Also: 2025 adjusted EPS to fall about 10% because of "unprecedented cocoa cost inflation", worse than the ~6.7% fall analysts expected (LSEG, per one outlet). Revenue growth ~5%.
- Prices: $56.12 → opened $54.25 (−3.3%) → closed $57.43 (+2.3%). Low of the day $53.95 (−3.9%); volume about double the day before.
- ⚠ An auto-written news piece said shares "plunged around 5%" that day, which doesn't match Yahoo's close. Confirm the close on a second price site (e.g. the Yahoo or Nasdaq history page in a browser) before using it. No source yet for why it recovered.
- Sources: [Zacks](https://www.zacks.com/stock/news/2409924/mondelez-q4-earnings-miss-estimates-amid-increased-cocoa-costs), [Food Business News](https://www.foodbusinessnews.net/articles/27645-mondelez-cuts-earnings-outlook-due-to-high-cocoa-prices)

### N. Capital One, reported 22 Jul 2025 after the close (Q2 2025)
- Adjusted EPS $5.48 vs $3.83 expected (Zacks); revenue $12.49bn vs $12.22bn (Zacks).
- But the headline was a **$4.3bn loss** ($8.58 a share), from an $8.8bn one-off reserve for loans it took on when it bought Discover in May. Integration costs will top the planned $2.8bn.
- Prices: $217.42 → opened $227.86 (+4.8%) → closed $219.46 (+0.9%). Up ~4% after hours.
- ⚠ Revenue consensus varies a lot ($12.22bn Zacks vs $12.72bn elsewhere), so pick one source.
- Sources: [Capital One release (SEC)](https://www.sec.gov/Archives/edgar/data/927628/000092762825000240/ex991q22025earningsrelease.htm), [Zacks via Finviz](https://finviz.com/news/112043/cof-up-on-q2-earnings-beat-discover-deal-boosts-nii-and-fee-income)

### O. Monster Beverage, reported 8 May 2025 after the close (Q1 2025)
- Net sales $1.85bn, down 2.3%, missing estimates by ~$126m; adjusted EPS $0.47, one cent above estimates (Seeking Alpha). Gross margin up to 56.5% from 54.1%.
- Prices (×2 for the split): $60.14 → opened $58.82 (−2.2%) → closed $61.00 (+1.4%).
- ⚠ The weakest-sourced card: the consensus figures come from Seeking Alpha's summary only. Find a CNBC or Reuters story before using it.
- Sources: [Monster release (SEC)](https://www.sec.gov/Archives/edgar/data/865752/000110465925046150/tm2514442d1_ex99-1.htm), [Seeking Alpha](https://seekingalpha.com/pr/20097637-monster-beverage-reports-2025-first-quarter-results)

### P. Deckers (Hoka, UGG), reported 30 Jan 2025 after the close (fiscal Q3 2025)
- Revenue $1.83bn (+17%, a record) vs ~$1.7bn expected; adjusted EPS $3.00 vs $2.46. Hoka +23.7%.
- Also: raised full-year EPS guidance to $5.75–5.80 (vs $5.64 expected) and revenue growth to ~15%. But that was below what investors hoped for, and it warned of limited UGG stock in Q4.
- Prices: $223.11 → opened $196.10 (−12.1%) → closed $177.36 (−20.5%).
- ⚠ The consensus and the reason come from auto-written iTiger summaries. Find a Reuters or CNBC story to confirm both.
- Sources: [Deckers release](https://www.businesswire.com/news/home/20250130744693/en/Deckers-Brands-Reports-Third-Quarter-Fiscal-Year-2025-Financial-Results), [iTiger](https://itiger.com/news/1140836189)

### Reserves (prices checked, figures not yet)

| Company, results day | Industry | Open | Close | Note |
|---|---|---|---|---|
| Lululemon, 5 Dec 2024 | Activewear | +9.3% | +15.9% | After the close |
| Expedia, 6 Feb 2025 | Online travel | +12.8% | +17.3% | Clashes with Booking |
| Robinhood, 12 Feb 2025 | Share-trading app | +11.1% | +14.1% | |
| Edwards Lifesciences, 24 Jul 2024 | Heart valves | −26.4% | −31.3% | Clashes with Align |
| Snap, 4 Feb 2025 | Social media | −0.6% | −8.4% | Tech-ish |
| Costco, 6 Mar 2025 | Warehouse retail | −3.1% | −6.1% | |
| Ulta Beauty, 13 Mar 2025 | Beauty retail | +8.8% | +13.7% | Clashes with e.l.f. |
| Amgen, 4 Feb 2025 | Biotech | +0.6% | +6.5% | Beat; −2.5% after hours, then rose all day. No source for why. |

**Reported before the open.** For these, the second-to-last candle is the day *before* the results, but the chart labels it "Results day". Use them only if that label is handled.
- Peloton, 6 Feb 2025 (7am): +17.5% open, +12.0% close
- UnitedHealth, 17 Apr 2025: −17.6%, −22.4%
- Eli Lilly, 7 Aug 2025: −9.5%, −14.1%
- Target, 20 Nov 2024: −17.9%, −22.0%
- Dollar General, 29 Aug 2024: −25.5%, −32.1%
- PayPal, 4 Feb 2025: −8.1%, −13.2%

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
