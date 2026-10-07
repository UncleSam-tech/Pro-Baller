import type {
  CompetitionFixtureResult,
  CompetitionRuleSet,
  CompetitionSchedule,
  CompetitionSeasonState,
  CompetitionSeasonStateValidation,
  CompetitionResultProcessResult,
  CompetitionStandingsRow,
  CompetitionStandingsResult,
  ScheduledCompetitionFixture,
  StandingsTieBreaker,
} from './types';
import { validateCompetitionSchedule } from './schedulerEngine';

// ============================================================================
// HELPER UTILITIES
// ============================================================================

function cloneSchedule(schedule: CompetitionSchedule): CompetitionSchedule {
  return {
    competitionId: schedule.competitionId,
    seasonLabel: schedule.seasonLabel,
    ruleSetId: schedule.ruleSetId,
    formatType: schedule.formatType,
    participantTeamIds: [...schedule.participantTeamIds],
    rounds: schedule.rounds.map((round) => ({
      round: round.round,
      fixtures: round.fixtures.map((fixture) => ({ ...fixture })),
      byeTeamIds: [...round.byeTeamIds],
    })),
  };
}

function isValidGoalScore(score: unknown): score is number {
  return (
    typeof score === 'number' &&
    Number.isInteger(score) &&
    Number.isFinite(score) &&
    !Number.isNaN(score) &&
    score >= 0
  );
}

// ============================================================================
// SEASON STATE VALIDATION
// ============================================================================

export function validateCompetitionSeasonState(
  state: CompetitionSeasonState
): CompetitionSeasonStateValidation {
  const errors: string[] = [];

  // 1. Validate schedule integrity
  const scheduleValidation = validateCompetitionSchedule(state.schedule);
  if (!scheduleValidation.valid) {
    errors.push(...scheduleValidation.errors);
  }

  // 2. Validate state scope matching schedule scope
  if (state.competitionId !== state.schedule.competitionId) {
    errors.push(
      `State competitionId "${state.competitionId}" does not match schedule competitionId "${state.schedule.competitionId}".`
    );
  }

  if (state.seasonLabel !== state.schedule.seasonLabel) {
    errors.push(
      `State seasonLabel "${state.seasonLabel}" does not match schedule seasonLabel "${state.schedule.seasonLabel}".`
    );
  }

  if (state.ruleSetId !== state.schedule.ruleSetId) {
    errors.push(
      `State ruleSetId "${state.ruleSetId}" does not match schedule ruleSetId "${state.schedule.ruleSetId}".`
    );
  }

  // 3. Build scheduled fixture lookup map
  const scheduledFixtures = new Map<string, ScheduledCompetitionFixture>();
  for (const round of state.schedule.rounds) {
    for (const fixture of round.fixtures) {
      scheduledFixtures.set(fixture.id, fixture);
    }
  }

  // 4. Validate stored results
  const seenResultFixtureIds = new Set<string>();
  for (const res of state.results) {
    // 4.1 Unique fixtureId inside results
    if (seenResultFixtureIds.has(res.fixtureId)) {
      errors.push(`Duplicate fixture result ID: "${res.fixtureId}".`);
    }
    seenResultFixtureIds.add(res.fixtureId);

    // 4.2 Corresponds to a scheduled fixture
    const scheduled = scheduledFixtures.get(res.fixtureId);
    if (!scheduled) {
      errors.push(
        `Result fixtureId "${res.fixtureId}" does not correspond to any scheduled fixture.`
      );
      continue;
    }

    // 4.3 Scope matches state
    if (res.competitionId !== state.competitionId) {
      errors.push(
        `Result "${res.fixtureId}" competitionId "${res.competitionId}" does not match state "${state.competitionId}".`
      );
    }
    if (res.seasonLabel !== state.seasonLabel) {
      errors.push(
        `Result "${res.fixtureId}" seasonLabel "${res.seasonLabel}" does not match state "${state.seasonLabel}".`
      );
    }
    if (res.ruleSetId !== state.ruleSetId) {
      errors.push(
        `Result "${res.fixtureId}" ruleSetId "${res.ruleSetId}" does not match state "${state.ruleSetId}".`
      );
    }

    // 4.4 Round matches scheduled fixture
    if (res.round !== scheduled.round) {
      errors.push(
        `Result "${res.fixtureId}" round ${res.round} does not match scheduled round ${scheduled.round}.`
      );
    }

    // 4.5 Teams match scheduled fixture
    if (res.homeTeamId !== scheduled.homeTeamId) {
      errors.push(
        `Result "${res.fixtureId}" home team "${res.homeTeamId}" does not match scheduled "${scheduled.homeTeamId}".`
      );
    }
    if (res.awayTeamId !== scheduled.awayTeamId) {
      errors.push(
        `Result "${res.fixtureId}" away team "${res.awayTeamId}" does not match scheduled "${scheduled.awayTeamId}".`
      );
    }

    // 4.6 Scores are non-negative finite integers
    if (!isValidGoalScore(res.homeGoals)) {
      errors.push(
        `Result "${res.fixtureId}" homeGoals must be a non-negative finite integer.`
      );
    }
    if (!isValidGoalScore(res.awayGoals)) {
      errors.push(
        `Result "${res.fixtureId}" awayGoals must be a non-negative finite integer.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// STATE FACTORY
// ============================================================================

export function createCompetitionSeasonState(
  schedule: CompetitionSchedule
): CompetitionSeasonState {
  return {
    competitionId: schedule.competitionId,
    seasonLabel: schedule.seasonLabel,
    ruleSetId: schedule.ruleSetId,
    schedule: cloneSchedule(schedule),
    results: [],
  };
}

// ============================================================================
// RESULT PROCESSING
// ============================================================================

export function processCompetitionFixtureResult(
  state: CompetitionSeasonState,
  result: CompetitionFixtureResult
): CompetitionResultProcessResult {
  // 1. Season state integrity validation - reject corrupt state before processing
  const stateValidation = validateCompetitionSeasonState(state);
  if (!stateValidation.valid) {
    return {
      state,
      accepted: false,
      error: `Cannot process result: season state is invalid (${stateValidation.errors[0]}).`,
    };
  }

  // 2. Result scope validation against state
  if (result.competitionId !== state.competitionId) {
    return {
      state,
      accepted: false,
      error: `Competition mismatch: expected ${state.competitionId}, received ${result.competitionId}.`,
    };
  }

  if (result.seasonLabel !== state.seasonLabel) {
    return {
      state,
      accepted: false,
      error: `Season mismatch: expected ${state.seasonLabel}, received ${result.seasonLabel}.`,
    };
  }

  if (result.ruleSetId !== state.ruleSetId) {
    return {
      state,
      accepted: false,
      error: `RuleSet ID mismatch: expected ${state.ruleSetId}, received ${result.ruleSetId}.`,
    };
  }

  // 3. Goal score validation
  if (!isValidGoalScore(result.homeGoals) || !isValidGoalScore(result.awayGoals)) {
    return {
      state,
      accepted: false,
      error: 'Scores must be non-negative integers.',
    };
  }

  // 4. Duplicate result protection
  if (state.results.some((r) => r.fixtureId === result.fixtureId)) {
    return {
      state,
      accepted: false,
      error: 'Fixture result already processed.',
    };
  }

  // 5. Fixture existence across scheduled rounds
  let matchedFixture: ScheduledCompetitionFixture | undefined;
  for (const round of state.schedule.rounds) {
    const found = round.fixtures.find((f) => f.id === result.fixtureId);
    if (found) {
      matchedFixture = found;
      break;
    }
  }

  if (!matchedFixture) {
    return {
      state,
      accepted: false,
      error: `Fixture ID ${result.fixtureId} not found in scheduled fixtures.`,
    };
  }

  // 6. Match details alignment validation
  if (result.round !== matchedFixture.round) {
    return {
      state,
      accepted: false,
      error: `Fixture round mismatch: expected ${matchedFixture.round}, received ${result.round}.`,
    };
  }

  if (result.homeTeamId !== matchedFixture.homeTeamId) {
    return {
      state,
      accepted: false,
      error: `Home team mismatch: expected ${matchedFixture.homeTeamId}, received ${result.homeTeamId}.`,
    };
  }

  if (result.awayTeamId !== matchedFixture.awayTeamId) {
    return {
      state,
      accepted: false,
      error: `Away team mismatch: expected ${matchedFixture.awayTeamId}, received ${result.awayTeamId}.`,
    };
  }

  // 7. Accept result immutably
  return {
    accepted: true,
    state: {
      ...state,
      results: [...state.results, { ...result }],
    },
  };
}

// ============================================================================
// STANDINGS CALCULATION & TIE-BREAKER PIPELINE
// ============================================================================

interface MutableStandingsRow {
  position: number;
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

interface MiniTableStats {
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

function calculateMiniTable(
  tiedTeamIds: Set<string>,
  allResults: CompetitionFixtureResult[],
  pointsConfig: { win: number; draw: number; loss: number }
): Map<string, MiniTableStats> {
  const statsMap = new Map<string, MiniTableStats>();
  for (const teamId of tiedTeamIds) {
    statsMap.set(teamId, {
      points: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });
  }

  for (const match of allResults) {
    if (tiedTeamIds.has(match.homeTeamId) && tiedTeamIds.has(match.awayTeamId)) {
      const home = statsMap.get(match.homeTeamId)!;
      const away = statsMap.get(match.awayTeamId)!;

      home.goalsFor += match.homeGoals;
      home.goalsAgainst += match.awayGoals;
      home.goalDifference = home.goalsFor - home.goalsAgainst;

      away.goalsFor += match.awayGoals;
      away.goalsAgainst += match.homeGoals;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (match.homeGoals > match.awayGoals) {
        home.points += pointsConfig.win;
        away.points += pointsConfig.loss;
      } else if (match.homeGoals < match.awayGoals) {
        away.points += pointsConfig.win;
        home.points += pointsConfig.loss;
      } else {
        home.points += pointsConfig.draw;
        away.points += pointsConfig.draw;
      }
    }
  }

  return statsMap;
}

function rankTiedGroup(
  group: MutableStandingsRow[],
  criteriaList: StandingsTieBreaker[],
  criteriaIndex: number,
  allResults: CompetitionFixtureResult[],
  pointsConfig: { win: number; draw: number; loss: number }
): MutableStandingsRow[] {
  if (group.length <= 1) {
    return group;
  }

  if (criteriaIndex >= criteriaList.length) {
    // Technical deterministic fallback to TEAM_ID if all criteria exhausted
    return [...group].sort((a, b) => (a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0));
  }

  const criterion = criteriaList[criteriaIndex];

  if (criterion === 'TEAM_ID') {
    return [...group].sort((a, b) => (a.teamId < b.teamId ? -1 : a.teamId > b.teamId ? 1 : 0));
  }

  let getKey: (row: MutableStandingsRow) => number;

  if (
    criterion === 'HEAD_TO_HEAD_POINTS' ||
    criterion === 'HEAD_TO_HEAD_GOAL_DIFFERENCE' ||
    criterion === 'HEAD_TO_HEAD_GOALS_FOR'
  ) {
    const tiedTeamIds = new Set(group.map((r) => r.teamId));
    const miniTable = calculateMiniTable(tiedTeamIds, allResults, pointsConfig);

    if (criterion === 'HEAD_TO_HEAD_POINTS') {
      getKey = (row) => miniTable.get(row.teamId)?.points ?? 0;
    } else if (criterion === 'HEAD_TO_HEAD_GOAL_DIFFERENCE') {
      getKey = (row) => miniTable.get(row.teamId)?.goalDifference ?? 0;
    } else {
      getKey = (row) => miniTable.get(row.teamId)?.goalsFor ?? 0;
    }
  } else if (criterion === 'GOAL_DIFFERENCE') {
    getKey = (row) => row.goalDifference;
  } else if (criterion === 'GOALS_FOR') {
    getKey = (row) => row.goalsFor;
  } else if (criterion === 'WINS') {
    getKey = (row) => row.won;
  } else {
    getKey = () => 0;
  }

  // Partition group into buckets by key value
  const buckets = new Map<number, MutableStandingsRow[]>();
  for (const row of group) {
    const val = getKey(row);
    const existing = buckets.get(val);
    if (!existing) {
      buckets.set(val, [row]);
    } else {
      existing.push(row);
    }
  }

  // Sort distinct numeric keys descending (higher is better)
  const sortedKeys = Array.from(buckets.keys()).sort((a, b) => b - a);

  const resolved: MutableStandingsRow[] = [];
  for (const key of sortedKeys) {
    const subGroup = buckets.get(key)!;
    if (subGroup.length === 1) {
      resolved.push(subGroup[0]);
    } else {
      const subResolved = rankTiedGroup(
        subGroup,
        criteriaList,
        criteriaIndex + 1,
        allResults,
        pointsConfig
      );
      resolved.push(...subResolved);
    }
  }

  return resolved;
}

export function getCompetitionStandings(
  state: CompetitionSeasonState,
  ruleSet: CompetitionRuleSet
): CompetitionStandingsResult {
  // 1. Season state integrity validation
  const stateValidation = validateCompetitionSeasonState(state);
  if (!stateValidation.valid) {
    return {
      accepted: false,
      error: `Cannot calculate standings: season state is invalid (${stateValidation.errors[0]}).`,
    };
  }

  // 2. RuleSet scope validation
  if (ruleSet.id !== state.ruleSetId) {
    return {
      accepted: false,
      error: `RuleSet id mismatch: expected ${state.ruleSetId}, received ${ruleSet.id}.`,
    };
  }

  if (ruleSet.competitionId !== state.competitionId) {
    return {
      accepted: false,
      error: `RuleSet competitionId mismatch: expected ${state.competitionId}, received ${ruleSet.competitionId}.`,
    };
  }

  if (ruleSet.seasonLabel !== state.seasonLabel) {
    return {
      accepted: false,
      error: `RuleSet seasonLabel mismatch: expected ${state.seasonLabel}, received ${ruleSet.seasonLabel}.`,
    };
  }

  // 3. Standings-rules validation
  if (!ruleSet.standings) {
    return {
      accepted: false,
      error: 'RuleSet has no standings configuration.',
    };
  }

  const { pointsForWin, pointsForDraw, pointsForLoss, tieBreakers } = ruleSet.standings;

  if (!Number.isFinite(pointsForWin) || pointsForWin < 0) {
    return {
      accepted: false,
      error: 'pointsForWin must be a non-negative finite number.',
    };
  }

  if (!Number.isFinite(pointsForDraw) || pointsForDraw < 0) {
    return {
      accepted: false,
      error: 'pointsForDraw must be a non-negative finite number.',
    };
  }

  if (!Number.isFinite(pointsForLoss) || pointsForLoss < 0) {
    return {
      accepted: false,
      error: 'pointsForLoss must be a non-negative finite number.',
    };
  }

  if (!Array.isArray(tieBreakers) || tieBreakers.length === 0) {
    return {
      accepted: false,
      error: 'tieBreakers must be a non-empty array.',
    };
  }

  if (new Set(tieBreakers).size !== tieBreakers.length) {
    return {
      accepted: false,
      error: 'tieBreakers contains duplicate criteria.',
    };
  }

  const pointsConfig = { win: pointsForWin, draw: pointsForDraw, loss: pointsForLoss };

  // 4. Initialize table rows for every participant in the schedule
  const rowsByTeam = new Map<string, MutableStandingsRow>();
  for (const teamId of state.schedule.participantTeamIds) {
    rowsByTeam.set(teamId, {
      position: 0,
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  // 5. Derive statistics from accepted results
  for (const result of state.results) {
    const home = rowsByTeam.get(result.homeTeamId);
    const away = rowsByTeam.get(result.awayTeamId);

    if (home && away) {
      home.played += 1;
      away.played += 1;

      home.goalsFor += result.homeGoals;
      home.goalsAgainst += result.awayGoals;
      home.goalDifference = home.goalsFor - home.goalsAgainst;

      away.goalsFor += result.awayGoals;
      away.goalsAgainst += result.homeGoals;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (result.homeGoals > result.awayGoals) {
        home.won += 1;
        home.points += pointsForWin;
        away.lost += 1;
        away.points += pointsForLoss;
      } else if (result.homeGoals < result.awayGoals) {
        away.won += 1;
        away.points += pointsForWin;
        home.lost += 1;
        home.points += pointsForLoss;
      } else {
        home.drawn += 1;
        home.points += pointsForDraw;
        away.drawn += 1;
        away.points += pointsForDraw;
      }
    }
  }

  const allRows = Array.from(rowsByTeam.values());

  // 6. Build tie-breaker criteria list: configured order + technical fallback TEAM_ID
  const criteriaList: StandingsTieBreaker[] = [...tieBreakers];
  if (!criteriaList.includes('TEAM_ID')) {
    criteriaList.push('TEAM_ID');
  }

  // 7. Group by points descending
  const pointsBuckets = new Map<number, MutableStandingsRow[]>();
  for (const row of allRows) {
    const bucket = pointsBuckets.get(row.points);
    if (!bucket) {
      pointsBuckets.set(row.points, [row]);
    } else {
      bucket.push(row);
    }
  }

  const sortedPoints = Array.from(pointsBuckets.keys()).sort((a, b) => b - a);

  const rankedRows: MutableStandingsRow[] = [];
  for (const pts of sortedPoints) {
    const pointsGroup = pointsBuckets.get(pts)!;
    if (pointsGroup.length === 1) {
      rankedRows.push(pointsGroup[0]);
    } else {
      const resolved = rankTiedGroup(
        pointsGroup,
        criteriaList,
        0,
        state.results,
        pointsConfig
      );
      rankedRows.push(...resolved);
    }
  }

  // 8. Assign 1-indexed positions
  const finalStandings: CompetitionStandingsRow[] = rankedRows.map((row, index) => ({
    position: index + 1,
    teamId: row.teamId,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDifference: row.goalDifference,
    points: row.points,
  }));

  return {
    accepted: true,
    standings: finalStandings,
  };
}

// ============================================================================
// SEASON QUERIES
// ============================================================================

export function getCompetitionFixtureResult(
  state: CompetitionSeasonState,
  fixtureId: string
): CompetitionFixtureResult | undefined {
  return state.results.find((r) => r.fixtureId === fixtureId);
}

export function getPlayedFixtureCount(state: CompetitionSeasonState): number {
  const scheduledIds = new Set<string>();
  for (const round of state.schedule.rounds) {
    for (const fixture of round.fixtures) {
      scheduledIds.add(fixture.id);
    }
  }

  const validPlayedFixtureIds = new Set<string>();
  for (const res of state.results) {
    if (
      scheduledIds.has(res.fixtureId) &&
      res.competitionId === state.competitionId &&
      res.seasonLabel === state.seasonLabel &&
      res.ruleSetId === state.ruleSetId &&
      isValidGoalScore(res.homeGoals) &&
      isValidGoalScore(res.awayGoals)
    ) {
      validPlayedFixtureIds.add(res.fixtureId);
    }
  }

  return validPlayedFixtureIds.size;
}

export function getRemainingFixtureCount(state: CompetitionSeasonState): number {
  const scheduledIds = new Set<string>();
  for (const round of state.schedule.rounds) {
    for (const fixture of round.fixtures) {
      scheduledIds.add(fixture.id);
    }
  }

  const playedCount = getPlayedFixtureCount(state);
  return Math.max(0, scheduledIds.size - playedCount);
}

export function getTeamResults(
  state: CompetitionSeasonState,
  teamId: string
): CompetitionFixtureResult[] {
  return state.results.filter(
    (r) => r.homeTeamId === teamId || r.awayTeamId === teamId
  );
}

export function getTeamPoints(
  state: CompetitionSeasonState,
  ruleSet: CompetitionRuleSet,
  teamId: string
): number | undefined {
  if (!state.schedule.participantTeamIds.includes(teamId)) {
    return undefined;
  }

  if (
    ruleSet.id !== state.ruleSetId ||
    ruleSet.competitionId !== state.competitionId ||
    ruleSet.seasonLabel !== state.seasonLabel
  ) {
    return undefined;
  }

  if (!ruleSet.standings) {
    return undefined;
  }

  const { pointsForWin, pointsForDraw, pointsForLoss } = ruleSet.standings;

  if (
    !Number.isFinite(pointsForWin) ||
    pointsForWin < 0 ||
    !Number.isFinite(pointsForDraw) ||
    pointsForDraw < 0 ||
    !Number.isFinite(pointsForLoss) ||
    pointsForLoss < 0
  ) {
    return undefined;
  }

  let totalPoints = 0;
  for (const res of state.results) {
    if (res.homeTeamId === teamId) {
      if (res.homeGoals > res.awayGoals) {
        totalPoints += pointsForWin;
      } else if (res.homeGoals < res.awayGoals) {
        totalPoints += pointsForLoss;
      } else {
        totalPoints += pointsForDraw;
      }
    } else if (res.awayTeamId === teamId) {
      if (res.awayGoals > res.homeGoals) {
        totalPoints += pointsForWin;
      } else if (res.awayGoals < res.homeGoals) {
        totalPoints += pointsForLoss;
      } else {
        totalPoints += pointsForDraw;
      }
    }
  }

  return totalPoints;
}

export function isCompetitionSeasonComplete(
  state: CompetitionSeasonState
): boolean {
  // 1. Season state must validate successfully
  const stateValidation = validateCompetitionSeasonState(state);
  if (!stateValidation.valid) {
    return false;
  }

  // 2. At least one scheduled fixture must exist
  let totalScheduled = 0;
  for (const round of state.schedule.rounds) {
    totalScheduled += round.fixtures.length;
  }
  if (totalScheduled === 0) {
    return false;
  }

  // 3. EVERY scheduled fixture ID has exactly one valid stored result
  return (
    state.results.length === totalScheduled &&
    getPlayedFixtureCount(state) === totalScheduled
  );
}
