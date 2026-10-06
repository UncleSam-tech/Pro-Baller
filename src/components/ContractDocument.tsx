import React, { useState } from 'react';
import { Club, ContractClauses, Player } from '../types/game';
import { calculateTaxBreakdown } from '../utils/taxResidency';
import { evaluateCounterOffer } from '../utils/contractGenerator';
import { sounds } from '../utils/soundFx';
import { Award, CheckCircle, FileText, PenTool, ShieldAlert, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ContractDocumentProps {
  player: Player;
  club: Club;
  contract: ContractClauses;
  isNegotiating?: boolean;
  onSignContract?: (finalContract: ContractClauses) => void;
  onCancelNegotiation?: () => void;
}

export const ContractDocument: React.FC<ContractDocumentProps> = ({
  player,
  club,
  contract,
  isNegotiating = false,
  onSignContract,
  onCancelNegotiation,
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'negotiation' | 'payslip'>('document');
  const [isSigned, setIsSigned] = useState(false);
  const [playerSignatureText, setPlayerSignatureText] = useState('');

  // Negotiation state
  const [proposal, setProposal] = useState<ContractClauses>({ ...contract });
  const [boardPatience, setBoardPatience] = useState<number>(club.managerPatience || 75);
  const [negotiationMessage, setNegotiationMessage] = useState<string | null>(null);
  const [negotiationStatus, setNegotiationStatus] = useState<'IN_PROGRESS' | 'ACCEPTED' | 'WALKOUT'>('IN_PROGRESS');

  const handleSign = () => {
    sounds.playPenScratch();
    setIsSigned(true);
    setPlayerSignatureText(`${player.firstName} ${player.lastName}`);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: [club.primaryColor, '#F59E0B', '#10B981', '#FFFFFF'],
    });

    if (onSignContract) {
      setTimeout(() => {
        onSignContract(proposal);
      }, 1200);
    }
  };

  const handleCounterOffer = () => {
    sounds.playClick();
    const result = evaluateCounterOffer(club, player, contract, proposal, boardPatience);
    setBoardPatience(result.newPatience);
    setNegotiationMessage(result.message);

    if (result.outcome === 'ACCEPTED') {
      sounds.playFanfare();
      setNegotiationStatus('ACCEPTED');
    } else if (result.outcome === 'REJECTED_WALKOUT') {
      setNegotiationStatus('WALKOUT');
    } else if (result.outcome === 'COUNTERED' && result.revisedOffer) {
      setProposal(result.revisedOffer);
    }
  };

  // Estimate tax and annual figures (UK / Europe standard 45% top bracket)
  const annualGross = proposal.weeklyWage * 52;
  const estimatedTax = Math.round(annualGross * 0.45);
  const annualNet = annualGross - estimatedTax;
  const weeklyNet = Math.round(annualNet / 52);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-inner"
            style={{ backgroundColor: club.primaryColor }}
          >
            {club.shortName}
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              {club.name} Official Player Employment Agreement
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>FIFA Regulatory Form 104-B</span>
              <span>·</span>
              <span>Ref: {club.shortName}-{player.currentYear}-{player.jerseyNumber}</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">Valid & Binding</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('document'); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'document' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Legal Contract Document
          </button>
          {isNegotiating && (
            <button
              onClick={() => { sounds.playClick(); setActiveTab('negotiation'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'negotiation' ? 'bg-amber-600 text-white shadow' : 'text-amber-400 hover:text-amber-200'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Negotiation Boardroom
            </button>
          )}
          <button
            onClick={() => { sounds.playClick(); setActiveTab('payslip'); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'payslip' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Weekly Wage Slip & Tax
          </button>
        </div>
      </div>

      {/* VIEW 1: LEGAL CONTRACT DOCUMENT (Real-World Parchment & Legal Clauses) */}
      {activeTab === 'document' && (
        <div className="bg-[#FAF8F5] text-slate-900 rounded-xl shadow-2xl p-8 md:p-12 border border-[#E2DDD5] font-serif relative overflow-hidden">
          {/* Subtle Watermark Stamp */}
          <div className="absolute right-12 top-24 pointer-events-none opacity-[0.06] select-none text-right">
            <div className="text-8xl font-black uppercase tracking-tighter">OFFICIAL</div>
            <div className="text-6xl font-black uppercase">FIFA AGREEMENT</div>
          </div>

          {/* Document Header with Association Seals */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest font-sans font-bold text-slate-500 mb-1">
                  Confederation Standard Footballer Contract · Edition 2026
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-950 font-serif">
                  PROFESSIONAL FOOTBALL PLAYER EMPLOYMENT CONTRACT
                </h1>
                <p className="text-xs text-slate-600 font-sans mt-1">
                  Governed by FIFA Regulations on the Status and Transfer of Players (RSTP) & National Football Association
                </p>
              </div>

              {/* Official Seal Badge */}
              <div className="hidden sm:flex flex-col items-center justify-center p-3 border-2 border-amber-800/40 rounded-full w-24 h-24 text-center bg-amber-50/50 shadow-inner">
                <Award className="w-7 h-7 text-amber-800 mb-0.5" />
                <span className="text-[9px] font-sans font-black tracking-wider text-amber-950 uppercase">OFFICIAL SEAL</span>
                <span className="text-[8px] font-mono text-amber-800">RATIFIED</span>
              </div>
            </div>

            {/* Parties Summary Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-4 bg-slate-100/80 rounded border border-slate-200 font-sans text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">THE CLUB / EMPLOYER</span>
                <span className="text-sm font-bold text-slate-900 block">{club.name.toUpperCase()} FOOTBALL CLUB</span>
                <span className="text-slate-600 block">{club.stadiumName}, {club.city}, {club.country}</span>
                <span className="text-slate-500 block">League Member: {club.league}</span>
              </div>
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">THE PROFESSIONAL PLAYER</span>
                <span className="text-sm font-bold text-slate-900 block">{player.firstName.toUpperCase()} {player.lastName.toUpperCase()}</span>
                <span className="text-slate-600 block">Nationality: {player.nationality} · Position: {player.position}</span>
                <span className="text-slate-500 block">Age: {player.age} · Squad Assigned Role: {proposal.squadRole}</span>
              </div>
            </div>
          </div>

          {/* Legal Clauses Articles */}
          <div className="space-y-6 text-sm leading-relaxed text-slate-800">
            {/* Article 1 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 1 · TERM OF EMPLOYMENT & SQUAD PROMISES
              </h3>
              <p>
                1.1. The Club engages the Player and the Player agrees to serve as a professional football player for a fixed duration of{' '}
                <strong className="text-slate-950 underline">{proposal.contractYears} full seasons</strong>, commencing on{' '}
                <span className="font-mono font-medium">1 July {proposal.startYear}</span> and expiring on{' '}
                <span className="font-mono font-medium">30 June {proposal.expiryYear}</span>, unless terminated earlier in accordance with statutory regulations.
              </p>
              <p className="mt-1.5">
                1.2. <strong>Squad Designation:</strong> The Player is contracted under the agreed tier of{' '}
                <strong className="text-slate-950 bg-amber-100/80 px-1 rounded">{proposal.squadRole}</strong>. The Club pledges competitive match opportunities consistent with this status.
              </p>
              {proposal.clubOptionOneYear && (
                <p className="mt-1.5 text-xs text-slate-600">
                  1.3. <strong>Club Extension Option:</strong> The Club retains the unilateral unilateral option to extend this agreement by an additional 12 months (expiring June {proposal.expiryYear + 1}) upon 30 days prior written notice.
                </p>
              )}
            </div>

            {/* Article 2 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 2 · BASIC REMUNERATION & WAGE GROWTH
              </h3>
              <p>
                2.1. In consideration of the Player's services, the Club shall pay a basic remuneration of{' '}
                <strong className="text-slate-950 text-base font-bold bg-emerald-100 px-1.5 py-0.5 rounded font-mono">
                  £{proposal.weeklyWage.toLocaleString()} GBP
                </strong>{' '}
                per week, payable in equal monthly installments on the final working day of each calendar month.
              </p>
              <p className="mt-1.5 text-xs text-slate-700">
                2.2. <strong>Annual Wage Escalation:</strong> Provided the Club maintains its league status, the basic wage shall automatically escalate by{' '}
                <strong>{proposal.wageIncreasePerYearPercent}%</strong> at the start of each subsequent campaign year.
              </p>
              <p className="mt-1 text-xs text-slate-700">
                2.3. <strong>Relegation Clause:</strong> In the unforeseen event of the Club suffering relegation, basic remuneration shall adjust downwards by{' '}
                <strong>{proposal.wageDropOnRelegationPercent}%</strong> for the duration of lower-division participation.
              </p>
            </div>

            {/* Article 3 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 3 · PERFORMANCE & MATCH INCENTIVE SCHEDULE
              </h3>
              <p className="text-xs mb-2">
                The Player shall be entitled to the following supplemental appearance and on-pitch performance bonuses:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 font-sans text-xs">
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Match Appearance Fee</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">£{proposal.appearanceBonus.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Starting XI Premium</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">£{proposal.startingBonus.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Competitive Goal Bonus</div>
                  <div className="text-sm font-bold text-emerald-800 font-mono">£{proposal.goalBonus.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Assisting Pass Bonus</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">£{proposal.assistBonus.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Clean Sheet Match Bonus</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">£{proposal.cleanSheetBonus.toLocaleString()}</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded border border-slate-200">
                  <div className="text-slate-500 font-medium">Team Victory Win Bonus</div>
                  <div className="text-sm font-bold text-slate-900 font-mono">£{proposal.matchWinBonus.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Article 4 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 4 · MAJOR COMPETITIONS, TITLES & BALLON D'OR COVENANT
              </h3>
              <p>
                4.1. <strong>League Championship:</strong> Upon the Club clinching the domestic league title, the Player receives a lump-sum award of{' '}
                <strong className="font-mono">£{proposal.leagueChampionBonus.toLocaleString()}</strong>.
              </p>
              <p className="mt-1">
                4.2. <strong>UEFA Champions League / Continental Title:</strong> A title bonus of{' '}
                <strong className="font-mono">£{proposal.championsLeagueBonus.toLocaleString()}</strong> upon winning the European final.
              </p>
              <p className="mt-1">
                4.3. <strong>Golden Boot Award:</strong> Finishing as official league top goalscorer entitles Player to an extra{' '}
                <strong className="font-mono">£{proposal.goldenBootBonus.toLocaleString()}</strong>.
              </p>
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-950 font-sans">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>SPECIAL BALLON D'OR SUPERSTAR CLAUSE</span>
                </div>
                <p>
                  Should the Player be officially awarded the <em>Ballon d'Or (France Football / FIFA Best Player in the World)</em> during the tenure of this contract, the Club shall disburse an immediate bonus of{' '}
                  <strong className="font-mono text-sm">£{proposal.ballonDorBonus.toLocaleString()}</strong>, accompanied by an immediate permanent{' '}
                  <strong className="font-mono">+{proposal.ballonDorWageBumpPercent}% weekly wage increment</strong> for the remainder of the contract duration.
                </p>
              </div>
            </div>

            {/* Article 5 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 5 · BUYOUT & MINIMUM FEE RELEASE CLAUSES
              </h3>
              <p>
                5.1. <strong>Minimum Fee Release Clause:</strong> In accordance with statutory provisions, any third-party club triggering a fixed buyout offer of{' '}
                <strong className="font-mono text-slate-950 bg-slate-200/80 px-1 py-0.5 rounded">
                  {proposal.minimumReleaseClause > 0 ? `£${proposal.minimumReleaseClause.toLocaleString()} GBP` : 'NO RELEASE CLAUSE (Club Unilateral Transfer Discretion)'}
                </strong>{' '}
                shall be granted direct permission to conduct personal contract terms with the Player.
              </p>
              {proposal.minimumReleaseClause > 0 && (
                <p className="mt-1 text-xs text-slate-600">
                  5.2. <strong>Champions League Discount:</strong> If the Club fails to qualify for the UEFA Champions League, the mandatory release sum is discounted to{' '}
                  <strong className="font-mono">£{proposal.championsLeagueReleaseClause.toLocaleString()}</strong>.
                </p>
              )}
            </div>

            {/* Article 6 */}
            <div>
              <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2">
                ARTICLE 6 · SIGNING-ON INCENTIVE & LOYALTY PROVISIONS
              </h3>
              <p>
                6.1. The Club agrees to disburse an upfront Signing-on Fee of{' '}
                <strong className="font-mono">£{proposal.signingBonus.toLocaleString()}</strong>, structured in two equal tranches.
              </p>
              <p className="mt-1">
                6.2. <strong>Loyalty Bonus:</strong> For each completed 12-month cycle of uninterrupted registration, Player shall receive an annual loyalty retention fee of{' '}
                <strong className="font-mono">£{proposal.loyaltyBonusAnnual.toLocaleString()}</strong> on 1 July.
              </p>
            </div>
          </div>

          {/* Signatures & Execution Section */}
          <div className="mt-12 pt-8 border-t-2 border-slate-900 font-sans">
            <h4 className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-6 text-center">
              IN WITNESS WHEREOF THE PARTIES HAVE DULY EXECUTED THIS BINDING EMPLOYMENT AGREEMENT
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Club Representative Signature */}
              <div className="border-t border-slate-400 pt-2 text-center">
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic text-lg text-slate-700 tracking-wider">
                    {club.managerName}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 uppercase">On Behalf of {club.name}</div>
                <div className="text-[11px] text-slate-500">Managing Director / Sporting Director</div>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">✓ SIGNED & EMBOSSED</div>
              </div>

              {/* Player Licensed Agent */}
              <div className="border-t border-slate-400 pt-2 text-center">
                <div className="h-12 flex items-center justify-center">
                  <span className="font-serif italic text-lg text-slate-700 tracking-wider">
                    {proposal.agentName}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 uppercase">{proposal.agencyName}</div>
                <div className="text-[11px] text-slate-500">FIFA Licensed Intermediary ({proposal.agentFeePercent}% commission)</div>
                <div className="text-[10px] text-emerald-700 font-mono mt-1">✓ RATIFIED REPRESENTATIVE</div>
              </div>

              {/* Player Signature */}
              <div className="border-t border-slate-400 pt-2 text-center">
                <div className="h-12 flex items-center justify-center">
                  {isSigned ? (
                    <span className="font-serif italic text-xl font-bold text-blue-900 tracking-widest animate-fade-in">
                      {playerSignatureText}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Awaiting Player Signature...</span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-900 uppercase">{player.firstName} {player.lastName}</div>
                <div className="text-[11px] text-slate-500">The Registered Professional Player</div>
                
                {/* Interactive Sign Action */}
                {!isSigned ? (
                  <button
                    onClick={handleSign}
                    className="mt-3 w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Sign Contract Official
                  </button>
                ) : (
                  <div className="mt-2 text-xs font-bold text-emerald-800 flex items-center justify-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    LEGALLY BINDING & REGISTERED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: NEGOTIATION BOARDROOM (Counter-offers, Board Patience & Agent Advice) */}
      {activeTab === 'negotiation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <PenTool className="w-5 h-5 text-amber-400" />
                Executive Boardroom Contract Negotiations
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You are negotiating directly with {club.name}'s Sporting Director. Your demands directly impact board patience.
              </p>
            </div>

            {/* Board Patience Meter */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 min-w-[200px]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Board Patience</span>
                <span className={`font-bold font-mono ${
                  boardPatience > 60 ? 'text-emerald-400' : boardPatience > 30 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {boardPatience}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    boardPatience > 60 ? 'bg-emerald-500' : boardPatience > 30 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${boardPatience}%` }}
                />
              </div>
            </div>
          </div>

          {/* Agent Advice Card */}
          <div className="p-4 bg-blue-950/40 border border-blue-800/40 rounded-xl flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-bold text-blue-300">
                Agent Advisory · {proposal.agentName} ({proposal.agencyName})
              </div>
              <p className="text-slate-300 mt-0.5">
                {player.overallRating >= club.reputation - 4
                  ? `"You have colossal leverage right now. The manager sees you as an irreplaceable cornerstone. Ask for at least £${Math.round(contract.weeklyWage * 1.25).toLocaleString()}/wk and a chunky signing bonus!"`
                  : `"Be cautious with greedy demands. {club.name} has strict Financial Fair Play guardrails. Keep the wage within £${Math.round(contract.weeklyWage * 1.12).toLocaleString()}/wk to avoid blowing up talks."`}
              </p>
            </div>
          </div>

          {/* Negotiation Feedback Notice */}
          {negotiationMessage && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 border ${
              negotiationStatus === 'ACCEPTED' 
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200' 
                : negotiationStatus === 'WALKOUT'
                ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                : 'bg-amber-950/60 border-amber-700 text-amber-200'
            }`}>
              {negotiationStatus === 'ACCEPTED' ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : negotiationStatus === 'WALKOUT' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div>{negotiationMessage}</div>
            </div>
          )}

          {/* Interactive Clause Adjustment Controls */}
          {negotiationStatus !== 'WALKOUT' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
              {/* Weekly Wage Slider */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Demanded Weekly Wage</label>
                  <span className="font-mono font-bold text-emerald-400">
                    £{proposal.weeklyWage.toLocaleString()} / wk
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.round(contract.weeklyWage * 0.7)}
                  max={Math.round(contract.weeklyWage * 1.8)}
                  step={500}
                  value={proposal.weeklyWage}
                  disabled={negotiationStatus === 'ACCEPTED'}
                  onChange={(e) => setProposal({ ...proposal, weeklyWage: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>£{Math.round(contract.weeklyWage * 0.7).toLocaleString()}</span>
                  <span>Original: £{contract.weeklyWage.toLocaleString()}</span>
                  <span>£{Math.round(contract.weeklyWage * 1.8).toLocaleString()}</span>
                </div>
              </div>

              {/* Contract Length */}
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1.5">Contract Duration</label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((years) => (
                    <button
                      key={years}
                      type="button"
                      disabled={negotiationStatus === 'ACCEPTED'}
                      onClick={() => setProposal({ 
                        ...proposal, 
                        contractYears: years,
                        expiryYear: proposal.startYear + years 
                      })}
                      className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                        proposal.contractYears === years
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {years} {years === 1 ? 'Yr' : 'Yrs'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upfront Signing Bonus */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Upfront Signing Bonus</label>
                  <span className="font-mono font-bold text-amber-400">
                    £{proposal.signingBonus.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.round((contract.signingBonus || 10_000) * 2.5)}
                  step={10_000}
                  value={proposal.signingBonus}
                  disabled={negotiationStatus === 'ACCEPTED'}
                  onChange={(e) => setProposal({ ...proposal, signingBonus: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Minimum Release Clause */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Minimum Release Clause (Buyout)</label>
                  <span className="font-mono font-bold text-blue-400">
                    {proposal.minimumReleaseClause > 0 ? `£${proposal.minimumReleaseClause.toLocaleString()}` : 'None'}
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.round(player.marketValue * 0.7)}
                  max={Math.round(player.marketValue * 3.5)}
                  step={2_000_000}
                  value={proposal.minimumReleaseClause}
                  disabled={negotiationStatus === 'ACCEPTED'}
                  onChange={(e) => setProposal({ ...proposal, minimumReleaseClause: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Lower (Easy Exit)</span>
                  <span>Higher (Club Security)</span>
                </div>
              </div>

              {/* Goal Bonus */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Goal Bonus</label>
                  <span className="font-mono font-bold text-emerald-400">
                    £{proposal.goalBonus.toLocaleString()} / goal
                  </span>
                </div>
                <input
                  type="range"
                  min={Math.round(contract.goalBonus * 0.5)}
                  max={Math.round(contract.goalBonus * 2.2)}
                  step={500}
                  value={proposal.goalBonus}
                  disabled={negotiationStatus === 'ACCEPTED'}
                  onChange={(e) => setProposal({ ...proposal, goalBonus: Number(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* Ballon d'Or Bonus Clause */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Ballon d'Or Milestone Payout</label>
                  <span className="font-mono font-bold text-amber-400">
                    £{proposal.ballonDorBonus.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={250_000}
                  max={3_000_000}
                  step={100_000}
                  value={proposal.ballonDorBonus}
                  disabled={negotiationStatus === 'ACCEPTED'}
                  onChange={(e) => setProposal({ ...proposal, ballonDorBonus: Number(e.target.value) })}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {onCancelNegotiation && (
              <button
                type="button"
                onClick={onCancelNegotiation}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Walk Away from Talks
              </button>
            )}

            {negotiationStatus === 'IN_PROGRESS' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCounterOffer}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-lg shadow-amber-500/20"
                >
                  Submit Counter-Offer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('document');
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors"
                >
                  Review Contract Text
                </button>
              </div>
            )}

            {negotiationStatus === 'ACCEPTED' && (
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setActiveTab('document');
                }}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Proceed to Sign Ratified Contract
              </button>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: WEEKLY WAGE SLIP & TAX ANALYSIS */}
      {activeTab === 'payslip' && (
        <div className="bg-white text-slate-900 rounded-xl p-8 shadow-xl border border-slate-300 font-mono text-xs max-w-2xl mx-auto">
          <div className="border-b-2 border-slate-800 pb-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-base text-slate-950">{club.name.toUpperCase()} PAYROLL DEPARTMENT</h3>
                <div className="text-slate-500 text-[11px]">Official HM Revenue / Tax Authority Registered Payslip</div>
              </div>
              <div className="text-right">
                <div className="text-slate-500">PAY PERIOD: WEEKLY</div>
                <div className="font-bold text-slate-900">SEASON {player.currentYear} · WEEK {player.currentWeek}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px]">EMPLOYEE NAME</span>
              <span className="font-bold text-slate-900">{player.lastName}, {player.firstName}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SQUAD ROLE</span>
              <span className="font-bold text-slate-900">{proposal.squadRole}</span>
            </div>
          </div>

          {/* Earnings Breakdown Table */}
          <div className="py-4 space-y-2 border-b border-slate-200">
            <div className="text-slate-500 font-bold mb-2">PAYMENTS & EARNINGS</div>
            <div className="flex justify-between">
              <span>Basic Weekly Wage</span>
              <span className="font-bold">£{proposal.weeklyWage.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Estimated Match Appearance Allowance</span>
              <span>£{proposal.appearanceBonus.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Image Rights & Marketing Retainer</span>
              <span>£{Math.round(proposal.weeklyWage * 0.15).toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-300 font-bold text-slate-950">
              <span>GROSS TOTAL EARNINGS</span>
              <span>£{(proposal.weeklyWage + proposal.appearanceBonus + Math.round(proposal.weeklyWage * 0.15)).toLocaleString()}.00</span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          {(() => {
            const taxInfo = calculateTaxBreakdown(club, proposal.weeklyWage);
            const agentDeduction = Math.round(proposal.weeklyWage * (proposal.agentFeePercent / 100));
            const netTakeHome = Math.max(0, taxInfo.netWeeklyWage - agentDeduction);

            return (
              <>
                <div className="py-4 space-y-2 border-b-2 border-slate-800">
                  <div className="text-slate-500 font-bold mb-2">
                    STATUTORY DEDUCTIONS · {taxInfo.taxAuthority.toUpperCase()}
                  </div>
                  <div className="flex justify-between text-rose-700">
                    <span>
                      {taxInfo.country} Athlete Income Tax ({taxInfo.marginalRatePercent}%)
                    </span>
                    <span>-£{taxInfo.taxDeductedWeekly.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>
                      Licensed Agent Intermediary Fee ({proposal.agentFeePercent}%)
                    </span>
                    <span>-£{agentDeduction.toLocaleString()}.00</span>
                  </div>
                  <div className="text-[10px] text-slate-500 italic pt-1">
                    Scheme: {taxInfo.taxSchemeName} ({taxInfo.notes})
                  </div>
                </div>

                {/* Net Take-Home */}
                <div className="pt-4 flex justify-between items-center bg-slate-100 p-3 rounded mt-4">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">
                      NET TAKE-HOME PAY (AFTER {taxInfo.country.toUpperCase()} TAX)
                    </div>
                    <div className="text-xs text-slate-600">
                      Directly transferred into player bank account
                    </div>
                  </div>
                  <div className="text-xl font-black text-emerald-800">
                    £{netTakeHome.toLocaleString()}.00
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};
