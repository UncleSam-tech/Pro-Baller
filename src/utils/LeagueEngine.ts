import { Club, FormationType, Player } from '../types/game';
import { CLUBS_DATABASE, getClubById } from '../data/clubs';
import { getLeagueRuleSet, LeagueRuleSet, LEAGUE_RULE_SETS } from './LeagueRuleSet';
import { SquadPlayer } from '../data/clubRosters';

export type CompetitionCategory = 
  | 'DOMESTIC_LEAGUE'
  | 'CHAMPIONS_LEAGUE'
  | 'DOMESTIC_CUP'
  | 'CONTINENTAL_SUPER_CUP';

export interface CompetitionRules {
  competitionName: string;
  shortName: string;
  category: CompetitionCategory;
  maxSubs90Min: number;
  extraTimeSubAllowed: boolean; // +1 extra sub in 30 mins extra time
  maxSubWindows: number; // in-play stoppage windows
  benchSize: number;
  varEnabled: boolean;
  extraTimeEnabled: boolean;
  penaltiesEnabled: boolean;
  matchBall: string;
  badgeColor: string;
  reputationMultiplier: number;
  rulesDescription: string;
}

export interface ScheduledFixture {
  week: number;
  competitionName: string;
  competitionCategory: CompetitionCategory;
  homeClubId: string;
  awayClubId: string;
  isHome: boolean;
  opponentClub: Club;
  rules: CompetitionRules;
  headlineNote?: string;
  isDerby?: boolean;
  derbyInfo?: DerbyMatchInfo;
}

export interface DerbyMatchInfo {
  isDerby: boolean;
  derbyName: string;
  rivalryLevel: 'HEATED_LOCAL_DERBY' | 'CLASSIC_NATIONAL_RIVALRY' | 'CONTINENTAL_SHOWDOWN' | 'NONE';
  moraleWinBonus: number;
  reputationWinBonus: number;
  managerTrustWinBonus: number;
  fanMoraleWinBonus: number;
  stakesDescription: string;
}

/**
 * Detects whether a fixture is a heated derby or historic rivalry match,
 * and calculates the emotional stakes, morale modifiers, and fan reputation bonus.
 */
export function getDerbyMatchDetails(homeClub: Club, awayClub: Club): DerbyMatchInfo {
  const isDirectRival = homeClub.rivalClubId === awayClub.id || awayClub.rivalClubId === homeClub.id;
  const isSameCity = homeClub.city.toLowerCase() === awayClub.city.toLowerCase() && homeClub.league === awayClub.league;

  const pairKey = [homeClub.id, awayClub.id].sort().join('_');
  const DERBY_NAMES: Record<string, string> = {
    'arsenal_tottenham': 'North London Derby',
    'barcelona_real_madrid': 'El Clásico',
    'man_city_man_utd': 'Manchester Derby',
    'liverpool_man_utd': 'North-West Derby',
    'arsenal_chelsea': 'London Derby',
    'ac_milan_inter_milan': 'Derby della Madonnina',
    'bayern_munich_dortmund': 'Der Klassiker',
    'marseille_psg': 'Le Classique',
    'enyimba_sporting_lagos': 'Nigeria Metro Clásico',
    'remo_stars_sporting_lagos': 'South-West Derby',
    'atletico_madrid_real_madrid': 'Derbi Madrileño',
    'flamengo_palmeiras': 'Clássico Interestadual',
  };

  const derbyName = DERBY_NAMES[pairKey] || 
    (isDirectRival ? `${homeClub.shortName} vs ${awayClub.shortName} Rivalry Clásico` : 
     isSameCity ? `${homeClub.city} City Derby` : 'Matchday Fixture');

  if (isDirectRival || isSameCity) {
    return {
      isDerby: true,
      derbyName,
      rivalryLevel: isDirectRival ? 'HEATED_LOCAL_DERBY' : 'CLASSIC_NATIONAL_RIVALRY',
      moraleWinBonus: 15,
      reputationWinBonus: 10,
      managerTrustWinBonus: 12,
      fanMoraleWinBonus: 18,
      stakesDescription: `🔥 High-Stakes ${derbyName}: +15% Morale & Fan Surge for victory!`,
    };
  }

  return {
    isDerby: false,
    derbyName,
    rivalryLevel: 'NONE',
    moraleWinBonus: 0,
    reputationWinBonus: 0,
    managerTrustWinBonus: 0,
    fanMoraleWinBonus: 0,
    stakesDescription: 'Standard Competition Fixture',
  };
}

// Special Competition Rule Sets
export const COMPETITION_RULES: Record<string, CompetitionRules> = {
  'UEFA Champions League': {
    competitionName: 'UEFA Champions League',
    shortName: 'UCL',
    category: 'CHAMPIONS_LEAGUE',
    maxSubs90Min: 5,
    extraTimeSubAllowed: true, // 6th substitution in extra time
    maxSubWindows: 3,
    benchSize: 12,
    varEnabled: true,
    extraTimeEnabled: true,
    penaltiesEnabled: true,
    matchBall: 'Adidas UCL Pro Finale Starball',
    badgeColor: '#001438',
    reputationMultiplier: 1.25,
    rulesDescription: 'UEFA Regulations Section 14: 5 substitutions permitted in 90 minutes across 3 in-play windows. A 6th substitution is permitted if match enters Extra Time (12 players on bench).',
  },
  'Domestic Cup': {
    competitionName: 'Domestic FA Cup',
    shortName: 'CUP',
    category: 'DOMESTIC_CUP',
    maxSubs90Min: 5,
    extraTimeSubAllowed: true,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: true,
    extraTimeEnabled: true,
    penaltiesEnabled: true,
    matchBall: 'Mitre Ultimax Pro Cup Edition',
    badgeColor: '#800020',
    reputationMultiplier: 1.05,
    rulesDescription: 'Knockout Cup Standard: 5 substitutions in 90 mins (+1 extra sub in Extra Time). Sudden death penalty shootouts decide deadlocks.',
  },
};

/**
 * Retrieves the competition rules for any competition, defaulting to the club's domestic league rules
 */
export function getCompetitionRules(
  competitionName: string,
  clubLeague?: string
): CompetitionRules {
  if (COMPETITION_RULES[competitionName]) {
    return COMPETITION_RULES[competitionName];
  }

  // Fallback to domestic league rules
  const baseLeague = getLeagueRuleSet(clubLeague || competitionName);
  return {
    competitionName: baseLeague.leagueName,
    shortName: baseLeague.shortName,
    category: 'DOMESTIC_LEAGUE',
    maxSubs90Min: baseLeague.maxSubs,
    extraTimeSubAllowed: false, // Standard league matches end at 90'
    maxSubWindows: baseLeague.maxSubWindows,
    benchSize: baseLeague.benchSize,
    varEnabled: baseLeague.varEnabled,
    extraTimeEnabled: false,
    penaltiesEnabled: false,
    matchBall: baseLeague.matchBall,
    badgeColor: baseLeague.leagueColor,
    reputationMultiplier: baseLeague.reputationMultiplier,
    rulesDescription: `${baseLeague.shortName} League Standard: 5 substitutions across 3 stoppage windows. 9 substitutes on bench. Matches end at 90 minutes.`,
  };
}

/**
 * Validates a matchup against real-world competition constraints.
 * Guarantees that clubs can only play opponents legally allowed in that competition context!
 */
export function validateMatchup(
  homeClub: Club,
  awayClub: Club,
  competitionCategory: CompetitionCategory = 'DOMESTIC_LEAGUE'
): {
  isValid: boolean;
  reason: string;
  recommendedOpponent?: Club;
} {
  // Same club cannot play against itself
  if (homeClub.id === awayClub.id) {
    const validOpponents = CLUBS_DATABASE.filter(c => c.league === homeClub.league && c.id !== homeClub.id);
    return {
      isValid: false,
      reason: 'A club cannot schedule a fixture against itself.',
      recommendedOpponent: validOpponents[0] || CLUBS_DATABASE[1],
    };
  }

  // DOMESTIC LEAGUE: Both teams MUST be from the exact same domestic league division
  if (competitionCategory === 'DOMESTIC_LEAGUE') {
    if (homeClub.league !== awayClub.league) {
      const sameLeagueClubs = CLUBS_DATABASE.filter(c => c.league === homeClub.league && c.id !== homeClub.id);
      return {
        isValid: false,
        reason: `Cross-league domestic matchup invalid. ${homeClub.name} plays in ${homeClub.league}, whereas ${awayClub.name} is in ${awayClub.league}. Only rivals from ${homeClub.league} are permitted.`,
        recommendedOpponent: sameLeagueClubs[0],
      };
    }
  }

  // CHAMPIONS LEAGUE: Only clubs in Tier 1 with European prestige (Reputation >= 75)
  if (competitionCategory === 'CHAMPIONS_LEAGUE') {
    const isHomeEligible = homeClub.tier === 1 && homeClub.reputation >= 70;
    const isAwayEligible = awayClub.tier === 1 && awayClub.reputation >= 70;
    if (!isHomeEligible || !isAwayEligible) {
      const eliteEuroClubs = CLUBS_DATABASE.filter(c => c.tier === 1 && c.reputation >= 82 && c.id !== homeClub.id);
      return {
        isValid: false,
        reason: 'Champions League fixtures require Tier 1 qualified European contenders.',
        recommendedOpponent: eliteEuroClubs[0],
      };
    }
  }

  return {
    isValid: true,
    reason: 'Matchup strictly validated under competition guidelines.',
  };
}

/**
 * Generates an authentic 38-gameweek fixture list for a given club,
 * weaving domestic league games, Champions League midweeks, and cup fixtures!
 */
export function generateSeasonCalendar(club: Club): ScheduledFixture[] {
  const sameLeagueRivals = CLUBS_DATABASE.filter(c => c.league === club.league && c.id !== club.id);
  const eliteUclRivals = CLUBS_DATABASE.filter(c => c.tier === 1 && c.reputation >= 84 && c.id !== club.id);
  
  // Qualifying for UCL requires club tier 1 and high reputation
  const isUclContender = club.tier === 1 && club.reputation >= 78;

  const fixtures: ScheduledFixture[] = [];

  for (let week = 1; week <= 38; week++) {
    // Weeks 6, 12, 18, 24 are European Champions League Nights (for qualified top clubs)
    const isUclWeek = isUclContender && [6, 12, 18, 24].includes(week);
    // Week 16 and 32 are Domestic Cup Knockout Rounds
    const isCupWeek = [16, 32].includes(week);

    if (isUclWeek) {
      const uclOpponent = eliteUclRivals[(week + 2) % eliteUclRivals.length] || sameLeagueRivals[0];
      const isHome = week % 2 === 0;
      const derbyInfo = getDerbyMatchDetails(club, uclOpponent);
      fixtures.push({
        week,
        competitionName: 'UEFA Champions League',
        competitionCategory: 'CHAMPIONS_LEAGUE',
        homeClubId: isHome ? club.id : uclOpponent.id,
        awayClubId: isHome ? uclOpponent.id : club.id,
        isHome,
        opponentClub: uclOpponent,
        rules: COMPETITION_RULES['UEFA Champions League'],
        headlineNote: `⭐ UCL Matchday: Continental heavyweight clash against ${uclOpponent.name}!`,
        isDerby: derbyInfo.isDerby,
        derbyInfo,
      });
    } else if (isCupWeek) {
      const cupOpponent = sameLeagueRivals[(week + 1) % sameLeagueRivals.length];
      const isHome = week % 2 !== 0;
      const derbyInfo = getDerbyMatchDetails(club, cupOpponent);
      fixtures.push({
        week,
        competitionName: 'Domestic Cup',
        competitionCategory: 'DOMESTIC_CUP',
        homeClubId: isHome ? club.id : cupOpponent.id,
        awayClubId: isHome ? cupOpponent.id : club.id,
        isHome,
        opponentClub: cupOpponent,
        rules: COMPETITION_RULES['Domestic Cup'],
        headlineNote: `🏆 Domestic Cup Knockout: Win or go home under sudden-death rules!`,
        isDerby: derbyInfo.isDerby,
        derbyInfo,
      });
    } else {
      // Domestic League Round (Prioritize direct derby rival on Week 2 & Week 20 for excitement!)
      const directRival = sameLeagueRivals.find(r => r.id === club.rivalClubId || r.rivalClubId === club.id);
      const rivalIndex = (week - 1) % sameLeagueRivals.length;
      const opponent = ((week === 2 || week === 20) && directRival)
        ? directRival
        : (sameLeagueRivals[rivalIndex] || sameLeagueRivals[0]);
      const isHome = (week % 2 !== 0);
      const derbyInfo = getDerbyMatchDetails(club, opponent);

      fixtures.push({
        week,
        competitionName: club.league,
        competitionCategory: 'DOMESTIC_LEAGUE',
        homeClubId: isHome ? club.id : opponent.id,
        awayClubId: isHome ? opponent.id : club.id,
        isHome,
        opponentClub: opponent,
        rules: getCompetitionRules(club.league, club.league),
        headlineNote: derbyInfo.isDerby
          ? derbyInfo.stakesDescription
          : `Matchday ${week}: ${club.league} vs ${opponent.name}.`,
        isDerby: derbyInfo.isDerby,
        derbyInfo,
      });
    }
  }

  return fixtures;
}

/**
 * Returns the exact authenticated legal fixture for the current calendar week
 */
export function getCurrentWeekFixture(club: Club, currentWeek: number): ScheduledFixture {
  const calendar = generateSeasonCalendar(club);
  const found = calendar.find(f => f.week === currentWeek);
  return found || calendar[0];
}

/**
 * Enforces substitution rules with competition-tier logic (e.g. UCL extra time 6th sub)
 */
export function validateCompetitionSubstitution(
  rules: CompetitionRules,
  subsUsed: number,
  windowsUsed: number,
  isExtraTime: boolean = false,
  isHalfTime: boolean = false
): {
  canSubstitute: boolean;
  errorReason?: string;
  subsRemaining: number;
} {
  const allowedTotalSubs = isExtraTime && rules.extraTimeSubAllowed
    ? rules.maxSubs90Min + 1
    : rules.maxSubs90Min;

  const subsRemaining = Math.max(0, allowedTotalSubs - subsUsed);

  if (subsUsed >= allowedTotalSubs) {
    return {
      canSubstitute: false,
      errorReason: `Maximum substitution limit reached (${allowedTotalSubs} substitutions permitted in ${rules.shortName}).`,
      subsRemaining: 0,
    };
  }

  // Half-time does not consume an in-play stoppage window
  if (!isHalfTime && windowsUsed >= rules.maxSubWindows && !isExtraTime) {
    return {
      canSubstitute: false,
      errorReason: `All ${rules.maxSubWindows} in-play stoppage windows have been exhausted in regulation time.`,
      subsRemaining,
    };
  }

  return {
    canSubstitute: true,
    subsRemaining,
  };
}

export interface TournamentRosterMapping {
  startingXI: SquadPlayer[];
  bench: SquadPlayer[];
  reserves: SquadPlayer[];
  maxBenchSize: number;
  matchdaySquadSize: number;
  rules: CompetitionRules;
}

/**
 * Maps a club's full squad roster to tournament-specific matchday regulations.
 * (e.g. UCL permits 12 bench substitutes / 23 squad; EPL enforces 9 bench substitutes / 20 squad).
 */
export function mapCompetitionRoster(
  roster: { startingXI: SquadPlayer[]; bench: SquadPlayer[] },
  competitionRules: CompetitionRules
): TournamentRosterMapping {
  const startingXI = roster.startingXI.slice(0, 11);
  const maxBench = competitionRules.benchSize || 9;
  const bench = roster.bench.slice(0, maxBench);
  const reserves = roster.bench.slice(maxBench);

  return {
    startingXI,
    bench,
    reserves,
    maxBenchSize: maxBench,
    matchdaySquadSize: startingXI.length + bench.length,
    rules: competitionRules,
  };
}

/**
 * Validates a fixture against real-world league rules, ensuring that only teams
 * from the same competition can play each other, and strictly enforcing the context.
 */
export function validateFixtureMatchup(
  homeClub: Club,
  awayClub: Club,
  competitionName?: string
): {
  isValid: boolean;
  competitionCategory: CompetitionCategory;
  rules: CompetitionRules;
  reason: string;
  enforcedOpponent: Club;
} {
  const rules = getCompetitionRules(competitionName || homeClub.league, homeClub.league);
  const val = validateMatchup(homeClub, awayClub, rules.category);
  return {
    isValid: val.isValid,
    competitionCategory: rules.category,
    rules,
    reason: val.reason,
    enforcedOpponent: val.isValid ? awayClub : (val.recommendedOpponent || awayClub),
  };
}

/**
 * LEGACY CAREER PRESENTATION LOGIC.
 * Determines the team formation presentation label from club manager name for legacy career MatchView UI.
 *
 * NOTE: Phase 3P managerAI (WorldManagerMatchPlan / resolveWorldManagerProfile) is the authoritative
 * decision engine for living-world simulation fixtures. When career matches are migrated to be owned
 * by the world runtime, MatchView will display the manager decision from WorldManagerMatchPlan rather
 * than independently calculating it here.
 */
export function getManagerMandatedFormation(club: Club): FormationType {
  const manager = club.managerName.toLowerCase();
  if (
    manager.includes('arteta') ||
    manager.includes('guardiola') ||
    manager.includes('enrique') ||
    manager.includes('flick') ||
    manager.includes('kompany')
  ) {
    return '4-3-3 Attacking';
  }
  if (
    manager.includes('inzaghi') ||
    manager.includes('alonso') ||
    manager.includes('amorim') ||
    manager.includes('conte')
  ) {
    return '3-5-2 Wing-backs';
  }
  if (manager.includes('ancelotti')) {
    return '4-4-2 Diamond';
  }
  if (manager.includes('simeone') || manager.includes('mourinho') || manager.includes('dyche')) {
    return '5-3-2 Park The Bus';
  }
  if (
    manager.includes('slot') ||
    manager.includes('maresca') ||
    manager.includes('postecoglou') ||
    manager.includes('emery') ||
    manager.includes('howe')
  ) {
    return '4-2-3-1 Balanced';
  }
  return club.reputation >= 85 ? '4-3-3 Attacking' : '4-2-3-1 Balanced';
}


