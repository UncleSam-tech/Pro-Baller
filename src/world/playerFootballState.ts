import type { CompetitionFixtureResult } from '../competition/types';
import type {
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  WorldPlayerFootballState,
} from './types';

// ============================================================================
// SIMULATION BALANCING & GAME DESIGN CONSTANTS
// (Pro Baller simulation seeds — not official real-world ratings)
// ============================================================================

export const COMPETITION_BASELINE_ABILITIES: Readonly<Record<string, number>> = {
  // England (7 tiers)
  'england-premier-league': 80,
  'england-championship': 68,
  'england-league-one': 58,
  'england-league-two': 50,
  'england-national-league': 42,
  'england-national-league-north': 35,
  'england-national-league-south': 35,

  // Spain (2 tiers)
  'spain-la-liga': 79,
  'spain-segunda-division': 66,

  // Germany (2 tiers)
  'germany-bundesliga': 78,
  'germany-2-bundesliga': 65,

  // Italy (2 tiers)
  'italy-serie-a': 78,
  'italy-serie-b': 65,

  // France (2 tiers)
  'france-ligue-1': 75,
  'france-ligue-2': 63,

  // Portugal (2 tiers)
  'portugal-liga-portugal': 72,
  'portugal-liga-portugal-2': 58,

  // Netherlands (1 tier)
  'netherlands-eredivisie': 72,

  // Turkey (1 tier)
  'turkey-super-lig': 70,

  // Belgium (2 tiers)
  'belgium-pro-league': 69,
  'belgium-challenger-pro-league': 56,

  // Saudi Arabia (1 tier)
  'saudi-arabia-pro-league': 68,

  // USA (1 tier)
  'usa-mls': 66,

  // Nigeria (1 tier)
  'nigeria-npfl': 48,
};

export const DEFAULT_COMPETITION_BASELINE_ABILITY = 50;

// Initial condition values (neutral playable state)
export const DEFAULT_PLAYER_FITNESS = 100;
export const DEFAULT_PLAYER_SHARPNESS = 70;
export const DEFAULT_PLAYER_FORM = 60;
export const DEFAULT_PLAYER_MORALE = 70;

// Valid ranges
export const MIN_PLAYER_ABILITY = 1;
export const MAX_PLAYER_ABILITY = 100;
export const MIN_PLAYER_CONDITION = 0;
export const MAX_PLAYER_CONDITION = 100;

// Bounds on club performance adjustment
export const MIN_CLUB_PERFORMANCE_ADJUSTMENT = -3;
export const MAX_CLUB_PERFORMANCE_ADJUSTMENT = 3;

// Bounds on player-specific deterministic variation
export const MIN_PLAYER_VARIATION = -5;
export const MAX_PLAYER_VARIATION = 5;

// ============================================================================
// DETERMINISTIC HASH & VARIATION HELPERS
// ============================================================================

/**
 * 32-bit FNV-1a string hashing function.
 */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministically generates a symmetric triangular variation in [-5, +5] for a player ID.
 * Peak probability is centered at 0, smoothly falling toward -5 and +5.
 */
export function getPlayerDeterministicVariation(playerId: string): number {
  const h = hashString(playerId);
  const r1 = (h >>> 0) % 6; // 0..5
  const r2 = (h >>> 8) % 6; // 0..5
  return r1 - r2;
}

// ============================================================================
// CLUB PERFORMANCE ADJUSTMENT
// ============================================================================

/**
 * Derives a small performance adjustment in [-3, +3] from authoritative match results.
 * Uses empirical Bayes shrinkage toward 0 for small sample sizes.
 */
export function computeClubPerformanceAdjustment(
  results: CompetitionFixtureResult[],
  clubId: string
): number {
  let points = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let matchesPlayed = 0;

  for (const r of results) {
    if (r.homeTeamId === clubId) {
      matchesPlayed++;
      goalsFor += r.homeGoals;
      goalsAgainst += r.awayGoals;
      if (r.homeGoals > r.awayGoals) points += 3;
      else if (r.homeGoals === r.awayGoals) points += 1;
    } else if (r.awayTeamId === clubId) {
      matchesPlayed++;
      goalsFor += r.awayGoals;
      goalsAgainst += r.homeGoals;
      if (r.awayGoals > r.homeGoals) points += 3;
      else if (r.awayGoals === r.homeGoals) points += 1;
    }
  }

  if (matchesPlayed === 0) {
    return 0;
  }

  const ppg = points / matchesPlayed;
  const goalDiff = goalsFor - goalsAgainst;
  const gdPerMatch = goalDiff / matchesPlayed;

  // Signal centered at expected football average (~1.35 PPG, 0 GD)
  const rawSignal = (ppg - 1.35) * 1.8 + gdPerMatch * 0.6;
  // Shrinkage factor towards 0 with prior weight of 6 matches
  const shrinkage = matchesPlayed / (matchesPlayed + 6);
  const unclamped = rawSignal * shrinkage;

  return Math.max(
    MIN_CLUB_PERFORMANCE_ADJUSTMENT,
    Math.min(MAX_CLUB_PERFORMANCE_ADJUSTMENT, Math.round(unclamped))
  );
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Deterministically initializes runtime football state for every player in the data pack.
 */
export function initializeWorldPlayerFootballStates(
  pack: FootballWorldDataPack
): WorldPlayerFootballState[] {
  // 1. Map club to competition ID
  const clubToCompetitionId = new Map<string, string>();
  for (const m of pack.domesticLeagueMemberships) {
    for (const clubId of m.clubIds) {
      clubToCompetitionId.set(clubId, m.competitionId);
    }
  }

  // 2. Precompute club performance adjustments across all competition results
  const clubAdjustmentMap = new Map<string, number>();
  for (const compSeason of pack.competitionSeasons) {
    const stats = new Map<
      string,
      { matches: number; points: number; gf: number; ga: number }
    >();

    for (const r of compSeason.results) {
      if (!stats.has(r.homeTeamId)) {
        stats.set(r.homeTeamId, { matches: 0, points: 0, gf: 0, ga: 0 });
      }
      if (!stats.has(r.awayTeamId)) {
        stats.set(r.awayTeamId, { matches: 0, points: 0, gf: 0, ga: 0 });
      }
      const home = stats.get(r.homeTeamId)!;
      const away = stats.get(r.awayTeamId)!;

      home.matches++;
      away.matches++;
      home.gf += r.homeGoals;
      home.ga += r.awayGoals;
      away.gf += r.awayGoals;
      away.ga += r.homeGoals;

      if (r.homeGoals > r.awayGoals) {
        home.points += 3;
      } else if (r.awayGoals > r.homeGoals) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    }

    for (const [clubId, stat] of stats.entries()) {
      if (stat.matches === 0) {
        clubAdjustmentMap.set(clubId, 0);
        continue;
      }
      const ppg = stat.points / stat.matches;
      const gdPerMatch = (stat.gf - stat.ga) / stat.matches;
      const rawSignal = (ppg - 1.35) * 1.8 + gdPerMatch * 0.6;
      const shrinkage = stat.matches / (stat.matches + 6);
      const unclamped = rawSignal * shrinkage;
      const adj = Math.max(
        MIN_CLUB_PERFORMANCE_ADJUSTMENT,
        Math.min(MAX_CLUB_PERFORMANCE_ADJUSTMENT, Math.round(unclamped))
      );
      clubAdjustmentMap.set(clubId, adj);
    }
  }

  // 3. Map player to club
  const playerToClubId = new Map<string, string>();
  for (const squad of pack.squadAssignments) {
    for (const playerId of squad.playerIds) {
      playerToClubId.set(playerId, squad.clubId);
    }
  }

  // 4. Initialize each player state deterministically
  const playerStates: WorldPlayerFootballState[] = [];
  for (const player of pack.players) {
    const clubId = playerToClubId.get(player.id);
    const compId = clubId ? clubToCompetitionId.get(clubId) : undefined;
    const baseline = compId
      ? (COMPETITION_BASELINE_ABILITIES[compId] ?? DEFAULT_COMPETITION_BASELINE_ABILITY)
      : DEFAULT_COMPETITION_BASELINE_ABILITY;
    const clubAdj = clubId ? (clubAdjustmentMap.get(clubId) ?? 0) : 0;
    const playerVar = getPlayerDeterministicVariation(player.id);

    const rawAbility = baseline + clubAdj + playerVar;
    const ability = Math.max(MIN_PLAYER_ABILITY, Math.min(MAX_PLAYER_ABILITY, rawAbility));

    playerStates.push({
      playerId: player.id,
      ability,
      fitness: DEFAULT_PLAYER_FITNESS,
      sharpness: DEFAULT_PLAYER_SHARPNESS,
      form: DEFAULT_PLAYER_FORM,
      morale: DEFAULT_PLAYER_MORALE,
    });
  }

  return playerStates;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface PlayerFootballStateValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validates player football states against canonical ranges and uniqueness.
 * Rejects values outside range without silent clamping.
 */
export function validateWorldPlayerFootballStates(
  states: WorldPlayerFootballState[],
  knownPlayerIds?: Set<string>
): PlayerFootballStateValidation {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < states.length; i++) {
    const s = states[i];
    if (!s.playerId) {
      errors.push(`Player state at index ${i} has empty playerId.`);
      continue;
    }
    if (seenIds.has(s.playerId)) {
      errors.push(`Duplicate player state for playerId '${s.playerId}'.`);
    }
    seenIds.add(s.playerId);

    if (knownPlayerIds && !knownPlayerIds.has(s.playerId)) {
      errors.push(`Player state references unknown playerId '${s.playerId}'.`);
    }

    if (
      typeof s.ability !== 'number' ||
      isNaN(s.ability) ||
      s.ability < MIN_PLAYER_ABILITY ||
      s.ability > MAX_PLAYER_ABILITY
    ) {
      errors.push(
        `Player '${s.playerId}' ability ${s.ability} is outside valid range [${MIN_PLAYER_ABILITY}, ${MAX_PLAYER_ABILITY}].`
      );
    }
    if (
      typeof s.fitness !== 'number' ||
      isNaN(s.fitness) ||
      s.fitness < MIN_PLAYER_CONDITION ||
      s.fitness > MAX_PLAYER_CONDITION
    ) {
      errors.push(
        `Player '${s.playerId}' fitness ${s.fitness} is outside valid range [${MIN_PLAYER_CONDITION}, ${MAX_PLAYER_CONDITION}].`
      );
    }
    if (
      typeof s.sharpness !== 'number' ||
      isNaN(s.sharpness) ||
      s.sharpness < MIN_PLAYER_CONDITION ||
      s.sharpness > MAX_PLAYER_CONDITION
    ) {
      errors.push(
        `Player '${s.playerId}' sharpness ${s.sharpness} is outside valid range [${MIN_PLAYER_CONDITION}, ${MAX_PLAYER_CONDITION}].`
      );
    }
    if (
      typeof s.form !== 'number' ||
      isNaN(s.form) ||
      s.form < MIN_PLAYER_CONDITION ||
      s.form > MAX_PLAYER_CONDITION
    ) {
      errors.push(
        `Player '${s.playerId}' form ${s.form} is outside valid range [${MIN_PLAYER_CONDITION}, ${MAX_PLAYER_CONDITION}].`
      );
    }
    if (
      typeof s.morale !== 'number' ||
      isNaN(s.morale) ||
      s.morale < MIN_PLAYER_CONDITION ||
      s.morale > MAX_PLAYER_CONDITION
    ) {
      errors.push(
        `Player '${s.playerId}' morale ${s.morale} is outside valid range [${MIN_PLAYER_CONDITION}, ${MAX_PLAYER_CONDITION}].`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// QUERY HELPER
// ============================================================================

/**
 * Retrieves the WorldPlayerFootballState for a given player ID, or undefined.
 */
export function getWorldPlayerFootballState(
  state: FootballWorldRuntimeState,
  playerId: string
): WorldPlayerFootballState | undefined {
  return state.playerFootballStates?.find(p => p.playerId === playerId);
}
