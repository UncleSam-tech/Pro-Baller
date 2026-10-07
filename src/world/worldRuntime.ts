import {
  createDomesticLeagueMembershipState,
  validateDomesticLeagueMembershipState,
} from '../competition/membershipEngine';
import { validateCompetitionSeasonState } from '../competition/seasonEngine';
import type {
  CompetitionRuleRegistry,
  CompetitionRuleSet,
  CompetitionSchedule,
  CompetitionSeasonState,
  DomesticLeagueMembershipState,
} from '../competition/types';
import type {
  FootballWorldBootstrapResult,
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
  WorldFixtureMatchDetail,
  WorldFootballPosition,
} from './types';
import { validateFootballWorldDataPack } from './worldDataPack';
import { prepareCompetitionFixtureDates } from './worldProgression';
import {
  initializeWorldPlayerFootballStates,
  validateWorldPlayerFootballStates,
  getWorldPlayerFootballState,
} from './playerFootballState';
import {
  getWorldFixtureParticipation,
  getWorldPlayerAppearances,
  getWorldPlayerMinutes,
} from './matchSquadSelection';

// ============================================================================
// CLONING UTILITIES
// ============================================================================

function cloneSchedule(schedule: CompetitionSchedule): CompetitionSchedule {
  return {
    competitionId: schedule.competitionId,
    seasonLabel: schedule.seasonLabel,
    ruleSetId: schedule.ruleSetId,
    formatType: schedule.formatType,
    participantTeamIds: [...schedule.participantTeamIds],
    rounds: schedule.rounds.map(r => ({
      round: r.round,
      fixtures: r.fixtures.map(f => ({ ...f })),
      byeTeamIds: [...r.byeTeamIds],
    })),
  };
}

// ============================================================================
// MAIN BOOTSTRAP FUNCTION
// ============================================================================

/**
 * Purely bootstraps a validated FootballWorldDataPack into initial runtime world state.
 */
export function bootstrapFootballWorld(
  pack: FootballWorldDataPack
): FootballWorldBootstrapResult {
  // 1. Validate data pack
  const packValidation = validateFootballWorldDataPack(pack);
  if (!packValidation.valid) {
    return {
      accepted: false,
      error: `Data pack validation failed: ${packValidation.errors.join('; ')}`,
    };
  }

  // Build competition rule registry once for membership validation
  const ruleRegistry: CompetitionRuleRegistry = {
    definitions: Object.fromEntries(
      pack.competitionDefinitions.map(def => [def.id, def])
    ),
    ruleSets: Object.fromEntries(
      pack.competitionRuleSets.map(rs => [rs.id, rs])
    ),
  };

  // 2. Bootstrap Domestic League Membership States
  const membershipsByCountry = new Map<string, Record<string, string[]>>();
  for (const seed of pack.domesticLeagueMemberships) {
    let countryMap = membershipsByCountry.get(seed.countryId);
    if (!countryMap) {
      countryMap = {};
      membershipsByCountry.set(seed.countryId, countryMap);
    }
    countryMap[seed.competitionId] = [...seed.clubIds];
  }

  const domesticLeagueMembershipStates: DomesticLeagueMembershipState[] = [];
  for (const [countryId, teamIdsMap] of membershipsByCountry) {
    const compIds = Object.keys(teamIdsMap);
    const countrySeasonLabel =
      pack.competitionSeasons.find(cs => compIds.includes(cs.competitionId))
        ?.schedule.seasonLabel ?? pack.seasonLabel;

    const membershipState = createDomesticLeagueMembershipState(
      countryId,
      countrySeasonLabel,
      teamIdsMap
    );

    const validation = validateDomesticLeagueMembershipState(
      membershipState,
      ruleRegistry
    );
    if (!validation.valid) {
      return {
        accepted: false,
        error: `Domestic league membership validation failed for country '${countryId}': ${validation.errors.join('; ')}`,
      };
    }

    domesticLeagueMembershipStates.push(membershipState);
  }

  // 3. Bootstrap Competition Season States
  const competitionSeasonStates: CompetitionSeasonState[] = [];
  for (const seed of pack.competitionSeasons) {
    const fixtureDates = prepareCompetitionFixtureDates(
      seed.schedule,
      seed.fixtureDates,
      seed.results,
      pack.snapshotDate
    );

    const seasonState: CompetitionSeasonState = {
      competitionId: seed.competitionId,
      seasonLabel: seed.schedule.seasonLabel,
      ruleSetId: seed.ruleSetId,
      schedule: cloneSchedule(seed.schedule),
      results: seed.results.map(r => ({ ...r })),
      fixtureDates,
    };

    const seasonValidation = validateCompetitionSeasonState(seasonState);
    if (!seasonValidation.valid) {
      return {
        accepted: false,
        error: `Competition season state validation failed for '${seed.competitionId}': ${seasonValidation.errors.join('; ')}`,
      };
    }

    competitionSeasonStates.push(seasonState);
  }

  // 4. Defensive Copies of Squad and Manager Assignments
  const squadAssignments = pack.squadAssignments.map(s => ({
    clubId: s.clubId,
    playerIds: [...s.playerIds],
  }));

  const managerAssignments = pack.managerAssignments.map(m => ({ ...m }));

  // 5. Initialize and Validate Player Football States
  const playerFootballStates = initializeWorldPlayerFootballStates(pack);
  const playerValidation = validateWorldPlayerFootballStates(
    playerFootballStates,
    new Set(pack.players.map(p => p.id))
  );
  if (!playerValidation.valid) {
    return {
      accepted: false,
      error: `Player football state validation failed: ${playerValidation.errors.join('; ')}`,
    };
  }

  return {
    accepted: true,
    state: {
      dataPackId: pack.id,
      dataPackVersion: pack.version,
      seasonLabel: pack.seasonLabel,
      currentDate: pack.snapshotDate,
      domesticLeagueMembershipStates,
      competitionSeasonStates,
      squadAssignments,
      managerAssignments,
      playerFootballStates,
      fixtureParticipations: [],
      fixtureMatchDetails: [],
    },
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Retrieves the CompetitionSeasonState for a given competition, or undefined.
 */
export function getWorldCompetitionSeasonState(
  state: FootballWorldRuntimeState,
  competitionId: string
): CompetitionSeasonState | undefined {
  return state.competitionSeasonStates.find(
    s => s.competitionId === competitionId
  );
}

/**
 * Retrieves the DomesticLeagueMembershipState for a given country, or undefined.
 */
export function getWorldDomesticMembershipState(
  state: FootballWorldRuntimeState,
  countryId: string
): DomesticLeagueMembershipState | undefined {
  return state.domesticLeagueMembershipStates.find(
    s => s.countryId === countryId
  );
}

/**
 * Retrieves a defensive copy of player IDs assigned to a club squad, or undefined.
 */
export function getWorldClubSquadPlayerIds(
  state: FootballWorldRuntimeState,
  clubId: string
): string[] | undefined {
  const squad = state.squadAssignments.find(s => s.clubId === clubId);
  if (!squad) {
    return undefined;
  }
  return [...squad.playerIds];
}

/**
 * Retrieves the assigned manager ID for a club, or undefined if unmanaged.
 */
export function getWorldClubManagerId(
  state: FootballWorldRuntimeState,
  clubId: string
): string | undefined {
  const assignment = state.managerAssignments.find(m => m.clubId === clubId);
  return assignment?.managerId;
}

export { getWorldPlayerFootballState } from './playerFootballState';
export {
  getWorldFixtureParticipation,
  getWorldPlayerAppearances,
  getWorldPlayerMinutes,
} from './matchSquadSelection';

/**
 * Retrieves the WorldFixtureMatchDetail for a given fixture ID, or undefined if not simulated/historical.
 */
export function getWorldFixtureMatchDetail(
  state: FootballWorldRuntimeState,
  fixtureId: string
): WorldFixtureMatchDetail | undefined {
  return state.fixtureMatchDetails?.find(d => d.fixtureId === fixtureId);
}

/**
 * Creates an immutable, zero-overhead static context from a FootballWorldDataPack
 * for progression calls.
 */
export function createFootballWorldStaticContext(
  pack: FootballWorldDataPack
): FootballWorldStaticContext {
  const playerPositions = new Map<string, WorldFootballPosition>();
  for (const p of pack.players) {
    if (p.primaryPosition) {
      playerPositions.set(p.id, p.primaryPosition);
    }
  }
  const ruleSets = new Map<string, CompetitionRuleSet>();
  for (const r of pack.competitionRuleSets) {
    ruleSets.set(r.id, r);
  }
  return {
    playerPositions,
    ruleSets,
    competitionRuleSets: pack.competitionRuleSets,
  };
}


