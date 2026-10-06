export interface CountryData {
  id: string;
  name: string;
  code: string;
  flag: string;
  defaultCity: string;
  naturalHeritage?: {
    country: string;
    code: string;
    heritageReason: string;
  };
}

export interface RegionData {
  id: string;
  name: string;
  countries: CountryData[];
}

export interface ContinentData {
  id: string;
  name: string;
  icon: string;
  regions: RegionData[];
}

export const WORLD_GEOGRAPHY: ContinentData[] = [
  // 1. AFRICA (CAF)
  {
    id: 'africa',
    name: 'Africa',
    icon: '🌍',
    regions: [
      {
        id: 'west_africa',
        name: 'West Africa',
        countries: [
          {
            id: 'nigeria',
            name: 'Nigeria',
            code: 'NG',
            flag: '🇳🇬',
            defaultCity: 'Surulere, Lagos, Nigeria',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'Anglo-Nigerian diaspora & family residency in the UK' },
          },
          {
            id: 'ghana',
            name: 'Ghana',
            code: 'GH',
            flag: '🇬🇭',
            defaultCity: 'Kumasi, Ghana',
            naturalHeritage: { country: 'Germany', code: 'DE', heritageReason: 'German-Ghanaian heritage roots' },
          },
          {
            id: 'senegal',
            name: 'Senegal',
            code: 'SN',
            flag: '🇸🇳',
            defaultCity: 'Dakar, Senegal',
            naturalHeritage: { country: 'France', code: 'FR', heritageReason: 'Franco-Senegalese cultural ties & residency' },
          },
          {
            id: 'ivory_coast',
            name: 'Ivory Coast',
            code: 'CI',
            flag: '🇨🇮',
            defaultCity: 'Abidjan, Ivory Coast',
            naturalHeritage: { country: 'France', code: 'FR', heritageReason: 'French-Ivorian dual community heritage' },
          },
          {
            id: 'cameroon',
            name: 'Cameroon',
            code: 'CM',
            flag: '🇨🇲',
            defaultCity: 'Douala, Cameroon',
            naturalHeritage: { country: 'France', code: 'FR', heritageReason: 'Franco-Cameroonian ancestral citizenship' },
          },
        ],
      },
      {
        id: 'north_africa',
        name: 'North Africa',
        countries: [
          {
            id: 'morocco',
            name: 'Morocco',
            code: 'MA',
            flag: '🇲🇦',
            defaultCity: 'Casablanca, Morocco',
            naturalHeritage: { country: 'Spain', code: 'ES', heritageReason: 'Iberian-Moroccan cross-border ancestral residency' },
          },
          {
            id: 'algeria',
            name: 'Algeria',
            code: 'DZ',
            flag: '🇩🇿',
            defaultCity: 'Algiers, Algeria',
            naturalHeritage: { country: 'France', code: 'FR', heritageReason: 'Franco-Algerian diaspora family roots' },
          },
          {
            id: 'egypt',
            name: 'Egypt',
            code: 'EG',
            flag: '🇪🇬',
            defaultCity: 'Cairo, Egypt',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'British-Egyptian academic family residency' },
          },
        ],
      },
      {
        id: 'southern_africa',
        name: 'Southern & Central Africa',
        countries: [
          {
            id: 'south_africa',
            name: 'South Africa',
            code: 'ZA',
            flag: '🇿🇦',
            defaultCity: 'Johannesburg, South Africa',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'Commonwealth lineage & ancestry' },
          },
          {
            id: 'dr_congo',
            name: 'DR Congo',
            code: 'CD',
            flag: '🇨🇩',
            defaultCity: 'Kinshasa, DR Congo',
            naturalHeritage: { country: 'Belgium', code: 'BE', heritageReason: 'Belgo-Congolese ancestral residency' },
          },
        ],
      },
    ],
  },

  // 2. EUROPE (UEFA)
  {
    id: 'europe',
    name: 'Europe',
    icon: '🏰',
    regions: [
      {
        id: 'western_europe',
        name: 'Western Europe',
        countries: [
          {
            id: 'england',
            name: 'England',
            code: 'ENG',
            flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
            defaultCity: 'London, England',
            naturalHeritage: { country: 'Jamaica', code: 'JAM', heritageReason: 'Windrush diaspora grandparents' },
          },
          {
            id: 'france',
            name: 'France',
            code: 'FR',
            flag: '🇫🇷',
            defaultCity: 'Bondy, Paris, France',
            naturalHeritage: { country: 'Algeria', code: 'DZ', heritageReason: 'Maghrebian heritage through maternal grandparents' },
          },
          {
            id: 'germany',
            name: 'Germany',
            code: 'DE',
            flag: '🇩🇪',
            defaultCity: 'Gelsenkirchen, Germany',
            naturalHeritage: { country: 'Poland', code: 'PL', heritageReason: 'Silesian Polish family lineage' },
          },
          {
            id: 'netherlands',
            name: 'Netherlands',
            code: 'NL',
            flag: '🇳🇱',
            defaultCity: 'Rotterdam, Netherlands',
            naturalHeritage: { country: 'Suriname', code: 'SR', heritageReason: 'Surinamese ancestry through parents' },
          },
          {
            id: 'belgium',
            name: 'Belgium',
            code: 'BE',
            flag: '🇧🇪',
            defaultCity: 'Brussels, Belgium',
            naturalHeritage: { country: 'DR Congo', code: 'CD', heritageReason: 'Congolese heritage through family roots' },
          },
        ],
      },
      {
        id: 'southern_europe',
        name: 'Southern Europe',
        countries: [
          {
            id: 'spain',
            name: 'Spain',
            code: 'ES',
            flag: '🇪🇸',
            defaultCity: 'Madrid, Spain',
            naturalHeritage: { country: 'Argentina', code: 'AR', heritageReason: 'Ibero-American dual citizenship by ancestry' },
          },
          {
            id: 'portugal',
            name: 'Portugal',
            code: 'PT',
            flag: '🇵🇹',
            defaultCity: 'Lisbon, Portugal',
            naturalHeritage: { country: 'Brazil', code: 'BR', heritageReason: 'Luso-Brazilian parental heritage' },
          },
          {
            id: 'italy',
            name: 'Italy',
            code: 'IT',
            flag: '🇮🇹',
            defaultCity: 'Naples, Italy',
            naturalHeritage: { country: 'Argentina', code: 'AR', heritageReason: 'Italo-Argentine grandparents lineage' },
          },
        ],
      },
      {
        id: 'eastern_europe',
        name: 'Eastern & Northern Europe',
        countries: [
          {
            id: 'croatia',
            name: 'Croatia',
            code: 'HR',
            flag: '🇭🇷',
            defaultCity: 'Zagreb, Croatia',
            naturalHeritage: { country: 'Germany', code: 'DE', heritageReason: 'German diaspora family roots' },
          },
          {
            id: 'norway',
            name: 'Norway',
            code: 'NO',
            flag: '🇳🇴',
            defaultCity: 'Bryne, Norway',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'Birth residency during father\'s Premier League career' },
          },
        ],
      },
    ],
  },

  // 3. SOUTH AMERICA (CONMEBOL)
  {
    id: 'south_america',
    name: 'South America',
    icon: '⚽',
    regions: [
      {
        id: 'conmebol_core',
        name: 'Latin America Core',
        countries: [
          {
            id: 'brazil',
            name: 'Brazil',
            code: 'BR',
            flag: '🇧🇷',
            defaultCity: 'Santos, São Paulo, Brazil',
            naturalHeritage: { country: 'Portugal', code: 'PT', heritageReason: 'Ancestral Portuguese passport rights (Lei de Cidadania)' },
          },
          {
            id: 'argentina',
            name: 'Argentina',
            code: 'AR',
            flag: '🇦🇷',
            defaultCity: 'Rosario, Santa Fe, Argentina',
            naturalHeritage: { country: 'Italy', code: 'IT', heritageReason: 'Italian jure sanguinis citizenship via grandparents' },
          },
          {
            id: 'uruguay',
            name: 'Uruguay',
            code: 'UY',
            flag: '🇺🇾',
            defaultCity: 'Montevideo, Uruguay',
            naturalHeritage: { country: 'Spain', code: 'ES', heritageReason: 'Spanish passport ancestral eligibility' },
          },
          {
            id: 'colombia',
            name: 'Colombia',
            code: 'CO',
            flag: '🇨🇴',
            defaultCity: 'Medellín, Colombia',
            naturalHeritage: { country: 'Spain', code: 'ES', heritageReason: 'Historical 2-year Ibero-American treaty eligibility' },
          },
        ],
      },
    ],
  },

  // 4. NORTH & CENTRAL AMERICA (CONCACAF)
  {
    id: 'north_america',
    name: 'North & Central America',
    icon: '🌎',
    regions: [
      {
        id: 'concacaf_zone',
        name: 'North America & Caribbean',
        countries: [
          {
            id: 'usa',
            name: 'United States',
            code: 'USA',
            flag: '🇺🇸',
            defaultCity: 'Miami, Florida, USA',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'Dual citizenship via British expatriate parents' },
          },
          {
            id: 'mexico',
            name: 'Mexico',
            code: 'MEX',
            flag: '🇲🇽',
            defaultCity: 'Guadalajara, Mexico',
            naturalHeritage: { country: 'Spain', code: 'ES', heritageReason: 'Ibero-American dual nationality treaty' },
          },
          {
            id: 'jamaica',
            name: 'Jamaica',
            code: 'JAM',
            flag: '🇯🇲',
            defaultCity: 'Kingston, Jamaica',
            naturalHeritage: { country: 'England', code: 'ENG', heritageReason: 'British-Caribbean Commonwealth passport lineage' },
          },
          {
            id: 'canada',
            name: 'Canada',
            code: 'CAN',
            flag: '🇨🇦',
            defaultCity: 'Toronto, Ontario, Canada',
            naturalHeritage: { country: 'Ghana', code: 'GH', heritageReason: 'West African diaspora family background' },
          },
        ],
      },
    ],
  },

  // 5. ASIA & MIDDLE EAST (AFC)
  {
    id: 'asia',
    name: 'Asia & Middle East',
    icon: '🌏',
    regions: [
      {
        id: 'east_asia',
        name: 'East Asia & Middle East',
        countries: [
          {
            id: 'japan',
            name: 'Japan',
            code: 'JPN',
            flag: '🇯🇵',
            defaultCity: 'Osaka, Japan',
            naturalHeritage: { country: 'Germany', code: 'DE', heritageReason: 'European academy residency' },
          },
          {
            id: 'south_korea',
            name: 'South Korea',
            code: 'KOR',
            flag: '🇰🇷',
            defaultCity: 'Seoul, South Korea',
            naturalHeritage: { country: 'Germany', code: 'DE', heritageReason: 'Bundesliga youth development residency' },
          },
          {
            id: 'saudi_arabia',
            name: 'Saudi Arabia',
            code: 'KSA',
            flag: '🇸🇦',
            defaultCity: 'Riyadh, Saudi Arabia',
            naturalHeritage: undefined,
          },
        ],
      },
    ],
  },
];
