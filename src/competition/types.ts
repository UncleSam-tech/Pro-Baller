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

export type StandingsTieBreaker =
  | 'GOAL_DIFFERENCE'
  | 'GOALS_FOR'
  | 'HEAD_TO_HEAD_POINTS'
  | 'HEAD_TO_HEAD_GOAL_DIFFERENCE'
  | 'HEAD_TO_HEAD_GOALS_FOR'
  | 'WINS'
  | 'TEAM_ID';

export interface CompetitionStandingsRules {
  pointsForWin: number;
  pointsForDraw: number;
  pointsForLoss: number;

  tieBreakers: StandingsTieBreaker[];
}

export type PlayoffQualificationRule =
  | {
      mode: 'NONE';
    }
  | {
      mode: 'POSITIONS';
      positions: number[];
    }
  | {
      mode: 'UNCONFIGURED';
    };

export interface CompetitionSeasonOutcomeRules {
  championPosition: number;

  directPromotionPositions: number[];

  promotionPlayoff: PlayoffQualificationRule;

  directRelegationPositions: number[];

  relegationPlayoff: PlayoffQualificationRule;
}

export interface CompetitionFormatRules {
  type: CompetitionFormatType;

  expectedClubCount?: number;

  rounds?: number;

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

  standings?: CompetitionStandingsRules;

  seasonOutcomes?: CompetitionSeasonOutcomeRules;

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

export interface CompetitionFixtureResult {
  fixtureId: string;

  competitionId: string;
  seasonLabel: string;
  ruleSetId: string;

  round: number;

  homeTeamId: string;
  awayTeamId: string;

  homeGoals: number;
  awayGoals: number;
}

export interface CompetitionSeasonState {
  competitionId: string;
  seasonLabel: string;
  ruleSetId: string;

  schedule: CompetitionSchedule;

  results: CompetitionFixtureResult[];
}

export interface CompetitionResultProcessResult {
  state: CompetitionSeasonState;

  accepted: boolean;

  error?: string;
}

export interface CompetitionStandingsRow {
  position: number;

  teamId: string;

  played: number;
  won: number;
  drawn: number;
  lost: number;

  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;

  points: number;
}

export interface CompetitionStandingsResult {
  accepted: boolean;
  standings?: CompetitionStandingsRow[];
  error?: string;
}

export interface CompetitionSeasonStateValidation {
  valid: boolean;
  errors: string[];
}

export type CompetitionSeasonOutcomeTag =
  | 'CHAMPION'
  | 'DIRECT_PROMOTION'
  | 'PROMOTION_PLAYOFF_QUALIFIER'
  | 'DIRECT_RELEGATION'
  | 'RELEGATION_PLAYOFF_QUALIFIER';

export interface CompetitionTeamSeasonOutcome {
  teamId: string;

  finalPosition: number;

  tags: CompetitionSeasonOutcomeTag[];
}

export interface CompetitionSeasonOutcomeEvaluation {
  competitionId: string;
  seasonLabel: string;
  ruleSetId: string;

  championTeamId: string;

  teamOutcomes: CompetitionTeamSeasonOutcome[];
}

export interface CompetitionSeasonOutcomeResult {
  accepted: boolean;

  evaluation?: CompetitionSeasonOutcomeEvaluation;

  error?: string;
}

export type CompetitionMovementType =
  | 'PROMOTION'
  | 'RELEGATION';

export interface CompetitionMovementRelationship {
  id: string;

  countryId: string;

  sourceCompetitionId: string;

  destinationCompetitionId: string;

  movementType: CompetitionMovementType;
}

export interface CompetitionHierarchyRegistry {
  relationships: Record<string, CompetitionMovementRelationship>;
}

export interface CompetitionMovementLookupResult {
  accepted: boolean;

  relationship?: CompetitionMovementRelationship;

  error?: string;
}

export interface CompetitionHierarchyValidation {
  valid: boolean;
  errors: string[];
}
