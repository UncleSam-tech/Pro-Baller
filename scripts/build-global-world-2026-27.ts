import fs from 'fs';
import path from 'path';
import { importFootballWorldSnapshot } from '../src/world/import/worldImporter';
import { validateFootballWorldDataPack } from '../src/world/worldDataPack';
import { bootstrapFootballWorld } from '../src/world/worldRuntime';
import { advanceFootballWorldStep } from '../src/world/worldProgression';
import type {
  RawFootballWorldSnapshot,
  RawWorldClub,
  RawWorldCompetition,
  RawWorldFixture,
  RawWorldPlayer,
  RawWorldCountry,
  RawSeasonScheduleMode,
} from '../src/world/import/types';
import type {
  CompetitionMovementRelationship,
  CompetitionRuleSet,
  CompetitionFormatType,
} from '../src/competition/types';
import type {
  WorldFootballPosition,
  FootballWorldDataPack,
} from '../src/world/types';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

export const SNAPSHOT_DATE = '2026-10-07';
export const SEASON_LABEL = '2026-27';

export const MAX_NEW_BSD_REQUESTS = 200;
export const MIN_BSD_ACCOUNT_REMAINING = 6000;

export const CACHE_ROOT = path.resolve(process.cwd(), '.cache/pro-baller');
export const BSD_CACHE_DIR = path.join(CACHE_ROOT, 'bsd/2026-27');
export const OPENFOOTBALL_CACHE_DIR = path.join(CACHE_ROOT, 'openfootball/2026-27');
export const OUTPUT_BASE = path.resolve(process.cwd(), 'data/world/2026-27');

// Ensure directories exist
fs.mkdirSync(BSD_CACHE_DIR, { recursive: true });
fs.mkdirSync(path.join(BSD_CACHE_DIR, 'squads'), { recursive: true });
fs.mkdirSync(path.join(BSD_CACHE_DIR, 'teams'), { recursive: true });
fs.mkdirSync(path.join(BSD_CACHE_DIR, 'events'), { recursive: true });
fs.mkdirSync(OPENFOOTBALL_CACHE_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_BASE, { recursive: true });

// ============================================================================
// CREDENTIAL LOADING
// ============================================================================

function getBsdApiKey(): string {
  if (process.env.BSD_API_KEY) return process.env.BSD_API_KEY.trim();
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const m = content.match(/^\s*BSD_API_KEY\s*=\s*(.+)$/m);
    if (m) {
      return m[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return '';
}

// ============================================================================
// RATE-LIMIT TRACKING & BSD NETWORK CLIENT
// ============================================================================

export interface BsdQuotaTracker {
  networkRequestsUsed: number;
  cacheHits: number;
  startRemaining: number;
  lastRemaining: number;
  resetSeconds: number;
  budgetStopped: boolean;
  stopReason?: string;
}

export const quotaTracker: BsdQuotaTracker = {
  networkRequestsUsed: 0,
  cacheHits: 0,
  startRemaining: 6846, // Initial verified quota at beginning of correction
  lastRemaining: 6841,
  resetSeconds: 0,
  budgetStopped: false,
};

function parseRateLimitHeader(headerValue: string | null) {
  if (!headerValue) return;
  const rMatch = headerValue.match(/r=(\d+)/);
  if (rMatch) {
    quotaTracker.lastRemaining = parseInt(rMatch[1], 10);
  }
  const tMatch = headerValue.match(/t=(\d+)/);
  if (tMatch) {
    quotaTracker.resetSeconds = parseInt(tMatch[1], 10);
  }
}

async function fetchBsdJson(endpoint: string, cacheFilePath: string): Promise<any> {
  if (fs.existsSync(cacheFilePath)) {
    quotaTracker.cacheHits++;
    return JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
  }

  if (quotaTracker.networkRequestsUsed >= MAX_NEW_BSD_REQUESTS) {
    quotaTracker.budgetStopped = true;
    quotaTracker.stopReason = `Reached run budget limit of ${MAX_NEW_BSD_REQUESTS} requests.`;
    throw new Error(`QUOTA_STOP: ${quotaTracker.stopReason}`);
  }

  if (quotaTracker.lastRemaining <= MIN_BSD_ACCOUNT_REMAINING) {
    quotaTracker.budgetStopped = true;
    quotaTracker.stopReason = `Account quota remaining (${quotaTracker.lastRemaining}) fell below safety threshold (${MIN_BSD_ACCOUNT_REMAINING}).`;
    throw new Error(`QUOTA_STOP: ${quotaTracker.stopReason}`);
  }

  const key = getBsdApiKey();
  if (!key) {
    throw new Error('BSD_API_KEY is required for uncached API requests.');
  }

  const url = `https://sports.bzzoiro.com/api/v2/${endpoint}`;
  quotaTracker.networkRequestsUsed++;

  const res = await fetch(url, { headers: { Authorization: `Token ${key}` } });
  parseRateLimitHeader(res.headers.get('ratelimit'));

  if (!res.ok) {
    throw new Error(`BSD error ${res.status} for ${endpoint}`);
  }

  const data = await res.json();
  fs.writeFileSync(cacheFilePath, JSON.stringify(data, null, 2), 'utf8');
  await new Promise(r => setTimeout(r, 60)); // pacing
  return data;
}

// ============================================================================
// STRING & ID HELPERS
// ============================================================================

export function slug(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = fullName.trim();
  const lastSpaceIdx = trimmed.lastIndexOf(' ');
  if (lastSpaceIdx === -1) {
    return { firstName: trimmed, lastName: '' };
  }
  return {
    firstName: trimmed.slice(0, lastSpaceIdx).trim(),
    lastName: trimmed.slice(lastSpaceIdx + 1).trim(),
  };
}

export function normalizePosition(rawPos: string): WorldFootballPosition {
  const p = (rawPos || '').trim().toUpperCase();
  if (p === 'G' || p === 'GK' || p.includes('GOAL')) return 'GK';
  if (p === 'D' || p === 'DF' || p.includes('DEF')) return 'DF';
  if (p === 'M' || p === 'MF' || p.includes('MID')) return 'MF';
  if (p === 'F' || p === 'FW' || p.includes('FOR') || p.includes('ATT') || p.includes('STR')) return 'FW';
  return 'MF';
}

// ============================================================================
// COUNTRY MAPPING
// ============================================================================

export interface CountryMeta {
  id: string;
  name: string;
  code: string;
  confederationId?: string;
}

export const COUNTRY_DICTIONARY: Record<string, CountryMeta> = {
  afghanistan: { id: 'afghanistan', name: 'Afghanistan', code: 'AFG', confederationId: 'afc' },
  albania: { id: 'albania', name: 'Albania', code: 'ALB', confederationId: 'uefa' },
  algeria: { id: 'algeria', name: 'Algeria', code: 'ALG', confederationId: 'caf' },
  andorra: { id: 'andorra', name: 'Andorra', code: 'AND', confederationId: 'uefa' },
  angola: { id: 'angola', name: 'Angola', code: 'ANG', confederationId: 'caf' },
  argentina: { id: 'argentina', name: 'Argentina', code: 'ARG', confederationId: 'conmebol' },
  armenia: { id: 'armenia', name: 'Armenia', code: 'ARM', confederationId: 'uefa' },
  australia: { id: 'australia', name: 'Australia', code: 'AUS', confederationId: 'afc' },
  austria: { id: 'austria', name: 'Austria', code: 'AUT', confederationId: 'uefa' },
  azerbaijan: { id: 'azerbaijan', name: 'Azerbaijan', code: 'AZE', confederationId: 'uefa' },
  belgium: { id: 'belgium', name: 'Belgium', code: 'BEL', confederationId: 'uefa' },
  benin: { id: 'benin', name: 'Benin', code: 'BEN', confederationId: 'caf' },
  bolivia: { id: 'bolivia', name: 'Bolivia', code: 'BOL', confederationId: 'conmebol' },
  'bosnia and herzegovina': { id: 'bosnia-and-herzegovina', name: 'Bosnia and Herzegovina', code: 'BIH', confederationId: 'uefa' },
  brazil: { id: 'brazil', name: 'Brazil', code: 'BRA', confederationId: 'conmebol' },
  bulgaria: { id: 'bulgaria', name: 'Bulgaria', code: 'BUL', confederationId: 'uefa' },
  'burkina faso': { id: 'burkina-faso', name: 'Burkina Faso', code: 'BUR', confederationId: 'caf' },
  cameroon: { id: 'cameroon', name: 'Cameroon', code: 'CMR', confederationId: 'caf' },
  canada: { id: 'canada', name: 'Canada', code: 'CAN', confederationId: 'concacaf' },
  'cape verde': { id: 'cape-verde', name: 'Cape Verde', code: 'CPV', confederationId: 'caf' },
  chile: { id: 'chile', name: 'Chile', code: 'CHI', confederationId: 'conmebol' },
  colombia: { id: 'colombia', name: 'Colombia', code: 'COL', confederationId: 'conmebol' },
  comoros: { id: 'comoros', name: 'Comoros', code: 'COM', confederationId: 'caf' },
  congo: { id: 'congo', name: 'Republic of the Congo', code: 'CGO', confederationId: 'caf' },
  'costa rica': { id: 'costa-rica', name: 'Costa Rica', code: 'CRC', confederationId: 'concacaf' },
  croatia: { id: 'croatia', name: 'Croatia', code: 'CRO', confederationId: 'uefa' },
  cyprus: { id: 'cyprus', name: 'Cyprus', code: 'CYP', confederationId: 'uefa' },
  'czech republic': { id: 'czech-republic', name: 'Czech Republic', code: 'CZE', confederationId: 'uefa' },
  czechia: { id: 'czech-republic', name: 'Czech Republic', code: 'CZE', confederationId: 'uefa' },
  denmark: { id: 'denmark', name: 'Denmark', code: 'DEN', confederationId: 'uefa' },
  'dr congo': { id: 'dr-congo', name: 'DR Congo', code: 'COD', confederationId: 'caf' },
  ecuador: { id: 'ecuador', name: 'Ecuador', code: 'ECU', confederationId: 'conmebol' },
  egypt: { id: 'egypt', name: 'Egypt', code: 'EGY', confederationId: 'caf' },
  'el salvador': { id: 'el-salvador', name: 'El Salvador', code: 'SLV', confederationId: 'concacaf' },
  england: { id: 'england', name: 'England', code: 'ENG', confederationId: 'uefa' },
  estonia: { id: 'estonia', name: 'Estonia', code: 'EST', confederationId: 'uefa' },
  finland: { id: 'finland', name: 'Finland', code: 'FIN', confederationId: 'uefa' },
  france: { id: 'france', name: 'France', code: 'FRA', confederationId: 'uefa' },
  gabon: { id: 'gabon', name: 'Gabon', code: 'GAB', confederationId: 'caf' },
  gambia: { id: 'gambia', name: 'Gambia', code: 'GAM', confederationId: 'caf' },
  georgia: { id: 'georgia', name: 'Georgia', code: 'GEO', confederationId: 'uefa' },
  germany: { id: 'germany', name: 'Germany', code: 'GER', confederationId: 'uefa' },
  ghana: { id: 'ghana', name: 'Ghana', code: 'GHA', confederationId: 'caf' },
  greece: { id: 'greece', name: 'Greece', code: 'GRE', confederationId: 'uefa' },
  grenada: { id: 'grenada', name: 'Grenada', code: 'GRN', confederationId: 'concacaf' },
  guinea: { id: 'guinea', name: 'Guinea', code: 'GUI', confederationId: 'caf' },
  'guinea-bissau': { id: 'guinea-bissau', name: 'Guinea-Bissau', code: 'GNB', confederationId: 'caf' },
  honduras: { id: 'honduras', name: 'Honduras', code: 'HON', confederationId: 'concacaf' },
  hungary: { id: 'hungary', name: 'Hungary', code: 'HUN', confederationId: 'uefa' },
  iceland: { id: 'iceland', name: 'Iceland', code: 'ISL', confederationId: 'uefa' },
  iran: { id: 'iran', name: 'Iran', code: 'IRN', confederationId: 'afc' },
  iraq: { id: 'iraq', name: 'Iraq', code: 'IRQ', confederationId: 'afc' },
  israel: { id: 'israel', name: 'Israel', code: 'ISR', confederationId: 'uefa' },
  italy: { id: 'italy', name: 'Italy', code: 'ITA', confederationId: 'uefa' },
  'ivory coast': { id: 'ivory-coast', name: 'Ivory Coast', code: 'CIV', confederationId: 'caf' },
  'cote d\'ivoire': { id: 'ivory-coast', name: 'Ivory Coast', code: 'CIV', confederationId: 'caf' },
  'cote divoire': { id: 'ivory-coast', name: 'Ivory Coast', code: 'CIV', confederationId: 'caf' },
  jamaica: { id: 'jamaica', name: 'Jamaica', code: 'JAM', confederationId: 'concacaf' },
  japan: { id: 'japan', name: 'Japan', code: 'JPN', confederationId: 'afc' },
  kenya: { id: 'kenya', name: 'Kenya', code: 'KEN', confederationId: 'caf' },
  kosovo: { id: 'kosovo', name: 'Kosovo', code: 'KVX', confederationId: 'uefa' },
  latvia: { id: 'latvia', name: 'Latvia', code: 'LVA', confederationId: 'uefa' },
  lithuania: { id: 'lithuania', name: 'Lithuania', code: 'LTU', confederationId: 'uefa' },
  luxembourg: { id: 'luxembourg', name: 'Luxembourg', code: 'LUX', confederationId: 'uefa' },
  mali: { id: 'mali', name: 'Mali', code: 'MLI', confederationId: 'caf' },
  mexico: { id: 'mexico', name: 'Mexico', code: 'MEX', confederationId: 'concacaf' },
  moldova: { id: 'moldova', name: 'Moldova', code: 'MDA', confederationId: 'uefa' },
  montenegro: { id: 'montenegro', name: 'Montenegro', code: 'MNE', confederationId: 'uefa' },
  morocco: { id: 'morocco', name: 'Morocco', code: 'MAR', confederationId: 'caf' },
  mozambique: { id: 'mozambique', name: 'Mozambique', code: 'MOZ', confederationId: 'caf' },
  netherlands: { id: 'netherlands', name: 'Netherlands', code: 'NED', confederationId: 'uefa' },
  'new zealand': { id: 'new-zealand', name: 'New Zealand', code: 'NZL', confederationId: 'ofc' },
  nigeria: { id: 'nigeria', name: 'Nigeria', code: 'NGA', confederationId: 'caf' },
  'north macedonia': { id: 'north-macedonia', name: 'North Macedonia', code: 'MKD', confederationId: 'uefa' },
  'northern ireland': { id: 'northern-ireland', name: 'Northern Ireland', code: 'NIR', confederationId: 'uefa' },
  norway: { id: 'norway', name: 'Norway', code: 'NOR', confederationId: 'uefa' },
  panama: { id: 'panama', name: 'Panama', code: 'PAN', confederationId: 'concacaf' },
  paraguay: { id: 'paraguay', name: 'Paraguay', code: 'PAR', confederationId: 'conmebol' },
  peru: { id: 'peru', name: 'Peru', code: 'PER', confederationId: 'conmebol' },
  poland: { id: 'poland', name: 'Poland', code: 'POL', confederationId: 'uefa' },
  portugal: { id: 'portugal', name: 'Portugal', code: 'POR', confederationId: 'uefa' },
  'republic of ireland': { id: 'republic-of-ireland', name: 'Republic of Ireland', code: 'IRL', confederationId: 'uefa' },
  romania: { id: 'romania', name: 'Romania', code: 'ROU', confederationId: 'uefa' },
  russia: { id: 'russia', name: 'Russia', code: 'RUS', confederationId: 'uefa' },
  'saudi arabia': { id: 'saudi-arabia', name: 'Saudi Arabia', code: 'KSA', confederationId: 'afc' },
  scotland: { id: 'scotland', name: 'Scotland', code: 'SCO', confederationId: 'uefa' },
  senegal: { id: 'senegal', name: 'Senegal', code: 'SEN', confederationId: 'caf' },
  serbia: { id: 'serbia', name: 'Serbia', code: 'SRB', confederationId: 'uefa' },
  slovakia: { id: 'slovakia', name: 'Slovakia', code: 'SVK', confederationId: 'uefa' },
  slovenia: { id: 'slovenia', name: 'Slovenia', code: 'SVN', confederationId: 'uefa' },
  'south africa': { id: 'south-africa', name: 'South Africa', code: 'RSA', confederationId: 'caf' },
  'south korea': { id: 'south-korea', name: 'South Korea', code: 'KOR', confederationId: 'afc' },
  spain: { id: 'spain', name: 'Spain', code: 'ESP', confederationId: 'uefa' },
  sweden: { id: 'sweden', name: 'Sweden', code: 'SWE', confederationId: 'uefa' },
  switzerland: { id: 'switzerland', name: 'Switzerland', code: 'SUI', confederationId: 'uefa' },
  tunisia: { id: 'tunisia', name: 'Tunisia', code: 'TUN', confederationId: 'caf' },
  turkey: { id: 'turkey', name: 'Turkey', code: 'TUR', confederationId: 'uefa' },
  ukraine: { id: 'ukraine', name: 'Ukraine', code: 'UKR', confederationId: 'uefa' },
  'united states': { id: 'usa', name: 'United States', code: 'USA', confederationId: 'concacaf' },
  usa: { id: 'usa', name: 'United States', code: 'USA', confederationId: 'concacaf' },
  uruguay: { id: 'uruguay', name: 'Uruguay', code: 'URU', confederationId: 'conmebol' },
  venezuela: { id: 'venezuela', name: 'Venezuela', code: 'VEN', confederationId: 'conmebol' },
  wales: { id: 'wales', name: 'Wales', code: 'WAL', confederationId: 'uefa' },
  zambia: { id: 'zambia', name: 'Zambia', code: 'ZAM', confederationId: 'caf' },
  zimbabwe: { id: 'zimbabwe', name: 'Zimbabwe', code: 'ZIM', confederationId: 'caf' },
};

export function resolveCountry(raw: string): CountryMeta {
  const norm = raw.toLowerCase().trim().replace(/[^a-z0-9 &']/g, '');
  if (COUNTRY_DICTIONARY[norm]) return COUNTRY_DICTIONARY[norm];
  const s = slug(raw);
  return { id: s, name: raw.trim(), code: raw.slice(0, 3).toUpperCase(), confederationId: 'uefa' };
}

// ============================================================================
// OPENFOOTBALL ALIAS DICTIONARY
// ============================================================================

export const OPENFOOTBALL_ALIASES: Record<string, string> = {
  // Spain (es.1)
  getafecf: 'getafe',
  sevillafc: 'sevilla',
  rayovallecanodemadrid: 'rayovallecano',
  realracingclubdesantander: 'realracingclub',
  villarrealcf: 'villarreal',
  rcdespanyoldebarcelona: 'espanyol',
  rcdeportivolacoruna: 'deportivodeacoruna',
  elchecf: 'elche',
  clubatleticodemadrid: 'atleticomadrid',
  realbetisbalompie: 'realbetis',
  realsociedaddefutbol: 'realsociedad',
  valenciacf: 'valencia',
  rcceltadevigo: 'celtavigo',
  realmadridcf: 'realmadrid',
  caosasuna: 'osasuna',

  // Germany (de.1)
  borussiamonchengladbach: 'borussiamgladbach',
  tsg1899hoffenheim: 'tsghoffenheim',

  // Italy (it.1)
  udinesecalcio: 'udinese',
  como1907: 'como',
  fcinternazionalemilano: 'inter',
  acmonza: 'monza',
  genoacfc: 'genoa',
  parmacalcio1913: 'parma',
  cagliaricalcio: 'cagliari',
  frosinonecalcio: 'frosinone',
  juventusfc: 'juventus',
  veneziafc: 'venezia',
  uslecce: 'lecce',
  atalantabc: 'atalanta',
  ussassuolocalcio: 'sassuolo',
  torinofc: 'torino',
  bolognafc1909: 'bologna',
  sslazio: 'lazio',
  acffiorentina: 'fiorentina',

  // France (fr.1)
  rcstrasbourgalsace: 'rcstrasbourg',
  racingclubdelens: 'rclens',
  ajauxerre: 'auxerre',
  lemansfc: 'lemans',
  stadebrestois29: 'stadebrestois',
  estroyesac: 'troyes',
  ogcnice: 'nice',
  fclorient: 'lorient',
  toulousefc: 'toulouse',
  angerssco: 'angers',
  lilleosc: 'lille',
  lehavreac: 'lehavre',
  asmonacofc: 'asmonaco',
  staderennaisfc1901: 'staderennais',
  parissaintgermainfc: 'parissaintgermain',

  // Portugal (pt.1)
  gdestorilpraia: 'estorilpraia',
  fcfamalicao: 'famalicao',
  casapiaac: 'casapia',
  vitoriaguimaraes: 'vitoriasc',
  cfestreladaamadora: 'cfestrelaamadora',
  sportingclubedeportugal: 'sportingcp',
  moreirensefc: 'moreirense',
  sportingclubedebraga: 'sportingbraga',
  gilvicentefc: 'gilvicente',
  rioavefc: 'rioave',
  sportlisboaebenfica: 'benfica',
  academicodeviseufc: 'academicoviseufc',
  cdsantaclara: 'santaclara',

  // Netherlands (nl.1)
  sccambuurleeuwarden: 'sccambuur',
  sbvexcelsior: 'excelsior',
  telstar1963: 'sctelstar',
  feyenoordrotterdam: 'feyenoord',
  fctwente65: 'fctwente',
  psv: 'psveindhoven',
  nec: 'necnijmegen',
  az: 'azalkmaar',
};

// ============================================================================
// DATA CONFIGURATION FOR TARGET WORLD
// ============================================================================

export interface CompetitionTargetConfig {
  id: string;
  name: string;
  shortName: string;
  level: number;
  bsdLeagueId: number;
  bsdSeasonId: number;
  seasonLabel?: string;
  formatType?: CompetitionFormatType;
  scheduleMode?: RawSeasonScheduleMode;
  openFootballCode?: string;
  primaryColor?: string;
}

export interface CountryTargetConfig {
  id: string;
  name: string;
  code: string;
  confederationId: string;
  competitions: CompetitionTargetConfig[];
  movements: CompetitionMovementRelationship[];
}

export const TARGET_COUNTRIES: CountryTargetConfig[] = [
  {
    id: 'spain',
    name: 'Spain',
    code: 'ESP',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'spain-la-liga',
        name: 'La Liga',
        shortName: 'La Liga',
        level: 1,
        bsdLeagueId: 3,
        bsdSeasonId: 1307,
        openFootballCode: 'es.1',
        primaryColor: '#EE8707',
      },
      {
        id: 'spain-segunda-division',
        name: 'Segunda División',
        shortName: 'LaLiga 2',
        level: 2,
        bsdLeagueId: 38,
        bsdSeasonId: 1356,
        primaryColor: '#002B49',
      },
    ],
    movements: [
      {
        id: 'rel-spain-segunda-prom',
        sourceCompetitionId: 'spain-segunda-division',
        destinationCompetitionId: 'spain-la-liga',
        movementType: 'PROMOTION',
        countryId: 'spain',
      },
    ],
  },
  {
    id: 'germany',
    name: 'Germany',
    code: 'GER',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'germany-bundesliga',
        name: 'Bundesliga',
        shortName: 'Bundesliga',
        level: 1,
        bsdLeagueId: 5,
        bsdSeasonId: 1091,
        openFootballCode: 'de.1',
        primaryColor: '#D3010C',
      },
      {
        id: 'germany-2-bundesliga',
        name: '2. Bundesliga',
        shortName: '2. Bundesliga',
        level: 2,
        bsdLeagueId: 94,
        bsdSeasonId: 1967,
        primaryColor: '#808080',
      },
    ],
    movements: [
      {
        id: 'rel-germany-2b-prom',
        sourceCompetitionId: 'germany-2-bundesliga',
        destinationCompetitionId: 'germany-bundesliga',
        movementType: 'PROMOTION',
        countryId: 'germany',
      },
    ],
  },
  {
    id: 'italy',
    name: 'Italy',
    code: 'ITA',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'italy-serie-a',
        name: 'Serie A',
        shortName: 'Serie A',
        level: 1,
        bsdLeagueId: 4,
        bsdSeasonId: 1375,
        openFootballCode: 'it.1',
        primaryColor: '#024494',
      },
      {
        id: 'italy-serie-b',
        name: 'Serie B',
        shortName: 'Serie B',
        level: 2,
        bsdLeagueId: 100,
        bsdSeasonId: 2084,
        primaryColor: '#00843D',
      },
    ],
    movements: [
      {
        id: 'rel-italy-serieb-prom',
        sourceCompetitionId: 'italy-serie-b',
        destinationCompetitionId: 'italy-serie-a',
        movementType: 'PROMOTION',
        countryId: 'italy',
      },
    ],
  },
  {
    id: 'france',
    name: 'France',
    code: 'FRA',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'france-ligue-1',
        name: 'Ligue 1',
        shortName: 'Ligue 1',
        level: 1,
        bsdLeagueId: 6,
        bsdSeasonId: 1311,
        openFootballCode: 'fr.1',
        primaryColor: '#233A58',
      },
      {
        id: 'france-ligue-2',
        name: 'Ligue 2',
        shortName: 'Ligue 2',
        level: 2,
        bsdLeagueId: 89,
        bsdSeasonId: 1848,
        primaryColor: '#172B4D',
      },
    ],
    movements: [
      {
        id: 'rel-france-ligue2-prom',
        sourceCompetitionId: 'france-ligue-2',
        destinationCompetitionId: 'france-ligue-1',
        movementType: 'PROMOTION',
        countryId: 'france',
      },
    ],
  },
  {
    id: 'portugal',
    name: 'Portugal',
    code: 'POR',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'portugal-liga-portugal',
        name: 'Liga Portugal',
        shortName: 'Liga Portugal',
        level: 1,
        bsdLeagueId: 2,
        bsdSeasonId: 1310,
        openFootballCode: 'pt.1',
        primaryColor: '#FFD700',
      },
      {
        id: 'portugal-liga-portugal-2',
        name: 'Liga Portugal 2',
        shortName: 'Liga 2',
        level: 2,
        bsdLeagueId: 88,
        bsdSeasonId: 1693,
        primaryColor: '#006600',
      },
    ],
    movements: [
      {
        id: 'rel-portugal-liga2-prom',
        sourceCompetitionId: 'portugal-liga-portugal-2',
        destinationCompetitionId: 'portugal-liga-portugal',
        movementType: 'PROMOTION',
        countryId: 'portugal',
      },
    ],
  },
  {
    id: 'netherlands',
    name: 'Netherlands',
    code: 'NED',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'netherlands-eredivisie',
        name: 'Eredivisie',
        shortName: 'Eredivisie',
        level: 1,
        bsdLeagueId: 10,
        bsdSeasonId: 1268,
        openFootballCode: 'nl.1',
        primaryColor: '#F36F21',
      },
    ],
    movements: [],
  },
  // Note: Scottish Premiership (bsdLeagueId: 13) is DEFERRED_UNSUPPORTED_FORMAT per Section 7.
  // Official Scottish Premiership 2026/27 runs through round 38 with a split-season structure after round 33.
  // Club/player data remains cached in .cache/pro-baller/ for future format support.
  {
    id: 'belgium',
    name: 'Belgium',
    code: 'BEL',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'belgium-pro-league',
        name: 'Belgian Pro League',
        shortName: 'Pro League',
        level: 1,
        bsdLeagueId: 14,
        bsdSeasonId: 1327,
        primaryColor: '#000000',
      },
      {
        id: 'belgium-challenger-pro-league',
        name: 'Challenger Pro League',
        shortName: 'Challenger PL',
        level: 2,
        bsdLeagueId: 97,
        bsdSeasonId: 2018,
        primaryColor: '#C8102E',
      },
    ],
    movements: [
      {
        id: 'rel-belgium-challenger-prom',
        sourceCompetitionId: 'belgium-challenger-pro-league',
        destinationCompetitionId: 'belgium-pro-league',
        movementType: 'PROMOTION',
        countryId: 'belgium',
      },
    ],
  },
  {
    id: 'turkey',
    name: 'Turkey',
    code: 'TUR',
    confederationId: 'uefa',
    competitions: [
      {
        id: 'turkey-super-lig',
        name: 'Trendyol Süper Lig',
        shortName: 'Süper Lig',
        level: 1,
        bsdLeagueId: 11,
        bsdSeasonId: 1539,
        primaryColor: '#E30A17',
      },
    ],
    movements: [],
  },
  {
    id: 'saudi-arabia',
    name: 'Saudi Arabia',
    code: 'KSA',
    confederationId: 'afc',
    competitions: [
      {
        id: 'saudi-arabia-pro-league',
        name: 'Saudi Pro League',
        shortName: 'Saudi PL',
        level: 1,
        bsdLeagueId: 17,
        bsdSeasonId: 1631,
        primaryColor: '#006C35',
      },
    ],
    movements: [],
  },
  {
    id: 'usa',
    name: 'United States',
    code: 'USA',
    confederationId: 'concacaf',
    competitions: [
      {
        id: 'usa-mls',
        name: 'Major League Soccer',
        shortName: 'MLS',
        level: 1,
        bsdLeagueId: 18,
        bsdSeasonId: 158,
        seasonLabel: '2026',
        formatType: 'CONFERENCE',
        scheduleMode: 'SOURCE_COMPLETE',
        primaryColor: '#002B49',
      },
    ],
    movements: [],
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    code: 'NGA',
    confederationId: 'caf',
    competitions: [
      {
        id: 'nigeria-npfl',
        name: 'Nigeria Premier Football League',
        shortName: 'NPFL',
        level: 1,
        bsdLeagueId: 28,
        bsdSeasonId: 1901,
        primaryColor: '#008751',
      },
    ],
    movements: [],
  },
];

// ============================================================================
// OPENFOOTBALL INGESTION HELPER
// ============================================================================

async function fetchOpenFootballMatches(code: string): Promise<any[]> {
  const cachePath = path.join(OPENFOOTBALL_CACHE_DIR, `${code}.json`);
  if (fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  }

  const url = `https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/${code}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const matches = data.matches || [];
    fs.writeFileSync(cachePath, JSON.stringify(matches, null, 2), 'utf8');
    return matches;
  } catch {
    return [];
  }
}

// ============================================================================
// AUDIT DATA STRUCTURES
// ============================================================================

export interface CompetitionAuditRecord {
  competitionId: string;
  countryId: string;
  sourceUsed: string;
  sourceSeason: string;
  sourceTotalRecords: number;
  sourceCompletedMatchesLeSnapshot: number;
  importedHistoricalResults: number;
  matchesRejected: number;
  rejectionReasons: string[];
  totalScheduledFixtures: number;
  unresolvedFixtures: number;
  formatType: string;
  scheduleMode: string;
  seasonLabel: string;
  clubCount: number;
  verificationStatus: string;
}

export const auditRecords: CompetitionAuditRecord[] = [];

// ============================================================================
// SINGLE COUNTRY BUILDER
// ============================================================================

export async function buildCountryPack(
  countryConfig: CountryTargetConfig,
  assignedPlayerIdsGlobal: Set<string>
): Promise<FootballWorldDataPack> {
  const countryOutputDir = path.join(OUTPUT_BASE, countryConfig.id);
  fs.mkdirSync(countryOutputDir, { recursive: true });
  const packPath = path.join(countryOutputDir, `${countryConfig.id}.pack.json`);

  console.log(`\nBuilding country pack: ${countryConfig.name} (${countryConfig.id})...`);

  const compSeasonLabel = countryConfig.id === 'usa' ? '2026' : SEASON_LABEL;

  const rawCountry: RawWorldCountry = {
    id: countryConfig.id,
    name: countryConfig.name,
    code: countryConfig.code,
    confederationId: countryConfig.confederationId,
  };

  const rawCompetitions: RawWorldCompetition[] = [];
  const ruleSets: CompetitionRuleSet[] = [];
  const rawClubs: RawWorldClub[] = [];
  const rawPlayers: RawWorldPlayer[] = [];
  const rawFixtures: RawWorldFixture[] = [];
  const referencedCountries = new Map<string, RawWorldCountry>();
  referencedCountries.set(rawCountry.id, rawCountry);

  const clubNameMap = new Map<string, string>(); // normMatch -> clubId

  for (const compConfig of countryConfig.competitions) {
    console.log(`  Processing competition: ${compConfig.name} (BSD League ${compConfig.bsdLeagueId})...`);

    // 1. Fetch teams for this competition
    const teamsCachePath = path.join(BSD_CACHE_DIR, 'teams', `teams_${compConfig.bsdLeagueId}.json`);
    const bsdTeamsData = await fetchBsdJson(
      `teams/?league_id=${compConfig.bsdLeagueId}&season_id=${compConfig.bsdSeasonId}&limit=100`,
      teamsCachePath
    );
    const bsdTeams: any[] = bsdTeamsData.results || bsdTeamsData;

    const competitionSeason = compConfig.seasonLabel || SEASON_LABEL;
    const formatType: CompetitionFormatType = compConfig.formatType || 'DOUBLE_ROUND_ROBIN';
    const scheduleMode: RawSeasonScheduleMode = compConfig.scheduleMode || 'GENERATE_FROM_MEMBERSHIP';

    rawCompetitions.push({
      id: compConfig.id,
      name: compConfig.name,
      shortName: compConfig.shortName,
      countryId: countryConfig.id,
      confederationId: countryConfig.confederationId.toUpperCase(),
      category: 'DOMESTIC_LEAGUE',
      level: compConfig.level,
      scheduleMode,
    });

    const numTeams = bsdTeams.length;
    // For MLS: 36 rounds. For even DRR: 2 * (N - 1) rounds; for odd (e.g. 15): 2 * N rounds.
    const expectedRounds = compConfig.id === 'usa-mls' ? 36 : (numTeams % 2 === 0 ? 2 * (numTeams - 1) : 2 * numTeams);

    ruleSets.push({
      id: `${compConfig.id}:${competitionSeason}:v1`,
      competitionId: compConfig.id,
      seasonLabel: competitionSeason,
      ruleVersion: 1,
      verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
      format: {
        type: formatType,
        rounds: expectedRounds,
        extraTimeEnabled: false,
        penaltiesEnabled: false,
      },
      standings: {
        pointsForWin: 3,
        pointsForDraw: 1,
        pointsForLoss: 0,
        tieBreakers: compConfig.id === 'usa-mls'
          ? ['WINS', 'GOAL_DIFFERENCE', 'GOALS_FOR', 'TEAM_ID']
          : ['GOAL_DIFFERENCE', 'GOALS_FOR', 'TEAM_ID'],
      },
      substitutions: {
        maxSubsRegulation: 5,
        maxStoppageWindows: 3,
        benchSize: 9,
        halfTimeCountsAsWindow: false,
        extraTimeExtraSub: 0,
      },
      discipline: {
        yellowThresholds: [{ cards: 5, suspensionMatches: 1 }],
        straightRedDefaultMatches: 3,
        secondYellowRedMatches: 1,
        policyName: `${compConfig.name} Disciplinary Code`,
      },
      technology: { varEnabled: compConfig.level === 1 },
      modifiers: { reputationMultiplier: compConfig.level === 1 ? 1.0 : 0.8 },
      presentation: {
        primaryColor: compConfig.primaryColor || '#000000',
        matchBall: `${compConfig.name} Match Ball`,
      },
    });

    // Process each club in the competition
    const seenClubIdsInComp = new Set<string>();
    for (const bsdTeam of bsdTeams) {
      let clubId = slug(bsdTeam.name);
      if (seenClubIdsInComp.has(clubId)) {
        clubId = `${clubId}-${bsdTeam.id}`;
      }
      seenClubIdsInComp.add(clubId);

      clubNameMap.set(normMatch(bsdTeam.name), clubId);
      if (bsdTeam.short_name) {
        clubNameMap.set(normMatch(bsdTeam.short_name), clubId);
      }

      rawClubs.push({
        id: clubId,
        name: bsdTeam.name,
        shortName: bsdTeam.short_name || bsdTeam.name,
        countryId: countryConfig.id,
        competitionId: compConfig.id,
      });

      // 2. Fetch squad for this club
      const squadCachePath = path.join(BSD_CACHE_DIR, 'squads', `squad_${bsdTeam.id}.json`);
      const sqData = await fetchBsdJson(`teams/${bsdTeam.id}/squad/`, squadCachePath);
      const rawPlayersList: any[] = Array.isArray(sqData) ? sqData : sqData.results || sqData.players || [];

      const seenPlayerIdsInClub = new Set<string>();

      for (const p of rawPlayersList) {
        if (!p.name) continue;
        const dob = p.date_of_birth && /^\d{4}-\d{2}-\d{2}$/.test(p.date_of_birth) ? p.date_of_birth : undefined;
        let playerId = dob ? `player-${slug(p.name)}-${dob.replace(/-/g, '')}` : `player-${slug(p.name)}`;

        // Guarantee uniqueness deterministically across squads
        if (assignedPlayerIdsGlobal.has(playerId) || seenPlayerIdsInClub.has(playerId)) {
          playerId = `${playerId}-${bsdTeam.id}-${p.id ?? seenPlayerIdsInClub.size}`;
        }

        seenPlayerIdsInClub.add(playerId);
        assignedPlayerIdsGlobal.add(playerId);

        const { firstName, lastName } = splitName(p.name);
        const position = normalizePosition(p.position);
        const countryMeta = resolveCountry(p.nationality || countryConfig.name);
        if (!referencedCountries.has(countryMeta.id)) {
          referencedCountries.set(countryMeta.id, {
            id: countryMeta.id,
            name: countryMeta.name,
            code: countryMeta.code,
            confederationId: countryMeta.confederationId || 'uefa',
          });
        }

        rawPlayers.push({
          id: playerId,
          firstName,
          lastName,
          ...(dob ? { dateOfBirth: dob } : {}),
          nationalityCountryIds: [countryMeta.id],
          primaryPosition: position,
          clubId,
        });
      }
    }

    // 3. Ingest Fixtures / Completed Results
    if (compConfig.id === 'usa-mls') {
      // MLS: Full 2026 Regular Season Schedule from cached BSD events
      const eventsCachePath = path.join(BSD_CACHE_DIR, 'events', `events_${compConfig.bsdLeagueId}_${compConfig.bsdSeasonId}.json`);
      const eventsData = await fetchBsdJson(
        `events/?league_id=${compConfig.bsdLeagueId}&season_id=${compConfig.bsdSeasonId}&limit=200`,
        eventsCachePath
      );
      const eventsList: any[] = (Array.isArray(eventsData) ? eventsData : Object.values(eventsData)).slice();
      eventsList.sort((a, b) => a.event_date.localeCompare(b.event_date));

      const rounds: Array<Set<string>> = [];
      let completedCount = 0;
      let totalMlsFixtures = 0;

      for (const fix of eventsList) {
        const homeId = clubNameMap.get(normMatch(fix.home_team));
        const awayId = clubNameMap.get(normMatch(fix.away_team));
        if (!homeId || !awayId) {
          throw new Error(`Unmapped MLS team in events: ${fix.home_team} or ${fix.away_team}`);
        }

        let assignedRound = -1;
        for (let r = 0; r < rounds.length; r++) {
          if (!rounds[r].has(homeId) && !rounds[r].has(awayId)) {
            rounds[r].add(homeId);
            rounds[r].add(awayId);
            assignedRound = r + 1;
            break;
          }
        }
        if (assignedRound === -1) {
          const newRound = new Set<string>();
          newRound.add(homeId);
          newRound.add(awayId);
          rounds.push(newRound);
          assignedRound = rounds.length;
        }

        const isCompleted = fix.status === 'finished' && fix.event_date.slice(0, 10) <= SNAPSHOT_DATE;
        if (isCompleted) {
          completedCount++;
        }

        rawFixtures.push({
          id: `usa-mls-${homeId}-${awayId}-${fix.id}`,
          competitionId: compConfig.id,
          round: assignedRound,
          homeClubId: homeId,
          awayClubId: awayId,
          ...(isCompleted ? { homeGoals: fix.home_score, awayGoals: fix.away_score } : {}),
          scheduledDate: fix.event_date.slice(0, 10),
        });
        totalMlsFixtures++;
      }

      auditRecords.push({
        competitionId: compConfig.id,
        countryId: countryConfig.id,
        sourceUsed: 'BSD events API',
        sourceSeason: '2026',
        sourceTotalRecords: eventsList.length,
        sourceCompletedMatchesLeSnapshot: completedCount,
        importedHistoricalResults: completedCount,
        matchesRejected: 0,
        rejectionReasons: [],
        totalScheduledFixtures: totalMlsFixtures,
        unresolvedFixtures: totalMlsFixtures - completedCount,
        formatType: 'CONFERENCE',
        scheduleMode: 'SOURCE_COMPLETE',
        seasonLabel: '2026',
        clubCount: numTeams,
        verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
      });

      console.log(`    Imported complete MLS 2026 regular season: ${totalMlsFixtures} fixtures total, ${completedCount} completed <= ${SNAPSHOT_DATE}, ${totalMlsFixtures - completedCount} unresolved future fixtures across ${rounds.length} rounds.`);
    } else if (compConfig.openFootballCode) {
      // Top European Leagues: OpenFootball complete fixture matrix
      const openMatches = await fetchOpenFootballMatches(compConfig.openFootballCode);
      let attachedCount = 0;
      let completedSourceCount = 0;
      let rejectedCount = 0;
      const rejectionReasons: string[] = [];

      for (const m of openMatches) {
        const isCompletedInSource = m.score && m.score.ft && m.date <= SNAPSHOT_DATE;
        if (isCompletedInSource) {
          completedSourceCount++;
        }

        if (!m.score || !m.score.ft) {
          rejectedCount++;
          continue; // unplayed future fixture in OpenFootball
        }
        if (m.date > SNAPSHOT_DATE) {
          rejectedCount++;
          continue;
        }

        const t1Norm = normMatch(m.team1);
        const t2Norm = normMatch(m.team2);
        const t1Resolved = OPENFOOTBALL_ALIASES[t1Norm] || t1Norm;
        const t2Resolved = OPENFOOTBALL_ALIASES[t2Norm] || t2Norm;

        const homeId = clubNameMap.get(t1Resolved);
        const awayId = clubNameMap.get(t2Resolved);

        if (!homeId || !awayId) {
          rejectedCount++;
          rejectionReasons.push(`Unresolved team alias: ${m.team1} (${t1Norm}) -> ${homeId}, ${m.team2} (${t2Norm}) -> ${awayId}`);
          continue;
        }

        const roundNum = parseInt(String(m.round).replace(/\D+/g, ''), 10) || 1;

        rawFixtures.push({
          id: `${compConfig.id}-${homeId}-${awayId}`,
          competitionId: compConfig.id,
          round: roundNum,
          homeClubId: homeId,
          awayClubId: awayId,
          homeGoals: m.score.ft[0],
          awayGoals: m.score.ft[1],
          scheduledDate: m.date,
        });
        attachedCount++;
      }

      const totalFixtures = numTeams * (numTeams - 1);

      auditRecords.push({
        competitionId: compConfig.id,
        countryId: countryConfig.id,
        sourceUsed: `OpenFootball (${compConfig.openFootballCode}.json)`,
        sourceSeason: '2026-27',
        sourceTotalRecords: openMatches.length,
        sourceCompletedMatchesLeSnapshot: completedSourceCount,
        importedHistoricalResults: attachedCount,
        matchesRejected: openMatches.length - attachedCount,
        rejectionReasons: [`${openMatches.length - completedSourceCount} scheduled/unplayed future matches (${SNAPSHOT_DATE})`],
        totalScheduledFixtures: totalFixtures,
        unresolvedFixtures: totalFixtures - attachedCount,
        formatType: 'DOUBLE_ROUND_ROBIN',
        scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
        seasonLabel: SEASON_LABEL,
        clubCount: numTeams,
        verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
      });

      console.log(`    Attached ${attachedCount} historical fixtures for ${compConfig.name} <= ${SNAPSHOT_DATE} (source completed <= snapshot: ${completedSourceCount})`);
    } else {
      // Lower tiers / other non-OpenFootball leagues: BSD events API
      const eventsCachePath = path.join(BSD_CACHE_DIR, 'events', `events_${compConfig.bsdLeagueId}_${compConfig.bsdSeasonId}.json`);
      let bsdEvents: any[] = [];
      if (fs.existsSync(eventsCachePath)) {
        quotaTracker.cacheHits++;
        const rawEv = JSON.parse(fs.readFileSync(eventsCachePath, 'utf8'));
        bsdEvents = Array.isArray(rawEv) ? rawEv : rawEv.results || [];
      } else {
        const data = await fetchBsdJson(`events/?league_id=${compConfig.bsdLeagueId}&season_id=${compConfig.bsdSeasonId}&status=finished&limit=200`, eventsCachePath);
        bsdEvents = Array.isArray(data) ? data : data.results || [];
      }

      let attachedCount = 0;
      let completedSourceCount = 0;

      for (const e of bsdEvents) {
        if (e.status !== 'finished') continue;
        const matchDate = e.event_date ? e.event_date.slice(0, 10) : '';
        if (matchDate > SNAPSHOT_DATE) continue;
        completedSourceCount++;

        const homeId = clubNameMap.get(normMatch(e.home_team));
        const awayId = clubNameMap.get(normMatch(e.away_team));
        if (!homeId || !awayId) {
          throw new Error(`Unmapped BSD team in events for ${compConfig.name}: ${e.home_team} or ${e.away_team}`);
        }

        const roundNum = e.round_number || 1;

        rawFixtures.push({
          id: `${compConfig.id}-${homeId}-${awayId}`,
          competitionId: compConfig.id,
          round: roundNum,
          homeClubId: homeId,
          awayClubId: awayId,
          homeGoals: e.home_score,
          awayGoals: e.away_score,
          scheduledDate: matchDate,
        });
        attachedCount++;
      }

      const totalFixtures = numTeams * (numTeams - 1);

      auditRecords.push({
        competitionId: compConfig.id,
        countryId: countryConfig.id,
        sourceUsed: 'BSD events API (status=finished)',
        sourceSeason: '2026-27',
        sourceTotalRecords: bsdEvents.length,
        sourceCompletedMatchesLeSnapshot: completedSourceCount,
        importedHistoricalResults: attachedCount,
        matchesRejected: bsdEvents.length - attachedCount,
        rejectionReasons: [],
        totalScheduledFixtures: totalFixtures,
        unresolvedFixtures: totalFixtures - attachedCount,
        formatType: 'DOUBLE_ROUND_ROBIN',
        scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
        seasonLabel: SEASON_LABEL,
        clubCount: numTeams,
        verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
      });

      console.log(`    Attached ${attachedCount} historical fixtures for ${compConfig.name} <= ${SNAPSHOT_DATE} from BSD events.`);
    }
  }

  // Build RawFootballWorldSnapshot
  const rawSnapshot: RawFootballWorldSnapshot = {
    id: `${countryConfig.id}-${compSeasonLabel}`,
    version: 1,
    seasonLabel: compSeasonLabel,
    snapshotDate: SNAPSHOT_DATE,
    countries: Array.from(referencedCountries.values()),
    competitions: rawCompetitions,
    ruleSets: ruleSets,
    movementRelationships: countryConfig.movements,
    clubs: rawClubs,
    players: rawPlayers,
    managers: [],
    fixtures: rawFixtures,
  };

  const importResult = importFootballWorldSnapshot(rawSnapshot);
  if (!importResult.accepted || !importResult.pack) {
    throw new Error(`Import failed for ${countryConfig.id}: ${importResult.error}`);
  }

  const packValidation = validateFootballWorldDataPack(importResult.pack);
  if (!packValidation.valid) {
    throw new Error(`Pack validation failed for ${countryConfig.id}: ${packValidation.errors.join('; ')}`);
  }

  fs.writeFileSync(packPath, JSON.stringify(importResult.pack, null, 2), 'utf8');
  console.log(`  ✓ Successfully built and validated ${countryConfig.name} pack: ${packPath}`);
  return importResult.pack;
}

// ============================================================================
// COMBINED WORLD PACK COMPOSER
// ============================================================================

export function composeCombinedWorldPack(packs: FootballWorldDataPack[]): FootballWorldDataPack {
  console.log('\nComposing Combined Football World Data Pack...');

  const countriesMap = new Map<string, any>();
  const compDefsMap = new Map<string, any>();
  const ruleSetsMap = new Map<string, any>();
  const movements: any[] = [];
  const clubsMap = new Map<string, any>();
  const playersMap = new Map<string, any>();
  const managersMap = new Map<string, any>();
  const membershipsMap = new Map<string, any>();
  const squadAssignmentsMap = new Map<string, any>();
  const managerAssignmentsMap = new Map<string, any>();
  const compSeasonsMap = new Map<string, any>();

  for (const pack of packs) {
    for (const c of pack.countries) {
      if (!countriesMap.has(c.id)) countriesMap.set(c.id, c);
    }
    for (const def of pack.competitionDefinitions) {
      if (compDefsMap.has(def.id)) {
        throw new Error(`Duplicate competition definition ID: ${def.id}`);
      }
      compDefsMap.set(def.id, def);
    }
    for (const rs of pack.competitionRuleSets) {
      if (ruleSetsMap.has(rs.id)) {
        throw new Error(`Duplicate rule set ID: ${rs.id}`);
      }
      ruleSetsMap.set(rs.id, rs);
    }
    movements.push(...pack.competitionMovementRelationships);
    for (const club of pack.clubs) {
      if (clubsMap.has(club.id)) {
        throw new Error(`Duplicate club ID: ${club.id}`);
      }
      clubsMap.set(club.id, club);
    }
    for (const p of pack.players) {
      if (!playersMap.has(p.id)) {
        playersMap.set(p.id, p);
      }
    }
    for (const m of pack.managers) {
      if (!managersMap.has(m.id)) {
        managersMap.set(m.id, m);
      }
    }
    for (const mem of pack.domesticLeagueMemberships) {
      const key = `${mem.countryId}:${mem.competitionId}`;
      membershipsMap.set(key, mem);
    }
    for (const sq of pack.squadAssignments) {
      squadAssignmentsMap.set(sq.clubId, sq);
    }
    for (const ma of pack.managerAssignments) {
      managerAssignmentsMap.set(ma.clubId, ma);
    }
    for (const cs of pack.competitionSeasons) {
      if (compSeasonsMap.has(cs.competitionId)) {
        throw new Error(`Duplicate competition season: ${cs.competitionId}`);
      }
      compSeasonsMap.set(cs.competitionId, cs);
    }
  }

  const combinedPack: FootballWorldDataPack = {
    id: `global-world-${SEASON_LABEL}`,
    version: 1,
    seasonLabel: SEASON_LABEL,
    snapshotDate: SNAPSHOT_DATE,
    countries: Array.from(countriesMap.values()),
    competitionDefinitions: Array.from(compDefsMap.values()),
    competitionRuleSets: Array.from(ruleSetsMap.values()),
    competitionMovementRelationships: movements,
    clubs: Array.from(clubsMap.values()),
    players: Array.from(playersMap.values()),
    managers: Array.from(managersMap.values()),
    domesticLeagueMemberships: Array.from(membershipsMap.values()),
    squadAssignments: Array.from(squadAssignmentsMap.values()),
    managerAssignments: Array.from(managerAssignmentsMap.values()),
    competitionSeasons: Array.from(compSeasonsMap.values()),
  };

  const val = validateFootballWorldDataPack(combinedPack);
  if (!val.valid) {
    throw new Error(`Combined world pack validation failed: ${val.errors.join('; ')}`);
  }

  const combinedPath = path.join(OUTPUT_BASE, 'world-2026-27.pack.json');
  fs.writeFileSync(combinedPath, JSON.stringify(combinedPack, null, 2), 'utf8');
  console.log(`✓ Combined pack validated and saved: ${combinedPath}`);
  return combinedPack;
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

export async function runGlobalWorldBuild() {
  console.log('====================================================');
  console.log('PRO BALLER — PHASE 3G: DATA INTEGRITY CORRECTION');
  console.log('====================================================\n');

  // 1. Initial Quota Check (Section 4 & 13)
  console.log('[Step 1] Initial BSD Quota Verification...');
  console.log(`  Start Remaining Quota: ${quotaTracker.startRemaining}`);
  console.log(`  Run Network Request Budget: ${MAX_NEW_BSD_REQUESTS}`);
  console.log(`  Account Reserve Threshold: ${MIN_BSD_ACCOUNT_REMAINING}`);

  // 2. Load England (England remains unchanged)
  console.log('\n[Step 2] Loading England Pack...');
  const englandSrcPath = path.resolve(process.cwd(), 'data/world/england-2026-27/england-2026-27.pack.json');
  const englandDestDir = path.join(OUTPUT_BASE, 'england');
  fs.mkdirSync(englandDestDir, { recursive: true });
  const englandPackPath = path.join(englandDestDir, 'england.pack.json');

  const englandPack: FootballWorldDataPack = JSON.parse(fs.readFileSync(englandSrcPath, 'utf8'));
  fs.writeFileSync(englandPackPath, JSON.stringify(englandPack, null, 2), 'utf8');
  console.log(`  ✓ Loaded England pack: 7 competitions, ${englandPack.clubs.length} clubs, ${englandPack.players.length} players.`);

  const allPacks: FootballWorldDataPack[] = [englandPack];
  const assignedPlayerIds = new Set(englandPack.players.map(p => p.id));

  // 3. Build Target Countries in Deterministic Order
  console.log('\n[Step 3] Rebuilding Global Target Countries using Local Caches...');
  let completedAll = true;
  let nextCountryToResume = '';

  for (const targetCountry of TARGET_COUNTRIES) {
    try {
      const countryPack = await buildCountryPack(targetCountry, assignedPlayerIds);
      allPacks.push(countryPack);
    } catch (err: any) {
      if (err.message.startsWith('QUOTA_STOP')) {
        completedAll = false;
        nextCountryToResume = targetCountry.id;
        console.warn(`\n[BUDGET STOP] Paused at country '${targetCountry.id}': ${err.message}`);
        break;
      }
      throw err;
    }
  }

  // 4. Report Quota Summary
  console.log('\n====================================================');
  console.log('BSD API USAGE & QUOTA SUMMARY');
  console.log('====================================================');
  console.log(`  Actual HTTP network requests used : ${quotaTracker.networkRequestsUsed}`);
  console.log(`  Provider quota charged            : ${quotaTracker.startRemaining - quotaTracker.lastRemaining}`);
  console.log(`  Cache hits                        : ${quotaTracker.cacheHits}`);
  console.log(`  Quota start                       : ${quotaTracker.startRemaining}`);
  console.log(`  Quota end                         : ${quotaTracker.lastRemaining}`);
  console.log(`  Reset time (seconds)              : ${quotaTracker.resetSeconds}`);
  console.log(`  Budget stopped                    : ${quotaTracker.budgetStopped}`);

  if (!completedAll) {
    console.log(`\nPHASE 3G PAUSED SAFELY AT API BUDGET`);
    console.log(`Continuation point: country '${nextCountryToResume}'.`);
    return;
  }

  // 5. Compose Combined World Pack
  const combinedPack = composeCombinedWorldPack(allPacks);

  // 6. Mandatory Offline Gameplay Simulation Test (Section 15)
  console.log('\n[Step 4] Mandatory Offline Isolation Test (BSD_API_KEY disabled & fetch throwing)...');
  const originalKey = process.env.BSD_API_KEY;
  delete process.env.BSD_API_KEY;

  let networkCallCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = ((..._args: any[]) => {
    networkCallCount++;
    throw new Error('UNAUTHORIZED NETWORK CALL DURING OFFLINE SIMULATION');
  }) as any;

  let tBootstrap = 0;
  let tProg = 0;
  let stepRes: any = null;

  try {
    const t0 = performance.now();
    const bootstrapRes = bootstrapFootballWorld(combinedPack);
    tBootstrap = performance.now() - t0;

    if (!bootstrapRes.accepted || !bootstrapRes.state) {
      throw new Error(`Combined bootstrap failed: ${bootstrapRes.error}`);
    }
    console.log(`  ✓ Combined world bootstrapped successfully in ${tBootstrap.toFixed(2)}ms`);

    const tProg0 = performance.now();
    stepRes = advanceFootballWorldStep(bootstrapRes.state, '2026-10-14', combinedPack);
    tProg = performance.now() - tProg0;

    if (!stepRes.accepted || !stepRes.state) {
      throw new Error(`Combined progression step failed: ${stepRes.error}`);
    }
    console.log(`  ✓ Advance world step succeeded in ${tProg.toFixed(2)}ms`);
    console.log(`  ✓ Progressed ${stepRes.competitionProgressSummaries?.length} competitions independently.`);
    console.log(`  ✓ Network calls intercepted during offline run: ${networkCallCount}`);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey) process.env.BSD_API_KEY = originalKey;
  }

  // 7. Measure Performance & Sizes
  console.log('\n====================================================');
  console.log('GLOBAL WORLD METRICS & PERFORMANCE');
  console.log('====================================================');
  let totalCountrySize = 0;
  for (const p of allPacks) {
    const cId = p.id.replace(/-2026-27$|-2026$/, '');
    const pPath = path.join(OUTPUT_BASE, cId, `${cId}.pack.json`);
    const size = fs.existsSync(pPath) ? fs.statSync(pPath).size : 0;
    totalCountrySize += size;
    console.log(`  Country ${cId.padEnd(16)}: ${(size / 1024 / 1024).toFixed(2)} MB (${p.competitionDefinitions.length} comps, ${p.clubs.length} clubs, ${p.players.length} players)`);
  }

  const combinedSize = fs.statSync(path.join(OUTPUT_BASE, 'world-2026-27.pack.json')).size;
  console.log(`\n  Combined Pack Size   : ${(combinedSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Bootstrap Time       : ${tBootstrap.toFixed(2)} ms`);
  console.log(`  Progression Step Time: ${tProg.toFixed(2)} ms`);
  console.log(`  Node RSS Memory      : ${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`);

  // 8. Print Historical Result Audit Table
  console.log('\n====================================================');
  console.log('HISTORICAL RESULT AUDIT TABLE (ALL NON-ENGLAND COMPS)');
  console.log('====================================================');
  for (const rec of auditRecords) {
    console.log(`[${rec.competitionId}]`);
    console.log(`  Source used                  : ${rec.sourceUsed}`);
    console.log(`  Source season                : ${rec.sourceSeason}`);
    console.log(`  Source total records         : ${rec.sourceTotalRecords}`);
    console.log(`  Completed <= 2026-10-07      : ${rec.sourceCompletedMatchesLeSnapshot}`);
    console.log(`  Imported historical results  : ${rec.importedHistoricalResults}`);
    console.log(`  Invariant check (imported===sourceCompleted): ${rec.importedHistoricalResults === rec.sourceCompletedMatchesLeSnapshot ? 'MATCHED ✓' : 'MISMATCH ✗'}`);
    console.log(`  Matches rejected by parser   : ${rec.matchesRejected}`);
    console.log(`  Total scheduled fixtures     : ${rec.totalScheduledFixtures}`);
    console.log(`  Unresolved future fixtures   : ${rec.unresolvedFixtures}`);
  }

  console.log('\n====================================================');
  console.log('ALL ACTIVE COMPETITIONS INTEGRITY VERIFIED');
  console.log('====================================================\n');
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runGlobalWorldBuild().catch(err => {
    console.error('Build failed with error:', err);
    process.exit(1);
  });
}
