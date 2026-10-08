/**
 * World Club Compatibility Layer
 *
 * Deterministic, explicit mapping between legacy career club IDs (snake_case/legacy)
 * and living world club IDs (kebab-case/canonical 2026-27 world data pack).
 *
 * Rules:
 * - 1-to-1 explicit deterministic mapping.
 * - No fuzzy string matching, no includes, no runtime heuristics.
 * - Unsupported legacy clubs explicitly fail and report failure.
 */

/**
 * 13 legacy clubs whose IDs match world club IDs directly.
 */
export const DIRECT_LEGACY_CLUB_IDS: readonly string[] = [
  'arsenal',
  'liverpool',
  'chelsea',
  'juventus',
  'benfica',
  'sunderland',
  'southampton',
  'como',
  'enyimba',
  'atalanta',
  'lazio',
  'lille',
  'feyenoord',
] as const;

/**
 * 42 legacy clubs requiring explicit ID translation to canonical world club IDs.
 */
export const EXPLICIT_LEGACY_TO_WORLD_CLUB_MAP: Readonly<Record<string, string>> = {
  // England
  man_city: 'manchester-city',
  man_utd: 'manchester-united',
  tottenham: 'tottenham-hotspur',
  aston_villa: 'aston-villa',
  brighton: 'brighton-and-hove-albion',
  ipswich: 'ipswich-town',
  leeds_united: 'leeds-united',
  leicester_city: 'leicester-city',

  // Spain
  real_madrid: 'real-madrid',
  barcelona: 'fc-barcelona',
  atletico_madrid: 'atletico-madrid',
  real_sociedad: 'real-sociedad',
  las_palmas: 'ud-las-palmas',
  athletic_bilbao: 'athletic-club',
  sevilla_fc: 'sevilla',
  real_betis: 'real-betis',

  // Germany
  bayern_munich: 'fc-bayern-munchen',
  bayer_leverkusen: 'bayer-04-leverkusen',
  dortmund: 'borussia-dortmund',
  rb_leipzig: 'rb-leipzig',
  eintracht_frankfurt: 'eintracht-frankfurt',
  vfb_stuttgart: 'vfb-stuttgart',

  // Italy
  inter_milan: 'inter',
  ac_milan: 'ac-milan',
  napoli: 'ssc-napoli',
  as_roma: 'as-roma',

  // France
  psg: 'paris-saint-germain',
  monaco: 'as-monaco',
  marseille: 'olympique-de-marseille',
  lyon: 'olympique-lyonnais',

  // Portugal
  sporting_cp: 'sporting-cp',
  porto: 'fc-porto',
  braga: 'sporting-braga',

  // Netherlands
  ajax: 'afc-ajax',
  psv: 'psv-eindhoven',
  az_alkmaar: 'az-alkmaar',

  // Nigeria (NPFL)
  sporting_lagos: 'sporting-lagos-fc',
  rivers_united: 'rivers-united',
  rangers_intl: 'enugu-rangers-international',
  bendel_insurance: 'bendel-insurance-fc',
  shooting_stars: 'shooting-stars',
  kano_pillars: 'kano-pillars',
} as const;

/**
 * 7 legacy clubs with no equivalent in the active 2026-27 world data pack.
 * (Brasileirão is not an active league; Remo Stars was not among the 20 clubs seeded for NPFL 2026-27).
 */
export const UNSUPPORTED_LEGACY_CLUB_IDS: readonly string[] = [
  'remo_stars',
  'santos_fc',
  'flamengo',
  'palmeiras',
  'sao_paulo',
  'corinthians',
  'fluminense',
] as const;

const DIRECT_SET = new Set<string>(DIRECT_LEGACY_CLUB_IDS);
const UNSUPPORTED_SET = new Set<string>(UNSUPPORTED_LEGACY_CLUB_IDS);

/**
 * Resolves a legacy club ID to its canonical world club ID.
 * Returns undefined if the club is unsupported or unknown.
 */
export function mapLegacyClubIdToWorldClubId(legacyClubId: string): string | undefined {
  if (DIRECT_SET.has(legacyClubId)) {
    return legacyClubId;
  }
  return EXPLICIT_LEGACY_TO_WORLD_CLUB_MAP[legacyClubId];
}

/**
 * Checks whether a legacy club ID is supported by the living world.
 */
export function isLegacyClubSupported(legacyClubId: string): boolean {
  return mapLegacyClubIdToWorldClubId(legacyClubId) !== undefined;
}

/**
 * Checks whether a legacy club ID is explicitly marked as unsupported.
 */
export function isLegacyClubExplicitlyUnsupported(legacyClubId: string): boolean {
  return UNSUPPORTED_SET.has(legacyClubId);
}
