/**
 * Career ↔ Living World Integration Bridge
 *
 * Safe, deterministic, pure-function bridge connecting the existing playable
 * career RPG (Player, attributes, contracts, life RPG) with the living football world
 * (FootballWorldRuntimeState, calendar, fixtures, squads, match simulation).
 *
 * Principles:
 * - Deterministic: Pure functions without pseudo-random generator or wall clock calls.
 * - Non-destructive: Original world data pack is NEVER mutated on disk or in-memory.
 * - Identity preservation: careerPlayer.id === worldPlayerId.
 * - Surgical projection: World-to-career condition projection never touches contracts, finances, lifestyle, attributes.
 * - Permanent ability ownership: Career training owns user player ability; world NPC development is excluded for user player.
 */

import type {
  FootballWorldAdvanceResult,
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
  WorldCountryDefinition,
  WorldFootballPosition,
  WorldManagerMatchPlan,
  WorldMatchTeamSelection,
  WorldPlayerAvailabilityState,
  WorldPlayerDefinition,
  WorldPlayerFootballState,
  WorldExternalFixtureResolution,
} from '../world/types';
import { bootstrapFootballWorld } from '../world/worldRuntime';
import {
  advanceFootballWorldStep,
  advanceFootballWorldDayWithExternalResolutions,
  buildCompetitionFixtureDateMap,
  addDaysToDate,
} from '../world/worldProgression';
import {
  resolveWorldManagerProfile,
  selectMatchTeamSquadWithManager,
} from '../world/managerAI';
import { resolveRuleSetBenchSize } from '../world/matchSquadSelection';
import { isPlayerAvailableForFixture } from '../world/playerAvailability';
import type { Player, Position } from '../types/game';
import { mapLegacyClubIdToWorldClubId } from '../utils/worldClubCompatibility';

// ============================================================================
// 1. SESSION-LEVEL LINK & CONTAINER STRUCTURES
// ============================================================================

/**
 * Minimal, serializable bridge link identifying the user player and their club
 * in both the legacy career layer and the living world simulation.
 */
export interface CareerWorldLink {
  readonly careerPlayerId: string;
  readonly worldPlayerId: string;
  readonly legacyClubId: string;
  readonly worldClubId: string;
}

/**
 * Active career-world session container containing the identity link,
 * runtime state, session data pack, and derived session static context.
 */
export interface CareerWorldSession {
  readonly link: CareerWorldLink;
  readonly runtimeState: FootballWorldRuntimeState;
  readonly staticContext: FootballWorldStaticContext;
  readonly sessionPack: FootballWorldDataPack;
  readonly reservedFixtureIds?: readonly string[];
}

/**
 * Result of creating an integrated career-world session.
 */
export interface CareerWorldSessionBootstrapResult {
  readonly accepted: boolean;
  readonly session?: CareerWorldSession;
  readonly link?: CareerWorldLink;
  readonly runtimeState?: FootballWorldRuntimeState;
  readonly staticContext?: FootballWorldStaticContext;
  readonly sessionPack?: FootballWorldDataPack;
  readonly error?: string;
}

/**
 * Result of advancing an active career-world session.
 */
export interface AdvanceCareerWorldSessionResult {
  readonly accepted: boolean;
  readonly session?: CareerWorldSession;
  readonly error?: string;
  readonly advanceResult?: FootballWorldAdvanceResult;
}

/**
 * Result of atomically resolving an interactive fixture day.
 */
export interface ResolveCareerInteractiveFixtureResult {
  readonly accepted: boolean;
  readonly session?: CareerWorldSession;
  readonly error?: string;
  readonly advanceResult?: FootballWorldAdvanceResult;
}

/**
 * Result of querying the user's next scheduled world fixture.
 */
export interface CareerScheduledFixtureQuery {
  readonly fixtureId: string;
  readonly competitionId: string;
  readonly date: string;
  readonly round: number;
  readonly homeClubId: string;
  readonly awayClubId: string;
  readonly isHome: boolean;
  readonly opponentWorldClubId: string;
}

/**
 * Pure, serializable handoff representation for interactive match presentation.
 */
export interface CareerInteractiveFixture {
  readonly fixtureId: string;
  readonly competitionId: string;
  readonly scheduledDate: string;
  readonly round: number;
  readonly homeWorldClubId: string;
  readonly awayWorldClubId: string;
  readonly userWorldClubId: string;
  readonly opponentWorldClubId: string;
  readonly isUserHome: boolean;
  readonly userAvailability: 'AVAILABLE' | 'INJURED' | 'SUSPENDED';
  readonly userSelectionStatus: 'STARTER' | 'BENCH' | 'NOT_SELECTED' | 'UNAVAILABLE';
  readonly userClubSelection?: WorldMatchTeamSelection;
  readonly opponentClubSelection?: WorldMatchTeamSelection;
  readonly userClubManagerPlan?: WorldManagerMatchPlan;
  readonly opponentClubManagerPlan?: WorldManagerMatchPlan;
  readonly competitionRuleSetId?: string;
}

/**
 * Result of advancing the world to the user's next match.
 */
export interface AdvanceToNextFixtureResult {
  readonly accepted: boolean;
  readonly session?: CareerWorldSession;
  readonly nextFixture?: CareerScheduledFixtureQuery;
  readonly handoff?: CareerInteractiveFixture;
  readonly error?: string;
  readonly advanceResult?: FootballWorldAdvanceResult;
}

// ============================================================================
// 2. POSITION MAPPING
// ============================================================================

/**
 * Explicit 1-to-1 mapping from legacy career Position to WorldFootballPosition.
 */
export const CAREER_TO_WORLD_POSITION: Readonly<Record<Position, WorldFootballPosition>> = {
  ST: 'ST',
  LW: 'LW',
  RW: 'RW',
  CAM: 'CAM',
  CM: 'CM',
  CDM: 'CDM',
  LB: 'LB',
  RB: 'RB',
  CB: 'CB',
  GK: 'GK',
} as const;

/**
 * Maps a career Position to its canonical WorldFootballPosition.
 */
export function mapCareerPositionToWorldPosition(position: Position): WorldFootballPosition {
  const mapped = CAREER_TO_WORLD_POSITION[position];
  if (!mapped) {
    throw new Error(`Unsupported career position: '${position}'`);
  }
  return mapped;
}

// ============================================================================
// 3. NATIONALITY RESOLUTION
// ============================================================================

/**
 * Explicit alias overrides for country naming conventions between career geography
 * and world pack country definitions.
 */
const COUNTRY_NAME_ALIASES: Readonly<Record<string, string>> = {
  'ivory coast': 'cote-divoire',
  'cote d\'ivoire': 'cote-divoire',
  'côte d\'ivoire': 'cote-divoire',
  'south korea': 'south-korea',
  'korea republic': 'south-korea',
  'dr congo': 'dr-congo',
  'democratic republic of the congo': 'dr-congo',
  'south africa': 'south-africa',
  'united states': 'usa',
  'usa': 'usa',
};

/**
 * Resolves a career player's nationality to a canonical world country ID.
 * Matches deterministically by:
 * 1. Normalized alias table
 * 2. Exact country id
 * 3. Exact ISO / nation code
 * 4. Exact lowercase country name
 * Returns undefined if unresolvable. Does NOT fabricate or guess.
 */
export function resolveCareerNationalityToWorldCountryId(
  nationality: string,
  nationCode: string,
  worldCountries: readonly WorldCountryDefinition[]
): string | undefined {
  const normNat = nationality.trim().toLowerCase();
  const normCode = nationCode.trim().toUpperCase();

  // Check explicit alias
  const aliasId = COUNTRY_NAME_ALIASES[normNat];
  if (aliasId) {
    const match = worldCountries.find((c) => c.id === aliasId);
    if (match) return match.id;
  }

  // Exact ID match (e.g. 'england', 'nigeria', 'spain')
  const byId = worldCountries.find(
    (c) => c.id.toLowerCase() === normNat.replace(/\s+/g, '-')
  );
  if (byId) return byId.id;

  // Exact code match (e.g. 'ENG', 'ESP', 'FRA')
  const byCode = worldCountries.find((c) => c.code.toUpperCase() === normCode);
  if (byCode) return byCode.id;

  // Exact name match
  const byName = worldCountries.find(
    (c) => c.name.toLowerCase() === normNat
  );
  if (byName) return byName.id;

  return undefined;
}

// ============================================================================
// 4. USER WORLD PLAYER DEFINITION ADAPTER
// ============================================================================

/**
 * Creates the minimum WorldPlayerDefinition required by the world engine from
 * factual career player fields.
 *
 * Rules:
 * - worldPlayerId === careerPlayer.id.
 * - primaryPosition mapped via CAREER_TO_WORLD_POSITION.
 * - dateOfBirth is undefined (never fabricate a date of birth).
 * - nationality is mapped strictly if resolvable, otherwise empty array (never fabricate).
 */
export function createWorldPlayerDefinitionFromCareer(
  careerPlayer: Player,
  worldCountries: readonly WorldCountryDefinition[]
): WorldPlayerDefinition {
  const primaryPosition = mapCareerPositionToWorldPosition(careerPlayer.position);
  const countryId = resolveCareerNationalityToWorldCountryId(
    careerPlayer.nationality,
    careerPlayer.nationCode,
    worldCountries
  );

  return {
    id: careerPlayer.id,
    firstName: careerPlayer.firstName,
    lastName: careerPlayer.lastName,
    dateOfBirth: undefined,
    nationalityCountryIds: countryId ? [countryId] : [],
    primaryPosition,
  };
}

// ============================================================================
// 5. FOOTBALL STATE BOOTSTRAP ADAPTER
// ============================================================================

/**
 * Converts career form (0..10 scale, e.g. 7.2) to world form (0..100 scale, integer).
 * Formula: Math.min(100, Math.max(0, Math.round(careerForm * 10)))
 */
export function convertCareerFormToWorldForm(careerForm: number): number {
  return Math.min(100, Math.max(0, Math.round(careerForm * 10)));
}

/**
 * Projects world form (0..100 scale, integer) back to career form (0..10 scale, 1 decimal place).
 * Formula: Math.min(10, Math.max(0, Math.round(worldForm) / 10))
 */
export function convertWorldFormToCareerForm(worldForm: number): number {
  return Math.min(10, Math.max(0, Math.round(worldForm) / 10));
}

/**
 * Creates the initial WorldPlayerFootballState for the user player from their career fields.
 *
 * Exact Field Ranges & Clamping:
 * - career.overallRating (1..99)    -> world.ability (1..100, clamped)
 * - career.potentialRating (1..99)  -> world.potential (max(ability, potential), clamped 1..100)
 * - career.energy (0..100)          -> world.fitness (0..100, clamped)
 * - career.matchSharpness (0..100)  -> world.sharpness (0..100, clamped)
 * - career.morale (0..100)          -> world.morale (0..100, clamped)
 * - career.form (0..10)             -> world.form (0..100 via round(form * 10), clamped)
 */
export function createInitialWorldPlayerFootballState(
  careerPlayer: Player
): WorldPlayerFootballState {
  const ability = Math.min(100, Math.max(1, Math.round(careerPlayer.overallRating)));
  const potential = Math.min(
    100,
    Math.max(ability, Math.round(careerPlayer.potentialRating))
  );
  const fitness = Math.min(100, Math.max(0, Math.round(careerPlayer.energy)));
  const sharpness = Math.min(100, Math.max(0, Math.round(careerPlayer.matchSharpness)));
  const morale = Math.min(100, Math.max(0, Math.round(careerPlayer.morale)));
  const form = convertCareerFormToWorldForm(careerPlayer.form);

  return {
    playerId: careerPlayer.id,
    ability,
    potential,
    fitness,
    sharpness,
    form,
    morale,
    developmentProgress: 0,
  };
}

// ============================================================================
// 6. WORLD → CAREER PROJECTION (SURGICAL)
// ============================================================================

/**
 * Surgically projects world condition updates back to the career Player.
 *
 * Mutates ONLY:
 * - energy (from world.fitness)
 * - matchSharpness (from world.sharpness)
 * - morale (from world.morale)
 * - form (from world.form converted to 0..10)
 *
 * NEVER touches:
 * - currentContract, bankBalance, totalCareerEarnings, taxResidency
 * - staff, sponsors, lifestyleAssets, person, dualNationality, travelPapers
 * - careerHistory, trophyCabinet, awards, attributes, overallRating, potentialRating
 */
export function projectWorldFootballOutputsToCareerPlayer(
  careerPlayer: Player,
  worldState: WorldPlayerFootballState
): Player {
  return {
    ...careerPlayer,
    energy: Math.min(100, Math.max(0, Math.round(worldState.fitness))),
    matchSharpness: Math.min(100, Math.max(0, Math.round(worldState.sharpness))),
    morale: Math.min(100, Math.max(0, Math.round(worldState.morale))),
    form: convertWorldFormToCareerForm(worldState.form),
  };
}

// ============================================================================
// 7. CAREER → WORLD SYNC BOUNDARY
// ============================================================================

/**
 * Pure helper for synchronizing legitimate career football changes (e.g. from TrainingHub,
 * DailyRoutine, Coaching, Lifestyle, Medical) to the user player's world state.
 *
 * Rules:
 * - Ability / Potential: synced from overallRating / potentialRating (clamped 1..100)
 * - Fitness / Sharpness: synced from energy / matchSharpness (clamped 0..100)
 * - Morale: synced from morale (clamped 0..100)
 * - Form: REMAINS WORLD-OWNED (worldState.form). Match simulation owns form progression.
 *
 * Explicit direction: Career -> World.
 */
export function syncCareerFootballInputsToWorldPlayerState(
  worldState: WorldPlayerFootballState,
  careerPlayer: Player
): WorldPlayerFootballState {
  const ability = Math.min(100, Math.max(1, Math.round(careerPlayer.overallRating)));
  const potential = Math.min(
    100,
    Math.max(ability, Math.round(careerPlayer.potentialRating))
  );
  const fitness = Math.min(100, Math.max(0, Math.round(careerPlayer.energy)));
  const sharpness = Math.min(100, Math.max(0, Math.round(careerPlayer.matchSharpness)));
  const morale = Math.min(100, Math.max(0, Math.round(careerPlayer.morale)));

  return {
    ...worldState,
    ability,
    potential,
    fitness,
    sharpness,
    morale,
    form: worldState.form,
  };
}

// ============================================================================
// 8. SESSION BOOTSTRAP OVERLAY
// ============================================================================

/**
 * Bootstraps an integrated career-world simulation session from a canonical
 * FootballWorldDataPack and an existing career Player.
 *
 * Guarantees:
 * 1. The input `pack` is NEVER mutated.
 * 2. User player is inserted into exactly one world squad (the mapped club's squad).
 * 3. User player ID collisions with imported world players throw an explicit error.
 * 4. User player has initial condition state injected with career ratings.
 * 5. Static context contains user player and flags userControlledPlayerIds so
 *    Phase 3N NPC development does not double-count or overwrite user training.
 * 6. Returns a plain serializable CareerWorldLink and runtime state.
 */
export function createCareerWorldSession(
  pack: FootballWorldDataPack,
  careerPlayer: Player
): CareerWorldSessionBootstrapResult {
  // 1. Resolve club mapping
  const worldClubId = mapLegacyClubIdToWorldClubId(careerPlayer.currentClubId);
  if (!worldClubId) {
    return {
      accepted: false,
      error: `Legacy club '${careerPlayer.currentClubId}' is unsupported or does not map to a living world club.`,
    };
  }

  // 2. Validate user player ID uniqueness against pack
  const existingPlayer = pack.players.find((p) => p.id === careerPlayer.id);
  if (existingPlayer) {
    return {
      accepted: false,
      error: `ID collision: Career player ID '${careerPlayer.id}' already exists in imported world player definitions.`,
    };
  }

  // 3. Verify target club exists in pack
  const targetClub = pack.clubs.find((c) => c.id === worldClubId);
  if (!targetClub) {
    return {
      accepted: false,
      error: `Mapped world club '${worldClubId}' was not found in world pack club definitions.`,
    };
  }

  // 4. Verify target squad exists in pack
  const targetSquad = pack.squadAssignments.find((s) => s.clubId === worldClubId);
  if (!targetSquad) {
    return {
      accepted: false,
      error: `Squad assignment seed not found for mapped world club '${worldClubId}'.`,
    };
  }

  // 5. Create user player definition
  const userPlayerDef = createWorldPlayerDefinitionFromCareer(
    careerPlayer,
    pack.countries
  );

  // 6. Create cloned/overlay session data pack (DO NOT mutate input pack)
  const sessionSquadAssignments = pack.squadAssignments.map((s) => {
    if (s.clubId === worldClubId) {
      return {
        clubId: s.clubId,
        playerIds: [...s.playerIds, careerPlayer.id],
      };
    }
    return {
      clubId: s.clubId,
      playerIds: [...s.playerIds],
    };
  });

  const sessionPack: FootballWorldDataPack = {
    ...pack,
    players: [...pack.players, userPlayerDef],
    squadAssignments: sessionSquadAssignments,
  };

  // 7. Bootstrap runtime world
  const bootstrapRes = bootstrapFootballWorld(sessionPack);
  if (!bootstrapRes.accepted || !bootstrapRes.state) {
    return {
      accepted: false,
      error: bootstrapRes.error || 'Failed to bootstrap football world runtime.',
    };
  }

  // 8. Inject user initial football state (overriding default baseline)
  const userFootballState = createInitialWorldPlayerFootballState(careerPlayer);
  const runtimeState: FootballWorldRuntimeState = {
    ...bootstrapRes.state,
    playerFootballStates: [
      ...bootstrapRes.state.playerFootballStates.filter((s) => s.playerId !== careerPlayer.id),
      userFootballState,
    ],
  };

  // 9. Build static context with user position and userControlledPlayerIds
  const playerPositions = new Map<string, WorldFootballPosition>();
  for (const p of sessionPack.players) {
    playerPositions.set(p.id, p.primaryPosition);
  }

  const staticContext: FootballWorldStaticContext = {
    players: sessionPack.players,
    playerPositions,
    ruleSets: sessionPack.competitionRuleSets,
    competitionRuleSets: sessionPack.competitionRuleSets,
    userControlledPlayerIds: new Set<string>([careerPlayer.id]),
  };

  const link: CareerWorldLink = {
    careerPlayerId: careerPlayer.id,
    worldPlayerId: careerPlayer.id,
    legacyClubId: careerPlayer.currentClubId,
    worldClubId,
  };

  const session: CareerWorldSession = {
    link,
    runtimeState,
    staticContext,
    sessionPack,
  };

  return {
    accepted: true,
    session,
    link,
    runtimeState,
    staticContext,
    sessionPack,
  };
}

// ============================================================================
// 9. CAREER-WORLD SESSION PROGRESSION
// ============================================================================

/**
 * Pure helper for safely advancing an active career-world session to nextDate.
 *
 * Guarantees:
 * - Always passes session.staticContext (with userControlledPlayerIds) to advanceFootballWorldStep,
 *   preventing accidental loss of user development exclusion.
 * - Leaves sessionPack pure and free of session-control metadata.
 * - Returns a new updated CareerWorldSession container on success without mutating input state.
 */
export function advanceCareerWorldSession(
  session: CareerWorldSession,
  nextDate: string
): AdvanceCareerWorldSessionResult {
  // Reserved-date guard: prevent advancing across/onto any actively reserved unresolved fixture date
  if (session.reservedFixtureIds && session.reservedFixtureIds.length > 0) {
    const unresolvedReserved: Array<{ fixtureId: string; date: string }> = [];
    for (const fId of session.reservedFixtureIds) {
      const found = findScheduledFixture(session.runtimeState, fId);
      if (!found) continue;
      const isResolved = found.compState.results.some((r) => r.fixtureId === fId);
      if (isResolved) continue;
      unresolvedReserved.push({ fixtureId: fId, date: found.scheduledDate });
    }

    if (unresolvedReserved.length > 0) {
      unresolvedReserved.sort((a, b) => a.date.localeCompare(b.date));
      const earliest = unresolvedReserved[0];
      if (nextDate >= earliest.date) {
        return {
          accepted: false,
          error: `Cannot advance career world through reserved fixture '${earliest.fixtureId}' scheduled for ${earliest.date}.`,
        };
      }
    }
  }

  const advanceResult = advanceFootballWorldStep(
    session.runtimeState,
    nextDate,
    session.staticContext
  );

  if (!advanceResult.accepted || !advanceResult.state) {
    return {
      accepted: false,
      error: advanceResult.error || 'Failed to advance career-world session.',
      advanceResult,
    };
  }

  // Prune any reservations that have been resolved
  let updatedReservations: string[] | undefined = undefined;
  if (session.reservedFixtureIds && session.reservedFixtureIds.length > 0) {
    const allResolvedIds = new Set(
      advanceResult.state.competitionSeasonStates
        .flatMap((c) => c.results)
        .map((r) => r.fixtureId)
    );
    const remaining = session.reservedFixtureIds.filter((id) => !allResolvedIds.has(id));
    if (remaining.length > 0) {
      updatedReservations = remaining;
    }
  }

  return {
    accepted: true,
    session: {
      ...session,
      runtimeState: advanceResult.state,
      reservedFixtureIds: updatedReservations,
    },
    advanceResult,
  };
}

// ============================================================================
// 10. USER FIXTURE AUTHORITY & RESERVATION LIFECYCLE
// ============================================================================

/**
 * Pure query identifying the earliest unresolved scheduled fixture involving the user's club.
 *
 * Deterministic tie-break order:
 * 1. Earliest calendar date (YYYY-MM-DD ASC)
 * 2. competitionId ASC (localeCompare)
 * 3. round ASC (numeric)
 * 4. fixtureId ASC (localeCompare)
 */
export function getNextCareerWorldFixture(
  session: CareerWorldSession
): CareerScheduledFixtureQuery | undefined {
  const userClubId = session.link.worldClubId;
  const currentDate = session.runtimeState.currentDate;
  const candidates: CareerScheduledFixtureQuery[] = [];

  for (const compState of session.runtimeState.competitionSeasonStates) {
    const resolvedIds = new Set(compState.results.map((r) => r.fixtureId));
    const dateMap = buildCompetitionFixtureDateMap(compState, currentDate);

    for (const round of compState.schedule.rounds) {
      for (const fixture of round.fixtures) {
        if (resolvedIds.has(fixture.id)) continue;

        const isHome = fixture.homeTeamId === userClubId;
        const isAway = fixture.awayTeamId === userClubId;
        if (!isHome && !isAway) continue;

        const scheduledDate = dateMap.get(fixture.id);
        if (!scheduledDate || scheduledDate < currentDate) continue;

        candidates.push({
          fixtureId: fixture.id,
          competitionId: compState.competitionId,
          date: scheduledDate,
          round: fixture.round,
          homeClubId: fixture.homeTeamId,
          awayClubId: fixture.awayTeamId,
          isHome,
          opponentWorldClubId: isHome ? fixture.awayTeamId : fixture.homeTeamId,
        });
      }
    }
  }

  if (candidates.length === 0) {
    return undefined;
  }

  candidates.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    if (a.competitionId !== b.competitionId) {
      return a.competitionId.localeCompare(b.competitionId);
    }
    if (a.round !== b.round) {
      return a.round - b.round;
    }
    return a.fixtureId.localeCompare(b.fixtureId);
  });

  return candidates[0];
}

/**
 * Pure helper to mark a fixture reserved/deferred in session metadata.
 * Does NOT mutate input session.
 */
export function reserveCareerFixture(
  session: CareerWorldSession,
  fixtureId: string
): CareerWorldSession {
  const currentSet = new Set(session.reservedFixtureIds ?? []);
  currentSet.add(fixtureId);
  return {
    ...session,
    reservedFixtureIds: Array.from(currentSet),
  };
}

/**
 * Pure helper to remove a fixture reservation from session metadata.
 * If fixtureId is omitted, removes all reservations.
 * Does NOT mutate input session.
 */
export function releaseCareerFixtureReservation(
  session: CareerWorldSession,
  fixtureId?: string
): CareerWorldSession {
  if (!fixtureId) {
    const { reservedFixtureIds: _omitted, ...rest } = session;
    return { ...rest };
  }

  const updated = (session.reservedFixtureIds ?? []).filter((id) => id !== fixtureId);
  return {
    ...session,
    reservedFixtureIds: updated.length > 0 ? updated : undefined,
  };
}

/**
 * Internal helper to locate a scheduled fixture across active competition season states.
 */
function findScheduledFixture(
  runtimeState: FootballWorldRuntimeState,
  fixtureId: string
): {
  compState: (typeof runtimeState.competitionSeasonStates)[number];
  fixture: (typeof runtimeState.competitionSeasonStates)[number]['schedule']['rounds'][number]['fixtures'][number];
  scheduledDate: string;
} | undefined {
  for (const compState of runtimeState.competitionSeasonStates) {
    const dMap = buildCompetitionFixtureDateMap(compState, runtimeState.currentDate);
    for (const round of compState.schedule.rounds) {
      const found = round.fixtures.find((f) => f.id === fixtureId);
      if (found) {
        const scheduledDate = dMap.get(found.id) ?? runtimeState.currentDate;
        return { compState, fixture: found, scheduledDate };
      }
    }
  }
  return undefined;
}

/**
 * Pure generator creating a serializable interactive match handoff object.
 * Computes user availability, manager pre-match squad selection, and tactical plans
 * from the pre-match (D-1 end / D beginning) snapshot without simulating match scores.
 */
export function createCareerInteractiveHandoff(
  session: CareerWorldSession,
  fixtureId: string
): CareerInteractiveFixture | undefined {
  const target = findScheduledFixture(session.runtimeState, fixtureId);
  if (!target) return undefined;

  const { compState: targetCompState, fixture: targetFixture, scheduledDate } = target;
  const userClubId = session.link.worldClubId;
  const userPlayerId = session.link.worldPlayerId;

  // 1. User Availability Check
  const userAvailState = session.runtimeState.playerAvailabilityStates?.find(
    (a) => a.playerId === userPlayerId
  );
  const availResult = isPlayerAvailableForFixture(
    userPlayerId,
    scheduledDate,
    targetCompState.competitionId,
    userAvailState
  );
  const userAvailability: 'AVAILABLE' | 'INJURED' | 'SUSPENDED' = availResult.available
    ? 'AVAILABLE'
    : availResult.reason === 'INJURED'
    ? 'INJURED'
    : 'SUSPENDED';

  // 2. Pre-Match Manager AI Squad Selection & Plan Generation
  const squadMap = new Map((session.runtimeState.squadAssignments ?? []).map((s) => [s.clubId, s.playerIds]));
  const clubManagerMap = new Map((session.runtimeState.managerAssignments ?? []).map((m) => [m.clubId, m.managerId]));

  const ruleSets = session.staticContext.ruleSets ?? session.staticContext.competitionRuleSets;
  const benchSize = resolveRuleSetBenchSize(targetCompState.ruleSetId, ruleSets);

  let playerPositions: Map<string, WorldFootballPosition>;
  if (session.staticContext.playerPositions instanceof Map) {
    playerPositions = session.staticContext.playerPositions;
  } else if (session.staticContext.playerPositions) {
    playerPositions = new Map(Object.entries(session.staticContext.playerPositions));
  } else {
    playerPositions = new Map();
    for (const p of session.staticContext.players ?? []) {
      if (p.primaryPosition) playerPositions.set(p.id, p.primaryPosition);
    }
  }

  const playerBirthDates = new Map<string, string>();
  for (const p of session.staticContext.players ?? []) {
    if (p.dateOfBirth) playerBirthDates.set(p.id, p.dateOfBirth);
  }

  const playerStatesMap = new Map((session.runtimeState.playerFootballStates ?? []).map((s) => [s.playerId, s]));

  const makeAvailFn = (compId: string) => (pId: string) => {
    const a = session.runtimeState.playerAvailabilityStates?.find((av) => av.playerId === pId);
    return isPlayerAvailableForFixture(pId, scheduledDate, compId, a).available;
  };

  // Build Home & Away Selections and Manager Plans
  const buildTeamSquadPlan = (teamId: string) => {
    const squad = squadMap.get(teamId) ?? [];
    const managerId = clubManagerMap.get(teamId);
    const managerProfile = resolveWorldManagerProfile(managerId);
    return selectMatchTeamSquadWithManager(teamId, squad, playerStatesMap, {
      fixtureId: targetFixture.id,
      benchSize,
      playerPositions,
      isPlayerAvailable: makeAvailFn(targetCompState.competitionId),
      playerBirthDates,
      calendarDate: scheduledDate,
      managerProfile,
    });
  };

  const homeSquadResult = buildTeamSquadPlan(targetFixture.homeTeamId);
  const awaySquadResult = buildTeamSquadPlan(targetFixture.awayTeamId);

  const isUserHome = targetFixture.homeTeamId === userClubId;
  const userClubSquadResult = isUserHome ? homeSquadResult : awaySquadResult;
  const opponentClubSquadResult = isUserHome ? awaySquadResult : homeSquadResult;

  // 3. User Selection Authority (Starter vs Bench vs Not Selected)
  let userSelectionStatus: 'STARTER' | 'BENCH' | 'NOT_SELECTED' | 'UNAVAILABLE';
  if (userAvailability !== 'AVAILABLE') {
    userSelectionStatus = 'UNAVAILABLE';
  } else if (userClubSquadResult.selection.startingPlayerIds.includes(userPlayerId)) {
    userSelectionStatus = 'STARTER';
  } else if (userClubSquadResult.selection.benchPlayerIds.includes(userPlayerId)) {
    userSelectionStatus = 'BENCH';
  } else {
    userSelectionStatus = 'NOT_SELECTED';
  }

  return {
    fixtureId: targetFixture.id,
    competitionId: targetCompState.competitionId,
    scheduledDate,
    round: targetFixture.round,
    homeWorldClubId: targetFixture.homeTeamId,
    awayWorldClubId: targetFixture.awayTeamId,
    userWorldClubId: userClubId,
    opponentWorldClubId: isUserHome ? targetFixture.awayTeamId : targetFixture.homeTeamId,
    isUserHome,
    userAvailability,
    userSelectionStatus,
    userClubSelection: userClubSquadResult.selection,
    opponentClubSelection: opponentClubSquadResult.selection,
    userClubManagerPlan: userClubSquadResult.matchPlan,
    opponentClubManagerPlan: opponentClubSquadResult.matchPlan,
    competitionRuleSetId: targetCompState.ruleSetId,
  };
}

/**
 * Pure helper advancing background world chronology toward the user's next fixture.
 *
 * New Semantics (Phase 3R Day-Boundary Invariant):
 * - Stops strictly at D - 1 (the calendar day preceding target fixture date D).
 * - Leaves all fixtures on date D completely unresolved to avoid premature condition recovery
 *   or stranding unresolved fixtures.
 * - The returned session has currentDate === D - 1, with fixture D reserved in reservedFixtureIds.
 * - The generated handoff exposes manager pre-match selections from the pristine start-of-D state.
 * - If currentDate is already >= D, returns an explicit lifecycle error.
 */
export function advanceCareerWorldToNextFixture(
  session: CareerWorldSession,
  targetFixtureId?: string
): AdvanceToNextFixtureResult {
  let targetQuery: CareerScheduledFixtureQuery | undefined;

  if (targetFixtureId) {
    const target = findScheduledFixture(session.runtimeState, targetFixtureId);
    if (!target) {
      return {
        accepted: false,
        error: `Target fixture '${targetFixtureId}' was not found in active competitions.`,
      };
    }
    const { compState, fixture, scheduledDate } = target;
    const isResolved = compState.results.some((r) => r.fixtureId === targetFixtureId);
    if (isResolved) {
      return {
        accepted: false,
        error: `Target fixture '${targetFixtureId}' has already been resolved in competition '${compState.competitionId}'.`,
      };
    }
    const isHome = fixture.homeTeamId === session.link.worldClubId;
    const isAway = fixture.awayTeamId === session.link.worldClubId;
    if (!isHome && !isAway) {
      return {
        accepted: false,
        error: `Target fixture '${targetFixtureId}' does not involve user club '${session.link.worldClubId}'.`,
      };
    }
    targetQuery = {
      fixtureId: fixture.id,
      competitionId: compState.competitionId,
      date: scheduledDate,
      round: fixture.round,
      homeClubId: fixture.homeTeamId,
      awayClubId: fixture.awayTeamId,
      isHome,
      opponentWorldClubId: isHome ? fixture.awayTeamId : fixture.homeTeamId,
    };
  } else {
    targetQuery = getNextCareerWorldFixture(session);
    if (!targetQuery) {
      return {
        accepted: false,
        error: 'No upcoming scheduled fixtures found for user club.',
      };
    }
  }

  const targetDate = targetQuery.date;
  const previousDate = addDaysToDate(targetDate, -1);
  const currentDate = session.runtimeState.currentDate;

  // Lifecycle check: cannot advance to D if currentDate is already at or past D
  if (currentDate >= targetDate) {
    return {
      accepted: false,
      error: `Lifecycle error: Current date '${currentDate}' is already at or past target fixture date '${targetDate}'.`,
    };
  }

  const reservedSet = new Set<string>([
    ...(session.reservedFixtureIds ?? []),
    targetQuery.fixtureId,
  ]);

  let currentSession: CareerWorldSession;
  let advanceResult: FootballWorldAdvanceResult | undefined;

  if (currentDate < previousDate) {
    const adv = advanceFootballWorldStep(
      session.runtimeState,
      previousDate,
      session.staticContext
    );
    if (!adv.accepted || !adv.state) {
      return {
        accepted: false,
        error: adv.error || `Failed to advance world to date ${previousDate}.`,
        advanceResult: adv,
      };
    }
    advanceResult = adv;
    currentSession = {
      ...session,
      runtimeState: adv.state,
      reservedFixtureIds: Array.from(reservedSet),
    };
  } else {
    // Already on previousDate (D - 1): no world advancement required
    currentSession = {
      ...session,
      reservedFixtureIds: Array.from(reservedSet),
    };
  }

  const handoff = createCareerInteractiveHandoff(currentSession, targetQuery.fixtureId);

  return {
    accepted: true,
    session: currentSession,
    nextFixture: targetQuery,
    handoff,
    advanceResult,
  };
}

/**
 * Phase 3S: Atomically resolves an externally decided interactive fixture for the user's club
 * and closes the entire match date D.
 *
 * Requirements:
 * - Session must currently be stopped at D - 1 (the calendar barrier established in Phase 3R).
 * - Target fixture must be present in session.reservedFixtureIds.
 * - Target fixture must involve user's world club (session.link.worldClubId).
 * - Fixture must not have already been resolved in competition results.
 * - Calls advanceFootballWorldDayWithExternalResolutions to simulate date D atomically.
 * - On success: removes fixture reservation and returns updated session with currentDate === D.
 * - On failure: leaves session and reservation completely unchanged.
 */
export function resolveCareerInteractiveFixtureDay(
  session: CareerWorldSession,
  externalResolution: WorldExternalFixtureResolution
): ResolveCareerInteractiveFixtureResult {
  if (!session || !session.runtimeState) {
    return {
      accepted: false,
      error: 'Valid CareerWorldSession is required.',
    };
  }

  if (!externalResolution || !externalResolution.fixtureId) {
    return {
      accepted: false,
      error: 'Valid WorldExternalFixtureResolution is required.',
    };
  }

  const reservedFixtureIds = session.reservedFixtureIds ?? [];
  if (!reservedFixtureIds.includes(externalResolution.fixtureId)) {
    return {
      accepted: false,
      error: `Fixture '${externalResolution.fixtureId}' is not reserved in session. Current reserved fixtures: [${reservedFixtureIds.join(', ')}].`,
    };
  }

  const target = findScheduledFixture(session.runtimeState, externalResolution.fixtureId);
  if (!target) {
    return {
      accepted: false,
      error: `Fixture '${externalResolution.fixtureId}' not found in active competitions.`,
    };
  }

  const { compState, fixture, scheduledDate } = target;

  // Duplicate safety: fixture must not already be resolved
  const isAlreadyResolved = compState.results.some((r) => r.fixtureId === externalResolution.fixtureId);
  if (isAlreadyResolved) {
    return {
      accepted: false,
      error: `Fixture '${externalResolution.fixtureId}' has already been resolved in competition '${compState.competitionId}'.`,
    };
  }

  // Session currentDate must equal D - 1
  const expectedPreviousDate = addDaysToDate(scheduledDate, -1);
  if (session.runtimeState.currentDate !== expectedPreviousDate) {
    return {
      accepted: false,
      error: `Session currentDate '${session.runtimeState.currentDate}' must equal D-1 of scheduled fixture date '${scheduledDate}'.`,
    };
  }

  // Fixture must involve user club
  const isHome = fixture.homeTeamId === session.link.worldClubId;
  const isAway = fixture.awayTeamId === session.link.worldClubId;
  if (!isHome && !isAway) {
    return {
      accepted: false,
      error: `Fixture '${externalResolution.fixtureId}' does not involve user club '${session.link.worldClubId}'.`,
    };
  }

  // Reconstruct Phase 3R handoff for exact reservation to enforce career manager authority
  const handoff = createCareerInteractiveHandoff(session, externalResolution.fixtureId);
  if (!handoff) {
    return {
      accepted: false,
      error: `Failed to create Phase 3R interactive handoff for fixture '${externalResolution.fixtureId}'.`,
    };
  }

  const expectedHomeSelection = handoff.isUserHome
    ? handoff.userClubSelection
    : handoff.opponentClubSelection;
  const expectedAwaySelection = handoff.isUserHome
    ? handoff.opponentClubSelection
    : handoff.userClubSelection;

  const actualHomeSel = externalResolution.participation?.homeSelection;
  const actualAwaySel = externalResolution.participation?.awaySelection;

  if (!actualHomeSel || !actualAwaySel) {
    return {
      accepted: false,
      error: 'Career external resolution must supply home and away selections.',
    };
  }

  const arraysEqual = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  if (!expectedHomeSelection || !arraysEqual(actualHomeSel.startingPlayerIds, expectedHomeSelection.startingPlayerIds)) {
    return {
      accepted: false,
      error: 'Career external resolution home startingPlayerIds must match Phase 3R handoff exactly.',
    };
  }
  if (!expectedHomeSelection || !arraysEqual(actualHomeSel.benchPlayerIds, expectedHomeSelection.benchPlayerIds)) {
    return {
      accepted: false,
      error: 'Career external resolution home benchPlayerIds must match Phase 3R handoff exactly.',
    };
  }
  if (!expectedAwaySelection || !arraysEqual(actualAwaySel.startingPlayerIds, expectedAwaySelection.startingPlayerIds)) {
    return {
      accepted: false,
      error: 'Career external resolution away startingPlayerIds must match Phase 3R handoff exactly.',
    };
  }
  if (!expectedAwaySelection || !arraysEqual(actualAwaySel.benchPlayerIds, expectedAwaySelection.benchPlayerIds)) {
    return {
      accepted: false,
      error: 'Career external resolution away benchPlayerIds must match Phase 3R handoff exactly.',
    };
  }

  // Enforce Phase 3R manager match plans equality
  const expectedHomePlan = handoff.isUserHome
    ? handoff.userClubManagerPlan
    : handoff.opponentClubManagerPlan;
  const expectedAwayPlan = handoff.isUserHome
    ? handoff.opponentClubManagerPlan
    : handoff.userClubManagerPlan;

  if (!externalResolution.managerPlans || externalResolution.managerPlans.length !== 2) {
    return {
      accepted: false,
      error: 'Career external resolution must supply exactly 2 manager plans.',
    };
  }

  const actualHomePlan = externalResolution.managerPlans.find((m) => m.teamId === fixture.homeTeamId);
  const actualAwayPlan = externalResolution.managerPlans.find((m) => m.teamId === fixture.awayTeamId);

  if (!actualHomePlan || !actualAwayPlan) {
    return {
      accepted: false,
      error: 'Career external resolution must supply manager plans for both home and away teams.',
    };
  }

  const validatePlanMatches = (
    actual: WorldManagerMatchPlan,
    expected?: WorldManagerMatchPlan,
    side?: 'home' | 'away'
  ) => {
    if (!expected) {
      return `Missing expected handoff manager plan for ${side} team.`;
    }
    if (actual.fixtureId !== expected.fixtureId) {
      return `Career external resolution ${side} manager plan fixtureId '${actual.fixtureId}' does not match handoff '${expected.fixtureId}'.`;
    }
    if (actual.teamId !== expected.teamId) {
      return `Career external resolution ${side} manager plan teamId '${actual.teamId}' does not match handoff '${expected.teamId}'.`;
    }
    if (actual.managerId !== expected.managerId) {
      return `Career external resolution ${side} manager plan managerId '${actual.managerId}' does not match handoff '${expected.managerId}'.`;
    }
    if (actual.formation !== expected.formation) {
      return `Career external resolution ${side} manager plan formation '${actual.formation}' does not match handoff '${expected.formation}'.`;
    }
    if (actual.tacticalIntent !== expected.tacticalIntent) {
      return `Career external resolution ${side} manager plan tacticalIntent '${actual.tacticalIntent}' does not match handoff '${expected.tacticalIntent}'.`;
    }
    return null;
  };

  const homePlanErr = validatePlanMatches(actualHomePlan, expectedHomePlan, 'home');
  if (homePlanErr) {
    return { accepted: false, error: homePlanErr };
  }
  const awayPlanErr = validatePlanMatches(actualAwayPlan, expectedAwayPlan, 'away');
  if (awayPlanErr) {
    return { accepted: false, error: awayPlanErr };
  }

  // Perform atomic one-day world progression with external resolution
  const advanceResult = advanceFootballWorldDayWithExternalResolutions(
    session.runtimeState,
    scheduledDate,
    session.staticContext,
    [externalResolution]
  );

  if (!advanceResult.accepted || !advanceResult.state) {
    return {
      accepted: false,
      error: advanceResult.error || `Failed to advance world for fixture '${externalResolution.fixtureId}'.`,
      advanceResult,
    };
  }

  // On success: remove the fixture reservation
  const nextReserved = reservedFixtureIds.filter((id) => id !== externalResolution.fixtureId);

  const nextSession: CareerWorldSession = {
    link: session.link,
    runtimeState: advanceResult.state,
    staticContext: session.staticContext,
    sessionPack: session.sessionPack,
    ...(nextReserved.length > 0 ? { reservedFixtureIds: nextReserved } : {}),
  };

  return {
    accepted: true,
    session: nextSession,
    advanceResult,
  };
}
