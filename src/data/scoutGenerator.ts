import { Player, Club, ScoutReport } from '../types/game';

export function generateScoutReports(player: Player, club: Club): ScoutReport[] {
  const reports: ScoutReport[] = [];
  const ovr = player.overallRating;
  const pot = player.potentialRating;
  const marketVal = player.marketValue;

  // 1. Borussia Dortmund - Talent Development Powerhouse
  reports.push({
    id: `scout_bvb_${Date.now()}`,
    clubName: 'Borussia Dortmund',
    clubLeague: 'Bundesliga',
    clubCountry: 'Germany',
    clubBadgeColor: '#fde047',
    scoutName: 'Sven Mislintat (Chief Scout)',
    interestGrade: ovr >= 70 ? 'A+' : 'A',
    dateWatched: `Gameweek ${player.currentWeek}, 2026`,
    projectedFee: Math.round(marketVal * 1.25),
    projectedWage: Math.round(player.currentContract.weeklyWage * 2.2),
    scoutVerdict: `${player.firstName} possesses the rare technical agility and decision speed under intense pressing that suits our high-transition philosophy. Priority summer target with immediate first-team pathways.`,
    pros: [
      'Explosive first touch and line-breaking progressive passes',
      'Tactical intelligence creating half-space mismatches',
      'High ceiling potential (Grade 88+)',
    ],
    cons: [
      'Requires physical conditioning for aggressive Bundesliga shoulder-to-shoulder duels',
    ],
  });

  // 2. Arsenal FC - Modern Tactical System
  reports.push({
    id: `scout_arsenal_${Date.now()}`,
    clubName: 'Arsenal FC',
    clubLeague: 'Premier League',
    clubCountry: 'England',
    clubBadgeColor: '#ef4444',
    scoutName: 'Gilles Grimandi (Senior European Scout)',
    interestGrade: ovr >= 73 ? 'A' : 'B+',
    dateWatched: `Gameweek ${player.currentWeek}, 2026`,
    projectedFee: Math.round(marketVal * 1.4),
    projectedWage: Math.round(player.currentContract.weeklyWage * 2.8),
    scoutVerdict: `Fits the modern inverted tactical mold perfectly. Clean technical discipline, low turnover rate, and immense composure. Tracking contract release clause closely.`,
    pros: [
      'Pinpoint combination play in crowded 18-yard areas',
      'Excellent discipline and work rate off the ball',
    ],
    cons: [
      'UK GBE Work Permit points required if non-EU national',
    ],
  });

  // 3. Real Madrid CF - World Royalty
  reports.push({
    id: `scout_real_${Date.now()}`,
    clubName: 'Real Madrid CF',
    clubLeague: 'La Liga',
    clubCountry: 'Spain',
    clubBadgeColor: '#ffffff',
    scoutName: 'Juni Calafat (Chief International Scout)',
    interestGrade: pot >= 85 ? 'A' : 'B',
    dateWatched: `Gameweek ${player.currentWeek}, 2026`,
    projectedFee: Math.round(marketVal * 1.8),
    projectedWage: Math.round(player.currentContract.weeklyWage * 3.5),
    scoutVerdict: `A player born for the big stage at the Santiago Bernabéu. Has the flair, psychological confidence, and magnetic aura required of a future Galáctico.`,
    pros: [
      'Generational self-belief in decisive 1v1 moments',
      'Global marketing and commercial brand potential',
    ],
    cons: [
      'Intense competition for starting spots in world-class squad',
    ],
  });

  // 4. Brighton & Hove Albion - Data Analytics Vanguard
  reports.push({
    id: `scout_brighton_${Date.now()}`,
    clubName: 'Brighton & Hove Albion',
    clubLeague: 'Premier League',
    clubCountry: 'England',
    clubBadgeColor: '#0284c7',
    scoutName: 'Sam Jewell (Head of Data Recruitment)',
    interestGrade: 'A+',
    dateWatched: `Gameweek ${player.currentWeek}, 2026`,
    projectedFee: Math.round(marketVal * 1.15),
    projectedWage: Math.round(player.currentContract.weeklyWage * 1.8),
    scoutVerdict: `Our proprietary algorithms identify ${player.firstName} as an undervalued statistical standout. High progressive carrying efficiency and superior expected threat (xT) metrics.`,
    pros: [
      'Exceptional statistical value-to-cost ratio',
      'Guaranteed regular Premier League starting minutes',
    ],
    cons: [
      'Mid-tier wage structure compared to Champions League giants',
    ],
  });

  return reports;
}
