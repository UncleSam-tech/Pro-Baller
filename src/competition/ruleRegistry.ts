import type {
  CompetitionDefinition,
  CompetitionRuleRegistry,
  CompetitionRuleSet,
} from './types';

export type { CompetitionRuleRegistry };

// ============================================================================
// SEED COMPETITION DEFINITIONS (IDENTITY ONLY)
// ============================================================================

export const SEED_COMPETITION_DEFINITIONS: Record<string, CompetitionDefinition> = {
  'england-premier-league': {
    id: 'england-premier-league',
    name: 'Premier League',
    shortName: 'EPL',
    countryId: 'england',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'spain-la-liga': {
    id: 'spain-la-liga',
    name: 'La Liga',
    shortName: 'LL',
    countryId: 'spain',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'germany-bundesliga': {
    id: 'germany-bundesliga',
    name: 'Bundesliga',
    shortName: 'BL',
    countryId: 'germany',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'italy-serie-a': {
    id: 'italy-serie-a',
    name: 'Serie A',
    shortName: 'SA',
    countryId: 'italy',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'france-ligue-1': {
    id: 'france-ligue-1',
    name: 'Ligue 1',
    shortName: 'L1',
    countryId: 'france',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'england-championship': {
    id: 'england-championship',
    name: 'EFL Championship',
    shortName: 'EFL',
    countryId: 'england',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 2,
  },
  'nigeria-npfl': {
    id: 'nigeria-npfl',
    name: 'Nigeria Premier Football League',
    shortName: 'NPFL',
    countryId: 'nigeria',
    confederationId: 'caf',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'brazil-brasileirao': {
    id: 'brazil-brasileirao',
    name: 'Campeonato Brasileiro Série A',
    shortName: 'BRA',
    countryId: 'brazil',
    confederationId: 'conmebol',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'portugal-primeira-liga': {
    id: 'portugal-primeira-liga',
    name: 'Liga Portugal',
    shortName: 'LP',
    countryId: 'portugal',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
  'netherlands-eredivisie': {
    id: 'netherlands-eredivisie',
    name: 'Eredivisie',
    shortName: 'ERE',
    countryId: 'netherlands',
    confederationId: 'uefa',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
  },
};

// ============================================================================
// SEED COMPETITION RULE SETS (SEASON-VERSIONED SPORTING & DISCIPLINARY RULES)
// ============================================================================

export const SEED_COMPETITION_RULE_SETS: Record<string, CompetitionRuleSet> = {
  'england-premier-league:2026-27:v1': {
    id: 'england-premier-league:2026-27:v1',
    competitionId: 'england-premier-league',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 3,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 5, suspensionMatches: 1, cutoffRound: 19 },
        { cards: 10, suspensionMatches: 2 },
      ],
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 2500,
      policyName: 'FA Premier League Disciplinary Protocol (Section 12)',
    },
    presentation: {
      primaryColor: '#3D195B',
      matchBall: 'Nike Flight Hi-Vis Premier League',
      varEnabled: true,
      reputationMultiplier: 1.0,
    },
  },
  'spain-la-liga:2026-27:v1': {
    id: 'spain-la-liga:2026-27:v1',
    competitionId: 'spain-la-liga',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 3,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 5, suspensionMatches: 1 },
        { cards: 10, suspensionMatches: 1 },
      ],
      repeatCycleInterval: 5,
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 1800,
      policyName: 'RFEF Competición Ciclo de Amonestaciones',
    },
    presentation: {
      primaryColor: '#EE1222',
      matchBall: 'Puma Orbita La Liga EA Sports',
      varEnabled: true,
      reputationMultiplier: 0.98,
    },
  },
  'germany-bundesliga:2026-27:v1': {
    id: 'germany-bundesliga:2026-27:v1',
    competitionId: 'germany-bundesliga',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 18,
      rounds: 34,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 2,
      hasRelegationPlayoff: true,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 5, suspensionMatches: 1 },
        { cards: 10, suspensionMatches: 1 },
      ],
      repeatCycleInterval: 5,
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 2200,
      policyName: 'DFB Gelbsperre Accumulation Standard',
    },
    presentation: {
      primaryColor: '#D10214',
      matchBall: 'Derbystar Bundesliga Brillant APS',
      varEnabled: true,
      reputationMultiplier: 0.96,
    },
  },
  'italy-serie-a:2026-27:v1': {
    id: 'italy-serie-a:2026-27:v1',
    competitionId: 'italy-serie-a',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 3,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 15,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 5, suspensionMatches: 1 },
        { cards: 9, suspensionMatches: 1 },
      ],
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 2000,
      policyName: 'FIGC Giudice Sportivo Disciplinary Code',
    },
    presentation: {
      primaryColor: '#008FD7',
      matchBall: 'Puma Orbita Serie A Enilive',
      varEnabled: true,
      reputationMultiplier: 0.95,
    },
  },
  'france-ligue-1:2026-27:v1': {
    id: 'france-ligue-1:2026-27:v1',
    competitionId: 'france-ligue-1',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 18,
      rounds: 34,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 2,
      hasRelegationPlayoff: true,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 3, suspensionMatches: 1, cutoffRound: 34 },
      ],
      rollingWindowMatches: 10,
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 1700,
      policyName: 'LFP Commission de Discipline',
    },
    presentation: {
      primaryColor: '#091C3E',
      matchBall: "Kipsta Ligue 1 McDonald's Pro",
      varEnabled: true,
      reputationMultiplier: 0.92,
    },
  },
  'england-championship:2026-27:v1': {
    id: 'england-championship:2026-27:v1',
    competitionId: 'england-championship',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      pointsForWin: 3,
      pointsForDraw: 1,
      promotionPlaces: 2,
      hasPromotionPlayoff: true,
      relegationPlaces: 3,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 5, suspensionMatches: 1, cutoffRound: 19 },
        { cards: 10, suspensionMatches: 2 },
      ],
      straightRedDefaultMatches: 3,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 1200,
      policyName: 'EFL Disciplinary Standard',
    },
    presentation: {
      primaryColor: '#1A2B4C',
      matchBall: 'Puma Orbita EFL Official Match Ball',
      varEnabled: false,
      reputationMultiplier: 0.85,
    },
  },
  'nigeria-npfl:2026-27:v1': {
    id: 'nigeria-npfl:2026-27:v1',
    competitionId: 'nigeria-npfl',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 4,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 9,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 3, suspensionMatches: 1 },
        { cards: 6, suspensionMatches: 1 },
      ],
      straightRedDefaultMatches: 2,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 500,
      policyName: 'NPFL / NFF Disciplinary Committee Rulebook Section B',
    },
    presentation: {
      primaryColor: '#008751',
      matchBall: 'NPFL Official Select Matchball',
      varEnabled: false,
      reputationMultiplier: 0.65,
    },
  },
  'brazil-brasileirao:2026-27:v1': {
    id: 'brazil-brasileirao:2026-27:v1',
    competitionId: 'brazil-brasileirao',
    seasonLabel: '2026-27',
    ruleVersion: '1',
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      pointsForWin: 3,
      pointsForDraw: 1,
      relegationPlaces: 4,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    substitutions: {
      maxSubsRegulation: 5,
      maxStoppageWindows: 3,
      benchSize: 12,
      halfTimeCountsAsWindow: false,
      extraTimeEnabled: false,
      extraTimeExtraSub: 0,
    },
    discipline: {
      yellowThresholds: [
        { cards: 3, suspensionMatches: 1 },
        { cards: 6, suspensionMatches: 1 },
      ],
      straightRedDefaultMatches: 2,
      secondYellowRedMatches: 1,
      disciplinaryFineGBP: 1000,
      policyName: 'CBF STJD Regulamento Geral de Competições',
    },
    presentation: {
      primaryColor: '#FEDF00',
      matchBall: 'Penalty S11 Ecoknit Série A',
      varEnabled: true,
      reputationMultiplier: 0.82,
    },
  },
  // NOTE: 'portugal-primeira-liga' and 'netherlands-eredivisie' definitions exist
  // in SEED_COMPETITION_DEFINITIONS, but their seasonal rule sets are intentionally
  // omitted here because official disciplinary rules are not yet available in the
  // codebase. Per architecture policy, unverified placeholder rules are not fabricated.
};

export const CANONICAL_COMPETITION_REGISTRY: CompetitionRuleRegistry = {
  definitions: SEED_COMPETITION_DEFINITIONS,
  ruleSets: SEED_COMPETITION_RULE_SETS,
};

// ============================================================================
// CANONICAL LOOKUP APIS
// ============================================================================

/**
 * Retrieves a competition definition by unique ID.
 * Returns undefined if competition is unknown (never defaults to Premier League).
 */
export function getCompetitionDefinition(
  competitionId: string
): CompetitionDefinition | undefined {
  return CANONICAL_COMPETITION_REGISTRY.definitions[competitionId];
}

/**
 * Retrieves a competition rule set for a specified competition and season.
 * If seasonLabel is omitted, resolves the newest available rule set for that competition.
 * Returns undefined if not found (never defaults to Premier League).
 */
export function getCompetitionRuleSet(
  competitionId: string,
  seasonLabel?: string
): CompetitionRuleSet | undefined {
  if (seasonLabel) {
    const directKey = `${competitionId}:${seasonLabel}:v1`;
    if (CANONICAL_COMPETITION_REGISTRY.ruleSets[directKey]) {
      return CANONICAL_COMPETITION_REGISTRY.ruleSets[directKey];
    }
    // Search by competitionId and seasonLabel
    return Object.values(CANONICAL_COMPETITION_REGISTRY.ruleSets).find(
      rs => rs.competitionId === competitionId && rs.seasonLabel === seasonLabel
    );
  }

  // Resolve matching rule set for this competition
  return Object.values(CANONICAL_COMPETITION_REGISTRY.ruleSets).find(
    rs => rs.competitionId === competitionId
  );
}
