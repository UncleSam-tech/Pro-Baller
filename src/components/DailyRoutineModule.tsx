import React, { useState } from 'react';
import { Player, PlayerAttributes, DietPlanId, SleepScheduleId, CommunityEngagementId } from '../types/game';
import { DIET_PLANS, SLEEP_SCHEDULES, COMMUNITY_ACTIVITIES, DEFAULT_PLAYER_ROUTINE } from '../data/dailyRoutineData';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Utensils, Moon, Users, Sparkles, Heart, Activity, BatteryCharging, 
  ShieldCheck, CheckCircle2, ChevronRight, Zap, Award, Flame, Smile
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRoutineModuleProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export const DailyRoutineModule: React.FC<DailyRoutineModuleProps> = ({ player, onUpdatePlayer }) => {
  const currency = player.preferredCurrency || 'GBP';

  const currentRoutine = player.dailyRoutine || DEFAULT_PLAYER_ROUTINE;
  const [selectedDietId, setSelectedDietId] = useState<DietPlanId>(currentRoutine.dietId);
  const [selectedSleepId, setSelectedSleepId] = useState<SleepScheduleId>(currentRoutine.sleepScheduleId);
  const [selectedCommunityId, setSelectedCommunityId] = useState<CommunityEngagementId>(currentRoutine.communityId);
  const [activeTab, setActiveTab] = useState<'diet' | 'sleep' | 'community'>('diet');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const activeDiet = DIET_PLANS.find(d => d.id === selectedDietId) || DIET_PLANS[0];
  const activeSleep = SLEEP_SCHEDULES.find(s => s.id === selectedSleepId) || SLEEP_SCHEDULES[1];
  const activeCommunity = COMMUNITY_ACTIVITIES.find(c => c.id === selectedCommunityId) || COMMUNITY_ACTIVITIES[0];

  // Calculated Weekly Net Stamina / Energy Regeneration
  const netWeeklyEnergyRegen = Math.max(
    5,
    activeSleep.energyRegenWeekly + activeDiet.staminaRegenBonus - activeCommunity.energyCost
  );

  // Apply Changes and Recalculate Player Attributes & Stamina Regen
  const handleApplyRoutine = () => {
    sounds.playFanfare();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });

    // Calculate attribute modifications based on the new routine
    const updatedAttrs: PlayerAttributes = { ...player.attributes };

    // Apply Diet attribute deltas
    if (activeDiet.attributeDeltas.stamina) {
      updatedAttrs.stamina = Math.min(99, Math.max(30, updatedAttrs.stamina + activeDiet.attributeDeltas.stamina));
    }
    if (activeDiet.attributeDeltas.strength) {
      updatedAttrs.strength = Math.min(99, Math.max(30, updatedAttrs.strength + activeDiet.attributeDeltas.strength));
    }
    if (activeDiet.attributeDeltas.pace) {
      updatedAttrs.pace = Math.min(99, Math.max(30, updatedAttrs.pace + activeDiet.attributeDeltas.pace));
    }

    // Apply Community benefits
    const updatedFanRep = Math.min(100, Math.max(0, player.fanReputation + activeCommunity.fanReputationDelta));
    const updatedChemistry = Math.min(100, Math.max(0, player.teamChemistry + activeCommunity.teamChemistryDelta));
    const updatedMorale = Math.min(100, Math.max(10, player.morale + activeCommunity.moraleBonus + activeSleep.moraleDelta));
    const updatedSharpness = Math.min(100, Math.max(20, player.matchSharpness + activeSleep.matchSharpnessDelta));

    // Update Player person discipline
    const updatedDiscipline = Math.min(100, Math.max(0, (player.person?.disciplineRating ?? 90) + activeCommunity.disciplineDelta));

    const routineSummary = `Routine Locked: ${activeDiet.name} · ${activeSleep.name} · ${activeCommunity.name}. Weekly Stamina Regen: +${netWeeklyEnergyRegen} Energy/wk.`;

    const updated = {
      ...player,
      attributes: updatedAttrs,
      fanReputation: updatedFanRep,
      teamChemistry: updatedChemistry,
      morale: updatedMorale,
      matchSharpness: updatedSharpness,
      person: {
        ...(player.person || {
          hometown: player.nationality,
          familyBackground: 'Supportive roots',
          familyRelations: 85,
          monthlyRemittanceGBP: 100,
          isCaptain: false,
          isViceCaptain: false,
          jerseyNumberRequested: player.jerseyNumber,
          disciplineRating: 90,
          nightlifeCurfewViolations: 0,
        }),
        disciplineRating: updatedDiscipline,
      },
      dailyRoutine: {
        dietId: selectedDietId,
        sleepScheduleId: selectedSleepId,
        communityId: selectedCommunityId,
        lastUpdatedWeek: player.currentWeek,
        routineLog: [
          routineSummary,
          ...(currentRoutine.routineLog || []).slice(0, 8),
        ],
      },
    };

    onUpdatePlayer(updated);
    setFeedbackNotice(`Daily routine saved! Physical attributes, stamina regeneration (+${netWeeklyEnergyRegen}/wk), and community status updated.`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. WELLNESS & PHYSICAL REGENERATION HERO BANNER */}
      {/* ==================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Activity className="w-4 h-4" />
              Athletic Longevity & Non-Football Lifestyle
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Daily Routine & Bio-Optimization
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              What you do in the 22 hours off the training pitch determines your career ceiling. 
              Manage clinical nutrition, restorative sleep architectures, and civic community engagement to govern your weekly stamina regeneration and physical attributes.
            </p>
          </div>

          <button
            onClick={handleApplyRoutine}
            className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg transition-all cursor-pointer shrink-0 self-start lg:self-center"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lock In Active Routine</span>
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Weekly Stamina Regen</span>
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              +{netWeeklyEnergyRegen}% <span className="text-xs text-slate-500 font-normal">/ week</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Sleep ({activeSleep.energyRegenWeekly}) + Diet ({activeDiet.staminaRegenBonus}) - Comm ({activeCommunity.energyCost})</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Diet Plan</span>
              <Utensils className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {activeDiet.name}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
              Cost: {formatCurrency(activeDiet.weeklyCostGBP, currency)}/wk
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Sleep Protocol</span>
              <Moon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {activeSleep.hours}h ({activeSleep.name.split(' ')[0]})
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Match Sharpness: {activeSleep.matchSharpnessDelta >= 0 ? `+${activeSleep.matchSharpnessDelta}` : activeSleep.matchSharpnessDelta}
            </span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Community Impact</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {activeCommunity.name.split(' ')[0]}
            </div>
            <span className="text-[10px] text-purple-300 mt-0.5 block">
              Fan Rep: +{activeCommunity.fanReputationDelta} · Disc: +{activeCommunity.disciplineDelta}
            </span>
          </div>
        </div>

        {/* Pillar Selection Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('diet'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'diet'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>1. Diet & Clinical Nutrition</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('sleep'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'sleep'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>2. Sleep Architecture</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('community'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'community'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Community Engagement</span>
          </button>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: DIET & CLINICAL NUTRITION */}
      {/* ==================================================== */}
      {activeTab === 'diet' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-400" />
              Select Your Metabolic Diet Protocol
            </h3>
            <span className="text-xs text-slate-400">Affects physical attributes (Stamina, Pace, Strength) and recovery</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIET_PLANS.map((diet) => {
              const isSelected = selectedDietId === diet.id;
              return (
                <div
                  key={diet.id}
                  onClick={() => { sounds.playClick(); setSelectedDietId(diet.id); }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 font-mono">
                        {formatCurrency(diet.weeklyCostGBP, currency)} / week
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white">{diet.name}</h4>
                    <p className="text-xs text-slate-400 italic">"{diet.tagline}"</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{diet.description}</p>
                  </div>

                  {/* Attribute Deltas Pill Group */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Regen: {diet.staminaRegenBonus >= 0 ? `+${diet.staminaRegenBonus}` : diet.staminaRegenBonus}% Energy
                    </span>
                    {diet.attributeDeltas.stamina && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        Stamina {diet.attributeDeltas.stamina >= 0 ? `+${diet.attributeDeltas.stamina}` : diet.attributeDeltas.stamina}
                      </span>
                    )}
                    {diet.attributeDeltas.strength && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Strength +{diet.attributeDeltas.strength}
                      </span>
                    )}
                    {diet.attributeDeltas.pace && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                        Pace {diet.attributeDeltas.pace >= 0 ? `+${diet.attributeDeltas.pace}` : diet.attributeDeltas.pace}
                      </span>
                    )}
                    {diet.attributeDeltas.injuryResistance && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        Injury Res +{diet.attributeDeltas.injuryResistance}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: SLEEP ARCHITECTURE */}
      {/* ==================================================== */}
      {activeTab === 'sleep' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Moon className="w-4 h-4 text-blue-400" />
              Configure Sleep Schedule & Recovery Architecture
            </h3>
            <span className="text-xs text-slate-400">Directly drives weekly energy regeneration & mental sharpness</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SLEEP_SCHEDULES.map((sleep) => {
              const isSelected = selectedSleepId === sleep.id;
              return (
                <div
                  key={sleep.id}
                  onClick={() => { sounds.playClick(); setSelectedSleepId(sleep.id); }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        {sleep.hours} Hours Daily Sleep
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active Protocol
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white">{sleep.name}</h4>
                    <p className="text-xs text-slate-400 italic">"{sleep.tagline}"</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{sleep.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Weekly Energy: +{sleep.energyRegenWeekly}%
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Match Sharpness: {sleep.matchSharpnessDelta >= 0 ? `+${sleep.matchSharpnessDelta}` : sleep.matchSharpnessDelta}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      Morale: {sleep.moraleDelta >= 0 ? `+${sleep.moraleDelta}` : sleep.moraleDelta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: COMMUNITY ENGAGEMENT */}
      {/* ==================================================== */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Community Engagement & Public Life
            </h3>
            <span className="text-xs text-slate-400">Builds fan reverence, locker room leadership, and civic respect</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COMMUNITY_ACTIVITIES.map((act) => {
              const isSelected = selectedCommunityId === act.id;
              return (
                <div
                  key={act.id}
                  onClick={() => { sounds.playClick(); setSelectedCommunityId(act.id); }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 text-white shadow-lg ring-1 ring-purple-500/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 font-mono">
                        {act.weeklyHours === 0 ? 'Zero Hours (Total Privacy)' : `${act.weeklyHours}h / week`}
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white">{act.name}</h4>
                    <p className="text-xs text-slate-400 italic">"{act.tagline}"</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">{act.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      Fan Rep: +{act.fanReputationDelta}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      Chemistry: +{act.teamChemistryDelta}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Discipline: +{act.disciplineDelta}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      Energy Cost: -{act.energyCost}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Routine Log History */}
      {currentRoutine.routineLog && currentRoutine.routineLog.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Biometric & Lifestyle Log</span>
          </div>
          <div className="space-y-1.5">
            {currentRoutine.routineLog.map((log, i) => (
              <div key={i} className="text-xs text-slate-400 flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
