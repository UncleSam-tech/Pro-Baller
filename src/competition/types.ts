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

export interface MatchTechnologyRules {
  varEnabled: boolean;
}

export interface CompetitionSimulationModifiers {
  reputationMultiplier?: number;
}

export interface CompetitionPresentation {
  primaryColor?: string;
  matchBall?: string;
}

export type RuleVerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_OFFICIAL_VERIFICATION';

export interface CompetitionRuleSet {
  id: string;

  competitionId: string;

  seasonLabel: string;

  ruleVersion: number;

  verificationStatus: RuleVerificationStatus;

  format: CompetitionFormatRules;

  substitutions: SubstitutionRules;

  discipline: DisciplinaryRules;

  technology: MatchTechnologyRules;

  modifiers: CompetitionSimulationModifiers;

  presentation: CompetitionPresentation;
}

export interface CompetitionRuleRegistry {
  definitions: Record<string, CompetitionDefinition>;
  ruleSets: Record<string, CompetitionRuleSet>;
}

export type DisciplinaryEventType =
  | 'YELLOW'
  | 'SECOND_YELLOW_RED'
  | 'STRAIGHT_RED';

export interface DisciplinaryEvent {
  id: string;

  playerId: string;

  competitionId: string;
  seasonLabel: string;

  fixtureId: string;

  round: number;

  matchSequence: number;

  type: DisciplinaryEventType;
}

export interface DisciplinarySuspension {
  id: string;

  sourceEventId: string;

  competitionId: string;
  seasonLabel: string;

  reason:
    | 'YELLOW_THRESHOLD'
    | 'YELLOW_REPEAT_CYCLE'
    | 'YELLOW_ROLLING_WINDOW'
    | 'SECOND_YELLOW_RED'
    | 'STRAIGHT_RED';

  matchesIssued: number;

  matchesRemaining: number;

  issuedAtRound: number;

  servedFixtureIds: string[];

  status:
    | 'ACTIVE'
    | 'SERVED';
}

export interface PlayerCompetitionDisciplinaryState {
  playerId: string;

  competitionId: string;
  seasonLabel: string;

  ruleSetId: string;

  events: DisciplinaryEvent[];

  suspensions: DisciplinarySuspension[];

  processedEventIds: string[];

  triggeredThresholdKeys: string[];
}

export interface DisciplinaryProcessResult {
  state: PlayerCompetitionDisciplinaryState;

  accepted: boolean;

  error?: string;

  newSuspensions: DisciplinarySuspension[];
}

export interface DisciplinarySummary {
  yellowCards: number;
  straightReds: number;
  secondYellowReds: number;
  activeSuspensions: number;
  activeBanMatches: number;
}

export interface SuspensionServiceFixture {
  fixtureId: string;

  competitionId: string;
  seasonLabel: string;
}

export interface SuspensionServiceResult {
  state: PlayerCompetitionDisciplinaryState;

  accepted: boolean;

  error?: string;

  suspensionServedId?: string;
}

export type SubstitutionPhase =
  | 'REGULATION'
  | 'EXTRA_TIME';

export type SubstitutionStoppageType =
  | 'IN_PLAY'
  | 'HALF_TIME';

export interface SubstitutionChange {
  playerOutId: string;
  playerInId: string;
}

export interface SubstitutionRequest {
  id: string;

  fixtureId: string;

  teamId: string;

  competitionId: string;
  seasonLabel: string;

  windowId: string;

  phase: SubstitutionPhase;

  stoppageType: SubstitutionStoppageType;

  changes: SubstitutionChange[];
}

export interface SubstitutionRecord {
  requestId: string;

  windowId: string;

  phase: SubstitutionPhase;

  stoppageType: SubstitutionStoppageType;

  changes: SubstitutionChange[];

  countedAsWindow: boolean;
}

export interface FixtureTeamSubstitutionState {
  fixtureId: string;

  teamId: string;

  competitionId: string;
  seasonLabel: string;

  ruleSetId: string;

  onPitchPlayerIds: string[];

  registeredBenchPlayerIds: string[];

  records: SubstitutionRecord[];

  processedRequestIds: string[];

  usedWindowIds: string[];
}

export interface SubstitutionProcessResult {
  state: FixtureTeamSubstitutionState;

  accepted: boolean;

  error?: string;

  record?: SubstitutionRecord;
}

export interface SubstitutionSummary {
  substitutionsUsed: number;
  windowsUsed: number;
  playersCurrentlyOnPitch: number;
  registeredBenchSize: number;
}

export interface ScheduledCompetitionFixture {
  id: string;

  competitionId: string;
  seasonLabel: string;
  ruleSetId: string;

  round: number;

  homeTeamId: string;
  awayTeamId: string;

  leg: 1 | 2;
}

export interface CompetitionRoundSchedule {
  round: number;

  fixtures: ScheduledCompetitionFixture[];

  byeTeamIds: string[];
}

export interface CompetitionSchedule {
  competitionId: string;
  seasonLabel: string;
  ruleSetId: string;

  formatType:
    | 'SINGLE_ROUND_ROBIN'
    | 'DOUBLE_ROUND_ROBIN';

  participantTeamIds: string[];

  rounds: CompetitionRoundSchedule[];
}

export interface CompetitionScheduleGenerationResult {
  accepted: boolean;

  schedule?: CompetitionSchedule;

  error?: string;
}

export interface CompetitionScheduleValidation {
  valid: boolean;
  errors: string[];
}

