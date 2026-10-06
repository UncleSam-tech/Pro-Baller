import React, { useState, useEffect } from 'react';
import { Club, Player, PostCareerProfile, PostCareerRole, LegacyStatusTier } from '../types/game';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Award, Briefcase, CheckCircle, ChevronRight, Compass, DollarSign, 
  Flame, Globe, Heart, Landmark, Play, Shield, Sparkles, Trophy, 
  Tv, UserCheck, Users, Zap 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RetirementTransitionModalProps {
  player: Player;
  club: Club;
  forcedReason?: 'AGE_35_PLUS' | 'SEVERE_RECURRING_INJURY' | 'VOLUNTARY_PINNACLE';
  onConfirmRetirement: (postCareer: PostCareerProfile) => void;
  onContinuePlaying?: () => void;
}

const POST_CAREER_ROLES: {
  role: PostCareerRole;
  title: string;
  badge: string;
  icon: any;
  salaryDescription: string;
  description: string;
  perks: string[];
}[] = [
  {
    role: 'HEAD_COACH',
    title: 'Tactical Manager / Head Coach',
    badge: 'Touchline Maestro',
    icon: Flame,
    salaryDescription: '£15,000 / week basic managerial retainer',
    description: 'Transition directly from the pitch to the technical area. Earn your UEFA Pro License, craft tactical systems, and lead your squad to silverware from the dugout.',
    perks: ['Managerial Tactics & Team Selections', 'Press Conference Mastery', 'Locker Room Leadership'],
  },
  {
    role: 'SPORTING_DIRECTOR',
    title: 'Club Sporting Director & Executive',
    badge: 'Boardroom Architect',
    icon: Briefcase,
    salaryDescription: '£22,000 / week club executive compensation',
    description: 'Step into executive club suites. Control multi-million pound transfer budgets, direct global scouting networks, and negotiate player contracts opposite sporting directors.',
    perks: ['Scout Global Wonderkids', 'Negotiate Buyout Clauses', 'Define Club Long-Term Vision'],
  },
  {
    role: 'TV_PUNDIT',
    title: 'Lead TV Matchday Pundit & Broadcaster',
    badge: 'Media Personality',
    icon: Tv,
    salaryDescription: '£12,000 / broadcast appearance + syndication',
    description: 'Command prime-time football television studios. Deliver sharp tactical breakdowns, critique weekend refereeing controversies, and interview Europe\'s elite stars.',
    perks: ['Zero Physical Stress', 'Massive Fan Influence', 'Global Television Spotlight'],
  },
  {
    role: 'ACADEMY_FOUNDER',
    title: 'Grassroots Academy Founder & Humanitarian',
    badge: 'Community Legend',
    icon: Heart,
    salaryDescription: 'Endowment dividends + hometown legacy pride',
    description: 'Build fully funded youth academies, medical clinics, and floodlit pitches back in your hometown and across developing nations to unearth the next generation.',
    perks: ['Immortal Hometown Reverence', 'Nurture Underprivileged Prodigies', 'Lasting Family Heritage'],
  },
  {
    role: 'PLAYER_AGENT',
    title: 'FIFA Licensed Player Representative',
    badge: 'Transfer Kingmaker',
    icon: UserCheck,
    salaryDescription: '5% - 10% commission on multi-million transfers',
    description: 'Found your own boutique sports representation agency. Guide teenagers through contract traps, GBE immigration matrices, and negotiate blockbuster release clauses.',
    perks: ['Huge Deal Commissions', 'Private Jet Jet-setting', 'Network with Elite Sporting Directors'],
  },
  {
    role: 'GLOBAL_ENTREPRENEUR',
    title: 'Venture Mogul & Minority Club Owner',
    badge: 'Generational Tycoon',
    icon: Landmark,
    salaryDescription: '12% annual portfolio yield on career wealth',
    description: 'Deploy your millions across sports-tech startups, luxury apparel lines, real estate developments, and acquire minority stakes in lower-league football clubs.',
    perks: ['Billionaire Trajectory', 'Club Equity Ownership', 'Global Commercial Empire'],
  },
];

export const RetirementTransitionModal: React.FC<RetirementTransitionModalProps> = ({
  player,
  club,
  forcedReason = 'AGE_35_PLUS',
  onConfirmRetirement,
  onContinuePlaying,
}) => {
  const [step, setStep] = useState<'DECISION' | 'CEREMONY' | 'CHOOSE_ROLE' | 'FINAL_SUMMARY'>('DECISION');
  const [selectedRole, setSelectedRole] = useState<PostCareerRole>('HEAD_COACH');

  const currency = player.preferredCurrency || 'GBP';

  // Career calculations
  const totalCareerGoals = (player.careerHistory || []).reduce((acc, s) => acc + (s.goals || 0), 0) + (player.seasonStats?.goals || 0);
  const totalCareerAssists = (player.careerHistory || []).reduce((acc, s) => acc + (s.assists || 0), 0) + (player.seasonStats?.assists || 0);
  const totalCareerApps = (player.careerHistory || []).reduce((acc, s) => acc + (s.appearances || 0), 0) + (player.seasonStats?.appearances || 0);
  const totalTrophies = (player.trophyCabinet || []).length;
  const ballonDors = (player.awards || []).filter(a => a.name.toLowerCase().includes('ballon')).length;
  const isSevereInjury = forcedReason === 'SEVERE_RECURRING_INJURY';

  // Determine Legacy Status Tier
  let legacyStatus: LegacyStatusTier = 'PRO_VETERAN';
  if (ballonDors >= 1 || totalCareerGoals >= 300 || totalTrophies >= 5) {
    legacyStatus = 'IMMORTAL_LEGEND';
  } else if (totalCareerGoals >= 120 || totalTrophies >= 2) {
    legacyStatus = 'WORLD_CLASS_ICON';
  } else if (totalCareerGoals >= 50 || totalCareerApps >= 150) {
    legacyStatus = 'CLUB_CULT_HERO';
  }

  const testimonialGateReceipts = Math.round(Math.max(120_000, player.marketValue * 0.15 + (totalCareerGoals * 5_000)));
  const weeklyPension = Math.round(1_800 + (totalCareerApps * 8) + (totalTrophies * 300));

  useEffect(() => {
    sounds.playFanfare();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  }, []);

  const handleProceedToCeremony = () => {
    sounds.playWhistle();
    setStep('CEREMONY');
  };

  const handleFinalizeRetirement = () => {
    sounds.playFanfare();
    confetti({ particleCount: 120, spread: 90 });

    const postCareer: PostCareerProfile = {
      retiredYear: player.currentYear,
      retiredAge: player.age,
      retirementReason: forcedReason,
      chosenRole: selectedRole,
      reputationScore: Math.min(100, Math.round(player.fanReputation * 0.6 + player.managerTrust * 0.4)),
      pensionWeeklyPayout: weeklyPension,
      legacyStatus,
      testimonialWinnings: testimonialGateReceipts,
      postCareerLog: [
        `Honored with a sold-out testimonial match at ${club.stadiumName} generating ${formatCurrency(testimonialGateReceipts, currency)} in gate receipts.`,
        `Formal jersey retired by ${club.name} in honor of exceptional dedication.`,
        `Entered the Hall of Fame as a designated ${legacyStatus.replace('_', ' ')}.`,
        `Commenced official post-career path as a ${selectedRole.replace('_', ' ')}.`,
      ],
    };

    onConfirmRetirement(postCareer);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl my-8 relative">
        {/* ======================================================== */}
        {/* STEP 1: FORMAL RETIREMENT DECISION */}
        {/* ======================================================== */}
        {step === 'DECISION' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 border border-amber-800/60 px-3 py-1 rounded-full">
                Career Milestone · Formal Retirement Crossroad
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white font-serif tracking-tight mt-2">
                The Final Whistle Beckons
              </h2>
              <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto">
                {isSevereInjury
                  ? `Club medical directors and independent orthopaedic specialists have delivered their formal verdict: after repeated severe muscle and ligament tears, continuing to play risk permanent mobility impairment.`
                  : `At age ${player.age}, having endured grueling domestic and continental battles across over ${totalCareerApps} matches, your body and representatives advise it is time to conclude your professional playing chapter.`}
              </p>
            </div>

            {/* Quick Career Snapshot Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center font-mono">
              <div className="p-2">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Career Apps</span>
                <span className="text-2xl font-black text-white">{totalCareerApps}</span>
              </div>
              <div className="p-2">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">All-Time Goals</span>
                <span className="text-2xl font-black text-emerald-400">{totalCareerGoals}</span>
              </div>
              <div className="p-2">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Silverware</span>
                <span className="text-2xl font-black text-amber-400">{totalTrophies} Trophies</span>
              </div>
              <div className="p-2">
                <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Net Worth</span>
                <span className="text-2xl font-black text-blue-400">{formatCurrency(player.bankBalance, currency)}</span>
              </div>
            </div>

            {/* Decision Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {!isSevereInjury && onContinuePlaying && (
                <button
                  onClick={() => {
                    sounds.playClick();
                    onContinuePlaying();
                  }}
                  className="w-full sm:w-1/2 py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>One Last Dance (Continue Playing 1 More Season)</span>
                </button>
              )}

              <button
                onClick={handleProceedToCeremony}
                className={`py-3.5 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black text-xs md:text-sm rounded-xl shadow-xl shadow-amber-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                  isSevereInjury || !onContinuePlaying ? 'w-full' : 'w-full sm:w-1/2'
                }`}
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>Hang Up The Boots · Enter The Hall of Fame</span>
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: TESTIMONIAL MATCH & CEREMONY */}
        {/* ======================================================== */}
        {step === 'CEREMONY' && (
          <div className="space-y-6">
            <div className="text-center space-y-2 border-b border-slate-800 pb-4">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Act II: The Testimonial Ceremony
              </span>
              <h2 className="text-3xl font-black text-white font-serif tracking-tight">
                Guard of Honor at {club.stadiumName}
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mx-auto">
                60,000 passionate supporters stand in standing ovation as your teammates, rivals, and boyhood coaches form a guard of honor.
              </p>
            </div>

            {/* Emotional Farewell Card */}
            <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 rounded-2xl border border-amber-500/40 space-y-4">
              <blockquote className="border-l-4 border-amber-500 pl-4 text-xs md:text-sm text-amber-200/90 italic font-serif leading-relaxed">
                "From the dusty grassroots pitches of {player.person?.hometown || 'home'} to the grandest stadiums in world football, I gave every ounce of sweat, blood, and passion to the badge. Football made the man; now the man gives back to football."
              </blockquote>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Testimonial Proceeds</span>
                  <span className="text-base font-bold text-emerald-400">+{formatCurrency(testimonialGateReceipts, currency)}</span>
                  <span className="text-[10px] text-slate-500 block">Added to family wealth</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">PFA Weekly Pension</span>
                  <span className="text-base font-bold text-amber-400">{formatCurrency(weeklyPension, currency)} / wk</span>
                  <span className="text-[10px] text-slate-500 block">Guaranteed life stipend</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-sans">Legacy Tier Bestowed</span>
                  <span className="text-base font-bold text-cyan-400">{legacyStatus.replace('_', ' ')}</span>
                  <span className="text-[10px] text-slate-500 block">Permanent Hall of Fame</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { sounds.playClick(); setStep('CHOOSE_ROLE'); }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Proceed to Choose Life After Football Vocation →</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: CHOOSE POST-CAREER VOCATION */}
        {/* ======================================================== */}
        {step === 'CHOOSE_ROLE' && (
          <div className="space-y-6">
            <div className="text-center space-y-1 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Act III: Post-Career Transition Screen
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Manage Life After Football
              </h2>
              <p className="text-xs text-slate-400">
                A footballer dies twice; the first is when they stop playing. Choose how you will dominate the next chapter.
              </p>
            </div>

            {/* Grid of Post-Career Vocations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {POST_CAREER_ROLES.map(({ role, title, badge, icon: RoleIcon, salaryDescription, description, perks }) => {
                const isSelected = selectedRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => { sounds.playClick(); setSelectedRole(role); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/50'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <RoleIcon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-black text-white">{title}</span>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                          {badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                        {description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <div className="text-[10px] font-mono text-emerald-400 font-bold mb-1">
                        Compensation: {salaryDescription}
                      </div>
                      <div className="flex flex-wrap gap-1 text-[9px] text-slate-400">
                        {perks.map((p, idx) => (
                          <span key={idx} className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            ✓ {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-400">
                Selected Role: <strong className="text-amber-300">{selectedRole.replace('_', ' ')}</strong>
              </span>

              <button
                onClick={handleFinalizeRetirement}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Ratify Post-Career Appointment & Conclude Active Career</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
