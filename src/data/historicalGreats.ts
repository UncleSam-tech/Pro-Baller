export interface HistoricalGreat {
  id: string;
  name: string;
  nickname: string;
  country: string;
  flag: string;
  era: string;
  positions: string;
  careerGoals: number;
  careerAssists: number;
  appearances: number;
  ballonDors: number;
  worldCups: number;
  continentalTitles: number; // Champions League, Copa Libertadores, etc.
  domesticTitles: number;
  goldenBoots: number;
  iconicQuote: string;
  legacySummary: string;
  avatarColor: string;
}

export const HISTORICAL_GREATS: HistoricalGreat[] = [
  {
    id: 'pele',
    name: 'Pelé',
    nickname: 'O Rei (The King)',
    country: 'Brazil',
    flag: '🇧🇷',
    era: '1956 - 1977',
    positions: 'Forward / Inside Left',
    careerGoals: 1279,
    careerAssists: 360,
    appearances: 1363,
    ballonDors: 7, // FIFA Honorary / Retroactive Ballon d'Ors
    worldCups: 3,
    continentalTitles: 2,
    domesticTitles: 6,
    goldenBoots: 11,
    iconicQuote: 'Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.',
    legacySummary: 'The eternal benchmark of football immortality. The only human in history to lift three FIFA World Cups.',
    avatarColor: 'from-amber-600 to-yellow-500',
  },
  {
    id: 'maradona',
    name: 'Diego Maradona',
    nickname: 'El Pibe de Oro',
    country: 'Argentina',
    flag: '🇦🇷',
    era: '1976 - 1997',
    positions: 'Attacking Midfielder / Second Striker',
    careerGoals: 345,
    careerAssists: 240,
    appearances: 679,
    ballonDors: 2, // FIFA Honorary Prix d\'Honneur
    worldCups: 1,
    continentalTitles: 1, // UEFA Cup
    domesticTitles: 3,
    goldenBoots: 6,
    iconicQuote: 'When people succeed, it is because of hard work. Luck has nothing to do with success.',
    legacySummary: 'Carried Argentina to 1986 World Cup triumph in Mexico and brought unfancied Napoli two immortal Serie A Scudetti.',
    avatarColor: 'from-sky-600 to-blue-500',
  },
  {
    id: 'messi',
    name: 'Lionel Messi',
    nickname: 'La Pulga Atómica',
    country: 'Argentina',
    flag: '🇦🇷',
    era: '2004 - Present',
    positions: 'RW / CF / Playmaker',
    careerGoals: 845,
    careerAssists: 378,
    appearances: 1080,
    ballonDors: 8,
    worldCups: 1,
    continentalTitles: 4,
    domesticTitles: 12,
    goldenBoots: 6,
    iconicQuote: 'You have to fight to reach your dream. You have to sacrifice and work hard for it.',
    legacySummary: 'Record 8-time Ballon d\'Or champion, Qatar 2022 World Cup conqueror, and statistical football genius.',
    avatarColor: 'from-cyan-600 to-sky-400',
  },
  {
    id: 'ronaldo',
    name: 'Cristiano Ronaldo',
    nickname: 'CR7',
    country: 'Portugal',
    flag: '🇵🇹',
    era: '2002 - Present',
    positions: 'LW / ST',
    careerGoals: 910,
    careerAssists: 255,
    appearances: 1250,
    ballonDors: 5,
    worldCups: 0,
    continentalTitles: 5,
    domesticTitles: 7,
    goldenBoots: 4,
    iconicQuote: 'Your love makes me strong, your hate makes me unstoppable.',
    legacySummary: 'All-time official top goalscorer in professional football history. Five-time UEFA Champions League champion.',
    avatarColor: 'from-red-600 to-amber-500',
  },
  {
    id: 'zidane',
    name: 'Zinedine Zidane',
    nickname: 'Zizou',
    country: 'France',
    flag: '🇫🇷',
    era: '1989 - 2006',
    positions: 'Attacking Midfielder',
    careerGoals: 156,
    careerAssists: 180,
    appearances: 792,
    ballonDors: 1,
    worldCups: 1,
    continentalTitles: 1,
    domesticTitles: 3,
    goldenBoots: 0,
    iconicQuote: 'I was crying because I had no shoes to play soccer with my friends, but one day I saw a man who had no feet, and I realized how rich I was.',
    legacySummary: 'The definition of big-game poise. Two goals in the 1998 World Cup Final and that immortal Hampden Park volley.',
    avatarColor: 'from-blue-700 to-indigo-600',
  },
  {
    id: 'weah',
    name: 'George Weah',
    nickname: 'King George',
    country: 'Liberia',
    flag: '🇱🇷',
    era: '1985 - 2003',
    positions: 'Striker / Poacher',
    careerGoals: 213,
    careerAssists: 95,
    appearances: 512,
    ballonDors: 1,
    worldCups: 0,
    continentalTitles: 0,
    domesticTitles: 3,
    goldenBoots: 2,
    iconicQuote: 'My life is a story of hope, resilience, and belief that a boy from the slums can touch the highest peaks of the world.',
    legacySummary: 'The first and only African player to win the FIFA World Player of the Year & Ballon d\'Or in history.',
    avatarColor: 'from-emerald-700 to-teal-500',
  },
  {
    id: 'henry',
    name: 'Thierry Henry',
    nickname: 'The King of Highbury',
    country: 'France',
    flag: '🇫🇷',
    era: '1994 - 2014',
    positions: 'Striker / Left Winger',
    careerGoals: 411,
    careerAssists: 215,
    appearances: 917,
    ballonDors: 0,
    worldCups: 1,
    continentalTitles: 1,
    domesticTitles: 4,
    goldenBoots: 4,
    iconicQuote: 'Sometimes in football you have to score goals, not just play football.',
    legacySummary: 'Arsenal Invincible icon, record 4 Premier League Golden Boots, combining blistering speed with graceful finishing.',
    avatarColor: 'from-rose-700 to-red-500',
  },
];

export interface LegacyMilestone {
  id: string;
  title: string;
  category: 'GOALS' | 'AWARDS' | 'TROPHIES' | 'WEALTH' | 'NATIONAL';
  description: string;
  targetValue: number;
  currentValue: number;
  isUnlocked: boolean;
  rewardMorale: number;
  icon: string;
}

export function evaluateLegacyMilestones(player: any): LegacyMilestone[] {
  const careerGoals = (player.careerHistory || []).reduce((acc: number, s: any) => acc + (s.goals || 0), 0) + (player.seasonStats?.goals || 0);
  const careerAssists = (player.careerHistory || []).reduce((acc: number, s: any) => acc + (s.assists || 0), 0) + (player.seasonStats?.assists || 0);
  const careerApps = (player.careerHistory || []).reduce((acc: number, s: any) => acc + (s.appearances || 0), 0) + (player.seasonStats?.appearances || 0);
  const totalTrophies = (player.trophyCabinet || []).length;
  const ballonDors = (player.awards || []).filter((a: any) => a.name?.toLowerCase().includes('ballon')).length;
  const careerEarnings = player.totalCareerEarnings || 0;
  const nationalCaps = player.nationalTeamCaps || 0;

  return [
    {
      id: 'first_goal',
      title: 'First Professional Goal',
      category: 'GOALS',
      description: 'Find the back of the net in professional senior football.',
      targetValue: 1,
      currentValue: careerGoals,
      isUnlocked: careerGoals >= 1,
      rewardMorale: 10,
      icon: '⚽',
    },
    {
      id: 'century_club',
      title: 'Century Club (100 Goals)',
      category: 'GOALS',
      description: 'Join the world football elite with 100 competitive senior goals.',
      targetValue: 100,
      currentValue: careerGoals,
      isUnlocked: careerGoals >= 100,
      rewardMorale: 25,
      icon: '🎯',
    },
    {
      id: 'maestro_assists',
      title: 'Playmaking Maestro (50 Assists)',
      category: 'GOALS',
      description: 'Deliver 50 pinpoint assists for your teammates.',
      targetValue: 50,
      currentValue: careerAssists,
      isUnlocked: careerAssists >= 50,
      rewardMorale: 15,
      icon: '🪄',
    },
    {
      id: 'ironman_apps',
      title: 'Ironman (300 Appearances)',
      category: 'GOALS',
      description: 'Endure grueling seasons across 300 professional matches.',
      targetValue: 300,
      currentValue: careerApps,
      isUnlocked: careerApps >= 300,
      rewardMorale: 20,
      icon: '🛡️',
    },
    {
      id: 'silverware',
      title: 'Championship Silverware',
      category: 'TROPHIES',
      description: 'Lift your first major domestic league championship or continental cup.',
      targetValue: 1,
      currentValue: totalTrophies,
      isUnlocked: totalTrophies >= 1,
      rewardMorale: 30,
      icon: '🏆',
    },
    {
      id: 'golden_boot',
      title: 'Golden Boot Laureate',
      category: 'AWARDS',
      description: 'Finish as the outright top scorer in a senior championship.',
      targetValue: 1,
      currentValue: (player.awards || []).filter((a: any) => a.name?.toLowerCase().includes('golden boot')).length,
      isUnlocked: (player.awards || []).some((a: any) => a.name?.toLowerCase().includes('golden boot')),
      rewardMorale: 35,
      icon: '👟',
    },
    {
      id: 'ballon_dor',
      title: 'Ballon d\'Or Triumph',
      category: 'AWARDS',
      description: 'Crown yourself the undisputed best player on planet Earth.',
      targetValue: 1,
      currentValue: ballonDors,
      isUnlocked: ballonDors >= 1,
      rewardMorale: 50,
      icon: '🌟',
    },
    {
      id: 'national_veteran',
      title: 'Patriotic Icon (25 Senior Caps)',
      category: 'NATIONAL',
      description: 'Represent your homeland across 25 international senior fixtures.',
      targetValue: 25,
      currentValue: nationalCaps,
      isUnlocked: nationalCaps >= 25,
      rewardMorale: 25,
      icon: '🌍',
    },
    {
      id: 'wealth_builder',
      title: 'Generational Wealth (£10M)',
      category: 'WEALTH',
      description: 'Accumulate over £10,000,000 in total career contract and sponsor earnings.',
      targetValue: 10_000_000,
      currentValue: careerEarnings,
      isUnlocked: careerEarnings >= 10_000_000,
      rewardMorale: 30,
      icon: '💰',
    },
  ];
}
