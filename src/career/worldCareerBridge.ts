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
  WorldPlayerDefinition,
  WorldPlayerFootballState,
} from '../world/types';
import { bootstrapFootballWorld } from '../world/worldRuntime';
import { advanceFootballWorldStep } from '../world/worldProgression';
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
  readonly advanceResult: FootballWorldAdvanceResult;
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

  return {
    accepted: true,
    session: {
      ...session,
      runtimeState: advanceResult.state,
    },
    advanceResult,
  };
}
