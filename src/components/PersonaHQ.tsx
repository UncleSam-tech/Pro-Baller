import React, { useState } from 'react';
import { Club, Player } from '../types/game';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { calculateTaxBreakdown } from '../utils/taxResidency';
import { HISTORICAL_GREATS, evaluateLegacyMilestones, HistoricalGreat } from '../data/historicalGreats';
import { ThreePlayerAvatar } from './ThreePlayerAvatar';
import { DailyRoutineModule } from './DailyRoutineModule';
import { SocialFeedModule } from './SocialFeedModule';
import { BrandAmbassadorModule } from './BrandAmbassadorModule';
import { ScoutSystem } from './ScoutSystem';
import { 
  Activity, AlertTriangle, Award, BarChart3, CheckCircle, Crown, FileCheck, FileText, 
  Flame, Globe, Heart, History, Home, Landmark, Lock, MessageCircle, Percent, Plane, Radar, Receipt, 
  Shield, ShieldAlert, Sparkles, Trophy, User, Users, Utensils, Watch, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PersonaHQProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onOpenRetirement?: () => void;
  initialSubTab?: 'avatar' | 'daily_routine' | 'social_feed' | 'brand_deals' | 'scouting' | 'family' | 'dual_nat' | 'papers' | 'locker_room' | 'tax_residency' | 'hall_of_fame';
}

export const PersonaHQ: React.FC<PersonaHQProps> = ({ player, club, onUpdatePlayer, onOpenRetirement, initialSubTab = 'avatar' }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'avatar' | 'daily_routine' | 'social_feed' | 'brand_deals' | 'scouting' | 'family' | 'dual_nat' | 'papers' | 'locker_room' | 'tax_residency' | 'hall_of_fame'
  >(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedGreatId, setSelectedGreatId] = useState<string>('messi');

  // Work Permit Destination Selector
  const [targetVisaLeague, setTargetVisaLeague] = useState<'UK' | 'SPAIN' | 'FRANCE' | 'ITALY' | 'GERMANY' | 'SAUDI'>('UK');

  const currency = player?.preferredCurrency || 'GBP';
  const defaultHometown = player?.nationality === 'Nigeria' ? 'Surulere, Lagos, Nigeria' : `${player?.nationality || 'Home'} City`;

  // Tax Residency Details
  const taxInfo = calculateTaxBreakdown(
    club,
    player?.currentContract?.weeklyWage || 1000,
    player?.currentContract?.agentFeePercent || 5
  );

  const rawPerson = player?.person;
  const person = {
    hometown: rawPerson?.hometown || defaultHometown,
    familyBackground: rawPerson?.familyBackground || 'Supportive family passionate about your football dream',
    familyRelations: rawPerson?.familyRelations ?? 88,
    monthlyRemittanceGBP: rawPerson?.monthlyRemittanceGBP ?? 150,
    isCaptain: rawPerson?.isCaptain ?? false,
    isViceCaptain: rawPerson?.isViceCaptain ?? false,
    jerseyNumberRequested: rawPerson?.jerseyNumberRequested || player?.jerseyNumber || 19,
    disciplineRating: rawPerson?.disciplineRating ?? 92,
    nightlifeCurfewViolations: rawPerson?.nightlifeCurfewViolations ?? 0,
  };

  const rawDualNat = player?.dualNationality;
  const dualNat = {
    primaryCountry: rawDualNat?.primaryCountry || player?.nationality || 'Nigeria',
    primaryCode: rawDualNat?.primaryCode || player?.nationCode || 'NG',
    secondaryCountry: rawDualNat?.secondaryCountry || (player?.nationality === 'Nigeria' ? 'England' : undefined),
    secondaryCode: rawDualNat?.secondaryCode || (player?.nationality === 'Nigeria' ? 'ENG' : undefined),
    isDeclaredSenior: rawDualNat?.isDeclaredSenior ?? false,
    declaredSeniorCountry: rawDualNat?.declaredSeniorCountry,
    residencyYears: rawDualNat?.residencyYears ?? 2,
    naturalizationProgressPercent: rawDualNat?.naturalizationProgressPercent ?? 45,
  };

  const rawPapers = player?.travelPapers;
  const travelPapers = {
    hasPassport: rawPapers?.hasPassport ?? true,
    passportNumber: rawPapers?.passportNumber || `${dualNat.primaryCode}-${Math.floor(10000000 + Math.random() * 90000000)}`,
    passportExpiryYear: rawPapers?.passportExpiryYear ?? 2031,
    passportStatus: rawPapers?.passportStatus || 'VALID',
    hasWorkPermit: rawPapers?.hasWorkPermit ?? true,
    visaStatus: rawPapers?.visaStatus || 'UK GBE Work Permit',
    under18FifaClearance: rawPapers?.under18FifaClearance ?? true,
    tournamentClearanceApproved: rawPapers?.tournamentClearanceApproved ?? true,
    residencyYearsAccumulated: rawPapers?.residencyYearsAccumulated ?? 2,
  };

  const isPassportValid = travelPapers.hasPassport && travelPapers.passportExpiryYear >= player.currentYear && travelPapers.passportStatus === 'VALID';

  // Hall of Fame & All-Time Career Stats
  const careerGoals = (player.careerHistory || []).reduce((acc, s) => acc + (s.goals || 0), 0) + (player.seasonStats?.goals || 0);
  const careerAssists = (player.careerHistory || []).reduce((acc, s) => acc + (s.assists || 0), 0) + (player.seasonStats?.assists || 0);
  const careerApps = (player.careerHistory || []).reduce((acc, s) => acc + (s.appearances || 0), 0) + (player.seasonStats?.appearances || 0);
  const totalTrophies = (player.trophyCabinet || []).length;
  const ballonDors = (player.awards || []).filter(a => a.name?.toLowerCase().includes('ballon')).length;
  const milestones = evaluateLegacyMilestones(player);
  const selectedGreat = HISTORICAL_GREATS.find(g => g.id === selectedGreatId) || HISTORICAL_GREATS[2];
  const isRetirementEligible = (player.age >= 35) || ((player.recurringInjuryCount || 0) >= 2);

  let playerLegacyTier = 'PRO_VETERAN';
  if (ballonDors >= 1 || careerGoals >= 300 || totalTrophies >= 5) {
    playerLegacyTier = 'IMMORTAL_LEGEND';
  } else if (careerGoals >= 120 || totalTrophies >= 2) {
    playerLegacyTier = 'WORLD_CLASS_ICON';
  } else if (careerGoals >= 50 || careerApps >= 150) {
    playerLegacyTier = 'CLUB_CULT_HERO';
  }

  // Send remittance to parents back home
  const handleSendRemittance = () => {
    sounds.playClick();
    const remittanceCostGBP = 250;
    if (player.bankBalance < remittanceCostGBP) {
      setNotice('Insufficient bank funds to wire family support this month.');
      return;
    }

    const newFamilyRelations = Math.min(100, person.familyRelations + 8);
    const newMorale = Math.min(100, player.morale + 6);

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - remittanceCostGBP,
      morale: newMorale,
      person: {
        ...person,
        familyRelations: newFamilyRelations,
      },
    });

    sounds.playFanfare();
    setNotice(`Wired ${formatCurrency(remittanceCostGBP, currency)} home to parents in ${person?.hometown || defaultHometown}. Family relations raised to ${newFamilyRelations}%!`);
  };

  // Declare Senior National Team Allegiance
  const handleDeclareAllegiance = (country: string, code: string) => {
    sounds.playWhistle();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    onUpdatePlayer({
      ...player,
      nationality: country,
      nationCode: code,
      hasSeniorCallup: true,
      nationalTeamCaps: player.nationalTeamCaps + 1,
      dualNationality: {
        ...dualNat,
        isDeclaredSenior: true,
        declaredSeniorCountry: country,
      },
      morale: Math.min(100, player.morale + 10),
    });

    setNotice(`HISTORIC MOMENT! Officially made senior international debut for ${country}! Allegiance is now permanently ratified under FIFA statutes.`);
  };

  // Request Coveted Jersey Number (#10 or #7)
  const handleRequestJerseyNumber = (desiredNum: number) => {
    sounds.playClick();
    if (player.jerseyNumber === desiredNum) {
      setNotice(`You already wear the #${desiredNum} jersey!`);
      return;
    }

    if (player.overallRating < 78 && (desiredNum === 10 || desiredNum === 7)) {
      onUpdatePlayer({
        ...player,
        jerseyNumber: desiredNum,
        teamChemistry: Math.max(20, player.teamChemistry - 8),
        person: {
          ...person,
          jerseyNumberRequested: desiredNum,
        },
      });
      setNotice(`Granted the legendary #${desiredNum} shirt! Some veteran teammates felt it was premature for a young talent, but the manager backed you.`);
    } else {
      onUpdatePlayer({
        ...player,
        jerseyNumber: desiredNum,
        person: {
          ...person,
          jerseyNumberRequested: desiredNum,
        },
      });
      sounds.playFanfare();
      setNotice(`Kit department officially printed #${desiredNum} on your jersey!`);
    }
  };

  // Handle Passport Renewal (Standard vs Fast-Track)
  const handleRenewPassport = (isFastTrack: boolean) => {
    sounds.playClick();
    const cost = isFastTrack ? 2_500 : 350;
    if (player.bankBalance < cost) {
      setNotice(`Insufficient funds! Passport renewal requires ${formatCurrency(cost, currency)}.`);
      return;
    }

    sounds.playFanfare();
    confetti({ particleCount: 40, spread: 50 });

    const newExpiry = player.currentYear + 10;
    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - cost,
      travelPapers: {
        ...travelPapers,
        hasPassport: true,
        passportExpiryYear: newExpiry,
        passportStatus: 'VALID',
        tournamentClearanceApproved: true,
      },
    });

    setNotice(`Passport successfully renewed through ${newExpiry}! Cleared for international tournaments & European travel.`);
  };

  // Toggle Passport Expired State (For testing simulation)
  const handleTogglePassportExpirySimulation = () => {
    sounds.playClick();
    const willExpire = travelPapers.passportStatus === 'VALID';
    onUpdatePlayer({
      ...player,
      travelPapers: {
        ...travelPapers,
        passportStatus: willExpire ? 'EXPIRED' : 'VALID',
        passportExpiryYear: willExpire ? player.currentYear - 1 : player.currentYear + 8,
        tournamentClearanceApproved: !willExpire,
      },
    });
    setNotice(willExpire 
      ? 'PASSPORT EXPIRED: Border control will now block you from international tournaments and overseas transfers!' 
      : 'Passport restored to valid status.');
  };

  // Apply for Work Permit / Visa in target league
  const handleApplyWorkPermit = () => {
    sounds.playClick();
    const filingFee = 4_500;
    if (player.bankBalance < filingFee) {
      setNotice(`Consular legal filing fee is ${formatCurrency(filingFee, currency)}. Insufficient funds!`);
      return;
    }

    sounds.playFanfare();
    confetti({ particleCount: 60, spread: 60 });

    let grantedVisa = 'UK GBE Work Permit';
    if (targetVisaLeague === 'SPAIN') grantedVisa = 'La Liga Non-EU Athlete Visa';
    else if (targetVisaLeague === 'FRANCE') grantedVisa = 'Ligue 1 Cotonou Sports Permit';
    else if (targetVisaLeague === 'ITALY') grantedVisa = 'Serie A Non-EU Registration';
    else if (targetVisaLeague === 'GERMANY') grantedVisa = 'Bundesliga Pro Athlete Visa';
    else if (targetVisaLeague === 'SAUDI') grantedVisa = 'Saudi Pro League Resident Visa';

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - filingFee,
      travelPapers: {
        ...travelPapers,
        hasWorkPermit: true,
        visaStatus: grantedVisa as any,
        targetVisaCountry: targetVisaLeague,
      },
    });

    setNotice(`WORK PERMIT GRANTED: Consular authorities approved ${grantedVisa}! Eligible to register and compete.`);
  };

  // Apply for Secondary Passport through Naturalization
  const handleApplyNaturalization = () => {
    sounds.playClick();
    const legalFee = 8_000;
    if (player.bankBalance < legalFee) {
      setNotice(`Naturalization legal filing fee is ${formatCurrency(legalFee, currency)}. Insufficient funds!`);
      return;
    }

    sounds.playWhistle();
    confetti({ particleCount: 80, spread: 70 });

    const secondCountry = dualNat.secondaryCountry || 'Spain';
    const secondCode = dualNat.secondaryCode || 'ESP';

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - legalFee,
      dualNationality: {
        ...dualNat,
        secondaryCountry: secondCountry,
        secondaryCode: secondCode,
        naturalizationProgressPercent: 100,
      },
      travelPapers: {
        ...travelPapers,
        visaStatus: 'Exempt (Domestic Citizen)',
      },
    });

    setNotice(`CITIZENSHIP GRANTED: Naturalization approved for ${secondCountry}! You now hold dual nationality & EU/Domestic registration freedom.`);
  };

  // GBE Points Calculation Breakdown
  const capsPoints = player.nationalTeamCaps >= 15 ? 12 : player.nationalTeamCaps >= 5 ? 8 : 4;
  const leagueMinutesPoints = player.seasonStats.starts >= 15 ? 8 : player.seasonStats.starts >= 5 ? 5 : 2;
  const clubTierPoints = club.tier === 1 ? 6 : club.tier === 2 ? 4 : 2;
  const totalGbePoints = capsPoints + leagueMinutesPoints + clubTierPoints;
  const gbePassed = totalGbePoints >= 15;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Sub-Tab Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <User className="w-4 h-4 text-emerald-400" />
              The Human Behind the Footballer
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Player Persona, Heritage & Documentation
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              "A person makes the player, not a player makes the person." Manage background, passports, visas, work permits, and dual citizenship.
            </p>
          </div>

          {/* Quick Identity Tag */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-right">
            <div className="text-slate-400">Birthplace & Heritage</div>
            <div className="font-bold text-white text-sm mt-0.5">{person?.hometown || defaultHometown}</div>
          </div>
        </div>

        {/* Sub-Nav Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-t border-slate-800 pt-4 scrollbar-none">
          {[
            { id: 'avatar', label: '3D Persona & Vitals' },
            { id: 'daily_routine', label: '🥗 Daily Routine & Wellness' },
            { id: 'social_feed', label: '📱 Social Pulse & Fans' },
            { id: 'brand_deals', label: '👑 Brand Ambassador' },
            { id: 'scouting', label: '🔍 Scout Radar & Reports' },
            { id: 'family', label: 'Family & Parental Relocation' },
            { id: 'papers', label: 'Passports & Work Permits' },
            { id: 'dual_nat', label: 'Dual Nationality & FIFA Rules' },
            { id: 'tax_residency', label: 'Tax Residency & Fiscal Law' },
            { id: 'hall_of_fame', label: '🏆 Hall of Fame & Legends' },
            { id: 'locker_room', label: 'Locker Room & Jersey #' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sounds.playClick(); setActiveSubTab(tab.id as any); }}
              className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 1: 3D PERSONA & VITALS */}
      {/* ======================================================== */}
      {activeSubTab === 'avatar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <ThreePlayerAvatar player={player} club={club} />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                Player Persona Vitals
              </h3>
              <p className="text-xs text-slate-400 mt-1">Official physical measurements and registration records</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Full Legal Name:</span>
                <span className="font-bold text-white">{player.firstName} {player.lastName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Squad Jersey Number:</span>
                <span className="font-bold text-emerald-400 font-mono">#{player.jerseyNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Position / Archetype:</span>
                <span className="font-bold text-white">{player.position} ({player.archetype})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Height / Weight:</span>
                <span className="font-bold text-white">{player.heightCm} cm · {player.weightKg} kg</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Dominant Preferred Foot:</span>
                <span className="font-bold text-white">{player.preferredFoot} Foot</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Club Registered:</span>
                <span className="font-bold text-white">{club.name} ({club.league})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Discipline Rating:</span>
                <span className="font-bold text-emerald-400 font-mono">{person.disciplineRating}% Clean Record</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB: DAILY ROUTINE & WELLNESS */}
      {/* ======================================================== */}
      {activeSubTab === 'daily_routine' && (
        <DailyRoutineModule player={player} onUpdatePlayer={onUpdatePlayer} />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB: SOCIAL PULSE & FANS */}
      {/* ======================================================== */}
      {activeSubTab === 'social_feed' && (
        <SocialFeedModule player={player} club={club} onUpdatePlayer={onUpdatePlayer} />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB: BRAND AMBASSADOR CONTRACTS */}
      {/* ======================================================== */}
      {activeSubTab === 'brand_deals' && (
        <BrandAmbassadorModule player={player} onUpdatePlayer={onUpdatePlayer} />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB: SCOUT RADAR & REPORTS */}
      {/* ======================================================== */}
      {activeSubTab === 'scouting' && (
        <ScoutSystem player={player} club={club} onUpdatePlayer={onUpdatePlayer} />
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: FAMILY, HOMETOWN & REMITTANCES */}
      {/* ======================================================== */}
      {activeSubTab === 'family' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Family Background & Roots</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {person.familyBackground}
              </p>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Family Relations & Support Score</span>
                  <span className="font-bold text-emerald-400 font-mono">{person.familyRelations}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${person.familyRelations}%` }} />
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Your parents and siblings watch every single match on satellite broadcast from {person?.hometown || defaultHometown}.
                </p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base text-white">Support Family Back Home</h3>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Wire monthly remittances to your family to cover school fees, healthcare, and household expenses. Keeping family close grounds your mental well-being.
                </p>
                <div className="text-xs text-slate-300 font-mono mt-3 p-3 bg-slate-950 rounded-lg border border-slate-850">
                  Monthly Support Transfer: <strong className="text-emerald-400">{formatCurrency(250, currency)}</strong>
                </div>
              </div>

              <button
                onClick={handleSendRemittance}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Heart className="w-4 h-4 text-rose-300" />
                Send Monthly Remittance ({formatCurrency(250, currency)})
              </button>
            </div>
          </div>

          {/* Parental Relocation Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base text-white">Parental International Relocation & FIFA Article 19 Accord</h3>
              </div>
              <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2.5 py-0.5 rounded border border-blue-800 font-mono">
                FIFA Art. 19(2)(a)
              </span>
            </div>

            {player.parentalRelocation?.hasRelocated ? (
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Parents Relocated to {player.parentalRelocation.currentCountry}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your family relocated in {player.parentalRelocation.yearRelocated} due to {player.parentalRelocation.reason}. Under FIFA Article 19(2)(a), this non-football parental move exempts you from minor transfer bans, accelerating secondary passport residency and granting domestic academy clearance.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-slate-300 leading-relaxed">
                  In modern football, parents can relocate internationally for professional employment unrelated to football. Under FIFA Article 19(2)(a), this unlocks domestic academy status in top European football nations, bypasses non-EU minor restrictions, and initiates fast-track citizenship naturalization.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>🇪🇸 Relocate Family to Spain (Madrid Tech Hub)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Parents accept engineering & civil contracts in Spain. Accelerates Iberian residency naturalization (accumulates towards Spanish citizenship), opens La Liga academy circuits.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playFanfare();
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                        onUpdatePlayer({
                          ...player,
                          parentalRelocation: {
                            hasRelocated: true,
                            originCountry: player.nationality,
                            currentCountry: 'Spain',
                            reason: 'Parental civil engineering employment in Madrid',
                            yearRelocated: player.currentYear || 2026,
                            benefitsSummary: 'Exempt from FIFA Article 19 minor transfer bans. Domestic youth registration in Spain unlocked.',
                          },
                          dualNationality: {
                            ...player.dualNationality,
                            secondaryCountry: 'Spain',
                            secondaryCode: 'ESP',
                            naturalizationProgressPercent: Math.min(100, (player.dualNationality?.naturalizationProgressPercent || 30) + 40),
                          },
                          person: {
                            ...(player.person || person),
                            familyRelations: Math.min(100, (player.person?.familyRelations ?? 88) + 12),
                          },
                        });
                        setNotice('Family successfully relocated to Spain! FIFA Article 19(2)(a) clearance ratified.');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow"
                    >
                      Authorize Family Move to Spain
                    </button>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>🇬🇧 Relocate Family to England (London Healthcare)</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Parents secure medical & NHS appointments in London. Exempts you from strict post-Brexit GBE work permit points barriers and unlocks Premier League youth category trials.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        sounds.playFanfare();
                        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
                        onUpdatePlayer({
                          ...player,
                          parentalRelocation: {
                            hasRelocated: true,
                            originCountry: player.nationality,
                            currentCountry: 'England',
                            reason: 'Parental healthcare consultant appointment in London',
                            yearRelocated: player.currentYear || 2026,
                            benefitsSummary: 'Exempt from FIFA Article 19 minor transfer bans. Domestic youth registration in England unlocked.',
                          },
                          dualNationality: {
                            ...player.dualNationality,
                            secondaryCountry: 'England',
                            secondaryCode: 'ENG',
                            naturalizationProgressPercent: Math.min(100, (player.dualNationality?.naturalizationProgressPercent || 30) + 40),
                          },
                          person: {
                            ...(player.person || person),
                            familyRelations: Math.min(100, (player.person?.familyRelations ?? 88) + 12),
                          },
                        });
                        setNotice('Family successfully relocated to England! FIFA Article 19(2)(a) clearance ratified.');
                      }}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow"
                    >
                      Authorize Family Move to England
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: DOCUMENTATION, PASSPORTS & WORK PERMITS */}
      {/* ======================================================== */}
      {activeSubTab === 'papers' && (
        <div className="space-y-6">
          {/* Passport Status & Tournament Clearance Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <Plane className="w-4 h-4 text-emerald-400" />
                  Immigration & Consular Documentation
                </div>
                <h3 className="text-2xl font-black text-white mt-1">
                  National Passport & Tournament Clearance
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  "You just don't travel because you want to travel. There are legal processes to traveling."
                </p>
              </div>

              {/* Tournament Clearance Badge */}
              <div className={`p-3 rounded-xl border text-xs text-right min-w-[220px] ${
                isPassportValid 
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                  : 'bg-rose-950/60 border-rose-800 text-rose-300'
              }`}>
                <div className="font-bold flex items-center justify-end gap-1.5">
                  {isPassportValid ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  <span>{isPassportValid ? 'Tournament Cleared' : 'Travel Barred / Blocked'}</span>
                </div>
                <div className="text-[10px] mt-0.5 opacity-80">
                  {isPassportValid 
                    ? 'Authorized for World Cup & European Away Ties' 
                    : 'BLOCKED: Expired passport prevents cross-border fixtures!'}
                </div>
              </div>
            </div>

            {/* Passport Identity Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Passport Number</div>
                <div className="text-base font-black font-mono text-white">
                  {travelPapers.passportNumber}
                </div>
                <div className="text-[11px] text-slate-500">Issuing State: {dualNat.primaryCountry}</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Validity & Expiry</div>
                <div className={`text-base font-black font-mono ${isPassportValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPassportValid ? `Valid (Expires ${travelPapers.passportExpiryYear})` : 'EXPIRED / INVALID'}
                </div>
                <div className="text-[11px] text-slate-500">Biometric Microchip Active</div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Work Authorization</div>
                <div className="text-base font-black font-mono text-emerald-400">
                  {travelPapers.visaStatus}
                </div>
                <div className="text-[11px] text-slate-500">League Registration Authorized</div>
              </div>
            </div>

            {/* Passport Actions */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">Consular Passport Renewal Desk</div>
                <div className="text-[11px] text-slate-400">Standard diplomatic processing or fast-track courier</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePassportExpirySimulation}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  {isPassportValid ? 'Simulate Passport Expiry' : 'Restore Valid Status'}
                </button>

                <button
                  onClick={() => handleRenewPassport(false)}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Standard Renewal (£350)
                </button>

                <button
                  onClick={() => handleRenewPassport(true)}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Fast-Track Diplomatic (£2,500)
                </button>
              </div>
            </div>
          </div>

          {/* Work Permit & Visa Application Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                Work Permit & Visa Application Bureau (Transfer Clearance)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                When moving between foreign leagues, players must secure legal labor permits under national immigration criteria.
              </p>
            </div>

            {/* Destination Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Destination Football League / Nation
              </label>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs font-bold">
                {[
                  { id: 'UK', label: 'England (UK GBE)', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
                  { id: 'SPAIN', label: 'Spain (La Liga)', flag: '🇪🇸' },
                  { id: 'FRANCE', label: 'France (Ligue 1)', flag: '🇫🇷' },
                  { id: 'ITALY', label: 'Italy (Serie A)', flag: '🇮🇹' },
                  { id: 'GERMANY', label: 'Germany (BBL)', flag: '🇩🇪' },
                  { id: 'SAUDI', label: 'Saudi Arabia', flag: '🇸🇦' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTargetVisaLeague(item.id as any)}
                    className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer ${
                      targetVisaLeague === item.id
                        ? 'bg-amber-600 border-amber-500 text-white shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-base">{item.flag}</div>
                    <div className="text-[11px] mt-1">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* UK GBE Points Calculator Breakdown */}
            {targetVisaLeague === 'UK' && (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-bold text-white">UK Home Office & FA Governing Body Endorsement (GBE)</div>
                    <div className="text-[11px] text-slate-400">Post-Brexit points-based qualification matrix (Minimum 15 pts required)</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${gbePassed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                    {totalGbePoints} / 15 Points ({gbePassed ? 'QUALIFIED' : 'EXCEPTIONS PANEL REQUIRED'})
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Senior International Caps</span>
                    <strong className="text-white text-sm mt-1 block">{player.nationalTeamCaps} Senior Caps</strong>
                    <span className="text-emerald-400 font-mono text-[11px]">+{capsPoints} GBE Points</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Domestic Minutes Played</span>
                    <strong className="text-white text-sm mt-1 block">{player.seasonStats.appearances} Match Apps</strong>
                    <span className="text-emerald-400 font-mono text-[11px]">+{leagueMinutesPoints} GBE Points</span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Club Continental Tier</span>
                    <strong className="text-white text-sm mt-1 block">{club.name} ({club.league})</strong>
                    <span className="text-emerald-400 font-mono text-[11px]">+{clubTierPoints} GBE Points</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <p className="text-xs text-slate-400">
                    Consular Filing Fee: <strong className="text-emerald-400 font-mono">{formatCurrency(4500, currency)}</strong> (includes FA points verification & biometric appointment).
                  </p>

                  <button
                    onClick={handleApplyWorkPermit}
                    className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    Submit UK Work Permit Application
                  </button>
                </div>
              </div>
            )}

            {/* Other Foreign League Visa Explanations */}
            {targetVisaLeague !== 'UK' && (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-white">
                  {targetVisaLeague === 'SPAIN' && 'Spain (La Liga): Non-EU Quotas & 2-Year Ibero-American Residency'}
                  {targetVisaLeague === 'FRANCE' && 'France (Ligue 1): Cotonou Agreement African Exemption'}
                  {targetVisaLeague === 'ITALY' && 'Italy (Serie A): Strict Non-EU Registration Window Slot'}
                  {targetVisaLeague === 'GERMANY' && 'Germany (Bundesliga): Professional Athletic Labor Permit'}
                  {targetVisaLeague === 'SAUDI' && 'Saudi Arabia: Ministry of Sport Foreign Quota Slot'}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {targetVisaLeague === 'SPAIN' && 'La Liga squads are limited to 3 non-EU players. However, players from Latin America, Equatorial Guinea, or the Philippines can apply for expedited Spanish naturalization after just 2 years of residency.'}
                  {targetVisaLeague === 'FRANCE' && 'Under the historic Cotonou Agreement, African, Caribbean, and Pacific national players do not count against non-EU player quotas in French professional football.'}
                  {targetVisaLeague === 'ITALY' && 'Italian clubs are limited to a maximum of two non-EU player registrations per season from abroad. Securing your visa requires an official consular endorsement from the FIGC.'}
                  {targetVisaLeague === 'GERMANY' && 'The German DFL does not restrict foreign non-EU players on squad lists, requiring only proof of professional contract and health insurance.'}
                  {targetVisaLeague === 'SAUDI' && 'Saudi Pro League allows up to 8 foreign players per roster, verified through the Saudi Ministry of Sport.'}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Application Filing: <strong className="text-emerald-400 font-mono">{formatCurrency(4500, currency)}</strong>
                  </span>

                  <button
                    onClick={handleApplyWorkPermit}
                    className="py-2.5 px-5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    Submit Consular Visa Application
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: DUAL NATIONALITY & FIFA ELIGIBILITY */}
      {/* ======================================================== */}
      {activeSubTab === 'dual_nat' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Globe className="w-4 h-4 text-amber-400" />
                FIFA Article 7 · Dual Nationality Regulation
              </div>
              <h3 className="text-xl font-black text-white mt-1">
                International Allegiance & Cap Commitments
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Under FIFA statutes, players possessing dual citizenship through birth, parentage, or residency can choose between nations until appearing in an official competitive senior tournament match.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-right">
              <div className="text-slate-400">Current Status</div>
              <div className="font-bold text-emerald-400 text-sm mt-0.5">
                {dualNat.isDeclaredSenior 
                  ? `Committed to ${dualNat.declaredSeniorCountry}` 
                  : 'Dual Eligible (Undecided)'}
              </div>
            </div>
          </div>

          {/* National Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Nation */}
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <span>{dualNat.primaryCode === 'NG' ? '🇳🇬' : dualNat.primaryCode === 'FR' ? '🇫🇷' : dualNat.primaryCode === 'AR' ? '🇦🇷' : '🌍'}</span>
                  {dualNat.primaryCountry}
                </span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Birth Country
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your nation of birth and cultural roots. Representing the senior national team guarantees adoration from millions back home.
              </p>

              {!dualNat.isDeclaredSenior && (
                <button
                  onClick={() => handleDeclareAllegiance(dualNat.primaryCountry, dualNat.primaryCode)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Commit to {dualNat.primaryCountry} Senior National Team
                </button>
              )}
            </div>

            {/* Secondary Nation */}
            {dualNat.secondaryCountry ? (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white flex items-center gap-2">
                    <span>{dualNat.secondaryCode === 'ENG' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' : dualNat.secondaryCode === 'DZ' ? '🇩🇿' : '🇪🇺'}</span>
                    {dualNat.secondaryCountry}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    Dual Eligible
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Eligible via ancestry or residency. European scouts have urged you to accept call-ups to simplify European work permits.
                </p>

                {!dualNat.isDeclaredSenior && (
                  <button
                    onClick={() => handleDeclareAllegiance(dualNat.secondaryCountry!, dualNat.secondaryCode!)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Commit to {dualNat.secondaryCountry} Senior National Team
                  </button>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white">Naturalization & Residency Path</div>
                <p className="text-xs text-slate-400">
                  After living and playing in a country for consecutive years, athletes can apply for second citizenship.
                </p>
                <div className="p-3 bg-slate-900 rounded-lg text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Residency Accumulated:</span>
                    <strong className="text-white font-mono">{dualNat.residencyYears} / 5 Seasons</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full" style={{ width: `${dualNat.naturalizationProgressPercent}%` }} />
                  </div>
                </div>
                <button
                  onClick={handleApplyNaturalization}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Apply for Naturalized Citizenship ({formatCurrency(8000, currency)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 5: LOCKER ROOM & JERSEY NUMBER */}
      {/* ======================================================== */}
      {activeSubTab === 'locker_room' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Locker Room Standing & Jersey Squad Numbers
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Squad harmony, captaincy dynamics, and jersey number pride.
              </p>
            </div>

            <div className="text-xs text-right">
              <div className="text-slate-400">Current Jersey Number</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">#{player.jerseyNumber}</div>
            </div>
          </div>

          {/* Request New Jersey Number */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Request Specific Jersey Number
            </h4>
            <div className="grid grid-cols-5 md:grid-cols-7 gap-2 font-mono font-bold text-xs">
              {[7, 9, 10, 11, 14, 17, 19, 21, 24, 28, 33, 99].map(num => (
                <button
                  key={num}
                  onClick={() => handleRequestJerseyNumber(num)}
                  className={`py-2 rounded-lg border transition-all cursor-pointer ${
                    player.jerseyNumber === num
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  #{num}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 6: TAX RESIDENCY & FISCAL LAW */}
      {/* ======================================================== */}
      {activeSubTab === 'tax_residency' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                <Landmark className="w-4 h-4" />
                <span>Professional Footballer Tax Residency Status</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                Fiscal Residence: {club.country} ({taxInfo.taxAuthorityShort})
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Under FIFA sports law and international employment statutes (183-day residence rule), your income is taxed in the country of your registered club.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Tax Status</span>
              <span className={`text-base font-black ${taxInfo.isTaxFreeHaven ? 'text-emerald-400' : 'text-amber-400'}`}>
                {taxInfo.isTaxFreeHaven ? '0% Tax-Free Haven' : `${taxInfo.effectiveRatePercent}% Effective Rate`}
              </span>
            </div>
          </div>

          {/* Key Tax Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Tax Authority</span>
              <strong className="text-sm font-bold text-white block truncate">{taxInfo.taxAuthority}</strong>
              <span className="text-[11px] text-emerald-400 font-mono">Jurisdiction: {club.country}</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Weekly Gross Wage</span>
              <strong className="text-sm font-bold text-white block font-mono">
                {formatCurrency(taxInfo.grossWeeklyWage, currency)}
              </strong>
              <span className="text-[11px] text-slate-500 font-mono">Annual: {formatCurrency(taxInfo.grossAnnualWage, currency)}</span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Weekly Tax Withheld</span>
              <strong className={`text-sm font-bold font-mono block ${taxInfo.isTaxFreeHaven ? 'text-emerald-400' : 'text-rose-400'}`}>
                {taxInfo.isTaxFreeHaven ? '£0 (0%)' : `-${formatCurrency(taxInfo.taxDeductedWeekly, currency)}`}
              </strong>
              <span className="text-[11px] text-slate-500 font-mono">
                {taxInfo.isTaxFreeHaven ? 'Exempt by Royal Decree' : `${taxInfo.effectiveRatePercent}% Statutory Rate`}
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Net Deposited Take-Home</span>
              <strong className="text-sm font-bold text-emerald-400 block font-mono">
                +{formatCurrency(taxInfo.netWeeklyWage, currency)}
              </strong>
              <span className="text-[11px] text-slate-500 font-mono">Deposited every simulation week</span>
            </div>
          </div>

          {/* Legal Scheme Explanation */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Statutory Framework: {taxInfo.taxSchemeName}</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {taxInfo.notes}
            </p>
            <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-900">
              Legal Basis: <span className="text-slate-300">{taxInfo.legalBasis}</span>
            </div>
          </div>

          {/* Cumulative Career Tax Contribution */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-xl border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Cumulative Career Taxes Paid</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {formatCurrency(player.taxResidency?.totalTaxesPaidCareer || (taxInfo.taxDeductedWeekly * player.currentWeek), currency)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Certificate of Fiscal Residence</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-end">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Compliant & Active with {taxInfo.taxAuthorityShort}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 7: HALL OF FAME & HISTORICAL GREATS COMPARISON */}
      {/* ======================================================== */}
      {activeSubTab === 'hall_of_fame' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
          {/* Top Legacy Banner */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Career Immortalization & Pantheon of Legends</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-white font-serif tracking-tight mt-1">
                Football Hall of Fame & Legacy Index
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Measuring your career milestones, silverware, and stats against the greatest footballers in the history of the sport.
              </p>
            </div>

            <div className="p-3 bg-gradient-to-r from-amber-950/80 to-slate-950 rounded-xl border border-amber-600/40 text-right">
              <span className="text-[10px] text-amber-300 uppercase font-mono block">Status Tier</span>
              <span className="text-sm font-black text-amber-400 font-mono tracking-wide">
                {playerLegacyTier.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Quick Lifetime Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-center">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Career Apps</span>
              <span className="text-xl font-black text-white mt-1 block">{careerApps}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Career Goals</span>
              <span className="text-xl font-black text-emerald-400 mt-1 block">{careerGoals}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Career Assists</span>
              <span className="text-xl font-black text-amber-400 mt-1 block">{careerAssists}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Silverware</span>
              <span className="text-xl font-black text-amber-300 mt-1 block">{totalTrophies}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Ballon d'Ors</span>
              <span className="text-xl font-black text-yellow-400 mt-1 block">{ballonDors}</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Career Wealth</span>
              <span className="text-sm font-black text-blue-400 mt-1.5 block truncate">
                {formatCurrency(player.totalCareerEarnings || player.bankBalance, currency)}
              </span>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 1: HEAD-TO-HEAD WITH HISTORICAL GREATS */}
          {/* ==================================================== */}
          <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Benchmark: Head-to-Head Against Football Immortals
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Select legend to compare historical metrics
              </span>
            </div>

            {/* Historical Greats Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {HISTORICAL_GREATS.map(great => (
                <button
                  key={great.id}
                  onClick={() => { sounds.playClick(); setSelectedGreatId(great.id); }}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedGreatId === great.id
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{great.flag}</span>
                  <span>{great.name}</span>
                </button>
              ))}
            </div>

            {/* Comparison Display Card */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${selectedGreat.avatarColor} flex items-center justify-center text-xl shadow-lg text-white font-black`}>
                    {selectedGreat.flag}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">{selectedGreat.name}</span>
                      <span className="text-xs text-amber-400 font-mono italic">"{selectedGreat.nickname}"</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block">
                      {selectedGreat.era} · {selectedGreat.country} · {selectedGreat.positions}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 max-w-md italic font-serif border-l-2 border-amber-500/60 pl-3">
                  "{selectedGreat.iconicQuote}"
                </div>
              </div>

              {/* Stat Comparison Bars */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Goals */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">
                      Career Goals: <strong className="text-emerald-400">{careerGoals}</strong> vs <strong className="text-white">{selectedGreat.careerGoals}</strong> ({selectedGreat.name})
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((careerGoals / selectedGreat.careerGoals) * 100))}% of legend
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (careerGoals / selectedGreat.careerGoals) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Assists */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">
                      Career Assists: <strong className="text-amber-400">{careerAssists}</strong> vs <strong className="text-white">{selectedGreat.careerAssists}</strong> ({selectedGreat.name})
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((careerAssists / Math.max(1, selectedGreat.careerAssists)) * 100))}% of legend
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (careerAssists / Math.max(1, selectedGreat.careerAssists)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Total Appearances */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">
                      Appearances: <strong className="text-blue-400">{careerApps}</strong> vs <strong className="text-white">{selectedGreat.appearances}</strong> ({selectedGreat.name})
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((careerApps / selectedGreat.appearances) * 100))}% of legend
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (careerApps / selectedGreat.appearances) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Major Trophies */}
                <div className="space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-400">
                      Major Trophies: <strong className="text-yellow-400">{totalTrophies}</strong> vs <strong className="text-white">{selectedGreat.domesticTitles + selectedGreat.continentalTitles + selectedGreat.worldCups}</strong> ({selectedGreat.name})
                    </span>
                    <span className="text-amber-400 font-bold">
                      {Math.min(100, Math.round((totalTrophies / Math.max(1, selectedGreat.domesticTitles + selectedGreat.continentalTitles + selectedGreat.worldCups)) * 100))}% of legend
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                    <div
                      className="bg-yellow-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (totalTrophies / Math.max(1, selectedGreat.domesticTitles + selectedGreat.continentalTitles + selectedGreat.worldCups)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                <strong className="text-white">Historical Legacy: </strong>
                {selectedGreat.legacySummary}
              </div>
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 2: OFFICIAL TROPHY CABINET */}
          {/* ==================================================== */}
          <div className="space-y-3 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Official Trophy Cabinet ({player.trophyCabinet?.length || 0} Silverware Titles)
                </h4>
              </div>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                Gold Silverware Record
              </span>
            </div>

            {player.trophyCabinet && player.trophyCabinet.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {player.trophyCabinet.map((t, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-900 rounded-xl border border-amber-600/40 flex items-center gap-3">
                    <span className="text-2xl">{t.icon || '🏆'}</span>
                    <div>
                      <span className="text-xs font-bold text-white block">{t.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono block">
                        {t.year} · {t.club}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <span className="text-slate-300 font-bold block">No major silverware lifted yet.</span>
                <span>Compete in league matches, qualify for continental finals, and earn titles on the pitch!</span>
              </div>
            )}
          </div>

          {/* ==================================================== */}
          {/* SECTION 3: CAREER LEGACY MILESTONES */}
          {/* ==================================================== */}
          <div className="space-y-3 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Career Legacy Milestones Matrix
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                {milestones.filter(m => m.isUnlocked).length} / {milestones.length} Achieved
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {milestones.map(m => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border transition-all ${
                    m.isUnlocked
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800/80 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base">{m.icon}</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      m.isUnlocked ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {m.isUnlocked ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white leading-tight">{m.title}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {m.description}
                  </div>
                  <div className="mt-2 text-[10px] font-mono flex justify-between text-slate-400 border-t border-slate-800/60 pt-1.5">
                    <span>Progress:</span>
                    <span className="font-bold text-white">
                      {typeof m.currentValue === 'number' && m.targetValue >= 1000 ? formatCurrency(m.currentValue, currency) : m.currentValue} / {typeof m.targetValue === 'number' && m.targetValue >= 1000 ? formatCurrency(m.targetValue, currency) : m.targetValue}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================== */}
          {/* SECTION 4: FORMAL RETIREMENT & LIFE AFTER FOOTBALL */}
          {/* ==================================================== */}
          <div className="p-6 bg-gradient-to-r from-amber-950/40 via-slate-950 to-slate-900 rounded-2xl border border-amber-500/40 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                  Career Culmination & Post-Playing Era
                </span>
                <h4 className="text-lg font-black text-white mt-0.5">
                  Formal Retirement System & Post-Career Transition
                </h4>
              </div>

              {isRetirementEligible && !player.isRetired && (
                <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg animate-pulse font-mono">
                  {player.age >= 35 ? 'Age 35+ Veteran Threshold' : 'Recurring Injury Risk Alert'}
                </span>
              )}
            </div>

            {player.isRetired && player.postCareer ? (
              /* Already Retired State */
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 font-mono uppercase">
                    Official Appointment: {player.postCareer.chosenRole.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Retired at Age {player.postCareer.retiredAge} ({player.postCareer.retiredYear})
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Weekly PFA Pension:</span>
                    <strong className="text-emerald-400">{formatCurrency(player.postCareer.pensionWeeklyPayout, currency)}/wk</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Testimonial Proceeds:</span>
                    <strong className="text-amber-400">{formatCurrency(player.postCareer.testimonialWinnings, currency)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Legacy Tier:</span>
                    <strong className="text-cyan-400">{player.postCareer.legacyStatus.replace('_', ' ')}</strong>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Post-Career Chronicle:</span>
                  {player.postCareer.postCareerLog.map((log, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Active Player Retirement Trigger */
              <div className="space-y-3 text-xs text-slate-300">
                <p className="leading-relaxed">
                  Football is a finite profession. When players reach age 35+ or accumulate recurring severe injuries, a formal decision must be made to transition from the pitch into high-level football management, boardroom governance, punditry, or philanthropy.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] font-mono text-slate-400">
                    Current Age: <strong className="text-white">{player.age} yrs</strong> · Recurring Injuries: <strong className="text-white">{player.recurringInjuryCount || 0}</strong>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playWhistle();
                      if (onOpenRetirement) onOpenRetirement();
                    }}
                    className="py-3 px-5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 whitespace-nowrap"
                  >
                    <Trophy className="w-4 h-4 text-slate-950" />
                    <span>Initiate Formal Retirement & Post-Career Transition</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
