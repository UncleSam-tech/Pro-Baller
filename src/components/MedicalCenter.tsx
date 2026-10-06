import React, { useState } from 'react';
import { Player } from '../types/game';
import { InjuryDetail, INJURY_CATALOG } from '../types/injury';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { Activity, AlertTriangle, CheckCircle, Clock, Heart, ShieldAlert, Sparkles, Stethoscope, Zap } from 'lucide-react';

interface MedicalCenterProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export const MedicalCenter: React.FC<MedicalCenterProps> = ({ player, onUpdatePlayer }) => {
  const [notice, setNotice] = useState<string | null>(null);

  // Treat injury with specialist clinic
  const handleSpecialistClinic = () => {
    sounds.playClick();
    const costGBP = 14_000;
    if (player.bankBalance < costGBP) {
      setNotice('Insufficient bank balance to cover private clinic consultation fees.');
      return;
    }

    if (!player.activeInjury) return;

    const reducedWeeks = Math.max(1, Math.round(player.activeInjury.remainingWeeks * 0.65));
    const updatedInjury: InjuryDetail = {
      ...player.activeInjury,
      remainingWeeks: reducedWeeks,
      treatmentMethod: 'specialist_clinic',
    };

    onUpdatePlayer({
      ...player,
      bankBalance: player.bankBalance - costGBP,
      injuryWeeks: reducedWeeks,
      activeInjury: updatedInjury,
    });

    sounds.playFanfare();
    setNotice(`Private orthopedic treatment began in Munich. Estimated recovery slashed to ${reducedWeeks} weeks!`);
  };

  // Risky Cortisone Injection
  const handleCortisoneInjection = () => {
    sounds.playClick();
    if (!player.activeInjury) return;

    // 45% chance of severe setback
    const roll = Math.random();
    if (roll < 0.45) {
      const worsenedWeeks = player.activeInjury.remainingWeeks * 2;
      const updatedInjury: InjuryDetail = {
        ...player.activeInjury,
        remainingWeeks: worsenedWeeks,
        severity: 'Severe',
        description: 'Torn further during high intensity match while numbed by painkillers!',
      };

      onUpdatePlayer({
        ...player,
        injuryWeeks: worsenedWeeks,
        activeInjury: updatedInjury,
        morale: Math.max(10, player.morale - 20),
      });

      setNotice('DISASTER! The painkiller wore off and the injury aggravated severely! Recovery doubled!');
    } else {
      // Clear temporarily
      onUpdatePlayer({
        ...player,
        injuryWeeks: 0,
        activeInjury: null,
        morale: Math.min(100, player.morale + 5),
      });

      sounds.playWhistle();
      setNotice('Painkiller successful. You are medically cleared to play this weekend, though muscle tissue remains vulnerable.');
    }
  };

  // Simulate an injury test (for testing/immersion)
  const handleTriggerRandomInjury = () => {
    sounds.playClick();
    const template = INJURY_CATALOG[Math.floor(Math.random() * INJURY_CATALOG.length)];
    const newInjury: InjuryDetail = {
      ...template,
      id: `injury_${Date.now()}`,
      remainingWeeks: template.initialWeeksOut,
      occurredYear: player.currentYear,
      occurredWeek: player.currentWeek,
      treatmentMethod: 'club_physio',
    };

    const recurringCount = (player.recurringInjuryCount || 0) + 1;
    onUpdatePlayer({
      ...player,
      injuryWeeks: newInjury.remainingWeeks,
      injuryName: newInjury.name,
      activeInjury: newInjury,
      recurringInjuryCount: recurringCount,
      matchSharpness: Math.max(15, player.matchSharpness - 25),
      energy: Math.max(25, player.energy - 20),
    });

    setNotice(`Medical Alert: ${newInjury.name} diagnosed by club doctors. (Recurrence count: ${recurringCount}). Sidelined for ~${newInjury.initialWeeksOut} weeks.`);
  };

  const handleClearInjury = () => {
    sounds.playFanfare();
    onUpdatePlayer({
      ...player,
      injuryWeeks: 0,
      injuryName: undefined,
      activeInjury: null,
      energy: 95,
      matchSharpness: 70,
    });
    setNotice('Medical clearance granted! Fully rehabilitated and back to full team training.');
  };

  const currency = player.preferredCurrency || 'GBP';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
            <Stethoscope className="w-4 h-4 text-rose-500" />
            Club Medical Headquarters & Sports Science
          </div>
          <h2 className="text-2xl font-black text-white mt-1">
            Injury Diagnosis, Rehabilitation & Fitness
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-world football injuries, MRI scans, specialist clinics, and recovery pathways.
          </p>
        </div>

        {/* Current Medical Status Badge */}
        <div className={`p-4 rounded-xl border min-w-[220px] text-center ${
          player.activeInjury || player.injuryWeeks > 0
            ? 'bg-rose-950/70 border-rose-700/60 text-rose-200'
            : 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
        }`}>
          <div className="text-[10px] uppercase font-bold tracking-wider">Medical Status</div>
          <div className="text-xl font-black mt-0.5">
            {player.activeInjury || player.injuryWeeks > 0 ? 'SIDELINED / INJURED' : 'FIT & MATCH AVAILABLE'}
          </div>
          <div className="text-xs opacity-80 mt-0.5">
            {player.activeInjury ? `${player.activeInjury.remainingWeeks} Weeks Remaining` : 'No Physical Restrictions'}
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-amber-950/60 border border-amber-700/60 rounded-xl text-amber-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* ACTIVE INJURY DIAGNOSTIC CARD */}
      {player.activeInjury ? (
        <div className="bg-slate-900 border-2 border-rose-600/50 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950 px-2.5 py-1 rounded border border-rose-800">
                Severity: {player.activeInjury.severity}
              </span>
              <h3 className="text-2xl font-black text-white mt-2">
                {player.activeInjury.name}
              </h3>
              <div className="text-xs text-slate-400 mt-1">
                Affected Anatomy: <strong className="text-slate-200">{player.activeInjury.bodyPart}</strong> · Occurred Season {player.activeInjury.occurredYear}, Week {player.activeInjury.occurredWeek}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Estimated Duration</div>
              <div className="text-3xl font-black text-rose-400 font-mono">
                {player.activeInjury.remainingWeeks} <span className="text-sm font-sans font-normal text-slate-400">Weeks</span>
              </div>
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-850">
            {player.activeInjury.description}
          </p>

          {/* Three Rehabilitation Pathways */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Choose Medical Rehabilitation Strategy
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Club Physio */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-white text-xs">Standard Club Physiotherapy</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Routine ultrasound, resistance bands, and pool running with club medical staff.
                  </p>
                  <div className="text-xs text-emerald-400 font-bold mt-2">Free (Covered by Club)</div>
                </div>
                <div className="text-[11px] text-slate-500 italic pt-2">Standard recovery pace</div>
              </div>

              {/* Option 2: Elite Private Clinic */}
              <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-emerald-300 text-xs">Private Specialist Clinic (Munich)</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    World-renowned orthopedic care, platelet-rich plasma (PRP) injections, cuts time by ~35%.
                  </p>
                  <div className="text-xs text-amber-400 font-bold mt-2">
                    Cost: {formatCurrency(14_000, currency)}
                  </div>
                </div>
                <button
                  onClick={handleSpecialistClinic}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Fly to Specialist
                </button>
              </div>

              {/* Option 3: Risky Cortisone Injection */}
              <div className="p-4 bg-slate-950 rounded-xl border border-rose-500/40 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-rose-400 text-xs">Cortisone Injection (High Risk)</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Numb joint pain to play this week. 45% danger of catastrophic muscle tear!
                  </p>
                  <div className="text-xs text-rose-400 font-bold mt-2">Play immediately</div>
                </div>
                <button
                  onClick={handleCortisoneInjection}
                  className="w-full py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  Take Cortisone Risk
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HEALTHY OVERVIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Muscular Fatigue Risk</span>
                <span className="text-emerald-400 font-bold">LOW (12%)</span>
              </div>
              <div className="text-xl font-bold text-white">Full Match Fitness</div>
              <p className="text-xs text-slate-400">
                Lactic acid flushed, hamstrings and ligaments operating at optimal elasticity.
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Physical Energy</span>
                <span className="font-mono text-emerald-400 font-bold">{player.energy}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full" style={{ width: `${player.energy}%` }} />
              </div>
              <p className="text-xs text-slate-400">
                Ready for full 90 minutes of high-intensity pressing and sprinting.
              </p>
            </div>

            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Match Sharpness</span>
                <span className="font-mono text-amber-400 font-bold">{player.matchSharpness}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full" style={{ width: `${player.matchSharpness}%` }} />
              </div>
              <p className="text-xs text-slate-400">
                Reflexes and first-touch timing calibrated from recent match action.
              </p>
            </div>
          </div>

          {/* Quick Doctor Simulation Toggle */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Diagnostic Stress Simulation (Simulate unexpected match injury):
            </span>
            <button
              onClick={handleTriggerRandomInjury}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Simulate Match Collision / Injury
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
