import { AgencyRepresentation } from '../types/game';

export const FOOTBALL_AGENCIES: AgencyRepresentation[] = [
  {
    id: 'gestifute_iberian',
    agentName: 'Jorge Mendes',
    agencyName: 'Gestifute Global Football',
    tier: 'GLOBAL_POWERBROKER',
    agentFeePercent: 10,
    reputation: 98,
    influenceRating: 99,
    perks: [
      'Direct WhatsApp access to presidents of Real Madrid, PSG, Barcelona & Man City',
      'Unlocks +30% higher initial wage offers in contract negotiations',
      'Global Nike / Adidas boot sponsorship priority placement',
      'Aggressive media PR machine defending you during poor form',
    ],
    signingBonusCost: 25000,
    description: 'The pinnacle of football agency power. Ruthless boardroom muscle and undisputed influence across European elite royalty.',
    dialogueTone: 'High-octane, elite, connected, and commanding of respect from world directors.',
  },
  {
    id: 'stellar_elite',
    agentName: 'Jonathan Barnett',
    agencyName: 'Stellar Sports Group',
    tier: 'GLOBAL_POWERBROKER',
    agentFeePercent: 8,
    reputation: 94,
    influenceRating: 92,
    perks: [
      'Unrivaled command of the English Premier League & Bundesliga markets',
      'Guarantees minimum release clauses to prevent clubs trapping you',
      'Secures +20% higher signing-on bonuses',
      'Dedicated legal team handling visas and international work permits',
    ],
    signingBonusCost: 15000,
    description: 'Premier British powerhouse with hundreds of top-flight stars. Renowned for turning young prospects into hundred-million-pound superstars.',
    dialogueTone: 'Assertive, articulate, experienced, and focused on commercial leverage.',
  },
  {
    id: 'apex_boutique',
    agentName: 'Clara Dubois',
    agencyName: 'Apex Boutique Talent Agency',
    tier: 'BOUTIQUE_DEV',
    agentFeePercent: 5,
    reputation: 82,
    influenceRating: 80,
    perks: [
      'Guaranteed individual focus—client roster strictly capped at 12 players',
      'Fair 5% commission leaving more net wages in your bank account',
      'Prioritizes regular matchday minutes and playing time over benchwarmers',
      'Zero leaks or controversies with club managers (+10 Manager Trust)',
    ],
    signingBonusCost: 5000,
    description: 'Modern, ethical, data-driven football representation. Focused on long-term athletic development rather than quick agent fee paydays.',
    dialogueTone: 'Supportive, transparent, strategic, and protective of your mental and physical health.',
  },
  {
    id: 'family_office',
    agentName: 'Marcus & Family Trust',
    agencyName: 'Family Office Representation',
    tier: 'FAMILY_OFFICE',
    agentFeePercent: 3,
    reputation: 70,
    influenceRating: 68,
    perks: [
      'Lowest 3% fee structure maximizing your family wealth accumulation',
      '100% genuine loyalty—never receives kickbacks from third-party clubs',
      '+20 Family Relations and deep alignment with your hometown roots',
      'Zero drama in the dressing room',
    ],
    signingBonusCost: 0,
    description: 'Your close family and lifelong trusted confidants. Total devotion to your happiness, community legacy, and ethical values.',
    dialogueTone: 'Warm, familial, deeply loyal, and protective of family honor.',
  },
];

export function getAgencyById(id: string): AgencyRepresentation {
  return FOOTBALL_AGENCIES.find(a => a.id === id) || FOOTBALL_AGENCIES[2];
}
