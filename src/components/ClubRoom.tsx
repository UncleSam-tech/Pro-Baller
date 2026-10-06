import React, { useState } from 'react';
import { Club, ContractClauses, Player, SquadRole } from '../types/game';
import { MedicalCenter } from './MedicalCenter';
import { TransferMarket } from './TransferMarket';
import { AgentTerminal } from './AgentTerminal';
import { ScoutingHub } from './ScoutingHub';
import { generateProContract, evaluateCounterOffer } from '../utils/contractGenerator';
import { generateNewsFeed } from '../data/newsFeed';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { calculateTaxBreakdown } from '../utils/taxResidency';
import { 
  AlertTriangle, ArrowRight, ArrowRightLeft, Award, Briefcase, CheckCircle, Clock, DollarSign, 
  FileCheck, FileText, Heart, Newspaper, PenTool, Radar, Shield, ShieldAlert, Sparkles, 
  Stethoscope, Terminal, ThumbsUp, TrendingUp, UserCheck, Users, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ClubRoomProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onSignContract: (contract: ContractClauses) => void;
  onReviewOfferContract: (offeringClub: Club, proposedContract: ContractClauses) => void;
  onRequestTransfer: () => void;
  onRequestLoan: () => void;
  initialTab?: 'contract' | 'medical' | 'transfers' | 'scouting' | 'agent' | 'news';
  onTabChange?: (tab: 'contract' | 'medical' | 'transfers' | 'scouting' | 'agent' | 'news') => void;
}

export const ClubRoom: React.FC<ClubRoomProps> = ({
  player,
  club,
  onUpdatePlayer,
  onSignContract,
  onReviewOfferContract,
  onRequestTransfer,
  onRequestLoan,
  initialTab = 'contract',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'contract' | 'medical' | 'transfers' | 'scouting' | 'agent' | 'news'>(initialTab);

  React.useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  const handleSwitchTab = (tab: 'contract' | 'medical' | 'transfers' | 'scouting' | 'agent' | 'news') => {
    sounds.playClick();
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Multi-Stage Negotiation State
  // Stage 1: 'board_offer' (Club presents initial renewal / transfer proposal)
  // Stage 2: 'bargaining_table' (Interactive clause counter-negotiation with director)
  // Stage 3: 'signing_ceremony' (Formal contract execution, signature, press release)
  const [negotiationStage, setNegotiationStage] = useState<'board_offer' | 'bargaining_table' | 'signing_ceremony'>('board_offer');
  
  // Contract proposal states
  const [initialOffer, setInitialOffer] = useState<ContractClauses>(() => {
    return generateProContract(club, player);
  });
  const [proposedTerms, setProposedTerms] = useState<ContractClauses>(() => {
    return generateProContract(club, player);
  });
  const [activeNegotiationTab, setActiveNegotiationTab] = useState<'wage_role' | 'signing_loyalty' | 'performance_bonuses' | 'release_clauses'>('wage_role');

  // Board patience & dialogue
  const [boardPatience, setBoardPatience] = useState<number>(club.managerPatience || 75);
  const [directorDialogue, setDirectorDialogue] = useState<string>(
    `"${club.managerName} and the board hold you in high esteem. We have prepared an ambitious contract package tailored to your potential. Let's see if we can reach an agreement."`
  );
  const [negotiationNotice, setNegotiationNotice] = useState<string | null>(null);
  const [negotiationOutcome, setNegotiationOutcome] = useState<'PENDING' | 'ACCEPTED' | 'WALKOUT'>('PENDING');
  const [signatureText, setSignatureText] = useState('');
  const [isSigned, setIsSigned] = useState(false);

  const currency = player.preferredCurrency || 'GBP';
  const newsArticles = generateNewsFeed(player, club);

  // Reset or start new negotiation round
  const handleStartNegotiations = () => {
    sounds.playClick();
    const freshOffer = generateProContract(club, player);
    setInitialOffer(freshOffer);
    setProposedTerms(freshOffer);
    setBoardPatience(club.managerPatience || 75);
    setNegotiationOutcome('PENDING');
    setNegotiationStage('bargaining_table');
    setDirectorDialogue(`"${club.name}'s board is listening. What adjustments are your agency requesting?"`);
    setNegotiationNotice(null);
  };

  // Submit counter-offer to board
  const handleSubmitCounterOffer = () => {
    sounds.playClick();
    const result = evaluateCounterOffer(club, player, initialOffer, proposedTerms, boardPatience);
    setBoardPatience(result.newPatience);
    setDirectorDialogue(`"${result.message}"`);

    if (result.outcome === 'ACCEPTED') {
      sounds.playFanfare();
      setNegotiationOutcome('ACCEPTED');
      setNegotiationNotice('The Board has formally accepted your terms! Advance to the signing room.');
      setTimeout(() => {
        setNegotiationStage('signing_ceremony');
      }, 1500);
    } else if (result.outcome === 'REJECTED_WALKOUT') {
      sounds.playWhistle();
      setNegotiationOutcome('WALKOUT');
      setNegotiationNotice('TALKS COLLAPSED: The Sporting Director has ended contract negotiations for this window.');
    } else if (result.outcome === 'COUNTERED' && result.revisedOffer) {
      setProposedTerms(result.revisedOffer);
      setNegotiationNotice('The club countered your proposal with a revised compromise.');
    }
  };

  // Accept current position directly
  const handleAcceptCurrentOffer = () => {
    sounds.playFanfare();
    setNegotiationOutcome('ACCEPTED');
    setNegotiationStage('signing_ceremony');
  };

  // Execute formal signing
  const handleFormalSign = () => {
    sounds.playPenScratch();
    setIsSigned(true);
    setSignatureText(`${player.firstName} ${player.lastName}`);

    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
      colors: [club.primaryColor, club.secondaryColor || '#F59E0B', '#10B981'],
    });

    // Credit signing bonus into player bank balance and update contract
    const updatedBalance = player.bankBalance + proposedTerms.signingBonus;
    const updatedPlayer: Player = {
      ...player,
      bankBalance: updatedBalance,
      totalCareerEarnings: player.totalCareerEarnings + proposedTerms.signingBonus,
      currentContract: proposedTerms,
      squadRole: proposedTerms.squadRole,
      managerTrust: Math.min(100, player.managerTrust + 8),
      morale: 100,
    };

    setTimeout(() => {
      onUpdatePlayer(updatedPlayer);
      onSignContract(proposedTerms);
      setNegotiationNotice(`CONTRACT OFFICIALLY RATIFIED! £${proposedTerms.signingBonus.toLocaleString()} signing bonus credited to your bank account.`);
    }, 1200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Window Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-inner border border-white/20"
            style={{ backgroundColor: club.primaryColor }}
          >
            {club.shortName}
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              {club.name} Club Boardroom & Operations
            </h2>
            <div className="text-xs text-slate-400">
              Executive Negotiations · Medical Department · Transfers · Media Wire
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
          <button
            onClick={() => handleSwitchTab('contract')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contract'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Contracts & Negotiations
          </button>

          <button
            onClick={() => handleSwitchTab('medical')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'medical'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            Medical & Injuries
          </button>

          <button
            onClick={() => handleSwitchTab('transfers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer Market
          </button>

          <button
            onClick={() => handleSwitchTab('scouting')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'scouting'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            Scouting & Radar
          </button>

          <button
            onClick={() => handleSwitchTab('agent')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Agent Terminal
          </button>

          <button
            onClick={() => handleSwitchTab('news')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'news'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Live News Wire
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: CONTRACTS & MULTI-STAGE BOARDROOM NEGOTIATIONS */}
      {/* ======================================================== */}
      {activeTab === 'contract' && (
        <div className="space-y-6">
          {/* Multi-Stage Stepper Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Stage {negotiationStage === 'board_offer' ? '1: Board Proposal' : negotiationStage === 'bargaining_table' ? '2: Interactive Bargaining' : '3: Formal Signing & Press Release'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className={`px-2.5 py-1 rounded-lg font-bold ${negotiationStage === 'board_offer' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                1. Initial Terms
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${negotiationStage === 'bargaining_table' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                2. Multi-Clause Bargaining
              </span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded-lg font-bold ${negotiationStage === 'signing_ceremony' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                3. Executive Signing
              </span>
            </div>
          </div>

          {negotiationNotice && (
            <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{negotiationNotice}</span>
              </div>
              <button onClick={() => setNegotiationNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STAGE 1: BOARD PROPOSAL PRESENTATION */}
          {/* ---------------------------------------------------- */}
          {negotiationStage === 'board_offer' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Current Active Contract Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    Current Registered Contract
                  </h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    Active
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Weekly Base Wage:</span>
                    <span className="font-bold font-mono text-white">{formatCurrency(player.currentContract.weeklyWage, currency)}/wk</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Contract Expiry:</span>
                    <span className="font-bold text-amber-400">{player.currentContract.expiryYear} ({player.currentContract.expiryYear - player.currentYear} yrs left)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Squad Role Status:</span>
                    <span className="font-bold text-white">{player.currentContract.squadRole}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Release Clause:</span>
                    <span className="font-bold font-mono text-white">
                      {player.currentContract.minimumReleaseClause > 0 
                        ? formatCurrency(player.currentContract.minimumReleaseClause, currency) 
                        : 'None (Club Locked)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Goal / Clean Sheet Bonus:</span>
                    <span className="font-bold font-mono text-emerald-400">+{formatCurrency(player.currentContract.goalBonus, currency)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Agent Representation:</span>
                    <span className="font-bold text-slate-300">{player.currentContract.agentName}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleStartNegotiations}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <PenTool className="w-4 h-4" />
                    Enter Boardroom Contract Negotiations
                  </button>
                </div>
              </div>

              {/* Right Column: New Proposed Package Breakdown */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
                    <Award className="w-4 h-4 text-amber-400" />
                    New Terms Prepared by {club.name}
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Official Pro Contract Extension Offer
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {club.name}'s Sporting Director and Board have formulated this upgraded extension package based on your {player.overallRating} OVR standing.
                  </p>
                </div>

                {/* Director Quote Box */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 italic text-xs text-slate-300 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-950 flex items-center justify-center text-amber-400 font-bold shrink-0">
                    👔
                  </div>
                  <div>
                    <div className="font-bold text-amber-400 not-italic">Sporting Director Boardroom Stance:</div>
                    <p className="mt-1">{directorDialogue}</p>
                  </div>
                </div>

                {/* Key Clauses Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Weekly Base Wage</span>
                    <strong className="text-base font-black font-mono text-emerald-400 mt-1 block">
                      {formatCurrency(initialOffer.weeklyWage, currency)}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      +{(Math.round(((initialOffer.weeklyWage - player.currentContract.weeklyWage) / player.currentContract.weeklyWage) * 100))}% bump
                    </span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Signing Bonus</span>
                    <strong className="text-base font-black font-mono text-white mt-1 block">
                      {formatCurrency(initialOffer.signingBonus, currency)}
                    </strong>
                    <span className="text-[10px] text-emerald-400">Immediate Upfront</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Release Clause</span>
                    <strong className="text-base font-black font-mono text-amber-400 mt-1 block">
                      {formatCurrency(initialOffer.minimumReleaseClause, currency)}
                    </strong>
                    <span className="text-[10px] text-slate-500">Buyout protection</span>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration</span>
                    <strong className="text-base font-black text-white mt-1 block">
                      {initialOffer.contractYears} Seasons
                    </strong>
                    <span className="text-[10px] text-slate-500">Expires {initialOffer.expiryYear}</span>
                  </div>
                </div>

                {/* Secondary Incentive Clauses */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white mb-2">Performance & Competition Clauses:</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-400">
                    <div>• Goal Bonus: <strong className="text-white font-mono">{formatCurrency(initialOffer.goalBonus, currency)}</strong></div>
                    <div>• Assist Bonus: <strong className="text-white font-mono">{formatCurrency(initialOffer.assistBonus, currency)}</strong></div>
                    <div>• Appearance Fee: <strong className="text-white font-mono">{formatCurrency(initialOffer.appearanceBonus, currency)}</strong></div>
                    <div>• UCL Win Bonus: <strong className="text-emerald-400 font-mono">{formatCurrency(initialOffer.championsLeagueBonus, currency)}</strong></div>
                    <div>• Ballon d'Or Clause: <strong className="text-amber-400 font-mono">{formatCurrency(initialOffer.ballonDorBonus, currency)}</strong></div>
                    <div>• Annual Loyalty: <strong className="text-white font-mono">{formatCurrency(initialOffer.loyaltyBonusAnnual, currency)}/yr</strong></div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleStartNegotiations}
                    className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PenTool className="w-4 h-4" />
                    Enter Bargaining Table (Counter Terms)
                  </button>

                  <button
                    onClick={handleAcceptCurrentOffer}
                    className="py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept Terms As Offered
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STAGE 2: INTERACTIVE BARGAINING & CLAUSE NEGOTIATION */}
          {/* ---------------------------------------------------- */}
          {negotiationStage === 'bargaining_table' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              {/* Boardroom Tension & Patience Gauge */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                    👔
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{club.name} Boardroom Committee</div>
                    <div className="text-[11px] text-slate-400 italic mt-0.5">{directorDialogue}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Board Patience</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${boardPatience > 50 ? 'bg-emerald-400' : boardPatience > 25 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                          style={{ width: `${boardPatience}%` }} 
                        />
                      </div>
                      <span className="font-mono font-bold text-xs text-white">{boardPatience}%</span>
                    </div>
                  </div>

                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[10px] text-slate-300">
                    Agent Fee: <strong className="text-emerald-400">{initialOffer.agentFeePercent}%</strong>
                  </div>
                </div>
              </div>

              {/* Sub-Tabs for Negotiation Clauses */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto scrollbar-none">
                {[
                  { id: 'wage_role', label: '1. Basic Wage & Role' },
                  { id: 'signing_loyalty', label: '2. Signing Bonus & Loyalty' },
                  { id: 'performance_bonuses', label: '3. Performance Incentives' },
                  { id: 'release_clauses', label: '4. Release & Escape Clauses' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { sounds.playClick(); setActiveNegotiationTab(tab.id as any); }}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      activeNegotiationTab === tab.id
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: BASIC WAGE & SQUAD ROLE */}
              {activeNegotiationTab === 'wage_role' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wage Slider */}
                  <div className="space-y-4 p-5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white">Desired Weekly Wage</label>
                      <span className="font-mono font-black text-emerald-400 text-lg">
                        {formatCurrency(proposedTerms.weeklyWage, currency)}/wk
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(initialOffer.weeklyWage * 0.7)}
                      max={Math.round(initialOffer.weeklyWage * 1.8)}
                      step={500}
                      value={proposedTerms.weeklyWage}
                      onChange={e => setProposedTerms({ ...proposedTerms, weeklyWage: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Low: {formatCurrency(Math.round(initialOffer.weeklyWage * 0.7), currency)}</span>
                      <span>Offered: {formatCurrency(initialOffer.weeklyWage, currency)}</span>
                      <span>High: {formatCurrency(Math.round(initialOffer.weeklyWage * 1.8), currency)}</span>
                    </div>
                    {(() => {
                      const taxEst = calculateTaxBreakdown(club, proposedTerms.weeklyWage, proposedTerms.agentFeePercent || 5);
                      return (
                        <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1 text-[11px] mt-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Annual Gross:</span>
                            <span className="font-bold text-white font-mono">{formatCurrency(proposedTerms.weeklyWage * 52, currency)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tax Residency ({club.country} · {taxEst.taxAuthorityShort}):</span>
                            <span className={`font-bold font-mono ${taxEst.isTaxFreeHaven ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {taxEst.isTaxFreeHaven ? '0% Tax Haven (100% Net Take-Home)' : `-${formatCurrency(taxEst.taxDeductedWeekly, currency)}/wk (${taxEst.effectiveRatePercent}%)`}
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                            <span className="text-slate-300">Estimated Net Weekly Wage:</span>
                            <span className="text-emerald-400 font-mono">+{formatCurrency(taxEst.netWeeklyWage, currency)}/wk</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Contract Duration & Role */}
                  <div className="space-y-4 p-5 bg-slate-950 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-xs font-bold text-white block mb-1">Contract Duration</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map(yrs => (
                          <button
                            key={yrs}
                            onClick={() => setProposedTerms({ 
                              ...proposedTerms, 
                              contractYears: yrs, 
                              expiryYear: player.currentYear + yrs 
                            })}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                              proposedTerms.contractYears === yrs
                                ? 'bg-amber-600 border-amber-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {yrs} yr{yrs > 1 ? 's' : ''}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="text-xs font-bold text-white block mb-1">Guaranteed Squad Status</label>
                      <select
                        value={proposedTerms.squadRole}
                        onChange={e => setProposedTerms({ ...proposedTerms, squadRole: e.target.value as SquadRole })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white"
                      >
                        <option value="Crucial First Team">Crucial First Team (Guaranteed Starter)</option>
                        <option value="Key Player">Key Player (Starts Most Matches)</option>
                        <option value="First Team Regular">First Team Regular</option>
                        <option value="Squad Rotation">Squad Rotation</option>
                        <option value="Future Star">Future Star (Cup & Substitute Focus)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SIGNING BONUS & LOYALTY INCENTIVES */}
              {activeNegotiationTab === 'signing_loyalty' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Signing-On Fee */}
                  <div className="space-y-4 p-5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white">Upfront Signing-On Cash Bonus</label>
                      <span className="font-mono font-black text-amber-400 text-base">
                        {formatCurrency(proposedTerms.signingBonus, currency)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(initialOffer.signingBonus * 0.5)}
                      max={Math.round(initialOffer.signingBonus * 2.2)}
                      step={5000}
                      value={proposedTerms.signingBonus}
                      onChange={e => setProposedTerms({ ...proposedTerms, signingBonus: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      Paid directly to your private bank account upon contract execution.
                    </p>
                  </div>

                  {/* Annual Loyalty & Escalation */}
                  <div className="space-y-4 p-5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white">Annual Loyalty Payout</label>
                      <span className="font-mono font-black text-emerald-400 text-base">
                        {formatCurrency(proposedTerms.loyaltyBonusAnnual, currency)}/yr
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(initialOffer.loyaltyBonusAnnual * 0.5)}
                      max={Math.round(initialOffer.loyaltyBonusAnnual * 2.0)}
                      step={5000}
                      value={proposedTerms.loyaltyBonusAnnual}
                      onChange={e => setProposedTerms({ ...proposedTerms, loyaltyBonusAnnual: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Annual Wage Escalation:</span>
                      <strong className="text-white font-mono">+{proposedTerms.wageIncreasePerYearPercent}% per season</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PERFORMANCE BONUSES */}
              {activeNegotiationTab === 'performance_bonuses' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-bold block">Goal / Clean Sheet Bonus</span>
                    <strong className="text-base font-black font-mono text-emerald-400 block">
                      {formatCurrency(proposedTerms.goalBonus, currency)}
                    </strong>
                    <input
                      type="range"
                      min={Math.round(initialOffer.goalBonus * 0.5)}
                      max={Math.round(initialOffer.goalBonus * 2.0)}
                      step={250}
                      value={proposedTerms.goalBonus}
                      onChange={e => setProposedTerms({ ...proposedTerms, goalBonus: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-bold block">Assist / Playmaking Bonus</span>
                    <strong className="text-base font-black font-mono text-emerald-400 block">
                      {formatCurrency(proposedTerms.assistBonus, currency)}
                    </strong>
                    <input
                      type="range"
                      min={Math.round(initialOffer.assistBonus * 0.5)}
                      max={Math.round(initialOffer.assistBonus * 2.0)}
                      step={200}
                      value={proposedTerms.assistBonus}
                      onChange={e => setProposedTerms({ ...proposedTerms, assistBonus: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-bold block">Match Win Fee</span>
                    <strong className="text-base font-black font-mono text-emerald-400 block">
                      {formatCurrency(proposedTerms.matchWinBonus, currency)}
                    </strong>
                    <input
                      type="range"
                      min={Math.round(initialOffer.matchWinBonus * 0.5)}
                      max={Math.round(initialOffer.matchWinBonus * 2.0)}
                      step={250}
                      value={proposedTerms.matchWinBonus}
                      onChange={e => setProposedTerms({ ...proposedTerms, matchWinBonus: Number(e.target.value) })}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: RELEASE & ESCAPE CLAUSES */}
              {activeNegotiationTab === 'release_clauses' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Minimum Buyout Release Clause */}
                  <div className="space-y-4 p-5 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-white">Minimum Buyout Release Clause</label>
                      <span className="font-mono font-black text-amber-400 text-base">
                        {formatCurrency(proposedTerms.minimumReleaseClause, currency)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={Math.round(initialOffer.minimumReleaseClause * 0.5)}
                      max={Math.round(initialOffer.minimumReleaseClause * 2.0)}
                      step={1_000_000}
                      value={proposedTerms.minimumReleaseClause}
                      onChange={e => setProposedTerms({ ...proposedTerms, minimumReleaseClause: Number(e.target.value) })}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      If an overseas club bids this exact amount, {club.name} is legally mandated to accept. Lowering it annoys the board.
                    </p>
                  </div>

                  {/* Escape Hatches */}
                  <div className="space-y-3 p-5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                    <div className="font-bold text-white">Contingency Escape Clauses:</div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Non-UCL Qualification Clause:</span>
                      <strong className="text-white font-mono">{formatCurrency(proposedTerms.championsLeagueReleaseClause, currency)}</strong>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-800">
                      <span className="text-slate-400">Relegation Release Fee:</span>
                      <strong className="text-white font-mono">{formatCurrency(proposedTerms.relegationReleaseClause, currency)}</strong>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Relegation Wage Drop:</span>
                      <strong className="text-rose-400 font-mono">-{proposedTerms.wageDropOnRelegationPercent}%</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Counter-Bargaining Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setNegotiationStage('board_offer')}
                  className="py-2.5 px-4 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  ← Return to Overview
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleAcceptCurrentOffer}
                    className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Accept Without Countering
                  </button>

                  <button
                    onClick={handleSubmitCounterOffer}
                    disabled={boardPatience <= 0}
                    className={`py-2.5 px-5 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                      boardPatience > 0 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white active:scale-98' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <PenTool className="w-4 h-4" />
                    Submit Counter-Offer to Board
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* STAGE 3: FORMAL SIGNING CEREMONY & PRESS RELEASE */}
          {/* ---------------------------------------------------- */}
          {negotiationStage === 'signing_ceremony' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
              <div className="text-center space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                  <CheckCircle className="w-4 h-4" />
                  Official Executive Execution
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-white">
                  Contract Ratification & Press Announcement
                </h3>
                <p className="text-xs text-slate-400 max-w-xl mx-auto">
                  Terms ratified by {club.name} Board of Directors and Registered Legal Representatives under FIFA RSTP Form 104-B.
                </p>
              </div>

              {/* The Legal Summary Parchment */}
              <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs uppercase font-mono font-bold text-slate-400">Player Employment Accord</div>
                    <div className="text-base font-black text-white mt-0.5">{player.firstName} {player.lastName} ✕ {club.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Term Duration</div>
                    <div className="font-bold text-white text-xs">{proposedTerms.startYear} – {proposedTerms.expiryYear} ({proposedTerms.contractYears} yrs)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 text-[10px] block">Weekly Remuneration:</span>
                    <strong className="text-emerald-400 text-sm">{formatCurrency(proposedTerms.weeklyWage, currency)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Upfront Signing Bonus:</span>
                    <strong className="text-white text-sm">{formatCurrency(proposedTerms.signingBonus, currency)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Minimum Release:</span>
                    <strong className="text-amber-400 text-sm">{formatCurrency(proposedTerms.minimumReleaseClause, currency)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">Squad Role:</span>
                    <strong className="text-white text-sm">{proposedTerms.squadRole}</strong>
                  </div>
                </div>

                {/* Digital Signature Pad Area */}
                <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-400">Player Digital Sign-off:</span>
                    {isSigned ? (
                      <div className="font-serif italic font-bold text-xl text-emerald-400 tracking-wider">
                        {signatureText} ✍️
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 font-mono italic">
                        [Signature required to execute agreement]
                      </div>
                    )}
                  </div>

                  {!isSigned ? (
                    <button
                      onClick={handleFormalSign}
                      className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <PenTool className="w-4 h-4" />
                      Sign Official Contract & Collect Bonus
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950 px-4 py-2 rounded-xl border border-emerald-800">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Executed & Registered with FA
                    </div>
                  )}
                </div>
              </div>

              {/* Official Press Release Snippet */}
              {isSigned && (
                <div className="p-5 bg-slate-950/80 rounded-xl border border-emerald-900/50 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Official Club Statement & Media Wire
                  </div>
                  <h4 className="font-black text-sm text-white">
                    CLUB STATEMENT: {player.firstName.toUpperCase()} {player.lastName.toUpperCase()} COMMITS LONG-TERM FUTURE TO {club.name.toUpperCase()}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    "{club.name} is delighted to confirm that {player.firstName} {player.lastName} has signed a new contract extending until {proposedTerms.expiryYear}. Sporting Director: 'He is an invaluable cornerstone of our sporting project. We are proud to reward his dedication.'"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: MEDICAL CENTER & INJURIES */}
      {/* ======================================================== */}
      {activeTab === 'medical' && (
        <MedicalCenter player={player} onUpdatePlayer={onUpdatePlayer} />
      )}

      {/* ======================================================== */}
      {/* SECTION 3: TRANSFER MARKET */}
      {/* ======================================================== */}
      {activeTab === 'transfers' && (
        <TransferMarket
          player={player}
          onReviewOfferContract={onReviewOfferContract}
          onRequestTransfer={onRequestTransfer}
          onRequestLoan={onRequestLoan}
        />
      )}

      {/* ======================================================== */}
      {/* SECTION 4: REAL FOOTBALL NEWS WIRE AGGREGATOR */}
      {/* ======================================================== */}
      {activeTab === 'news' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-widest">
              <Newspaper className="w-4 h-4" />
              The Football Wire · Real-Time Media Aggregator
            </div>
            <h3 className="text-2xl font-black text-white">
              Transfer Radar, Pundit Debates & Official Leaks
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated reports from Fabrizio Romano, The Athletic, Sky Sports Monday Night Football, and continental correspondents.
            </p>
          </div>

          <div className="space-y-3">
            {newsArticles.map(article => (
              <div 
                key={article.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all space-y-3 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{article.source}</span>
                    {article.verified && <span className="text-blue-400 text-xs">✓</span>}
                    <span className="text-[11px] text-slate-400">· {article.author}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{article.timestamp}</span>
                </div>

                {article.badge && (
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60 inline-block">
                    {article.badge}
                  </span>
                )}

                <h4 className="text-sm font-bold text-white leading-snug">
                  {article.headline}
                </h4>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {article.snippet}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
                  <span>❤️ {article.likes.toLocaleString()}</span>
                  <span>🔄 {article.reposts.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 4.5: GLOBAL SCOUTING & TRANSFER RADAR */}
      {/* ======================================================== */}
      {activeTab === 'scouting' && (
        <ScoutingHub
          player={player}
          club={club}
          onUpdatePlayer={onUpdatePlayer}
        />
      )}

      {/* ======================================================== */}
      {/* SECTION 5: AGENT TERMINAL & DIRECT MANDATE COMMS */}
      {/* ======================================================== */}
      {activeTab === 'agent' && (
        <AgentTerminal
          player={player}
          club={club}
          onUpdatePlayer={onUpdatePlayer}
          onStartNegotiationRound={() => {
            setActiveTab('contract');
            handleStartNegotiations();
          }}
          onRequestTransferModal={() => {
            setActiveTab('transfers');
            onRequestTransfer();
          }}
        />
      )}
    </div>
  );
};
