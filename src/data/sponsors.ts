import { SponsorDeal } from '../types/game';

export const SPONSOR_CATALOG: Omit<SponsorDeal, 'active' | 'yearsRemaining'>[] = [
  // Boots & Footwear Tier
  {
    id: 'nike_mercurial',
    brandName: 'Nike Football',
    category: 'boots',
    weeklyPay: 6_500,
    requirements: 'Minimum 72 OVR rating & 5 career goals',
    perks: '+3 Acceleration and +2 Dribbling boots equipment',
  },
  {
    id: 'adidas_predator',
    brandName: 'Adidas Soccer',
    category: 'boots',
    weeklyPay: 8_200,
    requirements: 'Minimum 76 OVR rating & 10 career assists',
    perks: '+3 Ball Control, +2 Curve and swerve accuracy',
  },
  {
    id: 'puma_future',
    brandName: 'Puma King & Future',
    category: 'boots',
    weeklyPay: 5_800,
    requirements: 'Minimum 70 OVR rating',
    perks: '+2 Agility and +2 Sprint Speed',
  },
  {
    id: 'mizuno_morelia',
    brandName: 'Mizuno Craftsmanship',
    category: 'boots',
    weeklyPay: 4_200,
    requirements: 'Minimum 68 OVR rating',
    perks: '+4 Pure Leather Touch & Ball Control',
  },
  
  // Luxury Lifestyle & Watches
  {
    id: 'hublot_luxury',
    brandName: 'Hublot Timepieces',
    category: 'lifestyle',
    weeklyPay: 14_000,
    requirements: 'Minimum 82 OVR rating & League appearance in Top 5 League',
    perks: 'VIP Ambassador status; +15% Fan Popularity boost',
  },
  {
    id: 'tag_heuer',
    brandName: 'TAG Heuer Sport',
    category: 'lifestyle',
    weeklyPay: 9_500,
    requirements: 'Minimum 78 OVR rating',
    perks: '+10% Media standing and interview acclaim',
  },

  // Nutrition & Performance Drinks
  {
    id: 'red_bull_athlete',
    brandName: 'Red Bull Global Athlete',
    category: 'nutrition',
    weeklyPay: 12_500,
    requirements: 'Minimum 80 OVR rating & 15 Match starts in a season',
    perks: 'High-performance laboratory access; +4 Stamina recovery speed',
  },
  {
    id: 'gatorade_hydration',
    brandName: 'Gatorade High Octane',
    category: 'nutrition',
    weeklyPay: 5_000,
    requirements: 'Minimum 72 OVR rating',
    perks: '+5% Energy conservation during matches',
  },

  // Tech & Gaming
  {
    id: 'playstation_ambassador',
    brandName: 'PlayStation FC',
    category: 'tech',
    weeklyPay: 11_000,
    requirements: 'Minimum 79 OVR rating & 20+ career goals or assists',
    perks: 'E-Sports cover star; +20% Personal Brand growth',
  },
  {
    id: 'ea_sports_cover',
    brandName: 'EA Sports Global Cover Star',
    category: 'tech',
    weeklyPay: 28_000,
    requirements: 'Minimum 88 OVR rating & Ballon d\'Or top 5 nomination',
    perks: 'Worldwide household icon; +35% Commercial sponsor value',
  },
];
