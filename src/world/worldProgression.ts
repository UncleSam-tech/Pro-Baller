import { validateCompetitionSeasonState } from '../competition/seasonEngine';
import type {
  CompetitionFixtureResult,
  CompetitionRuleSet,
  CompetitionSchedule,
  CompetitionSeasonState,
  ScheduledCompetitionFixture,
} from '../competition/types';
import type {
  CompetitionProgressSummary,
  FootballWorldAdvanceResult,
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
  WorldFixtureParticipation,
  WorldFixtureMatchDetail,
  WorldFootballPosition,
  WorldPlayerFootballState,
} from './types';
import {
  selectMatchTeamSquad,
  createFixtureParticipation,
  resolveRuleSetBenchSize,
} from './matchSquadSelection';
import {
  applyDailyRecovery,
  applyMatchConditionEffects,
} from './playerCondition';
import { validateWorldPlayerFootballStates } from './playerFootballState';
import {
  type LineupQuality,
  computeLineupQuality,
  computeClubReferenceLineupQuality,
  computeLineupStrengthModifiers,
} from './lineupStrength';
import { generateFixtureMatchDetail } from './matchEvents';
import {
  isDevelopmentCheckpointDate,
  applyMonthlyWorldPlayerDevelopment,
} from './playerDevelopment';

// ============================================================================
// SIMULATION CONSTANTS
// ============================================================================

/** Fallback goals per team per match when a league has 0 historical matches */
export const DEFAULT_LEAGUE_GOALS_PER_TEAM = 1.35;

/** Weight (in matches) of the league prior when smoothing team attack/defense rates */
export const PRIOR_MATCHES_WEIGHT = 3.0;

/** Multiplier applied to expected goals for the home team */
export const HOME_ADVANTAGE_FACTOR = 1.15;

/** Multiplier applied to expected goals for the away team */
export const AWAY_ADVANTAGE_FACTOR = 0.88;

/** Clamping limits for expected goals to prevent extreme Poisson parameters */
export const MIN_EXPECTED_GOALS = 0.25;
export const MAX_EXPECTED_GOALS = 4.5;

// ============================================================================
// DETERMINISTIC SEEDED PRNG & POISSON SAMPLER
// ============================================================================

/**
 * 32-bit FNV-1a string hashing function.
 */
export function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Mulberry32 32-bit deterministic uniform PRNG returning [0, 1).
 */
export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Exact Knuth Poisson goal sampler using a deterministic PRNG stream.
 * Guarantees a non-negative integer.
 */
function samplePoisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1.0;
  do {
    k++;
    p *= rng();
  } while (p > L && k < 15);
  return k - 1;
}

// ============================================================================
// TEAM STRENGTH SNAPSHOT
// ============================================================================

interface TeamMatchStats {
  played: number;
  scored: number;
  conceded: number;
}

interface CompetitionStrengthSnapshot {
  leagueGoalsPerTeam: number;
  teamStats: Map<string, TeamMatchStats>;
}

/**
 * Computes pre-round team strength snapshot from current results in the competition.
 * Called once per competition round before any fixtures in that round are simulated.
 */
export function computeStrengthSnapshot(results: CompetitionFixtureResult[]): CompetitionStrengthSnapshot {
  const teamStats = new Map<string, TeamMatchStats>();

  function getStats(teamId: string): TeamMatchStats {
    let s = teamStats.get(teamId);
    if (!s) {
      s = { played: 0, scored: 0, conceded: 0 };
      teamStats.set(teamId, s);
    }
    return s;
  }

  let totalGoals = 0;
  for (const r of results) {
    const home = getStats(r.homeTeamId);
    const away = getStats(r.awayTeamId);

    home.played += 1;
    home.scored += r.homeGoals;
    home.conceded += r.awayGoals;

    away.played += 1;
    away.scored += r.awayGoals;
    away.conceded += r.homeGoals;

    totalGoals += r.homeGoals + r.awayGoals;
  }

  const totalMatches = results.length;
  const leagueGoalsPerTeam =
    totalMatches > 0 ? totalGoals / (2 * totalMatches) : DEFAULT_LEAGUE_GOALS_PER_TEAM;

  return { leagueGoalsPerTeam, teamStats };
}

/**
 * Computes expected goals for home and away teams in a fixture based on pre-round strength snapshot.
 */
export interface MatchExpectedGoalsModifiers {
  homeAttackMultiplier?: number;
  homeDefensiveResistanceMultiplier?: number;
  awayAttackMultiplier?: number;
  awayDefensiveResistanceMultiplier?: number;
}

/**
 * Computes expected goals for home and away teams in a fixture based on pre-round strength snapshot,
 * with optional lineup strength modifiers.
 */
export function computeExpectedGoals(
  snapshot: CompetitionStrengthSnapshot,
  homeTeamId: string,
  awayTeamId: string,
  modifiers?: MatchExpectedGoalsModifiers
): { homeXg: number; awayXg: number } {
  const { leagueGoalsPerTeam, teamStats } = snapshot;

  const homeStats = teamStats.get(homeTeamId) ?? { played: 0, scored: 0, conceded: 0 };
  const awayStats = teamStats.get(awayTeamId) ?? { played: 0, scored: 0, conceded: 0 };

  const homeSmoothedScored =
    (homeStats.scored + PRIOR_MATCHES_WEIGHT * leagueGoalsPerTeam) /
    (homeStats.played + PRIOR_MATCHES_WEIGHT);
  const homeSmoothedConceded =
    (homeStats.conceded + PRIOR_MATCHES_WEIGHT * leagueGoalsPerTeam) /
    (homeStats.played + PRIOR_MATCHES_WEIGHT);

  const awaySmoothedScored =
    (awayStats.scored + PRIOR_MATCHES_WEIGHT * leagueGoalsPerTeam) /
    (awayStats.played + PRIOR_MATCHES_WEIGHT);
  const awaySmoothedConceded =
    (awayStats.conceded + PRIOR_MATCHES_WEIGHT * leagueGoalsPerTeam) /
    (awayStats.played + PRIOR_MATCHES_WEIGHT);

  const homeAttack = homeSmoothedScored / leagueGoalsPerTeam;
  const homeDefense = homeSmoothedConceded / leagueGoalsPerTeam;

  const awayAttack = awaySmoothedScored / leagueGoalsPerTeam;
  const awayDefense = awaySmoothedConceded / leagueGoalsPerTeam;

  const homeAttackMult = modifiers?.homeAttackMultiplier ?? 1.0;
  const homeDefResistanceMult = modifiers?.homeDefensiveResistanceMultiplier ?? 1.0;
  const awayAttackMult = modifiers?.awayAttackMultiplier ?? 1.0;
  const awayDefResistanceMult = modifiers?.awayDefensiveResistanceMultiplier ?? 1.0;

  const effectiveHomeAttack = homeAttack * homeAttackMult;
  const effectiveAwayDefense =
    awayDefResistanceMult > 0 ? awayDefense / awayDefResistanceMult : awayDefense;

  const effectiveAwayAttack = awayAttack * awayAttackMult;
  const effectiveHomeDefense =
    homeDefResistanceMult > 0 ? homeDefense / homeDefResistanceMult : homeDefense;

  const rawHomeXg = leagueGoalsPerTeam * effectiveHomeAttack * effectiveAwayDefense * HOME_ADVANTAGE_FACTOR;
  const rawAwayXg = leagueGoalsPerTeam * effectiveAwayAttack * effectiveHomeDefense * AWAY_ADVANTAGE_FACTOR;

  return {
    homeXg: Math.max(MIN_EXPECTED_GOALS, Math.min(MAX_EXPECTED_GOALS, rawHomeXg)),
    awayXg: Math.max(MIN_EXPECTED_GOALS, Math.min(MAX_EXPECTED_GOALS, rawAwayXg)),
  };
}

// ============================================================================
// DATE & CALENDAR HELPERS
// ============================================================================

export function isValidCalendarDate(dateStr: string): boolean {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return (
    parsed.getUTCFullYear() === y &&
    parsed.getUTCMonth() + 1 === m &&
    parsed.getUTCDate() === d
  );
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildCompetitionFixtureDateMap(
  seasonState: CompetitionSeasonState,
  baseDate: string = '2026-10-07'
): Map<string, string> {
  const dateMap = new Map<string, string>();
  if (seasonState.fixtureDates) {
    for (const fd of seasonState.fixtureDates) {
      if (fd.scheduledDate && fd.scheduledDate.trim() !== '') {
        dateMap.set(fd.fixtureId, fd.scheduledDate);
      }
    }
  }

  const allFixtures = seasonState.schedule.rounds.flatMap((r) => r.fixtures);
  const undatedFixtures = allFixtures.filter((f) => !dateMap.has(f.id));
  if (undatedFixtures.length === 0) {
    return dateMap;
  }

  let latestKnownDate: string | undefined;
  for (const d of dateMap.values()) {
    if (!latestKnownDate || d > latestKnownDate) {
      latestKnownDate = d;
    }
  }

  const effectiveBase =
    latestKnownDate && latestKnownDate > baseDate ? latestKnownDate : baseDate;
  const firstMatchday = addDaysToDate(effectiveBase, 7);

  const resolvedIds = new Set(seasonState.results.map((r) => r.fixtureId));
  const roundsWithUndated = seasonState.schedule.rounds.filter((r) =>
    r.fixtures.some((f) => !resolvedIds.has(f.id) && !dateMap.has(f.id))
  );
  const firstFutureRound =
    roundsWithUndated.length > 0
      ? Math.min(...roundsWithUndated.map((r) => r.round))
      : 1;

  for (const round of roundsWithUndated) {
    const roundDate = addDaysToDate(
      firstMatchday,
      (round.round - firstFutureRound) * 7
    );
    for (const f of round.fixtures) {
      if (!dateMap.has(f.id) && !resolvedIds.has(f.id)) {
        dateMap.set(f.id, roundDate);
      }
    }
  }

  return dateMap;
}

export function getCompetitionFixtureDate(
  seasonState: CompetitionSeasonState,
  fixtureId: string,
  baseDate: string = '2026-10-07'
): string | undefined {
  if (seasonState.fixtureDates) {
    const found = seasonState.fixtureDates.find((fd) => fd.fixtureId === fixtureId);
    if (found && found.scheduledDate && found.scheduledDate.trim() !== '') {
      return found.scheduledDate;
    }
  }
  const dateMap = buildCompetitionFixtureDateMap(seasonState, baseDate);
  return dateMap.get(fixtureId);
}

export function prepareCompetitionFixtureDates(
  schedule: CompetitionSchedule,
  fixtureDates: Array<{ fixtureId: string; scheduledDate?: string }> = [],
  results: CompetitionFixtureResult[] = [],
  snapshotDate: string = '2026-10-07'
): Array<{ fixtureId: string; scheduledDate?: string }> {
  const tempState: CompetitionSeasonState = {
    competitionId: schedule.competitionId,
    seasonLabel: schedule.seasonLabel,
    ruleSetId: schedule.ruleSetId,
    schedule,
    results,
    fixtureDates,
  };
  const dateMap = buildCompetitionFixtureDateMap(tempState, snapshotDate);
  return schedule.rounds
    .flatMap((r) => r.fixtures)
    .map((f) => ({
      fixtureId: f.id,
      scheduledDate: dateMap.get(f.id),
    }));
}

// ============================================================================
// WORLD PROGRESSION MAIN FUNCTION
// ============================================================================

/**
 * Advances every active competition in the football world by simulating fixtures
 * that are actually due in the calendar interval (state.currentDate, nextDate].
 * Does NOT mutate the input state.
 *
 * @param state The current immutable runtime world state.
 * @param nextDate The caller-supplied target simulation date (must be strictly after state.currentDate).
 * @param context Required static world context (descriptors, player positions, rule sets, or data pack).
 * @returns FootballWorldAdvanceResult containing the updated state or rejection reason.
 */
export function advanceFootballWorldStep(
  state: FootballWorldRuntimeState,
  nextDate: string,
  context: FootballWorldStaticContext | FootballWorldDataPack
): FootballWorldAdvanceResult {
  // 1. Validate date structure & calendar validity
  if (!isValidCalendarDate(nextDate)) {
    return {
      accepted: false,
      error: `Invalid nextDate '${nextDate}'. Must be a valid YYYY-MM-DD calendar date string.`,
    };
  }

  // 2. Validate date authority: nextDate must be strictly after state.currentDate
  if (nextDate <= state.currentDate) {
    return {
      accepted: false,
      error: `nextDate '${nextDate}' must be strictly after currentDate '${state.currentDate}'.`,
    };
  }

  // 3. Validate static world context
  if (!context) {
    return {
      accepted: false,
      error: 'Static world context is required for world progression.',
    };
  }

  // Resolve and validate player positions
  let playerPositions:
    | Map<string, WorldFootballPosition>
    | Record<string, WorldFootballPosition>
    | undefined;

  if ('playerPositions' in context && context.playerPositions) {
    playerPositions = context.playerPositions;
  } else if ('players' in context && Array.isArray(context.players)) {
    const posMap = new Map<string, WorldFootballPosition>();
    for (const p of context.players) {
      if (p.primaryPosition) {
        posMap.set(p.id, p.primaryPosition);
      }
    }
    playerPositions = posMap;
  }

  if (!playerPositions) {
    return {
      accepted: false,
      error: 'Static world context must provide player positions or player definitions.',
    };
  }

  // Resolve and validate competition rule sets
  let ruleSets:
    | CompetitionRuleSet[]
    | Record<string, CompetitionRuleSet>
    | Map<string, CompetitionRuleSet>
    | undefined;

  if ('ruleSets' in context && context.ruleSets) {
    ruleSets = context.ruleSets;
  } else if ('competitionRuleSets' in context && context.competitionRuleSets) {
    ruleSets = context.competitionRuleSets;
  }

  if (!ruleSets) {
    return {
      accepted: false,
      error: 'Static world context must provide competition rule sets.',
    };
  }

  // Pre-validate that all competition rule sets can be resolved
  const compRuleSets = new Map<string, CompetitionRuleSet>();
  const compBenchSizes = new Map<string, number>();

  for (const compState of state.competitionSeasonStates) {
    let compRuleSet: CompetitionRuleSet | undefined;
    if (ruleSets instanceof Map) {
      compRuleSet = ruleSets.get(compState.ruleSetId);
    } else if (Array.isArray(ruleSets)) {
      compRuleSet = ruleSets.find((r) => r.id === compState.ruleSetId);
    } else {
      compRuleSet = (ruleSets as Record<string, CompetitionRuleSet>)[compState.ruleSetId];
    }

    if (!compRuleSet) {
      return {
        accepted: false,
        error: `Competition rule set '${compState.ruleSetId}' could not be resolved from supplied static context.`,
      };
    }

    compRuleSets.set(compState.competitionId, compRuleSet);
    compBenchSizes.set(
      compState.competitionId,
      resolveRuleSetBenchSize(compState.ruleSetId, ruleSets)
    );
  }

  // Pre-index squads: clubId -> playerIds
  const squadMap = new Map(
    (state.squadAssignments ?? []).map((s) => [s.clubId, s.playerIds])
  );

  // Collect all due fixtures across all competitions
  interface DueFixtureEntry {
    compState: CompetitionSeasonState;
    fixture: ScheduledCompetitionFixture;
    scheduledDate: string;
  }

  const allDueFixtures: DueFixtureEntry[] = [];
  const compAllFixtures = new Map<string, ScheduledCompetitionFixture[]>();
  const compResolvedIds = new Map<string, Set<string>>();

  for (const compState of state.competitionSeasonStates) {
    const resolvedIds = new Set(compState.results.map((r) => r.fixtureId));
    compResolvedIds.set(compState.competitionId, resolvedIds);

    const allFixtures = compState.schedule.rounds.flatMap((r) => r.fixtures);
    compAllFixtures.set(compState.competitionId, allFixtures);

    const dateMap = buildCompetitionFixtureDateMap(compState, state.currentDate);

    for (const f of allFixtures) {
      if (resolvedIds.has(f.id)) continue;
      const scheduledDate = dateMap.get(f.id);
      if (
        scheduledDate &&
        scheduledDate > state.currentDate &&
        scheduledDate <= nextDate
      ) {
        allDueFixtures.push({
          compState,
          fixture: f,
          scheduledDate,
        });
      }
    }
  }

  // Group due fixtures by scheduledDate
  const fixturesByDate = new Map<string, DueFixtureEntry[]>();
  for (const entry of allDueFixtures) {
    const list = fixturesByDate.get(entry.scheduledDate) ?? [];
    list.push(entry);
    fixturesByDate.set(entry.scheduledDate, list);
  }

  // Chronological calendar days from dayAfter(currentDate) to nextDate
  const calendarDates: string[] = [];
  let dateCursor = state.currentDate;
  while (dateCursor < nextDate) {
    dateCursor = addDaysToDate(dateCursor, 1);
    calendarDates.push(dateCursor);
  }

  // Working state for competition results and simulation tracking
  const currentCompResults = new Map<string, CompetitionFixtureResult[]>();
  const currentCompSimulatedCounts = new Map<string, number>();
  const currentCompFirstDates = new Map<string, string>();
  const currentCompLastDates = new Map<string, string>();

  for (const compState of state.competitionSeasonStates) {
    currentCompResults.set(compState.competitionId, [...compState.results]);
    currentCompSimulatedCounts.set(compState.competitionId, 0);
  }

  const currentPlayerStatesMap = new Map<string, WorldPlayerFootballState>(
    (state.playerFootballStates ?? []).map((p) => [p.playerId, { ...p }])
  );
  const newlySimulatedParticipations: WorldFixtureParticipation[] = [];
  const newlySimulatedMatchDetails: WorldFixtureMatchDetail[] = [];
  const existingDetailFixtureIds = new Set(
    (state.fixtureMatchDetails ?? []).map((d) => d.fixtureId)
  );
  const clubReferenceQualities = new Map<string, LineupQuality>();

  // Pre-index fixture scheduled dates across all competitions
  const allFixtureDateMap = new Map<string, string>();
  for (const compState of state.competitionSeasonStates) {
    const dMap = buildCompetitionFixtureDateMap(compState, state.currentDate);
    for (const [fId, dt] of dMap.entries()) {
      allFixtureDateMap.set(fId, dt);
    }
  }

  let currentLastDevDate = state.lastDevelopmentDate;

  // Chronological day-by-day progression
  for (const calendarDate of calendarDates) {
    // 0. MONTHLY DEVELOPMENT CHECKPOINT (1st of each calendar month)
    if (isDevelopmentCheckpointDate(calendarDate) && currentLastDevDate !== calendarDate) {
      const windowStartDate = currentLastDevDate ?? '2026-10-07';

      // Gather participations within [windowStartDate, calendarDate)
      const allPastParts = [
        ...(state.fixtureParticipations ?? []),
        ...newlySimulatedParticipations,
      ];
      const participationsInWindow = allPastParts.filter((p) => {
        const dt = allFixtureDateMap.get(p.fixtureId);
        return dt !== undefined && dt >= windowStartDate && dt < calendarDate;
      });

      // Gather match details within [windowStartDate, calendarDate)
      const allPastDetails = [
        ...(state.fixtureMatchDetails ?? []),
        ...newlySimulatedMatchDetails,
      ];
      const matchDetailsInWindow = new Map<string, WorldFixtureMatchDetail>();
      for (const d of allPastDetails) {
        const dt = allFixtureDateMap.get(d.fixtureId);
        if (dt !== undefined && dt >= windowStartDate && dt < calendarDate) {
          matchDetailsInWindow.set(d.fixtureId, d);
        }
      }

      const updated = applyMonthlyWorldPlayerDevelopment({
        playerStates: currentPlayerStatesMap,
        players: context.players ?? [],
        playerPositions,
        participationsInWindow,
        matchDetailsInWindow,
        checkpointDate: calendarDate,
      });

      for (const [pId, pState] of updated.entries()) {
        currentPlayerStatesMap.set(pId, pState);
      }

      currentLastDevDate = calendarDate;
    }

    const fixturesOnDate = fixturesByDate.get(calendarDate) ?? [];

    if (fixturesOnDate.length === 0) {
      // Non-match calendar day: all players recover daily fitness
      for (const [playerId, playerState] of currentPlayerStatesMap) {
        currentPlayerStatesMap.set(playerId, applyDailyRecovery(playerState));
      }
      continue;
    }

    // Match day:
    // SAME-DATE MATCHES RULE:
    // All fixtures on this date must use player states from the beginning of this date.
    const beginningOfDayPlayerStates = new Map(currentPlayerStatesMap);

    // Compute strength snapshots for competitions active on this date
    // from completed results prior to this date.
    const compSnapshots = new Map<string, CompetitionStrengthSnapshot>();
    for (const entry of fixturesOnDate) {
      const compId = entry.compState.competitionId;
      if (!compSnapshots.has(compId)) {
        compSnapshots.set(
          compId,
          computeStrengthSnapshot(currentCompResults.get(compId)!)
        );
      }
    }

    // Sort fixtures deterministically: competitionId, round, id
    fixturesOnDate.sort((a, b) => {
      if (a.compState.competitionId !== b.compState.competitionId) {
        return a.compState.competitionId.localeCompare(b.compState.competitionId);
      }
      if (a.fixture.round !== b.fixture.round) {
        return a.fixture.round - b.fixture.round;
      }
      return a.fixture.id.localeCompare(b.fixture.id);
    });

    // Track participants on this date: playerId -> { minutesPlayed, teamResult }
    const appearancesOnDate = new Map<
      string,
      { minutesPlayed: number; teamResult: 'win' | 'draw' | 'loss' }
    >();

    for (const entry of fixturesOnDate) {
      const compId = entry.compState.competitionId;
      const fixture = entry.fixture;
      const strengthSnapshot = compSnapshots.get(compId)!;
      const benchSize = compBenchSizes.get(compId) ?? 9;

      // Deterministic stable RNG seed (independent of caller nextDate)
      const baseFixtureKey = `${state.dataPackId}:${entry.compState.seasonLabel}:${compId}:${fixture.id}:${calendarDate}`;
      const seed = hashString(baseFixtureKey);
      const rng = createRng(seed);

      // Squad selection using player states at the beginning of this date
      const homeSquad = squadMap.get(fixture.homeTeamId) ?? [];
      const awaySquad = squadMap.get(fixture.awayTeamId) ?? [];

      const homeSelection = selectMatchTeamSquad(
        fixture.homeTeamId,
        homeSquad,
        beginningOfDayPlayerStates,
        { benchSize, playerPositions }
      );
      const awaySelection = selectMatchTeamSquad(
        fixture.awayTeamId,
        awaySquad,
        beginningOfDayPlayerStates,
        { benchSize, playerPositions }
      );

      // Phase 3L: Selected XI Lineup Quality and Bounded Modifiers
      const homeTodayQuality = computeLineupQuality(
        homeSelection.startingPlayerIds,
        beginningOfDayPlayerStates,
        playerPositions
      );
      const awayTodayQuality = computeLineupQuality(
        awaySelection.startingPlayerIds,
        beginningOfDayPlayerStates,
        playerPositions
      );

      let homeRefQuality = clubReferenceQualities.get(fixture.homeTeamId);
      if (!homeRefQuality) {
        homeRefQuality = computeClubReferenceLineupQuality(
          fixture.homeTeamId,
          homeSquad,
          beginningOfDayPlayerStates,
          { playerPositions }
        );
        clubReferenceQualities.set(fixture.homeTeamId, homeRefQuality);
      }

      let awayRefQuality = clubReferenceQualities.get(fixture.awayTeamId);
      if (!awayRefQuality) {
        awayRefQuality = computeClubReferenceLineupQuality(
          fixture.awayTeamId,
          awaySquad,
          beginningOfDayPlayerStates,
          { playerPositions }
        );
        clubReferenceQualities.set(fixture.awayTeamId, awayRefQuality);
      }

      const homeModifiers = computeLineupStrengthModifiers(
        homeTodayQuality,
        homeRefQuality
      );
      const awayModifiers = computeLineupStrengthModifiers(
        awayTodayQuality,
        awayRefQuality
      );

      const { homeXg, awayXg } = computeExpectedGoals(
        strengthSnapshot,
        fixture.homeTeamId,
        fixture.awayTeamId,
        {
          homeAttackMultiplier: homeModifiers.attackStrengthMultiplier,
          homeDefensiveResistanceMultiplier: homeModifiers.defensiveResistanceMultiplier,
          awayAttackMultiplier: awayModifiers.attackStrengthMultiplier,
          awayDefensiveResistanceMultiplier: awayModifiers.defensiveResistanceMultiplier,
        }
      );

      const homeGoals = samplePoisson(homeXg, rng);
      const awayGoals = samplePoisson(awayXg, rng);

      const participation = createFixtureParticipation(
        fixture.id,
        homeSelection,
        awaySelection
      );
      newlySimulatedParticipations.push(participation);

      if (!existingDetailFixtureIds.has(fixture.id)) {
        const matchDetail = generateFixtureMatchDetail({
          fixture: {
            id: fixture.id,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
          },
          homeGoals,
          awayGoals,
          homeSelection,
          awaySelection,
          playerStates: beginningOfDayPlayerStates,
          playerPositions,
          baseFixtureSeedKey: baseFixtureKey,
        });
        if (matchDetail) {
          newlySimulatedMatchDetails.push(matchDetail);
          existingDetailFixtureIds.add(fixture.id);
        }
      }

      // Determine team match results
      let homeResult: 'win' | 'draw' | 'loss' = 'draw';
      let awayResult: 'win' | 'draw' | 'loss' = 'draw';
      if (homeGoals > awayGoals) {
        homeResult = 'win';
        awayResult = 'loss';
      } else if (awayGoals > homeGoals) {
        homeResult = 'loss';
        awayResult = 'win';
      }

      // Record player appearances
      for (const app of participation.playerAppearances) {
        if (app.minutesPlayed > 0) {
          const teamResult =
            app.teamId === fixture.homeTeamId ? homeResult : awayResult;
          appearancesOnDate.set(app.playerId, {
            minutesPlayed: app.minutesPlayed,
            teamResult,
          });
        }
      }

      // Append fixture result
      currentCompResults.get(compId)!.push({
        fixtureId: fixture.id,
        competitionId: compId,
        seasonLabel: entry.compState.seasonLabel,
        ruleSetId: entry.compState.ruleSetId,
        round: fixture.round,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        homeGoals,
        awayGoals,
      });

      // Update simulation counts and date bounds
      const curCount = currentCompSimulatedCounts.get(compId) ?? 0;
      currentCompSimulatedCounts.set(compId, curCount + 1);

      if (!currentCompFirstDates.has(compId)) {
        currentCompFirstDates.set(compId, calendarDate);
      }
      currentCompLastDates.set(compId, calendarDate);
    }

    // End-of-date condition updates:
    for (const [playerId, playerState] of currentPlayerStatesMap) {
      const appearance = appearancesOnDate.get(playerId);
      if (appearance && appearance.minutesPlayed > 0) {
        // Participant: loses fitness, gains sharpness, receives form & morale effects
        const updated = applyMatchConditionEffects(
          playerState,
          appearance.minutesPlayed,
          appearance.teamResult
        );
        currentPlayerStatesMap.set(playerId, updated);
      } else {
        // Non-participant: receives daily calendar recovery (+4 fitness)
        const updated = applyDailyRecovery(playerState);
        currentPlayerStatesMap.set(playerId, updated);
      }
    }
  }

  // Assemble updated competition season states and progress summaries
  const updatedCompetitionSeasonStates: CompetitionSeasonState[] = [];
  const progressSummaries: CompetitionProgressSummary[] = [];

  for (const compState of state.competitionSeasonStates) {
    const compId = compState.competitionId;
    const results = currentCompResults.get(compId)!;
    const updatedCompState: CompetitionSeasonState = {
      competitionId: compState.competitionId,
      seasonLabel: compState.seasonLabel,
      ruleSetId: compState.ruleSetId,
      schedule: compState.schedule,
      results,
      fixtureDates: compState.fixtureDates?.map((fd) => ({ ...fd })),
    };

    const validation = validateCompetitionSeasonState(updatedCompState);
    if (!validation.valid) {
      return {
        accepted: false,
        error: `Competition season state validation failed for '${compState.competitionId}': ${validation.errors.join('; ')}`,
      };
    }

    updatedCompetitionSeasonStates.push(updatedCompState);

    const allFixtures = compAllFixtures.get(compId) ?? [];
    const updatedResolvedIds = new Set(results.map((r) => r.fixtureId));
    const isNowComplete = allFixtures.every((f) => updatedResolvedIds.has(f.id));

    progressSummaries.push({
      competitionId: compId,
      fixturesSimulated: currentCompSimulatedCounts.get(compId) ?? 0,
      isComplete: isNowComplete,
      firstSimulatedDate: currentCompFirstDates.get(compId),
      lastSimulatedDate: currentCompLastDates.get(compId),
    });
  }

  // Assemble updated player football states
  const nextPlayerFootballStates = (state.playerFootballStates ?? []).map((p) =>
    currentPlayerStatesMap.get(p.playerId) ?? { ...p }
  );

  const playerValidation = validateWorldPlayerFootballStates(nextPlayerFootballStates);
  if (!playerValidation.valid) {
    return {
      accepted: false,
      error: `World player football state validation failed: ${playerValidation.errors.join('; ')}`,
    };
  }

  // Return new immutable state
  const nextState: FootballWorldRuntimeState = {
    dataPackId: state.dataPackId,
    dataPackVersion: state.dataPackVersion,
    seasonLabel: state.seasonLabel,
    currentDate: nextDate,
    domesticLeagueMembershipStates: state.domesticLeagueMembershipStates,
    competitionSeasonStates: updatedCompetitionSeasonStates,
    squadAssignments: state.squadAssignments,
    managerAssignments: state.managerAssignments,
    playerFootballStates: nextPlayerFootballStates,
    fixtureParticipations: [
      ...(state.fixtureParticipations ?? []),
      ...newlySimulatedParticipations,
    ],
    fixtureMatchDetails: [
      ...(state.fixtureMatchDetails ?? []),
      ...newlySimulatedMatchDetails,
    ],
    ...(currentLastDevDate !== undefined ? { lastDevelopmentDate: currentLastDevDate } : {}),
  };

  return {
    accepted: true,
    state: nextState,
    competitionProgressSummaries: progressSummaries,
  };
}
