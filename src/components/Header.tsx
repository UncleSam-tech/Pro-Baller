import React from 'react';
import { GameView, Player } from '../types/game';
import { CurrencyCode, formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Award, Briefcase, Calendar, CreditCard, Dumbbell, Globe, Heart, 
  Play, Shield, ShoppingBag, Trophy, User, Volume2, VolumeX, Radar, 
  Mic, Sparkles, Activity, FileText, ChevronRight, Zap, Users, GraduationCap,
  Menu
} from 'lucide-react';

export interface GameModeTab {
  id: GameView;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface HeaderProps {
  player: Player;
  currentView: GameView;
  onSelectView: (view: GameView) => void;
  onNextWeek: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNewCareer: () => void;
  onSelectCurrency?: (code: CurrencyCode) => void;
  onTeleport?: (view: GameView, subTab?: string) => void;
  activeSubTab?: string;
  nextOpponentName?: string;
  competitionName?: string;
  onOpenSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  player,
  currentView,
  onSelectView,
  onNextWeek,
  isMuted,
  onToggleMute,
  onNewCareer,
  onSelectCurrency,
  onTeleport,
  activeSubTab,
  nextOpponentName,
  competitionName,
  onOpenSidebar,
}) => {
  const currency = player.preferredCurrency || 'GBP';

  // Primary Sports Video Game Navigation - Direct, un-nested, authentic sports game layout
  const gameModes: GameModeTab[] = [
    { id: 'MATCH', label: 'Matchday', icon: <Play className="w-3.5 h-3.5 fill-current" />, badge: 'LIVE' },
    { id: 'TEAMMATES', label: 'Locker Room', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'COACHING', label: 'Personal Coach', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { id: 'PERSONA', label: 'Player HQ', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'TRAINING', label: 'Training Ground', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'SCOUTING', label: 'Scouting Network', icon: <Radar className="w-3.5 h-3.5" /> },
    { id: 'TRANSFERS', label: 'Transfer Market', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'CONTRACTS', label: 'Contracts', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'MEDICAL', label: 'Medical Lab', icon: <Heart className="w-3.5 h-3.5" />, badge: player.injuryWeeks > 0 ? 'REHAB' : undefined },
    { id: 'LIFE_SHOP', label: 'Pro Shop & Life', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
  ];

  const handleSelectMode = (view: GameView) => {
    sounds.playClick();
    onSelectView(view);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#090d16]/95 border-b border-slate-800/80 backdrop-blur-md px-3 lg:px-6 py-2 transition-all shadow-xl shadow-black/40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Zone 1: Authentic Video Game Player Card HUD */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenSidebar && (
            <button
              onClick={() => { sounds.playClick(); onOpenSidebar(); }}
              className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Fut-style OVR Gem Shield */}
          <div className="relative group cursor-pointer" onClick={() => handleSelectMode('PERSONA')}>
            <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono shadow-md border ${
              player.overallRating >= 85 
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 font-black shadow-amber-500/20' 
                : player.overallRating >= 75
                ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white border-emerald-400 font-bold shadow-emerald-500/20'
                : 'bg-gradient-to-b from-slate-700 to-slate-900 text-slate-100 border-slate-600 font-bold'
            }`}>
              <span className="text-xs font-black tracking-tight leading-none">{player.overallRating}</span>
              <span className="text-[9px] uppercase tracking-tighter opacity-90 leading-none mt-0.5">{player.position}</span>
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
              <span>{player.firstName} {player.lastName}</span>
              <span className="text-[10px] text-emerald-400 font-mono font-normal">#{player.jerseyNumber}</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
              <span>⚡ <strong className={player.energy < 40 ? 'text-rose-400' : 'text-emerald-400'}>{player.energy}%</strong></span>
              <span>🔥 <strong className="text-amber-400">{player.morale}%</strong></span>
            </div>
          </div>
        </div>

        {/* Zone 2: Main Console-Style Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
          {gameModes.map((mode) => {
            const isActive = currentView === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 font-mono ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-102 ring-1 ring-emerald-400/40'
                    : mode.id === 'MATCH'
                    ? 'bg-slate-900 text-emerald-300 hover:text-white hover:bg-slate-850 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/90'
                }`}
              >
                <span>{mode.icon}</span>
                <span>{mode.label}</span>
                {mode.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono hidden md:inline ${
                    isActive ? 'bg-black/30 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  }`}>
                    {mode.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Fixture Status, Balance, Audio & Week Advance */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Next Match Fixture Pill */}
          {nextOpponentName && (
            <button
              onClick={() => handleSelectMode('MATCH')}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[11px] font-mono cursor-pointer transition-colors"
              title="Click to enter Matchday"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400">VS</span>
              <span className="text-white font-bold truncate max-w-[90px]">{nextOpponentName}</span>
            </button>
          )}

          {/* Balance Preview */}
          <div className="hidden xl:block text-right font-mono text-xs pr-1">
            <span className="text-[9px] text-slate-500 uppercase block font-bold leading-tight">Bank</span>
            <span className="font-bold text-emerald-400">
              {formatCurrency(player.bankBalance, currency)}
            </span>
          </div>

          {/* Currency Switcher */}
          {onSelectCurrency && (
            <select
              value={player.preferredCurrency || 'GBP'}
              onChange={(e) => onSelectCurrency(e.target.value as CurrencyCode)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono font-bold rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="NGN">₦ NGN</option>
              <option value="GBP">£ GBP</option>
              <option value="EUR">€ EUR</option>
              <option value="USD">$ USD</option>
              <option value="BRL">R$ BRL</option>
              <option value="JPY">¥ JPY</option>
            </select>
          )}

          {/* Audio Mute Toggle */}
          <button
            onClick={onToggleMute}
            aria-label="Toggle Audio"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* New Career */}
          <button
            onClick={onNewCareer}
            className="hidden 2xl:inline-block px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            New Career
          </button>

          {/* Advance Calendar Week Action */}
          <button
            onClick={() => {
              sounds.playClick();
              onNextWeek();
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 font-mono"
            title="Advance to next gameweek and collect weekly wage"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>W{player.currentWeek} ➔</span>
          </button>
        </div>
      </div>
    </header>
  );
};
