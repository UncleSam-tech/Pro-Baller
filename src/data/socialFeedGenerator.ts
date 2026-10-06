import { Player, Club, SocialPost } from '../types/game';

export function generateSocialFeed(player: Player, club: Club): SocialPost[] {
  const posts: SocialPost[] = [];
  const playerName = `${player.firstName} ${player.lastName}`;
  const goals = player.seasonStats.goals;
  const rating = player.seasonStats.avgRating || 7.2;

  // 1. Fanbase Core Post
  if (goals >= 3) {
    posts.push({
      id: `fan_post_goals_${Date.now()}_1`,
      author: {
        name: `${club.shortName} Ultras Tribune`,
        handle: `@${club.shortName.toLowerCase()}_tribune`,
        avatarBg: 'bg-emerald-600',
        role: 'FAN',
        verified: true,
      },
      content: `I’ve seen enough. At ${player.age} years of age, ${playerName} is genuinely generational. That first touch and vision in the box is uncoachable! Give him a 5-year contract extension right now! 🪄🔥 #Baller #${club.shortName}`,
      timestamp: '2h ago',
      likes: 3420 + goals * 450,
      reposts: 890 + goals * 120,
      tag: 'Match Reaction',
      interactions: [
        {
          type: 'APPRECIATE',
          responseLabel: 'Thank the ultras with humility',
          popularityDelta: 6,
          chemistryDelta: 3,
          managerTrustDelta: 1,
        },
        {
          type: 'FOCUS',
          responseLabel: 'Post training photo: "Job not done yet"',
          popularityDelta: 4,
          chemistryDelta: 5,
          managerTrustDelta: 3,
        },
      ],
    });
  } else {
    posts.push({
      id: `fan_post_young_${Date.now()}_2`,
      author: {
        name: 'The Matchday Podcast',
        handle: '@MatchdayPodDaily',
        avatarBg: 'bg-blue-600',
        role: 'FAN',
        verified: true,
      },
      content: `Keep an eye on ${player.firstName} (${player.age}yo) at ${club.name}. Started early in the youth ranks, showing fearless composure whenever he steps on the pitch. Huge ceiling if developed properly. 📈`,
      timestamp: '4h ago',
      likes: 1840,
      reposts: 260,
      tag: 'Scout Watch',
      interactions: [
        {
          type: 'APPRECIATE',
          responseLabel: 'Heart the post & repost',
          popularityDelta: 5,
          chemistryDelta: 2,
          managerTrustDelta: 0,
        },
      ],
    });
  }

  // 2. Teammate Interaction
  posts.push({
    id: `teammate_post_${Date.now()}_3`,
    author: {
      name: 'Marcus Sterling',
      handle: '@M_Sterling_Official',
      avatarBg: 'bg-purple-600',
      role: 'TEAMMATE',
      verified: true,
    },
    content: `Great shift on the training pitch today with the young starboy @${player.firstName.toLowerCase()}${player.lastName.toLowerCase()} 🤝 Good recovery session in the cold pool. We go again this weekend for the 3 points! ⚽🔒`,
    timestamp: '7h ago',
    likes: 8910,
    reposts: 740,
    tag: 'Dressing Room',
    interactions: [
      {
        type: 'APPRECIATE',
        responseLabel: 'Reply: "Learned from the best, big bro! 🫡"',
        popularityDelta: 7,
        chemistryDelta: 8,
        managerTrustDelta: 2,
      },
      {
        type: 'CLAPBACK',
        responseLabel: 'Banter reply: "Who nutmegged you in the rondo though? 😂"',
        popularityDelta: 12,
        chemistryDelta: 4,
        managerTrustDelta: -1,
      },
    ],
  });

  // 3. Media & Pundit Tweet
  posts.push({
    id: `pundit_post_${Date.now()}_4`,
    author: {
      name: 'Sky Sports Tactical Breakdown',
      handle: '@TacticalRadarTV',
      avatarBg: 'bg-rose-700',
      role: 'PUNDIT',
      verified: true,
    },
    content: `TACTICAL DEEP DIVE: ${playerName}'s off-the-ball movements create massive half-space overloads for ${club.name}. Averaging an impressive match impact rating of ${rating.toFixed(1)}. Will big European clubs come knocking before his buyout clause escalates? 👀`,
    timestamp: '11h ago',
    likes: 12500,
    reposts: 2100,
    tag: 'Tactical Analysis',
    interactions: [
      {
        type: 'FOCUS',
        responseLabel: 'Quote tweet: "100% focused on helping my club win"',
        popularityDelta: 8,
        chemistryDelta: 4,
        managerTrustDelta: 4,
      },
      {
        type: 'CLAPBACK',
        responseLabel: 'Quote tweet: "Don\'t believe everything the media prints 😉"',
        popularityDelta: 14,
        chemistryDelta: 0,
        managerTrustDelta: -3,
      },
    ],
  });

  // 4. Commercial Brand Sponsor Post
  posts.push({
    id: `brand_post_${Date.now()}_5`,
    author: {
      name: 'Apex Athletic Performance',
      handle: '@ApexPerformanceHQ',
      avatarBg: 'bg-amber-600',
      role: 'BRAND',
      verified: true,
    },
    content: `Speed that changes the tempo. Composure that decides championships. ⚡ Proud to partner with rising star @${player.firstName.toLowerCase()}${player.lastName.toLowerCase()} as our new global brand icon. The future is unwritten. #ApexAthlete #NextGen`,
    timestamp: '1d ago',
    likes: 19400,
    reposts: 3800,
    tag: 'Brand Ambassador',
    interactions: [
      {
        type: 'ENDORSE',
        responseLabel: 'Publish official campaign photo (+£2,500 Endorsement)',
        popularityDelta: 15,
        chemistryDelta: 1,
        managerTrustDelta: 0,
        moneyEarned: 2500,
      },
    ],
  });

  // 5. Transfer Insider Buzz
  posts.push({
    id: `transfer_insider_${Date.now()}_6`,
    author: {
      name: 'Fabrizio Di Marzio Watch',
      handle: '@FabrizioScoutAlert',
      avatarBg: 'bg-cyan-600',
      role: 'JOURNALIST',
      verified: true,
    },
    content: `🚨 SCOUT UPDATE: Scouts from Premier League, Bundesliga, and Serie A top clubs attended ${club.name}'s recent sessions specifically to monitor ${playerName}. Current market value evaluated around £${(player.marketValue / 1000000).toFixed(1)}M. More details expected in the next window! 🔍⏳`,
    timestamp: '1d ago',
    likes: 24700,
    reposts: 5600,
    tag: 'Transfer Radar',
    interactions: [
      {
        type: 'FOCUS',
        responseLabel: 'Like post silently and focus on matchday',
        popularityDelta: 5,
        chemistryDelta: 2,
        managerTrustDelta: 2,
      },
    ],
  });

  return posts;
}
