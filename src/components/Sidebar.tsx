import React from 'react';
import { GameView, Player } from '../types/game';
import { sounds } from '../utils/soundFx';
import { 
  Play, Radar, Users, Zap, GraduationCap, Globe, 
  FileText, Heart, User, ShoppingBag, ChevronRight,
  Shield, Sparkles, Activity, X
} from 'lucide-react';

export interface NavSectionItem {
  id: GameView;
  label: string;
  subLabel: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

interface SidebarProps {
  player: Player;
  currentView: GameView;
  onSelectView: (view: GameView) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  player,
  currentView,
  onSelectView,
  isOpenMobile,
  onCloseMobile,
}) => {
  // All 10 Major Game Sections — completely flat, reachable in 1 single click!
  const navItems: NavSectionItem[] = [
    {
      id: 'MATCH',
      label: 'Matchday',
      subLabel: 'Kick-off & Simulation',
      icon: <Play className="w-4 h-4 fill-current" />,
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'SCOUTING',
      label: 'Scouting',
      subLabel: 'Global Network & Radar',
      icon: <Radar className="w-4 h-4" />,
      badge: 'RADAR',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    },
    {
      id: 'TEAMMATES',
      label: 'Teammates',
      subLabel: 'Locker Room & Chemistry',
      icon: <Users className="w-4 h-4" />,
      badge: `${player.teamChemistry || 70}%`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    },
    {
      id: 'TRAINING',
      label: 'Training Ground',
      subLabel: 'Weekly Drills & Stats',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      id: 'COACHING',
      label: 'Personal Coach',
      subLabel: 'Private Specialists',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'TRANSFERS',
      label: 'Transfer Market',
      subLabel: 'Offers & Bids',
      icon: <Globe className="w-4 h-4" />,
      badge: 'MARKET',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    {
      id: 'CONTRACTS',
      label: 'Contracts',
      subLabel: 'Terms & Boardroom',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'MEDICAL',
      label: 'Medical Lab',
      subLabel: 'Injuries & Physio',
      icon: <Heart className="w-4 h-4" />,
      badge: player.injuryWeeks > 0 ? `${player.injuryWeeks}W INJ` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'PERSONA',
      label: 'Player HQ',
      subLabel: '3D Persona & Bio',
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'LIFE_SHOP',
      label: 'Pro Shop & Life',
      subLabel: 'Luxury & Investment',
      icon: <ShoppingBag className="w-4 h-4" />,
    },
  ];

  const handleNavClick = (view: GameView) => {
    sounds.playClick();
    onSelectView(view);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-72 bg-[#080d17] border-r border-slate-800/80 
        flex flex-col transition-transform duration-300 ease-in-out shrink-0
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Game Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 font-black">
              ⚽
            </div>
            <div>
              <div className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                <span>BE A PRO</span>
                <span className="text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1 rounded">2026</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Career Mode Simulation</div>
            </div>
          </div>

          <button 
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Item List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 scrollbar-thin">
          <div className="px-2 pb-1.5 text-[10px] uppercase tracking-wider font-bold text-slate-400 font-mono">
            Navigation Menu
          </div>

          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full group px-3 py-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer font-mono ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-1 ring-emerald-400/40'
                    : item.id === 'MATCH'
                    ? 'bg-slate-900/90 text-emerald-300 hover:bg-slate-850 hover:text-white border border-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'bg-slate-900 text-slate-400 group-hover:text-emerald-400'
                  }`}>
                    {item.icon}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-bold leading-tight truncate">
                      {item.label}
                    </div>
                    <div className={`text-[10px] leading-tight truncate mt-0.5 ${
                      isActive ? 'text-emerald-100/80' : 'text-slate-400'
                    }`}>
                      {item.subLabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border uppercase shrink-0 ${
                    isActive ? 'bg-white/20 text-white border-white/30' : (item.badgeColor || 'bg-slate-900 text-slate-400 border-slate-800')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Player Profile Footer HUD */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div 
            onClick={() => handleNavClick('PERSONA')}
            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer"
          >
            {/* OVR Shield */}
            <div className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-mono shadow-md border shrink-0 ${
              player.overallRating >= 85 
                ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 font-black shadow-amber-500/20' 
                : player.overallRating >= 75
                ? 'bg-gradient-to-b from-emerald-500 to-teal-700 text-white border-emerald-400 font-bold shadow-emerald-500/20'
                : 'bg-gradient-to-b from-slate-700 to-slate-900 text-slate-100 border-slate-600 font-bold'
            }`}>
              <span className="text-xs font-black tracking-tight leading-none">{player.overallRating}</span>
              <span className="text-[8px] uppercase tracking-tighter opacity-90 leading-none mt-0.5">{player.position}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {player.firstName} {player.lastName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate flex items-center gap-1.5 mt-0.5">
                <span>⚡ {player.energy}%</span>
                <span>·</span>
                <span>🔥 {player.morale}%</span>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
};
