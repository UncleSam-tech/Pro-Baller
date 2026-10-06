import { Position } from '../types/game';

export interface GlobalScoutProspect {
  id: string;
  name: string;
  age: number;
  clubName: string;
  clubCountry: string;
  league: string;
  position: Position;
  nationality: string;
  overallRating: number;
  potentialRating: number;
  marketValueGBP: number;
  weeklyWageGBP: number;
  status: 'Youth Wonderkid' | 'Transfer-Listed' | 'Contract Expiring' | 'Elite Prospect';
  scoutGrade: 'A+' | 'A' | 'B+' | 'B';
  tacticalCompatibilityPercent: number;
  compatibilityVerdict: string;
  keyStrengths: string[];
  developmentNotes: string[];
  scoutAgency: string;
}

export const GLOBAL_YOUTH_PROSPECTS: GlobalScoutProspect[] = [
  {
    id: 'prospect_lamine',
    name: 'Lamine Yamal',
    age: 18,
    clubName: 'FC Barcelona',
    clubCountry: 'Spain',
    league: 'La Liga',
    position: 'RW',
    nationality: 'Spain',
    overallRating: 87,
    potentialRating: 95,
    marketValueGBP: 120_000_000,
    weeklyWageGBP: 140_000,
    status: 'Youth Wonderkid',
    scoutGrade: 'A+',
    tacticalCompatibilityPercent: 98,
    compatibilityVerdict: 'Telepathic inverted synergy. Cuts inside onto stronger foot to slip defense-splitting diagonal passes straight onto your runs.',
    keyStrengths: ['Generational dribbling cadence', 'Vision in congested low blocks', 'Clutch international tournament pedigree'],
    developmentNotes: ['Physical endurance management in grueling 55-match domestic calendars'],
    scoutAgency: 'La Masia Technical Directorate',
  },
  {
    id: 'prospect_estevao',
    name: 'Estêvão Willian (Messinho)',
    age: 18,
    clubName: 'SE Palmeiras',
    clubCountry: 'Brazil',
    league: 'Brasileirão',
    position: 'RW',
    nationality: 'Brazil',
    overallRating: 78,
    potentialRating: 92,
    marketValueGBP: 45_000_000,
    weeklyWageGBP: 40_000,
    status: 'Youth Wonderkid',
    scoutGrade: 'A+',
    tacticalCompatibilityPercent: 95,
    compatibilityVerdict: 'Ginga flair and sudden body feints that suck center-backs out of position, opening vast central attacking channels for you.',
    keyStrengths: ['Explosive acceleration from dead stop', 'Fearless 1v1 duel mentality', 'Deadly curling far-post finishes'],
    developmentNotes: ['Adapting to wet European winter pitches and physical shoulder checks'],
    scoutAgency: 'São Paulo Talent Recon',
  },
  {
    id: 'prospect_kendry',
    name: 'Kendry Páez',
    age: 18,
    clubName: 'Independiente del Valle',
    clubCountry: 'Ecuador',
    league: 'CONMEBOL Superliga',
    position: 'CAM',
    nationality: 'Ecuador',
    overallRating: 77,
    potentialRating: 90,
    marketValueGBP: 28_000_000,
    weeklyWageGBP: 25_000,
    status: 'Youth Wonderkid',
    scoutGrade: 'A',
    tacticalCompatibilityPercent: 92,
    compatibilityVerdict: 'High-tempo playmaker who thrives in the half-spaces. Reads your blind-side runs before fullbacks can rotate.',
    keyStrengths: ['Laser-guided through balls', 'Low center of gravity', 'Senior international composure at 17'],
    developmentNotes: ['Needs strength conditioning for defensive transition tracking'],
    scoutAgency: 'Andean Scouting Network',
  },
  {
    id: 'prospect_mastantuono',
    name: 'Franco Mastantuono',
    age: 18,
    clubName: 'River Plate',
    clubCountry: 'Argentina',
    league: 'Argentine Primera División',
    position: 'CAM',
    nationality: 'Argentina',
    overallRating: 76,
    potentialRating: 91,
    marketValueGBP: 35_000_000,
    weeklyWageGBP: 28_000,
    status: 'Elite Prospect',
    scoutGrade: 'A',
    tacticalCompatibilityPercent: 91,
    compatibilityVerdict: 'Bespoke Argentine enganche with devastating left-foot set-piece delivery and quick one-touch wall passes.',
    keyStrengths: ['Curling direct free-kicks', 'First-touch ball retention under pressure', 'Relentless South American competitive edge'],
    developmentNotes: ['Needs to improve defensive duel efficiency in mid-block structures'],
    scoutAgency: 'Buenos Aires Academy Scouts',
  },
  {
    id: 'prospect_chido',
    name: 'Chido Obi-Martin',
    age: 18,
    clubName: 'Manchester United Academy',
    clubCountry: 'England',
    league: 'Premier League',
    position: 'ST',
    nationality: 'Denmark',
    overallRating: 73,
    potentialRating: 89,
    marketValueGBP: 14_000_000,
    weeklyWageGBP: 18_000,
    status: 'Youth Wonderkid',
    scoutGrade: 'A',
    tacticalCompatibilityPercent: 88,
    compatibilityVerdict: 'Towering modern focal striker. Pinning center backs allows you freedom to operate as shadow striker or cut inside.',
    keyStrengths: ['Lethal box finishing (scored 10 in a single youth match)', 'Physical aerial presence', 'Deceptive burst speed'],
    developmentNotes: ['Building stamina consistency over 90 senior minutes'],
    scoutAgency: 'Carrington Technical Scouting',
  },
  {
    id: 'prospect_daga',
    name: 'Daniel Daga',
    age: 19,
    clubName: 'Enyimba International FC',
    clubCountry: 'Nigeria',
    league: 'Nigeria Premier Football League (NPFL)',
    position: 'CDM',
    nationality: 'Nigeria',
    overallRating: 72,
    potentialRating: 88,
    marketValueGBP: 3_500_000,
    weeklyWageGBP: 8_000,
    status: 'Transfer-Listed',
    scoutGrade: 'A',
    tacticalCompatibilityPercent: 94,
    compatibilityVerdict: 'Locker room shield. Anchors the defensive midfield with relentless ball recoveries, feeding early transition balls to your feet.',
    keyStrengths: ['Relentless stamina engine', 'Aggressive standing tackles', 'FIFA U20 World Cup standout performer'],
    developmentNotes: ['Needs European tactical work on positional discipline in high defensive blocks'],
    scoutAgency: 'West African Grassroots Intelligence',
  },
  {
    id: 'prospect_chidera',
    name: 'Chidera Ezeh',
    age: 20,
    clubName: 'Sporting Lagos',
    clubCountry: 'Nigeria',
    league: 'Nigeria Premier Football League (NPFL)',
    position: 'LW',
    nationality: 'Nigeria',
    overallRating: 71,
    potentialRating: 86,
    marketValueGBP: 2_800_000,
    weeklyWageGBP: 6_500,
    status: 'Transfer-Listed',
    scoutGrade: 'B+',
    tacticalCompatibilityPercent: 89,
    compatibilityVerdict: 'Blistering wing burst. Takes on fullbacks to deliver low hard cutbacks across the penalty box.',
    keyStrengths: ['Raw explosive pace (91 Sprint)', 'Direct counter-attacking drive', 'Lagos street flair'],
    developmentNotes: ['Decision-making in final third delivery'],
    scoutAgency: 'Lagos Talent Radar',
  },
  {
    id: 'prospect_bardghji',
    name: 'Roony Bardghji',
    age: 20,
    clubName: 'FC Copenhagen',
    clubCountry: 'Denmark',
    league: 'Danish Superliga',
    position: 'RW',
    nationality: 'Sweden',
    overallRating: 76,
    potentialRating: 88,
    marketValueGBP: 18_000_000,
    weeklyWageGBP: 30_000,
    status: 'Contract Expiring',
    scoutGrade: 'A',
    tacticalCompatibilityPercent: 90,
    compatibilityVerdict: 'Champions League tested match-winner. Exceptional half-volley technique and sharp combination link-up.',
    keyStrengths: ['Big match temperament', 'Tight ball control in congested 18-yard box', 'Strong tactical coaching foundation'],
    developmentNotes: ['Coming off recovery from knee strain'],
    scoutAgency: 'Nordic Talent Network',
  },
];

export interface LeagueStandingRow {
  position: number;
  clubName: string;
  shortName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
}

export const GLOBAL_LEAGUE_STANDINGS: Record<string, LeagueStandingRow[]> = {
  'Premier League': [
    { position: 1, clubName: 'Manchester City', shortName: 'MCI', played: 14, won: 11, drawn: 2, lost: 1, gf: 34, ga: 12, gd: 22, points: 35, form: ['W', 'W', 'W', 'D', 'W'] },
    { position: 2, clubName: 'Liverpool FC', shortName: 'LIV', played: 14, won: 10, drawn: 3, lost: 1, gf: 31, ga: 11, gd: 20, points: 33, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 3, clubName: 'Arsenal FC', shortName: 'ARS', played: 14, won: 9, drawn: 4, lost: 1, gf: 28, ga: 12, gd: 16, points: 31, form: ['W', 'D', 'W', 'W', 'D'] },
    { position: 4, clubName: 'Chelsea FC', shortName: 'CHE', played: 14, won: 8, drawn: 3, lost: 3, gf: 29, ga: 16, gd: 13, points: 27, form: ['W', 'W', 'L', 'W', 'D'] },
    { position: 5, clubName: 'Tottenham Hotspur', shortName: 'TOT', played: 14, won: 7, drawn: 2, lost: 5, gf: 27, ga: 19, gd: 8, points: 23, form: ['L', 'W', 'W', 'L', 'W'] },
    { position: 6, clubName: 'Aston Villa', shortName: 'AVL', played: 14, won: 7, drawn: 2, lost: 5, gf: 22, ga: 20, gd: 2, points: 23, form: ['W', 'L', 'W', 'D', 'L'] },
    { position: 7, clubName: 'Manchester United', shortName: 'MUN', played: 14, won: 6, drawn: 3, lost: 5, gf: 19, ga: 18, gd: 1, points: 21, form: ['D', 'W', 'L', 'W', 'D'] },
    { position: 8, clubName: 'Brighton & Hove Albion', shortName: 'BHA', played: 14, won: 5, drawn: 5, lost: 4, gf: 21, ga: 22, gd: -1, points: 20, form: ['D', 'D', 'W', 'L', 'W'] },
  ],
  'La Liga': [
    { position: 1, clubName: 'FC Barcelona', shortName: 'BAR', played: 15, won: 12, drawn: 1, lost: 2, gf: 44, ga: 16, gd: 28, points: 37, form: ['W', 'W', 'W', 'L', 'W'] },
    { position: 2, clubName: 'Real Madrid CF', shortName: 'RMA', played: 15, won: 11, drawn: 3, lost: 1, gf: 35, ga: 13, gd: 22, points: 36, form: ['W', 'D', 'W', 'W', 'W'] },
    { position: 3, clubName: 'Atlético de Madrid', shortName: 'ATM', played: 15, won: 9, drawn: 5, lost: 1, gf: 26, ga: 9, gd: 17, points: 32, form: ['W', 'W', 'W', 'D', 'W'] },
    { position: 4, clubName: 'Real Sociedad', shortName: 'RSO', played: 15, won: 7, drawn: 3, lost: 5, gf: 18, ga: 14, gd: 4, points: 24, form: ['L', 'W', 'D', 'W', 'L'] },
    { position: 5, clubName: 'UD Las Palmas', shortName: 'LPA', played: 15, won: 5, drawn: 4, lost: 6, gf: 17, ga: 21, gd: -4, points: 19, form: ['W', 'L', 'D', 'W', 'L'] },
  ],
  'Nigeria Premier Football League (NPFL)': [
    { position: 1, clubName: 'Remo Stars FC', shortName: 'RSF', played: 12, won: 8, drawn: 2, lost: 2, gf: 19, ga: 8, gd: 11, points: 26, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 2, clubName: 'Sporting Lagos', shortName: 'SLA', played: 12, won: 7, drawn: 3, lost: 2, gf: 21, ga: 11, gd: 10, points: 24, form: ['W', 'D', 'W', 'W', 'L'] },
    { position: 3, clubName: 'Enyimba International FC', shortName: 'ENY', played: 12, won: 7, drawn: 2, lost: 3, gf: 18, ga: 10, gd: 8, points: 23, form: ['W', 'L', 'W', 'W', 'D'] },
    { position: 4, clubName: 'Rivers United FC', shortName: 'RIV', played: 12, won: 6, drawn: 4, lost: 2, gf: 16, ga: 9, gd: 7, points: 22, form: ['D', 'W', 'W', 'D', 'W'] },
    { position: 5, clubName: 'Enugu Rangers International', shortName: 'RAN', played: 12, won: 6, drawn: 3, lost: 3, gf: 17, ga: 12, gd: 5, points: 21, form: ['W', 'W', 'L', 'D', 'W'] },
    { position: 6, clubName: 'Shooting Stars SC (3SC)', shortName: 'SHO', played: 12, won: 5, drawn: 3, lost: 4, gf: 14, ga: 13, gd: 1, points: 18, form: ['L', 'W', 'D', 'W', 'L'] },
    { position: 7, clubName: 'Bendel Insurance FC', shortName: 'BEN', played: 12, won: 4, drawn: 5, lost: 3, gf: 11, ga: 10, gd: 1, points: 17, form: ['D', 'D', 'W', 'L', 'D'] },
    { position: 8, clubName: 'Kano Pillars FC', shortName: 'KAN', played: 12, won: 4, drawn: 3, lost: 5, gf: 15, ga: 18, gd: -3, points: 15, form: ['W', 'L', 'L', 'W', 'D'] },
  ],
  'Brasileirão': [
    { position: 1, clubName: 'SE Palmeiras', shortName: 'PAL', played: 16, won: 11, drawn: 3, lost: 2, gf: 32, ga: 14, gd: 18, points: 36, form: ['W', 'W', 'D', 'W', 'W'] },
    { position: 2, clubName: 'CR Flamengo', shortName: 'FLA', played: 16, won: 10, drawn: 4, lost: 2, gf: 34, ga: 16, gd: 18, points: 34, form: ['W', 'D', 'W', 'W', 'D'] },
    { position: 3, clubName: 'São Paulo FC', shortName: 'SAO', played: 16, won: 8, drawn: 5, lost: 3, gf: 25, ga: 17, gd: 8, points: 29, form: ['D', 'W', 'L', 'W', 'W'] },
    { position: 4, clubName: 'Santos FC', shortName: 'SAN', played: 16, won: 7, drawn: 4, lost: 5, gf: 23, ga: 20, gd: 3, points: 25, form: ['W', 'L', 'W', 'D', 'L'] },
  ],
};
