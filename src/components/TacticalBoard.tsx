import React, { useState } from 'react';
import { Player, TacticalTelemetry, HeatmapZone, PassingAction } from '../types/game';
import { sounds } from '../utils/soundFx';
import { 
  Activity, ArrowUpRight, BarChart3, CheckCircle2, ChevronRight, 
  Compass, Eye, Flame, MapPin, Shield, Sparkles, Target, Zap 
} from 'lucide-react';

interface TacticalBoardProps {
  player: Player;
  telemetry?: TacticalTelemetry;
}

export const TacticalBoard: React.FC<TacticalBoardProps> = ({ player, telemetry: providedTelemetry }) => {
  const [activeOverlay, setActiveOverlay] = useState<'heatmap' | 'passing' | 'shots'>('heatmap');
  const [pitchPerspective, setPitchPerspective] = useState<'attacking_up' | 'standard'>('attacking_up');

  // Position-specific default heatmap zones if no telemetry yet
  const getDefaultHeatmap = (): HeatmapZone[] => {
    const pos = player.position;
    if (['ST', 'CF'].includes(pos)) {
      return [
        { x: 50, y: 82, intensity: 0.95, touches: 14, label: 'Central Box & Penalty Spot' },
        { x: 42, y: 74, intensity: 0.85, touches: 10, label: 'Left Half-Space Pocket' },
        { x: 58, y: 74, intensity: 0.8, touches: 9, label: 'Right Half-Space Layoff' },
        { x: 50, y: 62, intensity: 0.6, touches: 6, label: 'Deep Drop Linkup' },
        { x: 35, y: 85, intensity: 0.7, touches: 5, label: 'Far-Post Channel' },
      ];
    } else if (['LW', 'LM'].includes(pos)) {
      return [
        { x: 18, y: 72, intensity: 0.95, touches: 16, label: 'Left Touchline Sprint Channel' },
        { x: 30, y: 78, intensity: 0.9, touches: 12, label: 'Inside Inverted Cut & Shot' },
        { x: 16, y: 52, intensity: 0.7, touches: 8, label: 'Midfield Transition Outlet' },
        { x: 42, y: 84, intensity: 0.65, touches: 6, label: 'Penalty Box Overload' },
      ];
    } else if (['RW', 'RM'].includes(pos)) {
      return [
        { x: 82, y: 72, intensity: 0.95, touches: 16, label: 'Right Touchline Sprint Channel' },
        { x: 70, y: 78, intensity: 0.9, touches: 12, label: 'Inside Inverted Cut & Cross' },
        { x: 84, y: 52, intensity: 0.7, touches: 8, label: 'Midfield Transition Outlet' },
        { x: 58, y: 84, intensity: 0.65, touches: 6, label: 'Penalty Box Far-Post Run' },
      ];
    } else if (['CAM', 'CM'].includes(pos)) {
      return [
        { x: 50, y: 58, intensity: 0.95, touches: 22, label: 'Engine Room Central Distribution' },
        { x: 38, y: 68, intensity: 0.85, touches: 14, label: 'Left Attacking Channel' },
        { x: 62, y: 68, intensity: 0.85, touches: 13, label: 'Right Attacking Channel' },
        { x: 50, y: 78, intensity: 0.75, touches: 8, label: 'Edge of the Box Shooting Zone' },
      ];
    } else if (['CDM'].includes(pos)) {
      return [
        { x: 50, y: 42, intensity: 0.95, touches: 24, label: 'Defensive Screen & Intercept Arc' },
        { x: 35, y: 46, intensity: 0.8, touches: 12, label: 'Left Cover Zone' },
        { x: 65, y: 46, intensity: 0.8, touches: 12, label: 'Right Cover Zone' },
      ];
    } else {
      // CB / FB
      return [
        { x: 50, y: 25, intensity: 0.95, touches: 20, label: 'Defensive Box Clearance' },
        { x: 35, y: 28, intensity: 0.8, touches: 14, label: 'Left Cover Channel' },
        { x: 65, y: 28, intensity: 0.8, touches: 14, label: 'Right Cover Channel' },
      ];
    }
  };

  const getDefaultPasses = (): PassingAction[] => [
    { startX: 48, startY: 60, endX: 20, endY: 75, type: 'LONG', completed: true },
    { startX: 52, startY: 65, endX: 50, endY: 84, type: 'KEY_CHANCE', completed: true },
    { startX: 42, startY: 72, endX: 46, endY: 76, type: 'SHORT', completed: true },
    { startX: 54, startY: 70, endX: 62, endY: 74, type: 'SHORT', completed: true },
    { startX: 30, startY: 80, endX: 50, endY: 85, type: 'CROSS', completed: true },
    { startX: 45, startY: 62, endX: 55, endY: 88, type: 'LONG', completed: false },
    { startX: 50, startY: 55, endX: 78, endY: 68, type: 'SHORT', completed: true },
  ];

  const telemetry: TacticalTelemetry = providedTelemetry || {
    matchOpponent: 'League Fixture',
    playerMinutes: 90,
    rating: player.seasonStats.avgRating || 7.4,
    distanceCoveredKm: 10.9,
    topSprintSpeedKmh: 33.6,
    highIntensitySprints: 24,
    passesAttempted: 44,
    passesCompleted: 39,
    passingAccuracyPct: 88.6,
    keyPasses: 3,
    dribblesAttempted: 6,
    dribblesCompleted: 4,
    tacklesWon: 2,
    interceptions: 1,
    xG: 0.78,
    xA: 0.42,
    shotsOnTarget: 3,
    heatmapZones: getDefaultHeatmap(),
    passingMap: getDefaultPasses(),
  };

  return (
    <div className="space-y-6">
      {/* Tactical Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Compass className="w-4 h-4" />
              Post-Match Telemetry & Positional Geometry
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Tactical Pitch Board & Heatmap Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Examine your spatial footprint on the pitch. Analyze high-density touch clusters, progressive passing vectors, and physical sprint outputs tailored to your position (<strong>{player.position}</strong>).
            </p>
          </div>

          {/* Metric Pill Toggles */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-850 self-start md:self-center">
            <button
              onClick={() => { sounds.playClick(); setActiveOverlay('heatmap'); }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeOverlay === 'heatmap'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Touch Heatmap</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveOverlay('passing'); }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeOverlay === 'passing'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Pass Network</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveOverlay('shots'); }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeOverlay === 'shots'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>xG & Shots</span>
            </button>
          </div>
        </div>

        {/* Telemetry Snapshot Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Pass Accuracy</span>
            <div className="text-xl font-black text-emerald-400 mt-1 font-mono">
              {telemetry.passingAccuracyPct}%
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{telemetry.passesCompleted}/{telemetry.passesAttempted} completed</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Distance Covered</span>
            <div className="text-xl font-black text-blue-400 mt-1 font-mono">
              {telemetry.distanceCoveredKm} km
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{telemetry.highIntensitySprints} high-speed sprints</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Top Speed</span>
            <div className="text-xl font-black text-amber-400 mt-1 font-mono">
              {telemetry.topSprintSpeedKmh} km/h
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Explosive Burst Tier</span>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-850">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Expected Goals (xG)</span>
            <div className="text-xl font-black text-purple-400 mt-1 font-mono">
              {telemetry.xG.toFixed(2)} xG
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">xA: {telemetry.xA.toFixed(2)} · {telemetry.keyPasses} key chances</span>
          </div>
        </div>
      </div>

      {/* Main Tactical Pitch Stage & Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Visual Tactical Pitch (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-white uppercase tracking-wider">
                {activeOverlay === 'heatmap' ? 'Spatial Touch Density Map' : activeOverlay === 'passing' ? 'Pass Direction & Distribution Vectors' : 'Shot Execution & xG Threat Map'}
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">Attacking Direction: Bottom → Top ⬆</span>
          </div>

          {/* SVG Pitch Canvas */}
          <div className="relative w-full aspect-[4/3] bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 rounded-2xl border-2 border-emerald-700/60 overflow-hidden shadow-2xl p-4 flex items-center justify-center">
            {/* Pitch Lines (SVG) */}
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="2" y="2" width="96" height="96" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              
              {/* Halfway line */}
              <line x1="2" y1="50" x2="98" y2="50" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              {/* Center circle */}
              <circle cx="50" cy="50" r="12" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <circle cx="50" cy="50" r="0.8" fill="#10b981" opacity="0.8" />

              {/* Top Penalty Box (Opponent) */}
              <rect x="25" y="2" width="50" height="18" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <rect x="37" y="2" width="26" height="6" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <circle cx="50" cy="13" r="0.8" fill="#10b981" opacity="0.8" />
              <path d="M 40 20 A 10 10 0 0 0 60 20" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />

              {/* Bottom Penalty Box (Home) */}
              <rect x="25" y="80" width="50" height="18" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <rect x="37" y="92" width="26" height="6" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <circle cx="50" cy="87" r="0.8" fill="#10b981" opacity="0.8" />
              <path d="M 40 80 A 10 10 0 0 1 60 80" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />

              {/* 1. HEATMAP OVERLAY */}
              {activeOverlay === 'heatmap' && telemetry.heatmapZones.map((zone, idx) => (
                <g key={idx}>
                  {/* Outer heat glow */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={10 + zone.intensity * 8}
                    fill={zone.intensity > 0.8 ? '#f43f5e' : zone.intensity > 0.6 ? '#f59e0b' : '#10b981'}
                    opacity={zone.intensity * 0.45}
                    className="animate-pulse"
                  />
                  {/* Core hot zone */}
                  <circle
                    cx={zone.x}
                    cy={zone.y}
                    r={5 + zone.intensity * 4}
                    fill={zone.intensity > 0.8 ? '#e11d48' : '#fbbf24'}
                    opacity={zone.intensity * 0.75}
                  />
                  {/* Pin label */}
                  <circle cx={zone.x} cy={zone.y} r="1.2" fill="#ffffff" />
                </g>
              ))}

              {/* 2. PASSING MAP OVERLAY */}
              {activeOverlay === 'passing' && telemetry.passingMap.map((pass, idx) => (
                <g key={idx}>
                  <line
                    x1={pass.startX}
                    y1={pass.startY}
                    x2={pass.endX}
                    y2={pass.endY}
                    stroke={
                      !pass.completed 
                        ? '#f43f5e' 
                        : pass.type === 'KEY_CHANCE' 
                        ? '#fbbf24' 
                        : pass.type === 'LONG' 
                        ? '#38bdf8' 
                        : '#34d399'
                    }
                    strokeWidth={pass.type === 'KEY_CHANCE' ? 1.4 : 1.0}
                    strokeDasharray={!pass.completed ? '2,2' : undefined}
                    opacity="0.9"
                  />
                  <circle cx={pass.startX} cy={pass.startY} r="0.9" fill="#ffffff" />
                  <circle
                    cx={pass.endX}
                    cy={pass.endY}
                    r="1.4"
                    fill={!pass.completed ? '#f43f5e' : pass.type === 'KEY_CHANCE' ? '#fbbf24' : '#34d399'}
                  />
                </g>
              ))}

              {/* 3. SHOTS & XG OVERLAY */}
              {activeOverlay === 'shots' && (
                <g>
                  {/* Example shot attempts */}
                  <circle cx="48" cy="85" r="3.2" fill="#fbbf24" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
                  <circle cx="56" cy="82" r="2.4" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
                  <circle cx="44" cy="72" r="1.8" fill="#f43f5e" stroke="#ffffff" strokeWidth="0.6" opacity="0.9" />
                  <line x1="48" y1="85" x2="50" y2="98" stroke="#fbbf24" strokeWidth="1.2" strokeDasharray="1,1" />
                  <line x1="56" y1="82" x2="52" y2="98" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1,1" />
                  <line x1="44" y1="72" x2="48" y2="98" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="1,1" />
                </g>
              )}
            </svg>
          </div>

          {/* Pitch Legend */}
          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
            {activeOverlay === 'heatmap' ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> High Touch Density</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Moderate Influence</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Transition Zone</span>
              </div>
            ) : activeOverlay === 'passing' ? (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-emerald-400" /> Completed Pass</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-amber-400" /> Key Chance Created</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-sky-400" /> Long Diagonal</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-rose-500 border-dashed" /> Intercepted</span>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Goal (High xG)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Shot on Target</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Blocked / Off Target</span>
              </div>
            )}

            <span className="font-mono text-emerald-400 font-bold">Matchday 90-min Telemetry</span>
          </div>
        </div>

        {/* Tactical Breakdown & Head Coach Analysis (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Coach's Tactical Debrief
              </h3>
              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-emerald-400 font-bold border border-slate-800">
                Match Rating: {telemetry.rating.toFixed(1)}
              </span>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                <strong>Spatial Occupation:</strong> Your heat concentration aligned cleanly with the game plan. As a <strong>{player.position}</strong>, you dragged opposing center-backs out of position and created half-space overloads.
              </p>
              <p>
                <strong>Progressive Passing:</strong> Completed <strong>{telemetry.passesCompleted} of {telemetry.passesAttempted} passes</strong> ({telemetry.passingAccuracyPct}%), delivering {telemetry.keyPasses} key line-breaking chances inside the box.
              </p>
            </div>

            {/* Tactical Key Metric Bars */}
            <div className="space-y-2.5 pt-2 border-t border-slate-800">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Passing Accuracy</span>
                  <span className="font-bold text-emerald-400">{telemetry.passingAccuracyPct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${telemetry.passingAccuracyPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Dribble Take-On Success</span>
                  <span className="font-bold text-blue-400">{Math.round((telemetry.dribblesCompleted / telemetry.dribblesAttempted) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${(telemetry.dribblesCompleted / telemetry.dribblesAttempted) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pressing Recovery Rate</span>
                  <span className="font-bold text-amber-400">{telemetry.tacklesWon + telemetry.interceptions} Won</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Zones Explanations */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              High Impact Touch Clusters
            </span>
            <div className="space-y-2">
              {telemetry.heatmapZones.slice(0, 3).map((zone, i) => (
                <div key={i} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-slate-200">{zone.label || `Zone ${i + 1}`}</span>
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">{zone.touches} touches</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
