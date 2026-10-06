import React, { useState } from 'react';
import { Club, MatchLiveEvent, Player } from '../types/game';
import { 
  Flame, Award, ShieldAlert, Zap, AlertTriangle, Eye, Sparkles, 
  ArrowRight, ShieldCheck, HeartPulse, Filter, Clock 
} from 'lucide-react';
import { sounds } from '../utils/soundFx';

interface MatchHighlightsFeedProps {
  events: MatchLiveEvent[];
  homeClub: Club;
  awayClub: Club;
  player: Player;
  isLive?: boolean;
}

export const MatchHighlightsFeed: React.FC<MatchHighlightsFeedProps> = ({
  events,
  homeClub,
  awayClub,
  player,
  isLive = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'GOALS' | 'CARDS' | 'SAVES_INJURIES'>('ALL');

  // Filter events down to meaningful dramatic highlights
  const keyEvents = events.filter(e => {
    const isGoal = e.type === 'goal' || e.text.includes('⚽') || e.text.includes('GOAL');
    const isCard = e.type === 'card' || e.text.includes('🟨') || e.text.includes('🟥') || e.text.includes('BOOKING') || e.text.includes('RED CARD');
    const isAssist = e.type === 'assist' || e.text.includes('ASSIST');
    const isInjury = e.text.includes('stretcher') || e.text.includes('muscle') || e.text.includes('strain') || e.text.includes('injury') || e.text.includes('knock');
    const isBigChance = e.type === 'moment' || e.type === 'chance' || e.text.includes('woodwork') || e.text.includes('crossbar') || e.text.includes('magnificent save');

    if (filter === 'GOALS') return isGoal || isAssist;
    if (filter === 'CARDS') return isCard;
    if (filter === 'SAVES_INJURIES') return isInjury || isBigChance;

    return isGoal || isCard || isAssist || isInjury || isBigChance || e.isPlayerInvolved;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Matchday Key Highlights Feed</span>
            {isLive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Broadcast highlights reel capturing goals, disciplinary bookings, and critical match incidents.
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => { sounds.playClick(); setFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({keyEvents.length})
          </button>
          <button
            onClick={() => { sounds.playClick(); setFilter('GOALS'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'GOALS'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Goals (⚽)
          </button>
          <button
            onClick={() => { sounds.playClick(); setFilter('CARDS'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'CARDS'
                ? 'bg-rose-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cards (🟨🟥)
          </button>
          <button
            onClick={() => { sounds.playClick(); setFilter('SAVES_INJURIES'); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'SAVES_INJURIES'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Chances (🧤)
          </button>
        </div>
      </div>

      {/* Highlights Feed List */}
      {keyEvents.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs font-mono">
          No key highlights recorded for this filter yet. Simulation in progress...
        </div>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 scrollbar-thin">
          {keyEvents.map((ev, idx) => {
            const isGoal = ev.type === 'goal' || ev.text.includes('⚽') || ev.text.includes('GOAL');
            const isCard = ev.type === 'card' || ev.text.includes('🟨') || ev.text.includes('🟥');
            const isAssist = ev.type === 'assist' || ev.text.includes('ASSIST');
            const isRed = ev.text.includes('🟥') || ev.text.includes('RED CARD');
            const isInjury = ev.text.includes('stretcher') || ev.text.includes('muscle') || ev.text.includes('knock');

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 relative overflow-hidden ${
                  isGoal
                    ? 'bg-gradient-to-r from-emerald-950/90 to-slate-900 border-emerald-500/60 shadow-lg'
                    : isRed
                    ? 'bg-gradient-to-r from-rose-950/90 to-slate-900 border-rose-500/60 shadow-lg'
                    : isCard
                    ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500/50'
                    : isInjury
                    ? 'bg-gradient-to-r from-purple-950/80 to-slate-900 border-purple-500/50'
                    : ev.isPlayerInvolved
                    ? 'bg-slate-850 border-emerald-500/40 text-slate-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300'
                }`}
              >
                {/* Event Minute Badge */}
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center shrink-0 font-mono">
                  <span className="text-sm font-black text-white leading-none">
                    {ev.minute}'
                  </span>
                  <span className="text-[9px] text-slate-500 uppercase mt-0.5">Min</span>
                </div>

                {/* Event Body */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {isGoal && (
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>⚽</span> GOAL SCENARIO
                      </span>
                    )}
                    {isAssist && !isGoal && (
                      <span className="text-emerald-300 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>🅰️</span> ASSIST DELIVERY
                      </span>
                    )}
                    {isRed && (
                      <span className="text-rose-400 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>🟥</span> RED CARD DISMISSAL
                      </span>
                    )}
                    {isCard && !isRed && (
                      <span className="text-amber-400 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>🟨</span> OFFICIAL BOOKING
                      </span>
                    )}
                    {isInjury && (
                      <span className="text-purple-400 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>🚑</span> INJURY ALERT
                      </span>
                    )}
                    {!isGoal && !isCard && !isInjury && (
                      <span className="text-blue-400 font-bold text-xs flex items-center gap-1 font-mono uppercase">
                        <span>⚡</span> KEY MATCH MOMENT
                      </span>
                    )}

                    {ev.isPlayerInvolved && (
                      <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 ml-auto">
                        ★ YOU WERE INVOLVED
                      </span>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-white font-medium leading-relaxed">
                    {ev.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
