import React, { useState } from 'react';
import { Club, ContractClauses, Player, AgentMessage, AgencyRepresentation } from '../types/game';
import { FOOTBALL_AGENCIES } from '../data/agentAgenciesData';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { calculateTaxBreakdown } from '../utils/taxResidency';
import { 
  Terminal, Send, ShieldCheck, Briefcase, TrendingUp, AlertTriangle, 
  ArrowRightLeft, Sparkles, MessageSquare, CheckCircle, RefreshCw, UserCheck, 
  DollarSign, Globe, Award, ChevronRight, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AgentTerminalProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onStartNegotiationRound?: () => void;
  onRequestTransferModal?: () => void;
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({
  player,
  club,
  onUpdatePlayer,
  onStartNegotiationRound,
  onRequestTransferModal,
}) => {
  const currency = player.preferredCurrency || 'GBP';
  const currentAgentFee = player.currentContract.agentFeePercent || 5;
  const currentAgentName = player.currentContract.agentName || 'Marcus & Family Trust';
  const currentAgencyName = player.currentContract.agencyName || 'Family Office Representation';

  // Active Sub-Mode in Terminal
  const [terminalMode, setTerminalMode] = useState<'console' | 'transfer_directives' | 'contract_demands' | 'switch_agency'>('console');

  // Interactive Message Thread State
  const initialMessages: AgentMessage[] = player.agentTerminalHistory && player.agentTerminalHistory.length > 0 
    ? player.agentTerminalHistory 
    : [
        {
          id: 'msg_init_1',
          sender: 'AGENT',
          text: `Encrypted Terminal Link established with ${currentAgentName} (${currentAgencyName}). "Good day, ${player.firstName}. I'm reviewing our strategic roadmap at ${club.name}. How do you want to steer your career right now?"`,
          timestamp: `Wk ${player.currentWeek}, 2026`,
          type: 'NORMAL',
        },
      ];

  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages);
  const [customInput, setCustomInput] = useState('');
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [terminalNotice, setTerminalNotice] = useState<string | null>(null);

  // Helper to append message
  const pushMessage = (msg: AgentMessage) => {
    const updated = [...messages, msg];
    setMessages(updated);
    onUpdatePlayer({
      ...player,
      agentTerminalHistory: updated.slice(-30), // keep last 30
    });
  };

  // Agent response simulation
  const triggerAgentReply = (
    replyText: string,
    type: AgentMessage['type'] = 'NORMAL',
    delayMs = 700,
    callback?: () => void
  ) => {
    setIsAgentTyping(true);
    setTimeout(() => {
      setIsAgentTyping(false);
      sounds.playNotification();
      pushMessage({
        id: `agent_reply_${Date.now()}`,
        sender: 'AGENT',
        text: replyText,
        timestamp: `Wk ${player.currentWeek}, 2026`,
        type,
      });
      if (callback) callback();
    }, delayMs);
  };

  // 1. ACTION: REQUEST SPECIFIC TRANSFER MOVES
  const handleRequestTransferMove = (
    moveType: 'UCL_CONTENDER' | 'TAX_HAVEN' | 'DOMESTIC_LOAN' | 'FORMAL_REQUEST' | 'REGULAR_STARTER'
  ) => {
    sounds.playClick();
    let playerMsg = '';
    let agentReply = '';
    let managerTrustDelta = 0;
    let fanRepDelta = 0;
    let moraleDelta = 0;
    let notice = '';

    if (moveType === 'UCL_CONTENDER') {
      playerMsg = 'I want to compete at the very highest level. Initiate quiet background inquiries with Champions League contending clubs.';
      if (player.overallRating >= 74 || player.marketValue >= 10000000) {
        agentReply = `Understood. With your rating (${player.overallRating}) and strong market value (${formatCurrency(player.marketValue, currency)}), European scouts are already tracking you. I will schedule discreet private dinners with sporting directors in Milan, Madrid, and London. Keep your head down and perform on Saturday!`;
        moraleDelta = 8;
        fanRepDelta = 2;
        notice = 'Your agent has initiated confidential inquiries with Champions League sporting directors!';
      } else {
        agentReply = `I admire your ambition, ${player.firstName}, but right now your rating is ${player.overallRating}. Elite UCL clubs want proven consistency. If we jump too early, you\'ll end up rotting on a bench. Let\'s bag 5 more goals or assists first, then I\'ll have the leverage to demand a top move.`;
        moraleDelta = 2;
        notice = 'Agent advised patience: boost rating and match ratings before elite push.';
      }
    } else if (moveType === 'TAX_HAVEN') {
      playerMsg = 'Research lucrative international moves—specifically high-wage leagues or tax havens like Saudi Pro League (0% tax) or MLS.';
      agentReply = `Understood. A move to the Saudi Pro League would mean 0% personal income tax—you would bank 100% of your gross wages with zero deductions from tax authorities. MLS offers strong marquee designated player packages. I will reach out to our Gulf and American intermediaries to gauge prospective marquee wage packages.`;
      moraleDelta = 5;
      notice = 'Agent initiated talks with international intermediaries in Saudi Arabia & MLS!';
    } else if (moveType === 'DOMESTIC_LOAN') {
      playerMsg = 'I need guaranteed 90-minute playing time. Approach the manager and arrange a 6-month developmental loan to a club where I start every week.';
      agentReply = `Wise decision. Inactive bench time destroys young prospects faster than anything. I will meet with ${club.managerName} this Thursday to formally request a loan listing with guaranteed starter clauses.`;
      moraleDelta = 6;
      managerTrustDelta = 2;
      notice = 'Agent formally approached sporting director for loan listing with starter guarantees.';
    } else if (moveType === 'FORMAL_REQUEST') {
      playerMsg = 'I have made up my mind. Hand in an official written transfer request to the Chairman and make it clear I will not sign a renewal.';
      agentReply = `This is the nuclear option, ${player.firstName}. Handing in a formal transfer request will force the club to listen to bids, but ${club.managerName} will be furious and you will forfeit loyalty bonuses. I am submitting the paperwork to the board now. Expect tabloid headlines tomorrow morning.`;
      managerTrustDelta = -18;
      fanRepDelta = -10;
      moraleDelta = -5;
      notice = 'OFFICIAL TRANSFER REQUEST SUBMITTED! Board alerted; manager trust decreased.';
    } else if (moveType === 'REGULAR_STARTER') {
      playerMsg = 'Sound out ambitious mid-table clubs in top-5 leagues where I can be the focal point of the team rather than a squad rotation option.';
      agentReply = `Excellent tactical thinking. Being the talisman at a well-run mid-table club is the fastest path to 20 goals and a mega-transfer. I am already in touch with two clubs who lack dynamic attacking depth.`;
      moraleDelta = 5;
      notice = 'Agent targeting first-team guaranteed starter opportunities across top leagues.';
    }

    // Push player statement
    pushMessage({
      id: `usr_${Date.now()}`,
      sender: 'PLAYER',
      text: playerMsg,
      timestamp: `Wk ${player.currentWeek}, 2026`,
      type: 'NORMAL',
    });

    // Update player metrics & progression
    const updatedTrust = Math.max(5, Math.min(100, player.managerTrust + managerTrustDelta));
    const updatedFan = Math.max(5, Math.min(100, player.fanReputation + fanRepDelta));
    const updatedMorale = Math.max(10, Math.min(100, player.morale + moraleDelta));

    onUpdatePlayer({
      ...player,
      managerTrust: updatedTrust,
      fanReputation: updatedFan,
      morale: updatedMorale,
    });

    setTerminalNotice(notice);
    triggerAgentReply(agentReply, moveType === 'FORMAL_REQUEST' ? 'WARNING' : 'TRANSFER_OPPORTUNITY');
  };

  // 2. ACTION: DEMAND CONTRACT RENEGOTIATION
  const handleDemandContractRenegotiation = (
    demandType: 'AGGRESSIVE_HIKE' | 'MODEST_BUMP' | 'RELEASE_CLAUSE_CUT'
  ) => {
    sounds.playClick();
    let playerMsg = '';
    let agentReply = '';
    let managerTrustDelta = 0;
    let notice = '';

    if (demandType === 'AGGRESSIVE_HIKE') {
      playerMsg = `Inform the board that my current weekly wage (${formatCurrency(player.currentContract.weeklyWage, currency)}) is completely below market value. We demand an immediate +40% wage rise and Key Player status!`;
      agentReply = `I like the fire. I scheduled an emergency boardroom session with ${club.name}'s sporting director. I made it clear that other European clubs are lurking. The director looked tense, but agreed to open immediate contract renewal talks. Let's head into the negotiation room!`;
      managerTrustDelta = -4;
      notice = 'Boardroom pressured! Director agreed to open immediate contract renewal talks.';
    } else if (demandType === 'MODEST_BUMP') {
      playerMsg = `Approach the club diplomatically. Propose a fair contract extension with a +15% wage bump and higher goal/assist performance bonuses to reward my consistency.`;
      agentReply = `A classy, professional approach. The director appreciated our respectful presentation. They are preparing a revised contract offer with sweetened performance incentives. Check the boardroom tab!`;
      managerTrustDelta = 4;
      notice = 'Diplomatic proposal submitted. Club is reviewing contract extension!';
    } else if (demandType === 'RELEASE_CLAUSE_CUT') {
      playerMsg = `Tell the board we want a mandatory minimum release clause inserted into my deal, or a reduction of any existing clause so I cannot be held hostage.`;
      agentReply = `Crucial strategic move. Clubs hate low buyout clauses because it takes control away from them. I told them that without a fair release clause, we will not consider extending beyond 2027. They have begrudgingly agreed to discuss buyout clauses.`;
      notice = 'Release clause stipulation added to agenda for upcoming contract talks.';
    }

    pushMessage({
      id: `usr_${Date.now()}`,
      sender: 'PLAYER',
      text: playerMsg,
      timestamp: `Wk ${player.currentWeek}, 2026`,
      type: 'NORMAL',
    });

    const updatedTrust = Math.max(5, Math.min(100, player.managerTrust + managerTrustDelta));
    onUpdatePlayer({
      ...player,
      managerTrust: updatedTrust,
    });

    setTerminalNotice(notice);
    triggerAgentReply(agentReply, 'CONTRACT_UPDATE', 800, () => {
      if (onStartNegotiationRound && (demandType === 'AGGRESSIVE_HIKE' || demandType === 'MODEST_BUMP')) {
        // Can open negotiation
      }
    });
  };

  // 3. ACTION: CHANGE REPRESENTATION
  const handleSwitchAgency = (newAgency: AgencyRepresentation) => {
    sounds.playClick();
    if (newAgency.agencyName === currentAgencyName) {
      setTerminalNotice(`You are already represented by ${newAgency.agencyName}.`);
      return;
    }

    if (player.bankBalance < newAgency.signingBonusCost) {
      sounds.playWhistle();
      setTerminalNotice(`Insufficient personal funds! Switching to ${newAgency.agencyName} requires an onboarding retainer of ${formatCurrency(newAgency.signingBonusCost, currency)}.`);
      return;
    }

    confetti({ particleCount: 55, spread: 60, origin: { y: 0.6 } });
    sounds.playFanfare();

    // Deduct cost and update contract clauses
    const updatedBalance = player.bankBalance - newAgency.signingBonusCost;
    const updatedContract: ContractClauses = {
      ...player.currentContract,
      agentName: newAgency.agentName,
      agencyName: newAgency.agencyName,
      agentFeePercent: newAgency.agentFeePercent,
    };

    // Recalculate tax residency since agent fee affects net wage deductions!
    const updatedTaxCalc = calculateTaxBreakdown(
      club,
      player.currentContract.weeklyWage,
      newAgency.agentFeePercent
    );

    const updatedTaxResidency = player.taxResidency ? {
      ...player.taxResidency,
      systemDescription: updatedTaxCalc.notes,
    } : undefined;

    const switchedMessage: AgentMessage = {
      id: `agency_switch_${Date.now()}`,
      sender: 'AGENT',
      text: `OFFICIAL PRESS RELEASE: ${player.firstName} ${player.lastName} has formally signed exclusive worldwide representation rights with ${newAgency.agentName} at ${newAgency.agencyName}! "We are thrilled to welcome ${player.firstName} to our global family. Our mission is to transform this extraordinary talent into a generational icon."`,
      timestamp: `Wk ${player.currentWeek}, 2026`,
      type: 'SUCCESS',
    };

    const updatedHistory = [...messages, switchedMessage];
    setMessages(updatedHistory);

    onUpdatePlayer({
      ...player,
      bankBalance: updatedBalance,
      currentContract: updatedContract,
      taxResidency: updatedTaxResidency,
      morale: Math.min(100, player.morale + 10),
      agentTerminalHistory: updatedHistory.slice(-30),
    });

    setTerminalNotice(`Representation transferred to ${newAgency.agentName} (${newAgency.agencyName})! Agent fee updated to ${newAgency.agentFeePercent}%.`);
    setTerminalMode('console');
  };

  // Custom text submission
  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    sounds.playClick();
    const query = customInput.trim();
    setCustomInput('');

    pushMessage({
      id: `usr_${Date.now()}`,
      sender: 'PLAYER',
      text: query,
      timestamp: `Wk ${player.currentWeek}, 2026`,
      type: 'NORMAL',
    });

    // Smart contextual response based on prompt keywords
    let reply = `Copy that, ${player.firstName}. I've logged your note. I'm actively monitoring weekly transfer inquiries, club financial compliance, and contract options. Stay locked in for the next fixture!`;
    const lower = query.toLowerCase();

    if (lower.includes('wage') || lower.includes('money') || lower.includes('salary') || lower.includes('tax')) {
      reply = `Regarding finances: your current gross wage is ${formatCurrency(player.currentContract.weeklyWage, currency)}/wk with an agent fee of ${currentAgentFee}%. In ${club.country}, local tax residency deductions apply automatically. If you want a raise, demand a renegotiation from the Contract Demands terminal!`;
    } else if (lower.includes('transfer') || lower.includes('leave') || lower.includes('move') || lower.includes('club')) {
      reply = `I am tracking several European and international possibilities. Your current market valuation stands at ${formatCurrency(player.marketValue, currency)}. Check the 'Transfer Directives' menu to issue a concrete command.`;
    } else if (lower.includes('play') || lower.includes('bench') || lower.includes('manager') || lower.includes('coach')) {
      reply = `Your relationship with manager ${club.managerName} is at ${player.managerTrust}%. Keep your training intensity sharp and your discipline high in the daily routine—managers love reliable professionals.`;
    }

    triggerAgentReply(reply, 'NORMAL', 600);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. AGENT IDENTITY & DOSSIER BANNER */}
      {/* ==================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow-lg">
              <Briefcase className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  FIFA Licensed Football Representative
                </span>
                <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-300 font-bold border border-slate-750">
                  Commission: {currentAgentFee}%
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {currentAgentName}
              </h2>
              <p className="text-xs text-slate-400">
                Exclusive Agency: <span className="text-slate-200 font-bold">{currentAgencyName}</span> · Active Mandate at {club.name}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Commission</span>
              <span className="text-emerald-400 font-black text-sm">{currentAgentFee}% of Gross</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Market Pull</span>
              <span className="text-amber-400 font-black text-sm">Tier 1 Elite</span>
            </div>
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Player Morale</span>
              <span className="text-white font-black text-sm">{player.morale}%</span>
            </div>
          </div>
        </div>

        {/* Sub-Mode Navigation Pills */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { sounds.playClick(); setTerminalMode('console'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              terminalMode === 'console'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Encrypted Comm Console</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setTerminalMode('transfer_directives'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              terminalMode === 'transfer_directives'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer Directives</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setTerminalMode('contract_demands'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              terminalMode === 'contract_demands'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Contract Demands</span>
          </button>

          <button
            onClick={() => { sounds.playClick(); setTerminalMode('switch_agency'); }}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              terminalMode === 'switch_agency'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Switch Representation</span>
          </button>
        </div>
      </div>

      {terminalNotice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{terminalNotice}</span>
          </div>
          <button onClick={() => setTerminalNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4">✕</button>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 1: ENCRYPTED COMM CONSOLE */}
      {/* ==================================================== */}
      {terminalMode === 'console' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Direct Encrypted Frequency: {currentAgentName}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">End-to-End Secure FIFA Comms</span>
          </div>

          {/* Chat / Message Stream */}
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 h-96 overflow-y-auto space-y-3 font-sans scrollbar-thin">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'PLAYER' ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-500 mb-1 flex items-center gap-1 font-mono">
                  <span>{m.sender === 'PLAYER' ? `${player.firstName} ${player.lastName}` : currentAgentName}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>
                <div
                  className={`p-3.5 rounded-2xl max-w-xl text-xs leading-relaxed shadow ${
                    m.sender === 'PLAYER'
                      ? 'bg-emerald-600 text-white font-medium rounded-tr-none'
                      : m.type === 'WARNING'
                      ? 'bg-rose-950/90 border border-rose-500/40 text-rose-200 rounded-tl-none'
                      : m.type === 'SUCCESS'
                      ? 'bg-amber-950/90 border border-amber-500/40 text-amber-200 rounded-tl-none font-bold'
                      : m.type === 'TRANSFER_OPPORTUNITY'
                      ? 'bg-blue-950/90 border border-blue-500/40 text-blue-200 rounded-tl-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isAgentTyping && (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-slate-900/60 p-2.5 rounded-xl w-fit border border-slate-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="italic">{currentAgentName} is reviewing options...</span>
              </div>
            )}
          </div>

          {/* Quick Directive Triggers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => handleRequestTransferMove('UCL_CONTENDER')}
              className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Seek UCL Contender Move</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Direct agent to sound out Champions League clubs.</p>
            </button>

            <button
              onClick={() => handleDemandContractRenegotiation('AGGRESSIVE_HIKE')}
              className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Demand +40% Wage Hike</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Instruct agent to aggressively test the Chairman's resolve.</p>
            </button>

            <button
              onClick={() => handleRequestTransferMove('TAX_HAVEN')}
              className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Explore 0% Tax Haven Move</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Target Saudi Pro League or MLS for net wage maximization.</p>
            </button>
          </div>

          {/* Interactive Input Form */}
          <form onSubmit={handleSendCustomMessage} className="flex gap-2 pt-2">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder={`Instruct ${currentAgentName} (e.g. "Find me a club in Spain", "Ask for a wage rise", "Check my market value")...`}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 2: TRANSFER DIRECTIVES */}
      {/* ==================================================== */}
      {terminalMode === 'transfer_directives' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                Issue Formal Transfer Directives
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instruct your representative on where to place your name in the global transfer market.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Current Valuation:</span>
              <span className="font-bold text-emerald-400 ml-1.5 font-mono">{formatCurrency(player.marketValue, currency)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Directive 1: Champions League Giant */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Ambition: Champions League Giant
                </span>
                <span className="text-[10px] bg-blue-950 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-800">
                  Elite Path
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Target Continental Heavyweights</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct your agent to quietly open channels with Champions League contenders (Real Madrid, Bayern, Man City, Arsenal, Inter). Requires high rating ({player.overallRating >= 74 ? 'Qualified' : 'Rating 74+ recommended'}).
              </p>
              <button
                onClick={() => handleRequestTransferMove('UCL_CONTENDER')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Authorize Elite UCL Inquiries</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Directive 2: Tax Haven & High Wage League */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Financial: 0% Tax Haven or MLS
                </span>
                <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-800">
                  Wealth Focus
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Secure Saudi Pro League or MLS Move</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maximize net bank accumulation. Saudi Arabia imposes 0% personal tax, depositing 100% of your earnings. MLS provides marquee international visibility and commercial endorsements.
              </p>
              <button
                onClick={() => handleRequestTransferMove('TAX_HAVEN')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Instruct Agent to Pitch Gulf & US Clubs</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Directive 3: Domestic Loan for Minutes */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-emerald-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Development: 6-Month Loan
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">
                  Minutes First
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Guarantee 90-Minute Weekly Starting Role</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you aren't starting regularly at {club.name}, secure an immediate developmental loan to a hungry division rival with a mandatory starting 11 clause.
              </p>
              <button
                onClick={() => handleRequestTransferMove('DOMESTIC_LOAN')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Request Developmental Loan Move</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Directive 4: The Nuclear Option - Formal Transfer Request */}
            <div className="bg-slate-950 border border-rose-900/60 rounded-2xl p-5 space-y-3 hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Dispute: Hand in Written Transfer Request
                </span>
                <span className="text-[10px] bg-rose-950 text-rose-300 font-bold px-2 py-0.5 rounded border border-rose-800">
                  High Risk
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">Submit Official Transfer Notice to Board</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Forces {club.name}'s board to accept incoming bids. WARNING: Will permanently damage your relationship with manager {club.managerName} (-18 Trust) and alienate supporters (-10 Fan Rep).
              </p>
              <button
                onClick={() => handleRequestTransferMove('FORMAL_REQUEST')}
                className="w-full py-2.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Submit Written Transfer Request</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 3: CONTRACT DEMANDS */}
      {/* ==================================================== */}
      {terminalMode === 'contract_demands' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                Contract Demands & Board Leverage
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Instruct your representative to march into {club.name}'s boardroom and dictate terms.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Current Wage:</span>
              <span className="font-bold text-emerald-400 ml-1.5 font-mono">{formatCurrency(player.currentContract.weeklyWage, currency)}/wk</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Demand 1: Aggressive +40% wage rise */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                  Demand 1: Aggressive
                </div>
                <h4 className="text-sm font-bold text-white">+40% Base Wage & Key Role</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Demand an immediate jump from {formatCurrency(player.currentContract.weeklyWage, currency)} to ~{formatCurrency(Math.round(player.currentContract.weeklyWage * 1.4), currency)}/wk. Tests the board's patience, but establishes you as the club's franchise cornerstone.
                </p>
              </div>
              <button
                onClick={() => handleDemandContractRenegotiation('AGGRESSIVE_HIKE')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer mt-4"
              >
                Send Aggressive Demand
              </button>
            </div>

            {/* Demand 2: Diplomatic +15% with Goal Bonuses */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                  Demand 2: Diplomatic
                </div>
                <h4 className="text-sm font-bold text-white">+15% Bump & Goal Incentives</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Constructive renewal proposal rewarding your on-pitch form. High board acceptance probability, strengthens locker room harmony and manager trust (+4).
                </p>
              </div>
              <button
                onClick={() => handleDemandContractRenegotiation('MODEST_BUMP')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer mt-4"
              >
                Submit Diplomatic Proposal
              </button>
            </div>

            {/* Demand 3: Release Clause Insertion */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                  Demand 3: Strategic
                </div>
                <h4 className="text-sm font-bold text-white">Enforce Low Minimum Release Clause</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Instruct agent to mandate a fixed buyout clause (e.g. £25M-£40M) preventing the club from pricing you out of a dream transfer to Real Madrid or Barcelona.
                </p>
              </div>
              <button
                onClick={() => handleDemandContractRenegotiation('RELEASE_CLAUSE_CUT')}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer mt-4"
              >
                Mandate Release Clause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODE 4: SWITCH REPRESENTATION */}
      {/* ==================================================== */}
      {terminalMode === 'switch_agency' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-400" />
                Elite Agency Marketplace & Representation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Change who speaks for you in football boardrooms. Different agencies unlock unique transfer links, wage leverage, and tax deductions.
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Personal Bank:</span>
              <span className="font-bold text-emerald-400 ml-1.5 font-mono">{formatCurrency(player.bankBalance, currency)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FOOTBALL_AGENCIES.map((agency) => {
              const isCurrent = agency.agencyName === currentAgencyName;
              const canAfford = player.bankBalance >= agency.signingBonusCost;

              return (
                <div
                  key={agency.id}
                  className={`bg-slate-950 border rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all ${
                    isCurrent ? 'border-emerald-500/80 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        agency.tier === 'GLOBAL_POWERBROKER'
                          ? 'bg-purple-950 text-purple-300 border-purple-800'
                          : agency.tier === 'BOUTIQUE_DEV'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}>
                        {agency.tier.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-mono">Commission:</span>
                        <span className="font-bold text-emerald-400">{agency.agentFeePercent}%</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white">{agency.agencyName}</h4>
                      <p className="text-xs text-slate-400">Head Agent: <strong className="text-slate-200">{agency.agentName}</strong></p>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {agency.description}
                    </p>

                    {/* Perks List */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Strategic Agency Perks:</span>
                      {agency.perks.map((perk, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Onboarding Retainer</span>
                      <span className="text-xs font-bold text-white font-mono">
                        {agency.signingBonusCost === 0 ? 'FREE / £0' : formatCurrency(agency.signingBonusCost, currency)}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span className="px-4 py-2 bg-emerald-950 border border-emerald-500/50 text-emerald-400 text-xs font-bold rounded-xl">
                        Active Representation
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSwitchAgency(agency)}
                        disabled={!canAfford}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          canAfford
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow'
                            : 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
                        }`}
                      >
                        {canAfford ? 'Sign Exclusive Mandate' : 'Insufficient Funds'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
