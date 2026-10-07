import type {
  CompetitionCategory,
  CompetitionMovementRelationship,
  CompetitionRuleSet,
} from '../../competition/types';
import type {
  FootballWorldDataPack,
  WorldFootballPosition,
} from '../types';

// ============================================================================
// RAW IMPORT INTERFACES
// ============================================================================

export interface RawWorldCountry {
  id: string;
  name: string;
  code: string;
  confederationId?: string;
}

export type RawSeasonScheduleMode =
  | 'SOURCE_COMPLETE'
  | 'GENERATE_FROM_MEMBERSHIP';

export interface RawWorldCompetition {
  id: string;
  name: string;
  shortName: string;

  countryId?: string;
  confederationId?: string;

  category: CompetitionCategory;

  level?: number;

  scheduleMode?: RawSeasonScheduleMode;
}

export interface RawWorldClub {
  id: string;

  name: string;
  shortName: string;

  countryId: string;

  city?: string;

  latitude?: number;
  longitude?: number;

  competitionId?: string;
}

export interface RawWorldPlayer {
  id: string;

  firstName: string;
  lastName: string;

  dateOfBirth?: string;

  nationalityCountryIds: string[];

  primaryPosition: WorldFootballPosition;

  clubId?: string;
}

export interface RawWorldManager {
  id: string;

  firstName: string;
  lastName: string;

  nationalityCountryIds: string[];

  clubId?: string;
}

export interface RawWorldFixture {
  id: string;

  competitionId: string;

  round: number;

  homeClubId: string;
  awayClubId: string;

  scheduledDate?: string;

  homeGoals?: number;
  awayGoals?: number;
}

export interface RawFootballWorldSnapshot {
  id: string;

  version: number;

  seasonLabel: string;
  snapshotDate: string;

  countries: RawWorldCountry[];

  competitions: RawWorldCompetition[];

  ruleSets: CompetitionRuleSet[];

  movementRelationships: CompetitionMovementRelationship[];

  clubs: RawWorldClub[];

  players: RawWorldPlayer[];

  managers: RawWorldManager[];

  fixtures: RawWorldFixture[];
}

// ============================================================================
// IMPORT RESULT
// ============================================================================

export interface FootballWorldImportResult {
  accepted: boolean;

  pack?: FootballWorldDataPack;

  error?: string;
}
