import { Club, NewsArticle, Player } from '../types/game';

/**
 * Generates an authentic real-time football news aggregator feed
 * including transfer rumors, pundit reactions, contract leaks, and FIFA bureaucracy.
 */
export function generateNewsFeed(player: Player, club: Club): NewsArticle[] {
  const currentWeek = player.currentWeek;
  const ovr = player.overallRating;
  const isHighProfile = ovr >= 78;
  const isNigerian = player.nationality === 'Nigeria';

  const articles: NewsArticle[] = [
    // 1. Fabrizio Romano Exclusive
    {
      id: `fabrizio_${currentWeek}_1`,
      headline: `🚨 EXCLUSIVE: ${player.firstName} ${player.lastName} situation monitored by top European scouts`,
      source: 'Fabrizio Romano',
      author: '@FabrizioRomano · Official',
      category: 'TRANSFER',
      snippet: `Understand several Champions League clubs sent senior scouts to watch ${player.firstName} ${player.lastName} (${player.age}) in action for ${club.name}. Release clause situation is being closely examined by agents. Here we go details soon!`,
      timestamp: '12m ago',
      likes: 34_820,
      reposts: 5_140,
      badge: 'HERE WE GO',
      verified: true,
    },

    // 2. The Athletic Tactical Breakdown
    {
      id: `athletic_${currentWeek}_2`,
      headline: `Tactical Analysis: How ${club.managerName} built ${club.name}'s transition game around ${player.lastName}`,
      source: 'The Athletic UK',
      author: 'Michael Cox & Amy Lawrence',
      category: 'MATCH',
      snippet: `The ${player.archetype} role has transformed ${club.shortName}'s attacking metrics. With ${player.seasonStats.goals} goals and ${player.seasonStats.assists} assists this season, ${player.lastName}'s movement between lines is outperforming expected metrics.`,
      timestamp: '1h ago',
      likes: 8_490,
      reposts: 1_220,
      badge: 'DEEP DIVE',
      verified: true,
    },

    // 3. Contract & Financial Leak
    {
      id: `sky_contract_${currentWeek}_3`,
      headline: `Boardroom Briefing: ${club.name} preparing lucrative new contract package for ${player.lastName}`,
      source: 'Sky Sports News',
      author: 'Kaveh Solhekol',
      category: 'CONTRACT',
      snippet: `Sources close to ${club.name}'s sporting director confirm an improved wage offer with performance bonuses and an elevated buyout clause is being drafted to ward off European suitors. Current weekly wage: £${player.currentContract.weeklyWage.toLocaleString()}.`,
      timestamp: '3h ago',
      likes: 12_400,
      reposts: 2_310,
      badge: 'CONTRACT WATCH',
      verified: true,
    },

    // 4. Gary Neville & Jamie Carragher Debate
    {
      id: `monday_night_${currentWeek}_4`,
      headline: `"He has that generational edge" — Gary Neville & Jamie Carragher clash over ${player.lastName}'s ceiling`,
      source: 'Sky Sports Football',
      author: 'Monday Night Football',
      category: 'MATCH',
      snippet: `Carragher: "He has the raw acceleration, but does he have the discipline for 50 games a year at the pinnacle?" Neville: "Look at the hunger in his game — he reminds me of a young Wayne Rooney coming through."`,
      timestamp: '5h ago',
      likes: 19_230,
      reposts: 3_890,
      badge: 'MNF DEBATE',
      verified: true,
    },

    // 5. Immigration & Bureaucracy Wire
    {
      id: `fifa_visa_${currentWeek}_5`,
      headline: `Home Office & FIFA Article 19: Work permit compliance tightened for international wonderkids`,
      source: 'BBC Sport',
      author: 'David Ornstein',
      category: 'INTERNATIONAL',
      snippet: `Under updated Governing Body Endorsement (GBE) criteria, players must meet stringent international cap percentages or ESC elite talent quota slots. ${player.travelPapers.hasWorkPermit ? 'Clearance officially ratified.' : 'Paperwork actively pending at consular offices.'}`,
      timestamp: '8h ago',
      likes: 5_810,
      reposts: 740,
      badge: 'IMMIGRATION',
      verified: true,
    },

    // 6. Community & Lifestyle Feature
    {
      id: `lifestyle_${currentWeek}_6`,
      headline: `${player.lastName}'s roots: Inside the sacrifice and family devotion behind the rising star`,
      source: "L'Équipe Magazine",
      author: 'Florent Torchut',
      category: 'LIFESTYLE',
      snippet: `From ${player.person?.hometown || 'humble roots'} to European floodlights. How monthly remittances, family support, and relentless grassroots dedication shaped one of football's most grounded young talents.`,
      timestamp: '14h ago',
      likes: 14_900,
      reposts: 2_600,
      badge: 'HUMAN INTEREST',
      verified: true,
    },

    // 7. International Allegiance Watch
    {
      id: `nat_team_${currentWeek}_7`,
      headline: `${player.dualNationality.primaryCountry} or ${player.dualNationality.secondaryCountry || 'Abroad'}? The battle for ${player.lastName}'s international future`,
      source: 'Marca Global',
      author: 'Guillem Balague',
      category: 'INTERNATIONAL',
      snippet: `National federations are stepping up behind-the-scenes discussions to commit the prodigy. Under FIFA Article 7 statutes, senior competitive caps will permanently lock allegiance.`,
      timestamp: '1d ago',
      likes: 22_150,
      reposts: 4_300,
      badge: 'FIFA WATCH',
      verified: true,
    },
  ];

  return articles;
}
