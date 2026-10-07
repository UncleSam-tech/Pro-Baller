import type {
  CompetitionDefinition,
  CompetitionFixtureResult,
  CompetitionMovementRelationship,
  CompetitionRuleSet,
  CompetitionSchedule,
  CompetitionSeasonState,
  DomesticLeagueMembershipState,
} from '../competition/types';

// ============================================================================
// PART 1 — FOOTBALL POSITION
// ============================================================================

export type WorldFootballPosition =
  | 'GK'
  | 'DF'
  | 'MF'
  | 'FW'
  | 'RB'
  | 'RWB'
  | 'CB'
  | 'LB'
  | 'LWB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'AM'
  | 'RM'
  | 'LM'
  | 'RW'
  | 'LW'
  | 'CF'
  | 'ST';

// ============================================================================
// PART 2 — COUNTRY DEFINITION
// ============================================================================

export interface WorldCountryDefinition {
  id: string;

  name: string;

  code: string;

  confederationId?: string;
}

// ============================================================================
// PART 3 — CLUB DEFINITION
// ============================================================================

export interface WorldClubDefinition {
  id: string;

  name: string;

  shortName: string;

  countryId: string;

  city?: string;

  latitude?: number;
  longitude?: number;
}

// ============================================================================
// PART 4 — PLAYER DEFINITION
// ============================================================================

export interface WorldPlayerDefinition {
  id: string;

  firstName: string;
  lastName: string;

  dateOfBirth?: string;

  nationalityCountryIds: string[];

  primaryPosition: WorldFootballPosition;
}

// ============================================================================
// PART 5 — MANAGER DEFINITION
// ============================================================================

export interface WorldManagerDefinition {
  id: string;

  firstName: string;
  lastName: string;

  nationalityCountryIds: string[];
}

// ============================================================================
// PART 6 — DOMESTIC MEMBERSHIP SEED
// ============================================================================

export interface WorldDomesticLeagueMembershipSeed {
  countryId: string;

  competitionId: string;

  clubIds: string[];
}

// ============================================================================
// PART 7 — SQUAD SEED
// ============================================================================

export interface WorldClubSquadSeed {
  clubId: string;

  playerIds: string[];
}

// ============================================================================
// PART 8 — MANAGER ASSIGNMENT SEED
// ============================================================================

export interface WorldClubManagerSeed {
  clubId: string;

  managerId: string;
}

// ============================================================================
// PART 8.5 — COMPETITION SEASON & FIXTURE DATE SEEDS
// ============================================================================

export interface WorldFixtureDateSeed {
  fixtureId: string;

  scheduledDate?: string;
}

export interface WorldCompetitionSeasonSeed {
  competitionId: string;

  ruleSetId: string;

  schedule: CompetitionSchedule;

  results: CompetitionFixtureResult[];

  fixtureDates: WorldFixtureDateSeed[];
}

// ============================================================================
// PART 9 — WORLD DATA PACK
// ============================================================================

export interface FootballWorldDataPack {
  id: string;

  version: number;

  seasonLabel: string;

  snapshotDate: string;

  countries: WorldCountryDefinition[];

  competitionDefinitions: CompetitionDefinition[];

  competitionRuleSets: CompetitionRuleSet[];

  competitionMovementRelationships: CompetitionMovementRelationship[];

  clubs: WorldClubDefinition[];

  players: WorldPlayerDefinition[];

  managers: WorldManagerDefinition[];

  domesticLeagueMemberships: WorldDomesticLeagueMembershipSeed[];

  squadAssignments: WorldClubSquadSeed[];

  managerAssignments: WorldClubManagerSeed[];

  competitionSeasons: WorldCompetitionSeasonSeed[];
}

// ============================================================================
// PART 10 — VALIDATION RESULT
// ============================================================================

export interface FootballWorldDataPackValidation {
  valid: boolean;

  errors: string[];
}

// ============================================================================
// PART 11 — RUNTIME WORLD STATE
// ============================================================================

export interface FootballWorldRuntimeState {
  dataPackId: string;
  dataPackVersion: number;

  seasonLabel: string;

  currentDate: string;

  domesticLeagueMembershipStates: DomesticLeagueMembershipState[];

  competitionSeasonStates: CompetitionSeasonState[];

  squadAssignments: WorldClubSquadSeed[];

  managerAssignments: WorldClubManagerSeed[];
}

export interface FootballWorldBootstrapResult {
  accepted: boolean;

  state?: FootballWorldRuntimeState;

  error?: string;
}

// ============================================================================
// PART 12 — WORLD PROGRESSION
// ============================================================================

export interface CompetitionProgressSummary {
  competitionId: string;
  roundSimulated?: number;
  fixturesSimulated: number;
  isComplete: boolean;
}

export interface FootballWorldAdvanceResult {
  accepted: boolean;
  state?: FootballWorldRuntimeState;
  error?: string;
  competitionProgressSummaries?: CompetitionProgressSummary[];
}
