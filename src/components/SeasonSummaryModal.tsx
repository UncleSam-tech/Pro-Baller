import React from 'react';
import { Club, Player } from '../types/game';
import { sounds } from '../utils/soundFx';
import { Award, CheckCircle, Sparkles, Trophy, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SeasonSummaryModalProps {
  player: Player;
  club: Club;
  onProceedToNextSeason: () => void;
}

export const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({
  player,
  club,
  onProceedToNextSeason,
}) => {
  // Check if player won awards
  const isTopScorer = player.seasonStats.goals >= 18;
  const isBallonDorNominee = player.seasonStats.goals + player.seasonStats.assists >= 25 || player.overallRating >= 86;
  const isBallonDorWinner = (player.seasonStats.goals >= 28 && player.overallRating >= 88) || (player.seasonStats.goals >= 32);

  React.useEffect(() => {
    sounds.playFanfare();
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#10B981', '#3B82F6', '#FFFFFF'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl my-8">
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Trophy className="w-4 h-4" />
            Season {player.currentYear} Concluded · Global Gala Awards
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white font-serif tracking-tight">
            Annual European Honors & Gala Ceremony
          </h2>
          <p className="text-xs text-slate-400">
            Review your campaign statistics, domestic titles, and worldwide Ballon d'Or voting rankings.
          </p>
        </div>

        {/* Campaign Numbers */}
        <div className="grid grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-center font-mono text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Appearances</div>
            <div className="text-2xl font-black text-white mt-1">{player.seasonStats.appearances}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Goals</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{player.seasonStats.goals}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Assists</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{player.seasonStats.assists}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-sans font-bold">Avg Rating</div>
            <div className="text-2xl font-black text-blue-400 mt-1">{player.seasonStats.avgRating || '7.1'}</div>
          </div>
        </div>

        {/* Ballon d'Or Worldwide Voting Results Card */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-950 to-amber-950/60 p-5 rounded-xl border border-amber-600/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-sm font-serif">
                France Football · Ballon d'Or 2026 Rankings
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-amber-400 font-mono">100 Global Journalists</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className={`p-2.5 rounded-lg flex items-center justify-between border ${
              isBallonDorWinner 
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold' 
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}>
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold text-amber-400">1st</span>
                <span>{isBallonDorWinner ? `${player.firstName} ${player.lastName} (${club.name})` : 'Kylian Mbappé (Real Madrid)'}</span>
              </div>
              <span className="font-mono text-amber-300 font-bold">642 Pts</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-800 text-slate-300">
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold text-slate-400">2nd</span>
                <span>{!isBallonDorWinner && isBallonDorNominee ? `${player.firstName} ${player.lastName} (${club.name})` : 'Erling Haaland (Manchester City)'}</span>
              </div>
              <span className="font-mono text-slate-400">512 Pts</span>
            </div>

            <div className="p-2.5 bg-slate-900 rounded-lg flex items-center justify-between border border-slate-800 text-slate-300">
              <div className="flex items-center gap-3">
                <span className="w-6 font-mono font-bold text-slate-400">3rd</span>
                <span>Vinícius Júnior (Real Madrid)</span>
              </div>
              <span className="font-mono text-slate-400">485 Pts</span>
            </div>
          </div>

          {isBallonDorWinner && (
            <div className="p-3 bg-amber-500/20 border border-amber-400 rounded-lg text-amber-200 text-xs font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                BALLON D'OR WINNER! Contract clause triggered: +£{player.currentContract.ballonDorBonus.toLocaleString()} payout and permanent wage boost!
              </span>
            </div>
          )}
        </div>

        {/* Proceed to Next Season Action */}
        <div className="text-center pt-2">
          <button
            onClick={onProceedToNextSeason}
            className="py-3 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            Advance to Season {player.currentYear + 1} (Age {player.age + 1})
          </button>
        </div>
      </div>
    </div>
  );
};
