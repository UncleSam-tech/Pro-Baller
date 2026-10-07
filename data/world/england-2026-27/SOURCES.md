# England 2026/27 Football World Snapshot — Data Sources & Provenance

## Overview
- **World ID:** `england-2026-27`
- **Season:** `2026-27`
- **Snapshot Date:** `2026-10-07`
- **Ingestion Pipeline:** `importFootballWorldSnapshot` with continuation mode (`GENERATE_FROM_MEMBERSHIP`)
- **Total Competitions:** 7 domestic divisions (Tiers 1–6)
- **Total Clubs:** 164 unique clubs

---

## Primary API Investigation & Status (Cordax Football API)
- **Provider:** Cordax Football API (`https://api.cordax.net`)
- **Configured Key:** Checked via `CORDAX_API_KEY` / `.env.local`
- **Endpoint Test:** `GET https://api.cordax.net/Competitions?country=England`
- **Result:** `401 Unauthorized: The API token is invalid, inactive, or expired.`
- **Root Cause & Coverage Verification:**
  - Token authentication failed on the Cordax live backend.
  - Per project instructions and explicit user authorization, the pipeline gracefully activated the documented public fallback sources.

---

## Provenance by Competition

### 1. Premier League (`england-premier-league`)
- **Source:** OpenFootball / Football Data JSON (`https://github.com/openfootball/football.json`)
- **Resource:** `2026-27/en.1.json`
- **Source Link:** https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json
- **License:** CC0 1.0 Universal / Public Domain Dedication (https://creativecommons.org/publicdomain/zero/1.0/)
- **Clubs Ingested:** 20 clubs
- **Matches Ingested:** 45 completed matches played <= 2026-10-07
- **Continuation:** Remaining 335 fixtures generated via Pro-Baller double round-robin scheduler.

### 2. Championship (`england-championship`)
- **Source:** OpenFootball / Football Data JSON (`https://github.com/openfootball/football.json`)
- **Resource:** `2026-27/en.2.json`
- **Source Link:** https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.2.json
- **License:** CC0 1.0 Universal / Public Domain Dedication (https://creativecommons.org/publicdomain/zero/1.0/)
- **Clubs Ingested:** 24 clubs
- **Continuation:** Remaining 464 fixtures generated via Pro-Baller double round-robin scheduler.

### 3. League One (`england-league-one`)
- **Source:** Wikipedia Results Matrix
- **Resource:** `2026–27 EFL League One`
- **Source Link:** https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_One
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_One&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 89 completed matches played <= 2026-10-07
- **Continuation:** Remaining 463 fixtures generated via Pro-Baller double round-robin scheduler.

### 4. League Two (`england-league-two`)
- **Source:** Wikipedia Results Matrix
- **Resource:** `2026–27 EFL League Two`
- **Source Link:** https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_Two
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_Two&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 102 completed matches played <= 2026-10-07
- **Continuation:** Remaining 450 fixtures generated via Pro-Baller double round-robin scheduler.

### 5. National League (`england-national-league`)
- **Source:** Wikipedia Results Matrix
- **Resource:** `Template:2026–27 National League table` / `2026–27 National League`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_table
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=Template:2026%E2%80%9327_National_League_table&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 143 completed matches played <= 2026-10-07
- **Continuation:** Remaining 409 fixtures generated via Pro-Baller double round-robin scheduler.

### 6. National League North (`england-national-league-north`)
- **Source:** Wikipedia & National League Results Matrix
- **Resource:** `Template:2026–27_National_League_North_table`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_North_table
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 120 completed matches played <= 2026-10-07
- **Continuation:** Remaining 432 fixtures generated via Pro-Baller double round-robin scheduler.

### 7. National League South (`england-national-league-south`)
- **Source:** Wikipedia & National League Results Matrix
- **Resource:** `Template:2026–27_National_League_South_table`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_South_table
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 97 completed matches played <= 2026-10-07
- **Continuation:** Remaining 455 fixtures generated via Pro-Baller double round-robin scheduler.

---

## Historical Source Evaluation Note (Football-Data.co.uk)
- **Status:** Evaluated and REJECTED.
- **Reason:** Current published usage terms for `football-data.co.uk` restrict free data files strictly to private individual use and explicitly prohibit use in commercial or data-training products via automated scrapers/bots.
- **Compliance Action:** In accordance with project licensing compliance, Football-Data.co.uk was completely removed as an ingested source. No committed fixture, result, or competition data in Pro Baller depends on or bundles data from `football-data.co.uk`.

---

## Known Sporting Rule & Standings Model Limitations
- The competition engine currently models the supported standings criteria: `points`, `goalDifference`, `goalsFor`, `headToHeadPoints`, and `headToHeadGoalDifference`.
- Some extremely deep tie-break criteria specified in governing league regulations (e.g. most wins, away goals scored in the league, head-to-head away goals, neutral-ground play-off matches) remain pending future expansion of the `StandingsTieBreaker` model.
- Because these deep tie-breakers cannot currently be fully represented, all seven competition rule sets designate `verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION'`.
- This limitation does not affect ordinary season standings unless two or more clubs remain exactly level across all currently supported criteria.

---

## Licensing & Redistribution Terms
- **OpenFootball:** Public Domain (CC0 1.0 Universal). Fully redistributable and embeddable without restrictions.
- **Wikipedia:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0; https://creativecommons.org/licenses/by-sa/4.0/). Attribution to Wikipedia contributors provided via template URLs and wikitext source references.
- **Cordax API Policy:** Not embedded in git repository as live Cordax response was unavailable (401 Unauthorized). Only documented public fallback data with compatible licensing was bundled into repository packs.
