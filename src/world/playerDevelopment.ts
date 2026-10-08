import type {
  WorldFootballPosition,
  WorldPlayerDefinition,
  WorldPlayerFootballState,
  WorldFixtureParticipation,
  WorldFixtureMatchDetail,
} from './types';

// ============================================================================
// BALANCING & GAME DESIGN CONSTANTS (PHASE 3N)
// Pro Baller simulation seeds — internal persistent development curves
// ============================================================================

export const MIN_PLAYER_POTENTIAL = 1;
export const MAX_PLAYER_POTENTIAL = 100;

// Age threshold where natural age decline begins
export const OUTFIELD_DECLINE_ONSET_AGE = 30;
export const GOALKEEPER_DECLINE_ONSET_AGE = 33;

// Safety bounds on monthly development deltas
export const MAX_MONTHLY_DECLINE = 0.35;

// Neutral match performance rating baseline
export const NEUTRAL_MATCH_RATING_BASELINE = 6.5;

// ============================================================================
// DETERMINISTIC HASH HELPER
// ============================================================================

function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// ============================================================================
// 1. AGE CALCULATION
// ============================================================================

/**
 * Derives calendar-accurate player age from ISO YYYY-MM-DD dateOfBirth
 * and simulation currentDate. Handles leap year and birthday boundaries.
 */
export function computePlayerAge(dateOfBirth: string, currentDate: string): number {
  const [bYear, bMonth, bDay] = dateOfBirth.split('-').map(Number);
  const [cYear, cMonth, cDay] = currentDate.split('-').map(Number);

  let age = cYear - bYear;
  if (cMonth < bMonth || (cMonth === bMonth && cDay < bDay)) {
    age--;
  }
  return age;
}

// ============================================================================
// 2. POTENTIAL INITIALIZATION
// ============================================================================

/**
 * Initializes latent potential for a player at snapshot bootstrap.
 *
 * Rules:
 * - Deterministic and stable across bootstrap calls.
 * - At least current ability, at most 100.
 * - Anchored strongly to current ability (no 45-ability teenager gets 90 potential).
 * - Younger players have higher headroom; players >= 28 have headroom = 0.
 * - Missing dateOfBirth receives conservative potential equal to current ability.
 */
export function computeInitialPotential(
  ability: number,
  playerId: string,
  dateOfBirth?: string,
  snapshotDate: string = '2026-10-07'
): number {
  if (!dateOfBirth) {
    // Missing DOB: conservative potential equals current ability
    return ability;
  }

  const age = computePlayerAge(dateOfBirth, snapshotDate);
  if (age >= 28) {
    return ability;
  }

  const h = hashString(`${playerId}:potential`);
  const unit = (h % 1000) / 1000; // 0..0.999

  let minHeadroom = 0;
  let maxHeadroom = 0;

  if (age <= 18) {
    minHeadroom = 6;
    maxHeadroom = 14;
  } else if (age <= 21) {
    minHeadroom = 4;
    maxHeadroom = 10;
  } else if (age <= 24) {
    minHeadroom = 2;
    maxHeadroom = 6;
  } else if (age <= 27) {
    minHeadroom = 0;
    maxHeadroom = 3;
  }

  const headroom = Math.round(minHeadroom + unit * (maxHeadroom - minHeadroom));
  const rawPotential = ability + headroom;

  return Math.min(100, Math.max(ability, rawPotential));
}

// ============================================================================
// 3. DEVELOPMENT CHECKPOINT IDENTIFICATION
// ============================================================================

/**
 * Development checkpoints execute monthly on the 1st of each calendar month.
 * (e.g. '2026-11-01', '2026-12-01', '2027-01-01')
 */
export function isDevelopmentCheckpointDate(calendarDate: string): boolean {
  return calendarDate.endsWith('-01');
}

// ============================================================================
// 4. MONTHLY DEVELOPMENT DELTA CALCULATION
// ============================================================================

export interface ComputeMonthlyDevelopmentDeltaInput {
  ability: number;
  potential: number;
  age: number;
  isGoalkeeper: boolean;
  periodMinutes: number;
  averageRating?: number;
  playerId: string;
}

/**
 * Computes net monthly ability delta (fractional points).
 *
 * Combines:
 * - Growth component: headroom * age rate * minutes factor * performance factor
 * - Decline component: age curve * ID variation * playing time mitigation
 */
export function computeMonthlyDevelopmentDelta(
  input: ComputeMonthlyDevelopmentDeltaInput
): number {
  const {
    ability,
    potential,
    age,
    isGoalkeeper,
    periodMinutes,
    averageRating,
    playerId,
  } = input;

  const declineOnsetAge = isGoalkeeper
    ? GOALKEEPER_DECLINE_ONSET_AGE
    : OUTFIELD_DECLINE_ONSET_AGE;

  // --------------------------------------------------------------------------
  // 1. Growth Component (Headroom, Age, Minutes, Performance)
  // --------------------------------------------------------------------------
  let deltaGrowth = 0;
  const headroom = potential - ability;

  if (headroom > 0 && age < declineOnsetAge) {
    let baseRate = 0;
    if (age <= 18) baseRate = 0.18;
    else if (age <= 21) baseRate = 0.14;
    else if (age <= 24) baseRate = 0.09;
    else if (age <= 27) baseRate = 0.04;
    else if (age < declineOnsetAge) baseRate = 0.01;

    // Smooth headroom saturation ratio (tapers as ceiling approaches)
    const headroomRatio = Math.min(1.0, headroom / 10.0);

    // Bounded minutes opportunity factor
    let minutesFactor = 0.70; // unplayed / bench still receives base training
    if (periodMinutes >= 270) minutesFactor = 1.25; // regular starter (3+ matches)
    else if (periodMinutes >= 180) minutesFactor = 1.05; // rotation player
    else if (periodMinutes >= 90) minutesFactor = 0.90; // fringe appearances

    // Mild match performance factor bounded within [-15%, +15%]
    let perfFactor = 1.0;
    if (averageRating !== undefined) {
      const clampedDiff = Math.max(-1.5, Math.min(1.5, averageRating - NEUTRAL_MATCH_RATING_BASELINE));
      perfFactor = 1.0 + clampedDiff * 0.10;
    }

    deltaGrowth = baseRate * headroomRatio * minutesFactor * perfFactor;
  }

  // --------------------------------------------------------------------------
  // 2. Decline Component (Age Curve, Goalkeeper Shift, ID Variation)
  // --------------------------------------------------------------------------
  let deltaDecline = 0;
  const effectiveAge = isGoalkeeper ? age - 3 : age;

  if (effectiveAge >= OUTFIELD_DECLINE_ONSET_AGE) {
    let baseDecline = 0;
    if (effectiveAge === 30) baseDecline = 0.04;
    else if (effectiveAge === 31) baseDecline = 0.07;
    else if (effectiveAge === 32) baseDecline = 0.10;
    else if (effectiveAge === 33) baseDecline = 0.14;
    else if (effectiveAge === 34) baseDecline = 0.19;
    else if (effectiveAge === 35) baseDecline = 0.24;
    else if (effectiveAge === 36) baseDecline = 0.28;
    else baseDecline = 0.30;

    // Mild stable ID variation in [0.90, 1.10]
    const h = hashString(`${playerId}:decline`);
    const varFactor = 0.90 + 0.20 * ((h % 1000) / 1000);

    // Active minutes slightly buffer decline
    let minBuffer = 1.0;
    if (periodMinutes >= 270) minBuffer = 0.90;
    else if (periodMinutes === 0) minBuffer = 1.10;

    deltaDecline = Math.min(
      MAX_MONTHLY_DECLINE,
      baseDecline * varFactor * minBuffer
    );
  }

  return deltaGrowth - deltaDecline;
}

// ============================================================================
// 5. FRACTIONAL ACCUMULATION & INTEGER ABILITY UPDATE
// ============================================================================

export interface PlayerProgressUpdateResult {
  newAbility: number;
  newProgress: number;
}

/**
 * Applies fractional delta to a player's accumulated developmentProgress.
 * When progress crosses +1.0 or -1.0, adjusts integer ability accordingly.
 * Enforces strict clamping: ability in [1, 100] and ability <= potential.
 */
export function updatePlayerProgress(
  ability: number,
  potential: number,
  progress: number,
  delta: number
): PlayerProgressUpdateResult {
  const rawProgress = progress + delta;
  let newAbility = ability;
  let newProgress = rawProgress;

  if (rawProgress >= 1.0) {
    const gain = Math.floor(rawProgress);
    newAbility = Math.min(potential, Math.min(100, ability + gain));
    if (newAbility >= potential) {
      // Reached potential ceiling: clear fractional accumulation
      newProgress = 0;
    } else {
      newProgress = rawProgress - gain;
    }
  } else if (rawProgress <= -1.0) {
    const loss = Math.floor(Math.abs(rawProgress));
    newAbility = Math.max(1, ability - loss);
    if (newAbility <= 1) {
      newProgress = 0;
    } else {
      newProgress = rawProgress + loss;
    }
  }

  // Ensure strict post-conversion invariant: -1 < newProgress < 1
  if (newProgress >= 1.0) newProgress = 0.99;
  else if (newProgress <= -1.0) newProgress = -0.99;

  return { newAbility, newProgress };
}

// ============================================================================
// 6. MONTHLY CHECKPOINT RUNNER
// ============================================================================

export interface ApplyMonthlyDevelopmentParams {
  playerStates: Map<string, WorldPlayerFootballState>;
  players: Array<{ id: string; dateOfBirth?: string; [key: string]: any }>;
  playerPositions: Map<string, WorldFootballPosition> | Record<string, WorldFootballPosition>;
  participationsInWindow: WorldFixtureParticipation[];
  matchDetailsInWindow: Map<string, WorldFixtureMatchDetail>;
  checkpointDate: string;
  userControlledPlayerIds?: ReadonlySet<string>;
}

/**
 * Runs a monthly development checkpoint across all world players.
 * Returns an updated map of WorldPlayerFootballState.
 */
export function applyMonthlyWorldPlayerDevelopment(
  params: ApplyMonthlyDevelopmentParams
): Map<string, WorldPlayerFootballState> {
  const {
    playerStates,
    players,
    playerPositions,
    participationsInWindow,
    matchDetailsInWindow,
    checkpointDate,
    userControlledPlayerIds,
  } = params;

  const userControlledSet = userControlledPlayerIds;

  // 1. Aggregate period minutes and match ratings
  const playerMinutes = new Map<string, number>();
  const playerRatings = new Map<string, number[]>();

  for (const part of participationsInWindow) {
    const detail = matchDetailsInWindow.get(part.fixtureId);
    for (const app of part.playerAppearances) {
      if (app.minutesPlayed > 0) {
        playerMinutes.set(
          app.playerId,
          (playerMinutes.get(app.playerId) ?? 0) + app.minutesPlayed
        );
      }
    }
    if (detail) {
      for (const r of detail.playerRatings) {
        const list = playerRatings.get(r.playerId) ?? [];
        list.push(r.rating);
        playerRatings.set(r.playerId, list);
      }
    }
  }

  // 2. Index player definitions
  const playerDefMap = new Map<string, { id: string; dateOfBirth?: string; [key: string]: any }>();
  for (const p of players) {
    playerDefMap.set(p.id, p);
  }

  // 3. Process each player
  const updatedStates = new Map<string, WorldPlayerFootballState>();

  for (const [playerId, state] of playerStates.entries()) {
    // User-controlled player: career layer owns development, skip NPC growth/decline
    if (userControlledSet && userControlledSet.has(playerId)) {
      updatedStates.set(playerId, { ...state });
      continue;
    }

    const pDef = playerDefMap.get(playerId);
    const dob = pDef?.dateOfBirth;

    // Unknown DOB: neutral plateau, no age-specific growth or decline
    if (!dob) {
      updatedStates.set(playerId, { ...state });
      continue;
    }

    const age = computePlayerAge(dob, checkpointDate);

    // Resolve position
    let pos: WorldFootballPosition | undefined;
    if (playerPositions instanceof Map) {
      pos = playerPositions.get(playerId);
    } else {
      pos = (playerPositions as Record<string, WorldFootballPosition>)[playerId];
    }
    const isGoalkeeper = pos === 'GK';

    const periodMinutes = playerMinutes.get(playerId) ?? 0;
    const ratings = playerRatings.get(playerId);
    const averageRating =
      ratings && ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : undefined;

    const delta = computeMonthlyDevelopmentDelta({
      ability: state.ability,
      potential: state.potential,
      age,
      isGoalkeeper,
      periodMinutes,
      averageRating,
      playerId,
    });

    const currentProgress = state.developmentProgress ?? 0;
    const { newAbility, newProgress } = updatePlayerProgress(
      state.ability,
      state.potential,
      currentProgress,
      delta
    );

    updatedStates.set(playerId, {
      ...state,
      ability: newAbility,
      developmentProgress: newProgress,
    });
  }

  return updatedStates;
}
