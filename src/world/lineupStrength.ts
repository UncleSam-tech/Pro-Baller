import type {
  WorldFootballPosition,
  WorldPlayerFootballState,
} from './types';
import {
  mapPositionToBroadRole,
  selectMatchTeamSquad,
  type SelectMatchTeamSquadOptions,
  type WorldBroadRole,
} from './matchSquadSelection';

// ============================================================================
// CANONICAL CONSTANTS FOR PHASE 3L LINEUP QUALITY & MODIFIERS
// ============================================================================

/** Conservative clamping bounds to prevent extreme distortions */
export const MIN_LINEUP_MODIFIER = 0.85;
export const MAX_LINEUP_MODIFIER = 1.15;

/** Neutral condition baseline constants */
export const NEUTRAL_FITNESS = 100;
export const NEUTRAL_SHARPNESS = 70;
export const NEUTRAL_FORM = 60;
export const NEUTRAL_MORALE = 70;

// Role weights for attacking quality
export const ATTACK_ROLE_WEIGHTS: Readonly<Record<WorldBroadRole, number>> = {
  ATT: 1.0,
  MID: 0.6,
  DEF: 0.1,
  GK: 0.0,
};

// Role weights for defensive quality
export const DEFENSE_ROLE_WEIGHTS: Readonly<Record<WorldBroadRole, number>> = {
  GK: 1.0,
  DEF: 1.0,
  MID: 0.6,
  ATT: 0.1,
};

export interface LineupQuality {
  attackingQuality: number;
  defensiveQuality: number;
}

export interface LineupStrengthModifiers {
  homeAttackMultiplier: number;
  homeDefensiveResistanceMultiplier: number;
  awayAttackMultiplier: number;
  awayDefensiveResistanceMultiplier: number;
}

// ============================================================================
// PURE CALCULATION HELPERS
// ============================================================================

/**
 * Computes an individual player's effective match performance rating.
 * Ability is dominant (~95-98%), gently modified by temporary condition
 * (fitness, sharpness, form, morale).
 * At neutral condition (fit: 100, sharp: 70, form: 60, morale: 70),
 * effective quality is EXACTLY equal to ability.
 */
export function computePlayerEffectiveQuality(
  player: WorldPlayerFootballState
): number {
  const fitnessDelta = (player.fitness - NEUTRAL_FITNESS) * 0.08;
  const sharpnessDelta = (player.sharpness - NEUTRAL_SHARPNESS) * 0.03;
  const formDelta = (player.form - NEUTRAL_FORM) * 0.05;
  const moraleDelta = (player.morale - NEUTRAL_MORALE) * 0.02;

  return Math.max(
    1,
    Math.min(
      100,
      player.ability + fitnessDelta + sharpnessDelta + formDelta + moraleDelta
    )
  );
}

/**
 * Computes the aggregate attacking and defensive quality of a starting XI.
 * Weights players by broad role:
 * - ATT: primary attack, minimal defense
 * - DEF + GK: primary defense, minimal attack
 * - MID: substantial contribution to both
 */
export function computeLineupQuality(
  startingPlayerIds: string[],
  playerStatesMap: Map<string, WorldPlayerFootballState>,
  playerPositions?:
    | Map<string, WorldFootballPosition>
    | Record<string, WorldFootballPosition>
    | ((id: string) => WorldFootballPosition | undefined)
): LineupQuality {
  let totalAttWeight = 0;
  let weightedAttQuality = 0;

  let totalDefWeight = 0;
  let weightedDefQuality = 0;

  for (const id of startingPlayerIds) {
    const state = playerStatesMap.get(id);
    if (!state) continue;

    let pos: WorldFootballPosition | undefined;
    if (playerPositions) {
      if (typeof playerPositions === 'function') {
        pos = playerPositions(id);
      } else if (playerPositions instanceof Map) {
        pos = playerPositions.get(id);
      } else {
        pos = playerPositions[id];
      }
    }

    const broadRole = mapPositionToBroadRole(pos);
    const effQuality = computePlayerEffectiveQuality(state);

    const attWeight = ATTACK_ROLE_WEIGHTS[broadRole];
    const defWeight = DEFENSE_ROLE_WEIGHTS[broadRole];

    weightedAttQuality += effQuality * attWeight;
    totalAttWeight += attWeight;

    weightedDefQuality += effQuality * defWeight;
    totalDefWeight += defWeight;
  }

  const attackingQuality =
    totalAttWeight > 0 ? weightedAttQuality / totalAttWeight : 50;
  const defensiveQuality =
    totalDefWeight > 0 ? weightedDefQuality / totalDefWeight : 50;

  return { attackingQuality, defensiveQuality };
}

/**
 * Computes a club's reference (neutral) starting XI quality from its squad.
 * Uses each player's true ability combined with neutral condition assumptions.
 * This baseline represents the club's normal strength and eliminates double-counting.
 */
export function computeClubReferenceLineupQuality(
  clubId: string,
  squadPlayerIds: string[],
  playerStatesMap: Map<string, WorldPlayerFootballState>,
  options?: SelectMatchTeamSquadOptions
): LineupQuality {
  // Construct neutral player football states
  const neutralStatesMap = new Map<string, WorldPlayerFootballState>();
  for (const id of squadPlayerIds) {
    const s = playerStatesMap.get(id);
    if (s) {
      neutralStatesMap.set(id, {
        ...s,
        fitness: NEUTRAL_FITNESS,
        sharpness: NEUTRAL_SHARPNESS,
        form: NEUTRAL_FORM,
        morale: NEUTRAL_MORALE,
      });
    }
  }

  const refSelection = selectMatchTeamSquad(
    clubId,
    squadPlayerIds,
    neutralStatesMap,
    options
  );

  return computeLineupQuality(
    refSelection.startingPlayerIds,
    neutralStatesMap,
    options?.playerPositions
  );
}

/**
 * Calculates bounded match strength multipliers by comparing today's XI
 * against the club's reference baseline.
 * - attackStrengthMultiplier: answers "How strongly does today's XI attack relative to normal?"
 * - defensiveResistanceMultiplier: answers "How strongly does today's XI resist conceding relative to normal?"
 */
export function computeLineupStrengthModifiers(
  todayQuality: LineupQuality,
  referenceQuality: LineupQuality
): { attackStrengthMultiplier: number; defensiveResistanceMultiplier: number } {
  const rawAttack =
    referenceQuality.attackingQuality > 0
      ? todayQuality.attackingQuality / referenceQuality.attackingQuality
      : 1.0;

  const rawDefense =
    referenceQuality.defensiveQuality > 0
      ? todayQuality.defensiveQuality / referenceQuality.defensiveQuality
      : 1.0;

  const attackStrengthMultiplier = Math.max(
    MIN_LINEUP_MODIFIER,
    Math.min(MAX_LINEUP_MODIFIER, rawAttack)
  );

  const defensiveResistanceMultiplier = Math.max(
    MIN_LINEUP_MODIFIER,
    Math.min(MAX_LINEUP_MODIFIER, rawDefense)
  );

  return {
    attackStrengthMultiplier,
    defensiveResistanceMultiplier,
  };
}
