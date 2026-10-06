import React, { useState, useEffect, useMemo } from 'react';
import { Club, FormationType, MatchDecisionMoment, MatchLiveEvent, MatchSimulationResult, Player } from '../types/game';
import { generateKeyMatchMoments, resolveMomentChoice, simulateMatch } from '../utils/matchEngine';
import { ThreePitchView } from './ThreePitchView';
import { TacticalHeatMap } from './TacticalHeatMap';
import { PreMatchTacticalBriefing } from './PreMatchTacticalBriefing';
import { TacticalInstructions, TacticalFocusType, TACTICAL_FOCUS_OPTIONS } from './TacticalInstructions';
import { MatchHighlightsFeed } from './MatchHighlightsFeed';
import { sounds } from '../utils/soundFx';
import { 
  getLeagueRuleSet, 
  LeagueRuleSet, 
  validateSubstitution, 
  getLeagueDisciplinaryStatus,
  calculateCardSuspension
} from '../utils/LeagueRuleSet';
import { 
  getCompetitionRules, 
  CompetitionRules, 
  validateCompetitionSubstitution,
  validateMatchup,
  validateFixtureMatchup,
  mapCompetitionRoster,
  getDerbyMatchDetails,
  getManagerMandatedFormation
} from '../utils/LeagueEngine';
import { getClubRoster, SquadPlayer } from '../data/clubRosters';
import { 
  Award, Clock, Flame, Play, ShieldAlert, Sparkles, TrendingUp, Zap, 
  Users, ArrowRightLeft, Shield, Eye, CheckCircle2, AlertCircle, RefreshCw,
  Gauge, Activity, MapPin, Layers, AlertTriangle, FastForward, Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MatchViewProps {
  player: Player;
  homeClub: Club;
  awayClub: Club;
  competitionName?: string;
  onMatchComplete: (result: MatchSimulationResult) => void;
  onSkipMatch?: () => void;
}

export const MatchView: React.FC<MatchViewProps> = ({
  player,
  homeClub,
  awayClub,
  competitionName,
  onMatchComplete,
}) => {
  const isPlayerHome = player.currentClubId === homeClub.id;
  const playerClub = isPlayerHome ? homeClub : awayClub;
  const opponentClub = isPlayerHome ? awayClub : homeClub;

  // Real-World League Rules and Disciplinary Accumulation Set
  const leagueRuleSet: LeagueRuleSet = useMemo(() => {
    return getLeagueRuleSet(playerClub.league);
  }, [playerClub.league]);

  // Competition Rules (e.g. UEFA Champions League vs Premier League vs NPFL)
  const competitionRules: CompetitionRules = useMemo(() => {
    return getCompetitionRules(competitionName || playerClub.league, playerClub.league);
  }, [competitionName, playerClub.league]);

  // LeagueEngine Matchup Validation (strictly validates legal league/tournament rivals)
  const matchupValidation = useMemo(() => {
    return validateFixtureMatchup(homeClub, awayClub, competitionRules.competitionName);
  }, [homeClub, awayClub, competitionRules.competitionName]);

  // Squad Rosters Mapped to Tournament Squad Limits (e.g. 20-man / 9 bench for EPL vs 23-man / 12 bench for UCL)
  const rawHomeRoster = useMemo(() => getClubRoster(homeClub.id, homeClub.name, homeClub.reputation), [homeClub]);
  const rawAwayRoster = useMemo(() => getClubRoster(awayClub.id, awayClub.name, awayClub.reputation), [awayClub]);

  const homeRoster = useMemo(() => mapCompetitionRoster(rawHomeRoster, competitionRules), [rawHomeRoster, competitionRules]);
  const awayRoster = useMemo(() => mapCompetitionRoster(rawAwayRoster, competitionRules), [rawAwayRoster, competitionRules]);

  // Player's Match & Disciplinary Role
  const isInjured = (player.injuryWeeks || 0) > 0;
  const isSuspended = (player.suspensionWeeks || 0) > 0;
  const isStarting = !isInjured && !isSuspended && player.managerTrust >= 40 && player.energy >= 40;
  const [playerSubbedIn, setPlayerSubbedIn] = useState<boolean>(isStarting);
  const [playerSubbedMinute, setPlayerSubbedMinute] = useState<number>(isStarting ? 1 : 0);
  const [playerSubbedOff, setPlayerSubbedOff] = useState<boolean>(false);
  const [subbedOffMinute, setSubbedOffMinute] = useState<number | null>(null);
  
  // In-Match Cards Disciplinary Tracking
  const [playerYellowCardsMatch, setPlayerYellowCardsMatch] = useState<number>(0);
  const [playerRedCardsMatch, setPlayerRedCardsMatch] = useState<number>(0);

  const currentTotalYellows = (player.seasonStats?.yellowCards || 0) + playerYellowCardsMatch;
  const disciplinaryStatus = useMemo(() => {
    return getLeagueDisciplinaryStatus(leagueRuleSet, currentTotalYellows, player.currentWeek);
  }, [leagueRuleSet, currentTotalYellows, player.currentWeek]);
  const [tacticalSubPrompt, setTacticalSubPrompt] = useState<{
    minute: number;
    replacement: SquadPlayer;
  } | null>(null);

  // Derby & Rivalry Detection
  const derbyInfo = useMemo(() => getDerbyMatchDetails(homeClub, awayClub), [homeClub, awayClub]);

  // Coach-Mandated Formation & Tactical Focus Instructions
  const managerFormation = useMemo(() => getManagerMandatedFormation(playerClub), [playerClub]);
  const [selectedFocus, setSelectedFocus] = useState<TacticalFocusType>('HIGH_PRESS');
  const activeFocusConfig = useMemo(() => {
    return TACTICAL_FOCUS_OPTIONS.find(f => f.id === selectedFocus) || TACTICAL_FOCUS_OPTIONS[0];
  }, [selectedFocus]);

  // Pitch Display Mode (3D Pitch vs Tactical Heat Map vs Match Highlights vs Split Radar)
  const [pitchDisplayMode, setPitchDisplayMode] = useState<'3d_pitch' | 'tactical_heatmap' | 'highlights' | 'split'>('3d_pitch');

  // Match Simulation State
  const [matchPhase, setMatchPhase] = useState<'PRE_MATCH' | 'LIVE_SIM' | 'DECISION_PAUSED' | 'POST_MATCH'>('PRE_MATCH');
  const [activePreMatchTab, setActivePreMatchTab] = useState<'briefing' | 'lineups' | 'rules'>('briefing');
  const [currentMinute, setCurrentMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<MatchLiveEvent[]>([]);

  // Substitution tracking
  const [homeSubsUsed, setHomeSubsUsed] = useState(0);
  const [awaySubsUsed, setAwaySubsUsed] = useState(0);
  const [homeSubWindowsUsed, setHomeSubWindowsUsed] = useState(0);
  const [awaySubWindowsUsed, setAwaySubWindowsUsed] = useState(0);
  
  // Tactical Strength (Attack & Defense Ratings Modified by Coach's Formation & Tactical Focus!)
  const formationBonus = useMemo(() => {
    switch (managerFormation) {
      case '4-3-3 Attacking': return { att: 8, def: -3 };
      case '4-2-3-1 Balanced': return { att: 4, def: 4 };
      case '3-5-2 Wing-backs': return { att: 7, def: 2 };
      case '4-4-2 Diamond': return { att: 5, def: 5 };
      case '5-3-2 Park The Bus': return { att: -6, def: 12 };
      default: return { att: 0, def: 0 };
    }
  }, [managerFormation]);

  const playerTeamAttBoost = formationBonus.att + activeFocusConfig.attDelta;
  const playerTeamDefBoost = formationBonus.def + activeFocusConfig.defDelta;

  const baseHomeAtt = Math.round(homeClub.reputation * 0.95 + (isPlayerHome && isStarting ? 3 : 0));
  const baseAwayAtt = Math.round(awayClub.reputation * 0.95 + (!isPlayerHome && isStarting ? 3 : 0));
  const baseHomeDef = Math.round(homeClub.reputation * 0.92);
  const baseAwayDef = Math.round(awayClub.reputation * 0.92);

  const homeAttack = isPlayerHome ? baseHomeAtt + playerTeamAttBoost : baseHomeAtt;
  const awayAttack = !isPlayerHome ? baseAwayAtt + playerTeamAttBoost : baseAwayAtt;
  const homeDefense = isPlayerHome ? baseHomeDef + playerTeamDefBoost : baseHomeDef;
  const awayDefense = !isPlayerHome ? baseAwayDef + playerTeamDefBoost : baseAwayDef;

  // Dynamic Match Fatigue System (Modulated by Tactical Focus Stamina Multiplier)
  const staminaBase = player.attributes.stamina || 70;
  const activeMinutes = useMemo(() => {
    if (!playerSubbedIn) return 0;
    if (playerSubbedOff && subbedOffMinute) {
      return Math.max(0, subbedOffMinute - (isStarting ? 1 : playerSubbedMinute));
    }
    return Math.max(0, currentMinute - (isStarting ? 1 : playerSubbedMinute));
  }, [playerSubbedIn, playerSubbedOff, subbedOffMinute, isStarting, playerSubbedMinute, currentMinute]);

  const fatiguePercent = useMemo(() => {
    if (!playerSubbedIn || currentMinute <= 1) return 0;
    const initialExhaustion = Math.max(0, (100 - player.energy) * 0.28);
    const staminaEfficiency = (125 - staminaBase) / 100;
    const minuteRatio = Math.min(1, activeMinutes / 90);
    const calculated = Math.round((minuteRatio * 84 * staminaEfficiency * activeFocusConfig.staminaMultiplier) + initialExhaustion);
    return Math.min(96, Math.max(0, calculated));
  }, [playerSubbedIn, currentMinute, activeMinutes, staminaBase, player.energy, activeFocusConfig.staminaMultiplier]);

  // Attribute penalties (Speed / Pace, Agility, Composure)
  const speedPenalty = Math.round((fatiguePercent / 100) * 18);
  const agilityPenalty = Math.round((fatiguePercent / 100) * 15);
  const composurePenalty = Math.round((fatiguePercent / 100) * 14);

  const effectivePace = Math.max(25, (player.attributes.pace || 70) - speedPenalty);
  const effectiveAgility = Math.max(25, (player.attributes.agility || 70) - agilityPenalty);
  const effectiveComposure = Math.max(25, (player.attributes.composure || 70) - composurePenalty);

  // Moments
  const [moments, setMoments] = useState<MatchDecisionMoment[]>([]);
  const [currentMomentIndex, setCurrentMomentIndex] = useState(0);
  const [resolvedMoments, setResolvedMoments] = useState<{ momentId: string; success: boolean; scoreDelta: string }[]>([]);
  const [activeMomentOutcome, setActiveMomentOutcome] = useState<{ text: string; success: boolean } | null>(null);

  // Live player stats in this match
  const [playerGoals, setPlayerGoals] = useState(0);
  const [playerAssists, setPlayerAssists] = useState(0);

  // Final Result
  const [finalResult, setFinalResult] = useState<MatchSimulationResult | null>(null);

  // Initialize moments on mount if player is active
  useEffect(() => {
    if (!isInjured) {
      const generated = generateKeyMatchMoments(player, opponentClub);
      setMoments(generated);
    } else {
      setMoments([]);
    }
  }, [player, opponentClub, isInjured]);

  const startMatch = () => {
    sounds.playWhistle();
    setMatchPhase('LIVE_SIM');
    setCurrentMinute(1);
    setEvents([
      { 
        minute: 1, 
        text: `Kick-off at ${homeClub.stadiumName}! ${homeClub.name} vs ${awayClub.name} (${competitionRules.competitionName}). Official Ball: ${competitionRules.matchBall}. Rules: Max ${competitionRules.maxSubs90Min} substitutions in ${competitionRules.maxSubWindows} windows${competitionRules.extraTimeSubAllowed ? ' (+1 extra in ET)' : ''}. Attendance: ${Math.round(homeClub.reputation * 620).toLocaleString()}.`, 
        type: 'commentary' 
      }
    ]);
  };

  // Clock progression loop
  useEffect(() => {
    if (matchPhase !== 'LIVE_SIM') return;

    const timer = setInterval(() => {
      setCurrentMinute(prev => {
        const nextMin = prev + 3;

        // Check if an interactive decision moment is scheduled at this minute
        if (playerSubbedIn && !isInjured) {
          const nextMoment = moments[currentMomentIndex];
          if (nextMoment && nextMin >= nextMoment.minute && nextMin <= nextMoment.minute + 4) {
            clearInterval(timer);
            setMatchPhase('DECISION_PAUSED');
            return nextMoment.minute;
          }
        }

        // Tactical Sub: If player is on bench and not injured, manager brings them on around minute 60
        // Enforced against real-world Competition substitution limits & stoppage windows (e.g. UCL vs Premier League)
        const homeCanSub = validateCompetitionSubstitution(competitionRules, homeSubsUsed, homeSubWindowsUsed, nextMin > 90, nextMin === 45);
        const awayCanSub = validateCompetitionSubstitution(competitionRules, awaySubsUsed, awaySubWindowsUsed, nextMin > 90, nextMin === 45);

        if (!playerSubbedIn && !isInjured && nextMin >= 60) {
          const canPlayerSub = isPlayerHome ? homeCanSub.canSubstitute : awayCanSub.canSubstitute;
          if (canPlayerSub) {
            setPlayerSubbedIn(true);
            setPlayerSubbedMinute(nextMin);
            if (isPlayerHome) {
              setHomeSubsUsed(s => s + 1);
              setHomeSubWindowsUsed(w => w + 1);
            } else {
              setAwaySubsUsed(s => s + 1);
              setAwaySubWindowsUsed(w => w + 1);
            }
            sounds.playFanfare();
            setEvents(evts => [
              {
                minute: nextMin,
                text: `🔄 Tactical Substitution: Manager ${playerClub.managerName} brings ON #${player.jerseyNumber} ${player.firstName} ${player.lastName} (${player.position}) to inject energy! (${competitionRules.maxSubs90Min - (isPlayerHome ? homeSubsUsed + 1 : awaySubsUsed + 1)} subs remaining under ${competitionRules.shortName} regulations)`,
                type: 'commentary',
                isPlayerInvolved: true,
              },
              ...evts,
            ]);
          }
        }

        // Dynamic Match Fatigue Substitution Decision:
        // If player started, is on the pitch, has not been subbed off, and fatigue reaches critical threshold (>65%)
        if (
          isStarting &&
          playerSubbedIn &&
          !playerSubbedOff &&
          !tacticalSubPrompt &&
          nextMin >= 68 &&
          nextMin <= 78 &&
          fatiguePercent >= 65
        ) {
          const canClubSub = isPlayerHome ? homeCanSub.canSubstitute : awayCanSub.canSubstitute;
          if (canClubSub) {
            clearInterval(timer);
            const benchOptions = (isPlayerHome ? homeRoster : awayRoster).bench;
            const replacement = benchOptions.find(b => b.position === player.position) || benchOptions[0];
            setTacticalSubPrompt({
              minute: nextMin,
              replacement,
            });
            setMatchPhase('DECISION_PAUSED');
            return nextMin;
          }
        }

        // Granular event simulation based on tactical strength
        // Rate-limited to prevent illogical high-scoring (typical football matches have 1-4 goals total)
        const totalGoalsSoFar = homeScore + awayScore;
        const goalProbability = totalGoalsSoFar >= 3 ? 0.04 : totalGoalsSoFar >= 2 ? 0.09 : 0.16;

        if (Math.random() < 0.32 && nextMin < 88) {
          const homeAdvantage = isPlayerHome ? 1.1 : 0.95;
          const homeStrength = (homeAttack - awayDefense) + 5;
          const homeAttackingWeight = Math.max(0.2, Math.min(0.8, 0.5 + (homeStrength * 0.02 * homeAdvantage)));
          const isHomeEvent = Math.random() < homeAttackingWeight;
          const attackingClub = isHomeEvent ? homeClub : awayClub;
          const attackingRoster = isHomeEvent ? homeRoster : awayRoster;
          
          if (Math.random() < goalProbability) {
            // Background goal
            if (isHomeEvent) {
              setHomeScore(s => s + 1);
            } else {
              setAwayScore(s => s + 1);
            }
            sounds.playGoalRoar();
            const scorers = attackingRoster.startingXI.filter(p => ['ST', 'LW', 'RW', 'CAM', 'CM'].includes(p.position));
            const scorer = scorers[Math.floor(Math.random() * scorers.length)] || attackingRoster.startingXI[9];
            setEvents(evts => [
              { 
                minute: nextMin, 
                text: `⚽ GOAL! ${scorer.name} strikes for ${attackingClub.name}! Clinical finish into the corner.`, 
                type: 'goal' 
              },
              ...evts,
            ]);
          } else {
            // Chance / save / tactical incident
            setEvents(evts => [
              { 
                minute: nextMin, 
                text: `${attackingClub.shortName} builds dangerous pressure through the channels, but the backline scrambles it away!`, 
                type: 'chance' 
              },
              ...evts,
            ]);
          }
        }

        // Halftime whistle
        if (prev < 45 && nextMin >= 45) {
          setEvents(evts => [
            { minute: 45, text: `⏱️ Half-Time: ${homeClub.shortName} ${homeScore} - ${awayScore} ${awayClub.shortName}. Tactical adjustments in progress under ${leagueRuleSet.shortName} regulations.`, type: 'commentary' },
            ...evts
          ]);
        }

        if (nextMin >= 90) {
          clearInterval(timer);
          finishMatch(homeScore, awayScore);
          return 90;
        }

        return nextMin;
      });
    }, 380);

    return () => clearInterval(timer);
  }, [
    matchPhase, currentMomentIndex, moments, homeClub, awayClub, homeScore, awayScore, 
    playerSubbedIn, playerSubbedOff, tacticalSubPrompt, isInjured, homeSubsUsed, awaySubsUsed, 
    homeSubWindowsUsed, awaySubWindowsUsed, leagueRuleSet, isPlayerHome, homeAttack, awayAttack, 
    homeDefense, awayDefense, homeRoster, awayRoster, playerClub, player, fatiguePercent, isStarting
  ]);

  const handleDecision = (
    requiredAttrs: (keyof typeof player.attributes)[],
    riskTier: string,
    actionType: string
  ) => {
    sounds.playClick();
    // Resolve moment taking into account match fatigue degradation on speed, agility, and composure
    const outcome = resolveMomentChoice(player, requiredAttrs, riskTier, actionType, {
      pace: -speedPenalty,
      agility: -agilityPenalty,
      composure: -composurePenalty,
    });

    if (outcome.success) {
      if (outcome.scoreDelta === 'goal') {
        sounds.playGoalRoar();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
        setPlayerGoals(g => g + 1);
        if (isPlayerHome) setHomeScore(s => s + 1);
        else setAwayScore(s => s + 1);
      } else if (outcome.scoreDelta === 'assist') {
        sounds.playGoalRoar();
        setPlayerAssists(a => a + 1);
        if (isPlayerHome) setHomeScore(s => s + 1);
        else setAwayScore(s => s + 1);
      }
    }

    // Disciplinary Card Logic: High-risk defensive challenges or failed tackles can incur bookings
    let bookingCommentary = '';
    if (!outcome.success && (actionType === 'tackle' || riskTier === 'High Risk High Reward') && Math.random() < 0.32) {
      if (playerYellowCardsMatch === 0) {
        setPlayerYellowCardsMatch(1);
        sounds.playWhistle();
        const willTriggerSuspension = (currentTotalYellows + 1) >= leagueRuleSet.yellowCardSuspensionThreshold;
        bookingCommentary = willTriggerSuspension
          ? ` 🟨 BOOKING: Referee shows a yellow card for a cynical foul! ${player.firstName} ${player.lastName} reaches ${leagueRuleSet.yellowCardSuspensionThreshold} yellow cards in ${leagueRuleSet.shortName} (Automatic 1-match suspension triggered!).`
          : ` 🟨 BOOKING: Referee shows a yellow card! Season total: ${currentTotalYellows + 1}/${leagueRuleSet.yellowCardSuspensionThreshold} yellow cards.`;
      } else if (playerYellowCardsMatch === 1) {
        setPlayerYellowCardsMatch(2);
        setPlayerRedCardsMatch(1);
        setPlayerSubbedOff(true);
        setSubbedOffMinute(moments[currentMomentIndex]?.minute || 75);
        sounds.playWhistle();
        bookingCommentary = ` 🟥 RED CARD! Second yellow card shown to ${player.firstName} ${player.lastName}! Dismissed under ${leagueRuleSet.suspensionPolicyName}! Down to 10 men!`;
      }
    }

    const currentMoment = moments[currentMomentIndex];
    setResolvedMoments(prev => [
      ...prev,
      { momentId: currentMoment.id, success: outcome.success, scoreDelta: outcome.scoreDelta }
    ]);

    setActiveMomentOutcome({
      text: outcome.commentary + bookingCommentary,
      success: outcome.success,
    });

    setEvents(evts => [
      {
        minute: currentMoment.minute,
        text: outcome.commentary + bookingCommentary,
        type: outcome.scoreDelta === 'goal' ? 'goal' : outcome.scoreDelta === 'assist' ? 'assist' : bookingCommentary ? 'card' : 'moment',
        isPlayerInvolved: true,
      },
      ...evts,
    ]);
  };

  const resumeSimAfterMoment = () => {
    setActiveMomentOutcome(null);
    setCurrentMomentIndex(idx => idx + 1);
    setMatchPhase('LIVE_SIM');
  };

  const handleAcceptFatigueSubstitution = () => {
    if (!tacticalSubPrompt) return;
    sounds.playFanfare();
    const subMin = tacticalSubPrompt.minute;
    const replacement = tacticalSubPrompt.replacement;

    setPlayerSubbedOff(true);
    setSubbedOffMinute(subMin);
    if (isPlayerHome) {
      setHomeSubsUsed(s => s + 1);
      setHomeSubWindowsUsed(w => w + 1);
    } else {
      setAwaySubsUsed(s => s + 1);
      setAwaySubWindowsUsed(w => w + 1);
    }

    setEvents(evts => [
      {
        minute: subMin,
        text: `🔄 Tactical Substitution: #${player.jerseyNumber} ${player.firstName} ${player.lastName} comes OFF to a standing ovation after an exhausting shift (Fatigue: ${fatiguePercent}%). #${replacement.number} ${replacement.name} (${replacement.position}) enters the pitch!`,
        type: 'commentary',
        isPlayerInvolved: true,
      },
      ...evts,
    ]);

    setTacticalSubPrompt(null);
    setMatchPhase('LIVE_SIM');
  };

  const handlePushThroughFatigue = () => {
    if (!tacticalSubPrompt) return;
    sounds.playClick();
    const subMin = tacticalSubPrompt.minute;

    setEvents(evts => [
      {
        minute: subMin,
        text: `💪 Refusing to Yield! ${player.firstName} ${player.lastName} waves off the substitution board, signaling to Manager ${playerClub.managerName} that they will fight through heavy legs until the final whistle!`,
        type: 'commentary',
        isPlayerInvolved: true,
      },
      ...evts,
    ]);

    setTacticalSubPrompt(null);
    setMatchPhase('LIVE_SIM');
  };

  // Instant Fast-Forward: Simulates remaining minutes using the exact weighted probability model and logs all events
  const handleFastForwardToFullTime = () => {
    sounds.playClick();
    let simHomeScore = homeScore;
    let simAwayScore = awayScore;
    const additionalEvents: MatchLiveEvent[] = [];
    
    // Simulate remaining minutes in step chunks
    for (let min = Math.max(currentMinute + 3, 15); min <= 90; min += 8) {
      const totalGoalsSoFar = simHomeScore + simAwayScore;
      const goalProbability = totalGoalsSoFar >= 3 ? 0.04 : totalGoalsSoFar >= 2 ? 0.09 : 0.16;
      
      if (Math.random() < 0.35) {
        const homeAdvantage = isPlayerHome ? 1.1 : 0.95;
        const homeStrength = (homeAttack - awayDefense) + 5;
        const homeAttackingWeight = Math.max(0.2, Math.min(0.8, 0.5 + (homeStrength * 0.02 * homeAdvantage)));
        const isHomeEvent = Math.random() < homeAttackingWeight;
        const attackingClub = isHomeEvent ? homeClub : awayClub;
        const attackingRoster = isHomeEvent ? homeRoster : awayRoster;
        
        if (Math.random() < goalProbability) {
          if (isHomeEvent) simHomeScore++;
          else simAwayScore++;
          const scorers = attackingRoster.startingXI.filter(p => ['ST', 'LW', 'RW', 'CAM', 'CM'].includes(p.position));
          const scorer = scorers[Math.floor(Math.random() * scorers.length)] || attackingRoster.startingXI[9];
          additionalEvents.push({
            minute: min,
            text: `⚽ GOAL! ${scorer.name} finishes clinically for ${attackingClub.name}!`,
            type: 'goal'
          });
        }
      }
    }
    
    // Halftime if not already passed
    if (currentMinute < 45) {
      additionalEvents.push({
        minute: 45,
        text: `⏱️ Half-Time: ${homeClub.shortName} ${simHomeScore} - ${simAwayScore} ${awayClub.shortName}. Tactical debrief under ${leagueRuleSet.shortName} regulations.`,
        type: 'commentary'
      });
    }

    const allEvents = [...additionalEvents.reverse(), ...events];
    setEvents(allEvents);
    setHomeScore(simHomeScore);
    setAwayScore(simAwayScore);
    setCurrentMinute(90);
    finishMatch(simHomeScore, simAwayScore);
  };

  // Complete Match: UNIFIED SINGLE-SOURCE-OF-TRUTH SCORE!
  const finishMatch = (exactHScore = homeScore, exactAScore = awayScore) => {
    sounds.playWhistle();

    const minutesPlayed = isInjured || isSuspended
      ? 0 
      : playerSubbedOff && subbedOffMinute
      ? Math.max(10, subbedOffMinute - (isStarting ? 1 : playerSubbedMinute))
      : isStarting 
      ? 90 
      : playerSubbedIn 
      ? Math.max(1, 90 - playerSubbedMinute) 
      : 0;

    const simResult = simulateMatch(
      homeClub,
      awayClub,
      player,
      resolvedMoments,
      {
        homeGoals: exactHScore,
        awayGoals: exactAScore,
        events,
        playerGoals,
        playerAssists,
        playerMinutes: minutesPlayed,
        playerStarted: isStarting,
      }
    );

    // Apply Real-World Card Accumulation & Disciplinary Consequences
    const totalSeasonYellows = (player.seasonStats?.yellowCards || 0) + playerYellowCardsMatch;
    const isSuspendedNext = (playerRedCardsMatch > 0) || 
      (totalSeasonYellows >= leagueRuleSet.yellowCardSuspensionThreshold && (player.seasonStats?.yellowCards || 0) < leagueRuleSet.yellowCardSuspensionThreshold);

    const suspensionReason = playerRedCardsMatch > 0
      ? `Red Card dismissal under ${leagueRuleSet.suspensionPolicyName}`
      : `${leagueRuleSet.yellowCardSuspensionThreshold} Yellow Cards accumulated in ${leagueRuleSet.shortName}`;

    simResult.playerYellowCards = playerYellowCardsMatch;
    simResult.playerRedCards = playerRedCardsMatch;
    simResult.isSuspendedNextMatch = isSuspendedNext;
    simResult.suspensionReason = isSuspendedNext ? suspensionReason : undefined;

    setFinalResult(simResult);
    setMatchPhase('POST_MATCH');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* PHASE 1: PRE-MATCH TEAM TALK & LINEUP STATUS */}
      {matchPhase === 'PRE_MATCH' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden">
          {/* League Rules & Competition Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span 
                className="font-bold text-white uppercase tracking-wider font-mono px-2 py-0.5 rounded text-[11px]"
                style={{ backgroundColor: competitionRules.badgeColor || '#047857' }}
              >
                {competitionRules.shortName}
              </span>
              <span className="font-bold text-white uppercase tracking-wider font-mono">
                {competitionRules.competitionName}
              </span>
              <span className="text-slate-500">·</span>
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Fixture Validated</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono flex-wrap">
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-emerald-300 font-bold">
                Subs: Max {competitionRules.maxSubs90Min} ({competitionRules.maxSubWindows} Windows{competitionRules.extraTimeSubAllowed ? ' +1 in ET' : ''})
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Bench: {competitionRules.benchSize} Players
              </span>
              <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                VAR: {competitionRules.varEnabled ? 'Active' : 'No VAR'}
              </span>
              <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                disciplinaryStatus.severity === 'danger' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                disciplinaryStatus.severity === 'warning' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                Cards: {player.seasonStats?.yellowCards || 0}/{leagueRuleSet.yellowCardSuspensionThreshold} 🟨
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              {homeClub.name} <span className="text-slate-500 font-normal text-2xl">vs</span> {awayClub.name}
            </h1>
            <p className="text-xs text-slate-400">
              {homeClub.stadiumName} · Match Ball: <strong className="text-slate-200">{leagueRuleSet.matchBall}</strong>
            </p>
          </div>

          {/* Club Badges & Head-to-Head */}
          <div className="grid grid-cols-3 items-center gap-4 py-6 border-y border-slate-800">
            <div className="text-center space-y-2">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-black text-white shadow-lg"
                style={{ backgroundColor: homeClub.primaryColor }}
              >
                {homeClub.shortName}
              </div>
              <div className="font-bold text-white text-sm">{homeClub.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                Att {homeAttack} · Def {homeDefense}
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="text-2xl font-black text-slate-500">VS</div>
              <div className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 py-1 px-3 rounded-full inline-block border border-emerald-800/40">
                Ready to Kick-off
              </div>
            </div>

            <div className="text-center space-y-2">
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-xl font-black text-white shadow-lg"
                style={{ backgroundColor: awayClub.primaryColor }}
              >
                {awayClub.shortName}
              </div>
              <div className="font-bold text-white text-sm">{awayClub.name}</div>
              <div className="text-xs text-slate-400 font-mono">
                Att {awayAttack} · Def {awayDefense}
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActivePreMatchTab('briefing')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activePreMatchTab === 'briefing'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tactical Briefing & Formation ({selectedFormation.split(' ')[0]})</span>
            </button>
            <button
              onClick={() => setActivePreMatchTab('lineups')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activePreMatchTab === 'lineups'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Official Team Lineups ({leagueRuleSet.maxSubs} Subs)</span>
            </button>
            <button
              onClick={() => setActivePreMatchTab('rules')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activePreMatchTab === 'rules'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>League Rules & Cards</span>
            </button>
          </div>

          {/* TAB 1: PRE-MATCH TACTICAL BRIEFING */}
          {activePreMatchTab === 'briefing' && (
            <PreMatchTacticalBriefing
              player={player}
              club={playerClub}
              opponentClub={opponentClub}
              selectedFormation={selectedFormation}
              onSelectFormation={setSelectedFormation}
              tacticalMentality={tacticalMentality}
              onSelectMentality={setTacticalMentality}
              tacticalPressing={tacticalPressing}
              onSelectPressing={setTacticalPressing}
              onConfirmKickoff={startMatch}
              baseHomeAttack={baseHomeAtt}
              baseHomeDefense={baseHomeDef}
              isStarting={isStarting}
              isInjured={isInjured}
              isSuspended={isSuspended}
            />
          )}

          {/* TAB 2: OFFICIAL LINEUPS */}
          {activePreMatchTab === 'lineups' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800 text-xs">
              {/* Home Team Lineup */}
              <div className="space-y-3">
                <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: homeClub.primaryColor }} />
                    {homeClub.name} (XI)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Manager: {homeClub.managerName}</span>
                </div>
                <div className="space-y-1 font-mono">
                  {homeRoster.startingXI.map((s, idx) => {
                    const isPlayerSlot = isPlayerHome && isStarting && s.position === player.position;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between px-2 py-1 rounded ${
                          isPlayerSlot ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span>#{s.number} [{s.position}] {isPlayerSlot ? `${player.firstName} ${player.lastName} (YOU)` : s.name}</span>
                        <span className="text-slate-400">{isPlayerSlot ? player.overallRating : s.overall} OVR</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Bench:</span>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    {homeRoster.bench.slice(0, leagueRuleSet.benchSize).map((b, i) => (
                      <div key={i} className="flex justify-between">
                        <span>#{b.number} {isPlayerHome && !isStarting && !isInjured && i === 0 ? `${player.firstName} ${player.lastName} (YOU)` : b.name} ({b.position})</span>
                        <span>{b.overall} OVR</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Away Team Lineup */}
              <div className="space-y-3">
                <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: awayClub.primaryColor }} />
                    {awayClub.name} (XI)
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Manager: {awayClub.managerName}</span>
                </div>
                <div className="space-y-1 font-mono">
                  {awayRoster.startingXI.map((s, idx) => {
                    const isPlayerSlot = !isPlayerHome && isStarting && s.position === player.position;
                    return (
                      <div 
                        key={idx} 
                        className={`flex items-center justify-between px-2 py-1 rounded ${
                          isPlayerSlot ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <span>#{s.number} [{s.position}] {isPlayerSlot ? `${player.firstName} ${player.lastName} (YOU)` : s.name}</span>
                        <span className="text-slate-400">{isPlayerSlot ? player.overallRating : s.overall} OVR</span>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1">Bench:</span>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    {awayRoster.bench.slice(0, leagueRuleSet.benchSize).map((b, i) => (
                      <div key={i} className="flex justify-between">
                        <span>#{b.number} {!isPlayerHome && !isStarting && !isInjured && i === 0 ? `${player.firstName} ${player.lastName} (YOU)` : b.name} ({b.position})</span>
                        <span>{b.overall} OVR</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEAGUE RULES & DISCIPLINARY POLICY */}
          {activePreMatchTab === 'rules' && (
            <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-5">
              <div>
                <h3 className="font-bold text-white text-sm">Official {leagueRuleSet.leagueName} Rules & Substitution Standards</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{leagueRuleSet.suspensionPolicyName}</p>
              </div>

              {/* Substitution Standards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-slate-300 font-mono">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Max Substitutions</span>
                  <span className="text-lg font-black text-white">{leagueRuleSet.maxSubs} Players</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">In-Play Stoppages</span>
                  <span className="text-lg font-black text-white">{leagueRuleSet.maxSubWindows} Windows</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Substitutes Bench</span>
                  <span className="text-lg font-black text-white">{leagueRuleSet.benchSize} Players</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-850">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Video Match Ref</span>
                  <span className="text-lg font-black text-emerald-400">{leagueRuleSet.varEnabled ? 'VAR Active' : 'No VAR'}</span>
                </div>
              </div>

              {/* Real-World Card Accumulation & Disciplinary Standards */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold font-mono uppercase text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Card Accumulation & Suspension Protocols</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-slate-300">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">1st Yellow Card Ban</span>
                    <span className="text-base font-black text-amber-400">{leagueRuleSet.yellowCardSuspensionThreshold} Yellow Cards</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Automatic 1-match suspension</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Secondary Threshold</span>
                    <span className="text-base font-black text-amber-400">{leagueRuleSet.secondaryYellowThreshold} Yellow Cards</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">2-match domestic ban</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Straight Red Card</span>
                    <span className="text-base font-black text-rose-500">{leagueRuleSet.straightRedMatches} Matches Ban</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Violent conduct / serious foul</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                  {leagueRuleSet.suspensionSummary} Disciplinary card fines of £{leagueRuleSet.cardDisciplinaryFineGBP.toLocaleString()} are deducted per infraction.
                </p>
              </div>
            </div>
          )}

          {/* Start Kick-off Button */}
          <div className="text-center pt-2">
            <button
              onClick={startMatch}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 mx-auto active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSuspended ? 'Simulate Fixture (Suspended - Watch From Stands)' : isInjured ? 'Simulate Fixture (Watch From Stands)' : 'Step Onto the Pitch (Kick-off)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2 & 3: LIVE SIMULATION & DECISION PAUSES */}
      {(matchPhase === 'LIVE_SIM' || matchPhase === 'DECISION_PAUSED') && (
        <div className="space-y-6">
          {/* Main Scoreboard Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            {/* Top Match Bar with Competition Rules, Subs Counter & Disciplinary */}
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pb-4 mb-4 border-b border-slate-800 gap-2">
              <span className="font-bold text-emerald-400 uppercase tracking-widest font-mono">
                {competitionRules.competitionName} · Matchday
              </span>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span>Subs: <strong className="text-white">{isPlayerHome ? homeSubsUsed : awaySubsUsed} / {competitionRules.maxSubs90Min}</strong> ({competitionRules.maxSubWindows} Windows{competitionRules.extraTimeSubAllowed ? ' +1 ET' : ''})</span>
                <span>Disciplinary: <strong className="text-amber-400">🟨 {playerYellowCardsMatch}</strong> <strong className="text-rose-500">🟥 {playerRedCardsMatch}</strong> (Season: {currentTotalYellows}/{leagueRuleSet.yellowCardSuspensionThreshold})</span>
                <span>Ball: <strong className="text-slate-300">{competitionRules.matchBall.split(' ')[0]}</strong></span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-inner"
                  style={{ backgroundColor: homeClub.primaryColor }}
                >
                  {homeClub.shortName}
                </div>
                <div>
                  <div className="text-base font-bold text-white">{homeClub.name}</div>
                  <div className="text-xs text-slate-400">{isPlayerHome ? 'Your Club' : 'Home'}</div>
                </div>
              </div>

              {/* Live Match Clock & Score */}
              <div className="text-center px-6 py-2 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-mono font-bold mb-1">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{currentMinute}'</span>
                </div>
                <div className="text-3xl md:text-4xl font-mono font-black text-white tracking-widest">
                  {homeScore} : {awayScore}
                </div>
                {matchPhase === 'LIVE_SIM' && currentMinute < 88 && (
                  <button
                    onClick={handleFastForwardToFullTime}
                    className="mt-2 text-[10px] font-mono font-bold text-slate-400 hover:text-emerald-400 bg-slate-900 hover:bg-slate-850 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    title="Simulate remaining match minutes instantly"
                  >
                    <FastForward className="w-3 h-3 text-emerald-400" />
                    <span>Fast-Forward to 90'</span>
                  </button>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3 text-right">
                <div>
                  <div className="text-base font-bold text-white">{awayClub.name}</div>
                  <div className="text-xs text-slate-400">{!isPlayerHome ? 'Your Club' : 'Away'}</div>
                </div>
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-inner"
                  style={{ backgroundColor: awayClub.primaryColor }}
                >
                  {awayClub.shortName}
                </div>
              </div>
            </div>

            {/* Dynamic Match Fatigue & Physical Performance HUD */}
            {playerSubbedIn && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-300 uppercase tracking-wider font-mono text-[11px]">
                      Dynamic Match Fatigue:
                    </span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      fatiguePercent > 65
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : fatiguePercent > 35
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      {fatiguePercent}% Exhaustion {playerSubbedOff ? `(Subbed Off Min ${subbedOffMinute}')` : fatiguePercent > 65 ? '(Lactic Acid Peak)' : fatiguePercent > 35 ? '(Exertion)' : '(Fresh)'}
                    </span>
                  </div>

                  {/* Substitution Status Indicator */}
                  <div className="text-[11px] font-mono">
                    {playerSubbedOff ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ Resting on Dugout Bench ({subbedOffMinute}' Sub)
                      </span>
                    ) : fatiguePercent >= 65 ? (
                      <span className="text-rose-400 font-bold animate-pulse">
                        ⚠️ Gaffer Touchline Sub Watchlist (Stamina Danger)
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        Manager Plan: Full Match Minutes Target
                      </span>
                    )}
                  </div>
                </div>

                {/* Progressive Stamina Meter Bar */}
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      fatiguePercent > 65 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : fatiguePercent > 35 ? 'bg-gradient-to-r from-emerald-500 to-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(5, 100 - fatiguePercent))}%` }}
                  />
                </div>

                {/* Progressive Attribute Performance Degradation */}
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Pace / Speed</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{effectivePace}</span>
                      {speedPenalty > 0 && (
                        <span className="text-rose-400 text-[10px]">(-{speedPenalty})</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Agility</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{effectiveAgility}</span>
                      {agilityPenalty > 0 && (
                        <span className="text-rose-400 text-[10px]">(-{agilityPenalty})</span>
                      )}
                    </div>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-xl border border-slate-850 flex items-center justify-between">
                    <span className="text-slate-400">Composure</span>
                    <div className="flex items-center gap-1">
                      <span className="text-white font-bold">{effectiveComposure}</span>
                      {composurePenalty > 0 && (
                        <span className="text-rose-400 text-[10px]">(-{composurePenalty})</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pitch Display Mode Switcher Tabs */}
          <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase font-bold pl-2 hidden sm:inline">
                Tactical Radar:
              </span>
              <button
                onClick={() => { sounds.playClick(); setPitchDisplayMode('3d_pitch'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  pitchDisplayMode === '3d_pitch'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>3D Stadium Camera</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setPitchDisplayMode('tactical_heatmap'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  pitchDisplayMode === 'tactical_heatmap'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Tactical Heat Map</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setPitchDisplayMode('highlights'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                  pitchDisplayMode === 'highlights'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Match Highlights ({events.filter(e => e.type === 'goal' || e.type === 'card' || e.type === 'assist' || e.isPlayerInvolved).length})</span>
              </button>

              <button
                onClick={() => { sounds.playClick(); setPitchDisplayMode('split'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer hidden md:flex items-center gap-1.5 ${
                  pitchDisplayMode === 'split'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400 pr-2">
              Activity: <strong className="text-white">{events.filter(e => e.isPlayerInvolved).length} Touches</strong>
            </div>
          </div>

          {/* Dynamic Visual Pitch / Heat Map / Highlights Display */}
          {pitchDisplayMode === '3d_pitch' && (
            <ThreePitchView 
              minute={currentMinute} 
              isPaused={matchPhase === 'DECISION_PAUSED'} 
            />
          )}

          {pitchDisplayMode === 'tactical_heatmap' && (
            <TacticalHeatMap
              player={player}
              currentMinute={currentMinute}
              isSubbedIn={playerSubbedIn && !playerSubbedOff}
              fatiguePercent={fatiguePercent}
              playerEventsCount={events.filter(e => e.isPlayerInvolved).length}
            />
          )}

          {pitchDisplayMode === 'highlights' && (
            <MatchHighlightsFeed
              events={events}
              homeClub={homeClub}
              awayClub={awayClub}
              player={player}
              isLive={true}
            />
          )}

          {pitchDisplayMode === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ThreePitchView 
                minute={currentMinute} 
                isPaused={matchPhase === 'DECISION_PAUSED'} 
              />
              <TacticalHeatMap
                player={player}
                currentMinute={currentMinute}
                isSubbedIn={playerSubbedIn && !playerSubbedOff}
                fatiguePercent={fatiguePercent}
                playerEventsCount={events.filter(e => e.isPlayerInvolved).length}
              />
            </div>
          )}

          {/* TACTICAL FATIGUE SUBSTITUTION PROMPT */}
          {matchPhase === 'DECISION_PAUSED' && tacticalSubPrompt && (
            <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest">
                    Tactical Substitution Alert · Minute {tacticalSubPrompt.minute}'
                  </span>
                </div>
                <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-3 py-1 rounded-full font-medium">
                  Heavy Legs & Fatigue Creep ({fatiguePercent}%)
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-white">
                  Manager {playerClub.managerName} Signals to the Touchline!
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your physical stamina is red-lining (Speed -{speedPenalty}, Agility -{agilityPenalty}, Composure -{composurePenalty}). 
                  The gaffer has readied substitution board for <strong className="text-white">#{tacticalSubPrompt.replacement.number} {tacticalSubPrompt.replacement.name} ({tacticalSubPrompt.replacement.position})</strong> to lock down the result and prevent muscle strains.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={handleAcceptFatigueSubstitution}
                  className="p-4 bg-emerald-950/70 hover:bg-emerald-900/80 border-2 border-emerald-600 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-400 text-sm group-hover:text-emerald-300">
                      Accept Substitution (Rest on Dugout Bench)
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Come off to a warm standing ovation from the supporters. Protects remaining energy (+4 Manager Trust, 0% injury risk).
                  </p>
                </button>

                <button
                  onClick={handlePushThroughFatigue}
                  className="p-4 bg-rose-950/70 hover:bg-rose-900/80 border-2 border-rose-600 rounded-2xl text-left transition-all cursor-pointer group space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 text-sm group-hover:text-rose-300">
                      Signal to Bench: "I Can Push Through!"
                    </span>
                    <Flame className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Wave off the fourth official and fight through heavy legs until the 90th minute to hunt for a late clutch moment!
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* INTERACTIVE DECISION MOMENT POPUP */}
          {matchPhase === 'DECISION_PAUSED' && moments[currentMomentIndex] && (
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-widest">
                    Clutch Moment · Minute {moments[currentMomentIndex].minute}'
                  </span>
                </div>
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-medium">
                  {moments[currentMomentIndex].situation}
                </span>
              </div>

              <p className="text-sm md:text-base font-medium text-slate-200 leading-relaxed">
                {moments[currentMomentIndex].description}
              </p>

              {activeMomentOutcome ? (
                <div className="space-y-4 pt-2">
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    activeMomentOutcome.success 
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200' 
                      : 'bg-rose-950/80 border-rose-500 text-rose-200'
                  }`}>
                    <div className="font-bold text-sm mb-1">
                      {activeMomentOutcome.success ? '✨ Brilliant Execution!' : '❌ Opportunity Denied!'}
                    </div>
                    {activeMomentOutcome.text}
                  </div>

                  <button
                    onClick={resumeSimAfterMoment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Resume Match Simulation
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {moments[currentMomentIndex].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleDecision(opt.requiredAttributes, opt.riskTier, opt.actionType)}
                      className="p-4 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                          {opt.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          opt.riskTier === 'Safe' 
                            ? 'bg-emerald-950 text-emerald-400' 
                            : opt.riskTier === 'Moderate'
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}>
                          {opt.riskTier}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                        {opt.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {opt.requiredAttributes.map((attr, aIdx) => (
                          <span key={aIdx} className="text-[10px] bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded font-mono capitalize">
                            {attr}: {player.attributes[attr]}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Live Match Commentary Ticker */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Live Commentary Ticker</span>
              <span className="text-[11px] text-slate-500 font-normal">Real-Time Action Log</span>
            </div>
            
            <div className="space-y-2 max-h-52 overflow-y-auto pr-2 scrollbar-thin">
              {events.map((ev, i) => (
                <div 
                  key={i} 
                  className={`text-xs p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                    ev.isPlayerInvolved 
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
                      : ev.type === 'goal'
                      ? 'bg-amber-950/60 border-amber-600/40 text-amber-200 font-bold'
                      : 'bg-slate-950 border-slate-850 text-slate-300'
                  }`}
                >
                  <span className="font-mono text-emerald-400 font-bold shrink-0">{ev.minute}'</span>
                  <span>{ev.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: POST-MATCH DEBRIEFING & PERFORMANCE REPORT */}
      {matchPhase === 'POST_MATCH' && finalResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 space-y-8 shadow-2xl">
          <div className="text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold font-mono">
              {leagueRuleSet.leagueName} · Full-Time Result
            </span>
            <div className="text-4xl md:text-6xl font-black text-white font-mono tracking-tight">
              {homeClub.shortName} {finalResult.homeScore} - {finalResult.awayScore} {awayClub.shortName}
            </div>
            <p className="text-xs text-emerald-400 font-medium">
              {finalResult.matchRatingDetail}
            </p>
          </div>

          {/* Player Match Stats Card */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="text-center p-3">
              <div className="text-xs text-slate-400 mb-1">Match Rating</div>
              <div className={`text-2xl font-black font-mono ${
                finalResult.playerRating >= 8.0 ? 'text-amber-400' : finalResult.playerRating >= 6.5 ? 'text-emerald-400' : 'text-slate-300'
              }`}>
                {finalResult.playerRating} / 10
              </div>
              {finalResult.playerRating >= 8.5 && (
                <div className="text-[10px] text-amber-400 font-bold uppercase mt-1">★ Man of the Match</div>
              )}
            </div>

            <div className="text-center p-3">
              <div className="text-xs text-slate-400 mb-1">Goals Scored</div>
              <div className="text-2xl font-black font-mono text-white">
                {finalResult.playerGoals}
              </div>
            </div>

            <div className="text-center p-3">
              <div className="text-xs text-slate-400 mb-1">Assists Delivered</div>
              <div className="text-2xl font-black font-mono text-white">
                {finalResult.playerAssists}
              </div>
            </div>

            <div className="text-center p-3">
              <div className="text-xs text-slate-400 mb-1">Minutes Played</div>
              <div className="text-2xl font-black font-mono text-white">
                {finalResult.playerMinutes}'
              </div>
            </div>
          </div>

          {/* Financial & Contract Bonuses Credited */}
          <div className="bg-emerald-950/40 border border-emerald-700/50 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                £
              </div>
              <div>
                <div className="text-xs text-emerald-300 font-bold">Contract Performance Winnings Paid</div>
                <div className="text-[11px] text-slate-400">
                  Weekly wage + appearance fee + goal/assist bonuses directly credited
                </div>
              </div>
            </div>
            <div className="text-xl font-black font-mono text-emerald-400">
              +£{finalResult.winningsPaid.toLocaleString()}
            </div>
          </div>

          {/* Official Disciplinary & League Card Accumulation Debrief */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono ${
            finalResult.isSuspendedNextMatch
              ? 'bg-rose-950/70 border-rose-600/80 shadow-lg shadow-rose-950/40'
              : (finalResult.playerYellowCards || 0) > 0
              ? 'bg-amber-950/50 border-amber-600/60'
              : 'bg-slate-950 border-slate-800'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className={`w-4 h-4 ${finalResult.isSuspendedNextMatch ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`} />
                <span className="font-bold text-white uppercase">
                  {leagueRuleSet.shortName} Disciplinary Record & Card Accumulation
                </span>
                {finalResult.isSuspendedNextMatch && (
                  <span className="bg-rose-900 text-rose-200 border border-rose-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                    Suspension Incurred
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300">
                {finalResult.isSuspendedNextMatch ? (
                  <strong className="text-rose-300">
                    ⚠️ AUTOMATIC 1-MATCH DOMESTIC SUSPENSION TRIGGERED for next fixture ({finalResult.suspensionReason}). Disciplinary administrative fee of £{leagueRuleSet.cardDisciplinaryFineGBP.toLocaleString()} deducted.
                  </strong>
                ) : (
                  <span>
                    Accumulated cards: <strong className="text-white">{(player.seasonStats?.yellowCards || 0) + (finalResult.playerYellowCards || 0)} / {leagueRuleSet.yellowCardSuspensionThreshold} Yellow Cards</strong> under {leagueRuleSet.suspensionPolicyName}.
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-right">
              <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Match Cards</span>
                <span className="font-bold text-white">
                  🟨 {finalResult.playerYellowCards || 0} &nbsp; 🟥 {finalResult.playerRedCards || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Match Tactical Heat Map & Spatial Analysis */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Flame className="w-4 h-4 text-rose-500" />
                Post-Match Tactical Heat Map & Positional Activity
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Final 90-Min Physical Exertion Report
              </span>
            </div>

            <TacticalHeatMap
              player={player}
              currentMinute={90}
              isSubbedIn={playerSubbedIn}
              fatiguePercent={fatiguePercent}
              playerEventsCount={events.filter(e => e.isPlayerInvolved).length}
            />
          </div>

          {/* Post-Match Key Match Highlights Reel */}
          <MatchHighlightsFeed
            events={finalResult.events}
            homeClub={homeClub}
            awayClub={awayClub}
            player={player}
            isLive={false}
          />

          {/* Progression Indicators */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Manager Trust Impact</span>
              <span className={`font-bold flex items-center gap-1 ${
                finalResult.managerTrustDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
                {finalResult.managerTrustDelta >= 0 ? `+${finalResult.managerTrustDelta}` : finalResult.managerTrustDelta}%
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Fan Popularity Impact</span>
              <span className={`font-bold flex items-center gap-1 ${
                finalResult.fanMoraleDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {finalResult.fanMoraleDelta >= 0 ? `+${finalResult.fanMoraleDelta}` : finalResult.fanMoraleDelta}%
              </span>
            </div>
          </div>

          {/* Complete Match and Return Button */}
          <div className="text-center pt-2">
            <button
              onClick={() => onMatchComplete(finalResult)}
              className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Continue to Post-Match Debrief & Headquarters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
