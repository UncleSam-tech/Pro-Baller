import React, { useState } from 'react';
import { Player } from '../types/game';
import { Shop } from './Shop';
import { LifestyleShop } from './LifestyleShop';
import { TrophyRoom } from './TrophyRoom';
import { sounds } from '../utils/soundFx';
import { Award, Briefcase, ShoppingBag, Trophy, Users } from 'lucide-react';

interface LifeShopWindowProps {
  player: Player;
  onUpdatePlayer: (updated: Player) => void;
}

export const LifeShopWindow: React.FC<LifeShopWindowProps> = ({ player, onUpdatePlayer }) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'entourage' | 'trophies'>('shop');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Window Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide">
            Life, Pro Shop & Entourage Emporium
          </h2>
          <div className="text-xs text-slate-400">
            Commercial Holdings, 20+ Equipment Catalog & Trophy Cabinet
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('shop'); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'shop'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            The Pro Shop (20+ Items)
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('entourage'); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'entourage'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Staff & Sponsorships
          </button>

          <button
            onClick={() => { sounds.playClick(); setActiveTab('trophies'); }}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'trophies'
                ? 'bg-yellow-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Trophy Room & Ballon d'Or
          </button>
        </div>
      </div>

      {activeTab === 'shop' && (
        <Shop player={player} onUpdatePlayer={onUpdatePlayer} />
      )}

      {activeTab === 'entourage' && (
        <LifestyleShop player={player} onUpdatePlayer={onUpdatePlayer} />
      )}

      {activeTab === 'trophies' && (
        <TrophyRoom player={player} />
      )}
    </div>
  );
};
