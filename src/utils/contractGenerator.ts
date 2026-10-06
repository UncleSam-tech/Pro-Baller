import { Club, ContractClauses, Player, SquadRole } from '../types/game';

/**
 * Generates a realistic, highly detailed pro footballer contract tailored to club stature and player level
 */
export function generateProContract(club: Club, player: Player, customRole?: SquadRole): ContractClauses {
  const ovr = player.overallRating;
  const tier = club.tier;
  const currentYear = player.currentYear;

  // Determine appropriate squad role
  let squadRole: SquadRole = customRole || 'Squad Rotation';
  if (ovr >= club.reputation - 4) {
    squadRole = 'Crucial First Team';
  } else if (ovr >= club.reputation - 8) {
    squadRole = 'Key Player';
  } else if (ovr >= club.reputation - 12) {
    squadRole = 'First Team Regular';
  } else if (player.age <= 20 && player.potentialRating >= 84) {
    squadRole = 'Future Star';
  }

  // Base Weekly Wage Calculation (GBP)
  // Youth players (16-18) start lower (£800 - £8,000)
  // Mid stars (£25,000 - £90,000)
  // Superstars at Tier 1 (£120,000 - £350,000)
  let baseWage = 2_500;
  if (player.age <= 17) {
    baseWage = Math.max(850, Math.round((ovr - 55) * 220));
  } else if (ovr < 70) {
    baseWage = Math.max(3_000, (ovr - 58) * 650);
  } else if (ovr < 80) {
    baseWage = Math.round(15_000 + (ovr - 70) * 4_500);
  } else if (ovr < 86) {
    baseWage = Math.round(60_000 + (ovr - 80) * 16_000);
  } else if (ovr < 90) {
    baseWage = Math.round(160_000 + (ovr - 86) * 35_000);
  } else {
    // 90+ Galáctico
    baseWage = Math.round(300_000 + (ovr - 90) * 45_000);
  }

  // Tier multiplier
  const tierMultiplier = tier === 1 ? 1.25 : tier === 2 ? 0.85 : tier === 3 ? 0.35 : 0.15;
  const weeklyWage = Math.max(1_200, Math.round(baseWage * tierMultiplier));

  // Contract length
  const contractYears = player.age >= 32 ? 2 : player.age <= 21 ? 5 : 4;

  // Release clause
  let minimumReleaseClause = 0;
  if (club.country === 'Spain') {
    // Mandatory in Spain (La Liga)
    minimumReleaseClause = Math.max(35_000_000, Math.round(player.marketValue * 1.8));
  } else if (tier === 1) {
    minimumReleaseClause = Math.max(60_000_000, Math.round(player.marketValue * 1.6));
  } else {
    minimumReleaseClause = Math.round(player.marketValue * 1.35);
  }

  // Goal & Appearance Bonuses
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const appearanceBonus = Math.round(weeklyWage * 0.12);
  const startingBonus = Math.round(weeklyWage * 0.08);
  const goalBonus = isAttacker ? Math.round(weeklyWage * 0.22) : Math.round(weeklyWage * 0.10);
  const assistBonus = Math.round(weeklyWage * 0.14);
  const cleanSheetBonus = !isAttacker ? Math.round(weeklyWage * 0.18) : Math.round(weeklyWage * 0.05);
  const matchWinBonus = Math.round(weeklyWage * 0.15);

  // Big Trophy & Ballon d'Or Milestones
  const leagueChampionBonus = Math.round(weeklyWage * 25);
  const championsLeagueBonus = Math.round(weeklyWage * 50);
  const goldenBootBonus = Math.round(weeklyWage * 20);
  const ballonDorBonus = Math.max(500_000, Math.round(weeklyWage * 40));
  const signingBonus = Math.round(weeklyWage * (tier === 1 ? 20 : 10));
  const loyaltyBonusAnnual = Math.round(weeklyWage * 12);

  // Agent Fee (typically 5% - 8%)
  const agentFeePercent = player.staff.agentTier === 'super_agent' ? 10 : 
                         player.staff.agentTier === 'elite' ? 8 : 
                         player.staff.agentTier === 'registered' ? 6 : 5;

  const agentNames: Record<string, { agent: string; agency: string }> = {
    super_agent: { agent: 'Jorge Mendes Jr.', agency: 'Polaris Elite Sports' },
    elite: { agent: 'Jonathan Barnett', agency: 'Stellar Sports Global' },
    registered: { agent: 'Marcus Sterling (FA Licensed)', agency: 'Aces & Athletes' },
    family: { agent: `${player.lastName} Senior (Family)`, agency: 'Family Representation' },
  };

  const agentInfo = agentNames[player.staff.agentTier] || agentNames.registered;

  return {
    weeklyWage,
    contractYears,
    startYear: currentYear,
    expiryYear: currentYear + contractYears,
    squadRole,
    clubOptionOneYear: tier <= 2,
    playerOptionOneYear: false,
    wageIncreasePerYearPercent: 5,
    wageDropOnRelegationPercent: tier >= 2 ? 30 : 20,
    appearanceBonus,
    startingBonus,
    goalBonus,
    assistBonus,
    cleanSheetBonus,
    matchWinBonus,
    leagueChampionBonus,
    championsLeagueBonus,
    goldenBootBonus,
    ballonDorBonus,
    ballonDorWageBumpPercent: 20,
    internationalCapBonus: Math.round(weeklyWage * 0.08),
    minimumReleaseClause,
    championsLeagueReleaseClause: Math.round(minimumReleaseClause * 0.7),
    relegationReleaseClause: Math.round(minimumReleaseClause * 0.4),
    signingBonus,
    loyaltyBonusAnnual,
    playerImageRightsPercent: tier === 1 && ovr >= 85 ? 80 : 100,
    bootSponsorshipExclusivity: false,
    agentFeePercent,
    agentName: agentInfo.agent,
    agencyName: agentInfo.agency,
  };
}

/**
 * Evaluates a counter-offer proposal submitted during contract negotiations
 */
export function evaluateCounterOffer(
  club: Club,
  player: Player,
  original: ContractClauses,
  proposal: ContractClauses,
  currentPatience: number
): {
  outcome: 'ACCEPTED' | 'COUNTERED' | 'REJECTED_WALKOUT';
  newPatience: number;
  message: string;
  revisedOffer?: ContractClauses;
} {
  const wageDiffPercent = ((proposal.weeklyWage - original.weeklyWage) / original.weeklyWage) * 100;
  const signingDiffPercent = ((proposal.signingBonus - original.signingBonus) / (original.signingBonus || 1)) * 100;
  const isReleaseClauseTooLow = proposal.minimumReleaseClause > 0 && proposal.minimumReleaseClause < original.minimumReleaseClause * 0.65;

  let patiencePenalty = 0;
  if (wageDiffPercent > 40) patiencePenalty += 35;
  else if (wageDiffPercent > 20) patiencePenalty += 20;
  else if (wageDiffPercent > 10) patiencePenalty += 10;

  if (signingDiffPercent > 50) patiencePenalty += 15;
  if (isReleaseClauseTooLow) patiencePenalty += 20;

  const newPatience = Math.max(0, currentPatience - patiencePenalty);

  if (newPatience <= 0) {
    return {
      outcome: 'REJECTED_WALKOUT',
      newPatience: 0,
      message: `${club.name}'s Sporting Director stands up and closes the folder. "Your demands show total disrespect to our wage hierarchy. Negotiations are officially terminated."`,
    };
  }

  // Club agrees if demands are reasonable (within 12% wage rise, reasonable release clause)
  if (wageDiffPercent <= 12 && signingDiffPercent <= 20 && !isReleaseClauseTooLow) {
    return {
      outcome: 'ACCEPTED',
      newPatience,
      message: `${club.name} agreed to your proposed terms! The Sporting Director prepares the signature line.`,
    };
  }

  // Otherwise club counters in the middle
  const revisedWage = Math.round(original.weeklyWage + (proposal.weeklyWage - original.weeklyWage) * 0.45);
  const revisedSigning = Math.round(original.signingBonus + (proposal.signingBonus - original.signingBonus) * 0.4);
  const revisedOffer: ContractClauses = {
    ...proposal,
    weeklyWage: revisedWage,
    signingBonus: revisedSigning,
    minimumReleaseClause: Math.max(original.minimumReleaseClause * 0.85, proposal.minimumReleaseClause),
  };

  return {
    outcome: 'COUNTERED',
    newPatience,
    message: `${club.name} pushed back on your demands but is willing to meet halfway at £${revisedWage.toLocaleString()}/wk. Take it or leave it.`,
    revisedOffer,
  };
}
