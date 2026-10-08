import React from 'react';
import { Club, FormationType, Player, Position } from '../types/game';
import { sounds } from '../utils/soundFx';
import { 
  Shield, Flame, Zap, Play, Sparkles, CheckCircle2, ChevronRight, 
  ArrowRight, Users, Compass, Layers, ShieldAlert 
} from 'lucide-react';

export interface TacticalBriefingClubPresentation {
  name: string;
  shortName: string;
  managerName?: string;
}

interface PreMatchTacticalBriefingProps {
  player: Player;
  club: Club | TacticalBriefingClubPresentation;
  opponentClub: Club | TacticalBriefingClubPresentation;
  selectedFormation: FormationType;
  onSelectFormation: (formation: FormationType) => void;
  tacticalMentality: 'ATTACKING' | 'BALANCED' | 'DEFENSIVE';
  onSelectMentality: (mentality: 'ATTACKING' | 'BALANCED' | 'DEFENSIVE') => void;
  tacticalPressing: 'HIGH_PRESS' | 'MID_BLOCK' | 'LOW_BLOCK';
  onSelectPressing: (pressing: 'HIGH_PRESS' | 'MID_BLOCK' | 'LOW_BLOCK') => void;
  onConfirmKickoff: () => void;
  baseHomeAttack: number;
  baseHomeDefense: number;
  isStarting: boolean;
  isInjured: boolean;
  isSuspended: boolean;
  isTacticsLocked?: boolean;
}

export const PreMatchTacticalBriefing: React.FC<PreMatchTacticalBriefingProps> = ({
  player,
  club,
  opponentClub,
  selectedFormation,
  onSelectFormation,
  tacticalMentality,
  onSelectMentality,
  tacticalPressing,
  onSelectPressing,
  onConfirmKickoff,
  baseHomeAttack,
  baseHomeDefense,
  isStarting,
  isInjured,
  isSuspended,
  isTacticsLocked = false,
}) => {
  const FORMATION_CONFIGS: {
    name: FormationType;
    label: string;
    description: string;
    attMod: number;
    defMod: number;
    roles: { position: Position; label: string; x: number; y: number }[];
  }[] = [
    {
      name: '4-3-3 Attacking',
      label: '4-3-3 High Press & Wing Overload',
      description: 'High offensive line pinning opposition fullbacks deep with explosive wingers.',
      attMod: 8,
      defMod: -3,
      roles: [
        { position: 'GK', label: 'GK', x: 50, y: 88 },
        { position: 'RB', label: 'RB', x: 82, y: 72 },
        { position: 'CB', label: 'CB', x: 62, y: 74 },
        { position: 'CB', label: 'CB', x: 38, y: 74 },
        { position: 'LB', label: 'LB', x: 18, y: 72 },
        { position: 'CDM', label: 'CDM', x: 50, y: 55 },
        { position: 'CM', label: 'RCM', x: 70, y: 45 },
        { position: 'CM', label: 'LCM', x: 30, y: 45 },
        { position: 'RW', label: 'RW', x: 80, y: 24 },
        { position: 'ST', label: 'ST', x: 50, y: 16 },
        { position: 'LW', label: 'LW', x: 20, y: 24 },
      ],
    },
    {
      name: '4-2-3-1 Balanced',
      label: '4-2-3-1 Fluid Playmaker Anchor',
      description: 'Double pivot offers solid defensive base while number 10 orchestrates attack.',
      attMod: 4,
      defMod: 4,
      roles: [
        { position: 'GK', label: 'GK', x: 50, y: 88 },
        { position: 'RB', label: 'RB', x: 82, y: 72 },
        { position: 'CB', label: 'CB', x: 62, y: 74 },
        { position: 'CB', label: 'CB', x: 38, y: 74 },
        { position: 'LB', label: 'LB', x: 18, y: 72 },
        { position: 'CDM', label: 'RDM', x: 64, y: 56 },
        { position: 'CDM', label: 'LDM', x: 36, y: 56 },
        { position: 'RW', label: 'RAM', x: 80, y: 36 },
        { position: 'CAM', label: 'CAM', x: 50, y: 34 },
        { position: 'LW', label: 'LAM', x: 20, y: 36 },
        { position: 'ST', label: 'ST', x: 50, y: 16 },
      ],
    },
    {
      name: '3-5-2 Wing-backs',
      label: '3-5-2 Wing-Back Overloads',
      description: 'Dynamic wingbacks provide endless width to feed twin center forwards.',
      attMod: 7,
      defMod: 2,
      roles: [
        { position: 'GK', label: 'GK', x: 50, y: 88 },
        { position: 'CB', label: 'RCB', x: 72, y: 74 },
        { position: 'CB', label: 'CB', x: 50, y: 75 },
        { position: 'CB', label: 'LCB', x: 28, y: 74 },
        { position: 'RB', label: 'RWB', x: 88, y: 48 },
        { position: 'CDM', label: 'CM', x: 62, y: 52 },
        { position: 'CM', label: 'CM', x: 38, y: 52 },
        { position: 'CAM', label: 'CAM', x: 50, y: 36 },
        { position: 'LB', label: 'LWB', x: 12, y: 48 },
        { position: 'ST', label: 'RS', x: 62, y: 18 },
        { position: 'ST', label: 'LS', x: 38, y: 18 },
      ],
    },
    {
      name: '4-4-2 Diamond',
      label: '4-4-2 Narrow Midfield Diamond',
      description: 'Midfield supremacy with rapid vertical transitions between lines.',
      attMod: 5,
      defMod: 5,
      roles: [
        { position: 'GK', label: 'GK', x: 50, y: 88 },
        { position: 'RB', label: 'RB', x: 82, y: 72 },
        { position: 'CB', label: 'CB', x: 62, y: 74 },
        { position: 'CB', label: 'CB', x: 38, y: 74 },
        { position: 'LB', label: 'LB', x: 18, y: 72 },
        { position: 'CDM', label: 'CDM', x: 50, y: 60 },
        { position: 'CM', label: 'RCM', x: 70, y: 46 },
        { position: 'CM', label: 'LCM', x: 30, y: 46 },
        { position: 'CAM', label: 'CAM', x: 50, y: 34 },
        { position: 'ST', label: 'RS', x: 60, y: 16 },
        { position: 'ST', label: 'LS', x: 40, y: 16 },
      ],
    },
    {
      name: '5-3-2 Park The Bus',
      label: '5-3-2 Resilient Low Block',
      description: 'Suffocates opponent space in final third and springs rapid counter punches.',
      attMod: -6,
      defMod: 12,
      roles: [
        { position: 'GK', label: 'GK', x: 50, y: 88 },
        { position: 'RB', label: 'RWB', x: 88, y: 68 },
        { position: 'CB', label: 'RCB', x: 68, y: 75 },
        { position: 'CB', label: 'CB', x: 50, y: 77 },
        { position: 'CB', label: 'LCB', x: 32, y: 75 },
        { position: 'LB', label: 'LWB', x: 12, y: 68 },
        { position: 'CDM', label: 'RDM', x: 62, y: 52 },
        { position: 'CDM', label: 'LDM', x: 38, y: 52 },
        { position: 'CM', label: 'CM', x: 50, y: 42 },
        { position: 'ST', label: 'RS', x: 60, y: 18 },
        { position: 'ST', label: 'LS', x: 40, y: 18 },
      ],
    },
  ];

  const currentConfig = FORMATION_CONFIGS.find(f => f.name === selectedFormation) || FORMATION_CONFIGS[0];

  const mentalityMod = 
    tacticalMentality === 'ATTACKING' ? { att: 4, def: -3 } :
    tacticalMentality === 'DEFENSIVE' ? { att: -4, def: 5 } : { att: 0, def: 0 };

  const effectiveAttack = baseHomeAttack + currentConfig.attMod + mentalityMod.att;
  const effectiveDefense = baseHomeDefense + currentConfig.defMod + mentalityMod.def;

  return (
    <div className="space-y-6">
      {/* Tactical Briefing Hero */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Gaffer Tactical Board · Matchday Briefing</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Team Formation & Match Tactics
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Choose your tactical blueprint for the clash against {opponentClub.name}. Formations modify your squad's attacking and defensive ratings.
            </p>
          </div>

          {/* Rating Preview */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-4 shrink-0 font-mono">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Attack</span>
              <div className="text-2xl font-black text-emerald-400">
                {effectiveAttack} <span className="text-xs text-slate-500">({currentConfig.attMod >= 0 ? `+${currentConfig.attMod + mentalityMod.att}` : currentConfig.attMod + mentalityMod.att})</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Team Defense</span>
              <div className="text-2xl font-black text-blue-400">
                {effectiveDefense} <span className="text-xs text-slate-500">({currentConfig.defMod >= 0 ? `+${currentConfig.defMod + mentalityMod.def}` : currentConfig.defMod + mentalityMod.def})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formation Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {FORMATION_CONFIGS.map(f => {
            const isSelected = f.name === selectedFormation;
            return (
              <button
                key={f.name}
                onClick={() => { sounds.playClick(); onSelectFormation(f.name); }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative space-y-2 ${
                  isSelected
                    ? 'bg-slate-850 border-emerald-500 shadow-xl ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-white">
                    {f.name.split(' ')[0]}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>

                <div className="text-xs font-bold text-slate-300 line-clamp-1">
                  {f.name.split(' ').slice(1).join(' ')}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono pt-1">
                  <span className={f.attMod >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    Att {f.attMod >= 0 ? `+${f.attMod}` : f.attMod}
                  </span>
                  <span className="text-slate-500">·</span>
                  <span className={f.defMod >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                    Def {f.defMod >= 0 ? `+${f.defMod}` : f.defMod}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tactical Pitch Board & Instructions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          {/* Visual Formation Pitch (Left 2 Columns) */}
          <div className="lg:col-span-2 bg-gradient-to-b from-emerald-950/80 via-emerald-900/60 to-emerald-950/90 border-2 border-emerald-600/40 rounded-3xl p-6 relative overflow-hidden shadow-inner min-h-[380px] flex flex-col justify-between">
            {/* Pitch markings */}
            <div className="absolute inset-4 border border-white/20 rounded-2xl pointer-events-none" />
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-b border-white/20 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-white/20 pointer-events-none" />

            {/* Formation Title Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-widest bg-emerald-950/90 px-3 py-1 rounded-lg border border-emerald-700">
                {currentConfig.label}
              </span>
              <span className="text-[11px] font-mono text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded-lg">
                Opponent: {opponentClub.shortName}
              </span>
            </div>

            {/* Interactive Player Nodes on Pitch */}
            <div className="relative w-full h-[260px] my-auto">
              {currentConfig.roles.map((r, idx) => {
                const isPlayerRole = isStarting && r.position === player.position;
                return (
                  <div
                    key={idx}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500`}
                    style={{ left: `${r.x}%`, top: `${r.y}%` }}
                  >
                    <div 
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black font-mono text-xs shadow-lg transition-transform ${
                        isPlayerRole 
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/50 scale-125 animate-pulse font-extrabold z-20' 
                          : 'bg-slate-900 border border-slate-700 text-white hover:scale-110 z-10'
                      }`}
                    >
                      {r.position}
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-1 rounded mt-0.5 whitespace-nowrap ${
                      isPlayerRole ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'text-slate-300'
                    }`}>
                      {isPlayerRole ? `${player.lastName} (YOU)` : r.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom pitch footer */}
            <div className="relative z-10 text-[11px] font-mono text-emerald-200 text-center">
              {currentConfig.description}
            </div>
          </div>

          {/* Tactical Mentality & Pressing Options (Right Column) */}
          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Attacking Mentality
              </span>
              <div className="space-y-2">
                {[
                  { id: 'ATTACKING', label: 'All-Out Attack', desc: 'Overload final third (+4 Att, -3 Def)' },
                  { id: 'BALANCED', label: 'Balanced Structured', desc: 'Maintain tactical discipline' },
                  { id: 'DEFENSIVE', label: 'Absorb & Counter', desc: 'Compact shape (-4 Att, +5 Def)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { sounds.playClick(); onSelectMentality(opt.id as any); }}
                    className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      tacticalMentality === opt.id
                        ? 'bg-emerald-950/70 border-emerald-500 text-white'
                        : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Defensive Pressing Line
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'HIGH_PRESS', label: 'High Press' },
                  { id: 'MID_BLOCK', label: 'Mid-Block' },
                  { id: 'LOW_BLOCK', label: 'Low Block' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { sounds.playClick(); onSelectPressing(opt.id as any); }}
                    className={`py-2 px-2 rounded-xl text-center text-xs font-bold font-mono transition-all cursor-pointer ${
                      tacticalPressing === opt.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 border border-slate-850 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Kick-off Action Bar */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-slate-400">
            {isSuspended ? (
              <span className="text-rose-400 font-bold">⚠️ You are suspended for this fixture (Watch from Directors Box).</span>
            ) : isInjured ? (
              <span className="text-amber-400 font-bold">⚠️ Sidelined with injury. Team will play without you.</span>
            ) : isStarting ? (
              <span className="text-emerald-400 font-bold">✓ Selected in Starting XI by Manager {club.managerName}. Ready for action.</span>
            ) : (
              <span className="text-amber-400 font-bold">📋 Listed on the Substitutes Bench. Ready as impact sub.</span>
            )}
          </div>

          <button
            onClick={onConfirmKickoff}
            className="py-3.5 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Confirm Tactics & Kick-Off Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
