import React, { useState } from 'react';
import { Player, BrandAmbassadorDeal } from '../types/game';
import { BRAND_AMBASSADOR_CATALOG } from '../data/brandAmbassadorData';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Award, CheckCircle, Crown, DollarSign, Globe, Lock, 
  Sparkles, Star, TrendingUp, Watch, Shirt, Gamepad2, HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BrandAmbassadorModuleProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export const BrandAmbassadorModule: React.FC<BrandAmbassadorModuleProps> = ({ player, onUpdatePlayer }) => {
  const currency = player.preferredCurrency || 'GBP';
  const playerPopularity = player.popularity ?? player.fanReputation ?? 30;

  // Active Deals
  const activeDeals = player.brandDeals || [];
  const [notice, setNotice] = useState<string | null>(null);

  const getCategoryIcon = (category: BrandAmbassadorDeal['category']) => {
    switch (category) {
      case 'SPORTSWEAR': return <Shirt className="w-4 h-4 text-emerald-400" />;
      case 'GAMING_ESPORTS': return <Gamepad2 className="w-4 h-4 text-blue-400" />;
      case 'LUXURY_WATCH': return <Watch className="w-4 h-4 text-amber-400" />;
      case 'HIGH_FASHION': return <Crown className="w-4 h-4 text-purple-400" />;
      case 'GLOBAL_CHARITY': return <HeartHandshake className="w-4 h-4 text-rose-400" />;
      default: return <Award className="w-4 h-4 text-emerald-400" />;
    }
  };

  const handleSignBrandDeal = (deal: BrandAmbassadorDeal) => {
    sounds.playFanfare();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });

    const newDeal = { ...deal, active: true };
    const updatedDeals = [...activeDeals, newDeal];
    const newBank = player.bankBalance + deal.upfrontSigningFee;
    const newPopularity = Math.min(100, playerPopularity + deal.popularityBoost);

    onUpdatePlayer({
      ...player,
      bankBalance: newBank,
      totalCareerEarnings: player.totalCareerEarnings + deal.upfrontSigningFee,
      popularity: newPopularity,
      fanReputation: newPopularity,
      brandDeals: updatedDeals,
      lifestyleAssets: {
        ...player.lifestyleAssets,
        personalBrandLevel: (player.lifestyleAssets?.personalBrandLevel || 1) + 1,
      },
    });

    setNotice(`Signed exclusive brand partnership with ${deal.brandName}! Received ${formatCurrency(deal.upfrontSigningFee, currency)} signing bonus. Popularity +${deal.popularityBoost}%.`);
  };

  return (
    <div className="space-y-6">
      {/* Brand Ambassador Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
              <Crown className="w-4 h-4" />
              Off-Pitch Endorsements & Cultural Influence
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Global Brand Ambassador Contracts
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Modern football icons are more than athletes—they are global tastemakers, fashion icons, and humanitarian ambassadors. 
              Sign multi-million pound endorsement contracts with elite global brands to multiply your net worth and global popularity.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-850 shrink-0 text-right space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Commercial Portfolio</span>
            <div className="text-2xl font-black font-mono text-emerald-400">
              {activeDeals.length} Active Contracts
            </div>
            <span className="text-xs text-slate-400 block font-mono">
              Popularity: <strong className="text-white">{playerPopularity}%</strong>
            </span>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* Ambassador Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {BRAND_AMBASSADOR_CATALOG.map((deal) => {
          const isSigned = activeDeals.some(d => d.id === deal.id);
          const meetsPopularity = playerPopularity >= deal.requiredPopularity;

          return (
            <div
              key={deal.id}
              className={`p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-5 ${
                isSigned
                  ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg'
                  : meetsPopularity
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                  : 'bg-slate-950/60 border-slate-850/60 opacity-70'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono text-slate-300">
                    {getCategoryIcon(deal.category)}
                    <span>{deal.category.replace('_', ' ')}</span>
                  </span>

                  {isSigned ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700">
                      <CheckCircle className="w-3.5 h-3.5" /> Official Ambassador
                    </span>
                  ) : meetsPopularity ? (
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                      Eligible to Sign
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                      <Lock className="w-3 h-3" /> Req: {deal.requiredPopularity}% Popularity
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{deal.brandName}</h3>
                  <div className="text-xs font-bold text-amber-400">{deal.title}</div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {deal.description}
                </p>

                {/* Deal Perks */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contractual Ambassador Benefits:</span>
                  {deal.perks.map((perk, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Terms & Call to Action */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Upfront Signing Bonus</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    +{formatCurrency(deal.upfrontSigningFee, currency)}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-mono">
                    Retainer: {formatCurrency(deal.annualRetainer, currency)} / yr
                  </span>
                </div>

                {isSigned ? (
                  <button
                    disabled
                    className="px-5 py-2.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl cursor-default"
                  >
                    Contract Active
                  </button>
                ) : (
                  <button
                    onClick={() => handleSignBrandDeal(deal)}
                    disabled={!meetsPopularity}
                    className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow transition-all cursor-pointer ${
                      meetsPopularity
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                    }`}
                  >
                    {meetsPopularity ? 'Sign Ambassador Accord' : `Locked (${deal.requiredPopularity}%)`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
