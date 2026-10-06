export interface LeagueRuleSet {
  leagueName: string;
  shortName: string;
  country: string;
  tier: number;
  maxSubs: number;
  maxSubWindows: number; // in-play stoppage windows (half-time does not count as a window)
  benchSize: number;
  varEnabled: boolean;
  matchBall: string;
  leagueColor: string;
  reputationMultiplier: number;
  // Card accumulation & suspension rules
  yellowCardSuspensionThreshold: number; // e.g. 5 yellows = 1 match ban in EPL/LaLiga; 3 in NPFL
  secondaryYellowThreshold: number; // e.g. 10 yellows = 2 match ban in EPL
  yellowAccumulationCutoffWeek: number; // e.g. Gameweek 19 for 5-card amnesty in EPL
  straightRedMatches: number; // 3 matches for violent conduct
  secondYellowRedMatches: number; // 1 match
  cardDisciplinaryFineGBP: number; // Official league fine deducted from player wages
  suspensionPolicyName: string;
  suspensionSummary: string;
}

export const LEAGUE_RULE_SETS: Record<string, LeagueRuleSet> = {
  'Premier League': {
    leagueName: 'Premier League',
    shortName: 'EPL',
    country: 'England',
    tier: 1,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Nike Flight Hi-Vis Premier League',
    leagueColor: '#3D195B',
    reputationMultiplier: 1.0,
    yellowCardSuspensionThreshold: 5,
    secondaryYellowThreshold: 10,
    yellowAccumulationCutoffWeek: 19,
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 2_500,
    suspensionPolicyName: 'FA Premier League Disciplinary Protocol (Section 12)',
    suspensionSummary: '5 yellow cards received before Gameweek 19 result in an automatic 1-match suspension. 10 yellow cards before Gameweek 32 result in a 2-match suspension.',
  },
  'La Liga': {
    leagueName: 'La Liga',
    shortName: 'LL',
    country: 'Spain',
    tier: 1,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Puma Orbita La Liga EA Sports',
    leagueColor: '#EE1222',
    reputationMultiplier: 0.98,
    yellowCardSuspensionThreshold: 5,
    secondaryYellowThreshold: 10,
    yellowAccumulationCutoffWeek: 38, // Every 5 yellows cycle
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 1_800,
    suspensionPolicyName: 'RFEF Competición Ciclo de Amonestaciones',
    suspensionSummary: 'Every cycle of 5 yellow cards accumulated results in an automatic 1-match domestic ban (Ciclo de 5 Tarjetas).',
  },
  'Serie A': {
    leagueName: 'Serie A',
    shortName: 'SA',
    country: 'Italy',
    tier: 1,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 15,
    varEnabled: true,
    matchBall: 'Puma Orbita Serie A Enilive',
    leagueColor: '#008FD7',
    reputationMultiplier: 0.95,
    yellowCardSuspensionThreshold: 5,
    secondaryYellowThreshold: 9,
    yellowAccumulationCutoffWeek: 38,
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 2_000,
    suspensionPolicyName: 'FIGC Giudice Sportivo Disciplinary Code',
    suspensionSummary: '1st suspension after 5 yellow cards (1 match). Subsequent bans decrease in threshold: 4 cards (9th total), 3 cards (12th total).',
  },
  'Bundesliga': {
    leagueName: 'Bundesliga',
    shortName: 'BL',
    country: 'Germany',
    tier: 1,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Derbystar Bundesliga Brillant APS',
    leagueColor: '#D10214',
    reputationMultiplier: 0.96,
    yellowCardSuspensionThreshold: 5,
    secondaryYellowThreshold: 10,
    yellowAccumulationCutoffWeek: 34,
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 2_200,
    suspensionPolicyName: 'DFB Gelbsperre Accumulation Standard',
    suspensionSummary: '5th yellow card triggers a mandatory 1-match Gelbsperre ban. Subsequent 5 cards (10th, 15th) each trigger 1-match bans.',
  },
  'Nigeria Premier Football League (NPFL)': {
    leagueName: 'Nigeria Premier Football League (NPFL)',
    shortName: 'NPFL',
    country: 'Nigeria',
    tier: 4,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: false,
    matchBall: 'NPFL Official Select Matchball',
    leagueColor: '#008751',
    reputationMultiplier: 0.65,
    yellowCardSuspensionThreshold: 3,
    secondaryYellowThreshold: 6,
    yellowAccumulationCutoffWeek: 38,
    straightRedMatches: 2,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 500,
    suspensionPolicyName: 'NPFL / NFF Disciplinary Committee Rulebook Section B',
    suspensionSummary: '3 yellow cards accumulated result in an immediate 1-match domestic NPFL league suspension. Second yellow card in a match earns an automatic 1-match ban.',
  },
  'Brasileirão': {
    leagueName: 'Brasileirão',
    shortName: 'BRA',
    country: 'Brazil',
    tier: 2,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 12,
    varEnabled: true,
    matchBall: 'Penalty S11 Ecoknit Série A',
    leagueColor: '#FEDF00',
    reputationMultiplier: 0.82,
    yellowCardSuspensionThreshold: 3,
    secondaryYellowThreshold: 6,
    yellowAccumulationCutoffWeek: 38,
    straightRedMatches: 2,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 1_000,
    suspensionPolicyName: 'CBF STJD Regulamento Geral de Competições',
    suspensionSummary: '3 yellow cards triggers an automatic suspension for the following round of the Campeonato Brasileiro Série A.',
  },
  'Ligue 1': {
    leagueName: 'Ligue 1',
    shortName: 'L1',
    country: 'France',
    tier: 1,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: true,
    matchBall: 'Kipsta Ligue 1 McDonald\'s Pro',
    leagueColor: '#091C3E',
    reputationMultiplier: 0.92,
    yellowCardSuspensionThreshold: 3,
    secondaryYellowThreshold: 6,
    yellowAccumulationCutoffWeek: 34,
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 1_700,
    suspensionPolicyName: 'LFP Commission de Discipline',
    suspensionSummary: '3 yellow cards received in a 10-match rolling window results in a 1-match ban effective the following Tuesday midnight.',
  },
  'Championship': {
    leagueName: 'Championship',
    shortName: 'EFL',
    country: 'England',
    tier: 2,
    maxSubs: 5,
    maxSubWindows: 3,
    benchSize: 9,
    varEnabled: false,
    matchBall: 'Puma Orbita EFL Official Match Ball',
    leagueColor: '#1A2B4C',
    reputationMultiplier: 0.85,
    yellowCardSuspensionThreshold: 5,
    secondaryYellowThreshold: 10,
    yellowAccumulationCutoffWeek: 19,
    straightRedMatches: 3,
    secondYellowRedMatches: 1,
    cardDisciplinaryFineGBP: 1_200,
    suspensionPolicyName: 'EFL Disciplinary Standard',
    suspensionSummary: '5 yellow cards before Gameweek 19 triggers 1-match ban; 10 yellow cards before Gameweek 37 triggers 2-match ban.',
  },
};

/**
 * Returns the LeagueRuleSet for the provided league name, or defaults to Premier League
 */
export function getLeagueRuleSet(leagueName?: string): LeagueRuleSet {
  if (!leagueName) return LEAGUE_RULE_SETS['Premier League'];
  
  if (LEAGUE_RULE_SETS[leagueName]) {
    return LEAGUE_RULE_SETS[leagueName];
  }

  // Fuzzy match fallback
  const normalized = leagueName.toLowerCase();
  for (const [key, rule] of Object.entries(LEAGUE_RULE_SETS)) {
    if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
      return rule;
    }
  }

  if (normalized.includes('lagos') || normalized.includes('nigeria') || normalized.includes('npfl')) {
    return LEAGUE_RULE_SETS['Nigeria Premier Football League (NPFL)'];
  }
  if (normalized.includes('brazil') || normalized.includes('brasileir')) {
    return LEAGUE_RULE_SETS['Brasileirão'];
  }
  if (normalized.includes('spain') || normalized.includes('madrid') || normalized.includes('barcelona')) {
    return LEAGUE_RULE_SETS['La Liga'];
  }

  return LEAGUE_RULE_SETS['Premier League'];
}

/**
 * Evaluates whether player's card accumulation results in an automatic suspension for upcoming fixtures
 */
export function calculateCardSuspension(
  ruleSet: LeagueRuleSet,
  yellowCardsSeason: number,
  redCardsSeason: number,
  currentWeek: number
): {
  isSuspended: boolean;
  matchesBan: number;
  reason: string;
  nearSuspensionWarning: boolean;
} {
  // Check red cards first
  if (redCardsSeason > 0) {
    return {
      isSuspended: true,
      matchesBan: ruleSet.straightRedMatches,
      reason: `Direct Red Card dismissal under ${ruleSet.suspensionPolicyName}. Mandatory ${ruleSet.straightRedMatches}-match domestic suspension.`,
      nearSuspensionWarning: false,
    };
  }

  // Yellow card accumulation checks
  const threshold = ruleSet.yellowCardSuspensionThreshold;
  const secondary = ruleSet.secondaryYellowThreshold;

  // Secondary threshold check (e.g. 10 yellows)
  if (yellowCardsSeason >= secondary) {
    return {
      isSuspended: true,
      matchesBan: 2,
      reason: `Accumulated ${yellowCardsSeason} yellow cards this season. Surpassed secondary limit (${secondary} cards), triggering a 2-match ban.`,
      nearSuspensionWarning: false,
    };
  }

  // Primary threshold check (e.g. 5 yellows before cutoff, or 3 yellows in NPFL)
  if (yellowCardsSeason >= threshold) {
    const isBeforeCutoff = currentWeek <= ruleSet.yellowAccumulationCutoffWeek;
    if (isBeforeCutoff || ruleSet.yellowAccumulationCutoffWeek >= 34) {
      return {
        isSuspended: true,
        matchesBan: 1,
        reason: `Accumulated ${yellowCardsSeason} yellow cards (${threshold}-card limit). 1-match suspension under ${ruleSet.suspensionPolicyName}.`,
        nearSuspensionWarning: false,
      };
    }
  }

  // Warning if 1 card away from suspension threshold
  const nearWarning = (yellowCardsSeason === threshold - 1) || (yellowCardsSeason === secondary - 1);

  return {
    isSuspended: false,
    matchesBan: 0,
    reason: 'Good standing. Not currently suspended.',
    nearSuspensionWarning: nearWarning,
  };
}

/**
 * Validates whether a club is legally permitted to make a substitution according to league substitution windows
 */
export function validateSubstitution(
  ruleSet: LeagueRuleSet,
  subsUsed: number,
  windowsUsed: number,
  isHalfTime: boolean
): {
  canSubstitute: boolean;
  errorReason?: string;
} {
  if (subsUsed >= ruleSet.maxSubs) {
    return {
      canSubstitute: false,
      errorReason: `Maximum substitution limit reached (${ruleSet.maxSubs} substitutions permitted in ${ruleSet.shortName}).`,
    };
  }

  // Half-time does not consume an in-play stoppage window
  if (!isHalfTime && windowsUsed >= ruleSet.maxSubWindows) {
    return {
      canSubstitute: false,
      errorReason: `All ${ruleSet.maxSubWindows} in-play substitution stoppage windows have been exhausted. No further stoppages permitted.`,
    };
  }

  return {
    canSubstitute: true,
  };
}

/**
 * Summary badge for player's disciplinary card meter
 */
export function getLeagueDisciplinaryStatus(
  ruleSet: LeagueRuleSet,
  yellowCardsSeason: number,
  currentWeek: number
): {
  cardsCount: number;
  cardsUntilBan: number;
  statusBadge: string;
  severity: 'safe' | 'warning' | 'danger' | 'suspended';
} {
  const threshold = yellowCardsSeason >= ruleSet.yellowCardSuspensionThreshold && ruleSet.secondaryYellowThreshold > ruleSet.yellowCardSuspensionThreshold
    ? ruleSet.secondaryYellowThreshold
    : ruleSet.yellowCardSuspensionThreshold;

  const remaining = Math.max(0, threshold - yellowCardsSeason);

  if (yellowCardsSeason >= threshold) {
    return {
      cardsCount: yellowCardsSeason,
      cardsUntilBan: 0,
      statusBadge: `Suspended (${yellowCardsSeason} Yellows)`,
      severity: 'suspended',
    };
  }

  if (remaining === 1) {
    return {
      cardsCount: yellowCardsSeason,
      cardsUntilBan: 1,
      statusBadge: `Disciplinary Tightrope: 1 Card from ${ruleSet.shortName} Ban`,
      severity: 'danger',
    };
  }

  if (remaining === 2) {
    return {
      cardsCount: yellowCardsSeason,
      cardsUntilBan: 2,
      statusBadge: `Caution: ${yellowCardsSeason}/${threshold} Yellow Cards`,
      severity: 'warning',
    };
  }

  return {
    cardsCount: yellowCardsSeason,
    cardsUntilBan: remaining,
    statusBadge: `Clean Discipline: ${yellowCardsSeason}/${threshold} Yellows`,
    severity: 'safe',
  };
}
