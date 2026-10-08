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
import { loadDefaultFootballWorldPack } from './world/worldPackLoader';
import {
  createCareerWorldSession,
  getNextCareerWorldFixture,
  advanceCareerWorldToNextFixture,
  resolveCareerInteractiveFixtureDay,
  projectWorldFootballOutputsToCareerPlayer,
  type CareerWorldSession,
  type CareerInteractiveFixture,
} from './career/worldCareerBridge';
import {
  createWorldMatchViewModel,
  buildCareerWorldExternalResolution,
  type WorldInteractiveMatchOutcome,
} from './career/worldMatchViewAdapter';
import type { WorldGoalEvent } from './world/types';
import { isLegacyClubSupported } from './utils/worldClubCompatibility';
import { loadWorldCareer, saveWorldCareer, deleteWorldCareer } from './utils/worldCareerStorage';
import {
  createWorldCareerSaveRecord,
  validateWorldCareerSave,
  restoreCareerWorldSessionFromSave,
  type WorldCareerSaveV1,
} from './career/worldCareerSave';
import { ArrowRight, Award, Calendar, Heart, MessageSquare, Play, ShieldAlert, Sparkles, Stethoscope, Trophy, User, Zap, Loader2, AlertTriangle } from 'lucide-react';

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

  // Living World State (Gate 2)
  const [worldSession, setWorldSession] = useState<CareerWorldSession | null>(null);
  const [activeWorldHandoff, setActiveWorldHandoff] = useState<CareerInteractiveFixture | null>(null);
  const [worldLoading, setWorldLoading] = useState(false);
  const [worldError, setWorldError] = useState<string | null>(null);
  const isWorldCareer = worldSession !== null;

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

  const [storageHydrated, setStorageHydrated] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const writeSequenceRef = React.useRef(0);

  // Asynchronous and ordered hydration flow
  useEffect(() => {
    let isCancelled = false;

    async function hydrateApp() {
      // 1. Check for intentional reset parameter
      if (typeof window !== 'undefined' && window.location.search.includes('reset=1')) {
        await deleteWorldCareer().catch((err) => console.error('Failed to delete world career:', err));
        clearSavedPlayer();
        if (!isCancelled) {
          setPlayer(null);
          setWorldSession(null);
          setActiveWorldHandoff(null);
          setShowIntroStory(false);
          setShowNewCareerModal(true);
          setStorageHydrated(true);
        }
        return;
      }

      // 2. Priority check: Living World IndexedDB Save
      let worldSave: WorldCareerSaveV1 | null = null;
      try {
        worldSave = await loadWorldCareer();
      } catch (err: any) {
        console.error('Failed to read IndexedDB world save:', err);
        if (!isCancelled) {
          setSaveError(`Failed to access world career database: ${err?.message || err}`);
          setStorageHydrated(true);
        }
        return;
      }

      if (worldSave) {
        try {
          const pack = await loadDefaultFootballWorldPack();
          const validation = validateWorldCareerSave(worldSave, pack);
          if (!validation.valid) {
            if (!isCancelled) {
              setSaveError(`Corrupted or incompatible living-world save: ${validation.error}`);
              setStorageHydrated(true);
            }
            return;
          }

          const restored = restoreCareerWorldSessionFromSave(pack, worldSave);
          if (!isCancelled) {
            setPlayer(worldSave.player);
            setWorldSession(restored.session);
            setActiveWorldHandoff(restored.activeHandoff ?? null);
            if (restored.activeHandoff) {
              setCurrentView('MATCH');
            }
            setShowIntroStory(false);
            setShowNewCareerModal(false);
            setStorageHydrated(true);
          }
          return;
        } catch (err: any) {
          console.error('Failed to restore living-world session from save:', err);
          if (!isCancelled) {
            setSaveError(`Failed to reconstruct living-world career: ${err?.message || err}`);
            setStorageHydrated(true);
          }
          return;
        }
      }

      // 3. Fallback check: Legacy Player-only localStorage Save
      const savedLegacy = loadPlayer();
      if (savedLegacy && savedLegacy.isUserCreated) {
        if (!isCancelled) {
          setPlayer(savedLegacy);
          setWorldSession(null);
          setActiveWorldHandoff(null);
          setShowIntroStory(false);
          setShowNewCareerModal(false);
          setStorageHydrated(true);
        }
      } else {
        if (!isCancelled) {
          setShowIntroStory(true);
          setShowNewCareerModal(false);
          setStorageHydrated(true);
        }
      }
    }

    hydrateApp();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Auto-save on player change (debounced for living-world, immediate for legacy)
  useEffect(() => {
    if (!storageHydrated || !player) return;

    if (isWorldCareer && worldSession) {
      const seq = ++writeSequenceRef.current;
      const timer = setTimeout(async () => {
        if (seq !== writeSequenceRef.current) return;
        try {
          const record = createWorldCareerSaveRecord(
            player,
            worldSession,
            activeWorldHandoff?.fixtureId
          );
          await saveWorldCareer(record);
        } catch (err) {
          console.error('World career autosave failed:', err);
        }
      }, 400);
      return () => clearTimeout(timer);
    } else if (!isWorldCareer) {
      // Legacy mode autosave
      savePlayer(player);
    }
  }, [player, storageHydrated, isWorldCareer, worldSession, activeWorldHandoff]);

  const currentClub = useMemo(() => {
    if (!player) return CLUBS_DATABASE[0];
    return getClubById(player.currentClubId) || CLUBS_DATABASE[0];
  }, [player?.currentClubId]);

  const currency = player?.preferredCurrency || 'GBP';

  // Canonical living-world match presentation model
  const worldModel = useMemo(() => {
    if (!worldSession || !activeWorldHandoff) return null;
    return createWorldMatchViewModel(worldSession, activeWorldHandoff);
  }, [worldSession, activeWorldHandoff]);

  // Next fixture from Living World calendar
  const worldNextFixture = useMemo(() => {
    if (!worldSession) return undefined;
    return getNextCareerWorldFixture(worldSession);
  }, [worldSession]);

  const worldNextOpponentName = useMemo(() => {
    if (!worldSession) return undefined;
    if (activeWorldHandoff) {
      const oppClub = worldSession.sessionPack.clubs.find(
        (c) => c.id === activeWorldHandoff.opponentWorldClubId
      );
      return oppClub?.shortName || oppClub?.name || activeWorldHandoff.opponentWorldClubId;
    }
    if (worldNextFixture) {
      const oppClub = worldSession.sessionPack.clubs.find(
        (c) => c.id === worldNextFixture.opponentWorldClubId
      );
      return oppClub?.shortName || oppClub?.name || worldNextFixture.opponentWorldClubId;
    }
    return undefined;
  }, [worldSession, activeWorldHandoff, worldNextFixture]);

  const worldNextCompetitionName = useMemo(() => {
    if (!worldSession) return undefined;
    const compId = activeWorldHandoff?.competitionId || worldNextFixture?.competitionId;
    if (!compId) return undefined;
    const compDef = worldSession.sessionPack.competitionDefinitions.find((c) => c.id === compId);
    return compDef?.name || compId;
  }, [worldSession, activeWorldHandoff, worldNextFixture]);

  // Next fixture from LeagueEngine (strictly for legacy careers)
  const currentScheduledFixture = useMemo(() => {
    if (worldSession) return null;
    return getCurrentWeekFixture(currentClub, player?.currentWeek || 1);
  }, [worldSession, currentClub, player?.currentWeek]);

  const legacyNextOpponent = currentScheduledFixture?.opponentClub || currentClub;

  const effectiveOpponentClub = useMemo(() => {
    if (isWorldCareer && worldSession) {
      const oppWorldId = activeWorldHandoff?.opponentWorldClubId || worldNextFixture?.opponentWorldClubId;
      if (oppWorldId) {
        const matchedLegacyClub = CLUBS_DATABASE.find(
          (c) =>
            c.id === oppWorldId ||
            c.name.toLowerCase() ===
              worldSession.sessionPack.clubs
                .find((wc) => wc.id === oppWorldId)
                ?.name.toLowerCase()
        );
        if (matchedLegacyClub) return matchedLegacyClub;
      }
    }
    return legacyNextOpponent;
  }, [isWorldCareer, worldSession, activeWorldHandoff, worldNextFixture, legacyNextOpponent]);

  const handleStartNewCareer = async (
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
    if (!isLegacyClubSupported(startingClubId)) {
      setBannerNotice(`Club '${startingClubId}' is not yet available in the Living World.`);
      return;
    }

    try {
      setWorldLoading(true);
      setWorldError(null);

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

      // Asynchronously load the Living World Data Pack
      const pack = await loadDefaultFootballWorldPack();
      const bootstrapRes = createCareerWorldSession(pack, fresh);

      if (!bootstrapRes.accepted || !bootstrapRes.session) {
        const errMsg = bootstrapRes.error || 'Failed to initialize Living World session.';
        setWorldError(errMsg);
        setWorldLoading(false);
        setBannerNotice(`Living World Error: ${errMsg}`);
        return;
      }

      // 1. Create authoritative save record & persist to IndexedDB BEFORE activating
      const newSave = createWorldCareerSaveRecord(fresh, bootstrapRes.session, undefined);
      await saveWorldCareer(newSave);

      // 2. Clear stale legacy save so no ghost save remains
      clearSavedPlayer();

      // 3. Update memory state atomically
      writeSequenceRef.current++;
      setPlayer(fresh);
      setWorldSession(bootstrapRes.session);
      setActiveWorldHandoff(null);
      setWorldLoading(false);

      setShowIntroStory(false);
      setShowNewCareerModal(false);
      setCurrentView('PERSONA');
      setBannerNotice(
        `Welcome to your living world pro career, ${firstName} ${lastName}! Signed at ${getClubById(startingClubId)?.name || startingClubId}. Season 2026-27 active.`
      );
    } catch (err: any) {
      console.error('Failed to initialize Living World session:', err);
      const errMsg = err?.message || 'Error loading world pack asset.';
      setWorldError(errMsg);
      setWorldLoading(false);
      setBannerNotice(`World Pack Error: ${errMsg}`);
    }
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

  const handleAdvanceToNextWorldFixture = async () => {
    if (!worldSession || !player) return;

    if (activeWorldHandoff) {
      setCurrentView('MATCH');
      return;
    }

    sounds.playClick();
    const advanceRes = advanceCareerWorldToNextFixture(worldSession);

    if (!advanceRes.accepted || !advanceRes.session || !advanceRes.handoff) {
      const errMsg = advanceRes.error || 'Failed to advance to next scheduled fixture.';
      setWorldError(errMsg);
      setBannerNotice(`Calendar Advance: ${errMsg}`);
      return;
    }

    setWorldSession(advanceRes.session);
    setActiveWorldHandoff(advanceRes.handoff);
    setCurrentView('MATCH');

    // Immediate atomic persistence of D-1 reservation
    writeSequenceRef.current++;
    const dMinus1Save = createWorldCareerSaveRecord(
      player,
      advanceRes.session,
      advanceRes.handoff.fixtureId
    );
    await saveWorldCareer(dMinus1Save).catch((err) => {
      console.error('Failed to save D-1 world career state:', err);
      setBannerNotice(`Save Warning: D-1 state autosave failed: ${err.message}`);
    });

    const oppDef = advanceRes.session.sessionPack.clubs.find(
      (c) => c.id === advanceRes.handoff!.opponentWorldClubId
    );
    const oppName = oppDef?.shortName || oppDef?.name || advanceRes.handoff.opponentWorldClubId;

    setBannerNotice(
      `Advanced to matchday eve (${advanceRes.session.runtimeState.currentDate})! Next: ${advanceRes.handoff.competitionId} vs ${oppName} on ${advanceRes.handoff.scheduledDate}.`
    );
  };

  const handleWorldMatchComplete = async (outcome: WorldInteractiveMatchOutcome) => {
    if (!worldSession || !activeWorldHandoff || !player) return;
    sounds.playWhistle();

    // 1. Build canonical WorldExternalFixtureResolution
    const externalResolution = buildCareerWorldExternalResolution(
      worldSession,
      activeWorldHandoff,
      outcome
    );

    // 2. Resolve fixture day atomically in world simulation
    const resolveResult = resolveCareerInteractiveFixtureDay(
      worldSession,
      externalResolution
    );

    if (!resolveResult.accepted || !resolveResult.session) {
      console.error('World matchday resolution failed:', resolveResult.error);
      setBannerNotice(`World resolution error: ${resolveResult.error}`);
      return;
    }

    const updatedSession = resolveResult.session;
    setWorldSession(updatedSession);
    setActiveWorldHandoff(null);

    // 3. Project updated canonical football state to career player
    const worldPlayerId = updatedSession.link.worldPlayerId;
    const updatedWorldState = updatedSession.runtimeState.playerFootballStates.find(
      (s) => s.playerId === worldPlayerId
    );

    let updatedPlayer = player;
    if (updatedWorldState) {
      updatedPlayer = projectWorldFootballOutputsToCareerPlayer(player, updatedWorldState);
    }

    // 4. Project seasonStats from canonical externalResolution
    const userAppearance = externalResolution.participation?.playerAppearances.find(
      (a) => a.playerId === worldPlayerId
    );
    const userRating = externalResolution.matchDetail?.playerRatings.find(
      (r) => r.playerId === worldPlayerId
    );
    const matchEvents = externalResolution.matchDetail?.events ?? [];
    const userYellows = matchEvents.filter(
      (e) => e.type === 'YELLOW_CARD' && e.playerId === worldPlayerId
    ).length;
    const userReds = matchEvents.filter(
      (e) =>
        (e.type === 'SECOND_YELLOW_RED' || e.type === 'STRAIGHT_RED') &&
        e.playerId === worldPlayerId
    ).length;
    const userGoals = matchEvents.filter(
      (e) => e.type === 'GOAL' && e.playerId === worldPlayerId
    ).length;
    const userAssists = matchEvents.filter(
      (e) => e.type === 'GOAL' && (e as WorldGoalEvent).assistPlayerId === worldPlayerId
    ).length;

    const prevStats = { ...updatedPlayer.seasonStats };
    const userMinutes = userAppearance?.minutesPlayed ?? 0;
    if (userMinutes > 0) {
      prevStats.appearances += 1;
      if (userAppearance?.started) {
        prevStats.starts += 1;
      }
    }
    prevStats.goals += userGoals;
    prevStats.assists += userAssists;
    prevStats.yellowCards = (prevStats.yellowCards || 0) + userYellows;
    prevStats.redCards = (prevStats.redCards || 0) + userReds;

    if (userRating && userMinutes > 0) {
      const newRatings = [...prevStats.ratingsHistory, userRating.rating];
      prevStats.ratingsHistory = newRatings;
      prevStats.avgRating = Number(
        (newRatings.reduce((a, b) => a + b, 0) / newRatings.length).toFixed(1)
      );
    }

    // Save updated player
    const finalPlayer = {
      ...updatedPlayer,
      seasonStats: prevStats,
    };
    setPlayer(finalPlayer);

    // 5. Immediate atomic persistence of post-match resolution (cleared reservation, no active handoff)
    writeSequenceRef.current++;
    const postMatchSave = createWorldCareerSaveRecord(
      finalPlayer,
      updatedSession,
      undefined
    );
    await saveWorldCareer(postMatchSave).catch((err) => {
      console.error('Failed to save post-match world career state:', err);
      setBannerNotice(`Save Warning: Post-match state autosave failed: ${err.message}`);
    });

    const nextFixtureAfterMatch = getNextCareerWorldFixture(updatedSession);
    const oppClub = nextFixtureAfterMatch
      ? updatedSession.sessionPack.clubs.find(
          (c) => c.id === nextFixtureAfterMatch.opponentWorldClubId
        )
      : undefined;
    const oppName = oppClub?.name || nextFixtureAfterMatch?.opponentWorldClubId || 'Season End';

    setBannerNotice(
      `Match concluded! Final: ${externalResolution.result.homeGoals} - ${externalResolution.result.awayGoals}. Next: vs ${oppName} (${nextFixtureAfterMatch?.date || 'Season Complete'}).`
    );

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

  // Guard rendering until persistence hydration completes
  if (!storageHydrated) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white mb-2 font-mono">Loading Career Data...</h3>
        <p className="text-sm text-slate-400 font-mono">
          Checking persistent living-world saves and storage integrity.
        </p>
      </div>
    );
  }

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
          onNextWeek={isWorldCareer ? handleAdvanceToNextWorldFixture : handleAdvanceWeek}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onNewCareer={() => setShowNewCareerModal(true)}
          onSelectCurrency={handleSelectCurrency}
          onTeleport={handleTeleport}
          nextOpponentName={isWorldCareer ? worldNextOpponentName : (legacyNextOpponent.shortName || legacyNextOpponent.name)}
          competitionName={isWorldCareer ? worldNextCompetitionName : (currentScheduledFixture?.competitionName || 'League Match')}
          onOpenSidebar={() => setIsMobileSidebarOpen(true)}
          calendarLabel={isWorldCareer && worldSession ? worldSession.runtimeState.currentDate : undefined}
          advanceLabel={isWorldCareer ? (activeWorldHandoff ? "Play Match ➔" : "Advance ➔") : undefined}
          nextFixtureDate={isWorldCareer && worldNextFixture ? worldNextFixture.date : undefined}
          onAdvance={isWorldCareer ? handleAdvanceToNextWorldFixture : undefined}
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
              {isWorldCareer ? (
                activeWorldHandoff && worldModel ? (
                  <MatchView
                    mode="world"
                    player={player}
                    worldModel={worldModel}
                    onWorldMatchComplete={handleWorldMatchComplete}
                  />
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 lg:p-8 backdrop-blur shadow-2xl space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                            {worldNextCompetitionName || 'League Competition'}
                          </span>
                          {worldNextFixture && (
                            <span className="text-xs font-mono text-slate-400">
                              Round {worldNextFixture.round}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                          Upcoming Fixture Preview
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                          Current world date: <span className="font-mono text-slate-300 font-bold">{worldSession?.runtimeState.currentDate}</span>
                          {worldNextFixture && (
                            <> • Match date: <span className="font-mono text-emerald-400 font-bold">{worldNextFixture.date}</span></>
                          )}
                        </p>
                      </div>

                      {worldNextFixture && (
                        <button
                          onClick={handleAdvanceToNextWorldFixture}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer font-mono active:scale-95"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Advance to Matchday (D-1)</span>
                        </button>
                      )}
                    </div>

                    {worldNextFixture ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Home Club */}
                        <div className={`p-5 rounded-xl border ${worldNextFixture.isHome ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-850/60 border-slate-800'}`}>
                          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">
                            Home Club {worldNextFixture.isHome && <span className="text-emerald-400 font-black ml-1">(Your Club)</span>}
                          </div>
                          <div className="text-lg font-bold text-white">
                            {worldSession?.sessionPack.clubs.find(c => c.id === worldNextFixture.homeClubId)?.name || worldNextFixture.homeClubId}
                          </div>
                        </div>

                        {/* Away Club */}
                        <div className={`p-5 rounded-xl border ${!worldNextFixture.isHome ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-850/60 border-slate-800'}`}>
                          <div className="text-[10px] font-mono uppercase text-slate-400 mb-1 font-bold">
                            Away Club {!worldNextFixture.isHome && <span className="text-emerald-400 font-black ml-1">(Your Club)</span>}
                          </div>
                          <div className="text-lg font-bold text-white">
                            {worldSession?.sessionPack.clubs.find(c => c.id === worldNextFixture.awayClubId)?.name || worldNextFixture.awayClubId}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400">
                        <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm font-medium">All scheduled fixtures for this season are complete.</p>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <MatchView
                  mode="legacy"
                  player={player}
                  homeClub={currentClub}
                  awayClub={legacyNextOpponent}
                  competitionName={currentScheduledFixture?.competitionName || 'League Match'}
                  onMatchComplete={handleMatchComplete}
                />
              )}

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
              opponentClub={effectiveOpponentClub}
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

      {/* Living World Loading Overlay */}
      {worldLoading && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mb-4" />
          <h3 className="text-xl font-bold text-white mb-2 font-mono">Initializing Living World...</h3>
          <p className="text-sm text-slate-400 font-mono max-w-md">
            Loading official 2026-27 football world data pack, scheduling fixtures, and establishing player identity link.
          </p>
        </div>
      )}

      {/* Save Failure / Corrupt World Save Recovery Modal */}
      {saveError && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-mono">World Career Save Error</h3>
            <p className="text-sm text-slate-300 font-mono text-left bg-slate-950 p-3 rounded-lg border border-slate-800 break-words">
              {saveError}
            </p>
            <div className="pt-2">
              <button
                onClick={async () => {
                  await deleteWorldCareer().catch(console.error);
                  clearSavedPlayer();
                  setSaveError(null);
                  setPlayer(null);
                  setWorldSession(null);
                  setActiveWorldHandoff(null);
                  setShowIntroStory(false);
                  setShowNewCareerModal(true);
                }}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition font-mono cursor-pointer"
              >
                Clear Broken Save & Start New Career
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
