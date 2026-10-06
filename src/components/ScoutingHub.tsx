import React, { useState } from 'react';
import { Club, Player, ScoutReport } from '../types/game';
import { generateScoutReports } from '../data/scoutGenerator';
import { 
  GLOBAL_YOUTH_PROSPECTS, 
  GlobalScoutProspect, 
  GLOBAL_LEAGUE_STANDINGS 
} from '../data/globalScoutingData';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Radar, Eye, CheckCircle2, AlertTriangle, ArrowUpRight, 
  Sparkles, Award, TrendingUp, Building2, MapPin, Send, 
  Globe, Users, Search, Bookmark, BookmarkCheck, BarChart3, Star, Shield 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScoutingHubProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onInitiateTransferTalks?: (scoutReport: ScoutReport) => void;
}

export const ScoutingHub: React.FC<ScoutingHubProps> = ({
  player,
  club,
  onUpdatePlayer,
}) => {
  const currency = player.preferredCurrency || 'GBP';
  const reports = player.scoutReports || generateScoutReports(player, club);

  // Sub-Navigation within Scouting Hub
  const [activeScoutTab, setActiveScoutTab] = useState<'market_interest' | 'global_network' | 'standings'>('market_interest');
  
  // Market Interest selection
  const [selectedReportId, setSelectedReportId] = useState<string>(reports[0]?.id || '');
  const [scoutNotice, setScoutNotice] = useState<string | null>(null);

  // Global Network state
  const [networkFilter, setNetworkFilter] = useState<'ALL' | 'Youth Wonderkid' | 'Transfer-Listed' | 'Contract Expiring'>('ALL');
  const [selectedProspectId, setSelectedProspectId] = useState<string>(GLOBAL_YOUTH_PROSPECTS[0]?.id || '');
  const [trackedProspectIds, setTrackedProspectIds] = useState<string[]>(['prospect_lamine']);

  // Standings state
  const [selectedLeagueStandings, setSelectedLeagueStandings] = useState<string>(club.league || 'Nigeria Premier Football League (NPFL)');

  const selectedReport = reports.find(r => r.id === selectedReportId) || reports[0];
  const selectedProspect = GLOBAL_YOUTH_PROSPECTS.find(p => p.id === selectedProspectId) || GLOBAL_YOUTH_PROSPECTS[0];

  const filteredProspects = GLOBAL_YOUTH_PROSPECTS.filter(p => {
    if (networkFilter === 'ALL') return true;
    return p.status === networkFilter;
  });

  const handleInviteScoutToMatch = (report: ScoutReport) => {
    sounds.playClick();
    setScoutNotice(`Official VIP Director's Box credentials dispatched to ${report.scoutName} for your upcoming gameweek fixture!`);
  };

  const handleToggleTrackProspect = (prospect: GlobalScoutProspect) => {
    sounds.playClick();
    if (trackedProspectIds.includes(prospect.id)) {
      setTrackedProspectIds(prev => prev.filter(id => id !== prospect.id));
      setScoutNotice(`Removed ${prospect.name} from your global tracking radar.`);
    } else {
      setTrackedProspectIds(prev => [...prev, prospect.id]);
      setScoutNotice(`Now tracking ${prospect.name} (${prospect.clubName}). Weekly scout progress updates pinned!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scouting Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              <Radar className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
              Global Recruitment & Intelligence Network
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Scouting & Global Transfer Radar
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time transfer market interest from world clubs, intelligence reports on potential moves, tracking global wonderkids, and live league tables.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 shrink-0 text-right space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Transfer Valuation</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {formatCurrency(player.marketValue, currency)}
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Scouting Interest: <strong className="text-white">{reports.length} Elite Clubs</strong>
            </span>
          </div>
        </div>

        {/* Sub-Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => { sounds.playClick(); setActiveScoutTab('market_interest'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScoutTab === 'market_interest'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Transfer Market Interest & Grades</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveScoutTab('global_network'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScoutTab === 'global_network'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Scouting Network (Youth & Targets)</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveScoutTab('standings'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeScoutTab === 'standings'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white bg-slate-950/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Global League Standings</span>
          </button>
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

      {/* ========================================================= */}
      {/* VIEW 1: TRANSFER MARKET INTEREST & SCOUT GRADES */}
      {/* ========================================================= */}
      {activeScoutTab === 'market_interest' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Clubs Scouting Player */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
              Clubs Actively In The Stands
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

          {/* Right Column: Dossier Detail */}
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
                      Chief Scout: <strong className="text-slate-200">{selectedReport.scoutName}</strong> · {selectedReport.dateWatched}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Scout Grade</span>
                  <span className="text-xl font-black text-emerald-400 font-mono">
                    GRADE {selectedReport.interestGrade}
                  </span>
                </div>
              </div>

              {/* Projected Transfer Valuation Terms */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Projected Transfer Bid</span>
                  <span className="text-base font-black text-white font-mono mt-0.5 block">
                    {formatCurrency(selectedReport.projectedFee, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Proposed Weekly Wage</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                    {formatCurrency(selectedReport.projectedWage, currency)} / wk
                  </span>
                </div>
              </div>

              {/* Scout's Tactical Verdict */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Confidential Scout Verdict
                </span>
                <p className="text-xs text-slate-200 leading-relaxed p-4 bg-slate-950/70 rounded-2xl border border-slate-850 italic">
                  "{selectedReport.scoutVerdict}"
                </p>
              </div>

              {/* Strengths & Development Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 space-y-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Highlighted
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
                    <AlertTriangle className="w-3.5 h-3.5" /> Scout Reservations
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

              {/* Action Button */}
              <button
                onClick={() => handleInviteScoutToMatch(selectedReport)}
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Issue Official VIP Credentials to {selectedReport.clubName}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: GLOBAL SCOUTING NETWORK (YOUTH PROSPECTS & TARGETS) */}
      {/* ========================================================= */}
      {activeScoutTab === 'global_network' && (
        <div className="space-y-6">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['ALL', 'Youth Wonderkid', 'Transfer-Listed', 'Contract Expiring'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => { sounds.playClick(); setNetworkFilter(filter); }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  networkFilter === filter
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {filter === 'ALL' ? 'All Global Targets' : filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Prospects Catalog List */}
            <div className="lg:col-span-5 space-y-2.5">
              {filteredProspects.map(prospect => {
                const isSelected = prospect.id === selectedProspectId;
                const isTracked = trackedProspectIds.includes(prospect.id);
                return (
                  <div
                    key={prospect.id}
                    onClick={() => { sounds.playClick(); setSelectedProspectId(prospect.id); }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/40 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{prospect.name}</span>
                        <span className="text-[10px] bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded font-mono font-bold">
                          {prospect.position} · {prospect.age}y
                        </span>
                        {isTracked && (
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            TRACKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {prospect.clubName} ({prospect.league})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black font-mono text-emerald-400">
                        {prospect.overallRating} → {prospect.potentialRating} POT
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        {formatCurrency(prospect.marketValueGBP, currency)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Tactical Compatibility & Scout Dossier */}
            {selectedProspect && (
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-white">{selectedProspect.name}</h3>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-800">
                        {selectedProspect.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedProspect.clubName} ({selectedProspect.clubCountry}) · Age {selectedProspect.age} · Nat: {selectedProspect.nationality}
                    </p>
                  </div>

                  <button
                    onClick={() => handleToggleTrackProspect(selectedProspect)}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      trackedProspectIds.includes(selectedProspect.id)
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {trackedProspectIds.includes(selectedProspect.id) ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tracking Active</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>Track Target</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Ratings & Synergy Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Overall</span>
                    <span className="text-xl font-black text-white font-mono mt-0.5 block">{selectedProspect.overallRating}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Projected Potential</span>
                    <span className="text-xl font-black text-emerald-400 font-mono mt-0.5 block">{selectedProspect.potentialRating}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-2xl border border-slate-850">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Tactical Synergy</span>
                    <span className="text-xl font-black text-blue-400 font-mono mt-0.5 block">{selectedProspect.tacticalCompatibilityPercent}%</span>
                  </div>
                </div>

                {/* Tactical Compatibility Analysis */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Tactical Compatibility with Your Playstyle
                  </span>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs text-slate-200 leading-relaxed italic">
                    "{selectedProspect.compatibilityVerdict}"
                  </div>
                </div>

                {/* Valuation & Wage Bar */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 rounded-2xl border border-slate-850 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Estimated Valuation</span>
                    <span className="text-base font-black text-white font-mono mt-0.5 block">
                      {formatCurrency(selectedProspect.marketValueGBP, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Wage Expectations</span>
                    <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
                      {formatCurrency(selectedProspect.weeklyWageGBP, currency)} / wk
                    </span>
                  </div>
                </div>

                {/* Strengths & Scouting Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-850 space-y-1.5">
                    <span className="font-bold text-emerald-400 uppercase block tracking-wider text-[11px]">Key Technical Traits</span>
                    {selectedProspect.keyStrengths.map((str, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1.5">
                        <span className="text-emerald-400">•</span>
                        <span>{str}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-850 space-y-1.5">
                    <span className="font-bold text-amber-400 uppercase block tracking-wider text-[11px]">Developmental Focus</span>
                    {selectedProspect.developmentNotes.map((note, i) => (
                      <div key={i} className="text-slate-300 flex items-start gap-1.5">
                        <span className="text-amber-400">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 3: GLOBAL LEAGUE STANDINGS */}
      {/* ========================================================= */}
      {activeScoutTab === 'standings' && (
        <div className="space-y-6">
          {/* League Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {Object.keys(GLOBAL_LEAGUE_STANDINGS).map(leagueKey => (
              <button
                key={leagueKey}
                onClick={() => { sounds.playClick(); setSelectedLeagueStandings(leagueKey); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedLeagueStandings === leagueKey
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {leagueKey}
              </button>
            ))}
          </div>

          {/* Standings Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">{selectedLeagueStandings}</h3>
                <span className="text-xs text-slate-400 font-mono">Current Season Gameweek Standing</span>
              </div>
              <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full font-mono font-bold">
                Live Data Link
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                    <th className="py-3 px-4">Pos</th>
                    <th className="py-3 px-4">Club</th>
                    <th className="py-3 px-3 text-center">PL</th>
                    <th className="py-3 px-3 text-center">W</th>
                    <th className="py-3 px-3 text-center">D</th>
                    <th className="py-3 px-3 text-center">L</th>
                    <th className="py-3 px-3 text-center">GD</th>
                    <th className="py-3 px-4 text-center font-bold text-white">PTS</th>
                    <th className="py-3 px-4 text-center">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {(GLOBAL_LEAGUE_STANDINGS[selectedLeagueStandings] || GLOBAL_LEAGUE_STANDINGS['Premier League']).map(row => {
                    const isPlayerClub = row.clubName === club.name || row.shortName === club.shortName;
                    return (
                      <tr 
                        key={row.position}
                        className={`transition-colors ${
                          isPlayerClub 
                            ? 'bg-emerald-950/40 font-bold text-emerald-300' 
                            : 'hover:bg-slate-850/50 text-slate-300'
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold">
                          <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center text-xs ${
                            row.position <= 4 
                              ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                              : 'text-slate-400'
                          }`}>
                            {row.position}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                          <span>{row.clubName}</span>
                          {isPlayerClub && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-bold">
                              YOUR CLUB
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-center text-slate-400">{row.played}</td>
                        <td className="py-3.5 px-3 text-center text-slate-300">{row.won}</td>
                        <td className="py-3.5 px-3 text-center text-slate-400">{row.drawn}</td>
                        <td className="py-3.5 px-3 text-center text-slate-400">{row.lost}</td>
                        <td className="py-3.5 px-3 text-center text-slate-300 font-bold">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-400 text-sm">{row.points}</td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {row.form.map((f, fIdx) => (
                              <span 
                                key={fIdx} 
                                className={`w-4 h-4 rounded text-[9px] font-black inline-flex items-center justify-center ${
                                  f === 'W' 
                                    ? 'bg-emerald-500 text-slate-950' 
                                    : f === 'D' 
                                    ? 'bg-amber-500 text-slate-950' 
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
