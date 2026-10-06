import React, { useState } from 'react';
import { Club, ContractClauses, Player, TransferOffer } from '../types/game';
import { CLUBS_DATABASE } from '../data/clubs';
import { generateProContract } from '../utils/contractGenerator';
import { sounds } from '../utils/soundFx';
import { ArrowRightLeft, Building2, CheckCircle, Flame, Globe, Radio, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface TransferMarketProps {
  player: Player;
  onReviewOfferContract: (club: Club, contract: ContractClauses) => void;
  onRequestTransfer: () => void;
  onRequestLoan: () => void;
}

export const TransferMarket: React.FC<TransferMarketProps> = ({
  player,
  onReviewOfferContract,
  onRequestTransfer,
  onRequestLoan,
}) => {
  // Generate dynamic transfer offers based on player's overall rating
  const [offers, setOffers] = useState<TransferOffer[]>(() => {
    const list: TransferOffer[] = [];
    const interestedClubs = CLUBS_DATABASE.filter(c => 
      c.id !== player.currentClubId && 
      c.reputation >= player.overallRating - 6 &&
      c.reputation <= player.overallRating + 12
    ).slice(0, 3);

    interestedClubs.forEach((c, idx) => {
      const contract = generateProContract(c, player);
      const transferFee = Math.round(player.marketValue * (1.1 + (idx * 0.15)));
      list.push({
        id: `offer_${c.id}_${Date.now()}`,
        club: c,
        transferFee,
        proposedContract: contract,
        interestReason: `Impressed by rapid development and high technical ceiling. Manager ${c.managerName} requested signing.`,
        expiresWeeks: 3,
        squadRole: contract.squadRole,
      });
    });

    return list;
  });

  const [transferRequestStatus, setTransferRequestStatus] = useState<string | null>(null);

  const handleTransferRequest = () => {
    sounds.playClick();
    onRequestTransfer();
    setTransferRequestStatus('Formal written transfer request submitted to Chief Executive. The club will listen to offers.');
  };

  const handleLoanRequest = () => {
    sounds.playClick();
    onRequestLoan();
    setTransferRequestStatus('Loan listed! Your agent is fielding loan approaches from competitive clubs with guaranteed starting minutes.');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Transfer Window Status & Breaking News Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
              Transfer Window Active · Global Market Open
            </span>
          </div>

          <div className="text-xs text-slate-400">
            Player Market Valuation: <strong className="text-white font-mono text-sm">£{(player.marketValue / 1_000_000).toFixed(1)}M</strong>
          </div>
        </div>

        {/* Breaking Rumor Ticker */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3 text-xs">
          <Radio className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
          <div className="text-slate-300">
            <strong className="text-rose-400 font-bold">BREAKING NEWS: </strong>
            Scouts from top European clubs were seen watching {player.firstName} {player.lastName} during recent league matches. Agent {player.currentContract.agentName} has received initial inquiries.
          </div>
        </div>
      </div>

      {/* Transfer Request Status Feedback */}
      {transferRequestStatus && (
        <div className="p-4 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 text-xs flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{transferRequestStatus}</span>
        </div>
      )}

      {/* Active Club Transfer Bids Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Active Inbound Transfer Offers & Contracts
        </h3>

        {offers.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            No active bids on the table currently. Raise your match rating and goals tally to trigger top club interest!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map(offer => (
              <div 
                key={offer.id} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shadow-md"
                      style={{ backgroundColor: offer.club.primaryColor }}
                    >
                      {offer.club.shortName}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{offer.club.name}</h4>
                      <div className="text-xs text-slate-400">{offer.club.league} · Tier {offer.club.tier}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Transfer Fee:</span>
                      <span className="font-bold text-white">£{(offer.transferFee / 1_000_000).toFixed(1)}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Offered Wage:</span>
                      <span className="font-bold text-emerald-400">£{offer.proposedContract.weeklyWage.toLocaleString()} / wk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Squad Role:</span>
                      <span className="text-amber-400 font-bold">{offer.squadRole}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {offer.interestReason}
                  </p>
                </div>

                <button
                  onClick={() => onReviewOfferContract(offer.club, offer.proposedContract)}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  Review Contract & Negotiate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Player Career Agency Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Player Career Direction & Agent Actions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-white text-xs">Request Season Loan Spell</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              If your manager is not starting you, asking for a loan allows you to gain crucial competitive match sharpness and goals at another club.
            </p>
            <button
              onClick={handleLoanRequest}
              className="mt-2 py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Request Loan Listing
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-rose-400 text-xs">Submit Formal Transfer Request</div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hands in an official written transfer request to the board. Lowers manager trust and chemistry but forces the club to accept incoming bids.
            </p>
            <button
              onClick={handleTransferRequest}
              className="mt-2 py-1.5 px-4 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Submit Transfer Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
