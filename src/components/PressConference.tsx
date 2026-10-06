import React, { useState } from 'react';
import { Club, Player } from '../types/game';
import { sounds } from '../utils/soundFx';
import { Camera, CheckCircle, MessageSquare, Mic, Sparkles, TrendingUp, Users } from 'lucide-react';

interface PressConferenceProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onExitPressRoom: () => void;
}

interface MediaQuestion {
  id: string;
  outlet: string;
  journalist: string;
  question: string;
  options: {
    text: string;
    description: string;
    managerDelta: number;
    chemistryDelta: number;
    fanDelta: number;
  }[];
}

export const PressConference: React.FC<PressConferenceProps> = ({
  player,
  club,
  onUpdatePlayer,
  onExitPressRoom,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answeredFeedback, setAnsweredFeedback] = useState<string | null>(null);

  const questions: MediaQuestion[] = [
    {
      id: 'q1',
      outlet: 'The Athletic',
      journalist: 'David Ornstein',
      question: `"${player.lastName}, your rapid rise has sparked rampant transfer speculation linking you with elite European giants. Are you committed to ${club.name}, or are your representatives actively weighing opportunities?"`,
      options: [
        {
          text: `"My complete focus and heart remain with ${club.name}. We have trophies to win here."`,
          description: 'Pledges fierce loyalty to current club and manager.',
          managerDelta: 8,
          chemistryDelta: 6,
          fanDelta: 10,
        },
        {
          text: `"In modern football, you never know what the future holds. I want to play at the highest possible ceiling."`,
          description: 'Ambitious and leaves the door open to mega transfer offers.',
          managerDelta: -6,
          chemistryDelta: -4,
          fanDelta: 2,
        },
        {
          text: `"I leave contract and transfer matters strictly to my agent. My job is purely on the grass."`,
          description: 'Neutral, professional deflection.',
          managerDelta: 1,
          chemistryDelta: 2,
          fanDelta: 0,
        },
      ],
    },
    {
      id: 'q2',
      outlet: 'Sky Sports',
      journalist: 'Gary Neville',
      question: `"The manager demanded heavy pressing and defensive tracking back today. Do you feel those tactical duties restrict your attacking creative freedom?"`,
      options: [
        {
          text: `"No individual is bigger than the collective team structure. If the gaffer wants me tracking back to my own box, I will sprint every single yard."`,
          description: 'Complete tactical discipline that delights the coaching staff.',
          managerDelta: 10,
          chemistryDelta: 8,
          fanDelta: 4,
        },
        {
          text: `"My natural instinct is to hurt opponents in the final third. When I have freedom, that's when magical moments happen."`,
          description: 'Expresses desire for attacking talisman status.',
          managerDelta: -5,
          chemistryDelta: 0,
          fanDelta: 8,
        },
      ],
    },
    {
      id: 'q3',
      outlet: 'L\'Équipe',
      journalist: 'France Football Reporter',
      question: `"Pundits across Europe are already whispering your name among future Ballon d'Or contenders. Does that kind of worldwide expectation weigh on your shoulders?"`,
      options: [
        {
          text: `"It is an honor to be mentioned, but personal accolades only arrive when your club lifts silverware."`,
          description: 'Grounded, mature mentality.',
          managerDelta: 5,
          chemistryDelta: 6,
          fanDelta: 6,
        },
        {
          text: `"I train every single morning to become the best player on this planet. I welcome the pressure."`,
          description: 'Fearless winner mentality.',
          managerDelta: 2,
          chemistryDelta: 2,
          fanDelta: 12,
        },
      ],
    },
  ];

  const currentQ = questions[currentQIndex];

  const handleSelectAnswer = (opt: typeof currentQ.options[0]) => {
    sounds.playCameraClick();

    const newTrust = Math.min(100, Math.max(10, player.managerTrust + opt.managerDelta));
    const newChem = Math.min(100, Math.max(10, player.teamChemistry + opt.chemistryDelta));
    const newFan = Math.min(100, Math.max(10, player.fanReputation + opt.fanDelta));

    onUpdatePlayer({
      ...player,
      managerTrust: newTrust,
      teamChemistry: newChem,
      fanReputation: newFan,
    });

    setAnsweredFeedback(`Answer broadcast to millions. Impact: Manager Trust (${opt.managerDelta >= 0 ? '+' : ''}${opt.managerDelta}%), Fan Approval (${opt.fanDelta >= 0 ? '+' : ''}${opt.fanDelta}%), Locker Room (${opt.chemistryDelta >= 0 ? '+' : ''}${opt.chemistryDelta}%)`);
  };

  const handleNext = () => {
    sounds.playClick();
    setAnsweredFeedback(null);
    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex(i => i + 1);
    } else {
      onExitPressRoom();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Press Backdrop Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Mic className="w-4 h-4 text-rose-500 animate-pulse" />
            Live Press Conference Briefing
          </div>
          <div className="text-xs text-slate-400">
            Question {currentQIndex + 1} of {questions.length}
          </div>
        </div>

        <h2 className="text-2xl font-black text-white">
          Media Spotlight & Post-Match Debrief
        </h2>
        <p className="text-xs text-slate-400">
          Your public statements are analyzed by teammates, fans, and the sporting director. Speak deliberately.
        </p>
      </div>

      {/* Main Question Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white shrink-0 border border-slate-700">
            <Camera className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-bold text-white">{currentQ.journalist}</span>
              <span>·</span>
              <span className="text-amber-400">{currentQ.outlet}</span>
            </div>
            <p className="text-sm md:text-base font-medium text-slate-200 mt-2 leading-relaxed italic">
              {currentQ.question}
            </p>
          </div>
        </div>

        {/* Answer Options */}
        {answeredFeedback ? (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="p-4 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-emerald-200 text-xs flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{answeredFeedback}</span>
            </div>

            <button
              onClick={handleNext}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
            >
              {currentQIndex + 1 < questions.length ? 'Next Journalist Question' : 'Conclude Press Briefing'}
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(opt)}
                className="w-full p-4 bg-slate-950 hover:bg-slate-850 rounded-xl border border-slate-800 hover:border-emerald-500 text-left transition-all group cursor-pointer"
              >
                <div className="font-bold text-white text-xs md:text-sm group-hover:text-emerald-400 transition-colors">
                  {opt.text}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {opt.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
