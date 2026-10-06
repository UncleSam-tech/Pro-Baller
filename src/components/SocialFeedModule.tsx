import React, { useState } from 'react';
import { Player, Club, SocialPost, SocialInteractionOption } from '../types/game';
import { generateSocialFeed } from '../data/socialFeedGenerator';
import { formatCurrency } from '../utils/currency';
import { sounds } from '../utils/soundFx';
import { 
  Heart, Repeat2, MessageCircle, Share2, Sparkles, CheckCircle2, 
  TrendingUp, Flame, Award, ShieldAlert, Send, DollarSign, Users, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SocialFeedModuleProps {
  player: Player;
  club: Club;
  onUpdatePlayer: (updated: Player) => void;
}

export const SocialFeedModule: React.FC<SocialFeedModuleProps> = ({ player, club, onUpdatePlayer }) => {
  const currency = player.preferredCurrency || 'GBP';
  const playerPopularity = player.popularity ?? player.fanReputation ?? 30;

  // Initialize or load feed
  const [feed, setFeed] = useState<SocialPost[]>(() => {
    if (player.socialFeed && player.socialFeed.length > 0) {
      return player.socialFeed;
    }
    return generateSocialFeed(player, club);
  });

  const [customPostText, setCustomPostText] = useState('');
  const [postNotice, setPostNotice] = useState<string | null>(null);

  // Popularity Tier
  const getPopularityTier = (score: number) => {
    if (score >= 90) return { label: 'Global Cultural Icon', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-500/50' };
    if (score >= 75) return { label: 'Continental Superstar', color: 'text-purple-400', bg: 'bg-purple-950/80 border-purple-500/50' };
    if (score >= 50) return { label: 'National Fan Favorite', color: 'text-emerald-400', bg: 'bg-emerald-950/80 border-emerald-500/50' };
    if (score >= 25) return { label: 'Rising Starboy', color: 'text-blue-400', bg: 'bg-blue-950/80 border-blue-500/50' };
    return { label: 'Local Academy Cadet', color: 'text-slate-400', bg: 'bg-slate-900 border-slate-800' };
  };

  const popularityTier = getPopularityTier(playerPopularity);

  // Handle interacting with a post
  const handleInteraction = (postIndex: number, option: SocialInteractionOption) => {
    sounds.playClick();
    if (option.chosen) return;

    if (option.type === 'CLAPBACK' || option.popularityDelta >= 10) {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
    }

    const updatedFeed = [...feed];
    const post = updatedFeed[postIndex];

    if (post.interactions) {
      post.interactions = post.interactions.map(opt => ({
        ...opt,
        chosen: opt.responseLabel === option.responseLabel,
      }));
    }

    // Boost post likes
    post.likes += Math.round(150 + Math.random() * 400);
    post.reposts += Math.round(40 + Math.random() * 80);

    const updatedPopularity = Math.min(100, Math.max(5, playerPopularity + option.popularityDelta));
    const updatedChemistry = Math.min(100, Math.max(5, player.teamChemistry + option.chemistryDelta));
    const updatedTrust = Math.min(100, Math.max(5, player.managerTrust + option.managerTrustDelta));
    const updatedBank = player.bankBalance + (option.moneyEarned || 0);

    setFeed(updatedFeed);

    onUpdatePlayer({
      ...player,
      popularity: updatedPopularity,
      fanReputation: updatedPopularity,
      teamChemistry: updatedChemistry,
      managerTrust: updatedTrust,
      bankBalance: updatedBank,
      socialFeed: updatedFeed,
    });

    const noticeDesc = option.moneyEarned 
      ? `Viral response posted! Popularity +${option.popularityDelta} | Earned ${formatCurrency(option.moneyEarned, currency)}`
      : `Response published! Popularity: ${option.popularityDelta >= 0 ? `+${option.popularityDelta}` : option.popularityDelta} · Team Chemistry: ${option.chemistryDelta >= 0 ? `+${option.chemistryDelta}` : option.chemistryDelta}`;
    setPostNotice(noticeDesc);
  };

  // Author a custom tweet/post
  const handlePublishCustomPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPostText.trim()) return;

    sounds.playFanfare();
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.5 } });

    const newPost: SocialPost = {
      id: `user_post_${Date.now()}`,
      author: {
        name: `${player.firstName} ${player.lastName}`,
        handle: `@${player.firstName.toLowerCase()}${player.lastName.toLowerCase()}`,
        avatarBg: 'bg-emerald-600',
        role: 'TEAMMATE',
        verified: true,
      },
      content: customPostText.trim(),
      timestamp: 'Just now',
      likes: Math.round(1200 + playerPopularity * 45),
      reposts: Math.round(180 + playerPopularity * 8),
      tag: 'Player Update',
    };

    const updatedFeed = [newPost, ...feed];
    const newPopularity = Math.min(100, playerPopularity + 6);

    setFeed(updatedFeed);
    setCustomPostText('');

    onUpdatePlayer({
      ...player,
      popularity: newPopularity,
      fanReputation: newPopularity,
      morale: Math.min(100, player.morale + 5),
      socialFeed: updatedFeed,
    });

    setPostNotice(`Your post is trending on FootballPulse! Popularity increased to ${newPopularity}%.`);
  };

  return (
    <div className="space-y-6">
      {/* Popularity & Social Status Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest font-mono">
              <Flame className="w-4 h-4" />
              FootballPulse Social Atmosphere & Fan Base
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              Social Media Feed & Viral Influence
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Your public persona reverberates through dressing rooms, fan terraces, and corporate sponsor boardrooms. 
              Interactions with fans, teammates, and media directly shape your <strong>Popularity</strong> attribute.
            </p>
          </div>

          {/* Popularity Metric Display */}
          <div className={`p-4 rounded-2xl border ${popularityTier.bg} shrink-0 text-right space-y-1`}>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Global Popularity</span>
            <div className="text-3xl font-black font-mono text-white flex items-center justify-end gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{playerPopularity}%</span>
            </div>
            <span className={`text-xs font-bold ${popularityTier.color} block`}>
              {popularityTier.label}
            </span>
          </div>
        </div>

        {/* Popularity Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Fan Following Index</span>
            <span className="text-emerald-400 font-bold">{playerPopularity} / 100</span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-400 transition-all duration-500"
              style={{ width: `${playerPopularity}%` }}
            />
          </div>
        </div>
      </div>

      {postNotice && (
        <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-2xl text-xs text-blue-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{postNotice}</span>
          </div>
          <button onClick={() => setPostNotice(null)} className="text-slate-400 hover:text-white font-bold ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* Compose Status Post */}
      <form onSubmit={handlePublishCustomPost} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            Post to Your Global Followers
          </span>
          <span className="text-[11px] text-slate-500 font-mono">Verified @{player.firstName.toLowerCase()}{player.lastName.toLowerCase()}</span>
        </div>

        <textarea
          rows={2}
          value={customPostText}
          onChange={e => setCustomPostText(e.target.value)}
          placeholder={`What's on your mind after the match? (e.g. "Dedicated this goal to our home supporters!", "Recovery grind begins now 🧊")...`}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
        />

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCustomPostText(`Big win for ${club.name}! Grateful for the incredible away support tonight. We keep pushing forward together! ⚽🔥`)}
              className="text-[10px] bg-slate-950 hover:bg-slate-850 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-850 cursor-pointer"
            >
              + Win Dedication
            </button>
            <button
              type="button"
              onClick={() => setCustomPostText(`Back on the training pitch sharpening the finishing. No excuses, only relentless work. 🔒⚡`)}
              className="text-[10px] bg-slate-950 hover:bg-slate-850 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-850 cursor-pointer"
            >
              + Training Grind
            </button>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Publish Status</span>
          </button>
        </div>
      </form>

      {/* Feed Stream */}
      <div className="space-y-4">
        {feed.map((post, postIdx) => (
          <div
            key={post.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
          >
            {/* Post Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${post.author.avatarBg} flex items-center justify-center text-white font-black text-sm shrink-0 shadow`}>
                  {post.author.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">{post.author.name}</span>
                    {post.author.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                    )}
                    <span className="text-[11px] text-slate-500 font-mono">{post.author.handle}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{post.timestamp}</span>
                </div>
              </div>

              {post.tag && (
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase tracking-wider">
                  {post.tag}
                </span>
              )}
            </div>

            {/* Post Content */}
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {post.content}
            </p>

            {/* Interactive Player Reactions */}
            {post.interactions && post.interactions.length > 0 && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
                  Simulate Player Action / Response:
                </span>
                <div className="flex flex-wrap gap-2">
                  {post.interactions.map((opt, optIdx) => (
                    <button
                      key={optIdx}
                      onClick={() => handleInteraction(postIdx, opt)}
                      disabled={opt.chosen}
                      className={`text-xs font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        opt.chosen
                          ? 'bg-emerald-950 border border-emerald-500/60 text-emerald-400 cursor-default'
                          : opt.type === 'CLAPBACK'
                          ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300'
                          : opt.type === 'ENDORSE'
                          ? 'bg-amber-950/60 hover:bg-amber-900 border border-amber-800 text-amber-300'
                          : 'bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200'
                      }`}
                    >
                      {opt.chosen ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-blue-400" />}
                      <span>{opt.responseLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            <div className="flex items-center gap-6 pt-2 border-t border-slate-800/60 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5 hover:text-rose-400 transition-colors">
                <Heart className="w-3.5 h-3.5" />
                <span>{post.likes.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                <Repeat2 className="w-3.5 h-3.5" />
                <span>{post.reposts.toLocaleString()}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>{(post.likes * 8).toLocaleString()} views</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
