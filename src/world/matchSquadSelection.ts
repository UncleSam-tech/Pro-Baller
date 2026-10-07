import type { CompetitionRuleSet } from '../competition/types';
import { getCompetitionRuleSetById } from '../competition/ruleRegistry';
import type {
  FootballWorldRuntimeState,
  WorldFixtureParticipation,
  WorldFootballPosition,
  WorldMatchTeamSelection,
  WorldPlayerFootballState,
  WorldPlayerMatchAppearance,
  WorldManagerFootballProfile,
} from './types';
import { selectMatchTeamSquadWithManager } from './managerAI';

// ============================================================================
// BROAD ROLE TYPES & POSITION MAPPING
// ============================================================================

export type WorldBroadRole = 'GK' | 'DEF' | 'MID' | 'ATT';

/**
 * Pure mapping from detailed football position to one of four broad roles:
 * GK, DEF, MID, ATT.
 */
export function mapPositionToBroadRole(
  position?: WorldFootballPosition | string
): WorldBroadRole {
  if (!position) return 'MID';
  switch (position.toUpperCase()) {
    case 'GK':
      return 'GK';
    case 'DF':
    case 'RB':
    case 'RWB':
    case 'CB':
    case 'LB':
    case 'LWB':
      return 'DEF';
    case 'MF':
    case 'CDM':
    case 'CM':
    case 'CAM':
    case 'AM':
    case 'RM':
    case 'LM':
      return 'MID';
    case 'FW':
    case 'RW':
    case 'LW':
    case 'CF':
    case 'ST':
      return 'ATT';
    default:
      return 'MID';
  }
}

// ============================================================================
// SELECTION SCORE FORMULA
// ============================================================================

/**
 * Calculates a deterministic player selection priority score.
 * Ability remains dominant (~85% contribution), supplemented with small
 * condition contributions (fitness, sharpness, form, morale).
 */
export function computePlayerSelectionScore(
  state: WorldPlayerFootballState
): number {
  return (
    state.ability * 100 +
    state.fitness * 10 +
    state.sharpness * 3 +
    state.form * 2 +
    state.morale * 1
  );
}

// ============================================================================
// BENCH SIZE RESOLUTION
// ============================================================================

/**
 * Purely resolves the bench size for a competition rule set.
 * Checks explicit ruleSets definition, then built-in seed registry,
 * defaulting to 9 (canonical professional league standard) if unspecified.
 */
export function resolveRuleSetBenchSize(
  ruleSetId: string,
  ruleSets?:
    | CompetitionRuleSet[]
    | Record<string, CompetitionRuleSet>
    | Map<string, CompetitionRuleSet>
): number {
  if (ruleSets) {
    if (ruleSets instanceof Map) {
      const rs = ruleSets.get(ruleSetId);
      if (rs?.substitutions?.benchSize !== undefined) {
        return rs.substitutions.benchSize;
      }
    } else if (Array.isArray(ruleSets)) {
      const rs = ruleSets.find(r => r.id === ruleSetId);
      if (rs?.substitutions?.benchSize !== undefined) {
        return rs.substitutions.benchSize;
      }
    } else if (typeof ruleSets === 'object') {
      const rs = (ruleSets as Record<string, CompetitionRuleSet>)[ruleSetId];
      if (rs?.substitutions?.benchSize !== undefined) {
        return rs.substitutions.benchSize;
      }
    }
  }
  const fromSeed = getCompetitionRuleSetById(ruleSetId);
  return fromSeed?.substitutions?.benchSize ?? 9;
}

export const getRuleSetBenchSize = resolveRuleSetBenchSize;

// ============================================================================
// MATCH SQUAD SELECTION
// ============================================================================

export interface SelectMatchTeamSquadOptions {
  benchSize?: number;
  playerPositions?:
    | Map<string, WorldFootballPosition>
    | Record<string, WorldFootballPosition>
    | ((playerId: string) => WorldFootballPosition | undefined);
  isPlayerAvailable?: (playerId: string) => boolean;
  managerProfile?: WorldManagerFootballProfile;
  calendarDate?: string;
  playerBirthDates?:
    | Map<string, string>
    | Record<string, string>
    | ((playerId: string) => string | undefined);
}

interface Candidate {
  id: string;
  state: WorldPlayerFootballState;
  score: number;
  broadRole: WorldBroadRole;
}

/**
 * Deterministically selects a match starting XI (4-3-3 formation) and bench
 * for a club squad.
 *
 * Rules:
 * - Target shape: 1 GK, 4 DEF, 3 MID, 3 ATT (= 11 starters).
 * - Only players in squad with existing football state and fitness > 0 and available are eligible.
 * - Outfield shortages fallback: highest-scoring unselected outfield players.
 * - Goalkeeper shortage fallback: highest-scoring unselected player as emergency GK.
 * - If club has < 11 eligible players, selects all eligible players without fake fillers.
 * - Bench filled with highest-scoring remaining eligible players up to benchSize.
 * - Starters and bench players are strictly disjoint (no duplicates).
 */
export function selectMatchTeamSquad(
  teamId: string,
  squadPlayerIds: string[],
  playerFootballStatesMap: Map<string, WorldPlayerFootballState>,
  options?: SelectMatchTeamSquadOptions
): WorldMatchTeamSelection {
  const benchSize = options?.benchSize ?? 9;

  if (options?.managerProfile) {
    return selectMatchTeamSquadWithManager(
      teamId,
      squadPlayerIds,
      playerFootballStatesMap,
      {
        fixtureId: 'match-squad-selection',
        benchSize,
        playerPositions: options.playerPositions,
        isPlayerAvailable: options.isPlayerAvailable,
        playerBirthDates: options.playerBirthDates,
        calendarDate: options.calendarDate,
        managerProfile: options.managerProfile,
      }
    ).selection;
  }

  // 1. Filter eligible candidates
  const eligibleCandidates: Candidate[] = [];
  for (const id of squadPlayerIds) {
    const fState = playerFootballStatesMap.get(id);
    const isAvailable = options?.isPlayerAvailable ? options.isPlayerAvailable(id) : true;
    if (fState && fState.fitness > 0 && isAvailable) {
      let pos: WorldFootballPosition | undefined;
      if (options?.playerPositions) {
        if (typeof options.playerPositions === 'function') {
          pos = options.playerPositions(id);
        } else if (options.playerPositions instanceof Map) {
          pos = options.playerPositions.get(id);
        } else {
          pos = options.playerPositions[id];
        }
      }
      const broadRole = mapPositionToBroadRole(pos);
      const score = computePlayerSelectionScore(fState);
      eligibleCandidates.push({ id, state: fState, score, broadRole });
    }
  }

  // Candidate sorting: descending score, tie-break by playerId
  const sortCandidates = (a: Candidate, b: Candidate) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  };

  // Squad shortage handling: if 11 or fewer eligible players, all start
  if (eligibleCandidates.length <= 11) {
    eligibleCandidates.sort(sortCandidates);
    return {
      teamId,
      startingPlayerIds: eligibleCandidates.map(c => c.id),
      benchPlayerIds: [],
    };
  }

  // Group by broad role
  const gks = eligibleCandidates.filter(c => c.broadRole === 'GK').sort(sortCandidates);
  const defs = eligibleCandidates.filter(c => c.broadRole === 'DEF').sort(sortCandidates);
  const mids = eligibleCandidates.filter(c => c.broadRole === 'MID').sort(sortCandidates);
  const atts = eligibleCandidates.filter(c => c.broadRole === 'ATT').sort(sortCandidates);

  const selectedStarterIds = new Set<string>();
  const startingPlayerIds: string[] = [];

  const addStarter = (c: Candidate) => {
    if (!selectedStarterIds.has(c.id) && startingPlayerIds.length < 11) {
      selectedStarterIds.add(c.id);
      startingPlayerIds.push(c.id);
    }
  };

  // Step A: Preferred 4-3-3 role allocation
  // 1 GK
  if (gks.length > 0) {
    addStarter(gks[0]);
  }

  // 4 DEF
  for (let i = 0; i < Math.min(4, defs.length); i++) {
    addStarter(defs[i]);
  }

  // 3 MID
  for (let i = 0; i < Math.min(3, mids.length); i++) {
    addStarter(mids[i]);
  }

  // 3 ATT
  for (let i = 0; i < Math.min(3, atts.length); i++) {
    addStarter(atts[i]);
  }

  // Step B: Shortage fallback (role shortages or emergency GK)
  if (startingPlayerIds.length < 11) {
    const unselectedCandidates = eligibleCandidates
      .filter(c => !selectedStarterIds.has(c.id))
      .sort(sortCandidates);

    for (const cand of unselectedCandidates) {
      addStarter(cand);
      if (startingPlayerIds.length === 11) break;
    }
  }

  // Step C: Bench selection
  const remainingForBench = eligibleCandidates
    .filter(c => !selectedStarterIds.has(c.id))
    .sort(sortCandidates);

  const benchPlayerIds = remainingForBench
    .slice(0, Math.max(0, benchSize))
    .map(c => c.id);

  return {
    teamId,
    startingPlayerIds,
    benchPlayerIds,
  };
}

// ============================================================================
// FIXTURE PARTICIPATION RECORD CREATION
// ============================================================================

/**
 * Creates canonical participation records for a simulated match.
 * Starters receive 90 minutes; bench players receive 0 appearances
 * (until substitution engine integration).
 */
export function createFixtureParticipation(
  fixtureId: string,
  homeSelection: WorldMatchTeamSelection,
  awaySelection: WorldMatchTeamSelection
): WorldFixtureParticipation {
  const playerAppearances: WorldPlayerMatchAppearance[] = [];

  for (const pid of homeSelection.startingPlayerIds) {
    playerAppearances.push({
      playerId: pid,
      teamId: homeSelection.teamId,
      started: true,
      minutesPlayed: 90,
    });
  }

  for (const pid of awaySelection.startingPlayerIds) {
    playerAppearances.push({
      playerId: pid,
      teamId: awaySelection.teamId,
      started: true,
      minutesPlayed: 90,
    });
  }

  return {
    fixtureId,
    homeSelection,
    awaySelection,
    playerAppearances,
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Retrieves the WorldFixtureParticipation record for a given fixture, or undefined.
 */
export function getWorldFixtureParticipation(
  state: FootballWorldRuntimeState,
  fixtureId: string
): WorldFixtureParticipation | undefined {
  return state.fixtureParticipations?.find(p => p.fixtureId === fixtureId);
}

/**
 * Retrieves all match appearance records for a given player ID across the world history.
 */
export function getWorldPlayerAppearances(
  state: FootballWorldRuntimeState,
  playerId: string
): WorldPlayerMatchAppearance[] {
  const appearances: WorldPlayerMatchAppearance[] = [];
  for (const p of state.fixtureParticipations ?? []) {
    for (const app of p.playerAppearances) {
      if (app.playerId === playerId) {
        appearances.push(app);
      }
    }
  }
  return appearances;
}

/**
 * Retrieves total minutes played for a given player ID across the world history.
 */
export function getWorldPlayerMinutes(
  state: FootballWorldRuntimeState,
  playerId: string
): number {
  let minutes = 0;
  for (const p of state.fixtureParticipations ?? []) {
    for (const app of p.playerAppearances) {
      if (app.playerId === playerId) {
        minutes += app.minutesPlayed;
      }
    }
  }
  return minutes;
}
