import React from 'react';
import { Player } from '../types/game';
import { Award, Flame, Globe, Sparkles, Trophy } from 'lucide-react';

interface TrophyRoomProps {
  player: Player;
}

export const TrophyRoom: React.FC<TrophyRoomProps> = ({ player }) => {
  // Aggregate career totals
  const totalApps = player.careerHistory.reduce((acc, s) => acc + s.appearances, 0) + player.seasonStats.appearances;
  const totalGoals = player.careerHistory.reduce((acc, s) => acc + s.goals, 0) + player.seasonStats.goals;
  const totalAssists = player.careerHistory.reduce((acc, s) => acc + s.assists, 0) + player.seasonStats.assists;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Ballon d'Or Prestige Showcase Banner */}
      <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border border-amber-600/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-amber-400" />
            The Ultimate Individual Glory
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-serif tracking-tight">
            Ballon d'Or & World Player of the Year
          </h2>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            The pinnacle of world football. Awarded annually by France Football to the supreme individual talent on Earth. Win major trophies and score in clutch finals to claim the golden sphere.
          </p>
          <div className="text-xs text-amber-300 font-mono pt-1">
            Current Candidate Eligibility Status: {player.overallRating >= 88 ? '★ ELITE GLOBAL CONTENDER' : player.overallRating >= 82 ? 'POTENTIAL SHORTLIST NOMINEE' : 'DEVELOPING PRODIGY'}
          </div>
        </div>

        {/* Golden Ball Trophy Plinth Representation */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 shadow-2xl shadow-yellow-500/30 flex items-center justify-center shrink-0 border-4 border-yellow-300/60 transform hover:scale-105 transition-transform">
          <Trophy className="w-16 h-16 text-amber-950 drop-shadow-md" />
        </div>
      </div>

      {/* Career Ledger Milestones */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Career Matches</div>
          <div className="text-3xl font-black text-white font-mono mt-1">{totalApps}</div>
        </div>
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Career Goals</div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">{totalGoals}</div>
        </div>
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Career Assists</div>
          <div className="text-3xl font-black text-amber-400 font-mono mt-1">{totalAssists}</div>
        </div>
        <div className="p-5 bg-slate-900 rounded-xl border border-slate-800 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Senior National Caps</div>
          <div className="text-3xl font-black text-blue-400 font-mono mt-1">{player.nationalTeamCaps}</div>
        </div>
      </div>

      {/* Silverware & Trophy Cabinet */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Silverware & Trophies Won
          </h3>
          <span className="text-xs text-slate-400">
            {player.trophyCabinet.length} Titles Acquired
          </span>
        </div>

        {player.trophyCabinet.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-950 rounded-xl border border-slate-850">
            Cabinet awaiting first major championship trophy. Lead your club to league or cup glory!
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {player.trophyCabinet.map((t, idx) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-amber-600/30 text-center space-y-2">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-bold text-white text-xs">{t.name}</div>
                <div className="text-[11px] text-slate-400">{t.club} · {t.year}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Historical Ledger by Year */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Season-by-Season Career Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Season</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Club</th>
                <th className="py-2.5 px-3 text-center">Apps</th>
                <th className="py-2.5 px-3 text-center">Goals</th>
                <th className="py-2.5 px-3 text-center">Assists</th>
                <th className="py-2.5 px-3 text-center">Avg Rating</th>
                <th className="py-2.5 px-3">Honors Won</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {/* Current Season */}
              <tr className="bg-emerald-950/20 text-emerald-200">
                <td className="py-2.5 px-3 font-bold">{player.currentYear} (In Progress)</td>
                <td className="py-2.5 px-3">{player.age}</td>
                <td className="py-2.5 px-3 font-sans font-bold text-white">Current Club</td>
                <td className="py-2.5 px-3 text-center">{player.seasonStats.appearances}</td>
                <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{player.seasonStats.goals}</td>
                <td className="py-2.5 px-3 text-center text-amber-400">{player.seasonStats.assists}</td>
                <td className="py-2.5 px-3 text-center font-bold">{player.seasonStats.avgRating || '—'}</td>
                <td className="py-2.5 px-3 font-sans text-slate-400 italic">Campaign ongoing</td>
              </tr>

              {/* Past Seasons */}
              {player.careerHistory.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-850">
                  <td className="py-2.5 px-3 text-slate-400">{s.year}</td>
                  <td className="py-2.5 px-3 text-slate-400">{s.age}</td>
                  <td className="py-2.5 px-3 font-sans font-medium text-white">{s.clubName}</td>
                  <td className="py-2.5 px-3 text-center">{s.appearances}</td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-400">{s.goals}</td>
                  <td className="py-2.5 px-3 text-center text-amber-400">{s.assists}</td>
                  <td className="py-2.5 px-3 text-center">{s.avgRating.toFixed(1)}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    {s.trophies.length > 0 ? s.trophies.join(', ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
