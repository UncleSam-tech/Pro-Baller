export interface LeagueRules {
  leagueName: string;
  shortName: string;
  country: string;
  maxSubs: number;
  subWindows: number;
  benchSize: number;
  varEnabled: boolean;
  matchBall: string;
  leagueColor: string;
  reputationMultiplier: number;
}

export const LEAGUE_RULES_REGISTRY: Record<string, LeagueRules> = {
  'Premier League': {
    leagueName: 'Premier League',
    shortName: 'EPL',
    country: 'England',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Nike Flight Hi-Vis Premier League',
    leagueColor: '#3D195B',
    reputationMultiplier: 1.0,
  },
  'La Liga': {
    leagueName: 'La Liga',
    shortName: 'LL',
    country: 'Spain',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Puma Orbita La Liga EA Sports',
    leagueColor: '#EE1222',
    reputationMultiplier: 0.98,
  },
  'Bundesliga': {
    leagueName: 'Bundesliga',
    shortName: 'BL',
    country: 'Germany',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Derbystar Bundesliga Brillant APS',
    leagueColor: '#D10214',
    reputationMultiplier: 0.96,
  },
  'Serie A': {
    leagueName: 'Serie A',
    shortName: 'SA',
    country: 'Italy',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 15,
    varEnabled: true,
    matchBall: 'Puma Orbita Serie A Enilive',
    leagueColor: '#008FD7',
    reputationMultiplier: 0.95,
  },
  'Ligue 1': {
    leagueName: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Kipsta Ligue 1 McDonald\'s Pro',
    leagueColor: '#091C3E',
    reputationMultiplier: 0.92,
  },
  'Liga Portugal': {
    leagueName: 'Liga Portugal',
    shortName: 'LP',
    country: 'Portugal',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Puma Orbita Liga Portugal Betclic',
    leagueColor: '#002B49',
    reputationMultiplier: 0.88,
  },
  'Eredivisie': {
    leagueName: 'Eredivisie',
    shortName: 'ERE',
    country: 'Netherlands',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Derbystar Eredivisie Brilliant',
    leagueColor: '#001E3D',
    reputationMultiplier: 0.86,
  },
  'Championship': {
    leagueName: 'Championship',
    shortName: 'CHA',
    country: 'England',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: false,
    matchBall: 'Puma Orbita EFL Championship',
    leagueColor: '#001489',
    reputationMultiplier: 0.82,
  },
  'Nigeria Premier Football League (NPFL)': {
    leagueName: 'Nigeria Premier Football League (NPFL)',
    shortName: 'NPFL',
    country: 'Nigeria',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: false,
    matchBall: 'Select NPFL Super Pro Continental',
    leagueColor: '#008751',
    reputationMultiplier: 0.70,
  },
  'Brasileirão': {
    leagueName: 'Brasileirão',
    shortName: 'BRA',
    country: 'Brazil',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 12,
    varEnabled: true,
    matchBall: 'Uhlsport Brasileirão Betano Neo',
    leagueColor: '#FEDF00',
    reputationMultiplier: 0.85,
  },
};

export function getLeagueRules(leagueName: string): LeagueRules {
  if (LEAGUE_RULES_REGISTRY[leagueName]) {
    return LEAGUE_RULES_REGISTRY[leagueName];
  }
  // Default FIFA modern standard
  return {
    leagueName,
    shortName: leagueName.substring(0, 3).toUpperCase(),
    country: 'International',
    maxSubs: 5,
    subWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Adidas Pro Match Official',
    leagueColor: '#1E293B',
    reputationMultiplier: 0.85,
  };
}
