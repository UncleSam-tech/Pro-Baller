import React, { useMemo } from 'react';
import { Player } from '../types/game';
import { Activity, Flame, Zap, Gauge, MapPin, Eye } from 'lucide-react';

interface TacticalHeatMapProps {
  player: Player;
  currentMinute: number;
  isSubbedIn: boolean;
  fatiguePercent: number;
  playerEventsCount?: number;
}

export const TacticalHeatMap: React.FC<TacticalHeatMapProps> = ({
  player,
  currentMinute,
  isSubbedIn,
  fatiguePercent,
  playerEventsCount = 0,
}) => {
  // Positional weights: 6 columns (X: 0 defensive -> 5 attacking) x 4 rows (Y: 0 left flank -> 3 right flank)
  const basePositionWeights = useMemo(() => {
    // 24 grid cells: row (0: Left, 1: Left-Center, 2: Right-Center, 3: Right), col (0-5 from Def to Att)
    const weights: number[][] = Array(4).fill(0).map(() => Array(6).fill(0.05));
    const pos = (player.position || 'ST').toUpperCase();

    if (pos === 'ST' || pos === 'CF') {
      // Primary focus: Col 4 & 5 (Attacking 3rd & Penalty Box), Row 1 & 2 (Central)
      weights[1][4] = 0.9;
      weights[2][4] = 0.9;
      weights[1][5] = 0.95;
      weights[2][5] = 0.95;
      weights[1][3] = 0.6;
      weights[2][3] = 0.6;
      weights[0][4] = 0.4;
      weights[3][4] = 0.4;
    } else if (pos === 'LW' || pos === 'LM') {
      // Primary focus: Row 0 (Left Flank), Col 3, 4, 5, cutting into Row 1 Col 4, 5
      weights[0][3] = 0.75;
      weights[0][4] = 0.95;
      weights[0][5] = 0.85;
      weights[1][4] = 0.7;
      weights[1][5] = 0.65;
      weights[0][2] = 0.5;
    } else if (pos === 'RW' || pos === 'RM') {
      // Primary focus: Row 3 (Right Flank), Col 3, 4, 5, cutting into Row 2 Col 4, 5
      weights[3][3] = 0.75;
      weights[3][4] = 0.95;
      weights[3][5] = 0.85;
      weights[2][4] = 0.7;
      weights[2][5] = 0.65;
      weights[3][2] = 0.5;
    } else if (pos === 'CAM') {
      // Zone 14 master: Col 3 & 4 (Mid-Attacking), Row 1 & 2
      weights[1][3] = 0.9;
      weights[2][3] = 0.9;
      weights[1][4] = 0.95;
      weights[2][4] = 0.95;
      weights[0][3] = 0.5;
      weights[3][3] = 0.5;
      weights[1][2] = 0.6;
      weights[2][2] = 0.6;
    } else if (pos === 'CM') {
      // Box-to-box engine: Col 2, 3, 4, Rows 1 & 2
      weights[1][2] = 0.85;
      weights[2][2] = 0.85;
      weights[1][3] = 0.95;
      weights[2][3] = 0.95;
      weights[1][4] = 0.7;
      weights[2][4] = 0.7;
      weights[1][1] = 0.5;
      weights[2][1] = 0.5;
    } else if (pos === 'CDM') {
      // Anchor: Col 1, 2, 3, Rows 1 & 2
      weights[1][1] = 0.8;
      weights[2][1] = 0.8;
      weights[1][2] = 0.95;
      weights[2][2] = 0.95;
      weights[1][3] = 0.65;
      weights[2][3] = 0.65;
    } else if (pos === 'LB') {
      // Left Back: Row 0, Col 1, 2, 3, 4
      weights[0][1] = 0.9;
      weights[0][2] = 0.9;
      weights[0][3] = 0.75;
      weights[0][4] = 0.5;
      weights[1][1] = 0.6;
    } else if (pos === 'RB') {
      // Right Back: Row 3, Col 1, 2, 3, 4
      weights[3][1] = 0.9;
      weights[3][2] = 0.9;
      weights[3][3] = 0.75;
      weights[3][4] = 0.5;
      weights[2][1] = 0.6;
    } else if (pos === 'CB') {
      // Center Back: Col 0 & 1, Rows 1 & 2
      weights[1][0] = 0.85;
      weights[2][0] = 0.85;
      weights[1][1] = 0.95;
      weights[2][1] = 0.95;
      weights[1][2] = 0.4;
      weights[2][2] = 0.4;
    } else {
      // GK
      weights[1][0] = 0.95;
      weights[2][0] = 0.95;
    }

    return weights;
  }, [player.position]);

  // Scaled heat cell intensity (0 to 1) based on current minute and active participation
  const activeHeatCells = useMemo(() => {
    if (!isSubbedIn || currentMinute <= 0) {
      return basePositionWeights.map(row => row.map(() => 0));
    }
    const minuteFactor = Math.min(1, currentMinute / 75); // reaches peak density around min 75
    const activityMultiplier = 0.3 + (playerEventsCount * 0.1) + (minuteFactor * 0.7);

    return basePositionWeights.map((row, rIdx) =>
      row.map((val, cIdx) => {
        // Slight organic variation
        const jitter = Math.sin((rIdx + 1) * 3 + (cIdx + 1) * 7 + currentMinute) * 0.05;
        const cellHeat = Math.max(0, Math.min(1, (val * activityMultiplier) + jitter));
        return cellHeat;
      })
    );
  }, [basePositionWeights, isSubbedIn, currentMinute, playerEventsCount]);

  // Derived Performance Metrics
  const distanceCoveredKm = useMemo(() => {
    if (!isSubbedIn || currentMinute <= 0) return 0.0;
    const workRateBonus = (player.attributes.workRate || 70) / 100;
    const baseKm = (currentMinute / 90) * 10.4 * workRateBonus;
    return Math.min(12.8, Math.max(0.1, Number(baseKm.toFixed(1))));
  }, [isSubbedIn, currentMinute, player.attributes.workRate]);

  const sprintCount = useMemo(() => {
    if (!isSubbedIn || currentMinute <= 0) return 0;
    const paceFactor = (player.attributes.pace || 70) / 80;
    return Math.round((currentMinute / 90) * 26 * paceFactor);
  }, [isSubbedIn, currentMinute, player.attributes.pace]);

  const finalThirdTouches = useMemo(() => {
    if (!isSubbedIn || currentMinute <= 0) return 0;
    const pos = (player.position || 'ST').toUpperCase();
    const isAttacker = ['ST', 'CF', 'LW', 'RW', 'CAM'].includes(pos);
    const rate = isAttacker ? 0.45 : 0.15;
    return Math.round(currentMinute * rate + playerEventsCount * 2);
  }, [isSubbedIn, currentMinute, player.position, playerEventsCount]);

  const pitchCoveragePercent = useMemo(() => {
    if (!isSubbedIn || currentMinute <= 0) return 0;
    return Math.min(88, Math.round(25 + (currentMinute / 90) * 55));
  }, [isSubbedIn, currentMinute]);

  // Color mapper for heatmap intensity
  const getHeatBgColor = (heat: number) => {
    if (heat < 0.15) return 'rgba(15, 23, 42, 0.4)'; // faint pitch
    if (heat < 0.35) return 'rgba(14, 165, 233, 0.35)'; // cool cyan
    if (heat < 0.55) return 'rgba(16, 185, 129, 0.55)'; // moderate emerald
    if (heat < 0.75) return 'rgba(245, 158, 11, 0.75)'; // warm amber
    return 'rgba(239, 68, 68, 0.9)'; // peak scarlet / fiery red
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-5 shadow-2xl relative overflow-hidden">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold font-mono uppercase tracking-widest text-amber-400">
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            Tactical Positional Heat Map & Spatial Radar
          </div>
          <h3 className="text-lg font-black text-white mt-0.5">
            {player.firstName} {player.lastName} (#{player.jerseyNumber} · {player.position})
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
            fatiguePercent > 65 
              ? 'bg-rose-950/80 text-rose-400 border-rose-800 animate-pulse'
              : fatiguePercent > 35
              ? 'bg-amber-950/80 text-amber-400 border-amber-800'
              : 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
          }`}>
            Fatigue: {fatiguePercent}% {fatiguePercent > 65 ? '(Heavy Legs)' : fatiguePercent > 35 ? '(Exertion)' : '(Fresh)'}
          </span>
          <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
            Min {currentMinute}'
          </span>
        </div>
      </div>

      {/* Pitch Heat Map Visual Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[2/1] bg-emerald-950/70 border-2 border-emerald-600/40 rounded-2xl overflow-hidden shadow-inner flex flex-col justify-between p-2">
        {/* Pitch Lines (SVG Overlay) */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 100 60">
            {/* Outer Boundary */}
            <rect x="2" y="2" width="96" height="56" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            {/* Halfway Line */}
            <line x1="50" y1="2" x2="50" y2="58" stroke="#FFFFFF" strokeWidth="0.8" />
            {/* Center Circle & Spot */}
            <circle cx="50" cy="30" r="9" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="50" cy="30" r="0.8" fill="#FFFFFF" />
            
            {/* Left Penalty Area (Defending) */}
            <rect x="2" y="14" width="16" height="32" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="2" y="22" width="6" height="16" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="12" cy="30" r="0.8" fill="#FFFFFF" />
            <path d="M 18,24 A 7,7 0 0,1 18,36" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />

            {/* Right Penalty Area (Attacking) */}
            <rect x="82" y="14" width="16" height="32" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            <rect x="92" y="22" width="6" height="16" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="88" cy="30" r="0.8" fill="#FFFFFF" />
            <path d="M 82,24 A 7,7 0 0,0 82,36" fill="none" stroke="#FFFFFF" strokeWidth="0.8" />

            {/* Direction Arrow */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10B981" />
              </marker>
            </defs>
            <line x1="38" y1="56" x2="62" y2="56" stroke="#10B981" strokeWidth="0.7" markerEnd="url(#arrow)" strokeDasharray="1,1" />
          </svg>
        </div>

        {/* Direction Indicator Label */}
        <div className="absolute top-2 right-3 z-10 text-[9px] font-mono font-bold text-emerald-400 bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-800/60 uppercase">
          Attacking Direction →
        </div>
        <div className="absolute top-2 left-3 z-10 text-[9px] font-mono font-bold text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 uppercase">
          ← Defending Zone
        </div>

        {/* 24 Heat Cells Grid */}
        <div className="relative z-1 grid grid-rows-4 grid-cols-6 w-full h-full gap-0.5 p-1 rounded">
          {activeHeatCells.map((row, rIdx) =>
            row.map((heat, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className="w-full h-full rounded transition-all duration-700 relative overflow-hidden flex items-center justify-center"
                style={{
                  backgroundColor: getHeatBgColor(heat),
                  backdropFilter: heat > 0.4 ? 'blur(2px)' : 'none',
                  boxShadow: heat > 0.6 ? '0 0 16px rgba(239, 68, 68, 0.4) inset' : undefined,
                }}
              >
                {heat >= 0.75 && (
                  <span className="text-[9px] font-mono font-black text-white/90 drop-shadow">
                    🔥
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Live Active Player Node Indicator */}
        {isSubbedIn && currentMinute > 0 && (
          <div 
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{
              left: `${Math.min(92, Math.max(8, 20 + (currentMinute % 70) + (player.position === 'ST' ? 25 : 5)))}%`,
              top: `${Math.min(85, Math.max(15, 30 + Math.sin(currentMinute) * 25))}%`,
            }}
          >
            <div className="relative flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full bg-amber-400/30 animate-ping" />
              <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-lg font-black text-[9px] text-slate-950">
                #{player.jerseyNumber}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Heat Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 font-mono pt-1">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold uppercase text-[10px]">Activity Density:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-950 border border-slate-700 inline-block" />
            <span className="text-[10px]">Low</span>
            <span className="w-3 h-3 rounded bg-sky-500/60 inline-block ml-1" />
            <span className="text-[10px]">Moderate</span>
            <span className="w-3 h-3 rounded bg-emerald-500/70 inline-block ml-1" />
            <span className="text-[10px]">Active</span>
            <span className="w-3 h-3 rounded bg-amber-500/80 inline-block ml-1" />
            <span className="text-[10px]">High</span>
            <span className="w-3 h-3 rounded bg-rose-600 inline-block ml-1" />
            <span className="text-[10px] text-rose-400 font-bold">Hotspot</span>
          </div>
        </div>

        <div className="text-right text-[10px] text-slate-400">
          Position Matrix: <strong className="text-white">{player.position}</strong> · Corridor: <strong className="text-emerald-400">{['ST', 'CAM'].includes(player.position) ? 'Central Channel & Box' : ['LW', 'LB'].includes(player.position) ? 'Left Flank' : ['RW', 'RB'].includes(player.position) ? 'Right Flank' : 'Box-to-Box'}</strong>
        </div>
      </div>

      {/* Tactical Activity Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Distance Covered</span>
          </div>
          <div className="text-lg font-black font-mono text-white">
            {distanceCoveredKm} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>High-Speed Sprints</span>
          </div>
          <div className="text-lg font-black font-mono text-amber-400">
            {sprintCount} <span className="text-xs font-normal text-slate-400">bursts</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Final Third Touches</span>
          </div>
          <div className="text-lg font-black font-mono text-blue-400">
            {finalThirdTouches} <span className="text-xs font-normal text-slate-400">touches</span>
          </div>
        </div>

        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>Pitch Coverage</span>
          </div>
          <div className="text-lg font-black font-mono text-purple-400">
            {pitchCoveragePercent}%
          </div>
        </div>
      </div>
    </div>
  );
};
