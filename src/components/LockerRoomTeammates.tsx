import React, { useState, useMemo } from 'react';
import { Club, Player, Position, TeammateRelation } from '../types/game';
import { getClubRoster, SquadPlayer } from '../data/clubRosters';
import { sounds } from '../utils/soundFx';
import { 
  Users, MessageCircle, Zap, Shield, Sparkles, Award, HeartHandshake, 
  ArrowUpRight, Dumbbell, Compass, Flame, Smile, CheckCircle2 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LockerRoomTeammatesProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
  onGoToMatch?: () => void;
}

export const LockerRoomTeammates: React.FC<LockerRoomTeammatesProps> = ({
  player,
  club,
  onUpdatePlayer,
  onGoToMatch,
}) => {
  const roster = useMemo(() => getClubRoster(club.id, club.name, club.reputation), [club]);

  // Generate realistic teammate relations list based on starting XI & bench
  const [teammates, setTeammates] = useState<TeammateRelation[]>(() => {
    const allSquad: SquadPlayer[] = [...roster.startingXI, ...roster.bench];
    // Filter out player's own position / number if colliding
    const validTeammates = allSquad
      .filter(s => s.name.toLowerCase() !== `${player.firstName} ${player.lastName}`.toLowerCase())
      .slice(0, 14);

    return validTeammates.map((s, idx) => {
      // Natural chemistry variance based on position synergy
      const isAttackingPartner = ['ST', 'LW', 'RW', 'CAM'].includes(s.position) && ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
      const isSameNation = s.nationality.toLowerCase() === player.nationality.toLowerCase();
      const baseChem = 50 + (isAttackingPartner ? 15 : 0) + (isSameNation ? 15 : 0) + ((idx % 3) * 6);
      const chemistry = Math.min(95, Math.max(30, baseChem));

      const tier: TeammateRelation['relationshipTier'] = 
        chemistry >= 80 ? 'BEST_MATE' : chemistry >= 60 ? 'TRUSTED_ALLY' : chemistry <= 35 ? 'LOCKER_RIVAL' : 'NEUTRAL';

      return {
        id: s.id,
        name: s.name,
        position: s.position,
        number: s.number,
        overall: s.overall,
        nationality: s.nationality,
        chemistry,
        relationshipTier: tier,
        synergyBuff: isAttackingPartner ? 'Lethal 1-2 Combination Pass (+5% Goal Assist Sync)' : undefined,
      };
    });
  });

  const [selectedTeammateId, setSelectedTeammateId] = useState<string>(teammates[0]?.id || '');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ATTACK' | 'MIDFIELD' | 'DEFENSE'>('ALL');
  const [dialogueNotice, setDialogueNotice] = useState<string | null>(null);

  const selectedTeammate = teammates.find(t => t.id === selectedTeammateId) || teammates[0];

  // Calculate Squad Chemistry Average
  const squadAvgChemistry = useMemo(() => {
    if (teammates.length === 0) return 65;
    const total = teammates.reduce((sum, t) => sum + t.chemistry, 0);
    return Math.round(total / teammates.length);
  }, [teammates]);

  const filteredTeammates = teammates.filter(t => {
    if (activeFilter === 'ATTACK') return ['ST', 'LW', 'RW'].includes(t.position);
    if (activeFilter === 'MIDFIELD') return ['CAM', 'CM', 'CDM'].includes(t.position);
    if (activeFilter === 'DEFENSE') return ['CB', 'LB', 'RB', 'GK'].includes(t.position);
    return true;
  });

  // Action 1: Locker Room Banter
  const handleLockerRoomBanter = (t: TeammateRelation) => {
    sounds.playClick();
    const chemGain = Math.floor(Math.random() * 4) + 3;
    const newChem = Math.min(100, t.chemistry + chemGain);
    const newTier = newChem >= 80 ? 'BEST_MATE' : newChem >= 60 ? 'TRUSTED_ALLY' : t.relationshipTier;

    setTeammates(prev => prev.map(item => item.id === t.id ? {
      ...item,
      chemistry: newChem,
      relationshipTier: newTier,
      lastInteraction: 'Shared tactical banter & coffee before team walk',
    } : item));

    const updatedMorale = Math.min(100, player.morale + 3);
    const updatedChemistry = Math.min(100, player.teamChemistry + 2);
    onUpdatePlayer({
      ...player,
      morale: updatedMorale,
      teamChemistry: updatedChemistry,
    });

    setDialogueNotice(`💬 Banter with ${t.name}: Shared a big laugh about pre-match music in the locker room! Chemistry +${chemGain}%!`);
  };

  // Action 2: 1-on-1 Extra Training Drill
  const handleExtraDrill = (t: TeammateRelation) => {
    if (player.energy < 10) {
      sounds.playClick();
      setDialogueNotice(`⚠️ You're too fatigued for extra training! Rest up before matchday.`);
      return;
    }
    sounds.playFanfare();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });

    const chemGain = 6;
    const newChem = Math.min(100, t.chemistry + chemGain);

    // Attribute growth synergy
    const updatedAttrs = { ...player.attributes };
    if (['ST', 'LW', 'RW'].includes(t.position)) {
      updatedAttrs.finishing = Math.min(99, updatedAttrs.finishing + 1);
    } else if (['CAM', 'CM'].includes(t.position)) {
      updatedAttrs.shortPassing = Math.min(99, updatedAttrs.shortPassing + 1);
      updatedAttrs.vision = Math.min(99, updatedAttrs.vision + 1);
    } else {
      updatedAttrs.composure = Math.min(99, updatedAttrs.composure + 1);
    }

    setTeammates(prev => prev.map(item => item.id === t.id ? {
      ...item,
      chemistry: newChem,
      relationshipTier: newChem >= 80 ? 'BEST_MATE' : 'TRUSTED_ALLY',
      synergyBuff: `Active Linkup Mastery with ${item.name}`,
      lastInteraction: 'Completed intense 45-minute 1-on-1 finishing & passing session',
    } : item));

    onUpdatePlayer({
      ...player,
      energy: Math.max(10, player.energy - 8),
      attributes: updatedAttrs,
      teamChemistry: Math.min(100, player.teamChemistry + 4),
      managerTrust: Math.min(100, player.managerTrust + 2),
    });

    setDialogueNotice(`⚡ Overtime Drill: You and ${t.name} worked on synchronized attacking runs! (+${chemGain}% Chemistry, +1 Attribute Synergy)`);
  };

  // Action 3: Pitch Synergy Pact
  const handleSynergyPact = (t: TeammateRelation) => {
    sounds.playClick();
    setTeammates(prev => prev.map(item => item.id === t.id ? {
      ...item,
      synergyBuff: `Matchday Synergy Active: Guaranteed first-look through ball!`,
      lastInteraction: 'Agreed on set-piece target runs for upcoming fixture',
    } : item));

    onUpdatePlayer({
      ...player,
      teamChemistry: Math.min(100, player.teamChemistry + 3),
    });

    setDialogueNotice(`🎯 Tactical Sync: You and ${t.name} agreed on dynamic channel runs for the next match! Linkup bonus activated.`);
  };

  return (
    <div className="space-y-6">
      {/* Broadcast Style Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              <Users className="w-4 h-4" />
              {club.name} · Squad Dynamics & Locker Room
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Teammate Relations & Chemistry
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Build camaraderie with your teammates, organize 1-on-1 overtime drills, and develop telepathic pitch chemistry before matchday.
            </p>
          </div>

          {/* Squad Chemistry Meter */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-right space-y-1 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
              Squad Locker Room Chemistry
            </span>
            <div className="flex items-center justify-end gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <span className="text-3xl font-black font-mono text-emerald-400">
                {squadAvgChemistry}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              Status: <strong className="text-white">{squadAvgChemistry >= 80 ? 'Telepathic Understanding' : squadAvgChemistry >= 60 ? 'Harmonious & United' : 'Building Connections'}</strong>
            </span>
          </div>
        </div>

        {/* Position Filter Bar */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold pr-2">Filter Squad:</span>
          {(['ALL', 'ATTACK', 'MIDFIELD', 'DEFENSE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { sounds.playClick(); setActiveFilter(tab); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                activeFilter === tab 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-white bg-slate-950/60'
              }`}
            >
              {tab === 'ALL' ? 'Full Squad' : tab}
            </button>
          ))}
        </div>
      </div>

      {dialogueNotice && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{dialogueNotice}</span>
          </div>
          <button 
            onClick={() => setDialogueNotice(null)} 
            className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Left Teammate Cards, Right Interactive Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teammates List */}
        <div className="lg:col-span-1 space-y-3 max-h-[640px] overflow-y-auto pr-2 scrollbar-thin">
          {filteredTeammates.map(t => {
            const isSelected = t.id === selectedTeammateId;
            return (
              <div
                key={t.id}
                onClick={() => { sounds.playClick(); setSelectedTeammateId(t.id); }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-slate-850 border-emerald-500 shadow-xl'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-black font-mono text-emerald-400 text-sm">
                      #{t.number}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white leading-tight">
                        {t.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {t.position} · {t.nationality} · {t.overall} OVR
                      </div>
                    </div>
                  </div>

                  {/* Chemistry Badge */}
                  <div className="text-right font-mono">
                    <span className="text-xs font-black text-emerald-400 block">
                      {t.chemistry}%
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase">Chem</span>
                  </div>
                </div>

                {/* Relationship Bar */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      t.chemistry >= 80 ? 'bg-emerald-500' : t.chemistry >= 60 ? 'bg-blue-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${t.chemistry}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Teammate Interactive Dossier */}
        {selectedTeammate && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative">
            {/* Top Identity Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-black text-2xl text-white shadow-xl">
                  {selectedTeammate.position}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      Squad #{selectedTeammate.number}
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs font-mono text-slate-400">
                      {selectedTeammate.nationality}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-0.5">
                    {selectedTeammate.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Rating: <strong className="text-white">{selectedTeammate.overall} OVR</strong> · Connection Tier: <strong className="text-emerald-400">{selectedTeammate.relationshipTier.replace('_', ' ')}</strong>
                  </p>
                </div>
              </div>

              {/* Chemistry Card */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center min-w-[120px]">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  Pitch Synergy
                </span>
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {selectedTeammate.chemistry}%
                </span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  {selectedTeammate.chemistry >= 80 ? 'Telepathic' : selectedTeammate.chemistry >= 60 ? 'Strong' : 'Developing'}
                </span>
              </div>
            </div>

            {/* Synergy Buff Detail */}
            {selectedTeammate.synergyBuff && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-emerald-300 font-mono uppercase">
                    Active Chemistry Link
                  </div>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {selectedTeammate.synergyBuff}
                  </p>
                </div>
              </div>
            )}

            {/* Recent Interaction Memo */}
            {selectedTeammate.lastInteraction && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 text-xs text-slate-400 font-mono">
                Recent: <span className="text-slate-300">{selectedTeammate.lastInteraction}</span>
              </div>
            )}

            {/* Interactive Player Actions */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Locker Room Interactions with {selectedTeammate.name}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Action 1: Banter */}
                <button
                  onClick={() => handleLockerRoomBanter(selectedTeammate)}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                      💬 Locker Room Banter
                    </span>
                    <Smile className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Joke around and build camaraderie before matchday (+Chem, +Morale).
                  </p>
                  <span className="text-[10px] font-mono text-emerald-400 block pt-1">
                    Free Action · No Energy Cost
                  </span>
                </button>

                {/* Action 2: Extra 1v1 Drill */}
                <button
                  onClick={() => handleExtraDrill(selectedTeammate)}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                      ⚡ Overtime 1-on-1 Drill
                    </span>
                    <Dumbbell className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Stay after practice for targeted finishing/passing linkup.
                  </p>
                  <span className="text-[10px] font-mono text-amber-400 block pt-1">
                    Costs -8 Energy · +1 Stat Synergy
                  </span>
                </button>

                {/* Action 3: Pitch Synergy Pact */}
                <button
                  onClick={() => handleSynergyPact(selectedTeammate)}
                  className="p-4 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all group cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs group-hover:text-emerald-400 transition-colors">
                      🎯 Matchday Synergy Pact
                    </span>
                    <Compass className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Coordinate attacking patterns for the upcoming fixture.
                  </p>
                  <span className="text-[10px] font-mono text-blue-400 block pt-1">
                    Boosts In-Match Assist Chances
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Matchday Ready Banner */}
            {onGoToMatch && (
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  Ready to test squad chemistry under the floodlights?
                </span>
                <button
                  onClick={onGoToMatch}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>Step Out to Matchday</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
