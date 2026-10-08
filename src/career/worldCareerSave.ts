/**
 * Pure Snapshot, Validation, and Rehydration Layer for Living-World Careers
 *
 * Responsibilities:
 * - Creates atomic plain-data WorldCareerSaveV1 records.
 * - Explicitly omits heavy static data (sessionPack, staticContext).
 * - Validates save integrity and compatibility against loaded canonical packs.
 * - Restores complete CareerWorldSession without re-bootstrapping or re-simulating historical results.
 * - Restores D-1 pre-match interactive handoff when activeFixtureId is reserved.
 */

import type { Player } from '../types/game';
import type {
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
  WorldFootballPosition,
} from '../world/types';
import {
  type CareerInteractiveFixture,
  type CareerWorldLink,
  type CareerWorldSession,
  createCareerInteractiveHandoff,
  createWorldPlayerDefinitionFromCareer,
} from './worldCareerBridge';

export const CURRENT_SAVE_SCHEMA_VERSION = 1 as const;

export interface WorldCareerSaveV1 {
  readonly schemaVersion: typeof CURRENT_SAVE_SCHEMA_VERSION;
  readonly kind: 'WORLD_CAREER';
  readonly savedAt: string; // ISO 8601 timestamp
  readonly player: Player;
  readonly world: {
    readonly dataPackId: string;
    readonly dataPackVersion: number;
    readonly seasonLabel: string;
    readonly snapshotDate: string;
    readonly link: CareerWorldLink;
    readonly runtimeState: FootballWorldRuntimeState;
    readonly reservedFixtureIds?: readonly string[];
    readonly activeFixtureId?: string;
  };
}

export interface WorldSaveValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

export interface RestoredCareerWorldSessionResult {
  readonly session: CareerWorldSession;
  readonly activeHandoff?: CareerInteractiveFixture;
}

/**
 * Creates an authoritative, plain-data WorldCareerSaveV1 snapshot record.
 *
 * Guarantees:
 * - sessionPack and staticContext are NOT stored (preventing ~9.7 MB duplication).
 * - player and living-world runtimeState are captured atomically.
 * - Result is structured-clone and JSON.stringify safe.
 */
export function createWorldCareerSaveRecord(
  player: Player,
  session: CareerWorldSession,
  activeFixtureId?: string
): WorldCareerSaveV1 {
  const { sessionPack, runtimeState, link, reservedFixtureIds } = session;

  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    kind: 'WORLD_CAREER',
    savedAt: new Date().toISOString(),
    player: structuredClone(player),
    world: {
      dataPackId: sessionPack.id,
      dataPackVersion: sessionPack.version,
      seasonLabel: sessionPack.seasonLabel,
      snapshotDate: sessionPack.snapshotDate,
      link: structuredClone(link),
      runtimeState: structuredClone(runtimeState),
      reservedFixtureIds: reservedFixtureIds ? [...reservedFixtureIds] : undefined,
      activeFixtureId: activeFixtureId ?? undefined,
    },
  };
}

/**
 * Validates a loaded save record against the active canonical world pack.
 *
 * Rejects:
 * - Schema version mismatches.
 * - Corrupt/missing player or world metadata.
 * - Player ID and link ID discrepancies.
 * - Incompatible world pack ID, version, seasonLabel, or snapshotDate.
 * - Missing player football condition or unmapped world clubs.
 */
export function validateWorldCareerSave(
  save: unknown,
  canonicalPack: FootballWorldDataPack
): WorldSaveValidationResult {
  if (!save || typeof save !== 'object') {
    return { valid: false, error: 'Save record is empty or not an object.' };
  }

  const s = save as Partial<WorldCareerSaveV1>;

  if (s.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `Unsupported save schema version: ${s.schemaVersion} (expected ${CURRENT_SAVE_SCHEMA_VERSION}).`,
    };
  }

  if (s.kind !== 'WORLD_CAREER') {
    return { valid: false, error: `Invalid save kind: '${s.kind}' (expected 'WORLD_CAREER').` };
  }

  if (!s.player || typeof s.player !== 'object' || !s.player.id) {
    return { valid: false, error: 'Save does not contain a valid Player object.' };
  }

  const world = s.world;
  if (!world || typeof world !== 'object') {
    return { valid: false, error: 'Save does not contain world state.' };
  }

  if (!world.link || typeof world.link !== 'object') {
    return { valid: false, error: 'Save does not contain CareerWorldLink.' };
  }

  if (world.link.careerPlayerId !== s.player.id || world.link.worldPlayerId !== s.player.id) {
    return {
      valid: false,
      error: `Career player ID '${s.player.id}' does not match world link IDs ('${world.link.careerPlayerId}' / '${world.link.worldPlayerId}').`,
    };
  }

  // Pack compatibility checks
  if (world.dataPackId !== canonicalPack.id) {
    return {
      valid: false,
      error: `Save expects world pack ID '${world.dataPackId}', but current pack is '${canonicalPack.id}'.`,
    };
  }

  if (world.dataPackVersion !== canonicalPack.version) {
    return {
      valid: false,
      error: `Save expects world pack version ${world.dataPackVersion}, but current pack is version ${canonicalPack.version}.`,
    };
  }

  if (world.seasonLabel !== canonicalPack.seasonLabel) {
    return {
      valid: false,
      error: `Save expects season '${world.seasonLabel}', but current pack is '${canonicalPack.seasonLabel}'.`,
    };
  }

  if (world.snapshotDate !== canonicalPack.snapshotDate) {
    return {
      valid: false,
      error: `Save expects snapshot date '${world.snapshotDate}', but current pack is '${canonicalPack.snapshotDate}'.`,
    };
  }

  const runtimeState = world.runtimeState;
  if (!runtimeState || typeof runtimeState !== 'object') {
    return { valid: false, error: 'Save is missing FootballWorldRuntimeState.' };
  }

  if (runtimeState.dataPackId !== canonicalPack.id || runtimeState.dataPackVersion !== canonicalPack.version) {
    return {
      valid: false,
      error: 'Runtime state pack metadata does not match canonical world pack.',
    };
  }

  // Club presence check
  const clubExists = canonicalPack.clubs.some((c) => c.id === world.link.worldClubId);
  if (!clubExists) {
    return {
      valid: false,
      error: `Mapped world club '${world.link.worldClubId}' does not exist in canonical world pack.`,
    };
  }

  // User player football state check
  const userFootballState = runtimeState.playerFootballStates?.find(
    (st) => st.playerId === s.player!.id
  );
  if (!userFootballState) {
    return {
      valid: false,
      error: `User player '${s.player.id}' has no corresponding WorldPlayerFootballState in runtime.`,
    };
  }

  // Active fixture reservation consistency
  if (world.activeFixtureId) {
    const isReserved = (world.reservedFixtureIds ?? []).includes(world.activeFixtureId);
    if (!isReserved) {
      return {
        valid: false,
        error: `Active fixture '${world.activeFixtureId}' is not present in reservedFixtureIds.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Reconstructs a full CareerWorldSession and optional active handoff from
 * the canonical world data pack and the saved WorldCareerSaveV1 record.
 *
 * Guarantees:
 * - Does NOT call bootstrapFootballWorld or createCareerWorldSession.
 * - Restores saved runtimeState completely untouched.
 * - Recreates the user WorldPlayerDefinition and sessionPack overlay.
 * - Reconstructs staticContext (including Maps and Sets).
 * - Restores active interactive handoff if saved at D-1.
 */
export function restoreCareerWorldSessionFromSave(
  canonicalPack: FootballWorldDataPack,
  save: WorldCareerSaveV1
): RestoredCareerWorldSessionResult {
  const { player, world } = save;
  const { link, runtimeState, reservedFixtureIds, activeFixtureId } = world;

  // 1. Recreate user player definition from saved Player
  const userPlayerDef = createWorldPlayerDefinitionFromCareer(player, canonicalPack.countries);

  // 2. Reconstruct session squad assignments overlaying the user player into their club
  const sessionSquadAssignments = canonicalPack.squadAssignments.map((s) => {
    if (s.clubId === link.worldClubId) {
      const playerIds = s.playerIds.includes(player.id)
        ? s.playerIds
        : [...s.playerIds, player.id];
      return {
        clubId: s.clubId,
        playerIds,
      };
    }
    return {
      clubId: s.clubId,
      playerIds: [...s.playerIds],
    };
  });

  // 3. Reconstruct sessionPack with user player overlay
  const sessionPack: FootballWorldDataPack = {
    ...canonicalPack,
    players: [...canonicalPack.players, userPlayerDef],
    squadAssignments: sessionSquadAssignments,
  };

  // 4. Rebuild staticContext Maps and Sets
  const playerPositions = new Map<string, WorldFootballPosition>();
  for (const p of sessionPack.players) {
    playerPositions.set(p.id, p.primaryPosition);
  }

  const staticContext: FootballWorldStaticContext = {
    players: sessionPack.players,
    playerPositions,
    ruleSets: sessionPack.competitionRuleSets,
    competitionRuleSets: sessionPack.competitionRuleSets,
    userControlledPlayerIds: new Set<string>([player.id]),
  };

  // 5. Construct restored session container with saved runtimeState
  const session: CareerWorldSession = {
    link,
    runtimeState,
    staticContext,
    sessionPack,
    reservedFixtureIds: reservedFixtureIds ? [...reservedFixtureIds] : undefined,
  };

  // 6. Reconstruct active interactive fixture handoff if activeFixtureId is reserved
  let activeHandoff: CareerInteractiveFixture | undefined;
  if (activeFixtureId && (reservedFixtureIds ?? []).includes(activeFixtureId)) {
    const handoff = createCareerInteractiveHandoff(session, activeFixtureId);
    if (handoff) {
      activeHandoff = handoff;
    }
  }

  return { session, activeHandoff };
}
