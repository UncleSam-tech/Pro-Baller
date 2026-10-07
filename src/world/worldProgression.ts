import { validateCompetitionSeasonState } from '../competition/seasonEngine';
import type {
  CompetitionFixtureResult,
  CompetitionSchedule,
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
 * @returns FootballWorldAdvanceResult containing the updated state or rejection reason.
 */
export function advanceFootballWorldStep(
  state: FootballWorldRuntimeState,
  nextDate: string
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

  const updatedCompetitionSeasonStates: CompetitionSeasonState[] = [];
  const progressSummaries: CompetitionProgressSummary[] = [];

  // 3. Advance each competition independently by due date
  for (const compState of state.competitionSeasonStates) {
    const resolvedFixtureIds = new Set(compState.results.map((r) => r.fixtureId));
    const allFixtures = compState.schedule.rounds.flatMap((r) => r.fixtures);

    // If all fixtures already resolved, competition is complete
    if (allFixtures.every((f) => resolvedFixtureIds.has(f.id))) {
      updatedCompetitionSeasonStates.push({
        ...compState,
        schedule: compState.schedule,
        results: [...compState.results],
        fixtureDates: compState.fixtureDates?.map((fd) => ({ ...fd })),
      });
      progressSummaries.push({
        competitionId: compState.competitionId,
        fixturesSimulated: 0,
        isComplete: true,
      });
      continue;
    }

    // Resolve date map for all fixtures in this competition
    const dateMap = buildCompetitionFixtureDateMap(compState, state.currentDate);

    // Select unresolved fixtures due in the interval (currentDate, nextDate]
    const dueFixtures: ScheduledCompetitionFixture[] = [];
    for (const f of allFixtures) {
      if (resolvedFixtureIds.has(f.id)) continue;
      const scheduledDate = dateMap.get(f.id);
      if (
        scheduledDate &&
        scheduledDate > state.currentDate &&
        scheduledDate <= nextDate
      ) {
        dueFixtures.push(f);
      }
    }

    // If no fixtures are due in this date window:
    if (dueFixtures.length === 0) {
      updatedCompetitionSeasonStates.push({
        ...compState,
        schedule: compState.schedule,
        results: [...compState.results],
        fixtureDates: compState.fixtureDates?.map((fd) => ({ ...fd })),
      });
      progressSummaries.push({
        competitionId: compState.competitionId,
        fixturesSimulated: 0,
        isComplete: false,
      });
      continue;
    }

    // Calculate strength snapshot BEFORE simulating fixtures in this step
    // Preserves batch-order independence across all fixtures within the step
    const strengthSnapshot = computeStrengthSnapshot(compState.results);

    // Sort due fixtures deterministically: scheduledDate, round, id
    dueFixtures.sort((a, b) => {
      const dateA = dateMap.get(a.id) ?? '';
      const dateB = dateMap.get(b.id) ?? '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      if (a.round !== b.round) return a.round - b.round;
      return a.id.localeCompare(b.id);
    });

    const newlySimulatedResults: CompetitionFixtureResult[] = [];
    for (const fixture of dueFixtures) {
      const scheduledDate = dateMap.get(fixture.id);
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

      newlySimulatedResults.push({
        fixtureId: fixture.id,
        competitionId: compState.competitionId,
        seasonLabel: compState.seasonLabel,
        ruleSetId: compState.ruleSetId,
        round: fixture.round,
        homeTeamId: fixture.homeTeamId,
        awayTeamId: fixture.awayTeamId,
        homeGoals,
        awayGoals,
      });
    }

    const updatedResults = [...compState.results, ...newlySimulatedResults];
    const updatedCompState: CompetitionSeasonState = {
      competitionId: compState.competitionId,
      seasonLabel: compState.seasonLabel,
      ruleSetId: compState.ruleSetId,
      schedule: compState.schedule,
      results: updatedResults,
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

    const updatedResolvedIds = new Set(updatedResults.map((r) => r.fixtureId));
    const isNowComplete = allFixtures.every((f) => updatedResolvedIds.has(f.id));

    const simulatedDates = dueFixtures
      .map((f) => dateMap.get(f.id)!)
      .filter(Boolean)
      .sort();

    progressSummaries.push({
      competitionId: compState.competitionId,
      fixturesSimulated: newlySimulatedResults.length,
      isComplete: isNowComplete,
      firstSimulatedDate: simulatedDates[0],
      lastSimulatedDate: simulatedDates[simulatedDates.length - 1],
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
