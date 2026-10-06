import React, { useState } from 'react';
import { Club, PersonalCoach, PersonalCoachSpecialty, Player } from '../types/game';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Award, Briefcase, CheckCircle2, ChevronRight, Dumbbell, Flame, 
  GraduationCap, Heart, Shield, Sparkles, Target, Zap, UserCheck, AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PersonalCoachHubProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
}

export const PersonalCoachHub: React.FC<PersonalCoachHubProps> = ({
  player,
  club,
  onUpdatePlayer,
}) => {
  const currency = player.preferredCurrency || 'GBP';

  // Roster of Hireable Personal Performance Mentors & Specialists
  const [coaches, setCoaches] = useState<PersonalCoach[]>([
    {
      id: 'coach_finishing',
      name: 'Gianluca Rossi',
      specialty: 'STRIKING_FINISHING',
      tier: 'SPECIALIST',
      weeklySalaryGBP: 1_800,
      hired: true,
      avatarIcon: '🎯',
      tagline: 'Former Serie A Capocannoniere & Finishing Technician',
      attributeBuffs: { finishing: 2, curve: 1, shotPower: 1 },
      specialPerk: 'Ice-Cold Instinct: +12% success on breakaway 1-on-1 moments in matches.',
      coachingQuote: '"Open your hips at the very last stride. The goalkeeper commits before you strike — make them pay."',
    },
    {
      id: 'coach_speed',
      name: 'Marcus "Jet" Sterling',
      specialty: 'SPEED_CONDITIONING',
      tier: 'WORLD_CLASS',
      weeklySalaryGBP: 3_200,
      hired: false,
      avatarIcon: '⚡',
      tagline: 'Olympic Sprint Coach & Biomechanical Acceleration Consultant',
      attributeBuffs: { pace: 3, acceleration: 2, stamina: 2 },
      specialPerk: 'Burst Overload: Reduces late-game match fatigue decay by 30%.',
      coachingQuote: '"First three steps dictate whether you beat the defender. Drive through the balls of your feet."',
    },
    {
      id: 'coach_mental',
      name: 'Dr. Elena Rostova',
      specialty: 'MENTAL_COMPOSURE',
      tier: 'SPECIALIST',
      weeklySalaryGBP: 2_100,
      hired: false,
      avatarIcon: '🧠',
      tagline: 'High-Performance Sports Neuropsychologist & Pressure Mentor',
      attributeBuffs: { composure: 3, vision: 1, leadership: 2 },
      specialPerk: 'Unshakable Nerve: Completely eliminates penalty shootout nerves and road stadium booing debuffs.',
      coachingQuote: '"Crowd noise is just acoustic air. Your breath controls your heartbeat; your focus controls the ball."',
    },
    {
      id: 'coach_physio',
      name: 'Dr. Aris Thorne',
      specialty: 'PHYSIO_RECOVERY',
      tier: 'WORLD_CLASS',
      weeklySalaryGBP: 3_500,
      hired: true,
      avatarIcon: '🩺',
      tagline: 'Premier Sports Science Lead & Cryotherapy Recovery Specialist',
      attributeBuffs: { stamina: 3 },
      specialPerk: 'Rapid Cellular Regeneration: Cuts all injury recovery times by 50% and grants +10 Energy per week.',
      coachingQuote: '"Sleep, contrast baths, and fascia release. Recovery is where champions are actually built."',
    },
    {
      id: 'coach_tactical',
      name: 'Benoît Fontaine',
      specialty: 'TACTICAL_ANALYSIS',
      tier: 'SPECIALIST',
      weeklySalaryGBP: 1_500,
      hired: false,
      avatarIcon: '📊',
      tagline: 'UEFA Pro Tactical Video Analyst & Opposition Scout',
      attributeBuffs: { positioning: 3, vision: 2 },
      specialPerk: 'Tactical Foresight: Reveals opposition defensive blindspots before match kick-off.',
      coachingQuote: '"Every backline has a weak channel. We study their center back tendencies so you exploit them on autopilot."',
    },
  ]);

  const [selectedCoachId, setSelectedCoachId] = useState<string>(coaches[0]?.id || '');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const selectedCoach = coaches.find(c => c.id === selectedCoachId) || coaches[0];

  const totalWeeklySalaries = coaches
    .filter(c => c.hired)
    .reduce((sum, c) => sum + c.weeklySalaryGBP, 0);

  // Hire or Release Coach
  const handleToggleHire = (coach: PersonalCoach) => {
    sounds.playClick();
    if (!coach.hired) {
      if (player.bankBalance < coach.weeklySalaryGBP) {
        setFeedbackNotice(`Insufficient personal funds to hire ${coach.name}. Weekly wage is ${formatCurrency(coach.weeklySalaryGBP, currency)}.`);
        return;
      }
      sounds.playFanfare();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });

      setCoaches(prev => prev.map(c => c.id === coach.id ? { ...c, hired: true } : c));
      setFeedbackNotice(`🤝 Officially Employed! ${coach.name} has joined your private performance entourage.`);
    } else {
      setCoaches(prev => prev.map(c => c.id === coach.id ? { ...c, hired: false } : c));
      setFeedbackNotice(`Released ${coach.name} from personal coaching staff.`);
    }
  };

  // Conduct 1-on-1 Masterclass Drill Session
  const handleBookSession = (coach: PersonalCoach) => {
    if (!coach.hired) {
      setFeedbackNotice(`You must employ ${coach.name} before booking private masterclasses!`);
      return;
    }
    if (player.energy < 12) {
      sounds.playClick();
      setFeedbackNotice(`⚠️ You have only ${player.energy}% energy left! Rest before intensive private coaching.`);
      return;
    }

    sounds.playFanfare();
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });

    // Apply attribute gains
    const updatedAttrs = { ...player.attributes };
    let buffSummary = '';
    Object.entries(coach.attributeBuffs).forEach(([attrKey, gain]) => {
      const k = attrKey as keyof typeof player.attributes;
      if (typeof updatedAttrs[k] === 'number') {
        updatedAttrs[k] = Math.min(99, updatedAttrs[k] + (gain || 1));
        buffSummary += `+${gain} ${attrKey} `;
      }
    });

    onUpdatePlayer({
      ...player,
      energy: Math.max(10, player.energy - 12),
      matchSharpness: Math.min(100, player.matchSharpness + 8),
      morale: Math.min(100, player.morale + 5),
      attributes: updatedAttrs,
    });

    setFeedbackNotice(`🎯 Masterclass Completed with ${coach.name}! Gained: ${buffSummary}. ${coach.coachingQuote}`);
  };

  return (
    <div className="space-y-6">
      {/* Broadcast Style Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest font-mono">
              <GraduationCap className="w-4 h-4" />
              Private Performance Entourage & Specialists
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Personal Coaching & Specialists
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              World-class athletes don't rely only on club training. Employ private striker mentors, sprint biomechanists, and sports psychologists from your personal wages.
            </p>
          </div>

          {/* Entourage Payroll Card */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-right space-y-1 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
              Active Staff Payroll
            </span>
            <div className="text-2xl font-black font-mono text-amber-400">
              {formatCurrency(totalWeeklySalaries, currency)}/wk
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              Retained Staff: <strong className="text-white">{coaches.filter(c => c.hired).length} Active Specialists</strong>
            </span>
          </div>
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-4 bg-slate-900 border border-amber-500/40 rounded-2xl text-xs text-amber-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button 
            onClick={() => setFeedbackNotice(null)} 
            className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Coach Cards, Right Masterclass Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specialists List */}
        <div className="lg:col-span-1 space-y-3">
          {coaches.map(c => {
            const isSelected = c.id === selectedCoachId;
            return (
              <div
                key={c.id}
                onClick={() => { sounds.playClick(); setSelectedCoachId(c.id); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-slate-850 border-amber-500 shadow-xl'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.avatarIcon}</span>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {c.specialty.replace('_', ' ')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {c.hired ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        EMPLOYED
                      </span>
                    ) : (
                      <span className="text-xs font-mono font-bold text-slate-400">
                        {formatCurrency(c.weeklySalaryGBP, currency)}/wk
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-1 font-mono">
                  {c.tagline}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Coach Detailed Studio */}
        {selectedCoach && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-800 flex items-center justify-center text-3xl shadow-xl">
                  {selectedCoach.avatarIcon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {selectedCoach.specialty.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedCoach.tier} TIER
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {selectedCoach.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedCoach.tagline}
                  </p>
                </div>
              </div>

              {/* Hire Button */}
              <button
                onClick={() => handleToggleHire(selectedCoach)}
                className={`py-2.5 px-6 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
                  selectedCoach.hired
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
                }`}
              >
                {selectedCoach.hired ? (
                  <>
                    <span>Release Specialist</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Employ for {formatCurrency(selectedCoach.weeklySalaryGBP, currency)}/wk</span>
                  </>
                )}
              </button>
            </div>

            {/* Coach Philosophy Quote */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 italic text-xs text-slate-300 flex items-start gap-3">
              <span className="text-amber-400 text-lg not-italic font-black">“</span>
              <div>
                <span className="font-bold text-amber-400 not-italic block mb-0.5">
                  Coach's Performance Philosophy:
                </span>
                {selectedCoach.coachingQuote}
              </div>
            </div>

            {/* Unique Perk Banner */}
            <div className="p-4 bg-amber-950/40 border border-amber-600/40 rounded-2xl flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-amber-300 font-mono uppercase">
                  Special Entourage Perk
                </div>
                <p className="text-xs text-amber-200 mt-0.5">
                  {selectedCoach.specialPerk}
                </p>
              </div>
            </div>

            {/* Attribute Synergy Gains */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Direct Masterclass Attribute Buffs:
              </span>
              <div className="flex flex-wrap gap-2 font-mono text-xs">
                {Object.entries(selectedCoach.attributeBuffs).map(([k, val]) => (
                  <div key={k} className="p-2.5 bg-slate-950 rounded-xl border border-slate-850 flex items-center gap-2">
                    <span className="text-slate-400 capitalize">{k}:</span>
                    <strong className="text-emerald-400">+{val}</strong>
                    <span className="text-[10px] text-slate-500">(Your Stat: {player.attributes[k as keyof typeof player.attributes]})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action: Book 1-on-1 Masterclass */}
            <div className="pt-2">
              <button
                onClick={() => handleBookSession(selectedCoach)}
                disabled={!selectedCoach.hired}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer ${
                  selectedCoach.hired
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>
                  {selectedCoach.hired
                    ? `Conduct 1-on-1 Masterclass Drill (-12 Energy, +XP & Buffs)`
                    : `Employ ${selectedCoach.name} to Unlock Private Drills`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
