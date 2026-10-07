# Pro Baller — England 2026/27 Squad & Manager Sources

**Snapshot Date:** 2026-10-07  
**Coverage:** 164 English clubs across 7 domestic competitions  

---

## 1. Primary Source: Bzzoiro Sports Data (BSD) Football API
- **Competitions Covered (116 clubs):**
  - Premier League (Tier 1, 20 clubs)
  - Championship (Tier 2, 24 clubs)
  - League One (Tier 3, 24 clubs)
  - League Two (Tier 4, 24 clubs)
  - National League (Tier 5, 24 clubs)
- **Base Endpoint:** `https://sports.bzzoiro.com/api/v2/`
- **Data Extracted:**
  - First-team player identities (name, position, nationality, DOB where available)
  - First-team managers / head coaches
  - Active squad membership
- **License / Terms:** BSD Open Sports Data API terms for non-commercial and development simulation.

---

## 2. Secondary Source: English Wikipedia
- **Competitions Covered (48 clubs):**
  - National League North (Tier 6, 24 clubs)
  - National League South (Tier 6, 24 clubs)
- **Data Extracted:**
  - Current squad tables (`{{fs player}}`, `{{football squad player}}`, wikitables)
  - Infobox first-team managers
- **License:** [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)
- **Attribution:** Individual Wikipedia club and season articles hosted by the Wikimedia Foundation.

---

## 3. Data Integrity & Ingestion Rules
1. **No Guessed Attributes:** No player ratings, potentials, wages, contracts, or values are ingested.
2. **Deterministic IDs:** IDs are deterministic (`player-${slug(name)}-${YYYYMMDD}` or `player-${slug(name)}`) and globally unique.
3. **Broad Position Handling:** Positions are mapped without speculation (GK, DF, MF, FW, and explicitly stated detailed positions).
4. **DOB Optionality:** Date of birth is optional when absent from the source. No placeholder birthdates or January 1 fabrications are introduced.
5. **No Cross-Club Duplication:** Each player is strictly assigned to at most one club squad.
