import React, { useState } from 'react';
import { Club, Player, BrandAmbassadorDeal } from '../types/game';
import { BRAND_AMBASSADOR_CATALOG } from '../data/brandAmbassadorData';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Camera, CheckCircle, Flame, Heart, MessageSquare, Mic, Radio, 
  Share2, Sparkles, TrendingUp, Users, Award, Shield, DollarSign, 
  Zap, Briefcase, CheckCircle2, ArrowRight, ExternalLink 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MediaRelationsProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onClose?: () => void;
  initialStage?: 'interview' | 'brand_deals';
}

interface InterviewScenario {
  id: string;
  context: 'post_match_tunnel' | 'press_conference' | 'social_media';
  title: string;
  interviewer: string;
  outlet: string;
  prompt: string;
  options: {
    label: string;
    quote: string;
    impactDescription: string;
    managerDelta: number;
    fanDelta: number;
    chemistryDelta: number;
  }[];
}

export function getMediaScenarios(player: Player, club: Club): InterviewScenario[] {
  return [
    // 1. Post-Match Tunnel Flash Interview
    {
      id: 'tunnel_derby_win',
      context: 'post_match_tunnel',
      title: 'Post-Match Tunnel Flash Interview',
      interviewer: 'Geoff Shreeves',
      outlet: 'Sky Sports Flash',
      prompt: `"You just battled hard on the pitch! The supporters are chanting your name in the stands. What was your tactical mindset heading into the crucial moments today?"`,
      options: [
        {
          label: 'Dedicate Performance to the Supporters & Squad',
          quote: `"This performance belongs to every single supporter who sang for 90 minutes. My teammates fought like lions today; I was just blessed to do my job for the badge."`,
          impactDescription: 'Massive surge in supporter love and locker room camaraderie.',
          managerDelta: 5,
          fanDelta: 15,
          chemistryDelta: 10,
        },
        {
          label: 'Express Ruthless Personal Confidence',
          quote: `"I live for clutch moments. When the clock hits minute 80 and everyone else's legs are shaking, that is my time to step forward and make things happen."`,
          impactDescription: 'Galáctico swagger that attracts commercial sponsor eyes worldwide.',
          managerDelta: -2,
          fanDelta: 12,
          chemistryDelta: 2,
        },
        {
          label: 'Acknowledge Tactical Strategy from the Manager',
          quote: `"The gaffer told us before stepping onto the pitch to exploit the spaces behind their defense. Full credit goes to our coaching staff and match preparation."`,
          impactDescription: 'Delights the manager and reinforces tactical discipline.',
          managerDelta: 12,
          fanDelta: 6,
          chemistryDelta: 6,
        },
      ],
    },
    {
      id: 'tunnel_tough_loss',
      context: 'post_match_tunnel',
      title: 'Post-Match Media Reaction',
      interviewer: 'Kelly Cates',
      outlet: 'Premier League Productions',
      prompt: `"A grueling match today with relentless physical pressure. How do you assess your individual sharpness and the team's response?"`,
      options: [
        {
          label: 'Take Accountability & Promise Relentless Work',
          quote: `"We have high standards here. I will look at the footage with our analysts on Monday morning and work twice as hard in training to put things right."`,
          impactDescription: 'Mature accountability that cements manager trust.',
          managerDelta: 10,
          fanDelta: 5,
          chemistryDelta: 8,
        },
        {
          label: 'Show Unapologetic Ambition & Hunger',
          quote: `"Every professional wants to play every second and dominate the pitch. I felt sharp and was desperate to create something extraordinary."`,
          impactDescription: 'Shows raw hunger that commercial brands find compelling.',
          managerDelta: 2,
          fanDelta: 9,
          chemistryDelta: 0,
        },
      ],
    },
    // 2. Pre-Match / Midweek Press Conference
    {
      id: 'press_transfer_links',
      context: 'press_conference',
      title: 'Midweek Press Room Conference',
      interviewer: 'David Ornstein',
      outlet: 'The Athletic',
      prompt: `"${player.lastName}, rumors are circulating that European scouts are flying in to monitor your contract situation. How are you handling the transfer speculation?"`,
      options: [
        {
          label: 'Total Commitment to Current Club',
          quote: `"My heart and focus are 100% committed to ${club.name}. I don't listen to tabloid rumors; my only job is winning matches with my brothers here."`,
          impactDescription: 'Huge relief for the board and adored by home supporters.',
          managerDelta: 8,
          fanDelta: 14,
          chemistryDelta: 10,
        },
        {
          label: 'Open-Ended Ambition for World Football',
          quote: `"It is flattering when elite continental clubs watch your game. Every footballer dreams of playing on the biggest stages in world football one day."`,
          impactDescription: 'Excites European scouts and sponsor agents, but puts club on notice.',
          managerDelta: -6,
          fanDelta: 4,
          chemistryDelta: -4,
        },
      ],
    },
  ];
}

export const MediaRelations: React.FC<MediaRelationsProps> = ({
  player,
  club,
  onUpdatePlayer,
  onClose,
  initialStage = 'interview',
}) => {
  const [activeStage, setActiveStage] = useState<'interview' | 'brand_deals'>(initialStage);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);
  const [brandNotice, setBrandNotice] = useState<string | null>(null);

  const currency = player.preferredCurrency || 'GBP';
  const scenarios = getMediaScenarios(player, club);
  const scenario = scenarios[selectedScenarioIndex] || scenarios[0];

  // Active brand deals IDs
  const activeBrandDealIds = (player.brandDeals || []).map(b => b.id);

  // Performance-based unlocking:
  // If player has good rating (season avg >= 6.8 or appearances > 0), unlocks bonus offers!
  const seasonAvgRating = player.seasonStats.avgRating || 6.5;

  const handleChooseAnswer = (opt: typeof scenario.options[0]) => {
    sounds.playCameraClick();

    const newTrust = Math.min(100, Math.max(10, player.managerTrust + opt.managerDelta));
    const newFan = Math.min(100, Math.max(10, player.fanReputation + opt.fanDelta));
    const newChem = Math.min(100, Math.max(10, player.teamChemistry + opt.chemistryDelta));
    const newPop = Math.min(100, Math.max(10, (player.popularity || 30) + Math.round(opt.fanDelta * 0.6)));

    onUpdatePlayer({
      ...player,
      managerTrust: newTrust,
      fanReputation: newFan,
      teamChemistry: newChem,
      popularity: newPop,
    });

    setLastFeedback(`Interview broadcast live on television! Impact: Manager Trust (${opt.managerDelta >= 0 ? '+' : ''}${opt.managerDelta}%), Fan Approval (${opt.fanDelta >= 0 ? '+' : ''}${opt.fanDelta}%), Popularity (+${Math.round(opt.fanDelta * 0.6)})`);
  };

  const handleNext = () => {
    sounds.playClick();
    setLastFeedback(null);
    if (selectedScenarioIndex + 1 < scenarios.length) {
      setSelectedScenarioIndex(i => i + 1);
    } else {
      // Transition seamlessly to Brand Ambassador Deals after completing interviews!
      setActiveStage('brand_deals');
      setBrandNotice('Media interviews completed! Your charisma in front of the cameras has unlocked official Brand Ambassador proposals!');
    }
  };

  const handleSignBrandDeal = (deal: BrandAmbassadorDeal) => {
    sounds.playFanfare();
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });

    const updatedDeal: BrandAmbassadorDeal = {
      ...deal,
      active: true,
    };

    const currentDeals = player.brandDeals || [];
    const newDeals = [...currentDeals.filter(d => d.id !== deal.id), updatedDeal];

    // Weekly pay from annual retainer
    const weeklyIncomeStream = Math.round(deal.annualRetainer / 52);

    const updatedBankBalance = player.bankBalance + deal.upfrontSigningFee;
    const updatedCareerEarnings = player.totalCareerEarnings + deal.upfrontSigningFee;
    const updatedPopularity = Math.min(100, (player.popularity || 30) + deal.popularityBoost);
    const updatedFanRep = Math.min(100, player.fanReputation + Math.round(deal.popularityBoost * 0.5));

    onUpdatePlayer({
      ...player,
      bankBalance: updatedBankBalance,
      totalCareerEarnings: updatedCareerEarnings,
      popularity: updatedPopularity,
      fanReputation: updatedFanRep,
      brandDeals: newDeals,
    });

    setBrandNotice(`Contract Ratified! You are now the official brand ambassador for ${deal.brandName}! Upfront fee of ${formatCurrency(deal.upfrontSigningFee, currency)} credited immediately, unlocking +${formatCurrency(weeklyIncomeStream, currency)}/wk recurring retainer.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with Stage Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
              Press Room & Commercial Endorsements
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Broadcast Media & Brand Ambassadorship
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Handle tough press interrogations and leverage your public popularity into lucrative six-figure corporate brand endorsements.
            </p>
          </div>

          {/* Quick Stage Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => { sounds.playClick(); setActiveStage('interview'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStage === 'interview'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Flash Interview</span>
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveStage('brand_deals'); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStage === 'brand_deals'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Brand Deals ({activeBrandDealIds.length} Active)</span>
            </button>
          </div>
        </div>

        {/* Reputation Meters Snapshot */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Manager Trust</span>
            <span className="text-base font-bold text-white font-mono">{player.managerTrust}%</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Fan Approval</span>
            <span className="text-base font-bold text-emerald-400 font-mono">{player.fanReputation}%</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Global Popularity</span>
            <span className="text-base font-bold text-amber-400 font-mono">{player.popularity || 30}%</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-850">
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Season Rating</span>
            <span className="text-base font-bold text-blue-400 font-mono">{seasonAvgRating} / 10</span>
          </div>
        </div>
      </div>

      {brandNotice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{brandNotice}</span>
          </div>
          <button onClick={() => setBrandNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 1: POST-MATCH INTERVIEW */}
      {/* ========================================================= */}
      {activeStage === 'interview' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-750 flex items-center justify-center font-bold text-white shrink-0">
              <Camera className="w-5 h-5 text-amber-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-white">{scenario.interviewer}</span>
                <span>·</span>
                <span className="text-amber-400 font-semibold">{scenario.outlet}</span>
                <span>·</span>
                <span className="text-emerald-400 font-medium">{scenario.title}</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-200 mt-2 leading-relaxed italic">
                {scenario.prompt}
              </p>
            </div>
          </div>

          {lastFeedback ? (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-2xl text-emerald-200 text-xs flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{lastFeedback}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleNext}
                  className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{selectedScenarioIndex + 1 < scenarios.length ? 'Next Media Inquiry' : 'Complete & Unlock Brand Ambassador Deals'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              {scenario.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChooseAnswer(opt)}
                  className="w-full p-4 bg-slate-950 hover:bg-slate-850 rounded-2xl border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer"
                >
                  <div className="font-bold text-emerald-400 text-xs mb-1">
                    {opt.label}
                  </div>
                  <div className="font-medium text-white text-xs md:text-sm group-hover:text-emerald-200 transition-colors leading-relaxed">
                    {opt.quote}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{opt.impactDescription}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 2: BRAND AMBASSADOR ENDORSEMENTS */}
      {/* ========================================================= */}
      {activeStage === 'brand_deals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white">Commercial Endorsement Portfolios</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sign commercial ambassador deals to unlock upfront signing payouts and recurring weekly retainers.
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Media Hub
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BRAND_AMBASSADOR_CATALOG.map(deal => {
              const isSigned = activeBrandDealIds.includes(deal.id);
              const weeklyRetainer = Math.round(deal.annualRetainer / 52);
              const isEligible = (player.popularity || 30) >= deal.requiredPopularity || seasonAvgRating >= 7.2;

              return (
                <div
                  key={deal.id}
                  className={`p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    isSigned
                      ? 'bg-emerald-950/30 border-emerald-500/80 shadow-xl shadow-emerald-500/5'
                      : isEligible
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/60 border-slate-850 opacity-75'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded font-mono ${
                          deal.category === 'SPORTSWEAR'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : deal.category === 'LUXURY_WATCH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : deal.category === 'GAMING_ESPORTS'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : 'bg-purple-950 text-purple-300 border border-purple-800'
                        }`}>
                          {deal.category.replace('_', ' ')}
                        </span>
                        <h4 className="text-lg font-black text-white mt-1.5">{deal.brandName}</h4>
                        <div className="text-xs font-medium text-emerald-400">{deal.title}</div>
                      </div>

                      {isSigned ? (
                        <span className="text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-xl flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          ACTIVE
                        </span>
                      ) : !isEligible ? (
                        <span className="text-[10px] font-bold bg-slate-950 text-slate-500 border border-slate-800 px-2 py-1 rounded-lg">
                          Requires {deal.requiredPopularity}% Pop
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-xl font-mono">
                          OFFER OPEN
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {deal.description}
                    </p>

                    {/* Financial Rewards */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-2xl border border-slate-850 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Upfront Signing Fee</span>
                        <span className="text-sm font-bold text-white mt-0.5 block">
                          +{formatCurrency(deal.upfrontSigningFee, currency)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold block">Weekly Retainer Stream</span>
                        <span className="text-sm font-bold text-emerald-400 mt-0.5 block">
                          +{formatCurrency(weeklyRetainer, currency)} / wk
                        </span>
                      </div>
                    </div>

                    {/* Perks List */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Contract Privileges:</span>
                      {deal.perks.map((p, i) => (
                        <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <span className="text-emerald-400 shrink-0">✦</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-850">
                    {isSigned ? (
                      <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Contract Active · Retainer paid automatically every payday</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleSignBrandDeal(deal)}
                        disabled={!isEligible}
                        className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                          isEligible
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Award className="w-4 h-4" />
                        <span>Sign Ambassador Deal (+{formatCurrency(deal.upfrontSigningFee, currency)} Bonus)</span>
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
