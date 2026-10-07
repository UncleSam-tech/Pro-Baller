import { createRng, hashString } from './worldProgression';
import { mapPositionToBroadRole, type WorldBroadRole } from './matchSquadSelection';
import type {
  WorldFootballPosition,
  WorldGoalEvent,
  WorldYellowCardEvent,
  WorldMatchEvent,
  WorldPlayerMatchRating,
  WorldFixtureMatchDetail,
  WorldMatchTeamSelection,
  WorldPlayerFootballState,
} from './types';

// ============================================================================
// CALIBRATED EVENT ATTRIBUTION & RATING CONSTANTS (PHASE 3M)
// ============================================================================

/** Role-based scoring preference weights */
export const SCORER_WEIGHT_ATT = 6.0;
export const SCORER_WEIGHT_MID = 2.5;
export const SCORER_WEIGHT_DEF = 0.5;
export const SCORER_WEIGHT_GK = 0.01;

/** Fixed calibrated probability that a goal is assisted */
export const ASSIST_PROBABILITY = 0.75;

/** Role-based assist preference weights */
export const ASSIST_WEIGHT_MID = 4.5;
export const ASSIST_WEIGHT_ATT = 3.0;
export const ASSIST_WEIGHT_DEF = 1.5;
export const ASSIST_WEIGHT_GK = 0.05;

/** Per-player yellow card probabilities per 90-minute appearance */
export const CARD_PROB_DEF = 0.14;
export const CARD_PROB_MID = 0.14;
export const CARD_PROB_ATT = 0.08;
export const CARD_PROB_GK = 0.02;

/** Match rating scale and modifiers */
export const RATING_BASELINE = 6.5;
export const RATING_GOAL_BONUS = 1.0;
export const RATING_ASSIST_BONUS = 0.5;
export const RATING_YELLOW_CARD_PENALTY = -0.3;
export const RATING_WIN_BONUS = 0.3;
export const RATING_DRAW_BONUS = 0.0;
export const RATING_LOSS_PENALTY = -0.3;
export const RATING_CLEAN_SHEET_BONUS = 0.5;
export const RATING_CONCEDED_GOAL_PENALTY = -0.2;
export const MIN_RATING = 1.0;
export const MAX_RATING = 10.0;

// ============================================================================
// HELPER SELECTION WEIGHTS
// ============================================================================

function getScorerRoleWeight(role: WorldBroadRole): number {
  switch (role) {
    case 'ATT':
      return SCORER_WEIGHT_ATT;
    case 'MID':
      return SCORER_WEIGHT_MID;
    case 'DEF':
      return SCORER_WEIGHT_DEF;
    case 'GK':
      return SCORER_WEIGHT_GK;
  }
}

function getAssistRoleWeight(role: WorldBroadRole): number {
  switch (role) {
    case 'MID':
      return ASSIST_WEIGHT_MID;
    case 'ATT':
      return ASSIST_WEIGHT_ATT;
    case 'DEF':
      return ASSIST_WEIGHT_DEF;
    case 'GK':
      return ASSIST_WEIGHT_GK;
  }
}

function getCardProbability(role: WorldBroadRole): number {
  switch (role) {
    case 'DEF':
      return CARD_PROB_DEF;
    case 'MID':
      return CARD_PROB_MID;
    case 'ATT':
      return CARD_PROB_ATT;
    case 'GK':
      return CARD_PROB_GK;
  }
}

function resolvePlayerPosition(
  playerId: string,
  positions?: Map<string, WorldFootballPosition> | Record<string, WorldFootballPosition>
): WorldFootballPosition | undefined {
  if (!positions) return undefined;
  if (positions instanceof Map) {
    return positions.get(playerId);
  }
  return positions[playerId];
}

/**
 * Deterministically samples one item from a weighted pool.
 */
function sampleWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  let totalWeight = 0;
  for (const w of weights) {
    totalWeight += Math.max(0.0001, w);
  }

  const threshold = rng() * totalWeight;
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += Math.max(0.0001, weights[i]);
    if (cumulative >= threshold) {
      return items[i];
    }
  }
  return items[items.length - 1];
}

// ============================================================================
// GENERATION INTERFACE & MAIN ENGINE FUNCTION
// ============================================================================

export interface GenerateFixtureMatchDetailInput {
  fixture: {
    id: string;
    homeTeamId: string;
    awayTeamId: string;
  };
  homeGoals: number;
  awayGoals: number;
  homeSelection: WorldMatchTeamSelection;
  awaySelection: WorldMatchTeamSelection;
  playerStates: Map<string, WorldPlayerFootballState>;
  playerPositions?:
    | Map<string, WorldFootballPosition>
    | Record<string, WorldFootballPosition>;
  baseFixtureSeedKey: string;
}

/**
 * Generates deterministic player match events (goals, assists, yellow cards)
 * and player match ratings for a newly simulated fixture.
 *
 * Core Invariant: Does NOT change the already-determined homeGoals and awayGoals.
 * Event attribution uses separate namespaced PRNG streams to guarantee score stream safety.
 */
export function generateFixtureMatchDetail(
  input: GenerateFixtureMatchDetailInput
): WorldFixtureMatchDetail | null {
  const {
    fixture,
    homeGoals,
    awayGoals,
    homeSelection,
    awaySelection,
    playerStates,
    playerPositions,
    baseFixtureSeedKey,
  } = input;

  const homeStarters = homeSelection.startingPlayerIds;
  const awayStarters = awaySelection.startingPlayerIds;

  // Invariant: Both teams must have appearing players to truthfully construct a match detail
  if (homeStarters.length === 0 || awayStarters.length === 0) {
    return null;
  }

  // Dedicated independent sub-stream PRNGs
  const rngGoals = createRng(hashString(`${baseFixtureSeedKey}:events:goals`));
  const rngAssists = createRng(hashString(`${baseFixtureSeedKey}:events:assists`));
  const rngCards = createRng(hashString(`${baseFixtureSeedKey}:events:cards`));
  const rngRatings = createRng(hashString(`${baseFixtureSeedKey}:events:ratings`));

  const events: WorldMatchEvent[] = [];

  // --------------------------------------------------------------------------
  // 1. GOAL ATTRIBUTION (HOME & AWAY)
  // --------------------------------------------------------------------------

  function attributeGoals(teamId: string, starters: string[], goalCount: number) {
    if (goalCount <= 0 || starters.length === 0) return;

    // Precalculate weights for all starters
    const scorerWeights = starters.map((playerId) => {
      const pState = playerStates.get(playerId);
      const pos = resolvePlayerPosition(playerId, playerPositions);
      const role = mapPositionToBroadRole(pos);
      const baseRoleWeight = getScorerRoleWeight(role);

      const ability = pState?.ability ?? 50;
      const form = pState?.form ?? 50;
      const sharpness = pState?.sharpness ?? 50;

      const abilityFactor = Math.max(0.2, ability / 50);
      const formFactor = 0.85 + 0.15 * (form / 50);
      const sharpnessFactor = 0.9 + 0.1 * (sharpness / 50);

      return baseRoleWeight * abilityFactor * formFactor * sharpnessFactor;
    });

    for (let g = 0; g < goalCount; g++) {
      const scorerId = sampleWeighted(starters, scorerWeights, rngGoals);
      const minute = Math.floor(rngGoals() * 90) + 1; // 1..90 integer

      // Assist attribution
      let assistPlayerId: string | undefined = undefined;
      const isAssisted = rngAssists() < ASSIST_PROBABILITY;

      if (isAssisted && starters.length > 1) {
        const eligibleAssisters = starters.filter((id) => id !== scorerId);
        const assistWeights = eligibleAssisters.map((playerId) => {
          const pState = playerStates.get(playerId);
          const pos = resolvePlayerPosition(playerId, playerPositions);
          const role = mapPositionToBroadRole(pos);
          const baseRoleWeight = getAssistRoleWeight(role);

          const ability = pState?.ability ?? 50;
          const form = pState?.form ?? 50;
          const abilityFactor = Math.max(0.2, ability / 50);
          const formFactor = 0.85 + 0.15 * (form / 50);

          return baseRoleWeight * abilityFactor * formFactor;
        });

        assistPlayerId = sampleWeighted(eligibleAssisters, assistWeights, rngAssists);
      }

      events.push({
        type: 'GOAL',
        teamId,
        playerId: scorerId,
        assistPlayerId,
        minute,
      });
    }
  }

  attributeGoals(fixture.homeTeamId, homeSelection.startingPlayerIds, homeGoals);
  attributeGoals(fixture.awayTeamId, awaySelection.startingPlayerIds, awayGoals);

  // --------------------------------------------------------------------------
  // 2. YELLOW CARDS (HOME & AWAY)
  // --------------------------------------------------------------------------

  function attributeYellowCards(teamId: string, starters: string[]) {
    for (const playerId of starters) {
      const pos = resolvePlayerPosition(playerId, playerPositions);
      const role = mapPositionToBroadRole(pos);
      const prob = getCardProbability(role);

      if (rngCards() < prob) {
        const minute = Math.floor(rngCards() * 90) + 1;
        events.push({
          type: 'YELLOW_CARD',
          teamId,
          playerId,
          minute,
        });
      }
    }
  }

  attributeYellowCards(fixture.homeTeamId, homeSelection.startingPlayerIds);
  attributeYellowCards(fixture.awayTeamId, awaySelection.startingPlayerIds);

  // --------------------------------------------------------------------------
  // 3. CHRONOLOGICAL EVENT SORTING
  // --------------------------------------------------------------------------

  events.sort((a, b) => {
    if (a.minute !== b.minute) {
      return a.minute - b.minute;
    }
    // Goals before yellow cards if on same minute
    if (a.type !== b.type) {
      return a.type === 'GOAL' ? -1 : 1;
    }
    if (a.teamId !== b.teamId) {
      return a.teamId.localeCompare(b.teamId);
    }
    return a.playerId.localeCompare(b.playerId);
  });

  // --------------------------------------------------------------------------
  // 4. MATCH RATINGS FOR APPEARING PLAYERS
  // --------------------------------------------------------------------------

  const playerRatings: WorldPlayerMatchRating[] = [];

  const goalsByPlayer = new Map<string, number>();
  const assistsByPlayer = new Map<string, number>();
  const yellowsByPlayer = new Set<string>();

  for (const event of events) {
    if (event.type === 'GOAL') {
      goalsByPlayer.set(event.playerId, (goalsByPlayer.get(event.playerId) ?? 0) + 1);
      if (event.assistPlayerId) {
        assistsByPlayer.set(
          event.assistPlayerId,
          (assistsByPlayer.get(event.assistPlayerId) ?? 0) + 1
        );
      }
    } else if (event.type === 'YELLOW_CARD') {
      yellowsByPlayer.add(event.playerId);
    }
  }

  const homeWon = homeGoals > awayGoals;
  const awayWon = awayGoals > homeGoals;
  const isDraw = homeGoals === awayGoals;

  function generateRatingsForTeam(
    teamId: string,
    starters: string[],
    isWinner: boolean,
    isLoser: boolean,
    teamGoalsScored: number,
    teamGoalsConceded: number
  ) {
    for (const playerId of starters) {
      const pState = playerStates.get(playerId);
      const pos = resolvePlayerPosition(playerId, playerPositions);
      const role = mapPositionToBroadRole(pos);

      let rating = RATING_BASELINE;

      // Result modifier
      if (isWinner) {
        rating += RATING_WIN_BONUS;
      } else if (isLoser) {
        rating += RATING_LOSS_PENALTY;
      } else {
        rating += RATING_DRAW_BONUS;
      }

      // Goals modifier
      const goals = goalsByPlayer.get(playerId) ?? 0;
      rating += goals * RATING_GOAL_BONUS;

      // Assists modifier
      const assists = assistsByPlayer.get(playerId) ?? 0;
      rating += assists * RATING_ASSIST_BONUS;

      // Yellow card penalty
      if (yellowsByPlayer.has(playerId)) {
        rating += RATING_YELLOW_CARD_PENALTY;
      }

      // Defensive / Offensive role nuances
      if (role === 'GK' || role === 'DEF') {
        if (teamGoalsConceded === 0) {
          rating += RATING_CLEAN_SHEET_BONUS;
        } else if (teamGoalsConceded > 1) {
          rating += Math.max(-1.0, (teamGoalsConceded - 1) * RATING_CONCEDED_GOAL_PENALTY);
        }
      } else if (role === 'ATT' || role === 'MID') {
        if (teamGoalsScored >= 3) {
          rating += 0.2;
        }
      }

      // Subtle ability nuance
      const ability = pState?.ability ?? 50;
      rating += ((ability - 50) / 100) * 0.2;

      // Subtle deterministic match noise bounded to ±0.1
      const noise = (rngRatings() - 0.5) * 0.2;
      rating += noise;

      // Clamp to [MIN_RATING, MAX_RATING] and round to exactly 1 decimal place
      const clamped = Math.max(MIN_RATING, Math.min(MAX_RATING, rating));
      const rounded = Number(clamped.toFixed(1));

      playerRatings.push({
        playerId,
        teamId,
        rating: rounded,
      });
    }
  }

  generateRatingsForTeam(
    fixture.homeTeamId,
    homeSelection.startingPlayerIds,
    homeWon,
    awayWon,
    homeGoals,
    awayGoals
  );
  generateRatingsForTeam(
    fixture.awayTeamId,
    awaySelection.startingPlayerIds,
    awayWon,
    homeWon,
    awayGoals,
    homeGoals
  );

  return {
    fixtureId: fixture.id,
    events,
    playerRatings,
  };
}

// ============================================================================
// VALIDATION HELPER
// ============================================================================

export interface ValidationMatchDetailOptions {
  homeTeamId?: string;
  awayTeamId?: string;
  homeGoals?: number;
  awayGoals?: number;
  expectedAppearingPlayerIds?: Set<string>;
  knownPlayerIds?: Set<string>;
}

export interface MatchDetailValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWorldFixtureMatchDetail(
  detail: WorldFixtureMatchDetail,
  options?: ValidationMatchDetailOptions
): MatchDetailValidationResult {
  const errors: string[] = [];

  if (!detail.fixtureId || typeof detail.fixtureId !== 'string') {
    errors.push('fixtureId must be a non-empty string');
  }

  if (!Array.isArray(detail.events)) {
    errors.push('events must be an array');
  }

  if (!Array.isArray(detail.playerRatings)) {
    errors.push('playerRatings must be an array');
  }

  const yellowCardRecipients = new Set<string>();
  let homeGoalCount = 0;
  let awayGoalCount = 0;

  for (const event of detail.events ?? []) {
    if (!Number.isInteger(event.minute) || event.minute < 1 || event.minute > 90) {
      errors.push(`Event minute must be an integer between 1 and 90, got: ${event.minute}`);
    }

    if (
      event.playerId.endsWith('-unassigned') ||
      event.playerId.includes('unassigned') ||
      event.playerId.includes('placeholder')
    ) {
      errors.push(`Event participant contains placeholder player ID: ${event.playerId}`);
    }

    if (
      options?.expectedAppearingPlayerIds &&
      !options.expectedAppearingPlayerIds.has(event.playerId)
    ) {
      errors.push(`Event participant ${event.playerId} was not an appearing player`);
    }

    if (
      options?.knownPlayerIds &&
      !options.knownPlayerIds.has(event.playerId)
    ) {
      errors.push(`Event participant ${event.playerId} is not a known player in world context`);
    }

    if (event.type === 'GOAL') {
      if (options?.homeTeamId && event.teamId === options.homeTeamId) {
        homeGoalCount++;
      } else if (options?.awayTeamId && event.teamId === options.awayTeamId) {
        awayGoalCount++;
      }

      if (event.assistPlayerId) {
        if (event.assistPlayerId === event.playerId) {
          errors.push(`Goal scorer cannot assist themselves (${event.playerId})`);
        }
        if (
          event.assistPlayerId.endsWith('-unassigned') ||
          event.assistPlayerId.includes('unassigned') ||
          event.assistPlayerId.includes('placeholder')
        ) {
          errors.push(`Assist provider contains placeholder player ID: ${event.assistPlayerId}`);
        }
        if (
          options?.expectedAppearingPlayerIds &&
          !options.expectedAppearingPlayerIds.has(event.assistPlayerId)
        ) {
          errors.push(`Assist provider ${event.assistPlayerId} was not an appearing player`);
        }
        if (
          options?.knownPlayerIds &&
          !options.knownPlayerIds.has(event.assistPlayerId)
        ) {
          errors.push(`Assist provider ${event.assistPlayerId} is not a known player in world context`);
        }
      }
    } else if (event.type === 'YELLOW_CARD') {
      if (yellowCardRecipients.has(event.playerId)) {
        errors.push(`Player ${event.playerId} received more than one yellow card`);
      }
      yellowCardRecipients.add(event.playerId);
    } else {
      errors.push(`Unrecognized event type: ${(event as any).type}`);
    }
  }

  if (options?.homeGoals !== undefined && homeGoalCount !== options.homeGoals) {
    errors.push(`Home goal event count (${homeGoalCount}) does not match homeGoals (${options.homeGoals})`);
  }

  if (options?.awayGoals !== undefined && awayGoalCount !== options.awayGoals) {
    errors.push(`Away goal event count (${awayGoalCount}) does not match awayGoals (${options.awayGoals})`);
  }

  // Player rating validation
  const ratedPlayerIds = new Set<string>();
  for (const r of detail.playerRatings ?? []) {
    if (ratedPlayerIds.has(r.playerId)) {
      errors.push(`Duplicate rating for player ${r.playerId}`);
    }
    ratedPlayerIds.add(r.playerId);

    if (
      r.playerId.endsWith('-unassigned') ||
      r.playerId.includes('unassigned') ||
      r.playerId.includes('placeholder')
    ) {
      errors.push(`Rating contains placeholder player ID: ${r.playerId}`);
    }

    if (options?.expectedAppearingPlayerIds && !options.expectedAppearingPlayerIds.has(r.playerId)) {
      errors.push(`Player ${r.playerId} received rating without appearing`);
    }

    if (options?.knownPlayerIds && !options.knownPlayerIds.has(r.playerId)) {
      errors.push(`Rated player ${r.playerId} is not a known player in world context`);
    }

    if (typeof r.rating !== 'number' || isNaN(r.rating) || r.rating < MIN_RATING || r.rating > MAX_RATING) {
      errors.push(`Rating ${r.rating} for player ${r.playerId} out of bounds [${MIN_RATING}, ${MAX_RATING}]`);
    }

    // Check one decimal place
    const rounded = Number(r.rating.toFixed(1));
    if (Math.abs(r.rating - rounded) > 0.0001) {
      errors.push(`Rating ${r.rating} for player ${r.playerId} must have at most 1 decimal place`);
    }
  }

  if (options?.expectedAppearingPlayerIds) {
    for (const expectedId of options.expectedAppearingPlayerIds) {
      if (!ratedPlayerIds.has(expectedId)) {
        errors.push(`Appearing player ${expectedId} did not receive a match rating`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
