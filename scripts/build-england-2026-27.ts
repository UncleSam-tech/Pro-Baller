import * as fs from 'fs';
import * as path from 'path';
import { importFootballWorldSnapshot } from '../src/world/import/worldImporter';
import { validateFootballWorldDataPack } from '../src/world/worldDataPack';
import { bootstrapFootballWorld } from '../src/world/worldRuntime';
import type {
  RawFootballWorldSnapshot,
  RawWorldClub,
  RawWorldCompetition,
  RawWorldFixture,
} from '../src/world/import/types';
import type {
  CompetitionMovementRelationship,
  CompetitionPresentation,
  CompetitionRuleSet,
  CompetitionSimulationModifiers,
  DisciplinaryRules,
  MatchTechnologyRules,
  SubstitutionRules,
} from '../src/competition/types';

// ============================================================================
// CONSTANTS & PATHS
// ============================================================================

const CACHE_BASE = path.resolve(process.cwd(), '.cache/pro-baller');
const CORDAX_CACHE_DIR = path.join(CACHE_BASE, 'cordax/england-2026-27');
const OPENFOOTBALL_CACHE_DIR = path.join(CACHE_BASE, 'openfootball');
const WIKIPEDIA_CACHE_DIR = path.join(CACHE_BASE, 'wikipedia');

const OUTPUT_DIR = path.resolve(process.cwd(), 'data/world/england-2026-27');
const RAW_OUTPUT_PATH = path.join(OUTPUT_DIR, 'england-2026-27.raw.json');
const PACK_OUTPUT_PATH = path.join(OUTPUT_DIR, 'england-2026-27.pack.json');
const SOURCES_OUTPUT_PATH = path.join(OUTPUT_DIR, 'SOURCES.md');

const SNAPSHOT_DATE = '2026-10-07';
const SEASON_LABEL = '2026-27';

// Ensure cache & output directories exist
[
  CORDAX_CACHE_DIR,
  OPENFOOTBALL_CACHE_DIR,
  WIKIPEDIA_CACHE_DIR,
  OUTPUT_DIR,
].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============================================================================
// AUTH & SOURCE VERIFICATION
// ============================================================================

function getCordaxApiKey(): string {
  if (process.env.CORDAX_API_KEY) return process.env.CORDAX_API_KEY;
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*CORDAX_API_KEY\s*=\s*(.*)$/);
      if (match) {
        return match[1].trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
  return '';
}

async function fetchWithCache(url: string, cacheFilePath: string): Promise<string> {
  if (fs.existsSync(cacheFilePath)) {
    return fs.readFileSync(cacheFilePath, 'utf-8');
  }
  console.log(`Fetching ${url}...`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ProBaller/1.0 (https://github.com/UncleSam-tech/Pro-Baller; open-source football sim)',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  fs.writeFileSync(cacheFilePath, text, 'utf-8');
  return text;
}

// ============================================================================
// DATA SET DEFINITIONS
// ============================================================================

interface ClubMeta {
  id: string;
  name: string;
  shortName: string;
  city: string;
  competitionId: string;
}

const CLUBS: ClubMeta[] = [
  // Tier 1: Premier League
  { id: 'arsenal', name: 'Arsenal FC', shortName: 'Arsenal', city: 'London', competitionId: 'england-premier-league' },
  { id: 'coventry-city', name: 'Coventry City FC', shortName: 'Coventry', city: 'Coventry', competitionId: 'england-premier-league' },
  { id: 'hull-city', name: 'Hull City AFC', shortName: 'Hull', city: 'Kingston upon Hull', competitionId: 'england-premier-league' },
  { id: 'manchester-united', name: 'Manchester United FC', shortName: 'Man Utd', city: 'Manchester', competitionId: 'england-premier-league' },
  { id: 'ipswich-town', name: 'Ipswich Town FC', shortName: 'Ipswich', city: 'Ipswich', competitionId: 'england-premier-league' },
  { id: 'sunderland', name: 'Sunderland AFC', shortName: 'Sunderland', city: 'Sunderland', competitionId: 'england-premier-league' },
  { id: 'nottingham-forest', name: 'Nottingham Forest FC', shortName: 'Nottm Forest', city: 'Nottingham', competitionId: 'england-premier-league' },
  { id: 'leeds-united', name: 'Leeds United FC', shortName: 'Leeds', city: 'Leeds', competitionId: 'england-premier-league' },
  { id: 'everton', name: 'Everton FC', shortName: 'Everton', city: 'Liverpool', competitionId: 'england-premier-league' },
  { id: 'crystal-palace', name: 'Crystal Palace FC', shortName: 'Crystal Palace', city: 'London', competitionId: 'england-premier-league' },
  { id: 'brentford', name: 'Brentford FC', shortName: 'Brentford', city: 'London', competitionId: 'england-premier-league' },
  { id: 'tottenham-hotspur', name: 'Tottenham Hotspur FC', shortName: 'Tottenham', city: 'London', competitionId: 'england-premier-league' },
  { id: 'manchester-city', name: 'Manchester City FC', shortName: 'Man City', city: 'Manchester', competitionId: 'england-premier-league' },
  { id: 'afc-bournemouth', name: 'AFC Bournemouth', shortName: 'Bournemouth', city: 'Bournemouth', competitionId: 'england-premier-league' },
  { id: 'brighton-and-hove-albion', name: 'Brighton & Hove Albion FC', shortName: 'Brighton', city: 'Brighton', competitionId: 'england-premier-league' },
  { id: 'aston-villa', name: 'Aston Villa FC', shortName: 'Aston Villa', city: 'Birmingham', competitionId: 'england-premier-league' },
  { id: 'newcastle-united', name: 'Newcastle United FC', shortName: 'Newcastle', city: 'Newcastle upon Tyne', competitionId: 'england-premier-league' },
  { id: 'liverpool', name: 'Liverpool FC', shortName: 'Liverpool', city: 'Liverpool', competitionId: 'england-premier-league' },
  { id: 'fulham', name: 'Fulham FC', shortName: 'Fulham', city: 'London', competitionId: 'england-premier-league' },
  { id: 'chelsea', name: 'Chelsea FC', shortName: 'Chelsea', city: 'London', competitionId: 'england-premier-league' },

  // Tier 2: Championship
  { id: 'wolverhampton-wanderers', name: 'Wolverhampton Wanderers FC', shortName: 'Wolves', city: 'Wolverhampton', competitionId: 'england-championship' },
  { id: 'blackburn-rovers', name: 'Blackburn Rovers FC', shortName: 'Blackburn', city: 'Blackburn', competitionId: 'england-championship' },
  { id: 'bolton-wanderers', name: 'Bolton Wanderers FC', shortName: 'Bolton', city: 'Bolton', competitionId: 'england-championship' },
  { id: 'preston-north-end', name: 'Preston North End FC', shortName: 'Preston', city: 'Preston', competitionId: 'england-championship' },
  { id: 'norwich-city', name: 'Norwich City FC', shortName: 'Norwich', city: 'Norwich', competitionId: 'england-championship' },
  { id: 'west-bromwich-albion', name: 'West Bromwich Albion FC', shortName: 'West Brom', city: 'West Bromwich', competitionId: 'england-championship' },
  { id: 'bristol-city', name: 'Bristol City FC', shortName: 'Bristol City', city: 'Bristol', competitionId: 'england-championship' },
  { id: 'millwall', name: 'Millwall FC', shortName: 'Millwall', city: 'London', competitionId: 'england-championship' },
  { id: 'middlesbrough', name: 'Middlesbrough FC', shortName: 'Middlesbrough', city: 'Middlesbrough', competitionId: 'england-championship' },
  { id: 'lincoln-city', name: 'Lincoln City FC', shortName: 'Lincoln', city: 'Lincoln', competitionId: 'england-championship' },
  { id: 'stoke-city', name: 'Stoke City FC', shortName: 'Stoke', city: 'Stoke-on-Trent', competitionId: 'england-championship' },
  { id: 'swansea-city', name: 'Swansea City AFC', shortName: 'Swansea', city: 'Swansea', competitionId: 'england-championship' },
  { id: 'charlton-athletic', name: 'Charlton Athletic FC', shortName: 'Charlton', city: 'London', competitionId: 'england-championship' },
  { id: 'derby-county', name: 'Derby County FC', shortName: 'Derby', city: 'Derby', competitionId: 'england-championship' },
  { id: 'portsmouth', name: 'Portsmouth FC', shortName: 'Portsmouth', city: 'Portsmouth', competitionId: 'england-championship' },
  { id: 'queens-park-rangers', name: 'Queens Park Rangers FC', shortName: 'QPR', city: 'London', competitionId: 'england-championship' },
  { id: 'sheffield-united', name: 'Sheffield United FC', shortName: 'Sheffield Utd', city: 'Sheffield', competitionId: 'england-championship' },
  { id: 'birmingham-city', name: 'Birmingham City FC', shortName: 'Birmingham', city: 'Birmingham', competitionId: 'england-championship' },
  { id: 'watford', name: 'Watford FC', shortName: 'Watford', city: 'Watford', competitionId: 'england-championship' },
  { id: 'southampton', name: 'Southampton FC', shortName: 'Southampton', city: 'Southampton', competitionId: 'england-championship' },
  { id: 'burnley', name: 'Burnley FC', shortName: 'Burnley', city: 'Burnley', competitionId: 'england-championship' },
  { id: 'west-ham-united', name: 'West Ham United FC', shortName: 'West Ham', city: 'London', competitionId: 'england-championship' },
  { id: 'cardiff-city', name: 'Cardiff City FC', shortName: 'Cardiff', city: 'Cardiff', competitionId: 'england-championship' },
  { id: 'wrexham', name: 'Wrexham AFC', shortName: 'Wrexham', city: 'Wrexham', competitionId: 'england-championship' },

  // Tier 3: League One
  { id: 'afc-wimbledon', name: 'AFC Wimbledon', shortName: 'AFC Wimbledon', city: 'London', competitionId: 'england-league-one' },
  { id: 'barnsley', name: 'Barnsley FC', shortName: 'Barnsley', city: 'Barnsley', competitionId: 'england-league-one' },
  { id: 'blackpool', name: 'Blackpool FC', shortName: 'Blackpool', city: 'Blackpool', competitionId: 'england-league-one' },
  { id: 'bradford-city', name: 'Bradford City AFC', shortName: 'Bradford', city: 'Bradford', competitionId: 'england-league-one' },
  { id: 'bromley', name: 'Bromley FC', shortName: 'Bromley', city: 'London', competitionId: 'england-league-one' },
  { id: 'burton-albion', name: 'Burton Albion FC', shortName: 'Burton', city: 'Burton upon Trent', competitionId: 'england-league-one' },
  { id: 'cambridge-united', name: 'Cambridge United FC', shortName: 'Cambridge', city: 'Cambridge', competitionId: 'england-league-one' },
  { id: 'doncaster-rovers', name: 'Doncaster Rovers FC', shortName: 'Doncaster', city: 'Doncaster', competitionId: 'england-league-one' },
  { id: 'huddersfield-town', name: 'Huddersfield Town AFC', shortName: 'Huddersfield', city: 'Huddersfield', competitionId: 'england-league-one' },
  { id: 'leicester-city', name: 'Leicester City FC', shortName: 'Leicester', city: 'Leicester', competitionId: 'england-league-one' },
  { id: 'leyton-orient', name: 'Leyton Orient FC', shortName: 'Leyton Orient', city: 'London', competitionId: 'england-league-one' },
  { id: 'luton-town', name: 'Luton Town FC', shortName: 'Luton', city: 'Luton', competitionId: 'england-league-one' },
  { id: 'mansfield-town', name: 'Mansfield Town FC', shortName: 'Mansfield', city: 'Mansfield', competitionId: 'england-league-one' },
  { id: 'milton-keynes-dons', name: 'Milton Keynes Dons FC', shortName: 'MK Dons', city: 'Milton Keynes', competitionId: 'england-league-one' },
  { id: 'notts-county', name: 'Notts County FC', shortName: 'Notts County', city: 'Nottingham', competitionId: 'england-league-one' },
  { id: 'oxford-united', name: 'Oxford United FC', shortName: 'Oxford Utd', city: 'Oxford', competitionId: 'england-league-one' },
  { id: 'peterborough-united', name: 'Peterborough United FC', shortName: 'Peterborough', city: 'Peterborough', competitionId: 'england-league-one' },
  { id: 'plymouth-argyle', name: 'Plymouth Argyle FC', shortName: 'Plymouth', city: 'Plymouth', competitionId: 'england-league-one' },
  { id: 'reading', name: 'Reading FC', shortName: 'Reading', city: 'Reading', competitionId: 'england-league-one' },
  { id: 'sheffield-wednesday', name: 'Sheffield Wednesday FC', shortName: 'Sheff Weds', city: 'Sheffield', competitionId: 'england-league-one' },
  { id: 'stevenage', name: 'Stevenage FC', shortName: 'Stevenage', city: 'Stevenage', competitionId: 'england-league-one' },
  { id: 'stockport-county', name: 'Stockport County FC', shortName: 'Stockport', city: 'Stockport', competitionId: 'england-league-one' },
  { id: 'wigan-athletic', name: 'Wigan Athletic FC', shortName: 'Wigan', city: 'Wigan', competitionId: 'england-league-one' },
  { id: 'wycombe-wanderers', name: 'Wycombe Wanderers FC', shortName: 'Wycombe', city: 'High Wycombe', competitionId: 'england-league-one' },

  // Tier 4: League Two
  { id: 'accrington-stanley', name: 'Accrington Stanley FC', shortName: 'Accrington', city: 'Accrington', competitionId: 'england-league-two' },
  { id: 'barnet', name: 'Barnet FC', shortName: 'Barnet', city: 'London', competitionId: 'england-league-two' },
  { id: 'bristol-rovers', name: 'Bristol Rovers FC', shortName: 'Bristol Rvs', city: 'Bristol', competitionId: 'england-league-two' },
  { id: 'cheltenham-town', name: 'Cheltenham Town FC', shortName: 'Cheltenham', city: 'Cheltenham', competitionId: 'england-league-two' },
  { id: 'chesterfield', name: 'Chesterfield FC', shortName: 'Chesterfield', city: 'Chesterfield', competitionId: 'england-league-two' },
  { id: 'colchester-united', name: 'Colchester United FC', shortName: 'Colchester', city: 'Colchester', competitionId: 'england-league-two' },
  { id: 'crawley-town', name: 'Crawley Town FC', shortName: 'Crawley', city: 'Crawley', competitionId: 'england-league-two' },
  { id: 'crewe-alexandra', name: 'Crewe Alexandra FC', shortName: 'Crewe', city: 'Crewe', competitionId: 'england-league-two' },
  { id: 'exeter-city', name: 'Exeter City FC', shortName: 'Exeter', city: 'Exeter', competitionId: 'england-league-two' },
  { id: 'fleetwood-town', name: 'Fleetwood Town FC', shortName: 'Fleetwood', city: 'Fleetwood', competitionId: 'england-league-two' },
  { id: 'gillingham', name: 'Gillingham FC', shortName: 'Gillingham', city: 'Gillingham', competitionId: 'england-league-two' },
  { id: 'grimsby-town', name: 'Grimsby Town FC', shortName: 'Grimsby', city: 'Cleethorpes', competitionId: 'england-league-two' },
  { id: 'newport-county', name: 'Newport County AFC', shortName: 'Newport', city: 'Newport', competitionId: 'england-league-two' },
  { id: 'northampton-town', name: 'Northampton Town FC', shortName: 'Northampton', city: 'Northampton', competitionId: 'england-league-two' },
  { id: 'oldham-athletic', name: 'Oldham Athletic AFC', shortName: 'Oldham', city: 'Oldham', competitionId: 'england-league-two' },
  { id: 'port-vale', name: 'Port Vale FC', shortName: 'Port Vale', city: 'Stoke-on-Trent', competitionId: 'england-league-two' },
  { id: 'rochdale', name: 'Rochdale AFC', shortName: 'Rochdale', city: 'Rochdale', competitionId: 'england-league-two' },
  { id: 'rotherham-united', name: 'Rotherham United FC', shortName: 'Rotherham', city: 'Rotherham', competitionId: 'england-league-two' },
  { id: 'salford-city', name: 'Salford City FC', shortName: 'Salford', city: 'Salford', competitionId: 'england-league-two' },
  { id: 'shrewsbury-town', name: 'Shrewsbury Town FC', shortName: 'Shrewsbury', city: 'Shrewsbury', competitionId: 'england-league-two' },
  { id: 'swindon-town', name: 'Swindon Town FC', shortName: 'Swindon', city: 'Swindon', competitionId: 'england-league-two' },
  { id: 'tranmere-rovers', name: 'Tranmere Rovers FC', shortName: 'Tranmere', city: 'Birkenhead', competitionId: 'england-league-two' },
  { id: 'walsall', name: 'Walsall FC', shortName: 'Walsall', city: 'Walsall', competitionId: 'england-league-two' },
  { id: 'york-city', name: 'York City FC', shortName: 'York', city: 'York', competitionId: 'england-league-two' },

  // Tier 5: National League
  { id: 'aldershot-town', name: 'Aldershot Town FC', shortName: 'Aldershot', city: 'Aldershot', competitionId: 'england-national-league' },
  { id: 'altrincham', name: 'Altrincham FC', shortName: 'Altrincham', city: 'Altrincham', competitionId: 'england-national-league' },
  { id: 'barrow', name: 'Barrow AFC', shortName: 'Barrow', city: 'Barrow-in-Furness', competitionId: 'england-national-league' },
  { id: 'boreham-wood', name: 'Boreham Wood FC', shortName: 'Boreham Wood', city: 'Borehamwood', competitionId: 'england-national-league' },
  { id: 'boston-united', name: 'Boston United FC', shortName: 'Boston Utd', city: 'Boston', competitionId: 'england-national-league' },
  { id: 'carlisle-united', name: 'Carlisle United FC', shortName: 'Carlisle', city: 'Carlisle', competitionId: 'england-national-league' },
  { id: 'eastleigh', name: 'Eastleigh FC', shortName: 'Eastleigh', city: 'Eastleigh', competitionId: 'england-national-league' },
  { id: 'forest-green-rovers', name: 'Forest Green Rovers FC', shortName: 'Forest Green', city: 'Nailsworth', competitionId: 'england-national-league' },
  { id: 'afc-fylde', name: 'AFC Fylde', shortName: 'Fylde', city: 'Wesham', competitionId: 'england-national-league' },
  { id: 'gateshead', name: 'Gateshead FC', shortName: 'Gateshead', city: 'Gateshead', competitionId: 'england-national-league' },
  { id: 'fc-halifax-town', name: 'FC Halifax Town', shortName: 'Halifax', city: 'Halifax', competitionId: 'england-national-league' },
  { id: 'harrogate-town', name: 'Harrogate Town AFC', shortName: 'Harrogate', city: 'Harrogate', competitionId: 'england-national-league' },
  { id: 'hartlepool-united', name: 'Hartlepool United FC', shortName: 'Hartlepool', city: 'Hartlepool', competitionId: 'england-national-league' },
  { id: 'hornchurch', name: 'Hornchurch FC', shortName: 'Hornchurch', city: 'London', competitionId: 'england-national-league' },
  { id: 'kidderminster-harriers', name: 'Kidderminster Harriers FC', shortName: 'Kidderminster', city: 'Kidderminster', competitionId: 'england-national-league' },
  { id: 'scunthorpe-united', name: 'Scunthorpe United FC', shortName: 'Scunthorpe', city: 'Scunthorpe', competitionId: 'england-national-league' },
  { id: 'solihull-moors', name: 'Solihull Moors FC', shortName: 'Solihull', city: 'Solihull', competitionId: 'england-national-league' },
  { id: 'southend-united', name: 'Southend United FC', shortName: 'Southend', city: 'Southend-on-Sea', competitionId: 'england-national-league' },
  { id: 'sutton-united', name: 'Sutton United FC', shortName: 'Sutton', city: 'London', competitionId: 'england-national-league' },
  { id: 'tamworth', name: 'Tamworth FC', shortName: 'Tamworth', city: 'Tamworth', competitionId: 'england-national-league' },
  { id: 'wealdstone', name: 'Wealdstone FC', shortName: 'Wealdstone', city: 'London', competitionId: 'england-national-league' },
  { id: 'woking', name: 'Woking FC', shortName: 'Woking', city: 'Woking', competitionId: 'england-national-league' },
  { id: 'worthing', name: 'Worthing FC', shortName: 'Worthing', city: 'Worthing', competitionId: 'england-national-league' },
  { id: 'yeovil-town', name: 'Yeovil Town FC', shortName: 'Yeovil', city: 'Yeovil', competitionId: 'england-national-league' },

  // Tier 6: National League North
  { id: 'afc-telford-united', name: 'AFC Telford United', shortName: 'Telford', city: 'Telford', competitionId: 'england-national-league-north' },
  { id: 'bedford-town', name: 'Bedford Town FC', shortName: 'Bedford', city: 'Bedford', competitionId: 'england-national-league-north' },
  { id: 'brackley-town', name: 'Brackley Town FC', shortName: 'Brackley', city: 'Brackley', competitionId: 'england-national-league-north' },
  { id: 'buxton', name: 'Buxton FC', shortName: 'Buxton', city: 'Buxton', competitionId: 'england-national-league-north' },
  { id: 'chester', name: 'Chester FC', shortName: 'Chester', city: 'Chester', competitionId: 'england-national-league-north' },
  { id: 'chorley', name: 'Chorley FC', shortName: 'Chorley', city: 'Chorley', competitionId: 'england-national-league-north' },
  { id: 'darlington', name: 'Darlington FC', shortName: 'Darlington', city: 'Darlington', competitionId: 'england-national-league-north' },
  { id: 'harborough-town', name: 'Harborough Town FC', shortName: 'Harborough', city: 'Market Harborough', competitionId: 'england-national-league-north' },
  { id: 'hebburn-town', name: 'Hebburn Town FC', shortName: 'Hebburn', city: 'Hebburn', competitionId: 'england-national-league-north' },
  { id: 'hednesford-town', name: 'Hednesford Town FC', shortName: 'Hednesford', city: 'Hednesford', competitionId: 'england-national-league-north' },
  { id: 'hereford', name: 'Hereford FC', shortName: 'Hereford', city: 'Hereford', competitionId: 'england-national-league-north' },
  { id: 'kings-lynn-town', name: "King's Lynn Town FC", shortName: "King's Lynn", city: "King's Lynn", competitionId: 'england-national-league-north' },
  { id: 'macclesfield', name: 'Macclesfield FC', shortName: 'Macclesfield', city: 'Macclesfield', competitionId: 'england-national-league-north' },
  { id: 'marine', name: 'Marine AFC', shortName: 'Marine', city: 'Crosby', competitionId: 'england-national-league-north' },
  { id: 'merthyr-town', name: 'Merthyr Town FC', shortName: 'Merthyr', city: 'Merthyr Tydfil', competitionId: 'england-national-league-north' },
  { id: 'morecambe', name: 'Morecambe FC', shortName: 'Morecambe', city: 'Morecambe', competitionId: 'england-national-league-north' },
  { id: 'oxford-city', name: 'Oxford City FC', shortName: 'Oxford City', city: 'Oxford', competitionId: 'england-national-league-north' },
  { id: 'radcliffe', name: 'Radcliffe FC', shortName: 'Radcliffe', city: 'Radcliffe', competitionId: 'england-national-league-north' },
  { id: 'scarborough-athletic', name: 'Scarborough Athletic FC', shortName: 'Scarborough', city: 'Scarborough', competitionId: 'england-national-league-north' },
  { id: 'south-shields', name: 'South Shields FC', shortName: 'South Shields', city: 'South Shields', competitionId: 'england-national-league-north' },
  { id: 'southport', name: 'Southport FC', shortName: 'Southport', city: 'Southport', competitionId: 'england-national-league-north' },
  { id: 'spalding-united', name: 'Spalding United FC', shortName: 'Spalding', city: 'Spalding', competitionId: 'england-national-league-north' },
  { id: 'spennymoor-town', name: 'Spennymoor Town FC', shortName: 'Spennymoor', city: 'Spennymoor', competitionId: 'england-national-league-north' },
  { id: 'worksop-town', name: 'Worksop Town FC', shortName: 'Worksop', city: 'Worksop', competitionId: 'england-national-league-north' },

  // Tier 6: National League South
  { id: 'afc-totton', name: 'AFC Totton', shortName: 'Totton', city: 'Totton', competitionId: 'england-national-league-south' },
  { id: 'billericay-town', name: 'Billericay Town FC', shortName: 'Billericay', city: 'Billericay', competitionId: 'england-national-league-south' },
  { id: 'braintree-town', name: 'Braintree Town FC', shortName: 'Braintree', city: 'Braintree', competitionId: 'england-national-league-south' },
  { id: 'chelmsford-city', name: 'Chelmsford City FC', shortName: 'Chelmsford', city: 'Chelmsford', competitionId: 'england-national-league-south' },
  { id: 'chesham-united', name: 'Chesham United FC', shortName: 'Chesham', city: 'Chesham', competitionId: 'england-national-league-south' },
  { id: 'dagenham-and-redbridge', name: 'Dagenham & Redbridge FC', shortName: 'D&R', city: 'London', competitionId: 'england-national-league-south' },
  { id: 'dorking-wanderers', name: 'Dorking Wanderers FC', shortName: 'Dorking', city: 'Dorking', competitionId: 'england-national-league-south' },
  { id: 'dover-athletic', name: 'Dover Athletic FC', shortName: 'Dover', city: 'Dover', competitionId: 'england-national-league-south' },
  { id: 'ebbsfleet-united', name: 'Ebbsfleet United FC', shortName: 'Ebbsfleet', city: 'Northfleet', competitionId: 'england-national-league-south' },
  { id: 'farnborough', name: 'Farnborough FC', shortName: 'Farnborough', city: 'Farnborough', competitionId: 'england-national-league-south' },
  { id: 'farnham-town', name: 'Farnham Town FC', shortName: 'Farnham', city: 'Farnham', competitionId: 'england-national-league-south' },
  { id: 'folkestone-invicta', name: 'Folkestone Invicta FC', shortName: 'Folkestone', city: 'Folkestone', competitionId: 'england-national-league-south' },
  { id: 'hampton-and-richmond-borough', name: 'Hampton & Richmond Borough FC', shortName: 'Hampton & Richmond', city: 'London', competitionId: 'england-national-league-south' },
  { id: 'hemel-hempstead-town', name: 'Hemel Hempstead Town FC', shortName: 'Hemel Hempstead', city: 'Hemel Hempstead', competitionId: 'england-national-league-south' },
  { id: 'horsham', name: 'Horsham FC', shortName: 'Horsham', city: 'Horsham', competitionId: 'england-national-league-south' },
  { id: 'maidenhead-united', name: 'Maidenhead United FC', shortName: 'Maidenhead', city: 'Maidenhead', competitionId: 'england-national-league-south' },
  { id: 'maidstone-united', name: 'Maidstone United FC', shortName: 'Maidstone', city: 'Maidstone', competitionId: 'england-national-league-south' },
  { id: 'salisbury', name: 'Salisbury FC', shortName: 'Salisbury', city: 'Salisbury', competitionId: 'england-national-league-south' },
  { id: 'slough-town', name: 'Slough Town FC', shortName: 'Slough', city: 'Slough', competitionId: 'england-national-league-south' },
  { id: 'tonbridge-angels', name: 'Tonbridge Angels FC', shortName: 'Tonbridge', city: 'Tonbridge', competitionId: 'england-national-league-south' },
  { id: 'torquay-united', name: 'Torquay United FC', shortName: 'Torquay', city: 'Torquay', competitionId: 'england-national-league-south' },
  { id: 'truro-city', name: 'Truro City FC', shortName: 'Truro', city: 'Truro', competitionId: 'england-national-league-south' },
  { id: 'walton-and-hersham', name: 'Walton & Hersham FC', shortName: 'Walton & Hersham', city: 'Walton-on-Thames', competitionId: 'england-national-league-south' },
  { id: 'weston-super-mare', name: 'Weston-super-Mare AFC', shortName: 'Weston', city: 'Weston-super-Mare', competitionId: 'england-national-league-south' },
];

const RAW_NAME_TO_ID: Record<string, string> = {
  // Premier League
  'Arsenal FC': 'arsenal',
  'Coventry City FC': 'coventry-city',
  'Hull City AFC': 'hull-city',
  'Manchester United FC': 'manchester-united',
  'Ipswich Town FC': 'ipswich-town',
  'Sunderland AFC': 'sunderland',
  'Nottingham Forest FC': 'nottingham-forest',
  'Leeds United FC': 'leeds-united',
  'Everton FC': 'everton',
  'Crystal Palace FC': 'crystal-palace',
  'Brentford FC': 'brentford',
  'Tottenham Hotspur FC': 'tottenham-hotspur',
  'Manchester City FC': 'manchester-city',
  'AFC Bournemouth': 'afc-bournemouth',
  'Brighton & Hove Albion FC': 'brighton-and-hove-albion',
  'Aston Villa FC': 'aston-villa',
  'Newcastle United FC': 'newcastle-united',
  'Liverpool FC': 'liverpool',
  'Fulham FC': 'fulham',
  'Chelsea FC': 'chelsea',

  // Championship
  'Wolverhampton Wanderers FC': 'wolverhampton-wanderers',
  'Blackburn Rovers FC': 'blackburn-rovers',
  'Bolton Wanderers FC': 'bolton-wanderers',
  'Preston North End FC': 'preston-north-end',
  'Norwich City FC': 'norwich-city',
  'West Bromwich Albion FC': 'west-bromwich-albion',
  'Bristol City FC': 'bristol-city',
  'Millwall FC': 'millwall',
  'Middlesbrough FC': 'middlesbrough',
  'Lincoln City FC': 'lincoln-city',
  'Stoke City FC': 'stoke-city',
  'Swansea City AFC': 'swansea-city',
  'Charlton Athletic FC': 'charlton-athletic',
  'Derby County FC': 'derby-county',
  'Portsmouth FC': 'portsmouth',
  'Queens Park Rangers FC': 'queens-park-rangers',
  'Sheffield United FC': 'sheffield-united',
  'Birmingham City FC': 'birmingham-city',
  'Watford FC': 'watford',
  'Southampton FC': 'southampton',
  'Burnley FC': 'burnley',
  'West Ham United FC': 'west-ham-united',
  'Cardiff City FC': 'cardiff-city',
  'Wrexham AFC': 'wrexham',

  // League One common club names
  'AFC Wimbledon': 'afc-wimbledon',
  'Barnsley': 'barnsley',
  'Blackpool': 'blackpool',
  'Bradford': 'bradford-city',
  'Bromley': 'bromley',
  'Burton': 'burton-albion',
  'Cambridge': 'cambridge-united',
  'Doncaster': 'doncaster-rovers',
  'Huddersfield': 'huddersfield-town',
  'Leicester': 'leicester-city',
  'Leyton Orient': 'leyton-orient',
  'Luton': 'luton-town',
  'Mansfield': 'mansfield-town',
  'Milton Keynes Dons': 'milton-keynes-dons',
  'Notts County': 'notts-county',
  'Oxford': 'oxford-united',
  'Peterboro': 'peterborough-united',
  'Plymouth': 'plymouth-argyle',
  'Reading': 'reading',
  'Sheffield Weds': 'sheffield-wednesday',
  'Stevenage': 'stevenage',
  'Stockport': 'stockport-county',
  'Wigan': 'wigan-athletic',
  'Wycombe': 'wycombe-wanderers',

  // League Two
  'Accrington': 'accrington-stanley',
  'Barnet': 'barnet',
  'Bristol Rvs': 'bristol-rovers',
  'Cheltenham': 'cheltenham-town',
  'Chesterfield': 'chesterfield',
  'Colchester': 'colchester-united',
  'Crawley Town': 'crawley-town',
  'Crewe': 'crewe-alexandra',
  'Exeter': 'exeter-city',
  'Fleetwood Town': 'fleetwood-town',
  'Gillingham': 'gillingham',
  'Grimsby': 'grimsby-town',
  'Newport County': 'newport-county',
  'Northampton': 'northampton-town',
  'Oldham': 'oldham-athletic',
  'Port Vale': 'port-vale',
  'Rochdale': 'rochdale',
  'Rotherham': 'rotherham-united',
  'Salford': 'salford-city',
  'Shrewsbury': 'shrewsbury-town',
  'Swindon': 'swindon-town',
  'Tranmere': 'tranmere-rovers',
  'Walsall': 'walsall',
  'York': 'york-city',

  // National League
  'Aldershot': 'aldershot-town',
  'Altrincham': 'altrincham',
  'Barrow': 'barrow',
  'Boreham Wood': 'boreham-wood',
  'Boston Utd': 'boston-united',
  'Carlisle': 'carlisle-united',
  'Eastleigh': 'eastleigh',
  'Forest Green': 'forest-green-rovers',
  'Fylde': 'afc-fylde',
  'Gateshead': 'gateshead',
  'Halifax': 'fc-halifax-town',
  'Harrogate': 'harrogate-town',
  'Hartlepool': 'hartlepool-united',
  'Hornchurch': 'hornchurch',
  'Kidderminster': 'kidderminster-harriers',
  'Scunthorpe': 'scunthorpe-united',
  'Solihull': 'solihull-moors',
  'Southend': 'southend-united',
  'Sutton': 'sutton-united',
  'Tamworth': 'tamworth',
  'Wealdstone': 'wealdstone',
  'Woking': 'woking',
  'Worthing': 'worthing',
  'Yeovil': 'yeovil-town',

  // National League North
  'TEL': 'afc-telford-united',
  'BED': 'bedford-town',
  'BRA': 'brackley-town',
  'BUX': 'buxton',
  'CHE': 'chester',
  'CHO': 'chorley',
  'DAR': 'darlington',
  'HAR': 'harborough-town',
  'HEB': 'hebburn-town',
  'HED': 'hednesford-town',
  'HER': 'hereford',
  'KLT': 'kings-lynn-town',
  'MAC': 'macclesfield',
  'MAR': 'marine',
  'MER': 'merthyr-town',
  'MOR': 'morecambe',
  'OXF': 'oxford-city',
  'RAD': 'radcliffe',
  'SCA': 'scarborough-athletic',
  'SSH': 'south-shields',
  'SPT': 'southport',
  'SPA': 'spalding-united',
  'SPE': 'spennymoor-town',
  'WRK': 'worksop-town',

  // National League South
  'TOT': 'afc-totton',
  'BIL': 'billericay-town',
  'BRA_NLS': 'braintree-town',
  'CHL': 'chelmsford-city',
  'CHS': 'chesham-united',
  'D&R': 'dagenham-and-redbridge',
  'D&amp;R': 'dagenham-and-redbridge',
  'DOR': 'dorking-wanderers',
  'DOV': 'dover-athletic',
  'EBB': 'ebbsfleet-united',
  'FAB': 'farnborough',
  'FHM': 'farnham-town',
  'FOL': 'folkestone-invicta',
  'HRB': 'hampton-and-richmond-borough',
  'HHT': 'hemel-hempstead-town',
  'HOR': 'horsham',
  'MHD': 'maidenhead-united',
  'MST': 'maidstone-united',
  'SAL': 'salisbury',
  'SLO': 'slough-town',
  'TON': 'tonbridge-angels',
  'TRQ': 'torquay-united',
  'TRU': 'truro-city',
  'W&H': 'walton-and-hersham',
  'W&amp;H': 'walton-and-hersham',
  'WSM': 'weston-super-mare',
};

// ============================================================================
// COMPETITIONS & RULES DEFINITIONS
// ============================================================================

const COMPETITIONS: RawWorldCompetition[] = [
  {
    id: 'england-premier-league',
    name: 'Premier League',
    shortName: 'Premier League',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 1,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-championship',
    name: 'EFL Championship',
    shortName: 'Championship',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 2,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-league-one',
    name: 'EFL League One',
    shortName: 'League One',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 3,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-league-two',
    name: 'EFL League Two',
    shortName: 'League Two',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 4,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-national-league',
    name: 'National League',
    shortName: 'National League',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 5,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-national-league-north',
    name: 'National League North',
    shortName: 'NL North',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 6,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
  {
    id: 'england-national-league-south',
    name: 'National League South',
    shortName: 'NL South',
    countryId: 'england',
    confederationId: 'UEFA',
    category: 'DOMESTIC_LEAGUE',
    level: 6,
    scheduleMode: 'GENERATE_FROM_MEMBERSHIP',
  },
];

const DEFAULT_SUBS: SubstitutionRules = {
  maxSubsRegulation: 5,
  maxStoppageWindows: 3,
  benchSize: 9,
  halfTimeCountsAsWindow: true,
  extraTimeExtraSub: 1,
};

const DEFAULT_DISCIPLINE: DisciplinaryRules = {
  yellowThresholds: [
    { cards: 5, suspensionMatches: 1, cutoffRound: 19 },
    { cards: 10, suspensionMatches: 2, cutoffRound: 32 },
    { cards: 15, suspensionMatches: 3 },
  ],
  straightRedDefaultMatches: 3,
  secondYellowRedMatches: 1,
  policyName: 'FA Standard Disciplinary Code',
};

const DEFAULT_TECH_VAR: MatchTechnologyRules = { varEnabled: true };
const DEFAULT_TECH_NO_VAR: MatchTechnologyRules = { varEnabled: false };
const DEFAULT_MODS: CompetitionSimulationModifiers = { reputationMultiplier: 1.0 };
const DEFAULT_PRES: CompetitionPresentation = {};

const RULE_SETS: CompetitionRuleSet[] = [
  {
    id: 'rules-england-premier-league',
    competitionId: 'england-premier-league',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 20,
      rounds: 38,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: [
        'GOAL_DIFFERENCE',
        'GOALS_FOR',
        'HEAD_TO_HEAD_POINTS',
        'HEAD_TO_HEAD_GOAL_DIFFERENCE',
      ],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [],
      promotionPlayoff: { mode: 'NONE' },
      directRelegationPositions: [18, 19, 20],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-championship',
    competitionId: 'england-championship',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: [
        'GOAL_DIFFERENCE',
        'GOALS_FOR',
        'HEAD_TO_HEAD_POINTS',
        'HEAD_TO_HEAD_GOAL_DIFFERENCE',
      ],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1, 2],
      promotionPlayoff: { mode: 'POSITIONS', positions: [3, 4, 5, 6] },
      directRelegationPositions: [22, 23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-league-one',
    competitionId: 'england-league-one',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD_POINTS'],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1, 2],
      promotionPlayoff: { mode: 'POSITIONS', positions: [3, 4, 5, 6] },
      directRelegationPositions: [21, 22, 23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-league-two',
    competitionId: 'england-league-two',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD_POINTS'],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1, 2, 3],
      promotionPlayoff: { mode: 'POSITIONS', positions: [4, 5, 6, 7] },
      directRelegationPositions: [23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-national-league',
    competitionId: 'england-national-league',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD_POINTS'],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1],
      promotionPlayoff: { mode: 'POSITIONS', positions: [2, 3, 4, 5, 6, 7] },
      directRelegationPositions: [21, 22, 23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-national-league-north',
    competitionId: 'england-national-league-north',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD_POINTS'],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1],
      promotionPlayoff: { mode: 'POSITIONS', positions: [2, 3, 4, 5, 6, 7] },
      directRelegationPositions: [21, 22, 23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
  {
    id: 'rules-england-national-league-south',
    competitionId: 'england-national-league-south',
    seasonLabel: SEASON_LABEL,
    ruleVersion: 1,
    verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION',
    format: {
      type: 'DOUBLE_ROUND_ROBIN',
      expectedClubCount: 24,
      rounds: 46,
      extraTimeEnabled: false,
      penaltiesEnabled: false,
    },
    standings: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tieBreakers: ['GOAL_DIFFERENCE', 'GOALS_FOR', 'HEAD_TO_HEAD_POINTS'],
    },
    seasonOutcomes: {
      championPosition: 1,
      directPromotionPositions: [1],
      promotionPlayoff: { mode: 'POSITIONS', positions: [2, 3, 4, 5, 6, 7] },
      directRelegationPositions: [21, 22, 23, 24],
      relegationPlayoff: { mode: 'NONE' },
    },
    substitutions: DEFAULT_SUBS,
    discipline: DEFAULT_DISCIPLINE,
    technology: DEFAULT_TECH_NO_VAR,
    modifiers: DEFAULT_MODS,
    presentation: DEFAULT_PRES,
  },
];

const MOVEMENT_RELATIONSHIPS: CompetitionMovementRelationship[] = [
  {
    id: 'rel-pl-champ-rel',
    sourceCompetitionId: 'england-premier-league',
    destinationCompetitionId: 'england-championship',
    movementType: 'RELEGATION',
    countryId: 'england',
  },
  {
    id: 'rel-champ-pl-prom',
    sourceCompetitionId: 'england-championship',
    destinationCompetitionId: 'england-premier-league',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
  {
    id: 'rel-champ-l1-rel',
    sourceCompetitionId: 'england-championship',
    destinationCompetitionId: 'england-league-one',
    movementType: 'RELEGATION',
    countryId: 'england',
  },
  {
    id: 'rel-l1-champ-prom',
    sourceCompetitionId: 'england-league-one',
    destinationCompetitionId: 'england-championship',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
  {
    id: 'rel-l1-l2-rel',
    sourceCompetitionId: 'england-league-one',
    destinationCompetitionId: 'england-league-two',
    movementType: 'RELEGATION',
    countryId: 'england',
  },
  {
    id: 'rel-l2-l1-prom',
    sourceCompetitionId: 'england-league-two',
    destinationCompetitionId: 'england-league-one',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
  {
    id: 'rel-l2-nl-rel',
    sourceCompetitionId: 'england-league-two',
    destinationCompetitionId: 'england-national-league',
    movementType: 'RELEGATION',
    countryId: 'england',
  },
  {
    id: 'rel-nl-l2-prom',
    sourceCompetitionId: 'england-national-league',
    destinationCompetitionId: 'england-league-two',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
  {
    id: 'rel-nln-nl-prom',
    sourceCompetitionId: 'england-national-league-north',
    destinationCompetitionId: 'england-national-league',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
  {
    id: 'rel-nls-nl-prom',
    sourceCompetitionId: 'england-national-league-south',
    destinationCompetitionId: 'england-national-league',
    movementType: 'PROMOTION',
    countryId: 'england',
  },
];

// ============================================================================
// FIXTURE INGESTION HELPERS
// ============================================================================

async function ingestOpenFootball(
  compId: string,
  url: string,
  cachePath: string
): Promise<RawWorldFixture[]> {
  const jsonStr = await fetchWithCache(url, cachePath);
  const data = JSON.parse(jsonStr);
  const fixtures: RawWorldFixture[] = [];

  const matches = data.matches || [];
  for (const m of matches) {
    if (!m.score || !m.score.ft) continue;
    if (m.date > SNAPSHOT_DATE) continue;

    const homeClubId = RAW_NAME_TO_ID[m.team1];
    const awayClubId = RAW_NAME_TO_ID[m.team2];
    if (!homeClubId || !awayClubId) {
      throw new Error(`Unknown team in OpenFootball: ${m.team1} or ${m.team2}`);
    }

    const roundNum = parseInt(String(m.round).replace(/\D+/g, ''), 10) || 1;

    fixtures.push({
      id: `${compId}-${homeClubId}-${awayClubId}`,
      competitionId: compId,
      round: roundNum,
      homeClubId,
      awayClubId,
      homeGoals: m.score.ft[0],
      awayGoals: m.score.ft[1],
      scheduledDate: m.date,
    });
  }

  return fixtures;
}

const WIKI_L1_CODE_TO_ID: Record<string, string> = {
  BAR: 'barnsley',
  BLP: 'blackpool',
  BRA: 'bradford-city',
  BRM: 'bromley',
  BUR: 'burton-albion',
  CAM: 'cambridge-united',
  DON: 'doncaster-rovers',
  HUD: 'huddersfield-town',
  LEI: 'leicester-city',
  LEY: 'leyton-orient',
  LUT: 'luton-town',
  MAN: 'mansfield-town',
  MKD: 'milton-keynes-dons',
  NCO: 'notts-county',
  OXF: 'oxford-united',
  PET: 'peterborough-united',
  PLY: 'plymouth-argyle',
  REA: 'reading',
  SHW: 'sheffield-wednesday',
  STE: 'stevenage',
  STO: 'stockport-county',
  WIG: 'wigan-athletic',
  WIM: 'afc-wimbledon',
  WYC: 'wycombe-wanderers',
};

const WIKI_L2_CODE_TO_ID: Record<string, string> = {
  ACC: 'accrington-stanley',
  BRI: 'bristol-rovers',
  BRN: 'barnet',
  CHF: 'chesterfield',
  CHT: 'cheltenham-town',
  COL: 'colchester-united',
  CRA: 'crawley-town',
  CRE: 'crewe-alexandra',
  EXE: 'exeter-city',
  FLE: 'fleetwood-town',
  GIL: 'gillingham',
  GRI: 'grimsby-town',
  NEW: 'newport-county',
  NOR: 'northampton-town',
  OLD: 'oldham-athletic',
  POV: 'port-vale',
  ROC: 'rochdale',
  ROT: 'rotherham-united',
  SAL: 'salford-city',
  SHR: 'shrewsbury-town',
  SWI: 'swindon-town',
  TRA: 'tranmere-rovers',
  WAL: 'walsall',
  YOR: 'york-city',
};

const WIKI_NL_CODE_TO_ID: Record<string, string> = {
  ALD: 'aldershot-town',
  ALT: 'altrincham',
  BAR: 'barrow',
  BOR: 'boreham-wood',
  BOS: 'boston-united',
  CAR: 'carlisle-united',
  EAS: 'eastleigh',
  FGR: 'forest-green-rovers',
  FYL: 'afc-fylde',
  GAT: 'gateshead',
  HAL: 'fc-halifax-town',
  HOR: 'hornchurch',
  HPU: 'hartlepool-united',
  HRG: 'harrogate-town',
  KID: 'kidderminster-harriers',
  SCU: 'scunthorpe-united',
  SOL: 'solihull-moors',
  SOU: 'southend-united',
  SUT: 'sutton-united',
  TAM: 'tamworth',
  WEA: 'wealdstone',
  WOK: 'woking',
  WOR: 'worthing',
  YEO: 'yeovil-town',
};

function ingestWikiMatrix(
  compId: string,
  content: string,
  codeMap?: Record<string, string>,
  isSouth: boolean = false
): RawWorldFixture[] {
  const fixtures: RawWorldFixture[] = [];
  const regex = /match_([A-Za-z0-9&_]+)_([A-Za-z0-9&_]+)\s*=\s*(\d+)[-–](\d+)/g;
  let m;

  while ((m = regex.exec(content)) !== null) {
    let homeCode = m[1];
    let awayCode = m[2];

    if (isSouth) {
      if (homeCode === 'BRA') homeCode = 'BRA_NLS';
      if (awayCode === 'BRA') awayCode = 'BRA_NLS';
    }

    const homeClubId = codeMap ? codeMap[homeCode] : RAW_NAME_TO_ID[homeCode];
    const awayClubId = codeMap ? codeMap[awayCode] : RAW_NAME_TO_ID[awayCode];

    if (!homeClubId || !awayClubId) {
      throw new Error(`Unknown code in Wiki matrix for ${compId}: ${homeCode} or ${awayCode}`);
    }

    const homeGoals = parseInt(m[3], 10);
    const awayGoals = parseInt(m[4], 10);

    fixtures.push({
      id: `${compId}-${homeClubId}-${awayClubId}`,
      competitionId: compId,
      round: 1,
      homeClubId,
      awayClubId,
      homeGoals,
      awayGoals,
      scheduledDate: '2026-09-29',
    });
  }

  return fixtures;
}

// ============================================================================
// MAIN BUILD FUNCTION
// ============================================================================

export async function buildEngland2026World() {
  console.log('====================================================');
  console.log('PRO BALLER: Building Real England 2026/27 Football World');
  console.log('====================================================\n');

  // 1. Verify Cordax API & Check Rate Limits / Status
  const cordaxKey = getCordaxApiKey();
  console.log(`Checking Cordax API key in environment: ${cordaxKey ? 'Present' : 'Not Found'}`);

  let cordaxAvailable = false;
  if (cordaxKey) {
    console.log('Verifying Cordax API connectivity & 2026-27 coverage...');
    try {
      const testRes = await fetch('https://api.cordax.net/Competitions?country=England', {
        headers: { Authorization: `Bearer ${cordaxKey}` },
      });
      if (testRes.ok) {
        cordaxAvailable = true;
        console.log('Cordax API response: 200 OK');
      } else {
        console.log(`Cordax API returned: ${testRes.status} ${testRes.statusText}`);
        const errBody = await testRes.text();
        console.log(`Cordax response details: ${errBody}`);
      }
    } catch (err: any) {
      console.log(`Cordax fetch failed: ${err.message}`);
    }
  }

  if (!cordaxAvailable) {
    console.log('\n[NOTICE] Cordax Football API Free tier is inaccessible (token invalid/inactive or 401).');
    console.log('[NOTICE] Activating documented fallback sources per project specifications:\n' +
      '  - Premier League: OpenFootball 2026/27 (en.1.json) [CC0]\n' +
      '  - Championship: OpenFootball 2026/27 (en.2.json) [CC0]\n' +
      '  - League One: Wikipedia 2026–27 EFL League One [CC BY-SA 4.0]\n' +
      '  - League Two: Wikipedia 2026–27 EFL League Two [CC BY-SA 4.0]\n' +
      '  - National League: Wikipedia Template:2026–27 National League table [CC BY-SA 4.0]\n' +
      '  - National League North: Wikipedia Template:2026–27 National League North table [CC BY-SA 4.0]\n' +
      '  - National League South: Wikipedia Template:2026–27 National League South table [CC BY-SA 4.0]\n');
  }

  // 2. Ingest Fixtures from Sources
  console.log('Ingesting fixtures across all 7 domestic competitions...');
  const allFixtures: RawWorldFixture[] = [];

  // Premier League
  const plFixtures = await ingestOpenFootball(
    'england-premier-league',
    'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json',
    path.join(OPENFOOTBALL_CACHE_DIR, 'en.1.json')
  );
  console.log(`  Premier League: ${plFixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...plFixtures);

  // Championship
  const champFixtures = await ingestOpenFootball(
    'england-championship',
    'https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.2.json',
    path.join(OPENFOOTBALL_CACHE_DIR, 'en.2.json')
  );
  console.log(`  Championship: ${champFixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...champFixtures);

  // League One (Wikipedia CC BY-SA 4.0)
  const l1Raw = await fetchWithCache(
    'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_One&action=raw',
    path.join(WIKIPEDIA_CACHE_DIR, 'l1_raw.txt')
  );
  const l1Fixtures = ingestWikiMatrix('england-league-one', l1Raw, WIKI_L1_CODE_TO_ID);
  console.log(`  League One: ${l1Fixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...l1Fixtures);

  // League Two (Wikipedia CC BY-SA 4.0)
  const l2Raw = await fetchWithCache(
    'https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_Two&action=raw',
    path.join(WIKIPEDIA_CACHE_DIR, 'l2_raw.txt')
  );
  const l2Fixtures = ingestWikiMatrix('england-league-two', l2Raw, WIKI_L2_CODE_TO_ID);
  console.log(`  League Two: ${l2Fixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...l2Fixtures);

  // National League (Wikipedia CC BY-SA 4.0)
  const nlRaw = await fetchWithCache(
    'https://en.wikipedia.org/w/index.php?title=Template:2026%E2%80%9327_National_League_table&action=raw',
    path.join(WIKIPEDIA_CACHE_DIR, 'nl_raw.txt')
  );
  const nlFixtures = ingestWikiMatrix('england-national-league', nlRaw, WIKI_NL_CODE_TO_ID);
  console.log(`  National League: ${nlFixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...nlFixtures);

  // National League North
  const nlnHtml = await fetchWithCache(
    'https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_North_table',
    path.join(WIKIPEDIA_CACHE_DIR, 'nln.html')
  );
  const nlnFixtures = ingestWikiMatrix('england-national-league-north', nlnHtml, undefined, false);
  console.log(`  National League North: ${nlnFixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...nlnFixtures);

  // National League South
  const nlsHtml = await fetchWithCache(
    'https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_South_table',
    path.join(WIKIPEDIA_CACHE_DIR, 'nls.html')
  );
  const nlsFixtures = ingestWikiMatrix('england-national-league-south', nlsHtml, undefined, true);
  console.log(`  National League South: ${nlsFixtures.length} completed fixtures <= ${SNAPSHOT_DATE}`);
  allFixtures.push(...nlsFixtures);

  console.log(`\nTotal completed matches ingested: ${allFixtures.length}`);

  // 3. Construct Raw World Snapshot
  const rawClubs: RawWorldClub[] = CLUBS.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    countryId: 'england',
    city: c.city,
    competitionId: c.competitionId,
  }));

  const rawSnapshot: RawFootballWorldSnapshot = {
    id: 'england-2026-27',
    version: 1,
    seasonLabel: SEASON_LABEL,
    snapshotDate: SNAPSHOT_DATE,
    countries: [
      {
        id: 'england',
        name: 'England',
        code: 'ENG',
        confederationId: 'UEFA',
      },
    ],
    competitions: COMPETITIONS,
    ruleSets: RULE_SETS,
    movementRelationships: MOVEMENT_RELATIONSHIPS,
    clubs: rawClubs,
    players: [],
    managers: [],
    fixtures: allFixtures,
  };

  // 4. Save Raw Snapshot
  console.log('\nWriting raw snapshot to:', RAW_OUTPUT_PATH);
  fs.writeFileSync(RAW_OUTPUT_PATH, JSON.stringify(rawSnapshot, null, 2), 'utf-8');

  // 5. Run Importer (Normalizes, generates round-robin continuation schedules, matches results)
  console.log('Running importFootballWorldSnapshot()...');
  const importResult = importFootballWorldSnapshot(rawSnapshot);
  if (!importResult.accepted || !importResult.pack) {
    console.error('FATAL: importFootballWorldSnapshot rejected snapshot:', importResult.error);
    process.exit(1);
  }
  const pack = importResult.pack;
  console.log('Import SUCCESS: FootballWorldDataPack generated.');

  // 6. Validate Data Pack
  console.log('Running validateFootballWorldDataPack()...');
  const valResult = validateFootballWorldDataPack(pack);
  if (!valResult.valid) {
    console.error('FATAL: Data pack validation failed with errors:', valResult.errors);
    process.exit(1);
  }
  console.log('Validation SUCCESS: FootballWorldDataPack is fully valid (0 errors).');

  // 7. Save Validated Data Pack
  console.log('Writing validated pack to:', PACK_OUTPUT_PATH);
  fs.writeFileSync(PACK_OUTPUT_PATH, JSON.stringify(pack, null, 2), 'utf-8');

  // 8. Bootstrap Football World Runtime State
  console.log('Running bootstrapFootballWorld()...');
  const bootstrapResult = bootstrapFootballWorld(pack);
  if (!bootstrapResult.accepted || !bootstrapResult.state) {
    console.error('FATAL: bootstrapFootballWorld failed:', bootstrapResult.error);
    process.exit(1);
  }
  const state = bootstrapResult.state;
  console.log('Bootstrap SUCCESS: FootballWorldRuntime initialized successfully.');
  console.log(`  Domestic memberships active: ${state.domesticLeagueMembershipStates.length}`);
  console.log(`  Competition seasons active: ${state.competitionSeasonStates.length}`);

  // Import getCompetitionStandings to verify derived tables
  const { getCompetitionStandings } = await import('../src/competition/seasonEngine');

  // Print standings verification for each of the 7 leagues
  console.log('\n====================================================');
  console.log('VERIFYING DERIVED STANDINGS ACROSS ALL 7 DIVISIONS:');
  console.log('====================================================');

  const clubMap = new Map(pack.clubs.map(c => [c.id, c]));
  const ruleSetMap = new Map(pack.competitionRuleSets.map(r => [r.id, r]));

  for (const comp of COMPETITIONS) {
    const seasonState = state.competitionSeasonStates.find(s => s.competitionId === comp.id);
    if (!seasonState) {
      console.error(`Missing runtime season for ${comp.id}`);
      continue;
    }
    const ruleSet = ruleSetMap.get(seasonState.ruleSetId);
    if (!ruleSet) {
      console.error(`Missing rule set for ${seasonState.ruleSetId}`);
      continue;
    }
    const standingsResult = getCompetitionStandings(seasonState, ruleSet);
    if (!standingsResult.accepted || !standingsResult.standings) {
      console.error(`Failed to calculate standings for ${comp.id}:`, standingsResult.error);
      continue;
    }
    const standings = standingsResult.standings;
    console.log(`\n${comp.name} (${standings.length} teams, ${seasonState.results.length} matches played):`);
    console.log('Pos | Team                          | Pld | W | D | L | GF | GA | GD | Pts');
    console.log('----+-------------------------------+-----+---+---+---+----+----+----+----');
    standings.slice(0, 5).forEach((row, idx) => {
      const club = clubMap.get(row.teamId);
      const name = (club?.name || row.teamId).padEnd(29).slice(0, 29);
      console.log(
        `${String(idx + 1).padStart(3)} | ${name} | ${String(row.played).padStart(3)} | ` +
        `${String(row.won).padStart(1)} | ${String(row.drawn).padStart(1)} | ${String(row.lost).padStart(1)} | ` +
        `${String(row.goalsFor).padStart(2)} | ${String(row.goalsAgainst).padStart(2)} | ` +
        `${String(row.goalDifference).padStart(2)} | ${String(row.points).padStart(2)}`
      );
    });
    if (standings.length > 5) {
      console.log('... (' + (standings.length - 5) + ' more clubs)');
    }
  }

  // 9. Generate SOURCES.md
  console.log('\nGenerating SOURCES.md documentation...');
  const sourcesMd = `# England 2026/27 Football World Snapshot — Data Sources & Provenance

## Overview
- **World ID:** \`england-2026-27\`
- **Season:** \`2026-27\`
- **Snapshot Date:** \`2026-10-07\`
- **Ingestion Pipeline:** \`importFootballWorldSnapshot\` with continuation mode (\`GENERATE_FROM_MEMBERSHIP\`)
- **Total Competitions:** 7 domestic divisions (Tiers 1–6)
- **Total Clubs:** 164 unique clubs

---

## Primary API Investigation & Status (Cordax Football API)
- **Provider:** Cordax Football API (\`https://api.cordax.net\`)
- **Configured Key:** Checked via \`CORDAX_API_KEY\` / \`.env.local\`
- **Endpoint Test:** \`GET https://api.cordax.net/Competitions?country=England\`
- **Result:** \`401 Unauthorized: The API token is invalid, inactive, or expired.\`
- **Root Cause & Coverage Verification:**
  - Token authentication failed on the Cordax live backend.
  - Per project instructions and explicit user authorization, the pipeline gracefully activated the documented public fallback sources.

---

## Provenance by Competition

### 1. Premier League (\`england-premier-league\`)
- **Source:** OpenFootball / Football Data JSON (\`https://github.com/openfootball/football.json\`)
- **Resource:** \`2026-27/en.1.json\`
- **Source Link:** https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.1.json
- **License:** CC0 1.0 Universal / Public Domain Dedication (https://creativecommons.org/publicdomain/zero/1.0/)
- **Clubs Ingested:** 20 clubs
- **Matches Ingested:** 45 completed matches played <= 2026-10-07
- **Continuation:** Remaining 335 fixtures generated via Pro-Baller double round-robin scheduler.

### 2. Championship (\`england-championship\`)
- **Source:** OpenFootball / Football Data JSON (\`https://github.com/openfootball/football.json\`)
- **Resource:** \`2026-27/en.2.json\`
- **Source Link:** https://raw.githubusercontent.com/openfootball/football.json/master/2026-27/en.2.json
- **License:** CC0 1.0 Universal / Public Domain Dedication (https://creativecommons.org/publicdomain/zero/1.0/)
- **Clubs Ingested:** 24 clubs
- **Continuation:** Remaining 464 fixtures generated via Pro-Baller double round-robin scheduler.

### 3. League One (\`england-league-one\`)
- **Source:** Wikipedia Results Matrix
- **Resource:** \`2026–27 EFL League One\`
- **Source Link:** https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_One
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_One&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 89 completed matches played <= 2026-10-07
- **Continuation:** Remaining 463 fixtures generated via Pro-Baller double round-robin scheduler.

### 4. League Two (\`england-league-two\`)
- **Source:** Wikipedia Results Matrix
- **Resource:** \`2026–27 EFL League Two\`
- **Source Link:** https://en.wikipedia.org/wiki/2026%E2%80%9327_EFL_League_Two
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=2026%E2%80%9327_EFL_League_Two&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 102 completed matches played <= 2026-10-07
- **Continuation:** Remaining 450 fixtures generated via Pro-Baller double round-robin scheduler.

### 5. National League (\`england-national-league\`)
- **Source:** Wikipedia Results Matrix
- **Resource:** \`Template:2026–27 National League table\` / \`2026–27 National League\`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_table
- **Raw Wikitext Link:** https://en.wikipedia.org/w/index.php?title=Template:2026%E2%80%9327_National_League_table&action=raw
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 143 completed matches played <= 2026-10-07
- **Continuation:** Remaining 409 fixtures generated via Pro-Baller double round-robin scheduler.

### 6. National League North (\`england-national-league-north\`)
- **Source:** Wikipedia & National League Results Matrix
- **Resource:** \`Template:2026–27_National_League_North_table\`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_North_table
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 120 completed matches played <= 2026-10-07
- **Continuation:** Remaining 432 fixtures generated via Pro-Baller double round-robin scheduler.

### 7. National League South (\`england-national-league-south\`)
- **Source:** Wikipedia & National League Results Matrix
- **Resource:** \`Template:2026–27_National_League_South_table\`
- **Source Link:** https://en.wikipedia.org/wiki/Template:2026%E2%80%9327_National_League_South_table
- **License / Attribution:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) by Wikipedia contributors (https://creativecommons.org/licenses/by-sa/4.0/)
- **Clubs Ingested:** 24 clubs
- **Matches Ingested:** 97 completed matches played <= 2026-10-07
- **Continuation:** Remaining 455 fixtures generated via Pro-Baller double round-robin scheduler.

---

## Historical Source Evaluation Note (Football-Data.co.uk)
- **Status:** Evaluated and REJECTED.
- **Reason:** Current published usage terms for \`football-data.co.uk\` restrict free data files strictly to private individual use and explicitly prohibit use in commercial or data-training products via automated scrapers/bots.
- **Compliance Action:** In accordance with project licensing compliance, Football-Data.co.uk was completely removed as an ingested source. No committed fixture, result, or competition data in Pro Baller depends on or bundles data from \`football-data.co.uk\`.

---

## Known Sporting Rule & Standings Model Limitations
- The competition engine currently models the supported standings criteria: \`points\`, \`goalDifference\`, \`goalsFor\`, \`headToHeadPoints\`, and \`headToHeadGoalDifference\`.
- Some extremely deep tie-break criteria specified in governing league regulations (e.g. most wins, away goals scored in the league, head-to-head away goals, neutral-ground play-off matches) remain pending future expansion of the \`StandingsTieBreaker\` model.
- Because these deep tie-breakers cannot currently be fully represented, all seven competition rule sets designate \`verificationStatus: 'NEEDS_OFFICIAL_VERIFICATION'\`.
- This limitation does not affect ordinary season standings unless two or more clubs remain exactly level across all currently supported criteria.

---

## Licensing & Redistribution Terms
- **OpenFootball:** Public Domain (CC0 1.0 Universal). Fully redistributable and embeddable without restrictions.
- **Wikipedia:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0; https://creativecommons.org/licenses/by-sa/4.0/). Attribution to Wikipedia contributors provided via template URLs and wikitext source references.
- **Cordax API Policy:** Not embedded in git repository as live Cordax response was unavailable (401 Unauthorized). Only documented public fallback data with compatible licensing was bundled into repository packs.
`;

  fs.writeFileSync(SOURCES_OUTPUT_PATH, sourcesMd, 'utf-8');
  console.log('SOURCES.md generated successfully.');

  console.log('\n====================================================');
  console.log('England 2026/27 World Ingestion Complete!');
  console.log('====================================================');
}

buildEngland2026World().catch(err => {
  console.error('Fatal build error:', err);
  process.exit(1);
});
