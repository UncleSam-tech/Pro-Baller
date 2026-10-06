import React, { useState } from 'react';
import { Player, SponsorDeal } from '../types/game';
import { SPONSOR_CATALOG } from '../data/sponsors';
import { sounds } from '../utils/soundFx';
import { Award, Briefcase, Car, Check, CheckCircle, CreditCard, DollarSign, Home, Shield, Sparkles, UserCheck, Users } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LifestyleShopProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export const LifestyleShop: React.FC<LifestyleShopProps> = ({ player, onUpdatePlayer }) => {
  const [activeTab, setActiveTab] = useState<'sponsors' | 'staff' | 'lifestyle'>('sponsors');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleSignSponsor = (catalogItem: typeof SPONSOR_CATALOG[0]) => {
    sounds.playPenScratch();
    const newDeal: SponsorDeal = {
      ...catalogItem,
      yearsRemaining: 3,
      active: true,
    };

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10B981', '#F59E0B', '#3B82F6'],
    });

    onUpdatePlayer({
      ...player,
      sponsors: [...player.sponsors.filter(s => s.category !== catalogItem.category), newDeal],
      bankBalance: player.bankBalance + 15_000, // Upfront signing bonus
      fanReputation: Math.min(100, player.fanReputation + 6),
    });

    setActionNotice(`Signed official endorsement partnership with ${catalogItem.brandName}! Weekly stipend and gear perks active.`);
  };

  const handleUpgradeStaff = (role: 'agent' | 'physio' | 'nutritionist' | 'pr', tier: string, cost: number) => {
    sounds.playClick();
    if (player.bankBalance < cost) {
      setActionNotice('Insufficient bank balance to retain this elite professional.');
      return;
    }

    const updatedStaff = { ...player.staff };
    if (role === 'agent') updatedStaff.agentTier = tier as typeof player.staff.agentTier;
    if (role === 'physio') updatedStaff.physioTier = tier as typeof player.staff.physioTier;
    if (role === 'nutritionist') updatedStaff.nutritionistTier = tier as typeof player.staff.nutritionistTier;
    if (role === 'pr') updatedStaff.prSpecialistTier = tier as typeof player.staff.prSpecialistTier;

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - cost,
      staff: updatedStaff,
    });

    sounds.playFanfare();
    setActionNotice(`Successfully hired new ${role.toUpperCase()} professional. Upgraded support team perks unlocked.`);
  };

  const handlePurchaseAsset = (type: 'residence' | 'car' | 'charity', name: string, cost: number) => {
    sounds.playClick();
    if (player.bankBalance < cost) {
      setActionNotice('Insufficient funds in personal bank account.');
      return;
    }

    const updatedAssets = { ...player.lifestyleAssets };
    if (type === 'residence') updatedAssets.residence = name;
    if (type === 'car') updatedAssets.car = name;
    if (type === 'charity') updatedAssets.charityFounded = true;

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - cost,
      lifestyleAssets: updatedAssets,
      morale: Math.min(100, player.morale + 10),
      fanReputation: type === 'charity' ? Math.min(100, player.fanReputation + 15) : player.fanReputation,
    });

    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    setActionNotice(`Acquisition successful: ${name}!`);
  };

  // Calculate total weekly commercial income
  const totalWeeklySponsorPay = player.sponsors.reduce((sum, s) => sum + s.weeklyPay, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Wealth & Bank Balance Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold">
            Personal Finances & Commercial Holdings
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            Player Wealth, Entourage & Sponsorships
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
            <span>Career Gross Earnings: <strong className="text-white font-mono">£{player.totalCareerEarnings.toLocaleString()}</strong></span>
            <span>·</span>
            <span>Weekly Sponsor Stipend: <strong className="text-emerald-400 font-mono">+£{totalWeeklySponsorPay.toLocaleString()} / wk</strong></span>
          </div>
        </div>

        {/* Bank Account Ledger Balance */}
        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 min-w-[220px]">
          <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            Liquid Bank Balance
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono mt-1">
            £{player.bankBalance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => { sounds.playClick(); setActiveTab('sponsors'); }}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'sponsors' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Commercial Brand Sponsorships
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('staff'); }}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'staff' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Personal Staff & Super Agents
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('lifestyle'); }}
          className={`py-2 px-4 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'lifestyle' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          Properties, Vehicles & Charity
        </button>
      </div>

      {actionNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TAB 1: SPONSORSHIPS */}
      {activeTab === 'sponsors' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SPONSOR_CATALOG.map(deal => {
            const isSigned = player.sponsors.some(s => s.id === deal.id);
            return (
              <div 
                key={deal.id}
                className={`p-5 rounded-xl border flex flex-col justify-between space-y-3 ${
                  isSigned 
                    ? 'bg-slate-900 border-emerald-500 shadow-md' 
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white">{deal.brandName}</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      £{deal.weeklyPay.toLocaleString()} / wk
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400">Requirements: {deal.requirements}</div>
                  <div className="text-xs text-amber-300/90 font-medium mt-2 bg-slate-950 p-2 rounded border border-slate-800">
                    Perks: {deal.perks}
                  </div>
                </div>

                {isSigned ? (
                  <div className="py-2 text-center text-xs font-bold text-emerald-400 bg-emerald-950/80 rounded-lg flex items-center justify-center gap-1.5 border border-emerald-800">
                    <Check className="w-4 h-4" />
                    Active Contract Partner
                  </div>
                ) : (
                  <button
                    onClick={() => handleSignSponsor(deal)}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow"
                  >
                    Sign Endorsement Deal (£15k Upfront)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: PERSONAL STAFF & AGENTS */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agent Tier Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Player Representative (Agent)</h3>
            </div>
            <div className="text-xs text-slate-400">
              Current: <strong className="text-white capitalize">{player.staff.agentTier.replace('_', ' ')}</strong>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Registered FA Agent</div>
                  <div className="text-slate-400 text-[11px]">+10% negotiation leverage with clubs</div>
                </div>
                {player.staff.agentTier === 'registered' || player.staff.agentTier === 'elite' || player.staff.agentTier === 'super_agent' ? (
                  <span className="text-emerald-400 font-bold">Retained</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('agent', 'registered', 12_000)}
                    className="py-1 px-3 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Hire (£12k)
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Elite Agency (Stellar Sports)</div>
                  <div className="text-slate-400 text-[11px]">+25% higher wage offers from Top 5 leagues</div>
                </div>
                {player.staff.agentTier === 'elite' || player.staff.agentTier === 'super_agent' ? (
                  <span className="text-emerald-400 font-bold">Retained</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('agent', 'elite', 45_000)}
                    className="py-1 px-3 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Hire (£45k)
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Super Agent (Jorge Mendes Jr.)</div>
                  <div className="text-slate-400 text-[11px]">Unlocks Real Madrid/Man City bids + colossal release clauses</div>
                </div>
                {player.staff.agentTier === 'super_agent' ? (
                  <span className="text-emerald-400 font-bold">Retained</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('agent', 'super_agent', 150_000)}
                    className="py-1 px-3 bg-amber-500 text-slate-950 rounded font-bold hover:bg-amber-400 cursor-pointer"
                  >
                    Hire (£150k)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Performance Support */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Performance Entourage</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Personal Physiotherapist</div>
                  <div className="text-slate-400 text-[11px]">Cuts injury duration by 50% & boosts weekly stamina recovery</div>
                </div>
                {player.staff.physioTier === 'elite' ? (
                  <span className="text-emerald-400 font-bold">Active</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('physio', 'elite', 35_000)}
                    className="py-1 px-3 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Retain (£35k)
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Private Sports Nutritionist</div>
                  <div className="text-slate-400 text-[11px]">+5 max physical stamina ceiling</div>
                </div>
                {player.staff.nutritionistTier === 'elite' ? (
                  <span className="text-emerald-400 font-bold">Active</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('nutritionist', 'elite', 25_000)}
                    className="py-1 px-3 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Retain (£25k)
                  </button>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Global PR & Media Manager</div>
                  <div className="text-slate-400 text-[11px]">+20% Fan Morale & protects reputation during press interviews</div>
                </div>
                {player.staff.prSpecialistTier === 'elite' ? (
                  <span className="text-emerald-400 font-bold">Active</span>
                ) : (
                  <button
                    onClick={() => handleUpgradeStaff('pr', 'elite', 30_000)}
                    className="py-1 px-3 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-500 cursor-pointer"
                  >
                    Retain (£30k)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROPERTIES, VEHICLES & CHARITY */}
      {activeTab === 'lifestyle' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Residences */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">Primary Residence</h3>
            </div>
            <div className="text-xs text-slate-400">Current: <strong className="text-white">{player.lifestyleAssets.residence}</strong></div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => handlePurchaseAsset('residence', 'City Centre Luxury Penthouse', 120_000)}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-left flex justify-between items-center cursor-pointer"
              >
                <span>Luxury Penthouse</span>
                <span className="font-bold text-emerald-400 font-mono">£120k</span>
              </button>

              <button
                onClick={() => handlePurchaseAsset('residence', 'Gated Countryside Modern Villa', 450_000)}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-left flex justify-between items-center cursor-pointer"
              >
                <span>Gated Modern Villa</span>
                <span className="font-bold text-emerald-400 font-mono">£450k</span>
              </button>
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Automotive Fleet</h3>
            </div>
            <div className="text-xs text-slate-400">Current: <strong className="text-white">{player.lifestyleAssets.car}</strong></div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => handlePurchaseAsset('car', 'Mercedes-AMG G63 SUV', 85_000)}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-left flex justify-between items-center cursor-pointer"
              >
                <span>G63 Luxury SUV</span>
                <span className="font-bold text-amber-400 font-mono">£85k</span>
              </button>

              <button
                onClick={() => handlePurchaseAsset('car', 'Ferrari 296 GTB Supercar', 240_000)}
                className="w-full p-2.5 bg-slate-950 hover:bg-slate-850 rounded border border-slate-800 text-left flex justify-between items-center cursor-pointer"
              >
                <span>Ferrari Supercar</span>
                <span className="font-bold text-amber-400 font-mono">£240k</span>
              </button>
            </div>
          </div>

          {/* Philanthropy */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Youth Charity Foundation</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Founding a grassroots academy charity to fund boot kits and pitches for underprivileged children. Massive boost to public legacy and fan popularity.
            </p>

            {player.lifestyleAssets.charityFounded ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                Charity Foundation Active
              </div>
            ) : (
              <button
                onClick={() => handlePurchaseAsset('charity', 'Grassroots Youth Foundation', 100_000)}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Endow Foundation (£100k)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
