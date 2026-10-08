/**
 * World MatchView Presentation and Resolution Adapter
 *
 * Connects the living world simulation and Phase 3R interactive fixture handoff
 * to MatchView presentation, and converts interactive match outcomes into
 * canonical WorldExternalFixtureResolution transactions for Phase 3S.
 *
 * Principles:
 * - Pure adapter outside React: zero hooks, zero DOM, zero side effects.
 * - Real world entities only: no synthetic roster generators, no synthetic player definitions.
 * - Strict manager authority: formation and tactical intent derived from Phase 3R manager plans.
 * - Canonical rules & substitutions: driven by CompetitionRuleSet and substitutionEngine.
 * - Canonical ratings: computed via shared computeExternalMatchRatings from matchEvents.ts.
 */

import type {
  CompetitionFixtureResult,
  CompetitionRuleSet,
} from '../competition/types';
import type {
  CareerInteractiveFixture,
  CareerWorldSession,
} from './worldCareerBridge';
import type {
  WorldExternalFixtureResolution,
  WorldFixtureMatchDetail,
  WorldFixtureParticipation,
  WorldFootballPosition,
  WorldFormation,
  WorldManagerMatchPlan,
  WorldMatchEvent,
  WorldMatchTeamSelection,
  WorldPlayerMatchAppearance,
  WorldPlayerFootballState,
  WorldTacticalIntent,
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
} from '../world/types';
import {
  mapPositionToBroadRole,
  type WorldBroadRole,
} from '../world/matchSquadSelection';
import { computeLineupQuality } from '../world/lineupStrength';
import { computeExternalMatchRatings } from '../world/matchEvents';

export type WorldUserAvailability = 'AVAILABLE' | 'INJURED' | 'SUSPENDED';
export type WorldUserSelectionStatus = 'STARTER' | 'BENCH' | 'NOT_SELECTED' | 'UNAVAILABLE';

// ============================================================================
// 1. PRESENTATION MODELS
// ============================================================================

export interface WorldMatchViewPlayer {
  readonly playerId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly position: WorldFootballPosition;
  readonly number?: number;
  readonly ability: number;
  readonly fitness: number;
  readonly sharpness: number;
  readonly form: number;
  readonly morale: number;
  readonly isUser: boolean;
}

export interface WorldMatchViewTeam {
  readonly clubId: string;
  readonly name: string;
  readonly shortName: string;
  readonly city?: string;
  readonly countryName?: string;
  readonly managerName: string;
  readonly formation: WorldFormation;
  readonly tacticalIntent: WorldTacticalIntent;
  readonly startingXI: readonly WorldMatchViewPlayer[];
  readonly bench: readonly WorldMatchViewPlayer[];
  readonly attackRating: number;
  readonly defenseRating: number;
}

export interface WorldMatchViewModel {
  readonly fixtureId: string;
  readonly competitionId: string;
  readonly seasonLabel: string;
  readonly scheduledDate: string;
  readonly round: number;
  readonly competitionName: string;
  readonly competitionShortName: string;
  readonly ruleSet: CompetitionRuleSet;
  readonly home: WorldMatchViewTeam;
  readonly away: WorldMatchViewTeam;
  readonly isUserHome: boolean;
  readonly userSelectionStatus: WorldUserSelectionStatus;
  readonly userAvailability: WorldUserAvailability;
  readonly userPlayer: WorldMatchViewPlayer;
}

// ============================================================================
// 2. INTERACTIVE OUTCOME MODEL
// ============================================================================

export interface WorldInteractiveSubstitutionRecord {
  readonly teamId: string;
  readonly playerOutId: string;
  readonly playerInId: string;
  readonly minute: number;
}

export interface WorldInteractiveDismissalRecord {
  readonly teamId: string;
  readonly playerId: string;
  readonly minute: number;
}

export interface WorldInteractiveMatchOutcome {
  readonly fixtureId: string;
  readonly homeGoals: number;
  readonly awayGoals: number;
  readonly events: readonly WorldMatchEvent[];
  readonly substitutions: readonly WorldInteractiveSubstitutionRecord[];
  readonly dismissals: readonly WorldInteractiveDismissalRecord[];
}

// ============================================================================
// 3. MODEL CREATION ADAPTER
// ============================================================================

/**
 * Builds a pure WorldMatchViewModel from an active CareerWorldSession and
 * Phase 3R CareerInteractiveFixture handoff.
 */
export function createWorldMatchViewModel(
  session: CareerWorldSession,
  handoff: CareerInteractiveFixture
): WorldMatchViewModel {
  const { sessionPack, runtimeState, staticContext } = session;

  const playerDefMap = new Map(sessionPack.players.map((p) => [p.id, p]));
  const playerStatesMap = new Map(
    runtimeState.playerFootballStates.map((s) => [s.playerId, s])
  );
  const clubMap = new Map(sessionPack.clubs.map((c) => [c.id, c]));

  const ruleSetId = handoff.competitionRuleSetId;
  if (!ruleSetId) {
    throw new Error(
      `CareerInteractiveFixture '${handoff.fixtureId}' does not specify a competitionRuleSetId.`
    );
  }

  let resolvedRuleSet: CompetitionRuleSet | undefined;
  if (staticContext?.competitionRuleSets) {
    if (Array.isArray(staticContext.competitionRuleSets)) {
      resolvedRuleSet = staticContext.competitionRuleSets.find((r) => r.id === ruleSetId);
    } else {
      resolvedRuleSet = (staticContext.competitionRuleSets as Record<string, CompetitionRuleSet>)[ruleSetId];
    }
  }
  if (!resolvedRuleSet && sessionPack?.competitionRuleSets) {
    resolvedRuleSet = sessionPack.competitionRuleSets.find((r) => r.id === ruleSetId);
  }
  if (!resolvedRuleSet) {
    throw new Error(
      `Cannot resolve canonical CompetitionRuleSet '${ruleSetId}' for fixture '${handoff.fixtureId}'.`
    );
  }
  const ruleSet = resolvedRuleSet;

  const compState = runtimeState.competitionSeasonStates.find(
    (c) => c.competitionId === handoff.competitionId
  );
  const competitionName = compState?.competitionId ?? handoff.competitionId;
  const competitionShortName = ruleSet.presentation?.matchBall
    ? competitionName
    : handoff.competitionId;
  const seasonLabel = compState?.seasonLabel ?? sessionPack.seasonLabel ?? '2026-27';

  const buildViewPlayer = (playerId: string): WorldMatchViewPlayer => {
    const def = playerDefMap.get(playerId);
    if (!def) {
      throw new Error(`Missing canonical WorldPlayerDefinition for player '${playerId}'.`);
    }
    const footballState = playerStatesMap.get(playerId);
    if (!footballState) {
      throw new Error(`Missing canonical WorldPlayerFootballState for player '${playerId}'.`);
    }

    const firstName = def.firstName;
    const lastName = def.lastName;
    const displayName = `${firstName} ${lastName}`.trim();
    const position = def.primaryPosition;
    const isUser = playerId === session.link.worldPlayerId;

    return {
      playerId,
      firstName,
      lastName,
      displayName,
      position,
      ability: footballState.ability,
      fitness: footballState.fitness,
      sharpness: footballState.sharpness,
      form: footballState.form,
      morale: footballState.morale,
      isUser,
    };
  };

  const buildViewTeam = (
    clubId: string,
    selection?: WorldMatchTeamSelection,
    managerPlan?: WorldManagerMatchPlan
  ): WorldMatchViewTeam => {
    const club = clubMap.get(clubId);
    if (!club) {
      throw new Error(`Missing canonical WorldClubDefinition for club '${clubId}'.`);
    }
    const managerAssignment = sessionPack.managerAssignments?.find((m) => m.clubId === clubId);
    const managerDef = managerAssignment
      ? sessionPack.managers?.find((m) => m.id === managerAssignment.managerId)
      : undefined;
    const managerName = managerDef
      ? `${managerDef.firstName} ${managerDef.lastName}`.trim()
      : 'First Team Manager';

    const startingPlayerIds = selection?.startingPlayerIds ?? [];
    const benchPlayerIds = selection?.benchPlayerIds ?? [];

    const startingXI = startingPlayerIds.map(buildViewPlayer);
    const bench = benchPlayerIds.map(buildViewPlayer);

    const lineupQuality = computeLineupQuality(
      startingPlayerIds,
      playerStatesMap,
      (id) => playerDefMap.get(id)?.primaryPosition
    );

    return {
      clubId,
      name: club?.name ?? clubId,
      shortName: club?.shortName ?? club?.name ?? clubId,
      city: club?.city,
      countryName: sessionPack.countries.find((c) => c.id === club?.countryId)?.name,
      managerName,
      formation: managerPlan?.formation ?? '4-3-3',
      tacticalIntent: managerPlan?.tacticalIntent ?? 'BALANCED',
      startingXI,
      bench,
      attackRating: Math.round(lineupQuality.attackingQuality),
      defenseRating: Math.round(lineupQuality.defensiveQuality),
    };
  };

  const homeSelection = handoff.isUserHome
    ? handoff.userClubSelection
    : handoff.opponentClubSelection;
  const awaySelection = handoff.isUserHome
    ? handoff.opponentClubSelection
    : handoff.userClubSelection;

  const homeManagerPlan = handoff.isUserHome
    ? handoff.userClubManagerPlan
    : handoff.opponentClubManagerPlan;
  const awayManagerPlan = handoff.isUserHome
    ? handoff.opponentClubManagerPlan
    : handoff.userClubManagerPlan;

  const home = buildViewTeam(handoff.homeWorldClubId, homeSelection, homeManagerPlan);
  const away = buildViewTeam(handoff.awayWorldClubId, awaySelection, awayManagerPlan);

  const userPlayer = buildViewPlayer(session.link.worldPlayerId);

  return {
    fixtureId: handoff.fixtureId,
    competitionId: handoff.competitionId,
    seasonLabel,
    scheduledDate: handoff.scheduledDate,
    round: handoff.round,
    competitionName,
    competitionShortName,
    ruleSet,
    home,
    away,
    isUserHome: handoff.isUserHome,
    userSelectionStatus: handoff.userSelectionStatus,
    userAvailability: handoff.userAvailability,
    userPlayer,
  };
}

/**
 * Convenience builder matching (handoff, runtimeState, sessionPack, staticContext, session) signature.
 */
export function buildWorldMatchViewModel(
  handoff: CareerInteractiveFixture,
  _runtimeState: FootballWorldRuntimeState,
  _sessionPack: FootballWorldDataPack,
  _staticContext: FootballWorldStaticContext,
  session: CareerWorldSession
): WorldMatchViewModel {
  return createWorldMatchViewModel(session, handoff);
}

// ============================================================================
// 4. ON-PITCH SQUAD & ASSIST / GOAL HELPERS
// ============================================================================

/**
 * Deterministically chooses an on-pitch teammate to credit as the goal scorer
 * when the user provides an assist.
 * Preference: ATT -> MID -> highest ability -> stable playerId tie-break.
 */
export function selectTeammateScorerForUserAssist(
  onPitchPlayerIds: readonly string[],
  userPlayerId: string,
  playerPositions: Map<string, WorldFootballPosition> | ((id: string) => WorldFootballPosition | undefined),
  playerStates: Map<string, { ability: number }>
): string | undefined {
  const eligibleTeammates = onPitchPlayerIds.filter((id) => id !== userPlayerId);
  if (eligibleTeammates.length === 0) return undefined;

  const roleRank: Record<WorldBroadRole, number> = {
    ATT: 4,
    MID: 3,
    DEF: 2,
    GK: 1,
  };

  const sorted = [...eligibleTeammates].sort((a, b) => {
    const posA = typeof playerPositions === 'function' ? playerPositions(a) : playerPositions.get(a);
    const posB = typeof playerPositions === 'function' ? playerPositions(b) : playerPositions.get(b);

    const rankA = roleRank[mapPositionToBroadRole(posA)];
    const rankB = roleRank[mapPositionToBroadRole(posB)];

    if (rankA !== rankB) {
      return rankB - rankA; // ATT over MID over DEF
    }

    const abilityA = playerStates.get(a)?.ability ?? 50;
    const abilityB = playerStates.get(b)?.ability ?? 50;
    if (abilityA !== abilityB) {
      return abilityB - abilityA; // higher ability first
    }

    return a.localeCompare(b); // stable tie-break
  });

  return sorted[0];
}

/**
 * Chooses an eligible on-pitch player for an automated/background goal.
 * Prefers ATT / MID, falls back to any on-pitch outfield player, then GK.
 */
export function selectBackgroundGoalScorer(
  onPitchPlayerIds: readonly string[],
  playerPositions: Map<string, WorldFootballPosition> | ((id: string) => WorldFootballPosition | undefined),
  rngFraction: number = 0.5
): string | undefined {
  if (onPitchPlayerIds.length === 0) return undefined;

  const attackersAndMidfielders = onPitchPlayerIds.filter((id) => {
    const pos = typeof playerPositions === 'function' ? playerPositions(id) : playerPositions.get(id);
    const broad = mapPositionToBroadRole(pos);
    return broad === 'ATT' || broad === 'MID';
  });

  const pool = attackersAndMidfielders.length > 0 ? attackersAndMidfielders : onPitchPlayerIds;
  const index = Math.floor(rngFraction * pool.length) % pool.length;
  return pool[index];
}

/**
 * Chooses an outgoing on-pitch starter when bringing the user on as a substitute.
 * Deterministic priority:
 * 1. Same broad role
 * 2. Compatible outfield role
 * 3. Stable ability / ID tie-break
 */
export function selectOutgoingPlayerForUserEntry(
  onPitchPlayerIds: readonly string[],
  userPosition: WorldFootballPosition,
  playerPositions: Map<string, WorldFootballPosition> | ((id: string) => WorldFootballPosition | undefined),
  playerStates: Map<string, { ability: number }>
): string | undefined {
  if (onPitchPlayerIds.length === 0) return undefined;

  const userBroad = mapPositionToBroadRole(userPosition);

  // Exclude GK from substitution unless user is GK
  const candidates = onPitchPlayerIds.filter((id) => {
    const pos = typeof playerPositions === 'function' ? playerPositions(id) : playerPositions.get(id);
    const broad = mapPositionToBroadRole(pos);
    if (userBroad !== 'GK' && broad === 'GK') return false;
    return true;
  });

  if (candidates.length === 0) return onPitchPlayerIds[0];

  const sorted = [...candidates].sort((a, b) => {
    const posA = typeof playerPositions === 'function' ? playerPositions(a) : playerPositions.get(a);
    const posB = typeof playerPositions === 'function' ? playerPositions(b) : playerPositions.get(b);
    const broadA = mapPositionToBroadRole(posA);
    const broadB = mapPositionToBroadRole(posB);

    const matchA = broadA === userBroad ? 1 : 0;
    const matchB = broadB === userBroad ? 1 : 0;

    if (matchA !== matchB) {
      return matchB - matchA; // Same role first
    }

    const abilityA = playerStates.get(a)?.ability ?? 50;
    const abilityB = playerStates.get(b)?.ability ?? 50;
    if (abilityA !== abilityB) {
      return abilityA - abilityB; // Take off lower ability player
    }

    return a.localeCompare(b);
  });

  return sorted[0];
}

// ============================================================================
// 5. EXTERNAL RESOLUTION BUILDER (PHASE 3S / 3T COMPLIANT)
// ============================================================================

/**
 * Pure builder creating a canonical WorldExternalFixtureResolution from
 * CareerWorldSession, CareerInteractiveFixture handoff, and WorldInteractiveMatchOutcome.
 *
 * Enforces:
 * - Exact starting XI and bench match from Phase 3R handoff.
 * - Exact manager plans from Phase 3R handoff.
 * - Accurate appearance minutes (starter: 90 or M; sub: 90 - M; dismissed: M).
 * - Exact 990 team minutes (or 970 / red-card adjusted minutes).
 * - Valid disciplinary records (yellow cards and red card flags).
 * - Canonical match ratings for all players with minutesPlayed > 0.
 */
export function buildCareerWorldExternalResolution(
  session: CareerWorldSession,
  handoff: CareerInteractiveFixture,
  outcome: WorldInteractiveMatchOutcome
): WorldExternalFixtureResolution {
  const { sessionPack, runtimeState } = session;

  const playerDefMap = new Map(sessionPack.players.map((p) => [p.id, p]));
  const playerStatesMap = new Map(
    runtimeState.playerFootballStates.map((s) => [s.playerId, s])
  );

  const compState = runtimeState.competitionSeasonStates.find(
    (c) => c.competitionId === handoff.competitionId
  );
  const seasonLabel = compState?.seasonLabel ?? '2026-27';
  const ruleSetId = handoff.competitionRuleSetId ?? compState?.ruleSetId ?? 'default-rules';

  const homeSelection = (handoff.isUserHome
    ? handoff.userClubSelection
    : handoff.opponentClubSelection)!;
  const awaySelection = (handoff.isUserHome
    ? handoff.opponentClubSelection
    : handoff.userClubSelection)!;

  const homeManagerPlan = (handoff.isUserHome
    ? handoff.userClubManagerPlan
    : handoff.opponentClubManagerPlan)!;
  const awayManagerPlan = (handoff.isUserHome
    ? handoff.opponentClubManagerPlan
    : handoff.userClubManagerPlan)!;

  // 1. Reconstruct Appearances per team
  const buildTeamAppearances = (
    teamId: string,
    selection: WorldMatchTeamSelection
  ): WorldPlayerMatchAppearance[] => {
    const appearances: WorldPlayerMatchAppearance[] = [];

    const teamSubs = outcome.substitutions.filter((s) => s.teamId === teamId);
    const teamDismissals = outcome.dismissals.filter((d) => d.teamId === teamId);

    // Track subs & dismissals by player
    const subbedOutMinuteByPlayer = new Map<string, number>();
    const subbedInMinuteByPlayer = new Map<string, number>();
    for (const sub of teamSubs) {
      subbedOutMinuteByPlayer.set(sub.playerOutId, sub.minute);
      subbedInMinuteByPlayer.set(sub.playerInId, sub.minute);
    }

    const dismissalMinuteByPlayer = new Map<string, number>();
    for (const dis of teamDismissals) {
      dismissalMinuteByPlayer.set(dis.playerId, dis.minute);
    }

    // Process starters
    for (const pId of selection.startingPlayerIds) {
      const isDismissed = dismissalMinuteByPlayer.has(pId);
      const isSubbedOff = subbedOutMinuteByPlayer.has(pId);

      let minutesPlayed = 90;
      if (isDismissed) {
        minutesPlayed = dismissalMinuteByPlayer.get(pId)!;
      } else if (isSubbedOff) {
        minutesPlayed = subbedOutMinuteByPlayer.get(pId)!;
      }

      // Disciplinary check from events
      const playerYellowEvents = outcome.events.filter(
        (e) => e.type === 'YELLOW_CARD' && e.playerId === pId && e.teamId === teamId
      );
      const playerRedEvents = outcome.events.filter(
        (e) =>
          (e.type === 'SECOND_YELLOW_RED' || e.type === 'STRAIGHT_RED') &&
          e.playerId === pId &&
          e.teamId === teamId
      );

      appearances.push({
        playerId: pId,
        teamId,
        started: true,
        minutesPlayed,
      });
    }

    // Process bench
    for (const pId of selection.benchPlayerIds) {
      const isSubbedIn = subbedInMinuteByPlayer.has(pId);
      const isDismissed = dismissalMinuteByPlayer.has(pId);

      let minutesPlayed = 0;
      if (isSubbedIn) {
        const inMinute = subbedInMinuteByPlayer.get(pId)!;
        if (isDismissed) {
          const disMinute = dismissalMinuteByPlayer.get(pId)!;
          minutesPlayed = Math.max(0, disMinute - inMinute);
        } else {
          minutesPlayed = Math.max(0, 90 - inMinute);
        }
      }

      appearances.push({
        playerId: pId,
        teamId,
        started: false,
        minutesPlayed,
      });
    }

    return appearances;
  };

  const homeAppearances = buildTeamAppearances(handoff.homeWorldClubId, homeSelection);
  const awayAppearances = buildTeamAppearances(handoff.awayWorldClubId, awaySelection);
  const allAppearances = [...homeAppearances, ...awayAppearances];

  // 2. Canonical Match Ratings (only for players with minutesPlayed > 0)
  const playerRatings = computeExternalMatchRatings({
    homeTeamId: handoff.homeWorldClubId,
    awayTeamId: handoff.awayWorldClubId,
    homeGoals: outcome.homeGoals,
    awayGoals: outcome.awayGoals,
    appearances: allAppearances,
    events: outcome.events as WorldMatchEvent[],
    playerStates: playerStatesMap,
    playerPositions: (id) => playerDefMap.get(id)?.primaryPosition,
  });

  // 3. Assemble Resolution
  const result: CompetitionFixtureResult = {
    fixtureId: handoff.fixtureId,
    competitionId: handoff.competitionId,
    seasonLabel,
    ruleSetId,
    round: handoff.round,
    homeTeamId: handoff.homeWorldClubId,
    awayTeamId: handoff.awayWorldClubId,
    homeGoals: outcome.homeGoals,
    awayGoals: outcome.awayGoals,
  };

  const participation: WorldFixtureParticipation = {
    fixtureId: handoff.fixtureId,
    homeSelection,
    awaySelection,
    playerAppearances: allAppearances,
  };

  const matchDetail: WorldFixtureMatchDetail = {
    fixtureId: handoff.fixtureId,
    events: [...outcome.events] as WorldMatchEvent[],
    playerRatings,
  };

  const managerPlans: [WorldManagerMatchPlan, WorldManagerMatchPlan] = [
    {
      fixtureId: handoff.fixtureId,
      teamId: handoff.homeWorldClubId,
      managerId: homeManagerPlan.managerId,
      formation: homeManagerPlan.formation,
      tacticalIntent: homeManagerPlan.tacticalIntent,
    },
    {
      fixtureId: handoff.fixtureId,
      teamId: handoff.awayWorldClubId,
      managerId: awayManagerPlan.managerId,
      formation: awayManagerPlan.formation,
      tacticalIntent: awayManagerPlan.tacticalIntent,
    },
  ];

  return {
    fixtureId: handoff.fixtureId,
    result,
    participation,
    matchDetail,
    managerPlans,
  };
}
