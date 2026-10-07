import type {
  WorldBroadRole,
} from './matchSquadSelection';
import { mapPositionToBroadRole } from './matchSquadSelection';
import type {
  WorldFootballPosition,
  WorldFormation,
  WorldManagerFootballProfile,
  WorldManagerMatchPlan,
  WorldMatchTeamSelection,
  WorldPlayerFootballState,
  WorldTacticalIntent,
} from './types';
import { hashString } from './worldProgression';

// ============================================================================
// PART 1 — SUPPORTED FORMATIONS & ROLE SHAPES
// ============================================================================

/**
 * The subset of canonical formations actively supported and evaluated by Manager AI in Phase 3P.
 * Preserves deterministic RNG modulus (length = 5) for manager profile derivation.
 */
export const SUPPORTED_FORMATIONS: readonly WorldFormation[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '4-1-4-1',
] as const;

/**
 * Full canonical structural formation vocabulary across Pro Baller world & career simulation.
 */
export const ALL_CANONICAL_FORMATIONS: readonly WorldFormation[] = [
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '5-3-2',
  '4-1-4-1',
] as const;

export const FORMATION_ROLE_REQUIREMENTS: Record<
  WorldFormation,
  Record<WorldBroadRole, number>
> = {
  '4-3-3': { GK: 1, DEF: 4, MID: 3, ATT: 3 },
  '4-2-3-1': { GK: 1, DEF: 4, MID: 5, ATT: 1 },
  '4-4-2': { GK: 1, DEF: 4, MID: 4, ATT: 2 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, ATT: 2 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, ATT: 2 },
  '4-1-4-1': { GK: 1, DEF: 4, MID: 5, ATT: 1 },
};

// ============================================================================
// PART 2 — DEFAULT CLUB SELECTION POLICY (VACANT CLUBS)
// ============================================================================

export const DEFAULT_CLUB_SELECTION_PROFILE: WorldManagerFootballProfile = {
  managerId: 'default-club-selection-policy',
  preferredFormation: '4-3-3',
  rotationPreference: 50,
  youthTrust: 50,
  formPreference: 50,
  fitnessPreference: 50,
  attackingIntent: 50,
};

// ============================================================================
// PART 3 — DETERMINISTIC MANAGER PROFILE INITIALIZATION
// ============================================================================

/**
 * Deterministically resolves or derives a manager's football profile.
 * If no manager is assigned (or vacant fallback requested), returns DEFAULT_CLUB_SELECTION_PROFILE.
 *
 * Provenance & Authority:
 * - Imported factual data: manager identity (ID, name, nationality, club assignment).
 * - Generated simulation seeds: preferredFormation, rotationPreference, youthTrust,
 *   formPreference, fitnessPreference, attackingIntent.
 * These traits are stable, deterministic behavioral seeds modeling manager tendencies
 * within Pro Baller's simulation engine; they are not real-world factual manager statistics.
 *
 * No Math.random, no Date.now, no internet assumptions.
 */
export function resolveWorldManagerProfile(
  managerId?: string
): WorldManagerFootballProfile {
  if (!managerId || managerId === 'default-club-selection-policy') {
    return DEFAULT_CLUB_SELECTION_PROFILE;
  }

  const h0 = hashString(`manager-profile:${managerId}:formation`);
  const preferredFormation = SUPPORTED_FORMATIONS[h0 % SUPPORTED_FORMATIONS.length];

  const hRot = hashString(`manager-profile:${managerId}:rotation`);
  const rotationPreference = 30 + (hRot % 51); // 30..80

  const hYouth = hashString(`manager-profile:${managerId}:youth`);
  const youthTrust = 30 + (hYouth % 51); // 30..80

  const hForm = hashString(`manager-profile:${managerId}:form`);
  const formPreference = 30 + (hForm % 51); // 30..80

  const hFit = hashString(`manager-profile:${managerId}:fitness`);
  const fitnessPreference = 30 + (hFit % 51); // 30..80

  const hAtt = hashString(`manager-profile:${managerId}:intent`);
  const attackingIntent = 30 + (hAtt % 51); // 30..80

  return {
    managerId,
    preferredFormation,
    rotationPreference,
    youthTrust,
    formPreference,
    fitnessPreference,
    attackingIntent,
  };
}

// ============================================================================
// PART 4 — TACTICAL INTENT & LINEUP MODIFIERS
// ============================================================================

/**
 * Resolves broad tactical intent from manager attacking intent rating.
 */
export function resolveTacticalIntent(
  attackingIntent: number
): WorldTacticalIntent {
  if (attackingIntent >= 65) return 'ATTACKING';
  if (attackingIntent <= 35) return 'DEFENSIVE';
  return 'BALANCED';
}

export interface TacticalIntentModifiers {
  attackMultiplier: number;
  defensiveResistanceMultiplier: number;
}

/**
 * Computes transparent, small bounded lineup modifiers for broad tactical intent:
 * - ATTACKING: +2% attack, -2% defensive resistance
 * - DEFENSIVE: -2% attack, +2% defensive resistance
 * - BALANCED: neutral (1.00 / 1.00)
 */
export function computeTacticalIntentModifiers(
  intent: WorldTacticalIntent
): TacticalIntentModifiers {
  switch (intent) {
    case 'ATTACKING':
      return { attackMultiplier: 1.02, defensiveResistanceMultiplier: 0.98 };
    case 'DEFENSIVE':
      return { attackMultiplier: 0.98, defensiveResistanceMultiplier: 1.02 };
    case 'BALANCED':
    default:
      return { attackMultiplier: 1.0, defensiveResistanceMultiplier: 1.0 };
  }
}

// ============================================================================
// PART 5 — AGE & PLAYER SELECTION SCORING
// ============================================================================

/**
 * Computes calendar-based age from date of birth. Returns undefined if DOB missing or invalid.
 */
export function calculatePlayerAge(
  dateOfBirth?: string,
  asOfDate?: string
): number | undefined {
  if (!dateOfBirth || typeof dateOfBirth !== 'string') return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return undefined;

  const refDate = asOfDate && /^\d{4}-\d{2}-\d{2}$/.test(asOfDate) ? asOfDate : '2026-10-07';
  const [bYear, bMonth, bDay] = dateOfBirth.split('-').map(Number);
  const [rYear, rMonth, rDay] = refDate.split('-').map(Number);

  let age = rYear - bYear;
  if (rMonth < bMonth || (rMonth === bMonth && rDay < bDay)) {
    age--;
  }
  return age >= 0 ? age : undefined;
}

/**
 * Computes manager-weighted player selection score.
 * Ability remains dominant (~85%), modified by:
 * - fitness preference
 * - form preference
 * - youth trust (age-based, zero if DOB unknown)
 * - rotation preference (penalizes fatigued players during congestion)
 */
export function computeManagerPlayerSelectionScore(
  state: WorldPlayerFootballState,
  profile: WorldManagerFootballProfile,
  options?: {
    dateOfBirth?: string;
    calendarDate?: string;
  }
): number {
  // 1. Ability baseline (dominant)
  const abilityBaseline = state.ability * 100;

  // 2. Fitness influence (scaled by fitnessPreference 0..100)
  // Multiplier ranges from 6.0 (fitnessPref=0) to 14.0 (fitnessPref=100), neutral=10.0
  const fitnessMultiplier = 6.0 + (profile.fitnessPreference / 100) * 8.0;
  const fitnessComponent = state.fitness * fitnessMultiplier;

  // 3. Sharpness & morale
  const sharpnessComponent = state.sharpness * 3;
  const moraleComponent = state.morale * 1;

  // 4. Form influence (centered at 50, scaled by formPreference 0..100)
  // Multiplier ranges from 1.0 (formPref=0) to 3.0 (formPref=100), neutral=2.0
  const formDelta = state.form - 50;
  const formMultiplier = 1.0 + (profile.formPreference / 100) * 2.0;
  const formComponent = formDelta * formMultiplier;

  // 5. Youth trust (bounded age bonus if DOB exists and age <= 21; 0 if DOB missing)
  let youthBonus = 0;
  const age = calculatePlayerAge(options?.dateOfBirth, options?.calendarDate);
  if (age !== undefined && age <= 21) {
    youthBonus = (22 - age) * (profile.youthTrust / 100) * 12;
  }

  // 6. Rotation preference under fatigue/congestion
  // If player fitness is below 85, high-rotation managers penalize starting them more heavily.
  // Calibrated so rotation preference has measurable causal ordering under congestion
  // without dominating player ability or causing artificial churn at full rest.
  let rotationPenalty = 0;
  if (state.fitness < 85) {
    const fatigueGap = 85 - state.fitness;
    rotationPenalty = fatigueGap * (profile.rotationPreference / 100) * 12;
  }

  return (
    abilityBaseline +
    fitnessComponent +
    sharpnessComponent +
    moraleComponent +
    formComponent +
    youthBonus -
    rotationPenalty
  );
}

// ============================================================================
// PART 6 — FORMATION EVALUATION & SELECTION
// ============================================================================

export interface ManagerSelectionCandidate {
  id: string;
  state: WorldPlayerFootballState;
  score: number;
  broadRole: WorldBroadRole;
  dateOfBirth?: string;
}

const PREFERRED_FORMATION_BONUS = 800;
const ROLE_SHORTAGE_PENALTY = 3000;

/**
 * Evaluates supported formations for the given candidates and manager profile.
 * Gives a bonus to preferred formation, but applies severe penalty for role shortages
 * so a manager falls back to a formation with natural coverage when shortages occur.
 */
export function evaluateBestFormation(
  candidates: ManagerSelectionCandidate[],
  profile: WorldManagerFootballProfile
): {
  chosenFormation: WorldFormation;
  formationScores: Record<WorldFormation, number>;
} {
  const rolePools: Record<WorldBroadRole, ManagerSelectionCandidate[]> = {
    GK: [],
    DEF: [],
    MID: [],
    ATT: [],
  };

  for (const c of candidates) {
    rolePools[c.broadRole].push(c);
  }

  // Sort each role pool descending by score, tie-break by ID
  const sortPool = (a: ManagerSelectionCandidate, b: ManagerSelectionCandidate) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  };

  rolePools.GK.sort(sortPool);
  rolePools.DEF.sort(sortPool);
  rolePools.MID.sort(sortPool);
  rolePools.ATT.sort(sortPool);

  const formationScores = {} as Record<WorldFormation, number>;

  for (const formation of SUPPORTED_FORMATIONS) {
    const req = FORMATION_ROLE_REQUIREMENTS[formation];
    let score = 0;

    for (const role of ['GK', 'DEF', 'MID', 'ATT'] as WorldBroadRole[]) {
      const needed = req[role];
      const available = rolePools[role];
      const count = Math.min(needed, available.length);

      for (let i = 0; i < count; i++) {
        score += available[i].score;
      }

      if (available.length < needed) {
        const shortage = needed - available.length;
        score -= shortage * ROLE_SHORTAGE_PENALTY;
      }
    }

    if (formation === profile.preferredFormation) {
      score += PREFERRED_FORMATION_BONUS;
    }

    formationScores[formation] = score;
  }

  // Pick highest scoring formation
  let chosenFormation = SUPPORTED_FORMATIONS[0];
  let highestScore = -Infinity;

  for (const formation of SUPPORTED_FORMATIONS) {
    const score = formationScores[formation];
    if (score > highestScore) {
      highestScore = score;
      chosenFormation = formation;
    } else if (score === highestScore) {
      if (formation === profile.preferredFormation) {
        chosenFormation = formation;
      }
    }
  }

  return { chosenFormation, formationScores };
}

// ============================================================================
// PART 7 — AUTONOMOUS SQUAD SELECTION WITH MANAGER DECISION
// ============================================================================

export interface ManagerSquadSelectionResult {
  selection: WorldMatchTeamSelection;
  matchPlan: WorldManagerMatchPlan;
}

export interface SelectMatchTeamSquadWithManagerOptions {
  fixtureId: string;
  benchSize?: number;
  playerPositions?:
    | Map<string, WorldFootballPosition>
    | Record<string, WorldFootballPosition>
    | ((playerId: string) => WorldFootballPosition | undefined);
  isPlayerAvailable?: (playerId: string) => boolean;
  playerBirthDates?:
    | Map<string, string>
    | Record<string, string>
    | ((playerId: string) => string | undefined);
  calendarDate?: string;
  managerProfile?: WorldManagerFootballProfile;
}

/**
 * Deterministically selects starting XI, bench, formation, and tactical intent
 * for a club squad under manager AI direction.
 */
export function selectMatchTeamSquadWithManager(
  teamId: string,
  squadPlayerIds: string[],
  playerFootballStatesMap: Map<string, WorldPlayerFootballState>,
  options: SelectMatchTeamSquadWithManagerOptions
): ManagerSquadSelectionResult {
  const benchSize = options.benchSize ?? 9;
  const profile = options.managerProfile ?? DEFAULT_CLUB_SELECTION_PROFILE;
  const tacticalIntent = resolveTacticalIntent(profile.attackingIntent);

  const resolvePosition = (id: string): WorldFootballPosition | undefined => {
    if (!options.playerPositions) return undefined;
    if (typeof options.playerPositions === 'function') {
      return options.playerPositions(id);
    }
    if (options.playerPositions instanceof Map) {
      return options.playerPositions.get(id);
    }
    return options.playerPositions[id];
  };

  const resolveDob = (id: string): string | undefined => {
    if (!options.playerBirthDates) return undefined;
    if (typeof options.playerBirthDates === 'function') {
      return options.playerBirthDates(id);
    }
    if (options.playerBirthDates instanceof Map) {
      return options.playerBirthDates.get(id);
    }
    return options.playerBirthDates[id];
  };

  // 1. Gather and score eligible candidates
  const eligibleCandidates: ManagerSelectionCandidate[] = [];
  for (const id of squadPlayerIds) {
    const fState = playerFootballStatesMap.get(id);
    const isAvailable = options.isPlayerAvailable ? options.isPlayerAvailable(id) : true;
    if (fState && fState.fitness > 0 && isAvailable) {
      const pos = resolvePosition(id);
      const dob = resolveDob(id);
      const broadRole = mapPositionToBroadRole(pos);
      const score = computeManagerPlayerSelectionScore(fState, profile, {
        dateOfBirth: dob,
        calendarDate: options.calendarDate,
      });
      eligibleCandidates.push({
        id,
        state: fState,
        score,
        broadRole,
        dateOfBirth: dob,
      });
    }
  }

  const sortCandidates = (a: ManagerSelectionCandidate, b: ManagerSelectionCandidate) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  };

  // 2. Shortage fallback: if <= 11 eligible players, all start (no fake players)
  if (eligibleCandidates.length <= 11) {
    eligibleCandidates.sort(sortCandidates);
    const formation = profile.preferredFormation;
    return {
      selection: {
        teamId,
        startingPlayerIds: eligibleCandidates.map(c => c.id),
        benchPlayerIds: [],
      },
      matchPlan: {
        fixtureId: options.fixtureId,
        teamId,
        managerId:
          profile.managerId === 'default-club-selection-policy'
            ? undefined
            : profile.managerId,
        formation,
        tacticalIntent,
      },
    };
  }

  // 3. Evaluate best formation
  const { chosenFormation } = evaluateBestFormation(eligibleCandidates, profile);
  const req = FORMATION_ROLE_REQUIREMENTS[chosenFormation];

  // 4. Group candidates by role
  const gks = eligibleCandidates.filter(c => c.broadRole === 'GK').sort(sortCandidates);
  const defs = eligibleCandidates.filter(c => c.broadRole === 'DEF').sort(sortCandidates);
  const mids = eligibleCandidates.filter(c => c.broadRole === 'MID').sort(sortCandidates);
  const atts = eligibleCandidates.filter(c => c.broadRole === 'ATT').sort(sortCandidates);

  const selectedStarterIds = new Set<string>();
  const startingPlayerIds: string[] = [];

  const addStarter = (c: ManagerSelectionCandidate) => {
    if (!selectedStarterIds.has(c.id) && startingPlayerIds.length < 11) {
      selectedStarterIds.add(c.id);
      startingPlayerIds.push(c.id);
    }
  };

  // Step A: Allocate starters for required role counts
  // GK
  for (let i = 0; i < Math.min(req.GK, gks.length); i++) {
    addStarter(gks[i]);
  }
  // DEF
  for (let i = 0; i < Math.min(req.DEF, defs.length); i++) {
    addStarter(defs[i]);
  }
  // MID
  for (let i = 0; i < Math.min(req.MID, mids.length); i++) {
    addStarter(mids[i]);
  }
  // ATT
  for (let i = 0; i < Math.min(req.ATT, atts.length); i++) {
    addStarter(atts[i]);
  }

  // Step B: If role shortages exist, fill remaining starter slots from best available unselected
  if (startingPlayerIds.length < 11) {
    const unselected = eligibleCandidates
      .filter(c => !selectedStarterIds.has(c.id))
      .sort(sortCandidates);

    for (const cand of unselected) {
      addStarter(cand);
      if (startingPlayerIds.length === 11) break;
    }
  }

  // Step C: Bench selection with broad role coverage
  const remainingForBench = eligibleCandidates
    .filter(c => !selectedStarterIds.has(c.id))
    .sort(sortCandidates);

  const selectedBenchIds = new Set<string>();
  const benchPlayerIds: string[] = [];

  const addBench = (c: ManagerSelectionCandidate) => {
    if (!selectedBenchIds.has(c.id) && benchPlayerIds.length < benchSize) {
      selectedBenchIds.add(c.id);
      benchPlayerIds.push(c.id);
    }
  };

  if (benchSize >= 4) {
    // Broad role coverage preference: 1 GK, 1 DEF, 1 MID, 1 ATT if available
    const benchGks = remainingForBench.filter(c => c.broadRole === 'GK');
    const benchDefs = remainingForBench.filter(c => c.broadRole === 'DEF');
    const benchMids = remainingForBench.filter(c => c.broadRole === 'MID');
    const benchAtts = remainingForBench.filter(c => c.broadRole === 'ATT');

    if (benchGks.length > 0) addBench(benchGks[0]);
    if (benchDefs.length > 0) addBench(benchDefs[0]);
    if (benchMids.length > 0) addBench(benchMids[0]);
    if (benchAtts.length > 0) addBench(benchAtts[0]);
  }

  // Fill remaining bench slots by score
  for (const cand of remainingForBench) {
    addBench(cand);
    if (benchPlayerIds.length === benchSize) break;
  }

  return {
    selection: {
      teamId,
      startingPlayerIds,
      benchPlayerIds,
    },
    matchPlan: {
      fixtureId: options.fixtureId,
      teamId,
      managerId:
        profile.managerId === 'default-club-selection-policy'
          ? undefined
          : profile.managerId,
      formation: chosenFormation,
      tacticalIntent,
    },
  };
}
