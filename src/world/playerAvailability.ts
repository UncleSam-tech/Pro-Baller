import { addDaysToDate, createRng, hashString } from './worldProgression';
import { getActiveSuspensions } from '../competition/disciplinaryEngine';
import type {
  WorldPlayerAvailabilityState,
  WorldPlayerInjury,
} from './types';

// ============================================================================
// CANONICAL INJURY CATALOG (PHASE 3O)
// ============================================================================

export interface WorldInjuryDefinition {
  type: string;
  name: string;
  minDays: number;
  maxDays: number;
  severity: 'minor' | 'moderate' | 'serious';
  relativeWeight: number;
}

export const CANONICAL_INJURY_CATALOG: WorldInjuryDefinition[] = [
  {
    type: 'minor_knock',
    name: 'Minor Knock',
    minDays: 2,
    maxDays: 6,
    severity: 'minor',
    relativeWeight: 45,
  },
  {
    type: 'muscle_strain',
    name: 'Muscle Strain',
    minDays: 7,
    maxDays: 14,
    severity: 'moderate',
    relativeWeight: 25,
  },
  {
    type: 'ankle_sprain',
    name: 'Ankle Sprain',
    minDays: 10,
    maxDays: 21,
    severity: 'moderate',
    relativeWeight: 15,
  },
  {
    type: 'hamstring_strain',
    name: 'Hamstring Strain',
    minDays: 14,
    maxDays: 28,
    severity: 'moderate',
    relativeWeight: 10,
  },
  {
    type: 'knee_injury',
    name: 'Knee Injury',
    minDays: 28,
    maxDays: 60,
    severity: 'serious',
    relativeWeight: 5,
  },
];

// Calibrated injury probability constants
export const BASE_INJURY_PROBABILITY_PER_90 = 0.006; // ~0.13 injuries per 22-player match
export const MAX_INJURY_PROBABILITY = 0.025;

// ============================================================================
// 1. AVAILABILITY CHECKER
// ============================================================================

export interface PlayerAvailabilityCheckResult {
  available: boolean;
  reason?: 'INJURED' | 'SUSPENDED';
}

/**
 * Authoritative pure check: Can this player be selected for this fixture?
 *
 * Rules:
 * - Active injury: player is UNAVAILABLE if fixtureDate < availableFromDate.
 *   On and after availableFromDate, player is available.
 * - Active suspension: player is UNAVAILABLE if they have an active suspension
 *   in this competition with matchesRemaining > 0.
 *   Uses canonical PlayerCompetitionDisciplinaryState when present.
 *   Suspension in competition A does NOT block selection in competition B.
 */
export function isPlayerAvailableForFixture(
  playerId: string,
  fixtureDate: string,
  competitionId: string,
  availabilityState?: WorldPlayerAvailabilityState
): PlayerAvailabilityCheckResult {
  if (!availabilityState) {
    return { available: true };
  }

  // 1. Injury check
  if (availabilityState.injury) {
    if (fixtureDate < availabilityState.injury.availableFromDate) {
      return { available: false, reason: 'INJURED' };
    }
  }

  // 2. Canonical competition disciplinary state check (Phase 3T)
  if (availabilityState.disciplinaryStates && availabilityState.disciplinaryStates.length > 0) {
    const discState = availabilityState.disciplinaryStates.find(
      s => s.competitionId === competitionId
    );
    if (discState) {
      const activeBans = getActiveSuspensions(discState);
      if (activeBans.length > 0) {
        return { available: false, reason: 'SUSPENDED' };
      }
    }
  }

  return { available: true };
}

// ============================================================================
// 2. DETERMINISTIC INJURY GENERATION
// ============================================================================

export interface GenerateMatchInjuryParams {
  playerId: string;
  minutesPlayed: number;
  preMatchFitness: number;
  calendarDate: string;
  baseFixtureKey: string;
  currentInjury?: WorldPlayerInjury;
}

/**
 * Deterministically rolls for a potential match injury for an appearing player.
 * Returns a new WorldPlayerInjury if an injury occurred, or undefined.
 *
 * Rules:
 * - Only players with minutesPlayed > 0 are eligible.
 * - Already injured players cannot suffer a new injury.
 * - Uses independent RNG namespace: `${baseFixtureKey}:injury:${playerId}`.
 * - Severity and duration are selected from CANONICAL_INJURY_CATALOG.
 */
export function generateMatchInjury(
  params: GenerateMatchInjuryParams
): WorldPlayerInjury | undefined {
  const {
    playerId,
    minutesPlayed,
    preMatchFitness,
    calendarDate,
    baseFixtureKey,
    currentInjury,
  } = params;

  if (minutesPlayed <= 0) return undefined;

  // Already active injury cannot be stacked
  if (currentInjury && calendarDate < currentInjury.availableFromDate) {
    return undefined;
  }

  // Calculate injury probability
  const minutesFactor = Math.min(1.0, minutesPlayed / 90.0);
  const fitnessRisk =
    preMatchFitness < 80
      ? 1.0 + Math.min(0.5, (80 - preMatchFitness) * 0.008)
      : 1.0;

  const probability = Math.min(
    MAX_INJURY_PROBABILITY,
    BASE_INJURY_PROBABILITY_PER_90 * minutesFactor * fitnessRisk
  );

  // Deterministic roll
  const rollSeed = hashString(`${baseFixtureKey}:injury-roll:${playerId}`);
  const rollRng = createRng(rollSeed);
  const roll = rollRng();

  if (roll >= probability) {
    return undefined;
  }

  // Select injury definition via weighted random
  const typeSeed = hashString(`${baseFixtureKey}:injury-type:${playerId}`);
  const typeRng = createRng(typeSeed);
  const totalWeight = CANONICAL_INJURY_CATALOG.reduce((sum, def) => sum + def.relativeWeight, 0);
  let threshold = typeRng() * totalWeight;
  let selectedDef = CANONICAL_INJURY_CATALOG[0];

  for (const def of CANONICAL_INJURY_CATALOG) {
    threshold -= def.relativeWeight;
    if (threshold <= 0) {
      selectedDef = def;
      break;
    }
  }

  // Duration in days
  const durSeed = hashString(`${baseFixtureKey}:injury-dur:${playerId}`);
  const durRng = createRng(durSeed);
  const dayRange = selectedDef.maxDays - selectedDef.minDays + 1;
  const durationDays = selectedDef.minDays + Math.floor(durRng() * dayRange);

  const availableFromDate = addDaysToDate(calendarDate, durationDays);

  return {
    type: selectedDef.type,
    name: selectedDef.name,
    startDate: calendarDate,
    availableFromDate,
    durationDays,
    severity: selectedDef.severity,
  };
}

// ============================================================================
// 3. SNAPSHOT & IMMUTABLE HELPERS
// ============================================================================

/**
 * Deep clones an array of WorldPlayerAvailabilityState.
 */
export function cloneAvailabilityStates(
  states?: WorldPlayerAvailabilityState[]
): WorldPlayerAvailabilityState[] {
  if (!states) return [];
  return states.map(s => ({
    playerId: s.playerId,
    injury: s.injury ? { ...s.injury } : undefined,
    disciplinaryStates: s.disciplinaryStates
      ? s.disciplinaryStates.map(d => ({
          playerId: d.playerId,
          competitionId: d.competitionId,
          seasonLabel: d.seasonLabel,
          ruleSetId: d.ruleSetId,
          events: d.events.map(e => ({ ...e })),
          suspensions: d.suspensions.map(sub => ({
            ...sub,
            servedFixtureIds: [...sub.servedFixtureIds],
          })),
          processedEventIds: [...d.processedEventIds],
          triggeredThresholdKeys: [...d.triggeredThresholdKeys],
        }))
      : undefined,
  }));
}
