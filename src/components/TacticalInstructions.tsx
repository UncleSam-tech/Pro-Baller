import React from 'react';
import { Club, FormationType, Player, Position } from '../types/game';
import { sounds } from '../utils/soundFx';
import { 
  Shield, Flame, Zap, Play, Sparkles, CheckCircle2, 
  Users, Compass, Activity, Award, RefreshCw 
} from 'lucide-react';

export type TacticalFocusType = 'HIGH_PRESS' | 'COUNTER_ATTACK' | 'POSSESSION' | 'PARK_THE_BUS';

export interface TacticalFocusConfig {
  id: TacticalFocusType;
  label: string;
  tagline: string;
  attDelta: number;
  defDelta: number;
  staminaMultiplier: number; // e.g. 1.25 = +25% stamina drain, 0.85 = -15% stamina drain
  ratingBonus: number;
  accentColor: string;
  icon: React.ReactNode;
}

export const TACTICAL_FOCUS_OPTIONS: TacticalFocusConfig[] = [
  {
    id: 'HIGH_PRESS',
    label: 'High Press',
    tagline: 'Relentless Gegenpress',
    attDelta: 8,
    defDelta: -2,
    staminaMultiplier: 1.25,
    ratingBonus: 0.35,
    accentColor: 'from-rose-500/20 to-orange-500/10 border-rose-500/50 text-rose-300',
    icon: <Flame className="w-5 h-5 text-rose-400" />,
  },
  {
    id: 'COUNTER_ATTACK',
    label: 'Counter Attack',
    tagline: 'Direct Fast Transitions',
    attDelta: 6,
    defDelta: 3,
    staminaMultiplier: 1.05,
    ratingBonus: 0.25,
    accentColor: 'from-amber-500/20 to-yellow-500/10 border-amber-500/50 text-amber-300',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'POSSESSION',
    label: 'Tiki-Taka Control',
    tagline: 'High Pass Tempo',
    attDelta: 4,
    defDelta: 5,
    staminaMultiplier: 0.90,
    ratingBonus: 0.20,
    accentColor: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/50 text-cyan-300',
    icon: <RefreshCw className="w-5 h-5 text-cyan-400" />,
  },
  {
    id: 'PARK_THE_BUS',
    label: 'Park the Bus',
    tagline: 'Compact Low Block',
    attDelta: -6,
    defDelta: 14,
    staminaMultiplier: 0.80,
    ratingBonus: 0.15,
    accentColor: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/50 text-emerald-300',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
  },
];

interface TacticalInstructionsProps {
  player: Player;
  club: Club;
  opponentClub: Club;
  managerFormation: FormationType;
  selectedFocus: TacticalFocusType;
  onSelectFocus: (focus: TacticalFocusType) => void;
  onConfirmKickoff: () => void;
  modifiedAttack: number;
  modifiedDefense: number;
  isStarting: boolean;
  isInjured: boolean;
  isSuspended: boolean;
  isDerby?: boolean;
  derbyName?: string;
}

export const TacticalInstructions: React.FC<TacticalInstructionsProps> = ({
  player,
  club,
  opponentClub,
  managerFormation,
  selectedFocus,
  onSelectFocus,
  onConfirmKickoff,
  modifiedAttack,
  modifiedDefense,
  isStarting,
  isInjured,
  isSuspended,
  isDerby,
  derbyName,
}) => {
  // Formation Coordinates Map
  const FORMATION_POSITIONS: Record<FormationType, { position: Position; label: string; x: number; y: number }[]> = {
    '4-3-3 Attacking': [
      { position: 'GK', label: 'GK', x: 50, y: 88 },
      { position: 'RB', label: 'RB', x: 82, y: 72 },
      { position: 'CB', label: 'CB', x: 62, y: 74 },
      { position: 'CB', label: 'CB', x: 38, y: 74 },
      { position: 'LB', label: 'LB', x: 18, y: 72 },
      { position: 'CDM', label: 'CDM', x: 50, y: 55 },
      { position: 'CM', label: 'RCM', x: 70, y: 44 },
      { position: 'CM', label: 'LCM', x: 30, y: 44 },
      { position: 'RW', label: 'RW', x: 80, y: 22 },
      { position: 'ST', label: 'ST', x: 50, y: 15 },
      { position: 'LW', label: 'LW', x: 20, y: 22 },
    ],
    '4-2-3-1 Balanced': [
      { position: 'GK', label: 'GK', x: 50, y: 88 },
      { position: 'RB', label: 'RB', x: 82, y: 72 },
      { position: 'CB', label: 'CB', x: 62, y: 74 },
      { position: 'CB', label: 'CB', x: 38, y: 74 },
      { position: 'LB', label: 'LB', x: 18, y: 72 },
      { position: 'CDM', label: 'LDM', x: 36, y: 56 },
      { position: 'CDM', label: 'RDM', x: 64, y: 56 },
      { position: 'CAM', label: 'CAM', x: 50, y: 36 },
      { position: 'RW', label: 'RAM', x: 78, y: 32 },
      { position: 'LW', label: 'LAM', x: 22, y: 32 },
      { position: 'ST', label: 'ST', x: 50, y: 15 },
    ],
    '3-5-2 Wing-backs': [
      { position: 'GK', label: 'GK', x: 50, y: 88 },
      { position: 'CB', label: 'RCB', x: 72, y: 74 },
      { position: 'CB', label: 'CCB', x: 50, y: 76 },
      { position: 'CB', label: 'LCB', x: 28, y: 74 },
      { position: 'RB', label: 'RWB', x: 85, y: 48 },
      { position: 'LB', label: 'LWB', x: 15, y: 48 },
      { position: 'CDM', label: 'CDM', x: 50, y: 56 },
      { position: 'CM', label: 'RCM', x: 66, y: 42 },
      { position: 'CM', label: 'LCM', x: 34, y: 42 },
      { position: 'ST', label: 'RST', x: 62, y: 18 },
      { position: 'ST', label: 'LST', x: 38, y: 18 },
    ],
    '4-4-2 Diamond': [
      { position: 'GK', label: 'GK', x: 50, y: 88 },
      { position: 'RB', label: 'RB', x: 82, y: 72 },
      { position: 'CB', label: 'CB', x: 62, y: 74 },
      { position: 'CB', label: 'CB', x: 38, y: 74 },
      { position: 'LB', label: 'LB', x: 18, y: 72 },
      { position: 'CDM', label: 'CDM', x: 50, y: 58 },
      { position: 'CM', label: 'RCM', x: 72, y: 46 },
      { position: 'CM', label: 'LCM', x: 28, y: 46 },
      { position: 'CAM', label: 'CAM', x: 50, y: 32 },
      { position: 'ST', label: 'RST', x: 64, y: 16 },
      { position: 'ST', label: 'LST', x: 36, y: 16 },
    ],
    '5-3-2 Park The Bus': [
      { position: 'GK', label: 'GK', x: 50, y: 88 },
      { position: 'RB', label: 'RWB', x: 86, y: 66 },
      { position: 'CB', label: 'RCB', x: 68, y: 75 },
      { position: 'CB', label: 'CCB', x: 50, y: 77 },
      { position: 'CB', label: 'LCB', x: 32, y: 75 },
      { position: 'LB', label: 'LWB', x: 14, y: 66 },
      { position: 'CDM', label: 'CDM', x: 50, y: 55 },
      { position: 'CM', label: 'RCM', x: 68, y: 48 },
      { position: 'CM', label: 'LCM', x: 32, y: 48 },
      { position: 'ST', label: 'RST', x: 62, y: 22 },
      { position: 'ST', label: 'LST', x: 38, y: 22 },
    ],
  };

  const roles = FORMATION_POSITIONS[managerFormation] || FORMATION_POSITIONS['4-3-3 Attacking'];
  const activeConfig = TACTICAL_FOCUS_OPTIONS.find(f => f.id === selectedFocus) || TACTICAL_FOCUS_OPTIONS[0];

  const playerNodeIndex = roles.findIndex(r => r.position === player.position);
  const highlightedIdx = playerNodeIndex >= 0 ? playerNodeIndex : 9;

  return (
    <div className="space-y-6">
      {/* 1. Derby Banner if Rivalry Match */}
      {isDerby && (
        <div className="bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-rose-950/90 border border-amber-500/50 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-amber-400 font-mono">
                Rivalry Showdown · {derbyName}
              </div>
              <div className="text-xs text-slate-200 font-bold">
                Win Bonus: +15% Morale · +12% Manager Trust · +10% Global Reputation
              </div>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black font-mono uppercase">
            DERBY DAY
          </span>
        </div>
      )}

      {/* 2. Main Interactive Split: Coach's Formation Pitch & Tactical Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* LEFT: Coach's Mandated Formation Pitch (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          {/* Coach Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shadow"
                style={{ backgroundColor: club.primaryColor }}
              >
                👔
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Head Coach {club.managerName}
                </div>
                <div className="text-sm font-black text-white">
                  {managerFormation}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">
              Coach's XI
            </span>
          </div>

          {/* 2D Interactive Pitch */}
          <div className="relative w-full h-72 bg-gradient-to-b from-emerald-950/90 via-emerald-900/60 to-emerald-950/90 rounded-2xl border-2 border-emerald-500/30 overflow-hidden shadow-inner">
            {/* Pitch Markings */}
            <div className="absolute inset-3 border border-white/15 rounded-lg pointer-events-none" />
            <div className="absolute top-1/2 left-3 right-3 h-px bg-white/15 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/15 rounded-full pointer-events-none" />
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-10 border-b border-x border-white/15 pointer-events-none" />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-10 border-t border-x border-white/15 pointer-events-none" />

            {/* Tactical Line of Engagement Indicator */}
            <div 
              className="absolute left-3 right-3 border-t-2 border-dashed border-amber-400/50 transition-all duration-500 pointer-events-none flex justify-end pr-2"
              style={{ 
                top: selectedFocus === 'HIGH_PRESS' ? '26%' : 
                     selectedFocus === 'COUNTER_ATTACK' ? '45%' : 
                     selectedFocus === 'POSSESSION' ? '36%' : '68%' 
              }}
            >
              <span className="text-[8px] font-mono uppercase bg-slate-950/90 text-amber-300 px-1.5 py-0.5 rounded -mt-2.5">
                {activeConfig.label} Line
              </span>
            </div>

            {/* 11 Player Nodes */}
            {roles.map((r, i) => {
              const isMe = i === highlightedIdx && isStarting;
              return (
                <div
                  key={i}
                  style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500"
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black font-mono shadow-lg border-2 ${
                    isMe
                      ? 'bg-amber-400 text-slate-950 border-white scale-125 ring-4 ring-amber-400/30 z-10'
                      : 'bg-slate-900/90 text-white border-emerald-400/60'
                  }`}>
                    {isMe ? player.jerseyNumber : r.label}
                  </div>
                  {isMe && (
                    <span className="mt-0.5 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[8px] rounded uppercase font-mono shadow">
                      YOU
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Squad Status Pill */}
          <div className="flex items-center justify-between text-xs font-mono bg-slate-900/90 px-3.5 py-2.5 rounded-xl border border-slate-800">
            <span className="text-slate-400">Your Role:</span>
            <span className={`font-bold ${
              isInjured ? 'text-rose-400' : isSuspended ? 'text-amber-400' : isStarting ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {isInjured ? '🩺 Injured (Sidelines)' : isSuspended ? '🟥 Suspended' : isStarting ? `⭐ Starting XI (#${player.jerseyNumber} ${player.position})` : '🔄 Impact Sub'}
            </span>
          </div>
        </div>

        {/* RIGHT: Interactive Tactical Instructions Selector (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  Matchday Gameplan
                </span>
                <h3 className="text-lg font-black text-white">
                  Tactical Instructions
                </h3>
              </div>

              {/* Modified Team Strength Preview */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 mr-1.5">ATT</span>
                  <strong className="text-emerald-400">{modifiedAttack}</strong>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 mr-1.5">DEF</span>
                  <strong className="text-cyan-400">{modifiedDefense}</strong>
                </div>
              </div>
            </div>

            {/* 4 Interactive Focus Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TACTICAL_FOCUS_OPTIONS.map((opt) => {
                const active = selectedFocus === opt.id;
                const staminaText = opt.staminaMultiplier > 1 
                  ? `+${Math.round((opt.staminaMultiplier - 1) * 100)}% Drain` 
                  : `${Math.round((opt.staminaMultiplier - 1) * 100)}% Drain`;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      sounds.playClick();
                      onSelectFocus(opt.id);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-32 ${
                      active
                        ? `bg-gradient-to-br ${opt.accentColor} shadow-lg scale-[1.01]`
                        : 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                          {opt.icon}
                        </div>
                        <div>
                          <div className="font-black text-white text-sm leading-tight">
                            {opt.label}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {opt.tagline}
                          </div>
                        </div>
                      </div>
                      {active && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>

                    {/* Concise Stat Pills */}
                    <div className="flex items-center gap-1.5 pt-2 font-mono text-[10px]">
                      <span className={`px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 font-bold ${
                        opt.attDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {opt.attDelta >= 0 ? `+${opt.attDelta}` : opt.attDelta} ATT
                      </span>
                      <span className={`px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 font-bold ${
                        opt.defDelta >= 0 ? 'text-cyan-400' : 'text-rose-400'
                      }`}>
                        {opt.defDelta >= 0 ? `+${opt.defDelta}` : opt.defDelta} DEF
                      </span>
                      <span className={`px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 font-bold ml-auto ${
                        opt.staminaMultiplier > 1.1 ? 'text-amber-400' : 'text-emerald-300'
                      }`}>
                        ⚡ {staminaText}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact Summary & Kick-Off Action */}
          <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Rating Boost</span>
                <span className="text-amber-400 font-bold">+{activeConfig.ratingBonus.toFixed(2)} Match Rating</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Energy Bar</span>
                <span className="text-emerald-400 font-bold">{player.energy}% Ready</span>
              </div>
            </div>

            <button
              onClick={onConfirmKickoff}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-mono uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Kick Off Match</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
