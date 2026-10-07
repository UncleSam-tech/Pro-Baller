export type CompetitionCategory =
  | 'DOMESTIC_LEAGUE'
  | 'DOMESTIC_CUP'
  | 'CONTINENTAL_LEAGUE'
  | 'CONTINENTAL_CUP'
  | 'SUPER_CUP'
  | 'PLAYOFF';

export type CompetitionFormatType =
  | 'DOUBLE_ROUND_ROBIN'
  | 'SINGLE_ROUND_ROBIN'
  | 'KNOCKOUT_SINGLE'
  | 'KNOCKOUT_TWO_LEG'
  | 'GROUP_STAGE'
  | 'SWISS_LEAGUE'
  | 'CONFERENCE'
  | 'SPLIT_LEAGUE'
  | 'APERTURA_CLAUSURA';

export interface CompetitionDefinition {
  id: string;
  name: string;
  shortName: string;

  countryId?: string;
  confederationId?: string;

  category: CompetitionCategory;

  level?: number;
}

export interface CompetitionFormatRules {
  type: CompetitionFormatType;

  expectedClubCount?: number;

  pointsForWin?: number;
  pointsForDraw?: number;

  rounds?: number;

  promotionPlaces?: number;
  relegationPlaces?: number;

  hasPromotionPlayoff?: boolean;
  hasRelegationPlayoff?: boolean;

  extraTimeEnabled: boolean;
  penaltiesEnabled: boolean;
}

export interface SubstitutionRules {
  maxSubsRegulation: number;
  maxStoppageWindows: number;
  benchSize: number;

  halfTimeCountsAsWindow: boolean;

  extraTimeEnabled: boolean;
  extraTimeExtraSub: number;
}

export interface YellowCardThreshold {
  cards: number;
  suspensionMatches: number;

  cutoffRound?: number;
}

export interface DisciplinaryRules {
  yellowThresholds: YellowCardThreshold[];

  repeatCycleInterval?: number;

  rollingWindowMatches?: number;

  straightRedDefaultMatches: number;
  secondYellowRedMatches: number;

  disciplinaryFineGBP?: number;

  policyName: string;
}

export interface CompetitionPresentation {
  primaryColor?: string;
  matchBall?: string;

  varEnabled?: boolean;

  reputationMultiplier?: number;
}

export type RuleVerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_OFFICIAL_VERIFICATION';

export interface CompetitionRuleSet {
  id: string;

  competitionId: string;

  seasonLabel: string;

  ruleVersion: string;

  verificationStatus: RuleVerificationStatus;

  format: CompetitionFormatRules;

  substitutions: SubstitutionRules;

  discipline: DisciplinaryRules;

  presentation: CompetitionPresentation;
}

export interface CompetitionRuleRegistry {
  definitions: Record<string, CompetitionDefinition>;
  ruleSets: Record<string, CompetitionRuleSet>;
}

