import React from 'react';
import { Club, Player } from '../types/game';
import { Award, Flame, Heart, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface PlayerProfileProps {
  player: Player;
  club: Club;
  onOpenContract: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  player,
  club,
  onOpenContract,
}) => {
  const attrs = player.attributes;

  // Stat group averages
  const physicalAvg = Math.round(
    (attrs.pace + attrs.acceleration + attrs.stamina + attrs.strength + attrs.agility + attrs.jumping) / 6
  );
  const technicalAvg = Math.round(
    (attrs.finishing + attrs.dribbling + attrs.ballControl + attrs.shortPassing + attrs.longPassing + attrs.shotPower + attrs.curve) / 7
  );
  const mentalAvg = Math.round(
    (attrs.composure + attrs.vision + attrs.positioning + attrs.workRate + attrs.leadership + attrs.flair) / 6
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Jersey Number & Position Avatar */}
            <div 
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black text-white shadow-xl border-2 border-white/20"
              style={{ backgroundColor: club.primaryColor }}
            >
              <span className="text-2xl leading-none">#{player.jerseyNumber}</span>
              <span className="text-[11px] uppercase tracking-wider text-white/80 mt-1 font-mono font-bold">
                {player.position}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{player.nationCode === 'FR' ? '🇫🇷' : player.nationCode === 'AR' ? '🇦🇷' : player.nationCode === 'BR' ? '🇧🇷' : player.nationCode === 'ES' ? '🇪🇸' : player.nationCode === 'ENG' ? '🏴󠁧󠁢󠁥󠁮󠁧󠁿' : '🌍'}</span>
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                  {player.nationality} · Age {player.age}
                </span>
                <span>·</span>
                <span className="text-xs text-amber-400 font-medium">{player.archetype}</span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-white mt-1 tracking-tight">
                {player.firstName} {player.lastName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
                <span className="text-slate-200 font-medium">{club.name}</span>
                <span>·</span>
                <span>Role: <strong className="text-emerald-400">{player.squadRole}</strong></span>
                <span>·</span>
                <span>Market Value: <strong className="text-white font-mono">£{(player.marketValue / 1_000_000).toFixed(1)}M</strong></span>
              </div>
            </div>
          </div>

          {/* OVR & POTENTIAL BADGES */}
          <div className="flex items-center gap-4">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">OVERALL</div>
              <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                {player.overallRating}
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-center min-w-[90px]">
              <div className="text-[10px] uppercase font-bold text-slate-400">POTENTIAL</div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
                {player.potentialRating}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Condition Meters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80 text-xs">
          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Physical Energy
              </span>
              <span className="font-mono font-bold text-white">{player.energy}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full" style={{ width: `${player.energy}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Match Sharpness
              </span>
              <span className="font-mono font-bold text-white">{player.matchSharpness}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full" style={{ width: `${player.matchSharpness}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Morale & Confidence
              </span>
              <span className="font-mono font-bold text-white">{player.morale}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-rose-400 h-full" style={{ width: `${player.morale}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                Manager Trust
              </span>
              <span className="font-mono font-bold text-white">{player.managerTrust}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full" style={{ width: `${player.managerTrust}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED ATTRIBUTES MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Technical Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Technical Skill
            </h3>
            <span className="font-mono font-bold text-emerald-400 text-xs">{technicalAvg} AVG</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Finishing', val: attrs.finishing },
              { label: 'Dribbling', val: attrs.dribbling },
              { label: 'Ball Control', val: attrs.ballControl },
              { label: 'Short Passing', val: attrs.shortPassing },
              { label: 'Long Passing', val: attrs.longPassing },
              { label: 'Crossing', val: attrs.crossing },
              { label: 'Tackling', val: attrs.tackling },
              { label: 'Shot Power', val: attrs.shotPower },
              { label: 'Curve & Swerve', val: attrs.curve },
              { label: 'Penalties', val: attrs.penalties },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.val >= 80 ? 'bg-emerald-400' : stat.val >= 70 ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-white w-6 text-right">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Physicality & Pace
            </h3>
            <span className="font-mono font-bold text-amber-400 text-xs">{physicalAvg} AVG</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Sprint Speed', val: attrs.pace },
              { label: 'Acceleration', val: attrs.acceleration },
              { label: 'Stamina Engine', val: attrs.stamina },
              { label: 'Strength & Muscle', val: attrs.strength },
              { label: 'Agility & Balance', val: attrs.agility },
              { label: 'Jumping Reach', val: attrs.jumping },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.val >= 80 ? 'bg-emerald-400' : stat.val >= 70 ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-white w-6 text-right">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Biological Specs */}
          <div className="pt-4 border-t border-slate-800 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Height & Weight:</span>
              <span className="font-bold text-slate-200">{player.heightCm} cm · {player.weightKg} kg</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Preferred Foot:</span>
              <span className="font-bold text-slate-200">{player.preferredFoot} Foot</span>
            </div>
          </div>
        </div>

        {/* Mental Attributes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              Mental & Tactical
            </h3>
            <span className="font-mono font-bold text-blue-400 text-xs">{mentalAvg} AVG</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {[
              { label: 'Composure under Pressure', val: attrs.composure },
              { label: 'Tactical Vision', val: attrs.vision },
              { label: 'Off-Ball Positioning', val: attrs.positioning },
              { label: 'Work Rate & Press', val: attrs.workRate },
              { label: 'Captaincy Leadership', val: attrs.leadership },
              { label: 'Flair & Unpredictability', val: attrs.flair },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-400">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.val >= 80 ? 'bg-emerald-400' : stat.val >= 70 ? 'bg-amber-400' : 'bg-slate-500'}`}
                      style={{ width: `${stat.val}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-white w-6 text-right">{stat.val}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Traits List */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Special Traits</span>
            <div className="flex flex-wrap gap-1.5">
              {player.traits.map((t, idx) => (
                <span key={idx} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contract & Financial Quick Snapshot Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">
            Active Club Employment Contract
          </div>
          <div className="text-lg font-bold text-white mt-1">
            £{player.currentContract.weeklyWage.toLocaleString()} / week · Expires {player.currentContract.expiryYear}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Buyout Release Clause: {player.currentContract.minimumReleaseClause > 0 ? `£${(player.currentContract.minimumReleaseClause / 1_000_000).toFixed(0)}M` : 'None'} · Agent: {player.currentContract.agentName}
          </div>
        </div>

        <button
          onClick={onOpenContract}
          className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
        >
          Inspect Official Contract & Clauses
        </button>
      </div>
    </div>
  );
};
