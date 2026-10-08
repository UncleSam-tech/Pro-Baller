import React, { useState, useEffect } from 'react';
import { PlayerArchetype, PlayerOrigin, Position } from '../types/game';
import { CLUBS_DATABASE, getClubById } from '../data/clubs';
import { isLegacyClubSupported } from '../utils/worldClubCompatibility';
import { WORLD_GEOGRAPHY, ContinentData, RegionData, CountryData } from '../data/geography';
import { sounds } from '../utils/soundFx';
import { calculateTaxBreakdown } from '../utils/taxResidency';
import { 
  Award, ChevronLeft, ChevronRight, Dice5, Globe, Home, Landmark, 
  MapPin, Play, Shield, Sparkles, User, Zap 
} from 'lucide-react';

interface NewCareerModalProps {
  onStartCareer: (
    firstName: string,
    lastName: string,
    nationality: string,
    nationCode: string,
    position: Position,
    archetype: PlayerArchetype,
    origin: PlayerOrigin,
    startingClubId: string,
    hometown: string,
    secondaryNation?: string,
    secondaryCode?: string,
    startingAge?: number
  ) => void;
  onCancel?: () => void;
  onBackToIntro?: () => void;
}

const CULTURAL_NAMES: Record<string, { first: string[]; last: string[] }> = {
  Nigeria: {
    first: ['Chinedu', 'Victor', 'Kelechi', 'Samuel', 'Tobi', 'Emeka', 'Adewale', 'Femi'],
    last: ['Okocha', 'Osimhen', 'Kanu', 'Chukwueze', 'Adedayo', 'Balogun', 'Musa', 'Ndidi'],
  },
  Ghana: {
    first: ['Kofi', 'Kwame', 'Mohammed', 'Andre', 'Thomas', 'Inaki', 'Tariq'],
    last: ['Kudus', 'Partey', 'Essien', 'Ayew', 'Mensah', 'Appiah', 'Lamptey'],
  },
  Senegal: {
    first: ['Sadio', 'Kalidou', 'Nicolas', 'Pape', 'Ismaila', 'Boulaye'],
    last: ['Mané', 'Koulibaly', 'Jackson', 'Sarr', 'Gueye', 'Dia', 'Diallo'],
  },
  France: {
    first: ['Kaelen', 'Antoine', 'Aurélien', 'Eduardo', 'Théo', 'Bradley', 'Warren'],
    last: ['Mbappé', 'Griezmann', 'Tchouaméni', 'Camavinga', 'Hernández', 'Barcola', 'Zaïre-Emery'],
  },
  England: {
    first: ['Marcus', 'Bukayo', 'Jude', 'Phil', 'Cole', 'Declan', 'Kobbie'],
    last: ['Saka', 'Bellingham', 'Foden', 'Palmer', 'Rice', 'Mainoo', 'Vance'],
  },
  Spain: {
    first: ['Lamine', 'Gavi', 'Pedri', 'Nico', 'Ferran', 'Rodri', 'Alejandro'],
    last: ['Yamal', 'Gaviria', 'González', 'Williams', 'Torres', 'Cascante', 'Balde'],
  },
  Brazil: {
    first: ['Gabriel', 'Vinicius', 'Rodrygo', 'Endrick', 'Lucas', 'Matheus'],
    last: ['Santana', 'Júnior', 'Silva', 'Souza', 'Oliveira', 'Costa', 'Santos'],
  },
  Argentina: {
    first: ['Mateo', 'Julián', 'Enzo', 'Alejandro', 'Alexis', 'Rodrigo'],
    last: ['Álvarez', 'Fernández', 'Garnacho', 'Mac Allister', 'De Paul', 'Martínez'],
  },
};

export const NewCareerModal: React.FC<NewCareerModalProps> = ({ 
  onStartCareer, 
  onCancel,
  onBackToIntro 
}) => {
  // Geographical Hierarchy State
  const [selectedContinentIndex, setSelectedContinentIndex] = useState<number>(0);
  const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
  const [selectedCountry, setSelectedCountry] = useState<CountryData>(() => {
    return WORLD_GEOGRAPHY[0].regions[0].countries[0]; // Default: Nigeria (West Africa)
  });

  // Identity Form State
  const [firstName, setFirstName] = useState('Chinedu');
  const [lastName, setLastName] = useState('Okocha');
  const [hometown, setHometown] = useState('Surulere, Lagos, Nigeria');

  // Football Persona
  const [startingAge, setStartingAge] = useState<number>(14);
  const [position, setPosition] = useState<Position>('ST');
  const [archetype, setArchetype] = useState<PlayerArchetype>('Poacher');
  const [origin, setOrigin] = useState<PlayerOrigin>('street_cage_talent');
  const [startingClubId, setStartingClubId] = useState('sporting_lagos');

  const currentContinent = WORLD_GEOGRAPHY[selectedContinentIndex] || WORLD_GEOGRAPHY[0];
  const currentRegion = currentContinent.regions[selectedRegionIndex] || currentContinent.regions[0];

  // Update country when region or continent changes
  const handleSelectContinent = (contIdx: number) => {
    sounds.playClick();
    setSelectedContinentIndex(contIdx);
    setSelectedRegionIndex(0);
    const firstCountry = WORLD_GEOGRAPHY[contIdx].regions[0].countries[0];
    applyCountry(firstCountry);
  };

  const handleSelectRegion = (regIdx: number) => {
    sounds.playClick();
    setSelectedRegionIndex(regIdx);
    const firstCountry = currentContinent.regions[regIdx].countries[0];
    applyCountry(firstCountry);
  };

  const applyCountry = (country: CountryData) => {
    setSelectedCountry(country);
    setHometown(country.defaultCity);

    // Pick authentic culturally matched name if available
    const namePool = CULTURAL_NAMES[country.name];
    if (namePool) {
      setFirstName(namePool.first[Math.floor(Math.random() * namePool.first.length)]);
      setLastName(namePool.last[Math.floor(Math.random() * namePool.last.length)]);
    }

    // Auto-select fitting starting launchpad academy
    if (country.name === 'Nigeria') setStartingClubId('sporting_lagos');
    else if (country.name === 'Brazil') setStartingClubId('santos_fc');
    else if (country.name === 'Spain') setStartingClubId('las_palmas');
    else if (country.name === 'England') setStartingClubId('southampton');
    else if (country.name === 'Germany') setStartingClubId('dortmund');
  };

  const handleRandomize = () => {
    sounds.playClick();
    // Randomize continent, region, country
    const randContIdx = Math.floor(Math.random() * WORLD_GEOGRAPHY.length);
    const randCont = WORLD_GEOGRAPHY[randContIdx];
    const randRegIdx = Math.floor(Math.random() * randCont.regions.length);
    const randReg = randCont.regions[randRegIdx];
    const randCountry = randReg.countries[Math.floor(Math.random() * randReg.countries.length)];

    setSelectedContinentIndex(randContIdx);
    setSelectedRegionIndex(randRegIdx);
    applyCountry(randCountry);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLegacyClubSupported(startingClubId)) {
      alert('The selected starting club is not currently available in the Living World. Please choose a supported club.');
      return;
    }

    sounds.playWhistle();

    // Dual nationality comes naturally from ancestral diaspora!
    const naturalSecCountry = selectedCountry.naturalHeritage?.country;
    const naturalSecCode = selectedCountry.naturalHeritage?.code;

    onStartCareer(
      firstName.trim() || 'Alex',
      lastName.trim() || 'Hunter',
      selectedCountry.name,
      selectedCountry.code,
      position,
      archetype,
      origin,
      startingClubId,
      hometown.trim() || selectedCountry.defaultCity,
      naturalSecCountry,
      naturalSecCode,
      startingAge
    );
  };

  const starterClubs = CLUBS_DATABASE.filter(c => c.tier >= 2);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 space-y-6 shadow-2xl my-8 relative">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Sparkles className="w-4 h-4" />
              Stage 2: Player Persona Formulation
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Create Your Footballer Persona
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose your continent, regional roots, cultural birthplace, and starting launchpad.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onBackToIntro && (
              <button
                type="button"
                onClick={onBackToIntro}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-slate-800 border border-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Story Intro</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRandomize}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold bg-slate-950 py-1.5 px-3 rounded-lg border border-slate-800 transition-colors cursor-pointer"
            >
              <Dice5 className="w-4 h-4" />
              <span>Randomize</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* ==================================================== */}
          {/* 1. CONTINENT → REGION → COUNTRY HIERARCHY */}
          {/* ==================================================== */}
          <div className="space-y-3 bg-slate-950/80 p-5 rounded-2xl border border-slate-800/90">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span>1. Birthplace: Continent → Region → Country</span>
              </label>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {selectedCountry.flag} {selectedCountry.name} ({currentContinent.name} · {currentRegion.name})
              </span>
            </div>

            {/* Level 1: Continent Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
              {WORLD_GEOGRAPHY.map((continent, idx) => (
                <button
                  key={continent.id}
                  type="button"
                  onClick={() => handleSelectContinent(idx)}
                  className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selectedContinentIndex === idx
                      ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                  }`}
                >
                  <span className="text-base">{continent.icon}</span>
                  <span className="truncate">{continent.name}</span>
                </button>
              ))}
            </div>

            {/* Level 2: Region of Continent Selector */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Select Region in {currentContinent.name}
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {currentContinent.regions.map((region, regIdx) => (
                  <button
                    key={region.id}
                    type="button"
                    onClick={() => handleSelectRegion(regIdx)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedRegionIndex === regIdx
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Level 3: Country Selector Grid */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Select Country in {currentRegion.name}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentRegion.countries.map(country => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => { sounds.playClick(); applyCountry(country); }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      selectedCountry.id === country.id
                        ? 'bg-emerald-950/90 border-emerald-500 text-white font-bold shadow'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <div className="truncate">
                      <div className="truncate text-xs font-bold leading-none">{country.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{country.code}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 2. NATURAL DUAL NATIONALITY & DIASPORA ACCORD */}
          {/* ==================================================== */}
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>Cultural Diaspora & Natural Dual Nationality</span>
            </div>
            {selectedCountry.naturalHeritage ? (
              <p className="text-xs text-slate-300 leading-relaxed">
                Dual nationality is not chosen artificially—it emerges naturally from your cultural heritage. 
                Born in <strong>{selectedCountry.name}</strong>, your family holds natural diaspora roots connecting to{' '}
                <strong className="text-amber-400">{selectedCountry.naturalHeritage.country} ({selectedCountry.naturalHeritage.code})</strong>{' '}
                via {selectedCountry.naturalHeritage.heritageReason}. Under FIFA Article 7, you are dual-eligible until capped in an official competitive senior tournament match.
              </p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Born in <strong>{selectedCountry.name}</strong>. Secondary passport rights can be unlocked naturally during your career after completing consecutive residency years in European leagues.
              </p>
            )}
          </div>

          {/* ==================================================== */}
          {/* 3. NAME & HOMETOWN */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-bold">First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-bold">Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-bold">Hometown / Birthplace</label>
              <input
                type="text"
                required
                value={hometown}
                onChange={e => setHometown(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* ==================================================== */}
          {/* 4. POSITION, ARCHETYPE & STARTING AGE */}
          {/* ==================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1.5">Starting Age</label>
              <select
                value={startingAge}
                onChange={e => setStartingAge(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-emerald-400 text-xs font-mono font-bold focus:outline-none"
              >
                <option value={14}>Age 14 · U15 Youth Cadet</option>
                <option value={15}>Age 15 · U16 Academy Star</option>
                <option value={16}>Age 16 · Scholarship Starlet</option>
                <option value={17}>Age 17 · First-Team Breakthrough</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1.5">Playing Position</label>
              <select
                value={position}
                onChange={e => setPosition(e.target.value as Position)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-mono font-bold focus:outline-none"
              >
                <option value="ST">ST · Striker (Number 9)</option>
                <option value="LW">LW · Left Winger</option>
                <option value="RW">RW · Right Winger</option>
                <option value="CAM">CAM · Attacking Midfielder</option>
                <option value="CM">CM · Central Midfielder</option>
                <option value="CDM">CDM · Defensive Midfielder</option>
                <option value="CB">CB · Center Back</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1.5">Player Archetype</label>
              <select
                value={archetype}
                onChange={e => setArchetype(e.target.value as PlayerArchetype)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs font-bold focus:outline-none"
              >
                <option value="Poacher">Poacher (Lethal Finishing & Instinct)</option>
                <option value="Playmaker">Playmaker (Vision, Through Balls & Flair)</option>
                <option value="Speed Demon">Speed Demon (Explosive Sprint Acceleration)</option>
                <option value="Box-to-Box Engine">Box-to-Box Engine (Endurance & High Workrate)</option>
                <option value="Target Man">Target Man (Aerial Power & Hold-Up Play)</option>
                <option value="Set Piece Specialist">Set Piece Specialist (Curve & Free Kicks)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 uppercase font-bold block mb-1.5">Origin Story</label>
              <select
                value={origin}
                onChange={e => setOrigin(e.target.value as PlayerOrigin)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:outline-none"
              >
                <option value="street_cage_talent">Street & Cage Prodigy (Raw Flair)</option>
                <option value="academy_prodigy">Category 1 Academy Starlet</option>
                <option value="south_american_gem">South American Wonderkid</option>
                <option value="lower_league_grinder">Grassroots Lower-League Grinder</option>
              </select>
            </div>
          </div>

          {/* ==================================================== */}
          {/* 5. STARTING ACADEMY LAUNCHPAD & LOCAL TAX RESIDENCY */}
          {/* ==================================================== */}
          <div className="space-y-2">
            <label className="text-[11px] text-slate-400 uppercase font-bold block">
              5. Starting Academy / Club Launchpad (Age 16)
            </label>
            <select
              value={startingClubId}
              onChange={e => setStartingClubId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white text-xs focus:border-emerald-500 focus:outline-none font-medium"
            >
              {starterClubs.map(c => {
                const supported = isLegacyClubSupported(c.id);
                return (
                  <option key={c.id} value={c.id} disabled={!supported}>
                    {c.name} ({c.city}, {c.country} · {c.league}){supported ? '' : ' — Not available in Living World yet'}
                  </option>
                );
              })}
            </select>

            {/* Live Tax Residency Preview based on Club Location */}
            {(() => {
              const selectedClub = getClubById(startingClubId);
              const taxPreview = calculateTaxBreakdown(selectedClub, 500, 5);
              return (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">Tax Residency at Club:</span>
                      <span className="text-white font-bold">{selectedClub.country} · {taxPreview.taxAuthorityShort}</span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Statutory Regime:</span>
                    <span className={`font-mono font-bold ${taxPreview.isTaxFreeHaven ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {taxPreview.isTaxFreeHaven ? '0% Personal Income Tax Haven' : `${taxPreview.effectiveRatePercent}% Tax Deduction (${taxPreview.taxSchemeName})`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* ==================================================== */}
          {/* SUBMIT BUTTON */}
          {/* ==================================================== */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4" />
              Sign First Scholarship Contract & Launch Career
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
