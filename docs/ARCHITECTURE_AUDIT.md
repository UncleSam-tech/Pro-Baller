# PRO BALLER — ARCHITECTURAL AUDIT & CODEBASE EVALUATION
**Document Version:** 1.0.0  
**Audit Date:** October 7, 2026  
**Auditor:** Antigravity AI Architecture Specialist  
**Repository:** `UncleSam-tech/Pro-Baller`  
**Commit Inspected:** `a359fa7` (HEAD -> main)

---

## 1. Executive Summary

`UncleSam-tech/Pro-Baller` is a substantial, highly ambitious single-player football career RPG simulation built with **React 19**, **TypeScript 5.7+**, **Vite 8**, **Tailwind CSS v4**, **Three.js**, and **Motion**. Spanning **64 source files** and **23,340 lines of TypeScript/TSX code**, the repository demonstrates deep domain modeling across football contracts, player lifestyle, tactical systems, matchday events, and international transfer mechanics.

The product vision successfully targets a unique cross-genre synthesis:
1. **Football Manager-style depth** (authentic FIFA/FA contract clauses, real-world tax residency across 11 nations, continental UEFA qualification, domestic disciplinary card accumulation, transfer markets).
2. **New Star Soccer-style career focus** (player-centric gameweek calendar, clutch matchday decision moments, daily routines, stamina recovery).
3. **EA FC Player Career presentation** (3D pitch visualizations, 3D customizable avatar, locker room teammate interactions, personal coaching staff).
4. **Life-RPG systems** (family remittances, passport bureaucracy and GBE work permits, luxury real-estate, vehicles, private jets, brand ambassadorships, and retirement vocations).

### Critical High-Level Findings
1. **Tooling & Build Status:**
   - Dependency installation succeeded cleanly using `bun install --frozen-lockfile` (194 packages).
   - Production build (`vite build`) **succeeded** (1,718 modules bundled in 758ms, producing a 1.39 MB JS bundle and 109 KB CSS bundle).
   - Strict TypeScript check (`tsc --noEmit`) **failed with 7 compilation errors** in [`src/components/MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx). These errors are caused by missing state declarations (`selectedFormation`, `setSelectedFormation`, `tacticalMentality`, etc.) referenced when passing props to [`PreMatchTacticalBriefing`](file:///Users/israel/Pro-Baller/src/components/PreMatchTacticalBriefing.tsx).
2. **Architectural Bottleneck — The Monolithic Orchestrator:**
   [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) currently functions simultaneously as the state store, router, persistence controller, weekly wage/tax processor, fixture scheduler, and season transitioner.
3. **Domain Model Overload:**
   [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) (707 lines) conflates over 30 distinct domain models into one shared file, mixing pure simulation models, UI view states, and rendering telemetry.
4. **Duplication and Orphaned Modules:**
   The repository contains notable code duplication:
   - Two parallel tax systems: [`src/utils/taxSystem.ts`](file:///Users/israel/Pro-Baller/src/utils/taxSystem.ts) and [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts).
   - Two parallel league rule registries: [`src/data/leagueRules.ts`](file:///Users/israel/Pro-Baller/src/data/leagueRules.ts) (completely unused) and [`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts).
   - Three large orphaned presentation components: [`src/components/ContractDocument.tsx`](file:///Users/israel/Pro-Baller/src/components/ContractDocument.tsx) (756 lines), [`src/components/PlayerProfile.tsx`](file:///Users/israel/Pro-Baller/src/components/PlayerProfile.tsx) (303 lines), and [`src/components/PressConference.tsx`](file:///Users/israel/Pro-Baller/src/components/PressConference.tsx) (218 lines).
   - Three duplicate clubs in [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts) (`sunderland`, `southampton`, and `santos_fc`).
5. **Client-Heavy & Web Worker Readiness:**
   The mathematical simulation core ([`matchEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts), [`LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts), [`contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts), [`taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts)) is nearly 100% pure domain logic and is prime for execution in Web Workers without DOM or React dependencies.

---

## 2. Current Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                        BROWSER CLIENT (REACT 19)                                  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  |                                          src/App.tsx                                        |  |
|  |  * Holds single Player state in useState                                                    |  |
|  |  * Controls GameView navigation (10 flat tabs + modals)                                      |  |
|  |  * Executes weekly calendar advance, tax withholding & energy recovery                      |  |
|  |  * Auto-saves on every player mutation via useEffect -> localStorage                        |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                   |                                     |                         |
|        +--------------------------+----------+                          |                         |
|        |                                     |                          |                         |
|  +-----v---------------------+        +------v--------------------+     |                         |
|  | PRESENTATION & UI VIEWS   |        | 3D WEBGL RENDERING        |     |                         |
|  | * Header / Sidebar HUD    |        | * ThreePitchView (Three)  |     |                         |
|  | * PersonaHQ (Bio/Routine) |        | * ThreePlayerAvatar       |     |                         |
|  | * MatchView (Live match)  |        | * IntroCinematic (3D)     |     |                         |
|  | * ClubRoom / Transfers    |        +---------------------------+     |                         |
|  | * TrainingHub / Medical   |                                          |                         |
|  | * AgentTerminal / Shop    |                                          |                         |
|  +---------------------------+                                          |                         |
|                                                                         |                         |
|        +----------------------------------------------------------------+                         |
|        |                                                                                          |
|  +-----v---------------------------------------------------------------------------------------+  |
|  | CORE SIMULATION & UTILITIES (Pure Domain Functions)                                         |  |
|  | * matchEngine.ts       -> Poisson goal distribution, moment choices, fatigue penalties      |  |
|  | * LeagueEngine.ts      -> Calendar generator, UCL/Cup qualification, roster mapping         |  |
|  | * LeagueRuleSet.ts     -> Substitution rules, card accumulation thresholds                  |  |
|  | * contractGenerator.ts -> Wage calculation, buyout clauses, counter-offer bargaining       |  |
|  | * taxResidency.ts      -> 11-country marginal athlete tax calculation                      |  |
|  | * currency.ts          -> Multi-currency conversion (GBP, EUR, USD, NGN, BRL, JPY)          |  |
|  | * soundFx.ts           -> Procedural Web Audio API sound generator (browser-coupled)        |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                  |                                                |
|  +-----------------------------------------------v---------------------------------------------+  |
|  | STATIC DATA REGISTRIES                                                                      |  |
|  | * clubs.ts (65 clubs across 10 leagues)            * geography.ts (Continents & Diasporas)   |  |
|  | * clubRosters.ts (Full starting XI + Bench)        * dailyRoutineData.ts (Diets & Sleep)     |  |
|  | * agentAgenciesData.ts (4 Agency Tiers)            * globalScoutingData.ts (Wonderkids radar)|  |
|  | * brandAmbassadorData.ts                           * historicalGreats.ts                     |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                  |                                                |
|  +-----------------------------------------------v---------------------------------------------+  |
|  | PERSISTENCE LAYER                                                                           |  |
|  | * gameStorage.ts -> Single localStorage key: 'career_legend_save_v1'                         |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

### Architectural Realities
- **Architecture Style:** Client-rendered Single Page Application (SPA).
- **Orchestration Pattern:** Container-driven monolith (`App.tsx` acts as the root controller and view router).
- **Communication Pattern:** Prop drilling of `player` state and `onUpdatePlayer(newPlayer)` callbacks across 1 to 3 component levels.
- **Computation Model:** Synchronous execution on the browser's main JavaScript thread.

---

## 3. Repository and System Map

The repository is structured into 4 primary directories under `src/`:
- `src/types/` (2 files)
- `src/utils/` (10 files)
- `src/data/` (14 files)
- `src/components/` (35 files)
- Root entry files: `src/main.tsx`, `src/App.tsx`, `src/index.css`

Total source files: **64**.

### Complete Subsystem Inventory

| Subsystem # | Subsystem Name | Relevant Files | Main Exported Symbols | State Owner | Dependencies | Dependents |
|---|---|---|---|---|---|---|
| **1** | Application Entry Points | [`src/main.tsx`](file:///Users/israel/Pro-Baller/src/main.tsx), [`src/index.html`](file:///Users/israel/Pro-Baller/index.html), [`src/index.css`](file:///Users/israel/Pro-Baller/src/index.css) | Root DOM render | Browser DOM | React DOM, [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | User runtime |
| **2** | UI / Navigation Architecture | [`src/components/Header.tsx`](file:///Users/israel/Pro-Baller/src/components/Header.tsx), [`src/components/Sidebar.tsx`](file:///Users/israel/Pro-Baller/src/components/Sidebar.tsx), [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | `Header`, `Sidebar`, `GameView`, `GameModeTab` | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`currentView`) | `lucide-react`, [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | All top-level views |
| **3** | Player & Career Core State | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts), [`src/utils/gameStorage.ts`](file:///Users/israel/Pro-Baller/src/utils/gameStorage.ts) | `Player`, `createNewPlayer`, `savePlayer`, `loadPlayer` | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`player`) + `localStorage` | [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts), [`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts), [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts) | Almost all components |
| **4** | Football World & Clubs Data | [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts), [`src/data/clubRosters.ts`](file:///Users/israel/Pro-Baller/src/data/clubRosters.ts), [`src/data/geography.ts`](file:///Users/israel/Pro-Baller/src/data/geography.ts) | `CLUBS_DATABASE`, `getClubById`, `getClubRoster`, `WORLD_GEOGRAPHY` | Static module memory | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) | [`LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts), [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) |
| **5** | League & Competition Engine | [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts), [`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts), [`src/data/leagueRules.ts`](file:///Users/israel/Pro-Baller/src/data/leagueRules.ts) | `generateSeasonCalendar`, `getCurrentWeekFixture`, `getLeagueRuleSet`, `validateMatchup` | Pure function returns / Function-local | [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts), [`src/data/clubRosters.ts`](file:///Users/israel/Pro-Baller/src/data/clubRosters.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) |
| **6** | Match Simulation Subsystem | [`src/utils/matchEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts), [`src/components/MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx), [`src/components/MatchHighlightsFeed.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchHighlightsFeed.tsx) | `simulateMatch`, `generateKeyMatchMoments`, `resolveMomentChoice`, `MatchView` | [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) (`matchPhase`, `currentMinute`, `homeScore`) | [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts), `canvas-confetti` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`handleMatchComplete`) |
| **7** | Tactical Systems | [`src/components/TacticalBoard.tsx`](file:///Users/israel/Pro-Baller/src/components/TacticalBoard.tsx), [`src/components/TacticalHeatMap.tsx`](file:///Users/israel/Pro-Baller/src/components/TacticalHeatMap.tsx), [`src/components/TacticalInstructions.tsx`](file:///Users/israel/Pro-Baller/src/components/TacticalInstructions.tsx), [`src/components/PreMatchTacticalBriefing.tsx`](file:///Users/israel/Pro-Baller/src/components/PreMatchTacticalBriefing.tsx) | `TacticalBoard`, `TacticalHeatMap`, `TACTICAL_FOCUS_OPTIONS`, `PreMatchTacticalBriefing` | Component `useState` | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx), [`TrainingHub.tsx`](file:///Users/israel/Pro-Baller/src/components/TrainingHub.tsx) |
| **8** | Training & Development | [`src/components/TrainingHub.tsx`](file:///Users/israel/Pro-Baller/src/components/TrainingHub.tsx), [`src/components/PersonalCoachHub.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonalCoachHub.tsx) | `TrainingHub`, `PersonalCoachHub`, `DRILLS` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`player.attributes`, `player.energy`) | [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts), `canvas-confetti` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) |
| **9** | Contracts & Boardroom | [`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts), [`src/components/ClubRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/ClubRoom.tsx), [`src/components/ContractDocument.tsx`](file:///Users/israel/Pro-Baller/src/components/ContractDocument.tsx) | `generateProContract`, `evaluateCounterOffer`, `ClubRoom`, `ContractDocument` | [`ClubRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/ClubRoom.tsx) (`proposedTerms`, `boardPatience`), [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) |
| **10** | Transfers & Market | [`src/components/TransferMarket.tsx`](file:///Users/israel/Pro-Baller/src/components/TransferMarket.tsx), [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts) | `TransferMarket`, `TransferOffer` | [`TransferMarket.tsx`](file:///Users/israel/Pro-Baller/src/components/TransferMarket.tsx) (`offers` in `useState`) | [`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts), [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`reviewingContract`) |
| **11** | Scouting & Talent Radar | [`src/components/ScoutingHub.tsx`](file:///Users/israel/Pro-Baller/src/components/ScoutingHub.tsx), [`src/components/ScoutSystem.tsx`](file:///Users/israel/Pro-Baller/src/components/ScoutSystem.tsx), [`src/data/scoutGenerator.ts`](file:///Users/israel/Pro-Baller/src/data/scoutGenerator.ts), [`src/data/globalScoutingData.ts`](file:///Users/israel/Pro-Baller/src/data/globalScoutingData.ts) | `ScoutingHub`, `generateScoutReports`, `GLOBAL_YOUTH_PROSPECTS`, `GLOBAL_LEAGUE_STANDINGS` | Static data + `player.scoutReports` | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) | [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx), [`ClubRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/ClubRoom.tsx) |
| **12** | Injury & Medical System | [`src/types/injury.ts`](file:///Users/israel/Pro-Baller/src/types/injury.ts), [`src/components/MedicalCenter.tsx`](file:///Users/israel/Pro-Baller/src/components/MedicalCenter.tsx) | `INJURY_CATALOG`, `InjuryDetail`, `MedicalCenter` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`player.activeInjury`, `player.injuryWeeks`) | [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) |
| **13** | Economy, Currency & Tax | [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts), [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts), [`src/utils/taxSystem.ts`](file:///Users/israel/Pro-Baller/src/utils/taxSystem.ts) | `formatCurrency`, `getCountryCurrency`, `calculateTaxBreakdown`, `calculateTaxResidency` | Pure calculation / cached in `player.taxResidency` | None (pure mathematical logic) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx), [`Shop.tsx`](file:///Users/israel/Pro-Baller/src/components/Shop.tsx) |
| **14** | Agent Representation | [`src/components/AgentTerminal.tsx`](file:///Users/israel/Pro-Baller/src/components/AgentTerminal.tsx), [`src/data/agentAgenciesData.ts`](file:///Users/israel/Pro-Baller/src/data/agentAgenciesData.ts) | `AgentTerminal`, `FOOTBALL_AGENCIES`, `AgencyRepresentation` | [`AgentTerminal.tsx`](file:///Users/israel/Pro-Baller/src/components/AgentTerminal.tsx) + `player.agentTerminalHistory` | [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts), [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`ClubRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/ClubRoom.tsx) |
| **15** | Sponsors & Commercial Deals | [`src/data/sponsors.ts`](file:///Users/israel/Pro-Baller/src/data/sponsors.ts), [`src/data/brandAmbassadorData.ts`](file:///Users/israel/Pro-Baller/src/data/brandAmbassadorData.ts), [`src/components/BrandAmbassadorModule.tsx`](file:///Users/israel/Pro-Baller/src/components/BrandAmbassadorModule.tsx) | `SPONSOR_CATALOG`, `BRAND_AMBASSADOR_CATALOG`, `BrandAmbassadorModule` | `player.sponsors`, `player.brandDeals` in [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts) | [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx), [`LifestyleShop.tsx`](file:///Users/israel/Pro-Baller/src/components/LifestyleShop.tsx) |
| **16** | Lifestyle & Daily Routine | [`src/data/dailyRoutineData.ts`](file:///Users/israel/Pro-Baller/src/data/dailyRoutineData.ts), [`src/components/DailyRoutineModule.tsx`](file:///Users/israel/Pro-Baller/src/components/DailyRoutineModule.tsx), [`src/components/Shop.tsx`](file:///Users/israel/Pro-Baller/src/components/Shop.tsx), [`src/components/LifestyleShop.tsx`](file:///Users/israel/Pro-Baller/src/components/LifestyleShop.tsx), [`src/components/LifeShopWindow.tsx`](file:///Users/israel/Pro-Baller/src/components/LifeShopWindow.tsx) | `DIET_PLANS`, `SLEEP_SCHEDULES`, `COMMUNITY_ACTIVITIES`, `Shop`, `LifestyleShop` | `player.dailyRoutine`, `player.lifestyleAssets` in [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx) |
| **17** | Media & Social Feed | [`src/data/socialFeedGenerator.ts`](file:///Users/israel/Pro-Baller/src/data/socialFeedGenerator.ts), [`src/data/newsFeed.ts`](file:///Users/israel/Pro-Baller/src/data/newsFeed.ts), [`src/components/SocialFeedModule.tsx`](file:///Users/israel/Pro-Baller/src/components/SocialFeedModule.tsx), [`src/components/MediaRelations.tsx`](file:///Users/israel/Pro-Baller/src/components/MediaRelations.tsx), [`src/components/PressConference.tsx`](file:///Users/israel/Pro-Baller/src/components/PressConference.tsx) | `generateSocialFeed`, `generateNewsFeed`, `SocialFeedModule`, `MediaRelations`, `PressConference` | `SocialFeedModule.tsx` (`feed` in `useState`), `player.socialFeed` | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx) |
| **18** | National Teams & Eligibility | [`src/data/nationalTeams.ts`](file:///Users/israel/Pro-Baller/src/data/nationalTeams.ts), [`src/components/PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx) (Dual Nat Tab) | `NATIONAL_TEAMS`, `getNationalTeamByName` | `player.dualNationality`, `player.travelPapers` | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) | [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx) |
| **19** | Retirement & Post-Career | [`src/components/RetirementTransitionModal.tsx`](file:///Users/israel/Pro-Baller/src/components/RetirementTransitionModal.tsx), [`src/data/historicalGreats.ts`](file:///Users/israel/Pro-Baller/src/data/historicalGreats.ts), [`src/components/TrophyRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/TrophyRoom.tsx) | `RetirementTransitionModal`, `POST_CAREER_ROLES`, `HISTORICAL_GREATS`, `TrophyRoom` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) (`player.isRetired`, `player.postCareer`) | [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts), `canvas-confetti` | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx), [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx) |
| **20** | Three.js / 3D Graphics | [`src/components/ThreePitchView.tsx`](file:///Users/israel/Pro-Baller/src/components/ThreePitchView.tsx), [`src/components/ThreePlayerAvatar.tsx`](file:///Users/israel/Pro-Baller/src/components/ThreePlayerAvatar.tsx), [`src/components/IntroCinematic.tsx`](file:///Users/israel/Pro-Baller/src/components/IntroCinematic.tsx), [`src/utils/webgl.ts`](file:///Users/israel/Pro-Baller/src/utils/webgl.ts) | `ThreePitchView`, `ThreePlayerAvatar`, `IntroCinematic`, `isWebGLAvailable` | Canvas DOM ref / Component `useState` | `three`, [`src/utils/webgl.ts`](file:///Users/israel/Pro-Baller/src/utils/webgl.ts) | [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx), [`PersonaHQ.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonaHQ.tsx), [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) |
| **21** | Locker Room & Teammates | [`src/components/LockerRoomTeammates.tsx`](file:///Users/israel/Pro-Baller/src/components/LockerRoomTeammates.tsx), [`src/data/clubRosters.ts`](file:///Users/israel/Pro-Baller/src/data/clubRosters.ts) | `LockerRoomTeammates`, `TeammateRelation` | `LockerRoomTeammates.tsx` (`teammates` in `useState`, ephemeral) | [`src/data/clubRosters.ts`](file:///Users/israel/Pro-Baller/src/data/clubRosters.ts), [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | [`App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) |

---

## 4. Major Gameplay Flow Traces

### Flow A: New Career Creation
1. **Trigger:** Initial mount of `App.tsx` checks `loadPlayer()`. If `!saved || !saved.isUserCreated`, `showIntroStory` becomes `true`.
2. **Intro Cinematic:** `IntroCinematic` renders with a 3D animated stadium scene. Clicking "Proceed to Creation" closes the intro and sets `showNewCareerModal(true)`.
3. **User Selection:** `NewCareerModal` captures:
   - Name & Culture: First Name, Last Name, Hometown.
   - Geography: Continent -> Region -> Country (via `WORLD_GEOGRAPHY`). Natural diaspora heritage generates dual nationality.
   - Profile: Position (`ST`, `LW`, `RW`, `CAM`, etc.), Archetype (`Poacher`, `Playmaker`, etc.), Origin (`academy_prodigy`, `street_cage_talent`, etc.), Starting Age (14–18), Starting Club ID.
4. **Player Generation:** [`createNewPlayer(...)`](file:///Users/israel/Pro-Baller/src/utils/gameStorage.ts#L10) creates the fresh object:
   - Assigns position-based baseline attributes (50–75 range).
   - Adds archetype boosts (e.g. +5 finishing/positioning for `Poacher`).
   - Computes overall rating and potential rating (`overallRating + 24`, max 96).
   - Generates initial pro/scholarship contract via [`generateProContract(club, tempPlayer, 'Future Star')`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts#L6).
   - Computes initial tax withholding via [`calculateTaxResidency(...)`](file:///Users/israel/Pro-Baller/src/utils/taxSystem.ts#L160).
   - Assembles initial `person`, `dualNationality`, `travelPapers`, `lifestyleAssets`, and `seasonStats`.
5. **State & Storage Commit:** `App.tsx` calls `clearSavedPlayer()`, updates `setPlayer(fresh)`, saves to `localStorage` (`savePlayer(fresh)`), closes the modal, sets `currentView('PERSONA')`, and displays a welcome banner notice.

### Flow B: Load Existing Career
1. **Mount Hook:** `useEffect` in [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx#L66-L77) calls [`loadPlayer()`](file:///Users/israel/Pro-Baller/src/utils/gameStorage.ts#L224).
2. **Deserialization & Migration:**
   - Reads `localStorage.getItem('career_legend_save_v1')`.
   - Parses JSON into a mutable object.
   - Runs inline defensive migrations to backfill fields introduced across iterations:
     - Backfills `person` (hometown, familyRelations, remittance, discipline).
     - Backfills `dualNationality` (primary country, secondary passport eligibility).
     - Backfills `travelPapers` (passport, GBE work permit, FIFA Art. 19 under-18 clearance).
     - Backfills `preferredCurrency`, `activeInjury`, `recurringInjuryCount`.
     - Normalizes `lifestyleAssets` and `taxResidency`.
     - Sets default daily routine if missing.
   - Re-saves the migrated schema immediately (`savePlayer(p)`).
3. **Application State:** If `p.isUserCreated` is true, sets `setPlayer(p)`, suppresses the intro cinematic, and opens the game directly into the previous active view.

### Flow C: Advance Week Calendar
1. **Trigger:** User clicks "Advance Gameweek" in the `Header` or completes a match.
2. **Execution (`App.tsx` -> `handleAdvanceWeek`):**
   - **Financial Inflow:** Reads `baseWeekly = player.currentContract.weeklyWage`, adds `weeklySponsors = sum(player.sponsors[i].weeklyPay)`.
   - **Tax Deductions:** Calls [`calculateTaxBreakdown(currentClub, grossIncome, agentFeePercent)`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts#L182). Calculates progressive tax withheld and agent representation fee.
   - **Season Limit Check:** Increments `nextWeek = player.currentWeek + 1`. If `nextWeek > 38`, halts gameweek advance and triggers `setShowSeasonSummaryModal(true)`.
   - **Medical Recovery:** If `player.activeInjury` exists, decrements `remainingWeeks -= 1`. If `remainingWeeks <= 0`, clears injury, plays fanfare, and notifies the player of full recovery.
   - **Daily Routine Regeneration:** Resolves active `DietPlan`, `SleepSchedule`, and `CommunityActivity` from [`src/data/dailyRoutineData.ts`](file:///Users/israel/Pro-Baller/src/data/dailyRoutineData.ts):
     - `weeklyEnergyRegen = max(5, sleep.energyRegen + diet.staminaBonus - community.energyCost)`.
     - `restoredEnergy = min(100, player.energy + weeklyEnergyRegen)`.
     - `newSharpness = min(100, max(30, player.matchSharpness - 4 + sleep.sharpnessDelta))`.
     - `finalBankBalance = max(0, player.bankBalance + netIncome - diet.weeklyCostGBP)`.
     - Updates `morale` and `fanReputation` according to active routine.
   - **State Commit:** Invokes `setPlayer(...)` with the consolidated new stats.
   - **HUD Notice:** Displays a summary payday and regen ticker.

### Flow D: Matchday Flow
1. **Fixture Resolution:** [`getCurrentWeekFixture(currentClub, player.currentWeek)`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts#L316) evaluates the legal opponent, tournament category (`DOMESTIC_LEAGUE`, `CHAMPIONS_LEAGUE`, or `DOMESTIC_CUP`), derby status, and substitution regulations.
2. **Pre-Match Briefing:**
   - [`MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) checks fitness (`isInjured`, `isSuspended`, `managerTrust >= 40`, `energy >= 40`) to decide if player starts or sits on the bench.
   - Manager formation and tactical instructions are presented.
3. **Simulation Progression:**
   - User kicks off (`matchPhase = 'LIVE_SIM'`).
   - Clock progresses in 3-minute steps via `setInterval(..., 380ms)`.
   - Tactical attack/defense ratios calculate background goal probabilities.
   - Live events append to the commentary feed.
4. **Interactive Clutch Moments:**
   - At predetermined minutes (e.g. 34', 78'), simulation pauses (`matchPhase = 'DECISION_PAUSED'`).
   - A situation is presented (e.g., "Breakaway 1-on-1 with Keeper").
   - User chooses an action: Low Finesse, Chip/Lob, Near-Post Power, or Square Pass.
   - [`resolveMomentChoice(...)`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts#L148) rolls success against attributes (penalized by in-game fatigue) and updates scores and commentary.
5. **Fatigue & Substitution Decisions:**
   - If player fatigue reaches >65% between min 68–78, a tactical sub prompt alerts the player. The player can accept resting or push through.
6. **Match Conclusion:**
   - Clock reaches 90' or user clicks "Fast-Forward to 90'".
   - [`finishMatch(...)`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx#L535) calls [`simulateMatch(...)`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts#L222) with the unified single-source score.
   - Calculates player match rating (1.0–10.0), card accumulation, bonuses earned, and potential next-match domestic suspension.
7. **Career Consequence (`App.tsx` -> `handleMatchComplete`):**
   - Updates `appearances`, `starts`, `goals`, `assists`, `yellowCards`, `redCards`.
   - Appends rating to `ratingsHistory` and recalculates `avgRating`.
   - Adjusts `managerTrust`, `morale`, `energy`, `matchSharpness`.
   - Bumps `marketValue` (`goals * 800k + assists * 400k`).
   - Advances gameweek calendar (`currentWeek += 1`).
   - Opens optional Post-Match Flash Interview modal.

### Flow E: Contract & Transfer Flow
1. **Inbound Offer Generation:** [`TransferMarket.tsx`](file:///Users/israel/Pro-Baller/src/components/TransferMarket.tsx) queries `CLUBS_DATABASE` for clubs with reputation within `player.overallRating - 6` to `+12`. Generates offers with transfer fees and proposed contracts via `generateProContract`.
2. **Boardroom Negotiation:**
   - In `ClubRoom.tsx` or `ContractDocument.tsx`, user can adjust terms (wages, bonuses, release clauses).
   - Clicking "Submit Counter-Offer" triggers [`evaluateCounterOffer(...)`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts#L130).
   - Club sporting director assesses wage variance. If too demanding (>40% wage rise), patience drops. If patience reaches 0, the club walks out (`REJECTED_WALKOUT`). If within 12%, the club accepts. Otherwise, the club counters halfway.
3. **Signing & Execution:**
   - User signs the contract (`handleSignContract` in `App.tsx`).
   - If a new club: updates `player.currentClubId`, `squadRole`, credits upfront `signingBonus`, and updates `player.taxResidency` to the new host nation.
   - If renewal: updates `currentContract` and credits bonus.

### Flow F: Training & Development Flow
1. **Drill Selection:** In [`TrainingHub.tsx`](file:///Users/israel/Pro-Baller/src/components/TrainingHub.tsx), player selects a drill (e.g. "1v1 Finishing & Precision Volleys") and training intensity (Light, Balanced, Hardcore).
2. **Attribute Roll:**
   - For each target attribute, checks potential headroom: `potentialGap = player.potentialRating - player.overallRating`.
   - Probability roll: `(potentialGap / 30) * 0.45 * intensityMultiplier`.
   - If successful, increments attribute by +1 (capped at 99).
3. **Rating Recalculation:** Re-averages key positional attributes to determine new `overallRating`.
4. **Energy Cost:** Deducts energy (`selectedDrill.energyCost * intensityMultiplier`) and boosts `matchSharpness`.
5. **Private Mentorship:** In [`PersonalCoachHub.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonalCoachHub.tsx), player can book private masterclasses with hired specialists for targeted attribute buffs and special perks.

### Flow G: Injury & Medical Flow
1. **Incidence:** Injuries occur via simulated matchday events or manual diagnostic testing in [`MedicalCenter.tsx`](file:///Users/israel/Pro-Baller/src/components/MedicalCenter.tsx).
2. **Creation:** A template is pulled from [`INJURY_CATALOG`](file:///Users/israel/Pro-Baller/src/types/injury.ts#L20) (e.g. "Hamstring Strain", "ACL Rupture - 28 weeks", "Groin Strain").
3. **Player State Impact:** Sets `player.injuryWeeks = template.initialWeeksOut`, populates `player.activeInjury`, increments `recurringInjuryCount`, and debuffs energy/sharpness.
4. **Rehabilitation Options:**
   - *Club Physio:* Standard weekly decrement (-1 week per gameweek advanced).
   - *Private Specialist Clinic:* Costs £14,000, slashes remaining recovery time by 35%.
   - *Cortisone Injection:* High-risk gamble: 45% chance of doubling recovery time; 55% chance of immediately clearing the injury for this weekend.
5. **Full Recovery:** Once `remainingWeeks <= 0`, medical clearance is issued and player returns to full match availability.

### Flow H: Retirement & Post-Career Flow
1. **Trigger Condition:**
   - Age 35+ reached at season end.
   - Severe recurring injury count >= 2.
   - Voluntary retirement invoked from `PersonaHQ`.
2. **Transition Modal:** [`RetirementTransitionModal.tsx`](file:///Users/israel/Pro-Baller/src/components/RetirementTransitionModal.tsx) opens.
3. **Legacy Evaluation:**
   - Career goals, appearances, trophies, and Ballon d'Or awards are aggregated.
   - Assigns a legacy tier: `IMMORTAL_LEGEND`, `WORLD_CLASS_ICON`, `CLUB_CULT_HERO`, or `PRO_VETERAN`.
4. **Role Selection:** Player selects 1 of 6 post-career vocations:
   - `HEAD_COACH`, `SPORTING_DIRECTOR`, `TV_PUNDIT`, `ACADEMY_FOUNDER`, `PLAYER_AGENT`, `GLOBAL_ENTREPRENEUR`.
5. **State Finalization:** Sets `player.isRetired = true`, attaches `PostCareerProfile`, computes pension payout and testimonial gate receipts, adds funds to `bankBalance`, and inducts player into the Hall of Fame.

---

## 5. State Ownership Audit

### Game-State Owners
| State Category | Current Owner | Mechanism | Persistence Strategy |
|---|---|---|---|
| **Active Player Profile** | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | React `useState<Player \| null>` | Written to `localStorage` on every change via `useEffect` |
| **Active Navigation View** | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | React `useState<GameView>` | Volatile (defaults to `'PERSONA'` on reload) |
| **Sub-Tab Navigation** | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | React `useState` for each domain view | Volatile |
| **Reviewing Transfer Offer** | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | React `useState` (`reviewingContract`) | Volatile |
| **Notification Banners** | [`src/App.tsx`](file:///Users/israel/Pro-Baller/src/App.tsx) | React `useState` (`bannerNotice`) | Volatile |
| **In-Match Simulation State** | [`src/components/MatchView.tsx`](file:///Users/israel/Pro-Baller/src/components/MatchView.tsx) | React `useState` (`minute`, `score`, `events`, `subs`, `cards`) | Ephemeral (resets on match finish) |
| **Boardroom Negotiation State**| [`src/components/ClubRoom.tsx`](file:///Users/israel/Pro-Baller/src/components/ClubRoom.tsx) | React `useState` (`proposedTerms`, `patience`) | Ephemeral (resets on tab close) |
| **Transfer Market Inbound Offers**| [`src/components/TransferMarket.tsx`](file:///Users/israel/Pro-Baller/src/components/TransferMarket.tsx) | React `useState` (`offers`) | **Generated on component mount**; lost on view switch! |
| **Teammate Relationships** | [`src/components/LockerRoomTeammates.tsx`](file:///Users/israel/Pro-Baller/src/components/LockerRoomTeammates.tsx) | React `useState` (`teammates`) | **Generated on component mount**; lost on view switch! |
| **Hired Personal Coaches** | [`src/components/PersonalCoachHub.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonalCoachHub.tsx) | React `useState` (`coaches`) | **Hardcoded initial array**; changes lost on view switch! |
| **Social Media Feed & Posts** | [`src/components/SocialFeedModule.tsx`](file:///Users/israel/Pro-Baller/src/components/SocialFeedModule.tsx) | React `useState` (`feed`) | Partially mirrored to `player.socialFeed` |
| **Agent Chat Messages** | [`src/components/AgentTerminal.tsx`](file:///Users/israel/Pro-Baller/src/components/AgentTerminal.tsx) | React `useState` (`messages`) | Mirrored to `player.agentTerminalHistory` |
| **World Clubs Database** | [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts) | Static array `CLUBS_DATABASE` | Immutable module constant |
| **Club Squad Rosters** | [`src/data/clubRosters.ts`](file:///Users/israel/Pro-Baller/src/data/clubRosters.ts) | Static record `REAL_CLUB_ROSTERS` | Immutable module constant |
| **Historical Greats** | [`src/data/historicalGreats.ts`](file:///Users/israel/Pro-Baller/src/data/historicalGreats.ts) | Static array `HISTORICAL_GREATS` | Immutable module constant |
| **Sound System State** | [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | Class instance `SoundManager` | Module singleton in memory |

### `setPlayer(...)` Mutation Inventory by Domain

Every persistent mutation in the game passes through `setPlayer` in `App.tsx` (either directly or via the `onUpdatePlayer` prop).

```
========================================================================================
DOMAIN                     LOCATION(S)                   MUTATED PROPERTIES
========================================================================================
Career / Time              App.tsx, PersonaHQ            currentWeek, currentYear, age,
                                                         careerHistory, isUserCreated
----------------------------------------------------------------------------------------
Football Performance       App.tsx, MatchView,           seasonStats (appearances, goals,
                           TrainingHub, LockerRoom       assists, cards, avgRating),
                                                         matchSharpness, form
----------------------------------------------------------------------------------------
Attributes & Growth        TrainingHub, Shop,            attributes (pace, finishing,
                           PersonalCoachHub, LockerRoom  passing, etc.), overallRating
----------------------------------------------------------------------------------------
Finances & Economy         App.tsx, ClubRoom, Shop,      bankBalance, totalCareerEarnings,
                           MedicalCenter, PersonaHQ      marketValue, preferredCurrency
----------------------------------------------------------------------------------------
Tax & Residency            App.tsx, AgentTerminal        taxResidency (country, rates,
                                                         totalTaxesPaidCareer, deductions)
----------------------------------------------------------------------------------------
Physical Condition         App.tsx, TrainingHub,         energy, activeInjury, injuryWeeks,
                           MedicalCenter                 injuryName, recurringInjuryCount
----------------------------------------------------------------------------------------
Discipline & Penalties     App.tsx, MatchView            suspensionWeeks, suspensionReason,
                                                         seasonStats.yellowCards/redCards
----------------------------------------------------------------------------------------
Club & Management          App.tsx, ClubRoom,            currentClubId, squadRole,
                           AgentTerminal, PressConf      managerTrust, teamChemistry
----------------------------------------------------------------------------------------
Contracts & Negotiations   App.tsx, ClubRoom,            currentContract (wage, clauses,
                           ContractDocument              bonuses, buyout fee, agent terms)
----------------------------------------------------------------------------------------
Reputation & Media         App.tsx, MediaRelations,      fanReputation, popularity,
                           PressConf, SocialFeed         morale
----------------------------------------------------------------------------------------
Person & Identity          NewCareerModal, PersonaHQ,    person (hometown, relations,
                           Shop                          remittance, discipline, captain)
----------------------------------------------------------------------------------------
Travel & Bureaucracy       PersonaHQ, Shop               travelPapers (passport, visa,
                                                         GBE points, tournament clear)
----------------------------------------------------------------------------------------
Dual Nationality & Senior  NewCareerModal, PersonaHQ,    dualNationality (countries,
                           Shop                          declaredSenior, caps, goals)
----------------------------------------------------------------------------------------
Lifestyle & Routine        DailyRoutineModule, Shop,     dailyRoutine (diet, sleep),
                           LifestyleShop                 lifestyleAssets, sponsors
----------------------------------------------------------------------------------------
Social & Representation    AgentTerminal, SocialFeed     agentTerminalHistory, socialFeed,
                                                         scoutReports, brandDeals
----------------------------------------------------------------------------------------
Retirement & Legacy        App.tsx, PersonaHQ,           isRetired, postCareer,
                           RetirementTransitionModal     trophyCabinet, awards
========================================================================================
```

**Architectural Coupling Insight:** The entire simulation state is coupled to React's component tree. The fact that `LockerRoomTeammates`, `TransferMarket`, and `PersonalCoachHub` own state in local `useState` hooks means that navigating away from those tabs destroys that state unless it was pushed into `Player`.

---

## 6. Type and Domain Model Audit

[`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) (707 lines) contains 32 exported interfaces/types.

### Categorized Type Registry

#### 1. Player Domain
- `Position` — 10 football positions (`ST`, `LW`, `RW`, `CAM`, `CM`, `CDM`, `LB`, `RB`, `CB`, `GK`).
- `PlayerArchetype` — 8 tactical archetypes (`Poacher`, `Playmaker`, `Speed Demon`, etc.).
- `PlayerOrigin` — 4 player background archetypes.
- `PlayerAttributes` — 23 numeric attributes divided into Physical (6), Technical (10), Mental (7).
- `SquadRole` — 6 contract/squad hierarchy levels.
- `Player` — Master interface (616 lines, 50+ fields).

#### 2. Club & Roster Domain
- `Club` — Team metadata, tier, reputation, stadium, manager, budgets, playstyle, rival.
- `SquadPlayer` (in `clubRosters.ts`) — Simplified player record for AI teammates/opponents.
- `ClubRosterData` (in `clubRosters.ts`) — Starting XI and Bench rosters.

#### 3. Contract & Negotiation Domain
- `ContractClauses` — 30 distinct remuneration, bonus, buyout, loyalty, and agent fee clauses.
- `TransferOffer` — Inbound bid structure including transfer fee and proposed contract clauses.

#### 4. Match & Simulation Domain
- `MatchDecisionMoment` — Interactive clutch moment with situation, minute, and attribute-tested choices.
- `MatchLiveEvent` — Live event ticker entry (goals, cards, commentary).
- `MatchSimulationResult` — Full post-match record with scores, stats, fatigue loss, earnings.
- `HeatmapZone` — Spatial 2D touch intensity for tactical telemetry.
- `PassingAction` — 2D vector for passing radar maps.
- `TacticalTelemetry` — Match telemetry containing high-speed sprints, xG, xA, and maps.

#### 5. Tactics Domain
- `FormationType` — 5 supported team formations (`4-3-3`, `4-2-3-1`, `3-5-2`, `4-4-2`, `5-3-2`).
- `TacticalBriefing` — Formation, mentality, tempo, pressing tactics with multipliers.

#### 6. Career & History Domain
- `SeasonRecord` — Completed season statistics, awards, trophies, and wages.
- `LegacyMilestone` (in `historicalGreats.ts`) — Career achievement tracker.
- `HistoricalGreat` (in `historicalGreats.ts`) — Benchmarks (Pelé, Maradona, Messi, Ronaldo).

#### 7. Daily Routine & Health Domain
- `DietPlanId`, `DietPlan` — 5 nutrition regimes with weekly costs and attribute deltas.
- `SleepScheduleId`, `SleepSchedule` — 4 sleep protocols with energy/morale recovery deltas.
- `CommunityEngagementId`, `CommunityActivity` — 5 civic activities with energy costs and rep buffs.
- `PlayerDailyRoutine` — Player's active routine selection.
- `InjuryDetail`, `InjurySeverity` (in `injury.ts`) — Injury diagnosis, recovery weeks, treatment methods.

#### 8. Representation & Scouting Domain
- `AgencyTier`, `AgencyRepresentation` — 4 agency tiers with reputation, influence, and perks.
- `AgentMessage` — In-terminal chat thread messages.
- `ScoutReport` — Inbound club scouting assessment with grades, pros, cons, and valuations.
- `GlobalScoutProspect` (in `globalScoutingData.ts`) — World wonderkid prospect data.

#### 9. Commercial & Media Domain
- `SponsorDeal` — Brand sponsorship deals (boots, apparel, tech).
- `BrandAmbassadorDeal` — Global commercial contracts with signing fees and annual retainers.
- `SocialPost`, `SocialInteractionOption` — Social media pulse with player interaction choices.
- `NewsArticle` — Football news aggregator feed item.

#### 10. Retirement & Post-Career Domain
- `PostCareerRole` — 6 vocations (`HEAD_COACH`, `SPORTING_DIRECTOR`, `TV_PUNDIT`, etc.).
- `LegacyStatusTier` — 4 status tiers (`IMMORTAL_LEGEND`, `WORLD_CLASS_ICON`, etc.).
- `PostCareerProfile` — Post-playing career summary, pension, and testimonial results.

#### 11. Presentation & View Navigation Domain
- `GameView` — 13 top-level application navigation view states.

### Critical Type-Design Flaws Identified
1. **The `Player` Interface is Too Monolithic:**
   `Player` mixes:
   - Fundamental identity (name, age, position, nationality).
   - Core physical condition (energy, morale, match sharpness, active injury).
   - Attributes (23 individual ratings).
   - Off-pitch biography (`person`, `dualNationality`, `travelPapers`).
   - Active contract & finances (`currentContract`, `bankBalance`, `taxResidency`).
   - Dynamic season stats (`seasonStats`).
   - Historical records (`careerHistory`, `trophyCabinet`, `awards`).
   - UI and presentation cache (`socialFeed`, `lastMatchTelemetry`, `agentTerminalHistory`).
2. **Schema Inconsistency in `lifestyleAssets`:**
   In `src/types/game.ts`:
   ```typescript
   lifestyleAssets: {
     residence: string;
     car: string;
     charityFounded: boolean;
     personalBrandLevel: number;
   };
   ```
   In `src/utils/gameStorage.ts`:
   ```typescript
   p.lifestyleAssets = {
     residenceTier: 'Youth Academy Dormitory',
     vehiclesOwned: [],
     luxuryWatches: 0,
     privateChef: false,
     financialAdvisor: false,
     socialMediaManager: false,
     charityFounded: false,
     ownedItemIds: [],
   };
   ```
   In `src/components/Shop.tsx`:
   Accesses `player.lifestyleAssets.ownedItemIds` and casts with `as any`.
3. **Optional Fields Hiding Uninitialized State:**
   Fields such as `taxResidency`, `dailyRoutine`, `socialFeed`, `brandDeals`, `scoutReports`, `parentalRelocation`, `activeInjury`, and `lastMatchTelemetry` are all optional (`?`). Components throughout the app frequently write fallback guards (`player.taxResidency?.totalTaxesPaidCareer || 0`) because the type definition does not enforce invariants.
4. **Presentation Types Mixed into Simulation Types:**
   `GameView` (routing enum) and `HeatmapZone` (pixel coordinate rendering data) sit directly alongside core simulation models like `Player` and `ContractClauses`.

---

## 7. Simulation Purity Audit

| Module | Classification | Purity Assessment & Coupling Analysis |
|---|---|---|
| [`src/utils/matchEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts) | **PURE DOMAIN LOGIC** | Pure deterministic & stochastic calculations. Zero DOM, zero React, zero browser globals. Uses only `Math.random()`. **100% Web Worker ready.** |
| [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts) | **PURE DOMAIN LOGIC** | Generates calendar fixtures, validates competition eligibility, maps rosters. Zero browser dependencies. **100% Web Worker ready.** |
| [`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts) | **PURE DOMAIN LOGIC** | Rule lookup and card suspension math. Pure functions. **100% Web Worker ready.** |
| [`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts) | **PURE DOMAIN LOGIC** | Generates contract clauses and evaluates bargaining offers. Pure functions. **100% Web Worker ready.** |
| [`src/utils/currency.ts`](file:///Users/israel/Pro-Baller/src/utils/currency.ts) | **PURE DOMAIN LOGIC** | Currency conversion rates and formatting helpers. Pure functions. |
| [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts) | **PURE DOMAIN LOGIC** | Mathematical tax brackets and agent deduction math. Pure functions. **100% Web Worker ready.** |
| [`src/utils/taxSystem.ts`](file:///Users/israel/Pro-Baller/src/utils/taxSystem.ts) | **PURE DOMAIN LOGIC** | Duplicate of `taxResidency.ts`. Pure functions. |
| [`src/utils/gameStorage.ts`](file:///Users/israel/Pro-Baller/src/utils/gameStorage.ts) | **BROWSER COUPLED** | Directly invokes `window.localStorage` (`localStorage.getItem`, `setItem`, `removeItem`). Cannot run inside a standard Web Worker without abstraction or `IndexedDB`. |
| [`src/utils/soundFx.ts`](file:///Users/israel/Pro-Baller/src/utils/soundFx.ts) | **BROWSER COUPLED** | Requires `window.AudioContext` / `webkitAudioContext`. Must remain strictly on the Main Thread. |
| [`src/utils/webgl.ts`](file:///Users/israel/Pro-Baller/src/utils/webgl.ts) | **BROWSER COUPLED** | Accesses `document.createElement('canvas')` and `canvas.getContext('webgl')`. Must remain on the Main Thread. |

---

## 8. Persistence Architecture

### Current Implementation
- **Storage Backend:** Browser `localStorage`.
- **Storage Key:** `'career_legend_save_v1'`.
- **Data Format:** Single monolithic JSON string representing the entire `Player` object.
- **Write Trigger:** `useEffect` in `src/App.tsx` triggers on every mutation of `player`.

### Persistence Strengths
- **Simplicity:** Zero setup, instant synchronous read on page load.
- **Defensive Migrations:** [`loadPlayer()`](file:///Users/israel/Pro-Baller/src/utils/gameStorage.ts#L224-L310) contains backward-compatibility backfills for nested properties (`person`, `dualNationality`, `travelPapers`, `taxResidency`).

### Critical Risks & Limitations
1. **Storage Quota Wall:** `localStorage` is synchronously limited to ~5 MB across most browsers. As the career simulation expands with multi-season match histories, NPC careers, and world league tables, a single JSON string will exceed this quota.
2. **Main Thread Blocking:** `JSON.stringify(player)` runs synchronously on the main thread after every player update. Large objects will cause frame drops and UI stuttering.
3. **No Multi-Save Slot Support:** Hardcoded single key `'career_legend_save_v1'` prevents players from maintaining multiple careers.
4. **Lack of World State Persistence:** Only the user's `Player` is saved. The rest of the football world (other clubs' results, league standings, NPC player progressions) is not persisted at all.

---

## 9. Client-Heavy Web Readiness

To support the product vision of a deep, living football world running locally without a heavy server, the application will eventually need a clean separation between UI and background simulation.

```
+-----------------------------------------------------------------------------------------+
|                                    TARGET EXECUTION MATRIX                              |
|                                                                                         |
|  [ MAIN THREAD (UI & PRESENTATION) ]                   [ WEB WORKER (SIMULATION CORE) ]  |
|  * React 19 UI Components                              * World League Progression       |
|  * User Input & Form State                             * Fixture Processing & Sim       |
|  * Three.js Rendering (Pitch, Avatar)                  * Background Match Engine        |
|  * Web Audio API (soundFx.ts)                          * NPC Career Evolution           |
|  * Canvas Confetti                                     * AI Club Transfer Logic         |
|                       \                                      /                          |
|                        \---- [ SERIALIZATION BOUNDARY ] ----/                           |
|                                     (Structured Clone)                                  |
|                                              |                                          |
|                                   [ LOCAL PERSISTENCE ]                                 |
|                                   * IndexedDB via idb                                   |
|                                   * Multi-slot career saves                             |
|                                   * World state snapshots                               |
+-----------------------------------------------------------------------------------------+
```

### Readiness Evaluation
- **Ready for Immediate Worker Migration:**
  `matchEngine.ts`, `LeagueEngine.ts`, `contractGenerator.ts`, `LeagueRuleSet.ts`, and `taxResidency.ts` are pure functions. They can already be invoked inside a Web Worker.
- **Serialization Boundaries:**
  The simulation data transferred across `postMessage` must consist of plain JSON-serializable objects (Player, MatchSimulationResult, ScheduledFixture). The current models satisfy this requirement (no DOM elements, functions, or circular references).
- **Migration Blockers:**
  Currently, game progression is driven by React callbacks (`handleAdvanceWeek`, `handleMatchComplete`) inside `App.tsx`. A headless game loop and state container must be created before Web Workers can be introduced.

---

## 10. Existing Strengths

The codebase possesses several notable qualities that must be preserved:

1. **Rich Pro Footballer Contract Clause Modeling:**
   [`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts) and [`src/types/game.ts`](file:///Users/israel/Pro-Baller/src/types/game.ts) model genuine professional football contract structures: appearance bonuses, clean sheet clauses, wage escalators upon promotion/relegation, minimum release clauses (with Spanish mandatory buyouts), Ballon d'Or wage triggers, and agent representation commissions.
2. **Real-World Global Tax Residency Simulation:**
   [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts) models authentic athlete taxation across 11 nations (UK HMRC 47%, Spanish IRPF 47%, Italian IRPEF 45%, German Reichensteuer 47.5%, Saudi Arabia 0% tax haven, Brazilian CLT/Image Rights split). Transferring to a new country dynamically recalculates net wages.
3. **Competition Calendar & Legal Matchup Validation:**
   [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts) generates authentic 38-week schedules interweaving domestic league fixtures, Champions League matchdays (for Tier 1 qualified clubs), and sudden-death cup ties, while strictly preventing illegal cross-division matchups.
4. **Disciplinary Card Accumulation & Substitution Policies:**
   [`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts) authentically models real-world league rules: Premier League 5-yellow card amnesties before Gameweek 19, Italian FIGC progressive bans, and in-play substitution stoppage windows (e.g. 5 subs in 3 windows).
5. **Human-Centric Character & Bureaucracy RPG Elements:**
   The game captures the human being behind the athlete: sending remittances to parents, dual-nationality allegiance decisions, and realistic travel bureaucracy (GBE work permit points, Schengen visas, and FIFA Article 19 minor clearances).

---

## 11. Technical Risks

1. **TypeScript Build Failure in `MatchView.tsx`:**
   `tsc --noEmit` fails with 7 errors due to undeclared identifiers (`selectedFormation`, `setSelectedFormation`, etc.). This breaks CI/CD typechecking and must be resolved before further development.
2. **God Component Anti-Pattern in `App.tsx`:**
   `App.tsx` (751 lines) combines career initialization, routing, weekly scheduling, wage/tax calculation, medical recovery, auto-saving, and match completion into a single React component.
3. **Synchronous `localStorage` Quota Exhaustion:**
   Storing all career data in a single `localStorage` key will hit browser limits as historical match logs and stats accumulate.
4. **Orphaned Component Waste:**
   Over 1,270 lines of code across [`ContractDocument.tsx`](file:///Users/israel/Pro-Baller/src/components/ContractDocument.tsx) (756 lines), [`PlayerProfile.tsx`](file:///Users/israel/Pro-Baller/src/components/PlayerProfile.tsx) (303 lines), and [`PressConference.tsx`](file:///Users/israel/Pro-Baller/src/components/PressConference.tsx) (218 lines) are completely unimported and abandoned in the codebase.
5. **Ephemeral State Loss in Secondary Modules:**
   Teammate chemistry ([`LockerRoomTeammates.tsx`](file:///Users/israel/Pro-Baller/src/components/LockerRoomTeammates.tsx)), inbound transfer offers ([`TransferMarket.tsx`](file:///Users/israel/Pro-Baller/src/components/TransferMarket.tsx)), and hired coaches ([`PersonalCoachHub.tsx`](file:///Users/israel/Pro-Baller/src/components/PersonalCoachHub.tsx)) reside only in local `useState` hooks and reset when switching views.

---

## 12. Data Consistency Risks

1. **Duplicate Club IDs in `CLUBS_DATABASE`:**
   In [`src/data/clubs.ts`](file:///Users/israel/Pro-Baller/src/data/clubs.ts):
   - `id: 'sunderland'` exists at Line 451 (Tier 3, Rep 73) and Line 1152 (Tier 2, Rep 79).
   - `id: 'southampton'` exists at Line 487 (Tier 3, Rep 75) and Line 1134 (Tier 2, Rep 80).
   - `id: 'santos_fc'` exists at Line 689 (Tier 3, Rep 74) and Line 761 (Tier 3, Rep 77).
   When `getClubById('sunderland')` is called, JavaScript returns the first match, shadowing the second definition.
2. **Duplicate Tax Computation Engines:**
   [`src/utils/taxSystem.ts`](file:///Users/israel/Pro-Baller/src/utils/taxSystem.ts) and [`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts) implement overlapping country tax brackets with different interface field names (`taxWithheld` vs `taxDeductedWeekly`, `netWeekly` vs `netWeeklyWage`).
3. **Duplicate League Rules Repositories:**
   [`src/data/leagueRules.ts`](file:///Users/israel/Pro-Baller/src/data/leagueRules.ts) (`LEAGUE_RULES_REGISTRY`) is completely orphaned, while [`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts) (`LEAGUE_RULE_SETS`) is actively used.
4. **Hardcoded 38-Week Season Calendar:**
   [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts) generates 38 weeks for all leagues. In reality:
   - Championship has 46 fixtures (24 clubs).
   - Bundesliga and Ligue 1 have 34 fixtures (18 clubs).
   This causes calendar mismatch when playing in German or French leagues.
5. **No Date / Birthday Engine:**
   Player age is only updated at season rollover (`player.age + 1`). There are no player birthdays, calendar dates, or seasonal months.
6. **Schema Discrepancy in `lifestyleAssets`:**
   `createNewPlayer` initializes `{ residence, car, charityFounded, personalBrandLevel }`, while `loadPlayer` migrates to `{ residenceTier, vehiclesOwned, luxuryWatches, privateChef, ... }`.

---

## 13. Missing and Partial Systems

| System | Status | Current Reality in Codebase |
|---|---|---|
| **Player Attributes & Progression** | **Substantially Implemented** | 23 attributes, archetypes, dynamic training drills, matchday fatigue penalties, rating calculations. |
| **Contract & Negotiation Engine** | **Substantially Implemented** | Clauses, buyouts, bonuses, multi-round board bargaining, counter-offers, wage drops on relegation. |
| **Tax Residency & Wage Deductions** | **Substantially Implemented** | Real-world withholding across 11 nations, agent fee deductions, tax haven status. |
| **Matchday Simulation & Moments** | **Substantially Implemented** | Poisson goal distribution, tactical ratings, interactive clutch choices, stoppage windows, cards. |
| **Daily Routine & Energy Recovery** | **Substantially Implemented** | Diets, sleep schedules, community activities affecting weekly stamina and sharpness. |
| **Disciplinary & Card Accumulation**| **Substantially Implemented** | Yellow card thresholds, red card domestic bans, amnesty cutoff weeks. |
| **3D Stadium & Pitch Visualization**| **Substantially Implemented** | Three.js pitch markings, stadium floodlights, mown grass stripes, camera rotations. |
| **Transfer Market & Club Bids** | **Partially Implemented** | Inbound offers generate correctly, but are not persisted across tab views; no AI-to-AI transfer market. |
| **Injury & Rehabilitation** | **Partially Implemented** | Detailed catalog and specialist clinics, but injuries only decrement once per week with no lingering physical scar tissue. |
| **Teammate & Locker Room Dynamics** | **Partially Implemented** | Linkup drills and banter exist, but relationships are stored in ephemeral component state. |
| **Scouting Network** | **Partially Implemented** | Reports and global wonderkids catalog exist, but reports are static generators rather than an evolving scout network. |
| **Retirement & Post-Career** | **Partially Implemented** | Modals, testimonials, pension, and 6 vocations exist, but post-career gameplay is not playable. |
| **Multi-Season World Simulation** | **UI / Prototype Only** | Standings tables in `globalScoutingData.ts` are hardcoded mock data. Non-player fixtures are not simulated. |
| **AI Club Transfers & Autonomous Market** | **Missing** | Other clubs never trade players between themselves; squads remain static. |
| **Promotion and Relegation** | **Missing** | Clubs never change leagues or tiers between seasons. |
| **Persistent Match History / Box Scores**| **Missing** | Individual match results and goal scorers are not stored in career history; only aggregate season stats. |
| **Goalkeeper-Specific Gameplay** | **Missing** | Goalkeepers share the same outfield simulation and moment types. |
| **Calendar / Real-Time Date Engine** | **Missing** | Simulation runs on abstract `currentWeek` (1–38) with no real calendar dates. |

---

## 14. Recommended Refactor Order

To avoid disrupting working systems, refactoring should proceed in phased, isolated batches:

```
Batch 1: Fix Typecheck & Consolidate Dead Code / Duplicates
  * Fix the 7 TS errors in MatchView.tsx
  * Remove or unify duplicate clubs in clubs.ts
  * Consolidate taxSystem.ts into taxResidency.ts
  * Remove orphaned data files (data/leagueRules.ts)
  * Ensure `tsc --noEmit` and `vite build` both pass with 0 errors

Batch 2: Domain Model & Type Decomposition
  * Split types/game.ts into focused domain files:
    - types/player.ts, types/club.ts, types/contract.ts, types/match.ts, types/tactics.ts
  * Re-export from index for backward compatibility
  * Normalize lifestyleAssets schema

Batch 3: Decouple Simulation State from App.tsx
  * Extract Player state and action handlers into a dedicated simulation store/service
  * Decouple weekly progression math from React rendering
  * Turn App.tsx into a clean presentation shell and router

Batch 4: Robust Persistence Layer
  * Abstract storage into an asynchronous persistence interface
  * Introduce multi-slot saves
  * Migrate from localStorage to IndexedDB

Batch 5: Persist Sub-Module States
  * Move teammate relations, inbound transfer offers, and hired coaches into persistent player state

Batch 6: Client-Heavy Web Worker Simulation
  * Move world fixture processing and background match simulation into a dedicated Web Worker
```

---

## 15. Systems That Must NOT Be Rewritten

The following modules represent well-modeled, battle-tested domain logic that should be preserved:

1. **[`src/utils/contractGenerator.ts`](file:///Users/israel/Pro-Baller/src/utils/contractGenerator.ts):**
   The wage equations, squad role assignments, release clause logic, and counter-offer negotiation formulas are balanced and working well.
2. **[`src/utils/taxResidency.ts`](file:///Users/israel/Pro-Baller/src/utils/taxResidency.ts):**
   The 11-country athlete tax system with agent fee splits and tax haven exemptions is accurate and stable.
3. **[`src/utils/matchEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/matchEngine.ts):**
   The Poisson expected goals formula, match rating calculation (1.0–10.0), and moment resolution are well calibrated.
4. **[`src/utils/LeagueRuleSet.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueRuleSet.ts) & [`src/utils/LeagueEngine.ts`](file:///Users/israel/Pro-Baller/src/utils/LeagueEngine.ts):**
   Competition qualification rules, UCL extra-time substitution standards, and calendar generation function reliably.
5. **[`src/types/injury.ts`](file:///Users/israel/Pro-Baller/src/types/injury.ts) (`INJURY_CATALOG`):**
   The medical taxonomy (anatomical body parts, initial weeks out, treatment pathways) is sound and authentic.
6. **[`src/components/ThreePitchView.tsx`](file:///Users/israel/Pro-Baller/src/components/ThreePitchView.tsx) & [`src/components/ThreePlayerAvatar.tsx`](file:///Users/israel/Pro-Baller/src/components/ThreePlayerAvatar.tsx):**
   The Three.js rendering pipelines with procedural geometry, floodlighting, and WebGL context detection are working and performant.

---

## 16. Proposed Target Architecture

The current repository can evolve incrementally toward the target architecture:

```
src/
  app/                          <-- Navigation, layout, views, routing
    Header.tsx
    Sidebar.tsx
    App.tsx (thin presentation shell)

  core/                         <-- Headless simulation engine & state
    state/                      <-- Career state container
    persistence/                <-- Storage interface (IndexedDB / localStorage)
    time/                       <-- Gameweek & calendar calendar controller

  football/                     <-- Football domain simulation
    players/                    <-- Player generation & attributes
    clubs/                      <-- Clubs database & rosters
    competitions/               <-- League rule sets & qualification
    matches/                    <-- Match engine & telemetry
    tactics/                    <-- Tactical briefings & formations
    transfers/                  <-- Transfer offers & AI market

  career/                       <-- Player career mechanics
    contracts/                  <-- Contract generation & negotiation
    training/                   <-- Drills & coaching staff
    injuries/                   <-- Injury catalog & rehabilitation
    nationalTeam/               <-- Dual nationality & call-ups

  life/                         <-- Off-pitch RPG & finances
    finance/                    <-- Multi-currency & tax residency
    lifestyle/                  <-- Pro shop & daily routine
    media/                      <-- Social feed & press interviews
    sponsors/                   <-- Brand ambassadorships & boot deals

  workers/                      <-- Background thread execution
    simulation.worker.ts        <-- Off-main-thread world simulation
```

This destination can be reached gradually without breaking existing components.

---

## 17. Recommended Next Batch

### Recommended Batch: **WEB FOUNDATION BATCH 1 — TYPE SANITIZATION & BUILD STABILIZATION**

Before extracting state from `App.tsx` or moving logic into Web Workers, the codebase must have a clean, passing typecheck and unified domain contracts:

1. **Resolve 7 TypeScript Errors in `MatchView.tsx`:**
   Declare the missing state variables (`selectedFormation`, `setSelectedFormation`, `tacticalMentality`, etc.) or link them cleanly to the existing `managerFormation` and tactical focus configuration.
2. **De-duplicate `src/data/clubs.ts`:**
   Resolve the duplicate IDs for `sunderland`, `southampton`, and `santos_fc`.
3. **Consolidate Duplicate Tax Modules:**
   Merge `src/utils/taxSystem.ts` into `src/utils/taxResidency.ts` and standardize the property names.
4. **Remove Dead Modules:**
   Prune orphaned files (`src/data/leagueRules.ts`) or hook them into their active counterparts.
5. **Harmonize `lifestyleAssets` Schema:**
   Align the schema in `types/game.ts`, `gameStorage.ts`, and `Shop.tsx` to eliminate unsafe `as any` casts.
6. **Verify Clean Gates:**
   Ensure both `tsc --noEmit` and `vite build` complete with **0 errors**.
