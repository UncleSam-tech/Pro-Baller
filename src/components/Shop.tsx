import React, { useState } from 'react';
import { Player } from '../types/game';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Award, Briefcase, Car, Check, DollarSign, Dumbbell, Globe, Heart, Home, 
  Package, Shield, Sparkles, Tag, Trophy, UserCheck, Users, Utensils, Zap, Plane
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShopProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'family' | 'real_estate' | 'vehicles_luxury' | 'entourage_staff' | 'business_equity' | 'culture_development' | 'gear' | 'recovery';
  priceGBP: number;
  description: string;
  perk: string;
  badge?: string;
  attributeBoost?: {
    stamina?: number;
    pace?: number;
    ballControl?: number;
    morale?: number;
    familyRelations?: number;
    disciplineRating?: number;
    managerTrust?: number;
    fanReputation?: number;
  };
}

export const SHOP_CATALOG: ShopItem[] = [
  // ==========================================
  // 1. FAMILY & COMMUNITY (THE PERSON BEHIND THE FOOTBALLER)
  // ==========================================
  {
    id: 'family_estate_home',
    name: 'Gated Family Mansion in Hometown',
    category: 'family',
    priceGBP: 350_000,
    description: 'Purchasing a spacious 6-bedroom estate for your mother and father in your hometown. Lifelong dream fulfilled.',
    perk: 'Family Relations maxed to 100% & permanent peaceful mind',
    badge: 'HUMAN ROOTS',
    attributeBoost: { familyRelations: 25, morale: 15 },
  },
  {
    id: 'sibling_university',
    name: 'Full University Tuition & Living for Siblings',
    category: 'family',
    priceGBP: 65_000,
    description: 'Covering 4-year tuition, housing, and stipends at top international universities in the UK or US for your siblings.',
    perk: '+15 Family Harmony & +8 Personal Morale',
    badge: 'EDUCATION',
    attributeBoost: { familyRelations: 15, morale: 8 },
  },
  {
    id: 'village_water_solar',
    name: 'Solar-Powered Clean Water Borehole Project',
    category: 'family',
    priceGBP: 25_000,
    description: 'Funding two industrial deep boreholes and solar filtration systems providing clean drinking water to 5,000 residents in your hometown.',
    perk: '+20 Fan Reputation & Hometown Hero Status',
    badge: 'COMMUNITY',
    attributeBoost: { fanReputation: 12, familyRelations: 10 },
  },
  {
    id: 'hometown_medical_clinic',
    name: 'Endow Modern Maternal & Pediatric Clinic Wing',
    category: 'family',
    priceGBP: 250_000,
    description: 'Equipping a modern medical wing with incubators, ultrasound machines, and free maternity healthcare back home.',
    perk: '+30 Fan Reputation & National Humanitarian Acclaim',
    badge: 'HEALTHCARE',
    attributeBoost: { fanReputation: 18, morale: 12 },
  },
  {
    id: 'grassroots_academy_fund',
    name: 'Build Grassroots Synthetic Turf Football Academy',
    category: 'family',
    priceGBP: 120_000,
    description: 'Installing floodlit FIFA-certified artificial turf, locker rooms, and providing 200 pairs of boots for local kids in your neighborhood.',
    perk: '+25 Fan Reputation & Enduring Grassroots Legacy',
    badge: 'LEGACY',
    attributeBoost: { fanReputation: 15, managerTrust: 5 },
  },
  {
    id: 'parents_pilgrimage',
    name: 'Parents VIP Holy Pilgrimage & World Tour',
    category: 'family',
    priceGBP: 30_000,
    description: 'Treating your parents to an all-inclusive first-class journey for their spiritual pilgrimage and European leisure.',
    perk: '+12 Family Relations & Divine Blessing Morale',
    badge: 'DEVOTION',
    attributeBoost: { familyRelations: 12, morale: 10 },
  },
  {
    id: 'family_debt_relief',
    name: 'Complete Family Debt Retirement & Annuity Fund',
    category: 'family',
    priceGBP: 150_000,
    description: 'Clearing all extended family mortgages and establishing a stable monthly stipend trust so parents never worry again.',
    perk: '+20 Family Relations & Mental Clarity on Pitch',
    badge: 'FREEDOM',
    attributeBoost: { familyRelations: 20, morale: 10 },
  },
  {
    id: 'annual_holiday_feast',
    name: 'Annual Town Community Carnival & Food Distribution',
    category: 'family',
    priceGBP: 15_000,
    description: 'Funding 1,000 bags of rice, food parcels, and a massive community carnival for holiday festivities back in your hometown.',
    perk: '+10 Fan Reputation & Hometown Adoration',
    badge: 'CHARITY',
    attributeBoost: { fanReputation: 8, familyRelations: 6 },
  },

  // ==========================================
  // 2. REAL ESTATE & ARCHITECTURAL LIVING
  // ==========================================
  {
    id: 'city_penthouse',
    name: 'Duplex Penthouse overlooking City Stadium',
    category: 'real_estate',
    priceGBP: 650_000,
    description: 'Private secure lift, floor-to-ceiling panoramic glass, Finnish sauna, and 24-hour concierge close to the stadium.',
    perk: '+10 Rest quality & High-Profile Living Prestige',
    badge: 'LUXURY LIVING',
    attributeBoost: { morale: 10 },
  },
  {
    id: 'suburban_training_estate',
    name: 'Gated Country Estate with Private Heated Turf Pitch',
    category: 'real_estate',
    priceGBP: 2_800_000,
    description: '12-acre secluded country property with heated full-size synthetic football pitch, Olympic indoor swimming pool, and biomechanics lab.',
    perk: 'Accelerates individual attribute training gains by +20%',
    badge: 'ELITE MANOR',
    attributeBoost: { morale: 15, stamina: 2 },
  },
  {
    id: 'ibiza_marbella_villa',
    name: 'Mediterranean Summer Retreat in Ibiza / Marbella',
    category: 'real_estate',
    priceGBP: 1_950_000,
    description: 'Cliffside ocean-view villa with infinity pool, private helipad, and private cove for post-season rejuvenation.',
    perk: 'Restores Energy & Morale to 100% during international breaks',
    badge: 'GETAWAY',
    attributeBoost: { morale: 15 },
  },
  {
    id: 'hyperbaric_chamber_room',
    name: 'Clinical Grade Hyperbaric Oxygen Chamber',
    category: 'real_estate',
    priceGBP: 45_000,
    description: '2.0 ATA medical hyperbaric capsule saturating bloodstream with 100% pure oxygen to slash injury downtime.',
    perk: 'Reduces recovery duration for any injury by 35%',
    badge: 'SPORTS TECH',
  },
  {
    id: 'cryo_recovery_pod',
    name: 'Whole-Body Electric Cryotherapy Chamber (-110°C)',
    category: 'real_estate',
    priceGBP: 35_000,
    description: 'Sub-zero dry cold therapy chamber stimulating norepinephrine and flushing metabolic fatigue within 3 minutes.',
    perk: '+20% Post-Match Stamina Regeneration',
    badge: 'RECOVERY',
    attributeBoost: { stamina: 1 },
  },
  {
    id: 'dolby_cinema_lounge',
    name: 'Dolby Atmos Private Screening & Tactical Analysis Suite',
    category: 'real_estate',
    priceGBP: 50_000,
    description: 'Acoustically isolated 4K laser projector suite for reviewing opponent match footage and leisure movie nights.',
    perk: '+5 Tactical Vision & High Rest Quality',
    badge: 'LEISURE',
  },
  {
    id: 'circadian_sleep_pod',
    name: 'Circadian Regulated Sleep Optimization Suite',
    category: 'real_estate',
    priceGBP: 22_000,
    description: 'Hydro-cooled adaptive mattress, HEPA hospital-grade air filtration, and acoustic sleep soundscapes.',
    perk: '+15% Energy restoration every week',
    badge: 'REST',
  },

  // ==========================================
  // 3. SUPERCARS, FLEETS & HIGH MOBILITY
  // ==========================================
  {
    id: 'range_rover_sv',
    name: 'Range Rover SV Long-Wheelbase (Daily Training Ride)',
    category: 'vehicles_luxury',
    priceGBP: 140_000,
    description: 'Executive class heated massaging rear seats, acoustic double-glazing, and whisper-quiet V8 for daily training commute.',
    perk: 'Zero-fatigue luxury travel to morning sessions',
    badge: 'DAILY DRIVER',
    attributeBoost: { morale: 4 },
  },
  {
    id: 'porsche_gt3_rs',
    name: 'Porsche 911 GT3 RS Weissach Package',
    category: 'vehicles_luxury',
    priceGBP: 210_000,
    description: 'Track-honed 518-hp naturally aspirated thoroughbred with active aerodynamics and carbon roll cage.',
    perk: '+12 Prestige & Adrenaline boost',
    badge: 'TRACK BEAST',
    attributeBoost: { morale: 8 },
  },
  {
    id: 'ferrari_296_gtb',
    name: 'Ferrari 296 GTB Hybrid V6 Supercar (819 HP)',
    category: 'vehicles_luxury',
    priceGBP: 295_000,
    description: 'Rosso Corsa mid-engine hybrid supercar. Turns heads in every luxury hotel valet and training ground car park.',
    perk: '+20 Lifestyle Prestige & Major Sponsor Appeal',
    badge: 'SUPERCAR',
    attributeBoost: { morale: 10, fanReputation: 5 },
  },
  {
    id: 'lambo_revuelto',
    name: 'Lamborghini Revuelto V12 Plug-In Hybrid (1001 HP)',
    category: 'vehicles_luxury',
    priceGBP: 480_000,
    description: 'Stealth-fighter styling, scissor doors, and howling V12 symphony. The pinnacle statement of global football stardom.',
    perk: '+25 Prestige Standing & Global Instagram Virality',
    badge: 'HYPERCAR',
    attributeBoost: { morale: 12, fanReputation: 8 },
  },
  {
    id: 'mercedes_maybach',
    name: 'Mercedes-Maybach S680 with Private Chauffeur',
    category: 'vehicles_luxury',
    priceGBP: 220_000,
    description: 'Champagne flutes, rear executive reclining beds, and dedicated licensed security chauffeur for zero travel stress.',
    perk: '+10 Rest quality on matchday travels',
    badge: 'CHAUFFEUR',
  },
  {
    id: 'netjets_jet_card',
    name: 'NetJets 50-Hour Private Jet Charter Membership',
    category: 'vehicles_luxury',
    priceGBP: 275_000,
    description: 'On-demand Bombardier Challenger 350 private jet ready within 4 hours for international family visits or sponsor shoots.',
    perk: 'Eliminates all international travel jetlag & delays',
    badge: 'PRIVATE JET',
    attributeBoost: { morale: 10 },
  },
  {
    id: 'yacht_summer_charter',
    name: '50-Meter Superyacht Mediterranean Summer Charter',
    category: 'vehicles_luxury',
    priceGBP: 180_000,
    description: 'Crew of 12, jet skis, private onboard chef, and jacuzzi cruising Monaco, Amalfi, and Saint-Tropez.',
    perk: '+25 Morale reset before pre-season training begins',
    badge: 'YACHT',
    attributeBoost: { morale: 15 },
  },
  {
    id: 'patek_nautilus',
    name: 'Patek Philippe Nautilus 5711 Rose Gold',
    category: 'vehicles_luxury',
    priceGBP: 110_000,
    description: 'Horological holy grail with iconic porthole bezel and brown sunburst embossed dial. True collectors status.',
    perk: '+10 Boardroom negotiation respect',
    badge: 'HOROLOGY',
  },
  {
    id: 'ap_royal_oak',
    name: 'Audemars Piguet Royal Oak Flying Tourbillon',
    category: 'vehicles_luxury',
    priceGBP: 195_000,
    description: 'Hand-finished openworked skeleton tourbillon encased in titanium. Symbol of haute horlogerie mastery.',
    perk: '+15 Commercial brand prestige',
    badge: 'HOROLOGY',
  },
  {
    id: 'richard_mille_athlete',
    name: 'Richard Mille RM 67-02 High-Performance Athlete Watch',
    category: 'vehicles_luxury',
    priceGBP: 240_000,
    description: 'Ultralight 32-gram Carbon TPT watch designed to withstand 50G shocks, worn directly during high-intensity sessions.',
    perk: '+15 Athletic style aura & sponsor interest',
    badge: 'HOROLOGY',
  },

  // ==========================================
  // 4. PERFORMANCE, MEDICAL & PERSONAL ENTOURAGE
  // ==========================================
  {
    id: 'private_chef_full',
    name: 'Private In-House Michelin Sports Nutritionist & Chef',
    category: 'entourage_staff',
    priceGBP: 36_000,
    description: 'Prepares precision anti-inflammatory meals, cold-pressed recovery juices, and personalized matchday fueling.',
    perk: 'Weekly Energy recovers to 100% every Monday',
    badge: 'NUTRITION',
    attributeBoost: { stamina: 1 },
  },
  {
    id: 'head_physio_retainer',
    name: 'Premier League Senior Physiotherapist Retainer',
    category: 'entourage_staff',
    priceGBP: 55_000,
    description: 'Exclusive daily manual therapy, osteopathy, and joint mobility adjustments following intense training.',
    perk: '-30% Risk of muscle strains and joint tears',
    badge: 'PHYSIO',
    attributeBoost: { pace: 1 },
  },
  {
    id: 'psychologist_retainer',
    name: 'Elite Sports Mental Performance Psychologist',
    category: 'entourage_staff',
    priceGBP: 28_000,
    description: 'Weekly cognitive training, pressure-scenario visualization, and coping strategies for hostile away crowds.',
    perk: '+5 Composure under clutch penalty pressure',
    badge: 'MINDSET',
    attributeBoost: { morale: 8 },
  },
  {
    id: 'security_detail_247',
    name: '24/7 Close Protection & Residential Security Detail',
    category: 'entourage_staff',
    priceGBP: 65_000,
    description: 'Licensed former special forces security officers patrolling home estate and providing secure VIP event transit.',
    perk: 'Eliminates distraction, burglary risk, and anxiety',
    badge: 'SECURITY',
  },
  {
    id: 'pr_branding_agency',
    name: 'Global Sports PR & Media Strategy Agency',
    category: 'entourage_staff',
    priceGBP: 45_000,
    description: 'Curates verified social media feeds, handles documentary filming, and secures international magazine covers.',
    perk: '+20% Annual Endorsement and Sponsor Revenue',
    badge: 'PR BRAND',
    attributeBoost: { fanReputation: 10 },
  },
  {
    id: 'wealth_counsel_tax',
    name: 'Certified Private Wealth Manager & Offshore Tax Counsel',
    category: 'entourage_staff',
    priceGBP: 50_000,
    description: 'Structures wage bonuses, image rights trusts, and diversified investments to protect generational wealth.',
    perk: 'Protects earnings from high taxation & bad investments',
    badge: 'FINANCIAL',
  },
  {
    id: 'sprint_biomechanic_coach',
    name: 'Private Olympic Biomechanical Sprint Coach',
    category: 'entourage_staff',
    priceGBP: 25_000,
    description: 'High-speed camera stride cadence analysis optimizing initial 10-meter burst acceleration and foot strike.',
    perk: '+2 Acceleration & Explosive Sprint Burst',
    badge: 'SPEED',
    attributeBoost: { pace: 2 },
  },
  {
    id: 'sleep_coach_specialist',
    name: 'Elite Sleep Architecture & REM Recovery Consultant',
    category: 'entourage_staff',
    priceGBP: 18_000,
    description: 'Monitors deep sleep biometrics and chronotype schedules around evening Champions League kickoffs.',
    perk: '+10% Weekly Match Sharpness retention',
    badge: 'SLEEP',
  },

  // ==========================================
  // 5. BUSINESS, EQUITY & WEALTH INVESTMENTS
  // ==========================================
  {
    id: 'tech_ai_angel',
    name: 'Angel Equity Stake in Sports AI Vision Analytics Startup',
    category: 'business_equity',
    priceGBP: 200_000,
    description: 'Early-stage equity in computer-vision player tracking platform used by top European clubs and broadcasters.',
    perk: 'Yields £800/week passive royalty return & tech prestige',
    badge: 'VENTURE',
  },
  {
    id: 'commercial_plaza_gym',
    name: 'Commercial Real Estate Plaza & Athletic Fitness Club',
    category: 'business_equity',
    priceGBP: 1_200_000,
    description: 'Freehold commercial development with high-end gym, sports clinic, and retail stores in prime metropolitan area.',
    perk: 'Yields £4,500/week passive rental dividend',
    badge: 'REAL ESTATE',
  },
  {
    id: 'streetwear_brand',
    name: 'Found Luxury Athleisure & Streetwear Fashion Label',
    category: 'business_equity',
    priceGBP: 350_000,
    description: 'Launch designer capsule collection worn by fellow footballers, musicians, and influencers worldwide.',
    perk: '+25 Fan Reputation & £1,800/week fashion brand earnings',
    badge: 'FASHION',
    attributeBoost: { fanReputation: 12 },
  },
  {
    id: 'grassroots_club_stake',
    name: '10% Co-Ownership Stake in Hometown Football Club',
    category: 'business_equity',
    priceGBP: 500_000,
    description: 'Invest in grassroots club facilities, academy scouting, and community outreach. True club custodian.',
    perk: 'Permanent Legendary Status & Scouting Pipeline',
    badge: 'OWNERSHIP',
    attributeBoost: { fanReputation: 20 },
  },
  {
    id: 'specialty_coffee_chain',
    name: 'Artisanal Specialty Coffee Roastery Franchise',
    category: 'business_equity',
    priceGBP: 280_000,
    description: 'Open flagship specialty espresso bars in London and city center, catering to athletes and creatives.',
    perk: 'Generates £1,200/week passive franchise profit',
    badge: 'HOSPITALITY',
  },
  {
    id: 'esports_org_franchise',
    name: 'Top-Tier Competitive Esports Gaming Franchise',
    category: 'business_equity',
    priceGBP: 450_000,
    description: 'Co-own championship team competing in EA FC and Counter-Strike with gaming house and merchandise line.',
    perk: 'Attracts 500k Gen-Z fans & £2,200/week digital sponsorships',
    badge: 'ESPORTS',
    attributeBoost: { fanReputation: 15 },
  },
  {
    id: 'solar_farm_equity',
    name: 'Clean Energy Solar Microgrid Equity Project',
    category: 'business_equity',
    priceGBP: 400_000,
    description: 'Utility-scale solar installation feeding clean power to 10,000 households with guaranteed government tariffs.',
    perk: 'Yields £2,000/week green energy return & humanitarian award',
    badge: 'GREEN TECH',
  },

  // ==========================================
  // 6. CULTURE, IMMIGRATION & SELF-DEVELOPMENT
  // ==========================================
  {
    id: 'multilingual_tutor',
    name: 'Private Polyglot Language Tutors (Spanish, English, French)',
    category: 'culture_development',
    priceGBP: 12_000,
    description: 'Daily conversational fluency coaching to communicate seamlessly with international teammates and overseas managers.',
    perk: '+15 Team Chemistry & Seamless European Transfers',
    badge: 'LANGUAGES',
    attributeBoost: { managerTrust: 5 },
  },
  {
    id: 'pga_golf_membership',
    name: 'Lifetime PGA Championship Golf Club Membership',
    category: 'culture_development',
    priceGBP: 30_000,
    description: 'Exclusive country club access to relax on off-days, bond with veteran captains, and conduct discreet business.',
    perk: '+10 Leadership & Locker Room Harmony',
    badge: 'NETWORKING',
  },
  {
    id: 'music_studio_setup',
    name: 'Professional Acoustic Sound Recording & Beats Studio',
    category: 'culture_development',
    priceGBP: 40_000,
    description: 'Custom vocal booth, analog synthesizers, and mixing console for unwinding with music production.',
    perk: '+10 Morale & Creative self-expression off the pitch',
    badge: 'CREATIVE',
    attributeBoost: { morale: 10 },
  },
  {
    id: 'fast_track_passport_desk',
    name: 'Diplomatic Courier Fast-Track Passport Renewal',
    category: 'culture_development',
    priceGBP: 6_000,
    description: 'Immediate 48-hour biometric passport issuance via diplomatic channels, guaranteeing travel readiness.',
    perk: 'Instantly eliminates travel blocks & ensures 10-year validity',
    badge: 'PASSPORT',
  },
  {
    id: 'sports_immigration_barrister',
    name: 'Top Sports Immigration Barrister Retainer (UK & EU)',
    category: 'culture_development',
    priceGBP: 18_000,
    description: 'Elite legal chambers handling GBE Home Office points appeals, Exceptions Panels, and non-EU work permits.',
    perk: 'Guarantees 100% legal approval on international transfers',
    badge: 'LEGAL',
  },
  {
    id: 'dual_nationality_filing',
    name: 'Ancestry & Naturalization Dual Citizenship Filing',
    category: 'culture_development',
    priceGBP: 8_500,
    description: 'Genealogical heritage verification with foreign ministries to unlock secondary European or African passport.',
    perk: 'Unlocks Dual Citizenship & FIFA National Team Eligibility',
    badge: 'CITIZENSHIP',
  },
  {
    id: 'charity_gala_sponsor',
    name: 'Host Annual Black-Tie Charitable Foundation Gala',
    category: 'culture_development',
    priceGBP: 85_000,
    description: 'Host gala dinner attended by club directors, ambassadors, and celebrity teammates to raise millions for children.',
    perk: '+25 Fan Approval & Ballon d\'Or Prestige Aura',
    badge: 'PHILANTHROPY',
    attributeBoost: { fanReputation: 15, managerTrust: 5 },
  },
  {
    id: 'media_masterclass',
    name: 'Broadcast Television & Press Conference Masterclass',
    category: 'culture_development',
    priceGBP: 15_000,
    description: 'Trained by veteran Sky Sports and BBC producers on public speaking, crisis communications, and charisma.',
    perk: '+15 Composure during tough media press conferences',
    badge: 'MEDIA',
    attributeBoost: { fanReputation: 8 },
  },

  // ==========================================
  // 7. PERFORMANCE GEAR & SPORTS SCIENCE
  // ==========================================
  {
    id: 'speed_hurdles',
    name: 'Pro Speed Ladders & Cone Agility Set',
    category: 'gear',
    priceGBP: 350,
    description: 'Precision footwork coordination kit for off-training practice in your backyard or local park.',
    perk: '+2 Agility & foot speed development',
  },
  {
    id: 'gps_vest',
    name: 'Catapult GPS Athlete Performance Vest',
    category: 'gear',
    priceGBP: 1_800,
    description: 'Biometric telemetry vest measuring sprint distance, heart rate variance, and explosive workload.',
    perk: '+3 Stamina tracking and injury prevention',
    attributeBoost: { stamina: 1 },
  },
  {
    id: 'carbon_boots',
    name: 'Custom Carbon-Fiber Outsole Football Boots',
    category: 'gear',
    priceGBP: 450,
    description: 'Ultralight molded boots with titanium studs tailored specifically to your foot dimensions.',
    perk: '+2 Acceleration & first-touch grip',
    attributeBoost: { pace: 1 },
  },
  {
    id: 'fifa_match_balls',
    name: 'Box of 10 Official FIFA Pro Match Balls',
    category: 'gear',
    priceGBP: 750,
    description: 'Thermally bonded aerodynamic match balls for daily individual free kick and shooting practice.',
    perk: '+2 Curve & shooting precision',
  },

  // ==========================================
  // 8. PHYSICAL RECOVERY HARDWARE
  // ==========================================
  {
    id: 'massage_gun',
    name: 'Theragun Pro Deep-Tissue Percussion Gun',
    category: 'recovery',
    priceGBP: 550,
    description: '16mm percussive arm reaching deep into tight hamstring and calf muscle knots post-match.',
    perk: 'Accelerates weekly muscle recovery +10%',
  },
  {
    id: 'normatec_boots',
    name: 'Normatec Pneumatic Compression Boots',
    category: 'recovery',
    priceGBP: 1_200,
    description: 'Sequential pulsed compression boots flushing lactic acid out of tired legs after 90 minutes.',
    perk: '+15% Energy restoration between fixtures',
  },
  {
    id: 'cold_plunge_tub',
    name: 'Commercial Ice Bath & Chiller Tub',
    category: 'recovery',
    priceGBP: 4_500,
    description: 'Sub-zero hydrotherapy plunge tub installed at your home to reduce joint inflammation.',
    perk: 'Permanent -25% reduction in muscular injury risk',
  },
];

export const Shop: React.FC<ShopProps> = ({ player, onUpdatePlayer }) => {
  const [selectedCat, setSelectedCat] = useState<'all' | ShopItem['category']>('all');
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  const ownedItemIds = player.lifestyleAssets.ownedItemIds;

  const currency = player.preferredCurrency || 'GBP';

  const categories: { id: 'all' | ShopItem['category']; label: string; icon: any; count: number }[] = [
    { id: 'all', label: 'All Catalog', icon: Package, count: SHOP_CATALOG.length },
    { id: 'family', label: 'Family & Roots', icon: Heart, count: SHOP_CATALOG.filter(i => i.category === 'family').length },
    { id: 'real_estate', label: 'Real Estate & Mansions', icon: Home, count: SHOP_CATALOG.filter(i => i.category === 'real_estate').length },
    { id: 'vehicles_luxury', label: 'Supercars & Aviation', icon: Car, count: SHOP_CATALOG.filter(i => i.category === 'vehicles_luxury').length },
    { id: 'entourage_staff', label: 'Personal Entourage', icon: Users, count: SHOP_CATALOG.filter(i => i.category === 'entourage_staff').length },
    { id: 'business_equity', label: 'Business & Ventures', icon: Briefcase, count: SHOP_CATALOG.filter(i => i.category === 'business_equity').length },
    { id: 'culture_development', label: 'Culture & Visas', icon: Globe, count: SHOP_CATALOG.filter(i => i.category === 'culture_development').length },
    { id: 'gear', label: 'Pro Gear', icon: Dumbbell, count: SHOP_CATALOG.filter(i => i.category === 'gear').length },
    { id: 'recovery', label: 'Medical Tech', icon: Shield, count: SHOP_CATALOG.filter(i => i.category === 'recovery').length },
  ];

  const filteredItems = selectedCat === 'all' 
    ? SHOP_CATALOG 
    : SHOP_CATALOG.filter(i => i.category === selectedCat);

  const handleBuy = (item: ShopItem) => {
    sounds.playClick();
    if (player.bankBalance < item.priceGBP) {
      setPurchaseNotice(`Insufficient funds! You need ${formatCurrency(item.priceGBP, currency)} to purchase this item.`);
      return;
    }

    if (ownedItemIds.includes(item.id)) {
      setPurchaseNotice('You already own this investment!');
      return;
    }

    sounds.playFanfare();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    const newOwned = [...ownedItemIds, item.id];

    // Apply attribute boosts
    const updatedAttrs = { ...player.attributes };
    if (item.attributeBoost?.stamina) updatedAttrs.stamina = Math.min(99, updatedAttrs.stamina + item.attributeBoost.stamina);
    if (item.attributeBoost?.pace) updatedAttrs.pace = Math.min(99, updatedAttrs.pace + item.attributeBoost.pace);

    const defaultHometown = player.nationality === 'Nigeria' ? 'Surulere, Lagos, Nigeria' : `${player.nationality || 'Home'} City`;
    const rawP = player.person;
    const updatedPerson = {
      hometown: rawP?.hometown || defaultHometown,
      familyBackground: rawP?.familyBackground || 'Supportive family passionate about your football dream',
      familyRelations: rawP?.familyRelations ?? 88,
      monthlyRemittanceGBP: rawP?.monthlyRemittanceGBP ?? 150,
      isCaptain: rawP?.isCaptain ?? false,
      isViceCaptain: rawP?.isViceCaptain ?? false,
      jerseyNumberRequested: rawP?.jerseyNumberRequested || player.jerseyNumber || 19,
      disciplineRating: rawP?.disciplineRating ?? 92,
      nightlifeCurfewViolations: rawP?.nightlifeCurfewViolations ?? 0,
    };
    if (item.attributeBoost?.familyRelations) {
      updatedPerson.familyRelations = Math.min(100, updatedPerson.familyRelations + item.attributeBoost.familyRelations);
    }

    // Special item logic
    const rawPapers = player.travelPapers;
    const updatedPapers = {
      hasPassport: rawPapers?.hasPassport ?? true,
      passportExpiryYear: rawPapers?.passportExpiryYear ?? 2031,
      passportStatus: rawPapers?.passportStatus || 'VALID',
      hasWorkPermit: rawPapers?.hasWorkPermit ?? true,
      visaStatus: rawPapers?.visaStatus || 'UK GBE Work Permit',
      under18FifaClearance: rawPapers?.under18FifaClearance ?? true,
      tournamentClearanceApproved: rawPapers?.tournamentClearanceApproved ?? true,
    };
    if (item.id === 'fast_track_passport_desk') {
      updatedPapers.hasPassport = true;
      updatedPapers.passportExpiryYear = 2036;
      updatedPapers.passportStatus = 'VALID';
      updatedPapers.tournamentClearanceApproved = true;
    }
    if (item.id === 'sports_immigration_barrister') {
      updatedPapers.hasWorkPermit = true;
      updatedPapers.visaStatus = 'UK GBE Work Permit';
    }
    if (item.id === 'dual_nationality_filing') {
      if (player.dualNationality.secondaryCountry) {
        // formalize secondary nationality
        player.dualNationality.declaredSeniorCountry = player.dualNationality.secondaryCountry;
      }
    }

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - item.priceGBP,
      attributes: updatedAttrs,
      morale: Math.min(100, player.morale + (item.attributeBoost?.morale || 4)),
      managerTrust: Math.min(100, player.managerTrust + (item.attributeBoost?.managerTrust || 0)),
      fanReputation: Math.min(100, player.fanReputation + (item.attributeBoost?.fanReputation || 2)),
      person: updatedPerson,
      travelPapers: updatedPapers,
      lifestyleAssets: {
        ...player.lifestyleAssets,
        charityFounded: item.id === 'grassroots_academy_fund' || item.id === 'hometown_medical_clinic' ? true : player.lifestyleAssets.charityFounded,
        ownedItemIds: newOwned,
      },
    });

    setPurchaseNotice(`Successfully acquired "${item.name}"! ${item.perk}`);
  };

  return (
    <div className="space-y-6">
      {/* Financial Status Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              Wealth, Lifestyle & Life Investments
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Pro Footballer Lifestyle Emporium
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              "Whatever money can do and buy." Build generational family security, real estate empires, supercars, private aviation, elite medical entourage, and business investments.
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-right min-w-[200px]">
            <div className="text-xs text-slate-400">Available Liquid Funds</div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {formatCurrency(player.bankBalance, currency)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Weekly Wage: {formatCurrency(player.currentContract.weeklyWage, currency)}/wk
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800 pt-4 scrollbar-none">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => { sounds.playClick(); setSelectedCat(cat.id); }}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedCat === cat.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCat === cat.id ? 'bg-emerald-800 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {purchaseNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-600/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{purchaseNotice}</span>
          </div>
          <button 
            onClick={() => setPurchaseNotice(null)} 
            className="text-emerald-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid of Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => {
          const isOwned = ownedItemIds.includes(item.id);
          const canAfford = player.bankBalance >= item.priceGBP;

          return (
            <div 
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isOwned
                  ? 'bg-slate-950/60 border-emerald-900/40 opacity-90'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-lg'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.badge && (
                      <span className="text-[9px] uppercase tracking-wider font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 inline-block mb-1">
                        {item.badge}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-white leading-snug">
                      {item.name}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black font-mono text-emerald-400">
                      {formatCurrency(item.priceGBP, currency)}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {item.description}
                </p>

                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item.perk}</span>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800/60">
                {isOwned ? (
                  <div className="py-2.5 px-3 bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Acquired & Active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-98'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    {canAfford ? `Purchase (${formatCurrency(item.priceGBP, currency)})` : 'Insufficient Funds'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
