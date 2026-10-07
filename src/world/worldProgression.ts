import { validateCompetitionSeasonState } from '../competition/seasonEngine';
import type {
  CompetitionFixtureResult,
  CompetitionSeasonState,
  ScheduledCompetitionFixture,
} from '../competition/types';
import type {
  CompetitionProgressSummary,
  FootballWorldAdvanceResult,
  FootballWorldRuntimeState,
} from './types';

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
function hashString(str: string): number {
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
function createRng(seed: number): () => number {
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
function computeStrengthSnapshot(results: CompetitionFixtureResult[]): CompetitionStrengthSnapshot {
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
function computeExpectedGoals(
  snapshot: CompetitionStrengthSnapshot,
  homeTeamId: string,
  awayTeamId: string
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

  const rawHomeXg = leagueGoalsPerTeam * homeAttack * awayDefense * HOME_ADVANTAGE_FACTOR;
  const rawAwayXg = leagueGoalsPerTeam * awayAttack * homeDefense * AWAY_ADVANTAGE_FACTOR;

  return {
    homeXg: Math.max(MIN_EXPECTED_GOALS, Math.min(MAX_EXPECTED_GOALS, rawHomeXg)),
    awayXg: Math.max(MIN_EXPECTED_GOALS, Math.min(MAX_EXPECTED_GOALS, rawAwayXg)),
  };
}

// ============================================================================
// DATE VALIDATION
// ============================================================================

function isValidCalendarDate(dateStr: string): boolean {
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

// ============================================================================
// WORLD PROGRESSION MAIN FUNCTION
// ============================================================================

/**
 * Advances every active competition in the football world by exactly one canonical unresolved round.
 * Does NOT mutate the input state.
 *
 * @param state The current immutable runtime world state.
 * @param nextDate The caller-supplied target simulation date (must be strictly after state.currentDate).
 * @returns FootballWorldAdvanceResult containing the updated state or rejection reason.
 */
export function advanceFootballWorldStep(
  state: FootballWorldRuntimeState,
  nextDate: string
): FootballWorldAdvanceResult {
  // 1. Validate date structure
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

  const updatedCompetitionSeasonStates: CompetitionSeasonState[] = [];
  const progressSummaries: CompetitionProgressSummary[] = [];

  // 3. Advance each competition independently
  for (const compState of state.competitionSeasonStates) {
    const resolvedFixtureIds = new Set(compState.results.map((r) => r.fixtureId));

    // Sort rounds ascending by canonical round number
    const sortedRounds = [...compState.schedule.rounds].sort((a, b) => a.round - b.round);

    // Find lowest canonical round with at least one unresolved fixture
    const lowestUnresolvedRound = sortedRounds.find((r) =>
      r.fixtures.some((f) => !resolvedFixtureIds.has(f.id))
    );

    // If no unresolved fixtures exist in the entire competition: leave unchanged
    if (!lowestUnresolvedRound) {
      updatedCompetitionSeasonStates.push({
        ...compState,
        schedule: compState.schedule,
        results: [...compState.results],
      });
      progressSummaries.push({
        competitionId: compState.competitionId,
        fixturesSimulated: 0,
        isComplete: true,
      });
      continue;
    }

    // Take every unresolved fixture in that round
    const unresolvedFixtures = lowestUnresolvedRound.fixtures.filter(
      (f) => !resolvedFixtureIds.has(f.id)
    );

    // Calculate strength snapshot BEFORE simulating fixtures in this round
    // Ensures batch order independence across fixtures within the round
    const strengthSnapshot = computeStrengthSnapshot(compState.results);

    const newlySimulatedResults: CompetitionFixtureResult[] = [];

    for (const fixture of unresolvedFixtures) {
      // Deterministic PRNG seeded specifically for this fixture
      const seed = hashString(
        `${state.dataPackId}:${compState.seasonLabel}:${compState.competitionId}:${fixture.id}:${nextDate}`
      );
      const rng = createRng(seed);

      const { homeXg, awayXg } = computeExpectedGoals(
        strengthSnapshot,
        fixture.homeTeamId,
        fixture.awayTeamId
      );

      const homeGoals = samplePoisson(homeXg, rng);
      const awayGoals = samplePoisson(awayXg, rng);

      const fixtureResult: CompetitionFixtureResult = {
        fixtureId: fixture.id,
        competitionId: compState.competitionId,
        seasonLabel: compState.seasonLabel,
        ruleSetId: compState.ruleSetId,
        round: lowestUnresolvedRound.round,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        homeGoals,
        awayGoals,
      };

      newlySimulatedResults.push(fixtureResult);
    }

    // Build updated results array preserving all existing historical/simulated results
    const updatedResults: CompetitionFixtureResult[] = [
      ...compState.results,
      ...newlySimulatedResults,
    ];

    const updatedCompState: CompetitionSeasonState = {
      competitionId: compState.competitionId,
      seasonLabel: compState.seasonLabel,
      ruleSetId: compState.ruleSetId,
      schedule: compState.schedule,
      results: updatedResults,
    };

    // Validate updated competition season state
    const validation = validateCompetitionSeasonState(updatedCompState);
    if (!validation.valid) {
      return {
        accepted: false,
        error: `Competition season state validation failed for '${compState.competitionId}': ${validation.errors.join('; ')}`,
      };
    }

    updatedCompetitionSeasonStates.push(updatedCompState);

    // Check if competition is now complete
    const updatedResolvedIds = new Set(updatedResults.map((r) => r.fixtureId));
    const isNowComplete = compState.schedule.rounds.every((r) =>
      r.fixtures.every((f) => updatedResolvedIds.has(f.id))
    );

    progressSummaries.push({
      competitionId: compState.competitionId,
      roundSimulated: lowestUnresolvedRound.round,
      fixturesSimulated: newlySimulatedResults.length,
      isComplete: isNowComplete,
    });
  }

  // 4. Return new immutable state
  const nextState: FootballWorldRuntimeState = {
    dataPackId: state.dataPackId,
    dataPackVersion: state.dataPackVersion,
    seasonLabel: state.seasonLabel,
    currentDate: nextDate,
    domesticLeagueMembershipStates: state.domesticLeagueMembershipStates,
    competitionSeasonStates: updatedCompetitionSeasonStates,
    squadAssignments: state.squadAssignments,
    managerAssignments: state.managerAssignments,
  };

  return {
    accepted: true,
    state: nextState,
    competitionProgressSummaries: progressSummaries,
  };
}
