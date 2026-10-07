import { InjuryDetail } from './injury';
import { CurrencyCode } from '../utils/currency';

export type Position = 
  | 'ST'  // Striker
  | 'LW'  // Left Winger
  | 'RW'  // Right Winger
  | 'CAM' // Attacking Midfielder
  | 'CM'  // Central Midfielder
  | 'CDM' // Defensive Midfielder
  | 'LB'  // Left Back
  | 'RB'  // Right Back
  | 'CB'  // Center Back
  | 'GK'; // Goalkeeper

export type PlayerArchetype = 
  | 'Poacher' 
  | 'Playmaker' 
  | 'Speed Demon' 
  | 'Box-to-Box Engine' 
  | 'Target Man' 
  | 'Set Piece Specialist' 
  | 'Pressing Forward'
  | 'Deep-Lying Maestro';

export type PlayerOrigin = 
  | 'academy_prodigy'     // Premier Category 1 Youth Academy
  | 'street_cage_talent'   // Street football / late discovery
  | 'south_american_gem'  // South American wonderkid scouted young
  | 'lower_league_grinder' // Grassroots humble non-league starter

export interface PlayerAttributes {
  // Physical
  pace: number;
  acceleration: number;
  stamina: number;
  strength: number;
  agility: number;
  jumping: number;

  // Technical
  finishing: number;
  dribbling: number;
  ballControl: number;
  shortPassing: number;
  longPassing: number;
  crossing: number;
  tackling: number;
  shotPower: number;
  curve: number;
  penalties: number;

  // Mental
  composure: number;
  vision: number;
  positioning: number;
  workRate: number;
  leadership: number;
  flair: number;
}

export type SquadRole = 
  | 'Crucial First Team' 
  | 'Key Player' 
  | 'First Team Regular' 
  | 'Squad Rotation' 
  | 'Future Star' 
  | 'Backup / Reserve';

export type LegacyDietOption = 'MEDITERRANEAN' | 'BULKING_MACRO' | 'VEGAN_CLEAN' | 'HOMETOWN_TRADITIONAL';
export type SleepRegime = 'HYPERBARIC_9HR' | 'STRICT_10PM' | 'IRREGULAR_NIGHTOWL';
export type CommunityAction = 'CHILDRENS_HOSPITAL' | 'HOMETOWN_COACHING_CLINIC' | 'FOOD_BANK_DONATION' | 'BRAND_COMMERCIAL_SHOOT' | 'REST_CHILL';

export interface DailyRoutineProfile {
  activeDiet: LegacyDietOption;
  activeSleep: SleepRegime;
  lastCommunityAction?: CommunityAction;
  staminaRegenBonusWeekly: number; // e.g. +5 to +25%
  completedRoutineCount: number;
}

export type PostCareerRole = 
  | 'HEAD_COACH'           // Tactical Manager / Head Coach
  | 'SPORTING_DIRECTOR'    // Club Boardroom Executive & Chief Scout
  | 'TV_PUNDIT'            // Matchday Analyst & Media Broadcaster
  | 'ACADEMY_FOUNDER'      // Grassroots Youth Foundation & Humanitarian
  | 'PLAYER_AGENT'         // Licensed FIFA Agent & Representative
  | 'GLOBAL_ENTREPRENEUR'; // Sports Tech, Real Estate & Brand Mogul

export type LegacyStatusTier = 
  | 'IMMORTAL_LEGEND'     // Pelé, Messi, Ronaldo level
  | 'WORLD_CLASS_ICON'    // Zidane, Henry, Weah level
  | 'CLUB_CULT_HERO'      // Domestic Legend & Fan Favorite
  | 'PRO_VETERAN';        // Respected Long-Serving Professional

export interface PostCareerProfile {
  retiredYear: number;
  retiredAge: number;
  retirementReason: 'AGE_35_PLUS' | 'SEVERE_RECURRING_INJURY' | 'VOLUNTARY_PINNACLE';
  chosenRole: PostCareerRole;
  reputationScore: number; // 0-100
  pensionWeeklyPayout: number;
  legacyStatus: LegacyStatusTier;
  testimonialWinnings: number;
  postCareerLog: string[];
}

export interface ContractClauses {
  // Core Remuneration
  weeklyWage: number;           // e.g. £12,000 / week
  contractYears: number;        // 1 to 5 years
  startYear: number;
  expiryYear: number;
  squadRole: SquadRole;
  
  // Options & Escalation
  clubOptionOneYear: boolean;   // Club can trigger +1 year
  playerOptionOneYear: boolean; // Player can trigger +1 year
  wageIncreasePerYearPercent: number; // e.g. 5% or 10%
  wageDropOnRelegationPercent: number; // e.g. 30% drop if relegated
  
  // Match & Goal Bonuses
  appearanceBonus: number;      // Paid per match played
  startingBonus: number;        // Additional if in starting 11
  goalBonus: number;            // Paid per goal scored
  assistBonus: number;          // Paid per assist delivered
  cleanSheetBonus: number;      // Paid if team keeps clean sheet
  matchWinBonus: number;        // Paid per team victory

  // Honor & Milestone Clauses
  leagueChampionBonus: number;  // Paid if club wins league title
  championsLeagueBonus: number; // Paid if club wins continental cup
  goldenBootBonus: number;      // If player finishes top scorer
  ballonDorBonus: number;       // Major payout if wins Ballon d'Or
  ballonDorWageBumpPercent: number; // e.g. +20% wage rise upon winning Ballon d'Or
  internationalCapBonus: number;// Per senior national team appearance

  // Buy-Out & Release Clauses
  minimumReleaseClause: number; // £0 means none; otherwise buyout fee
  championsLeagueReleaseClause: number; // Cheaper fee if club misses UCL
  relegationReleaseClause: number;      // Low fee triggerable upon relegation

  // Signing-On & Loyalty
  signingBonus: number;         // Upfront signing bonus
  loyaltyBonusAnnual: number;   // Paid at completion of each full season

  // Image & Commercial Rights
  playerImageRightsPercent: number; // 50 to 100%
  bootSponsorshipExclusivity: boolean;

  // Agent Terms
  agentFeePercent: number;      // 5% - 10% paid to player's representative
  agentName: string;
  agencyName: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  league: string;
  tier: 1 | 2 | 3 | 4;
  reputation: number; // 1-100
  transferBudget: number;
  wageBudgetWeekly: number;
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  managerName: string;
  managerPatience: number;
  playstyle: string;
  rivalClubId?: string;
}

export interface SeasonRecord {
  year: number;
  age: number;
  clubId: string;
  clubName: string;
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  avgRating: number;
  trophies: string[];
  leaguePosition: number;
  individualAwards: string[];
  wageEarned: number;
}

export interface SponsorDeal {
  id: string;
  brandName: string;
  category: 'boots' | 'apparel' | 'lifestyle' | 'nutrition' | 'tech';
  weeklyPay: number;
  yearsRemaining: number;
  requirements: string;
  perks: string;
  active: boolean;
}

// Daily Routine: Diet, Sleep, & Community Engagement
export type DietPlanId = 'mediterranean' | 'high_protein' | 'plant_based' | 'personal_chef_custom' | 'fast_food_casual';
export type SleepScheduleId = 'deep_rem_9_5' | 'circadian_8' | 'biphasic_siesta' | 'nightlife_irregular';
export type CommunityEngagementId = 'youth_academy_coaching' | 'children_hospital' | 'charity_remittance' | 'fan_meetup_commercial' | 'quiet_isolation';

export interface DietPlan {
  id: DietPlanId;
  name: string;
  tagline: string;
  weeklyCostGBP: number;
  staminaRegenBonus: number;
  attributeDeltas: {
    stamina?: number;
    strength?: number;
    pace?: number;
    injuryResistance?: number;
  };
  description: string;
}

export interface SleepSchedule {
  id: SleepScheduleId;
  name: string;
  hours: number;
  tagline: string;
  energyRegenWeekly: number;
  matchSharpnessDelta: number;
  moraleDelta: number;
  description: string;
}

export interface CommunityActivity {
  id: CommunityEngagementId;
  name: string;
  tagline: string;
  weeklyHours: number;
  fanReputationDelta: number;
  teamChemistryDelta: number;
  disciplineDelta: number;
  moraleBonus: number;
  energyCost: number;
  description: string;
}

export interface PlayerDailyRoutine {
  dietId: DietPlanId;
  sleepScheduleId: SleepScheduleId;
  communityId: CommunityEngagementId;
  lastUpdatedWeek?: number;
  routineLog?: string[];
}

// Agent Terminal & Representation Types
export type AgencyTier = 'GLOBAL_POWERBROKER' | 'CONTINENTAL_ELITE' | 'BOUTIQUE_DEV' | 'FAMILY_OFFICE';

export interface AgencyRepresentation {
  id: string;
  agentName: string;
  agencyName: string;
  tier: AgencyTier;
  agentFeePercent: number;
  reputation: number;
  influenceRating: number;
  perks: string[];
  signingBonusCost: number;
  description: string;
  dialogueTone: string;
}

export interface AgentMessage {
  id: string;
  sender: 'AGENT' | 'PLAYER';
  text: string;
  timestamp: string;
  type?: 'NORMAL' | 'TRANSFER_OPPORTUNITY' | 'CONTRACT_UPDATE' | 'WARNING' | 'SUCCESS';
}

// Social Feed & Pulse
export interface SocialInteractionOption {
  type: 'APPRECIATE' | 'CLAPBACK' | 'FOCUS' | 'ENDORSE';
  responseLabel: string;
  popularityDelta: number;
  chemistryDelta: number;
  managerTrustDelta: number;
  moneyEarned?: number;
  chosen?: boolean;
}

export interface SocialPost {
  id: string;
  author: {
    name: string;
    handle: string;
    avatarBg: string;
    role: 'FAN' | 'TEAMMATE' | 'JOURNALIST' | 'PUNDIT' | 'BRAND' | 'RIVAL';
    verified: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  reposts: number;
  tag?: string;
  interactions?: SocialInteractionOption[];
}

// Tactical Board & Post-Match Telemetry
export interface HeatmapZone {
  x: number; // 0-100% on pitch
  y: number; // 0-100% on pitch
  intensity: number; // 0.1 - 1.0
  touches: number;
  label?: string;
}

export interface PassingAction {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'SHORT' | 'LONG' | 'KEY_CHANCE' | 'CROSS';
  completed: boolean;
}

export interface TacticalTelemetry {
  matchOpponent: string;
  playerMinutes: number;
  rating: number;
  distanceCoveredKm: number;
  topSprintSpeedKmh: number;
  highIntensitySprints: number;
  passesAttempted: number;
  passesCompleted: number;
  passingAccuracyPct: number;
  keyPasses: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  tacklesWon: number;
  interceptions: number;
  xG: number;
  xA: number;
  shotsOnTarget: number;
  heatmapZones: HeatmapZone[];
  passingMap: PassingAction[];
}

// Scouting Radar & Reports
export interface ScoutReport {
  id: string;
  clubName: string;
  clubLeague: string;
  clubCountry: string;
  clubBadgeColor: string;
  scoutName: string;
  interestGrade: 'A+' | 'A' | 'B+' | 'B' | 'WATCHLIST';
  dateWatched: string;
  projectedFee: number;
  projectedWage: number;
  scoutVerdict: string;
  pros: string[];
  cons: string[];
}

// Brand Ambassador Contracts
export interface BrandAmbassadorDeal {
  id: string;
  brandName: string;
  category: 'SPORTSWEAR' | 'LUXURY_WATCH' | 'GAMING_ESPORTS' | 'HIGH_FASHION' | 'GLOBAL_CHARITY';
  title: string;
  upfrontSigningFee: number;
  annualRetainer: number;
  popularityBoost: number;
  requiredPopularity: number;
  perks: string[];
  active: boolean;
  description: string;
}
export interface LifestyleAssets {
  residence: string;
  car: string;
  charityFounded: boolean;
  personalBrandLevel: number;
  ownedItemIds: string[];
}

export interface PersonalStaff {
  agentTier: 'family' | 'registered' | 'elite' | 'super_agent';
  physioTier: 'none' | 'basic' | 'elite';
  nutritionistTier: 'none' | 'basic' | 'elite';
  prSpecialistTier: 'none' | 'basic' | 'elite';
}

export interface MatchDecisionMoment {
  id: string;
  minute: number;
  situation: string;
  description: string;
  options: {
    label: string;
    description: string;
    requiredAttributes: (keyof PlayerAttributes)[];
    riskTier: 'Safe' | 'Moderate' | 'High Risk High Reward';
    actionType: 'shoot_finesse' | 'shoot_power' | 'chip' | 'pass_through' | 'cross' | 'dribble_cut' | 'tackle' | 'clearance';
  }[];
}

export interface MatchLiveEvent {
  minute: number;
  text: string;
  type: 'goal' | 'assist' | 'chance' | 'tackle' | 'card' | 'sub' | 'moment' | 'commentary';
  isPlayerInvolved?: boolean;
}

export interface MatchSimulationResult {
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  playerMinutes: number;
  playerStarted: boolean;
  playerGoals: number;
  playerAssists: number;
  playerRating: number;
  matchRatingDetail: string;
  events: MatchLiveEvent[];
  playerStaminaLoss: number;
  fanMoraleDelta: number;
  managerTrustDelta: number;
  winningsPaid: number;
  playerYellowCards?: number;
  playerRedCards?: number;
  isSuspendedNextMatch?: boolean;
  suspensionReason?: string;
}

export interface TransferOffer {
  id: string;
  club: Club;
  transferFee: number;
  proposedContract: ContractClauses;
  interestReason: string;
  expiresWeeks: number;
  squadRole: SquadRole;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  nationality: string;
  nationCode: string; // ISO 2-letter or flag
  age: number;
  currentYear: number;
  currentWeek: number; // 1-38 league schedule
  position: Position;
  secondaryPosition?: Position;
  preferredFoot: 'Right' | 'Left' | 'Both';
  heightCm: number;
  weightKg: number;
  jerseyNumber: number;
  archetype: PlayerArchetype;
  origin: PlayerOrigin;
  traits: string[];

  // Core Condition
  overallRating: number;
  potentialRating: number;
  energy: number;       // 0 - 100%
  matchSharpness: number; // 0 - 100%
  morale: number;       // 0 - 100%
  form: number;         // 0 - 10
  injuryWeeks: number;
  injuryName?: string;
  activeInjury: InjuryDetail | null;
  recurringInjuryCount?: number;
  suspensionWeeks?: number;
  suspensionReason?: string;

  // Retirement & Post-Career
  isRetired?: boolean;
  postCareer?: PostCareerProfile;

  // Creation State
  isUserCreated?: boolean;

  // Currency & Location
  preferredCurrency: CurrencyCode;
  taxResidency?: {
    country: string;
    taxAuthority: string;
    taxAuthorityShort: string;
    taxSystemName: string;
    effectiveTaxRate: number;
    systemDescription: string;
    isTaxFreeHaven: boolean;
    totalTaxesPaidCareer: number;
    lastTaxDeductionWeekly: number;
  };

  // Person Behind the Player
  person: {
    hometown: string;
    familyBackground: string;
    familyRelations: number; // 0-100%
    monthlyRemittanceGBP: number; // Remittances sent to family back home
    isCaptain: boolean;
    isViceCaptain: boolean;
    jerseyNumberRequested: number;
    disciplineRating: number; // 0-100%
    nightlifeCurfewViolations: number;
  };

  // Dual Nationality & FIFA Eligibility
  dualNationality: {
    primaryCountry: string;
    primaryCode: string;
    secondaryCountry?: string;
    secondaryCode?: string;
    isDeclaredSenior: boolean;
    declaredSeniorCountry?: string;
    residencyYears?: number; // Accumulated towards secondary passport
    naturalizationProgressPercent?: number;
  };

  // Travel Papers & Bureaucracy
  travelPapers: {
    hasPassport: boolean;
    passportNumber?: string;
    passportExpiryYear: number;
    passportStatus?: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'RENEWING';
    passportRenewalWeeksLeft?: number;
    hasWorkPermit: boolean;
    visaStatus: 'None' | 'Applying' | 'Schengen Athlete' | 'UK GBE Work Permit' | 'Non-EU Quota Approved' | 'Exempt (Domestic Citizen)';
    visaExpiryYear?: number;
    targetVisaCountry?: string;
    gbePointsScore?: number;
    under18FifaClearance: boolean; // FIFA Article 19 international transfer clearance
    tournamentClearanceApproved?: boolean; // Cleared to travel for international championships
    residencyYearsAccumulated?: number; // Years in current country towards naturalization
  };

  // Club & Dynamics
  currentClubId: string;
  managerTrust: number; // 0 - 100%
  teamChemistry: number; // 0 - 100%
  fanReputation: number; // 0 - 100%
  popularity: number;    // 0 - 100% Global Popularity & Fan Following
  squadRole: SquadRole;

  // Scouting, Social & Off-Pitch Endeavors
  socialFeed?: SocialPost[];
  lastMatchTelemetry?: TacticalTelemetry;
  scoutReports?: ScoutReport[];
  brandDeals?: BrandAmbassadorDeal[];
  parentalRelocation?: {
    hasRelocated: boolean;
    originCountry: string;
    currentCountry: string;
    reason: string;
    yearRelocated: number;
    benefitsSummary: string;
  };

  // Attributes
  attributes: PlayerAttributes;

  // Contract & Finances
  currentContract: ContractClauses;
  bankBalance: number;
  totalCareerEarnings: number;
  marketValue: number;

  // Off-pitch & Routine
  dailyRoutine?: PlayerDailyRoutine;
  staff: PersonalStaff;
  sponsors: SponsorDeal[];
  agentTerminalHistory?: AgentMessage[];
  lifestyleAssets: LifestyleAssets;

  // Season Stats (Current)
  seasonStats: {
    appearances: number;
    starts: number;
    goals: number;
    assists: number;
    shotsOnTarget: number;
    keyPasses: number;
    tacklesWon: number;
    cleanSheets: number;
    manOfTheMatch: number;
    yellowCards: number;
    redCards: number;
    avgRating: number;
    ratingsHistory: number[];
  };

  // National Team
  nationalTeamCaps: number;
  nationalTeamGoals: number;
  hasSeniorCallup: boolean;

  // Accolades & Trophies
  careerHistory: SeasonRecord[];
  trophyCabinet: {
    name: string;
    year: number;
    club: string;
    icon: string;
  }[];
  awards: {
    name: string;
    year: number;
    description: string;
  }[];
}

export type FormationType = 
  | '4-3-3 Attacking'
  | '4-2-3-1 Balanced'
  | '3-5-2 Wing-backs'
  | '4-4-2 Diamond'
  | '5-3-2 Park The Bus';

export interface TacticalBriefing {
  formation: FormationType;
  mentality: 'ATTACKING' | 'BALANCED' | 'DEFENSIVE';
  tempo: 'FAST_DIRECT' | 'CONTROLLED' | 'COUNTER_ATTACK';
  pressing: 'HIGH_PRESS' | 'MID_BLOCK' | 'LOW_BLOCK';
  attackModifier: number;
  defenseModifier: number;
  staminaCostModifier: number;
}

export interface TeammateInteraction {
  id: string;
  teammateId: string;
  type: 'BANTER' | 'EXTRA_DRILL' | 'SYNERGY_PACT' | 'CLEAR_THE_AIR';
  timestamp: string;
  summary: string;
}

export interface TeammateRelation {
  id: string;
  name: string;
  position: Position;
  number: number;
  overall: number;
  nationality: string;
  chemistry: number; // 0 - 100%
  relationshipTier: 'BEST_MATE' | 'TRUSTED_ALLY' | 'NEUTRAL' | 'LOCKER_RIVAL';
  synergyBuff?: string;
  lastInteraction?: string;
}

export type PersonalCoachSpecialty = 
  | 'STRIKING_FINISHING'
  | 'SPEED_CONDITIONING'
  | 'MENTAL_COMPOSURE'
  | 'PHYSIO_RECOVERY'
  | 'TACTICAL_ANALYSIS';

export interface PersonalCoach {
  id: string;
  name: string;
  specialty: PersonalCoachSpecialty;
  tier: 'BASIC' | 'SPECIALIST' | 'WORLD_CLASS';
  weeklySalaryGBP: number;
  hired: boolean;
  avatarIcon: string;
  tagline: string;
  attributeBuffs: Partial<Record<keyof PlayerAttributes, number>>;
  specialPerk: string;
  lastSessionWeek?: number;
  coachingQuote: string;
}

export type GameView = 
  | 'MATCH'            // ⚽ Matchday Stage (Tactical Briefing, 3D Stadium, Highlights, Live Match)
  | 'PERSONA'          // 👤 Player HQ (Player Profile, Attributes, Routine)
  | 'TRAINING'         // ⚡ Training Ground (Club Drills)
  | 'TEAMMATES'        // 🤝 Locker Room & Teammates (Chemistry, Banter, 1-on-1 Linkup Drills)
  | 'COACHING'         // 🎯 Personal Coaches & Performance Staff (Hire Finishing, Sprint, Mental Mentors)
  | 'MEDICAL'          // 🏥 Medical Center (Rehab, Specialist Clinic treatments, Recovery)
  | 'CONTRACTS'        // 🏢 Contracts & Boardroom (Negotiations, Wage bumps, Clause talks)
  | 'SCOUTING'         // 🌐 Global Scouting Network (Wonderkids radar, Global Standings)
  | 'TRANSFERS'        // 🔄 Transfer Market (Club Offers, Loans, Transfer requests)
  | 'AGENT'            // 💼 Agent Terminal (Agency representation, Career leaks)
  | 'LIFE_SHOP'        // 🛍️ Pro Shop & Luxury Lifestyle
  | 'MEDIA'            // 🎙️ Media Relations & Brand Ambassador Deals
  | 'CLUB_ROOM';       // 🏟️ Club Management Overview

export interface NewsArticle {
  id: string;
  headline: string;
  source: string;
  author?: string;
  category: 'TRANSFER' | 'MATCH' | 'CONTRACT' | 'LIFESTYLE' | 'INTERNATIONAL';
  snippet: string;
  timestamp: string;
  likes: number;
  reposts: number;
  badge?: string;
  verified?: boolean;
}

