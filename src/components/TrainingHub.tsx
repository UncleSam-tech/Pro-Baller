import React, { useState } from 'react';
import { Club, Player, PlayerAttributes } from '../types/game';
import { TacticalBoard } from './TacticalBoard';
import { sounds } from '../utils/soundFx';
import { 
  ArrowRight, Award, Compass, Dumbbell, Flame, Heart, 
  Play, ShieldAlert, Sparkles, TrendingUp, Zap 
} from 'lucide-react';

interface TrainingHubProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
  onProceedToMatch?: () => void;
  opponentClub?: Club;
  initialTab?: 'drills' | 'tactical_board';
}

interface TrainingDrill {
  id: string;
  title: string;
  category: 'Technical' | 'Physical' | 'Tactical' | 'Recovery';
  description: string;
  targetStats: (keyof PlayerAttributes)[];
  energyCost: number;
  sharpnessGain: number;
}

const DRILLS: TrainingDrill[] = [
  {
    id: 'finishing_drills',
    title: '1v1 Finishing & Precision Volleys',
    category: 'Technical',
    description: 'High-repetition shooting drills against academy keepers, focusing on bottom corners, chip shots, and composure under pressure.',
    targetStats: ['finishing', 'shotPower', 'composure'],
    energyCost: 18,
    sharpnessGain: 15,
  },
  {
    id: 'playmaking_drills',
    title: 'Rondo Triangles & Vision Switching',
    category: 'Tactical',
    description: 'Intense tight-space rondos and blind switch deliveries designed to sharpen peripheral vision and rapid line-breaking passes.',
    targetStats: ['shortPassing', 'longPassing', 'vision', 'ballControl'],
    energyCost: 15,
    sharpnessGain: 14,
  },
  {
    id: 'pace_agility_drills',
    title: 'Explosive Sprinting & Cone Agility',
    category: 'Physical',
    description: 'Parachute-resisted sprints, ladder coordination, and rapid directional cutting to maximize burst acceleration.',
    targetStats: ['pace', 'acceleration', 'agility'],
    energyCost: 22,
    sharpnessGain: 12,
  },
  {
    id: 'dribbling_flair',
    title: 'Tight-Space Slalom & Body Feints',
    category: 'Technical',
    description: 'Navigating through crowded defender dummies, honing first-touch elasticity, stepovers, and deceptive feints.',
    targetStats: ['dribbling', 'ballControl', 'flair'],
    energyCost: 16,
    sharpnessGain: 15,
  },
  {
    id: 'defensive_drills',
    title: '1v1 Containment & Slide Tackling',
    category: 'Tactical',
    description: 'Jockeying technique, reading body language, and executing clean sliding intercepts without committing fouls.',
    targetStats: ['tackling', 'positioning', 'strength'],
    energyCost: 17,
    sharpnessGain: 14,
  },
  {
    id: 'recovery_spa',
    title: 'Cryotherapy Chamber & Physio Massage',
    category: 'Recovery',
    description: 'Sub-zero cryotherapy, hydrotherapy cold baths, and sports massage to flush out lactic acid and restore peak muscle elasticity.',
    targetStats: ['stamina'],
    energyCost: -30, // Recovers energy!
    sharpnessGain: 5,
  },
];

export const TrainingHub: React.FC<TrainingHubProps> = ({ 
  player, 
  onUpdatePlayer, 
  onProceedToMatch,
  opponentClub,
  initialTab = 'drills',
}) => {
  const [activeTab, setActiveTab] = useState<'drills' | 'tactical_board'>(initialTab);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [selectedDrillId, setSelectedDrillId] = useState<string>('finishing_drills');
  const [intensity, setIntensity] = useState<'Light' | 'Balanced' | 'Hardcore'>('Balanced');
  const [lastTrainedMessage, setLastTrainedMessage] = useState<string | null>(null);

  const selectedDrill = DRILLS.find(d => d.id === selectedDrillId) || DRILLS[0];

  const handleExecuteTraining = () => {
    sounds.playClick();
    const updatedAttrs = { ...player.attributes };
    const multiplier = intensity === 'Hardcore' ? 1.6 : intensity === 'Light' ? 0.6 : 1.0;
    const energyDelta = Math.round(selectedDrill.energyCost * multiplier);

    if (selectedDrill.category === 'Recovery') {
      const newEnergy = Math.min(100, player.energy + 35);
      const newSharpness = Math.min(100, player.matchSharpness + 5);
      onUpdatePlayer({
        ...player,
        energy: newEnergy,
        matchSharpness: newSharpness,
      });
      setLastTrainedMessage('Recovery session completed. Energy restored to 100%! Ready for matchday.');
      return;
    }

    if (player.energy < energyDelta) {
      setLastTrainedMessage('Too exhausted to complete this session! You need recovery or rest.');
      return;
    }

    // Apply attribute gains (small authentic gains 0-1)
    const improvedList: string[] = [];
    selectedDrill.targetStats.forEach(stat => {
      const potentialGap = player.potentialRating - player.overallRating;
      const chance = (potentialGap / 30) * 0.45 * multiplier;
      if (Math.random() < chance && updatedAttrs[stat] < 99) {
        updatedAttrs[stat] += 1;
        improvedList.push(stat);
      }
    });

    const isAttacker = ['ST', 'LW', 'RW'].includes(player.position);
    const keyAttrs = isAttacker 
      ? [updatedAttrs.finishing, updatedAttrs.pace, updatedAttrs.dribbling, updatedAttrs.ballControl, updatedAttrs.positioning]
      : [updatedAttrs.shortPassing, updatedAttrs.vision, updatedAttrs.ballControl, updatedAttrs.stamina, updatedAttrs.dribbling];
    const newOvr = Math.round(keyAttrs.reduce((a, b) => a + b, 0) / keyAttrs.length);

    const newEnergy = Math.max(10, player.energy - energyDelta);
    const newSharpness = Math.min(100, player.matchSharpness + Math.round(selectedDrill.sharpnessGain * multiplier));

    sounds.playFanfare();

    onUpdatePlayer({
      ...player,
      attributes: updatedAttrs,
      overallRating: Math.max(player.overallRating, newOvr),
      energy: newEnergy,
      matchSharpness: newSharpness,
    });

    if (improvedList.length > 0) {
      setLastTrainedMessage(`Superb session! Attributes improved: ${improvedList.join(', ').toUpperCase()} (+1). Training complete—proceed to matchday!`);
    } else {
      setLastTrainedMessage('Session completed! Match sharpness boosted +15. Ready for matchday fixture!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('drills'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'drills'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Weekly Drills & Conditioning</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('tactical_board'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tactical_board'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Tactical Board & Heatmap Telemetry</span>
          </button>
        </div>

        {/* Proceed to Matchday CTA */}
        {onProceedToMatch && (
          <button
            onClick={() => { sounds.playWhistle(); onProceedToMatch(); }}
            className="py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Play Matchday (GW {player.currentWeek})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ==================================================== */}
      {/* TAB 1: WEEKLY DRILLS & CONDITIONING */}
      {/* ==================================================== */}
      {activeTab === 'drills' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
                Club Training Ground & Performance Lab
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Weekly Skill Development & Conditioning
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Target specific attributes to mold your playstyle. Once training is complete, step onto the pitch for your gameweek fixture.
              </p>
            </div>

            {/* Current Stamina Snapshot */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Current Energy</div>
                <div className={`text-2xl font-black font-mono ${
                  player.energy > 60 ? 'text-emerald-400' : player.energy > 35 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {player.energy}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Match Sharpness</div>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  {player.matchSharpness}%
                </div>
              </div>
            </div>
          </div>

          {/* Training Feedback Alert */}
          {lastTrainedMessage && (
            <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{lastTrainedMessage}</span>
              </div>
              {onProceedToMatch && (
                <button
                  onClick={() => { sounds.playWhistle(); onProceedToMatch(); }}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow shrink-0"
                >
                  <span>Go to Game</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Drills Catalog Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DRILLS.map(drill => (
              <div
                key={drill.id}
                onClick={() => setSelectedDrillId(drill.id)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedDrillId === drill.id
                    ? 'bg-slate-800/90 border-emerald-500 shadow-xl shadow-emerald-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      drill.category === 'Technical' 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                        : drill.category === 'Physical'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : drill.category === 'Recovery'
                        ? 'bg-blue-950 text-blue-400 border border-blue-800'
                        : 'bg-purple-950 text-purple-400 border border-purple-800'
                    }`}>
                      {drill.category}
                    </span>

                    <span className="text-xs font-mono font-bold text-slate-400">
                      {drill.energyCost > 0 ? `-${drill.energyCost}% NRG` : `+35% NRG`}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{drill.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {drill.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1 text-[10px]">
                  {drill.targetStats.map((s, idx) => (
                    <span key={idx} className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded font-mono capitalize">
                      +{s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Intensity Selector & Execute Action */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold text-slate-300 mb-2">Training Session Intensity</div>
              <div className="flex items-center gap-2">
                {(['Light', 'Balanced', 'Hardcore'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`py-1.5 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      intensity === level
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1.5">
                {intensity === 'Hardcore' ? '160% XP yield · Heavy stamina depletion' : intensity === 'Light' ? '60% XP yield · Low fatigue' : 'Standard 100% XP yield'}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExecuteTraining}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-sm rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Dumbbell className="w-4 h-4 text-emerald-400" />
                Train Only
              </button>

              {onProceedToMatch && (
                <button
                  onClick={() => {
                    handleExecuteTraining();
                    setTimeout(() => {
                      sounds.playWhistle();
                      onProceedToMatch();
                    }, 400);
                  }}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Train & Push to Gameweek {player.currentWeek} Match</span>
                </button>
              )}

              {onProceedToMatch && (
                <button
                  onClick={() => { sounds.playWhistle(); onProceedToMatch(); }}
                  className="py-3 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Direct to Match</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TACTICAL BOARD & HEATMAP TELEMETRY */}
      {/* ==================================================== */}
      {activeTab === 'tactical_board' && (
        <TacticalBoard player={player} telemetry={player.lastMatchTelemetry} />
      )}
    </div>
  );
};
