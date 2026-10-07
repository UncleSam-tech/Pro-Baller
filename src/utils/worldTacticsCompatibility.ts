import type { FormationType, TacticalMentality } from '../types/game';
import type { WorldFormation, WorldTacticalIntent } from '../world/types';

/**
 * Maps a canonical WorldFormation to a display presentation label (UI text only).
 * Note: '4-1-4-1' maps to '4-1-4-1 Holding' for display purposes, but is NOT a legacy FormationType.
 */
export function mapWorldFormationToDisplayText(formation: WorldFormation): string {
  switch (formation) {
    case '4-3-3':
      return '4-3-3 Attacking';
    case '4-2-3-1':
      return '4-2-3-1 Balanced';
    case '3-5-2':
      return '3-5-2 Wing-backs';
    case '4-4-2':
      return '4-4-2 Diamond';
    case '5-3-2':
      return '5-3-2 Park The Bus';
    case '4-1-4-1':
      return '4-1-4-1 Holding';
  }
}

/**
 * Maps a canonical WorldFormation to a legacy career FormationType, if supported.
 * Returns undefined for formations (such as 4-1-4-1) that do not yet have a legacy UI representation.
 */
export function mapWorldFormationToLegacyFormationType(
  formation: WorldFormation
): FormationType | undefined {
  switch (formation) {
    case '4-3-3':
      return '4-3-3 Attacking';
    case '4-2-3-1':
      return '4-2-3-1 Balanced';
    case '3-5-2':
      return '3-5-2 Wing-backs';
    case '4-4-2':
      return '4-4-2 Diamond';
    case '5-3-2':
      return '5-3-2 Park The Bus';
    case '4-1-4-1':
      return undefined;
  }
}

/**
 * Maps legacy career presentation labels (or raw strings) to canonical WorldFormation.
 * Pure and deterministic.
 */
export function mapLegacyFormationTypeToWorldFormation(
  legacy: FormationType | string
): WorldFormation {
  switch (legacy) {
    case '4-3-3 Attacking':
    case '4-3-3':
      return '4-3-3';
    case '4-2-3-1 Balanced':
    case '4-2-3-1':
      return '4-2-3-1';
    case '3-5-2 Wing-backs':
    case '3-5-2':
      return '3-5-2';
    case '4-4-2 Diamond':
    case '4-4-2':
      return '4-4-2';
    case '5-3-2 Park The Bus':
    case '5-3-2':
      return '5-3-2';
    case '4-1-4-1 Holding':
    case '4-1-4-1':
      return '4-1-4-1';
    default:
      if (legacy.startsWith('4-3-3')) return '4-3-3';
      if (legacy.startsWith('4-2-3-1')) return '4-2-3-1';
      if (legacy.startsWith('3-5-2')) return '3-5-2';
      if (legacy.startsWith('4-4-2')) return '4-4-2';
      if (legacy.startsWith('5-3-2')) return '5-3-2';
      if (legacy.startsWith('4-1-4-1')) return '4-1-4-1';
      return '4-3-3';
  }
}

/**
 * Maps career tactical mentality to canonical WorldTacticalIntent.
 */
export function mapTacticalMentalityToWorldIntent(
  mentality: TacticalMentality | string
): WorldTacticalIntent {
  switch (mentality) {
    case 'ATTACKING':
      return 'ATTACKING';
    case 'DEFENSIVE':
      return 'DEFENSIVE';
    case 'BALANCED':
    default:
      return 'BALANCED';
  }
}

/**
 * Maps canonical WorldTacticalIntent to career tactical mentality.
 */
export function mapWorldIntentToTacticalMentality(
  intent: WorldTacticalIntent
): TacticalMentality {
  return intent;
}
