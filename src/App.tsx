/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Club, ContractClauses, GameView, MatchSimulationResult, Player, SeasonRecord } from './types/game';
import { CLUBS_DATABASE, getClubById, getOpponentsForClub } from './data/clubs';
import { createNewPlayer, loadPlayer, savePlayer, clearSavedPlayer } from './utils/gameStorage';
import { CurrencyCode, formatCurrency } from './utils/currency';
import { sounds } from './utils/soundFx';
import { calculateTaxBreakdown } from './utils/taxResidency';
import { DIET_PLANS, SLEEP_SCHEDULES, COMMUNITY_ACTIVITIES } from './data/dailyRoutineData';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { IntroCinematic } from './components/IntroCinematic';
import { PersonaHQ } from './components/PersonaHQ';
import { MatchView } from './components/MatchView';
import { ClubRoom } from './components/ClubRoom';
import { TrainingHub } from './components/TrainingHub';
import { LifeShopWindow } from './components/LifeShopWindow';
import { MediaRelations } from './components/MediaRelations';
import { NewCareerModal } from './components/NewCareerModal';
import { SeasonSummaryModal } from './components/SeasonSummaryModal';
import { RetirementTransitionModal } from './components/RetirementTransitionModal';
import { LockerRoomTeammates } from './components/LockerRoomTeammates';
import { PersonalCoachHub } from './components/PersonalCoachHub';
import { MedicalCenter } from './components/MedicalCenter';
import { TransferMarket } from './components/TransferMarket';
import { ScoutingHub } from './components/ScoutingHub';
import { AgentTerminal } from './components/AgentTerminal';
import { getCurrentWeekFixture } from './utils/LeagueEngine';
import { PostCareerProfile } from './types/game';
import { ArrowRight, Award, Calendar, Heart, MessageSquare, Play, ShieldAlert, Sparkles, Stethoscope, Trophy, User, Zap } from 'lucide-react';

export default function App() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentView, setCurrentView] = useState<GameView>('PERSONA');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showIntroStory, setShowIntroStory] = useState(false);
  const [showNewCareerModal, setShowNewCareerModal] = useState(false);
  const [showSeasonSummaryModal, setShowSeasonSummaryModal] = useState(false);
  const [showPostMatchInterview, setShowPostMatchInterview] = useState(false);
  const [retirementPrompt, setRetirementPrompt] = useState<{
    show: boolean;
    reason: 'AGE_35_PLUS' | 'SEVERE_RECURRING_INJURY' | 'VOLUNTARY_PINNACLE';
  } | null>(null);

  // Sub-tab direct routing state
  const [clubRoomSubTab, setClubRoomSubTab] = useState<'contract' | 'medical' | 'transfers' | 'scouting' | 'agent' | 'news'>('contract');
  const [personaSubTab, setPersonaSubTab] = useState<'avatar' | 'daily_routine' | 'social_feed' | 'brand_deals' | 'scouting' | 'family' | 'dual_nat' | 'papers' | 'locker_room' | 'tax_residency' | 'hall_of_fame'>('avatar');
  const [trainingSubTab, setTrainingSubTab] = useState<'drills' | 'tactical_board'>('drills');

  // Reviewing transfer offer contract state
  const [reviewingContract, setReviewingContract] = useState<{
    club: Club;
    contract: ContractClauses;
    isNegotiating: boolean;
  } | null>(null);

  // Notice ticker message
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  // Load from storage on mount
  useEffect(() => {
    const saved = loadPlayer();
    if (saved && saved.isUserCreated) {
      setPlayer(saved);
      setShowIntroStory(false);
      setShowNewCareerModal(false);
    } else {
      // First screen: The beautiful 3D intro story!
      setShowIntroStory(true);
      setShowNewCareerModal(false);
    }
  }, []);

  // Auto-save on player change
  useEffect(() => {
    if (player) {
      savePlayer(player);
    }
  }, [player]);

  const currentClub = useMemo(() => {
    if (!player) return CLUBS_DATABASE[0];
    return getClubById(player.currentClubId) || CLUBS_DATABASE[0];
  }, [player?.currentClubId]);

  const currency = player?.preferredCurrency || 'GBP';

  // Next fixture from LeagueEngine (strictly enforces competition calendar & legal matchups)
  const currentScheduledFixture = useMemo(() => {
    return getCurrentWeekFixture(currentClub, player?.currentWeek || 1);
  }, [currentClub, player?.currentWeek]);

  const nextOpponent = currentScheduledFixture.opponentClub;

  const handleStartNewCareer = (
    firstName: string,
    lastName: string,
    nationality: string,
    nationCode: string,
    position: any,
    archetype: any,
    origin: any,
    startingClubId: string,
    hometown: string,
    secondaryNation?: string,
    secondaryCode?: string,
    startingAge?: number
  ) => {
    clearSavedPlayer();
    const fresh = createNewPlayer(
      firstName,
      lastName,
      nationality,
      nationCode,
      position,
      archetype,
      origin,
      startingClubId,
      hometown,
      secondaryNation,
      secondaryCode,
      startingAge || 14
    );
    setPlayer(fresh);
    savePlayer(fresh);
    setShowIntroStory(false);
    setShowNewCareerModal(false);
    setCurrentView('PERSONA');
    setBannerNotice(`Welcome to your pro career, ${firstName} ${lastName}! Scholarship signed at ${getClubById(startingClubId).name}.`);
  };

  const handleTeleport = (view: GameView, subTab?: string) => {
    setCurrentView(view);
    if (view === 'CLUB_ROOM' && subTab) {
      setClubRoomSubTab(subTab as any);
    } else if (view === 'PERSONA' && subTab) {
      setPersonaSubTab(subTab as any);
    } else if (view === 'TRAINING' && subTab) {
      setTrainingSubTab(subTab as any);
    }
  };

  if (showIntroStory || !player || !player.isUserCreated) {
    if (showNewCareerModal) {
      return (
        <NewCareerModal
          onStartCareer={handleStartNewCareer}
          onBackToIntro={() => {
            setShowNewCareerModal(false);
            setShowIntroStory(true);
          }}
        />
      );
    }

    return (
      <IntroCinematic
        onProceedToCreation={() => {
          setShowIntroStory(false);
          setShowNewCareerModal(true);
        }}
      />
    );
  }

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleSelectCurrency = (newCurrency: CurrencyCode) => {
    sounds.playClick();
    setPlayer({
      ...player,
      preferredCurrency: newCurrency,
    });
    setBannerNotice(`Switched display currency to ${newCurrency}. All wages and shop prices converted.`);
  };

  // Advance week calendar
  const handleAdvanceWeek = () => {
    sounds.playClick();

    // Weekly net wage and sponsor earnings
    const baseWeekly = player.currentContract.weeklyWage;
    const weeklySponsors = player.sponsors.reduce((sum, s) => sum + s.weeklyPay, 0);
    const grossIncome = baseWeekly + weeklySponsors;

    // Dynamic real-world tax residency deduction based on current club location!
    const taxCalc = calculateTaxBreakdown(
      currentClub,
      grossIncome,
      player.currentContract.agentFeePercent || 5
    );
    const netIncome = taxCalc.netWeeklyWage;

    const currentTotalTaxes = player.taxResidency?.totalTaxesPaidCareer || 0;
    const updatedTaxResidency = {
      country: currentClub.country,
      taxAuthority: taxCalc.taxAuthority,
      taxAuthorityShort: taxCalc.taxAuthorityShort,
      taxSystemName: taxCalc.taxSchemeName,
      effectiveTaxRate: taxCalc.effectiveRatePercent / 100,
      systemDescription: taxCalc.notes,
      isTaxFreeHaven: taxCalc.isTaxFreeHaven,
      totalTaxesPaidCareer: currentTotalTaxes + taxCalc.taxDeductedWeekly,
      lastTaxDeductionWeekly: taxCalc.taxDeductedWeekly,
    };

    const nextWeek = player.currentWeek + 1;

    // Check if season completed (38 weeks)
    if (nextWeek > 38) {
      setShowSeasonSummaryModal(true);
      return;
    }

    // Process Injury recovery
    let updatedActiveInjury = player.activeInjury ? { ...player.activeInjury } : null;
    let updatedInjuryWeeks = player.injuryWeeks;

    if (updatedActiveInjury && updatedActiveInjury.remainingWeeks > 0) {
      updatedActiveInjury.remainingWeeks -= 1;
      updatedInjuryWeeks = updatedActiveInjury.remainingWeeks;
      if (updatedActiveInjury.remainingWeeks <= 0) {
        updatedActiveInjury = null;
        updatedInjuryWeeks = 0;
        sounds.playFanfare();
        setBannerNotice(`Medical clearance: ${player.firstName} ${player.lastName} has fully recovered from injury!`);
      }
    }

    // Routine-based weekly stamina regeneration & bio-conditioning
    const activeDiet = DIET_PLANS.find(d => d.id === player.dailyRoutine?.dietId) || DIET_PLANS[0];
    const activeSleep = SLEEP_SCHEDULES.find(s => s.id === player.dailyRoutine?.sleepScheduleId) || SLEEP_SCHEDULES[1];
    const activeCommunity = COMMUNITY_ACTIVITIES.find(c => c.id === player.dailyRoutine?.communityId) || COMMUNITY_ACTIVITIES[0];

    const weeklyEnergyRegen = Math.max(
      5,
      activeSleep.energyRegenWeekly + activeDiet.staminaRegenBonus - activeCommunity.energyCost
    );
    const restoredEnergy = Math.min(100, player.energy + weeklyEnergyRegen);
    const newSharpness = Math.min(100, Math.max(30, player.matchSharpness - 4 + activeSleep.matchSharpnessDelta));
    const dietExpenses = activeDiet.weeklyCostGBP || 0;
    const finalBankBalance = Math.max(0, player.bankBalance + netIncome - dietExpenses);

    const updatedMorale = Math.min(100, Math.max(10, player.morale + activeSleep.moraleDelta));
    const updatedFanRep = Math.min(100, Math.max(5, player.fanReputation + (activeCommunity.fanReputationDelta > 0 ? 1 : 0)));

    setPlayer({
      ...player,
      currentWeek: nextWeek,
      bankBalance: finalBankBalance,
      totalCareerEarnings: player.totalCareerEarnings + grossIncome,
      taxResidency: updatedTaxResidency,
      energy: restoredEnergy,
      matchSharpness: newSharpness,
      morale: updatedMorale,
      fanReputation: updatedFanRep,
      activeInjury: updatedActiveInjury,
      injuryWeeks: updatedInjuryWeeks,
      injuryName: updatedActiveInjury ? updatedActiveInjury.name : undefined,
    });

    if (!updatedActiveInjury || updatedActiveInjury.remainingWeeks === 0) {
      const taxText = taxCalc.isTaxFreeHaven
        ? `0% Tax Haven (${taxCalc.taxAuthorityShort})`
        : `${taxCalc.effectiveRatePercent}% Tax (${taxCalc.taxAuthorityShort}: -${formatCurrency(taxCalc.taxDeductedWeekly, currency)})`;
      setBannerNotice(
        `Wk ${nextWeek} Payday: Gross ${formatCurrency(grossIncome, currency)} → ${taxText} | Agent (${taxCalc.agentFeePercent}%: -${formatCurrency(taxCalc.agentFeeWeekly, currency)}) → Net Deposited: +${formatCurrency(netIncome, currency)} | Routine: +${weeklyEnergyRegen}% Energy Regen (${activeSleep.name.split(' ')[0]} + ${activeDiet.name.split(' ')[0]})`
      );
    }
  };

  const handleMatchComplete = (result: MatchSimulationResult) => {
    sounds.playWhistle();

    // Update player season stats
    const currentStats = { ...player.seasonStats };
    currentStats.appearances += 1;
    if (result.playerStarted) currentStats.starts += 1;
    currentStats.goals += result.playerGoals;
    currentStats.assists += result.playerAssists;
    if (result.playerYellowCards) {
      currentStats.yellowCards = (currentStats.yellowCards || 0) + result.playerYellowCards;
    }
    if (result.playerRedCards) {
      currentStats.redCards = (currentStats.redCards || 0) + result.playerRedCards;
    }
    
    // Ratings history
    const newRatings = [...currentStats.ratingsHistory, result.playerRating];
    currentStats.ratingsHistory = newRatings;
    const avg = Number((newRatings.reduce((a, b) => a + b, 0) / newRatings.length).toFixed(1));
    currentStats.avgRating = avg;

    const newTrust = Math.min(100, Math.max(10, player.managerTrust + result.managerTrustDelta));
    const newMorale = Math.min(100, Math.max(10, player.morale + result.fanMoraleDelta));
    const newEnergy = Math.max(15, player.energy - result.playerStaminaLoss);
    const newSharpness = Math.min(100, player.matchSharpness + 18);

    // Increase market value on goalscoring
    const valueBump = (result.playerGoals * 800_000) + (result.playerAssists * 400_000);

    // Naturally advance gameweek with match!
    const nextWeek = player.currentWeek + 1;
    const isSeasonEnd = nextWeek > 38;

    // Routine-based recovery
    const activeDiet = DIET_PLANS.find(d => d.id === player.dailyRoutine?.dietId) || DIET_PLANS[0];
    const activeSleep = SLEEP_SCHEDULES.find(s => s.id === player.dailyRoutine?.sleepScheduleId) || SLEEP_SCHEDULES[1];
    const activeCommunity = COMMUNITY_ACTIVITIES.find(c => c.id === player.dailyRoutine?.communityId) || COMMUNITY_ACTIVITIES[0];

    const weeklyEnergyRegen = Math.max(
      5,
      activeSleep.energyRegenWeekly + activeDiet.staminaRegenBonus - activeCommunity.energyCost
    );
    const restoredEnergy = Math.min(100, Math.max(20, newEnergy + weeklyEnergyRegen));

    // Decrement injury weeks if recovering
    const updatedInjuryWeeks = Math.max(0, (player.injuryWeeks || 0) - 1);
    const updatedActiveInjury = player.activeInjury && updatedInjuryWeeks > 0
      ? { ...player.activeInjury, remainingWeeks: updatedInjuryWeeks }
      : null;

    // Disciplinary suspension handling
    let updatedSuspensionWeeks = Math.max(0, (player.suspensionWeeks || 0) - 1);
    let updatedSuspensionReason = updatedSuspensionWeeks > 0 ? player.suspensionReason : undefined;
    if (result.isSuspendedNextMatch) {
      updatedSuspensionWeeks = 1;
      updatedSuspensionReason = result.suspensionReason || 'Domestic League Disciplinary Suspension';
    }

    setPlayer({
      ...player,
      currentWeek: nextWeek,
      seasonStats: currentStats,
      managerTrust: newTrust,
      morale: newMorale,
      energy: restoredEnergy,
      matchSharpness: newSharpness,
      bankBalance: player.bankBalance + result.winningsPaid,
      totalCareerEarnings: player.totalCareerEarnings + result.winningsPaid,
      marketValue: player.marketValue + valueBump,
      injuryWeeks: updatedInjuryWeeks,
      activeInjury: updatedActiveInjury,
      injuryName: updatedActiveInjury ? updatedActiveInjury.name : undefined,
      suspensionWeeks: updatedSuspensionWeeks,
      suspensionReason: updatedSuspensionReason,
    });

    if (result.isSuspendedNextMatch) {
      setBannerNotice(
        `⚠️ DISCIPLINARY NOTICE: You have incurred a 1-match domestic suspension (${result.suspensionReason}) for Gameweek ${nextWeek}!`
      );
    } else {
      setBannerNotice(
        `Gameweek ${player.currentWeek} Concluded! Match winnings +£${result.winningsPaid.toLocaleString()} paid. Moving to Gameweek ${nextWeek}.`
      );
    }

    if (isSeasonEnd) {
      setShowSeasonSummaryModal(true);
    }

    // Prompt post-match flash interview!
    setShowPostMatchInterview(true);
  };

  const handleSignContract = (signedContract: ContractClauses) => {
    if (reviewingContract) {
      // Transfer to new club!
      const newTax = calculateTaxBreakdown(
        reviewingContract.club,
        signedContract.weeklyWage,
        signedContract.agentFeePercent || 5
      );
      setPlayer({
        ...player,
        currentClubId: reviewingContract.club.id,
        currentContract: signedContract,
        squadRole: signedContract.squadRole,
        bankBalance: player.bankBalance + (signedContract.signingBonus || 0),
        totalCareerEarnings: player.totalCareerEarnings + (signedContract.signingBonus || 0),
        taxResidency: {
          country: reviewingContract.club.country,
          taxAuthority: newTax.taxAuthority,
          taxAuthorityShort: newTax.taxAuthorityShort,
          taxSystemName: newTax.taxSchemeName,
          effectiveTaxRate: newTax.effectiveRatePercent / 100,
          systemDescription: newTax.notes,
          isTaxFreeHaven: newTax.isTaxFreeHaven,
          totalTaxesPaidCareer: player.taxResidency?.totalTaxesPaidCareer || 0,
          lastTaxDeductionWeekly: newTax.taxDeductedWeekly,
        },
        managerTrust: 65,
        teamChemistry: 60,
      });
      setReviewingContract(null);
      setCurrentView('CLUB_ROOM');
      setBannerNotice(`Transfer Finalized! Welcome to ${reviewingContract.club.name}. Tax residency updated to ${reviewingContract.club.country} (${newTax.taxAuthorityShort}).`);
    } else {
      // Renewal with current club
      setPlayer({
        ...player,
        currentContract: signedContract,
        bankBalance: player.bankBalance + (signedContract.signingBonus || 0),
      });
      setBannerNotice(`Contract extension ratified until ${signedContract.expiryYear}!`);
    }
  };

  const handleProceedToNextSeason = () => {
    setShowSeasonSummaryModal(false);

    const pastRecord: SeasonRecord = {
      year: player.currentYear,
      age: player.age,
      clubId: currentClub.id,
      clubName: currentClub.name,
      appearances: player.seasonStats.appearances,
      goals: player.seasonStats.goals,
      assists: player.seasonStats.assists,
      cleanSheets: player.seasonStats.cleanSheets,
      avgRating: player.seasonStats.avgRating || 7.2,
      trophies: player.seasonStats.goals >= 18 ? [`${currentClub.league} Golden Boot`] : [],
      leaguePosition: 2,
      individualAwards: player.seasonStats.goals >= 18 ? ['Golden Boot Top Scorer'] : [],
      wageEarned: player.currentContract.weeklyWage * 52,
    };

    const newAge = player.age + 1;
    const newYear = player.currentYear + 1;

    setPlayer({
      ...player,
      age: newAge,
      currentYear: newYear,
      currentWeek: 1,
      careerHistory: [pastRecord, ...player.careerHistory],
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
      energy: 100,
      matchSharpness: 75,
    });

    // Check retirement trigger for age 35+ or severe recurring injuries
    if (newAge >= 35) {
      setRetirementPrompt({
        show: true,
        reason: 'AGE_35_PLUS',
      });
    } else if ((player.recurringInjuryCount || 0) >= 2) {
      setRetirementPrompt({
        show: true,
        reason: 'SEVERE_RECURRING_INJURY',
      });
    } else {
      setBannerNotice(`Welcome to Season ${newYear}! You are now age ${newAge}.`);
    }
  };

  const handleConfirmRetirement = (postCareer: PostCareerProfile) => {
    setPlayer({
      ...player,
      isRetired: true,
      postCareer,
      bankBalance: player.bankBalance + postCareer.testimonialWinnings,
      totalCareerEarnings: player.totalCareerEarnings + postCareer.testimonialWinnings,
    });
    setRetirementPrompt(null);
    setCurrentView('PERSONA');
    setBannerNotice(
      `Retirement Ceremony Concluded! You have been inducted into the Hall of Fame as a ${postCareer.legacyStatus.replace('_', ' ')}. Your new vocation as ${postCareer.chosenRole.replace('_', ' ')} is now active!`
    );
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* 1. Left Sidebar Navigation (Desktop Fixed, Mobile Drawer) */}
      <Sidebar
        player={player}
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setIsMobileSidebarOpen(false);
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. Main Game Viewport Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar Header HUD with Quick Fixture Pill & Calendar Controller */}
        <Header
          player={player}
          currentView={currentView}
          onSelectView={setCurrentView}
          onNextWeek={handleAdvanceWeek}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onNewCareer={() => setShowNewCareerModal(true)}
          onSelectCurrency={handleSelectCurrency}
          onTeleport={handleTeleport}
          nextOpponentName={nextOpponent.shortName || nextOpponent.name}
          competitionName={currentScheduledFixture.competitionName}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          activeSubTab={
            currentView === 'CLUB_ROOM' ? clubRoomSubTab :
            currentView === 'PERSONA' ? personaSubTab :
            currentView === 'TRAINING' ? trainingSubTab : undefined
          }
        />

        {/* Global Notification Banner */}
        {bannerNotice && (
          <div className="bg-slate-900 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 flex items-center justify-between">
            <div className="max-w-7xl mx-auto flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{bannerNotice}</span>
            </div>
            <button 
              onClick={() => setBannerNotice(null)}
              className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Windowed Stage: Completely Flat 1-Click Architecture */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 md:py-8">
          {/* 1. MATCHDAY STAGE */}
          {currentView === 'MATCH' && (
            <div className="space-y-6">
              <MatchView
                player={player}
                homeClub={currentClub}
                awayClub={nextOpponent}
                competitionName={currentScheduledFixture.competitionName}
                onMatchComplete={handleMatchComplete}
              />

              {/* Post-Match Flash Tunnel Interview & Brand Ambassador Deals */}
              {showPostMatchInterview && (
                <div className="pt-6 border-t border-slate-800">
                  <MediaRelations
                    player={player}
                    club={currentClub}
                    onUpdatePlayer={setPlayer}
                    onClose={() => setShowPostMatchInterview(false)}
                  />
                </div>
              )}
            </div>
          )}

          {/* 2. SCOUTING HUB (DIRECT 1-CLICK VIEW) */}
          {currentView === 'SCOUTING' && (
            <ScoutingHub
              player={player}
              club={currentClub}
              onUpdatePlayer={setPlayer}
            />
          )}

          {/* 3. TEAMMATES & LOCKER ROOM (DIRECT 1-CLICK VIEW) */}
          {currentView === 'TEAMMATES' && (
            <LockerRoomTeammates
              player={player}
              club={currentClub}
              onUpdatePlayer={setPlayer}
              onGoToMatch={() => setCurrentView('MATCH')}
            />
          )}

          {/* 4. TRAINING GROUND (DIRECT 1-CLICK VIEW) */}
          {currentView === 'TRAINING' && (
            <TrainingHub
              player={player}
              onUpdatePlayer={setPlayer}
              onProceedToMatch={() => setCurrentView('MATCH')}
              opponentClub={nextOpponent}
              initialTab={trainingSubTab}
            />
          )}

          {/* 5. PERSONAL COACHING HUB (DIRECT 1-CLICK VIEW) */}
          {currentView === 'COACHING' && (
            <PersonalCoachHub
              player={player}
              club={currentClub}
              onUpdatePlayer={setPlayer}
            />
          )}

          {/* 6. TRANSFER MARKET (DIRECT 1-CLICK VIEW) */}
          {currentView === 'TRANSFERS' && (
            <TransferMarket
              player={player}
              onReviewOfferContract={(offeringClub, proposedContract) => {
                setReviewingContract({
                  club: offeringClub,
                  contract: proposedContract,
                  isNegotiating: true,
                });
                setCurrentView('CONTRACTS');
              }}
              onRequestTransfer={() => {
                setPlayer({
                  ...player,
                  managerTrust: Math.max(10, player.managerTrust - 20),
                  morale: Math.max(10, player.morale - 15),
                });
              }}
              onRequestLoan={() => {
                setBannerNotice('Agent instructed to find a loan destination with guaranteed starting minutes.');
              }}
            />
          )}

          {/* 7. CONTRACTS & BOARDROOM (DIRECT 1-CLICK VIEW) */}
          {(currentView === 'CONTRACTS' || currentView === 'CLUB_ROOM') && (
            <ClubRoom
              player={player}
              club={reviewingContract ? reviewingContract.club : currentClub}
              onUpdatePlayer={setPlayer}
              onSignContract={handleSignContract}
              initialTab={clubRoomSubTab || 'contract'}
              onTabChange={(newTab) => {
                if (newTab === 'scouting') setCurrentView('SCOUTING');
                else if (newTab === 'transfers') setCurrentView('TRANSFERS');
                else if (newTab === 'medical') setCurrentView('MEDICAL');
                else setClubRoomSubTab(newTab);
              }}
              onReviewOfferContract={(offeringClub, proposedContract) => {
                setReviewingContract({
                  club: offeringClub,
                  contract: proposedContract,
                  isNegotiating: true,
                });
              }}
              onRequestTransfer={() => {
                setPlayer({
                  ...player,
                  managerTrust: Math.max(10, player.managerTrust - 20),
                  morale: Math.max(10, player.morale - 15),
                });
              }}
              onRequestLoan={() => {
                setBannerNotice('Agent instructed to find a loan destination with guaranteed starting minutes.');
              }}
            />
          )}

          {/* 8. MEDICAL LAB (DIRECT 1-CLICK VIEW) */}
          {currentView === 'MEDICAL' && (
            <MedicalCenter
              player={player}
              onUpdatePlayer={setPlayer}
            />
          )}

          {/* 9. PERSONA & CAREER HQ (DIRECT 1-CLICK VIEW) */}
          {currentView === 'PERSONA' && (
            <PersonaHQ
              player={player}
              club={currentClub}
              onUpdatePlayer={setPlayer}
              initialSubTab={personaSubTab}
              onOpenRetirement={() => setRetirementPrompt({
                show: true,
                reason: player.age >= 35 ? 'AGE_35_PLUS' : (player.recurringInjuryCount || 0) >= 2 ? 'SEVERE_RECURRING_INJURY' : 'VOLUNTARY_PINNACLE',
              })}
            />
          )}

          {/* 10. LIFE, LUXURY & PRO SHOP (DIRECT 1-CLICK VIEW) */}
          {currentView === 'LIFE_SHOP' && (
            <LifeShopWindow
              player={player}
              onUpdatePlayer={setPlayer}
            />
          )}

          {/* 11. MEDIA & FLASH PRESS CONFERENCES */}
          {currentView === 'MEDIA' && (
            <MediaRelations
              player={player}
              club={currentClub}
              onUpdatePlayer={setPlayer}
              onClose={() => setCurrentView('PERSONA')}
              initialStage="brand_deals"
            />
          )}
        </main>
      </div>

      {/* New Career Character Setup Modal */}
      {showNewCareerModal && (
        <NewCareerModal onStartCareer={handleStartNewCareer} />
      )}

      {/* Season Summary & Ballon d'Or Gala Modal */}
      {showSeasonSummaryModal && (
        <SeasonSummaryModal
          player={player}
          club={currentClub}
          onProceedToNextSeason={handleProceedToNextSeason}
        />
      )}

      {/* Formal Retirement & Post-Career Transition Modal */}
      {retirementPrompt?.show && (
        <RetirementTransitionModal
          player={player}
          club={currentClub}
          forcedReason={retirementPrompt.reason}
          onConfirmRetirement={handleConfirmRetirement}
          onContinuePlaying={
            retirementPrompt.reason === 'AGE_35_PLUS'
              ? () => {
                  setRetirementPrompt(null);
                  setBannerNotice(`Committed to one final farewell campaign at age ${player.age}! Give everything for the badge.`);
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
