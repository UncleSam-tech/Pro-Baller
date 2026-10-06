import React, { useState } from 'react';
import { Player, Club, ScoutReport } from '../types/game';
import { generateScoutReports } from '../data/scoutGenerator';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Radar, Eye, CheckCircle2, AlertTriangle, ArrowUpRight, 
  Sparkles, Award, TrendingUp, Building2, MapPin, Send
} from 'lucide-react';

interface ScoutSystemProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onInitiateTransferTalks?: (scoutReport: ScoutReport) => void;
}

export const ScoutSystem: React.FC<ScoutSystemProps> = ({
  player,
  club,
  onUpdatePlayer,
  onInitiateTransferTalks,
}) => {
  const currency = player.preferredCurrency || 'GBP';
  const reports = player.scoutReports || generateScoutReports(player, club);

  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [scoutNotice, setScoutNotice] = useState<string | null>(null);

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];

  const handleInviteScoutToMatch = (report: ScoutReport) => {
    sounds.playClick();
    setScoutNotice(`Official VIP Director's Box credentials sent to ${report.scoutName} for your upcoming gameweek fixture!`);
  };

  return (
    <div className="space-y-6">
      {/* Scout System Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              Global Wonderkid Intelligence Network
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              European Scouting Radar & Dossiers
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Elite recruitment directors, technical scouts, and data analysts travel to your matches to evaluate your technical traits, mental resilience, and transfer market valuation.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 shrink-0 text-right space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Active Scout Watch</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {reports.length} Elite Clubs
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Market Val: <strong className="text-white">{formatCurrency(player.marketValue, currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {scoutNotice && (
        <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-2xl text-xs text-blue-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{scoutNotice}</span>
          </div>
          <button onClick={() => setScoutNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* Scout Reports Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List of Scouting Clubs (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
            Clubs Currently Scouting You
          </span>

          <div className="space-y-2.5">
            {reports.map((r) => {
              const isSelected = r.id === selectedReportId;
              return (
                <div
                  key={r.id}
                  onClick={() => { sounds.playClick(); setSelectedReportId(r.id); }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/40 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-slate-950 shadow shrink-0"
                      style={{ backgroundColor: r.clubBadgeColor }}
                    >
                      {r.clubName.substring(0, 3).toUpperCase()}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-white">{r.clubName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {r.clubLeague} · {r.clubCountry}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-xs font-black font-mono px-2 py-0.5 rounded border uppercase ${
                      r.interestGrade === 'A+' 
                        ? 'bg-emerald-950 text-emerald-400 border-emerald-800' 
                        : r.interestGrade === 'A'
                        ? 'bg-blue-950 text-blue-300 border-blue-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {r.interestGrade}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 font-mono">
                      {formatCurrency(r.projectedFee, currency)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Dossier Detail View (7 cols) */}
        {selectedReport && (
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-slate-950 shadow"
                  style={{ backgroundColor: selectedReport.clubBadgeColor }}
                >
                  {selectedReport.clubName.substring(0, 3).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{selectedReport.clubName}</h3>
                  <p className="text-xs text-slate-400">
                    Compiled by: <strong className="text-slate-200">{selectedReport.scoutName}</strong> · {selectedReport.dateWatched}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Interest Rating</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  GRADE {selectedReport.interestGrade}
                </span>
              </div>
            </div>

            {/* Projected Transfer Valuation Terms */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Recommended Transfer Bid</span>
                <span className="text-base font-black text-white font-mono mt-0.5 block">
                  {formatCurrency(selectedReport.projectedFee, currency)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Projected Starting Wage</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                  {formatCurrency(selectedReport.projectedWage, currency)} / wk
                </span>
              </div>
            </div>

            {/* Scout's Tactical Verdict */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Official Scouting Verdict
              </span>
              <p className="text-xs text-slate-200 leading-relaxed p-4 bg-slate-950/70 rounded-2xl border border-slate-850 italic">
                "{selectedReport.scoutVerdict}"
              </p>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Identified
                </span>
                <div className="space-y-1.5">
                  {selectedReport.pros.map((pro, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{pro}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Developmental Notes
                </span>
                <div className="space-y-1.5">
                  {selectedReport.cons.map((con, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <span className="text-amber-400">•</span>
                      <span>{con}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => handleInviteScoutToMatch(selectedReport)}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Issue Matchday VIP Credentials to {selectedReport.clubName}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
