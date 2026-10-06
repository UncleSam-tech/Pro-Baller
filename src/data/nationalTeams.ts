export interface NationalTeam {
  id: string;
  name: string;
  code: string;
  flag: string;
  ranking: number;
  callUpThresholdOvr: number;
  confederation: 'UEFA' | 'CONMEBOL' | 'CAF' | 'AFC' | 'CONCACAF';
}

export const NATIONAL_TEAMS: NationalTeam[] = [
  { id: 'fra', name: 'France', code: 'FR', flag: '🇫🇷', ranking: 2, callUpThresholdOvr: 82, confederation: 'UEFA' },
  { id: 'arg', name: 'Argentina', code: 'AR', flag: '🇦🇷', ranking: 1, callUpThresholdOvr: 82, confederation: 'CONMEBOL' },
  { id: 'eng', name: 'England', code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', ranking: 4, callUpThresholdOvr: 81, confederation: 'UEFA' },
  { id: 'esp', name: 'Spain', code: 'ES', flag: '🇪🇸', ranking: 3, callUpThresholdOvr: 81, confederation: 'UEFA' },
  { id: 'bra', name: 'Brazil', code: 'BR', flag: '🇧🇷', ranking: 5, callUpThresholdOvr: 82, confederation: 'CONMEBOL' },
  { id: 'ger', name: 'Germany', code: 'DE', flag: '🇩🇪', ranking: 10, callUpThresholdOvr: 80, confederation: 'UEFA' },
  { id: 'por', name: 'Portugal', code: 'PT', flag: '🇵🇹', ranking: 7, callUpThresholdOvr: 80, confederation: 'UEFA' },
  { id: 'ned', name: 'Netherlands', code: 'NL', flag: '🇳🇱', ranking: 8, callUpThresholdOvr: 79, confederation: 'UEFA' },
  { id: 'ita', name: 'Italy', code: 'IT', flag: '🇮🇹', ranking: 9, callUpThresholdOvr: 79, confederation: 'UEFA' },
  { id: 'nga', name: 'Nigeria', code: 'NG', flag: '🇳🇬', ranking: 36, callUpThresholdOvr: 74, confederation: 'CAF' },
  { id: 'jpn', name: 'Japan', code: 'JP', flag: '🇯🇵', ranking: 15, callUpThresholdOvr: 75, confederation: 'AFC' },
  { id: 'usa', name: 'United States', code: 'US', flag: '🇺🇸', ranking: 18, callUpThresholdOvr: 74, confederation: 'CONCACAF' },
  { id: 'col', name: 'Colombia', code: 'CO', flag: '🇨🇴', ranking: 12, callUpThresholdOvr: 77, confederation: 'CONMEBOL' },
  { id: 'cro', name: 'Croatia', code: 'HR', flag: '🇭🇷', ranking: 11, callUpThresholdOvr: 78, confederation: 'UEFA' },
  { id: 'mar', name: 'Morocco', code: 'MA', flag: '🇲🇦', ranking: 13, callUpThresholdOvr: 76, confederation: 'CAF' },
  { id: 'nor', name: 'Norway', code: 'NO', flag: '🇳🇴', ranking: 43, callUpThresholdOvr: 74, confederation: 'UEFA' },
];

export function getNationalTeamByName(name: string): NationalTeam {
  const found = NATIONAL_TEAMS.find(t => t.name.toLowerCase() === name.toLowerCase());
  return found || NATIONAL_TEAMS[2]; // Default England
}
