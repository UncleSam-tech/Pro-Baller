import { Club, Player, Position, PlayerArchetype, PlayerOrigin } from '../types/game';
import { getClubById } from '../data/clubs';
import { generateProContract } from './contractGenerator';
import { getCountryCurrency } from './currency';
import { calculateTaxBreakdown } from './taxResidency';
import { DEFAULT_PLAYER_ROUTINE } from '../data/dailyRoutineData';

const STORAGE_KEY = 'career_legend_save_v1';

export function createNewPlayer(
  firstName: string,
  lastName: string,
  nationality: string,
  nationCode: string,
  position: Position,
  archetype: PlayerArchetype,
  origin: PlayerOrigin,
  startingClubId: string,
  hometown: string = 'Lagos, Nigeria',
  secondaryNation?: string,
  secondaryCode?: string,
  startingAge: number = 14
): Player {
  const club = getClubById(startingClubId);

  // Position baseline attributes (50-70 range for 16-year-old wonderkid)
  const isAttacker = ['ST', 'LW', 'RW'].includes(position);
  const isMid = ['CAM', 'CM', 'CDM'].includes(position);
  const isDef = ['LB', 'RB', 'CB'].includes(position);

  const initialAttrs = {
    // Physical
    pace: isAttacker ? 78 : isMid ? 68 : isDef ? 72 : 55,
    acceleration: isAttacker ? 80 : isMid ? 70 : isDef ? 71 : 56,
    stamina: 66,
    strength: isDef ? 74 : isAttacker ? 64 : 65,
    agility: isAttacker ? 76 : 68,
    jumping: isDef ? 75 : 62,

    // Technical
    finishing: isAttacker ? 72 : isMid ? 63 : 42,
    dribbling: isAttacker ? 75 : isMid ? 73 : 58,
    ballControl: isAttacker || isMid ? 74 : 62,
    shortPassing: isMid ? 76 : 66,
    longPassing: isMid ? 73 : 60,
    crossing: position === 'LW' || position === 'RW' || position === 'LB' || position === 'RB' ? 72 : 58,
    tackling: isDef ? 74 : isMid ? 65 : 36,
    shotPower: isAttacker ? 73 : 64,
    curve: 67,
    penalties: 65,

    // Mental
    composure: 66,
    vision: isMid ? 75 : 64,
    positioning: isAttacker || isDef ? 70 : 66,
    workRate: 72,
    leadership: 58,
    flair: isAttacker ? 74 : 62,
  };

  // Adjust for archetype
  if (archetype === 'Poacher') {
    initialAttrs.finishing += 5;
    initialAttrs.positioning += 5;
  } else if (archetype === 'Playmaker') {
    initialAttrs.vision += 5;
    initialAttrs.shortPassing += 5;
    initialAttrs.ballControl += 4;
  } else if (archetype === 'Speed Demon') {
    initialAttrs.pace += 6;
    initialAttrs.acceleration += 6;
  } else if (archetype === 'Box-to-Box Engine') {
    initialAttrs.stamina += 8;
    initialAttrs.workRate += 8;
  }

  // Calculate overall rating
  const keyAttrs = isAttacker 
    ? [initialAttrs.finishing, initialAttrs.pace, initialAttrs.dribbling, initialAttrs.ballControl, initialAttrs.positioning]
    : isMid 
    ? [initialAttrs.shortPassing, initialAttrs.vision, initialAttrs.ballControl, initialAttrs.stamina, initialAttrs.dribbling]
    : [initialAttrs.tackling, initialAttrs.positioning, initialAttrs.strength, initialAttrs.pace, initialAttrs.jumping];

  const overallRating = Math.round(keyAttrs.reduce((a, b) => a + b, 0) / keyAttrs.length);
  const potentialRating = Math.min(96, overallRating + 24);

  // Partial temp player to generate contract
  const tempPlayer = {
    overallRating,
    age: 16,
    currentYear: 2026,
    position,
    potentialRating,
    marketValue: 1_800_000,
    staff: { agentTier: 'family' as const, physioTier: 'none' as const, nutritionistTier: 'none' as const, prSpecialistTier: 'none' as const },
    lastName,
  } as unknown as Player;

  const initialContract = generateProContract(club, tempPlayer, 'Future Star');
  const initialTax = calculateTaxBreakdown(club, initialContract.weeklyWage, initialContract.agentFeePercent || 5);

  return {
    id: `player_${Date.now()}`,
    isUserCreated: true,
    firstName,
    lastName,
    nationality,
    nationCode,
    age: startingAge,
    currentYear: 2026,
    currentWeek: 1,
    position,
    preferredFoot: 'Right',
    heightCm: 182,
    weightKg: 75,
    jerseyNumber: isAttacker ? 19 : isMid ? 24 : 15,
    archetype,
    origin,
    traits: ['Finesse Specialist', 'Flair'],
    overallRating,
    potentialRating,
    energy: 95,
    matchSharpness: 70,
    morale: 88,
    form: 7.2,
    injuryWeeks: 0,
    injuryName: undefined,
    activeInjury: null,
    recurringInjuryCount: 0,
    preferredCurrency: getCountryCurrency(club.country),
    taxResidency: {
      country: initialTax.country,
      taxAuthority: initialTax.taxAuthority,
      taxAuthorityShort: initialTax.taxAuthorityShort,
      taxSystemName: initialTax.taxSchemeName,
      effectiveTaxRate: initialTax.effectiveRatePercent / 100,
      systemDescription: initialTax.notes,
      isTaxFreeHaven: initialTax.isTaxFreeHaven,
      totalTaxesPaidCareer: 0,
      lastTaxDeductionWeekly: initialTax.taxDeductedWeekly,
    },
    person: {
      hometown,
      familyBackground: origin === 'street_cage_talent' ? 'Humble working-class family with 3 siblings; parents made immense sacrifices for boots' : 'Supportive family passionate about your football dream',
      familyRelations: 88,
      monthlyRemittanceGBP: 150,
      isCaptain: false,
      isViceCaptain: false,
      jerseyNumberRequested: isAttacker ? 19 : isMid ? 24 : 15,
      disciplineRating: 92,
      nightlifeCurfewViolations: 0,
    },
    dualNationality: {
      primaryCountry: nationality,
      primaryCode: nationCode,
      secondaryCountry: secondaryNation || (nationality === 'Nigeria' ? 'England' : nationality === 'France' ? 'Algeria' : undefined),
      secondaryCode: secondaryCode || (nationality === 'Nigeria' ? 'ENG' : nationality === 'France' ? 'DZ' : undefined),
      isDeclaredSenior: false,
    },
    travelPapers: {
      hasPassport: true,
      passportExpiryYear: 2031,
      hasWorkPermit: true,
      visaStatus: club.country === 'England' && nationality !== 'England' ? 'UK GBE Work Permit' : 'Schengen Athlete',
      under18FifaClearance: true,
    },
    currentClubId: club.id,
    managerTrust: 65,
    teamChemistry: 70,
    fanReputation: 60,
    popularity: 30,
    squadRole: 'Future Star',
    attributes: initialAttrs,
    currentContract: initialContract,
    bankBalance: initialContract.signingBonus || 5_000,
    totalCareerEarnings: initialContract.signingBonus || 5_000,
    marketValue: 1_800_000,
    dailyRoutine: DEFAULT_PLAYER_ROUTINE,
    staff: {
      agentTier: 'family',
      physioTier: 'none',
      nutritionistTier: 'none',
      prSpecialistTier: 'none',
    },
    sponsors: [],
    lifestyleAssets: {
      residence: 'Academy Shared Dormitory',
      car: 'Used Compact Hatchback',
      charityFounded: false,
      personalBrandLevel: 1,
      ownedItemIds: [],
    },
    seasonStats: {
      appearances: 0,
      starts: 0,
      goals: 0,
      assists: 0,
      shotsOnTarget: 0,
      keyPasses: 0,
      tacklesWon: 0,
      cleanSheets: 0,
      manOfTheMatch: 0,
      yellowCards: 0,
      redCards: 0,
      avgRating: 0,
      ratingsHistory: [],
    },
    nationalTeamCaps: 0,
    nationalTeamGoals: 0,
    hasSeniorCallup: false,
    careerHistory: [],
    trophyCabinet: [],
    awards: [],
  };
}

export function savePlayer(player: Player): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  } catch (err) {
    console.error('Failed to save player state', err);
  }
}

export function loadPlayer(): Player | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);

    // Auto-migrate older saves that lacked new fields or had incomplete nested structures
    const defaultHometown = p.nationality === 'Nigeria' ? 'Surulere, Lagos, Nigeria' : `${p.nationality || 'Home'} City`;
    const rawP = p.person;
    p.person = {
      hometown: rawP?.hometown || defaultHometown,
      familyBackground: rawP?.familyBackground || 'Supportive family passionate about your football dream',
      familyRelations: rawP?.familyRelations ?? 88,
      monthlyRemittanceGBP: rawP?.monthlyRemittanceGBP ?? 150,
      isCaptain: rawP?.isCaptain ?? false,
      isViceCaptain: rawP?.isViceCaptain ?? false,
      jerseyNumberRequested: rawP?.jerseyNumberRequested || p.jerseyNumber || 19,
      disciplineRating: rawP?.disciplineRating ?? 92,
      nightlifeCurfewViolations: rawP?.nightlifeCurfewViolations ?? 0,
    };

    const rawDualNat = p.dualNationality;
    p.dualNationality = {
      primaryCountry: rawDualNat?.primaryCountry || p.nationality || 'Nigeria',
      primaryCode: rawDualNat?.primaryCode || p.nationCode || 'NG',
      secondaryCountry: rawDualNat?.secondaryCountry || (p.nationality === 'Nigeria' ? 'England' : undefined),
      secondaryCode: rawDualNat?.secondaryCode || (p.nationality === 'Nigeria' ? 'ENG' : undefined),
      isDeclaredSenior: rawDualNat?.isDeclaredSenior ?? false,
      declaredSeniorCountry: rawDualNat?.declaredSeniorCountry,
    };

    const rawPapers = p.travelPapers;
    p.travelPapers = {
      hasPassport: rawPapers?.hasPassport ?? true,
      passportExpiryYear: rawPapers?.passportExpiryYear ?? 2031,
      hasWorkPermit: rawPapers?.hasWorkPermit ?? true,
      visaStatus: rawPapers?.visaStatus || 'UK GBE Work Permit',
      under18FifaClearance: rawPapers?.under18FifaClearance ?? true,
    };

    if (!p.preferredCurrency) {
      p.preferredCurrency = p.nationality === 'Nigeria' ? 'NGN' : 'GBP';
    }
    if (p.activeInjury === undefined) {
      p.activeInjury = null;
    }
    if (p.recurringInjuryCount === undefined) {
      p.recurringInjuryCount = 0;
    }
    // Normalize lifestyle assets from old or partial saves into the canonical schema
    const rawLifestyle = p.lifestyleAssets as Record<string, unknown> | undefined;

    let residence = 'Academy Shared Dormitory';
    if (typeof rawLifestyle?.residence === 'string' && rawLifestyle.residence.trim() !== '') {
      residence = rawLifestyle.residence;
    } else if (typeof rawLifestyle?.residenceTier === 'string' && rawLifestyle.residenceTier.trim() !== '') {
      residence = rawLifestyle.residenceTier;
    }

    let car = 'Used Compact Hatchback';
    if (typeof rawLifestyle?.car === 'string' && rawLifestyle.car.trim() !== '') {
      car = rawLifestyle.car;
    } else if (Array.isArray(rawLifestyle?.vehiclesOwned)) {
      const validVehicles = rawLifestyle.vehiclesOwned.filter(
        (v): v is string => typeof v === 'string' && v.trim() !== ''
      );
      if (validVehicles.length > 0) {
        car = validVehicles[validVehicles.length - 1];
      }
    }

    const charityFounded = typeof rawLifestyle?.charityFounded === 'boolean'
      ? rawLifestyle.charityFounded
      : false;

    const personalBrandLevel = (
      typeof rawLifestyle?.personalBrandLevel === 'number' &&
      Number.isFinite(rawLifestyle.personalBrandLevel) &&
      rawLifestyle.personalBrandLevel >= 1
    )
      ? rawLifestyle.personalBrandLevel
      : 1;

    let ownedItemIds: string[] = [];
    if (Array.isArray(rawLifestyle?.ownedItemIds)) {
      const seen = new Set<string>();
      for (const id of rawLifestyle.ownedItemIds) {
        if (typeof id === 'string' && !seen.has(id)) {
          seen.add(id);
          ownedItemIds.push(id);
        }
      }
    }

    p.lifestyleAssets = {
      residence,
      car,
      charityFounded,
      personalBrandLevel,
      ownedItemIds,
    };

    if (!p.taxResidency) {
      const currentClub = getClubById(p.currentClubId || 'sporting_lagos');
      const taxCalc = calculateTaxBreakdown(
        currentClub,
        p.currentContract?.weeklyWage || 500,
        p.currentContract?.agentFeePercent || 5
      );
      p.taxResidency = {
        country: taxCalc.country,
        taxAuthority: taxCalc.taxAuthority,
        taxAuthorityShort: taxCalc.taxAuthorityShort,
        taxSystemName: taxCalc.taxSchemeName,
        effectiveTaxRate: taxCalc.effectiveRatePercent / 100,
        systemDescription: taxCalc.notes,
        isTaxFreeHaven: taxCalc.isTaxFreeHaven,
        totalTaxesPaidCareer: 0,
        lastTaxDeductionWeekly: taxCalc.taxDeductedWeekly,
      };
    }

    if (!p.dailyRoutine) {
      p.dailyRoutine = DEFAULT_PLAYER_ROUTINE;
    }

    // Persist migrated schema so subsequent renders have clean state
    savePlayer(p);

    return p;
  } catch (err) {
    console.error('Failed to load player state', err);
    return null;
  }
}

export function clearSavedPlayer(): void {
  localStorage.removeItem(STORAGE_KEY);
}
