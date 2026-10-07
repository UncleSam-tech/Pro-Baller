import type { WorldPlayerFootballState } from './types';

// ============================================================================
// CANONICAL CONSTANTS FOR PHASE 3K CONDITION EFFECTS & RECOVERY
// ============================================================================

export const MATCH_FITNESS_COST_FULL = 20;
export const DAILY_FITNESS_RECOVERY = 4;
export const MATCH_SHARPNESS_GAIN_FULL = 4;

export const MATCH_FORM_WIN_DELTA = 3;
export const MATCH_FORM_DRAW_DELTA = 1;
export const MATCH_FORM_LOSS_DELTA = -2;

export const MATCH_MORALE_WIN_DELTA = 2;
export const MATCH_MORALE_DRAW_DELTA = 0;
export const MATCH_MORALE_LOSS_DELTA = -1;

export const MIN_CONDITION_VALUE = 0;
export const MAX_CONDITION_VALUE = 100;

// ============================================================================
// PURE HELPERS
// ============================================================================

/**
 * Clamps a condition value to an integer within [MIN_CONDITION_VALUE, MAX_CONDITION_VALUE].
 */
export function clampCondition(value: number): number {
  return Math.max(
    MIN_CONDITION_VALUE,
    Math.min(MAX_CONDITION_VALUE, Math.round(value))
  );
}

/**
 * Applies daily calendar fitness recovery to a player.
 * Only applied on calendar days where the player did not participate in a match.
 * Ability, sharpness, form, and morale remain unchanged.
 */
export function applyDailyRecovery(
  player: WorldPlayerFootballState
): WorldPlayerFootballState {
  return {
    ...player,
    fitness: clampCondition(player.fitness + DAILY_FITNESS_RECOVERY),
  };
}

/**
 * Applies match participation effects (fatigue, sharpness, form, morale) to a player.
 * Scaled by minutes played relative to a full 90-minute match.
 * Non-participants (minutesPlayed <= 0) receive no match effects.
 * Ability is strictly immutable.
 */
export function applyMatchConditionEffects(
  player: WorldPlayerFootballState,
  minutesPlayed: number,
  teamResult: 'win' | 'draw' | 'loss'
): WorldPlayerFootballState {
  if (minutesPlayed <= 0) {
    return { ...player };
  }

  const minutesRatio = minutesPlayed / 90;

  // Fitness cost
  const fitnessCost = Math.round(MATCH_FITNESS_COST_FULL * minutesRatio);
  const nextFitness = clampCondition(player.fitness - fitnessCost);

  // Sharpness boost
  const sharpnessGain = Math.round(MATCH_SHARPNESS_GAIN_FULL * minutesRatio);
  const nextSharpness = clampCondition(player.sharpness + sharpnessGain);

  // Form delta by team match result
  let formDelta: number;
  if (teamResult === 'win') {
    formDelta = MATCH_FORM_WIN_DELTA;
  } else if (teamResult === 'draw') {
    formDelta = MATCH_FORM_DRAW_DELTA;
  } else {
    formDelta = MATCH_FORM_LOSS_DELTA;
  }
  const nextForm = clampCondition(player.form + formDelta);

  // Morale delta by team match result
  let moraleDelta: number;
  if (teamResult === 'win') {
    moraleDelta = MATCH_MORALE_WIN_DELTA;
  } else if (teamResult === 'draw') {
    moraleDelta = MATCH_MORALE_DRAW_DELTA;
  } else {
    moraleDelta = MATCH_MORALE_LOSS_DELTA;
  }
  const nextMorale = clampCondition(player.morale + moraleDelta);

  return {
    ...player,
    fitness: nextFitness,
    sharpness: nextSharpness,
    form: nextForm,
    morale: nextMorale,
  };
}
