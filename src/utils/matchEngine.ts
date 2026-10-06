import { Club, MatchDecisionMoment, MatchLiveEvent, MatchSimulationResult, Player } from '../types/game';

/**
 * Creates rich interactive decision moments during a match
 */
export function generateKeyMatchMoments(player: Player, opponent: Club): MatchDecisionMoment[] {
  const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
  const isMidfielder = ['CM', 'CDM'].includes(player.position);
  
  const moments: MatchDecisionMoment[] = [];

  if (isAttacker) {
    moments.push({
      id: 'breakaway_1v1',
      minute: Math.floor(Math.random() * 25) + 20,
      situation: 'Breakaway 1-on-1 with Keeper',
      description: `You exploit ${opponent.shortName}'s high defensive line and latch onto a defense-splitting through ball! The keeper is charging out to close the angle.`,
      options: [
        {
          label: 'Finesse Low Far-Post',
          description: 'Open body shape and stroke it softly with the inside of your boot past the keeper\'s outstretched glove.',
          requiredAttributes: ['finishing', 'composure', 'curve'],
          riskTier: 'Moderate',
          actionType: 'shoot_finesse',
        },
        {
          label: 'Delicate Chip / Lob',
          description: 'Deceive the keeper by dinking the ball gracefully over their diving frame into the unguarded net.',
          requiredAttributes: ['ballControl', 'composure', 'flair'],
          riskTier: 'High Risk High Reward',
          actionType: 'chip',
        },
        {
          label: 'Near-Post Power Blast',
          description: 'Put your laces through the ball and blast it high into the roof of the near post before they can react.',
          requiredAttributes: ['shotPower', 'finishing'],
          riskTier: 'Safe',
          actionType: 'shoot_power',
        },
        {
          label: 'Square Pass to Teammate',
          description: 'Spot your trailing winger sprinting into the six-yard box for an unselfish tap-in.',
          requiredAttributes: ['vision', 'shortPassing'],
          riskTier: 'Safe',
          actionType: 'pass_through',
        },
      ],
    });

    moments.push({
      id: 'edge_of_box_clutch',
      minute: Math.floor(Math.random() * 20) + 70,
      situation: 'Clutch Opportunity 20 Yards Out',
      description: `Minute 78: The score is deadlocked. The ball rebounds out to you just outside the penalty arc with two defenders closing fast.`,
      options: [
        {
          label: 'First-Time Half-Volley',
          description: 'Strike it cleanly on the bounce aiming for the top corner postage stamp.',
          requiredAttributes: ['finishing', 'shotPower', 'composure'],
          riskTier: 'High Risk High Reward',
          actionType: 'shoot_power',
        },
        {
          label: 'Body Feint & Cut Inside',
          description: 'Sell the defender with a sharp drop of the shoulder, shift to your stronger foot, and shoot.',
          requiredAttributes: ['dribbling', 'agility', 'flair'],
          riskTier: 'Moderate',
          actionType: 'dribble_cut',
        },
        {
          label: 'Thread Reverse Ball into the Box',
          description: 'Slip a disguised reverse pass between the center back\'s legs for your striker.',
          requiredAttributes: ['vision', 'shortPassing'],
          riskTier: 'Safe',
          actionType: 'pass_through',
        },
      ],
    });
  } else if (isMidfielder) {
    moments.push({
      id: 'midfield_turnover_counter',
      minute: Math.floor(Math.random() * 25) + 30,
      situation: 'Turnover & Fast Counter Break',
      description: `You intercept ${opponent.name}'s attack in the center circle. Both of your wingers are sprinting into space.`,
      options: [
        {
          label: 'Curling 40-Yard Diagonal Switch',
          description: 'Ping a laser-guided diagonal ball over the fullback straight onto your winger\'s stride.',
          requiredAttributes: ['longPassing', 'vision', 'curve'],
          riskTier: 'Moderate',
          actionType: 'pass_through',
        },
        {
          label: 'Drive Forward & Shoot',
          description: 'Carry the ball straight through the vacated midfield channel and pull the trigger from 25 yards.',
          requiredAttributes: ['pace', 'shotPower', 'dribbling'],
          riskTier: 'High Risk High Reward',
          actionType: 'shoot_power',
        },
        {
          label: 'Calm Tempo & Retain Ball',
          description: 'Shield the ball, draw the foul, and allow your defense to push up the pitch.',
          requiredAttributes: ['ballControl', 'composure', 'strength'],
          riskTier: 'Safe',
          actionType: 'pass_through',
        },
      ],
    });
  } else {
    // Defenders & Fullbacks
    moments.push({
      id: 'last_man_tackle',
      minute: Math.floor(Math.random() * 25) + 40,
      situation: 'Last-Man Defensive Emergency',
      description: `${opponent.shortName}'s star forward is bearing down on your goal. One mistimed challenge means a red card!`,
      options: [
        {
          label: 'Precision Sliding Block',
          description: 'Slide with your leading leg hooked to cleanly scoop the ball away from his toe.',
          requiredAttributes: ['tackling', 'agility', 'composure'],
          riskTier: 'High Risk High Reward',
          actionType: 'tackle',
        },
        {
          label: 'Shepherd Outside & Jockey',
          description: 'Stand your ground, don\'t bite on his stepovers, and force him onto his weak foot.',
          requiredAttributes: ['positioning', 'strength', 'workRate'],
          riskTier: 'Safe',
          actionType: 'tackle',
        },
        {
          label: 'Intercept the Passing Lane',
          description: 'Read his eyes, anticipate the cutback, and step forward to pinch the pass.',
          requiredAttributes: ['vision', 'positioning', 'pace'],
          riskTier: 'Moderate',
          actionType: 'tackle',
        },
      ],
    });
  }

  return moments;
}

/**
 * Resolves a player's tactical choice in a key moment based on attributes + RNG
 */
export function resolveMomentChoice(
  player: Player,
  requiredAttrs: (keyof typeof player.attributes)[],
  riskTier: string,
  actionType: string,
  attributeModifiers?: Partial<Record<keyof typeof player.attributes, number>>
): { success: boolean; commentary: string; scoreDelta: 'goal' | 'assist' | 'stop' | 'miss' } {
  // Compute average of relevant attributes including dynamic modifiers (e.g. fatigue penalties)
  const total = requiredAttrs.reduce((sum, attr) => {
    const base = player.attributes[attr] || 60;
    const modifier = (attributeModifiers && attributeModifiers[attr]) || 0;
    return sum + Math.max(25, base + modifier);
  }, 0);
  const avgStat = total / requiredAttrs.length;

  // Sharpness and morale modifiers
  const sharpnessBonus = (player.matchSharpness - 50) * 0.15;
  const moraleBonus = (player.morale - 50) * 0.1;
  const energyPenalty = player.energy < 40 ? -12 : player.energy < 60 ? -5 : 0;

  let baseThreshold = 65;
  if (riskTier === 'High Risk High Reward') baseThreshold = 75;
  if (riskTier === 'Safe') baseThreshold = 55;

  const effectiveStat = avgStat + sharpnessBonus + moraleBonus + energyPenalty;
  const roll = Math.random() * 100;
  const success = roll < Math.min(92, Math.max(15, (effectiveStat / baseThreshold) * 60));

  if (success) {
    if (actionType.startsWith('shoot') || actionType === 'chip') {
      return {
        success: true,
        scoreDelta: 'goal',
        commentary: `GOAAALLL! Sensational execution! You execute it to absolute perfection, beating the goalkeeper and wheeling away in wild celebration!`,
      };
    } else if (actionType === 'pass_through' || actionType === 'cross') {
      return {
        success: true,
        scoreDelta: 'assist',
        commentary: `WHAT AN ASSIST! A pinpoint delivery that tears the defense apart, setting up your teammate to bury it into the empty net!`,
      };
    } else {
      return {
        success: true,
        scoreDelta: 'stop',
        commentary: `WORLD CLASS INTERVENTION! You time the challenge with surgical precision, dispossessing the forward to thunderous applause from the stadium!`,
      };
    }
  } else {
    if (actionType.startsWith('shoot') || actionType === 'chip') {
      return {
        success: false,
        scoreDelta: 'miss',
        commentary: `Agonizing miss! The effort clips the outside of the woodwork and rebounds clear! The manager has his hands on his head!`,
      };
    } else if (actionType === 'pass_through' || actionType === 'cross') {
      return {
        success: false,
        scoreDelta: 'miss',
        commentary: `Interception! The defender anticipated the pass and cut it out before it could reach its target.`,
      };
    } else {
      return {
        success: false,
        scoreDelta: 'miss',
        commentary: `Beaten! The attacker slips past your challenge, putting the goalkeeper in grave danger!`,
      };
    }
  }
}

/**
 * Simulates a full 90-minute match experience with tactical strength validation and score consistency
 */
export function simulateMatch(
  homeClub: Club,
  awayClub: Club,
  player: Player,
  momentDecisions: { momentId: string; success: boolean; scoreDelta: string }[],
  exactScore?: {
    homeGoals: number;
    awayGoals: number;
    events?: MatchLiveEvent[];
    playerGoals?: number;
    playerAssists?: number;
    playerMinutes?: number;
    playerStarted?: boolean;
  }
): MatchSimulationResult {
  const isHome = player.currentClubId === homeClub.id;
  const playerClub = isHome ? homeClub : awayClub;
  const oppClub = isHome ? awayClub : homeClub;

  // Determine starting status
  const playerStarted = exactScore?.playerStarted !== undefined
    ? exactScore.playerStarted
    : (player.managerTrust >= 40 && player.energy >= 40 && player.injuryWeeks === 0);

  const playerMinutes = exactScore?.playerMinutes !== undefined
    ? exactScore.playerMinutes
    : (playerStarted ? Math.min(90, 60 + Math.floor(player.energy / 3)) : player.managerTrust >= 25 ? 25 : 0);

  let homeGoals = 0;
  let awayGoals = 0;
  let playerGoals = 0;
  let playerAssists = 0;

  if (exactScore) {
    // Exact single-source-of-truth score from live simulation!
    homeGoals = exactScore.homeGoals;
    awayGoals = exactScore.awayGoals;
    playerGoals = exactScore.playerGoals ?? 0;
    playerAssists = exactScore.playerAssists ?? 0;
  } else {
    // Quick-sim with realistic football Poisson-like distribution based on team tactical strength
    const homeAdvantage = 1.15;
    const repRatio = (homeClub.reputation / Math.max(1, awayClub.reputation));
    
    // Realistic expected goals (xG between 0.8 and 2.2)
    const homeXg = Math.min(2.8, Math.max(0.6, 1.35 * repRatio * homeAdvantage));
    const awayXg = Math.min(2.5, Math.max(0.5, 1.15 / repRatio));

    // Realistic goal generation (prevents absurd high-scoring outcomes)
    const rollGoals = (xg: number) => {
      const r = Math.random();
      if (r < Math.exp(-xg)) return 0;
      if (r < Math.exp(-xg) * (1 + xg)) return 1;
      if (r < Math.exp(-xg) * (1 + xg + (xg * xg) / 2)) return 2;
      if (r < 0.96) return 3;
      return 4; // Very rare
    };

    homeGoals = rollGoals(homeXg);
    awayGoals = rollGoals(awayXg);

    // Factor in player's interactive moment decisions
    momentDecisions.forEach(m => {
      if (m.success) {
        if (m.scoreDelta === 'goal') {
          playerGoals++;
          if (isHome) homeGoals = Math.max(homeGoals, 1);
          else awayGoals = Math.max(awayGoals, 1);
        } else if (m.scoreDelta === 'assist') {
          playerAssists++;
          if (isHome) homeGoals = Math.max(homeGoals, 1);
          else awayGoals = Math.max(awayGoals, 1);
        }
      }
    });

    if (playerStarted && playerMinutes >= 60) {
      const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(player.position);
      if (isAttacker && Math.random() < (player.attributes.finishing / 300)) {
        playerGoals++;
        if (isHome && homeGoals < playerGoals) homeGoals = playerGoals;
        if (!isHome && awayGoals < playerGoals) awayGoals = playerGoals;
      }
    }
  }

  // Calculate Match Rating (1.0 - 10.0 scale)
  let baseRating = 6.2 + (Math.random() * 0.7);
  baseRating += playerGoals * 1.5;
  baseRating += playerAssists * 1.0;
  if (!playerStarted && playerMinutes === 0) baseRating = 0;

  const playerWon = (isHome && homeGoals > awayGoals) || (!isHome && awayGoals > homeGoals);
  const playerDrew = homeGoals === awayGoals;
  if (playerWon) baseRating += 0.5;
  if (!playerWon && !playerDrew) baseRating -= 0.3;

  const playerRating = Number(Math.min(10.0, Math.max(playerMinutes > 0 ? 5.0 : 0.0, baseRating)).toFixed(1));

  // Generate or preserve Match Events
  const events: MatchLiveEvent[] = exactScore?.events && exactScore.events.length > 0
    ? exactScore.events
    : [
        { minute: 1, text: `Kick-off at ${homeClub.stadiumName}! A roaring crowd under the floodlights.`, type: 'commentary' },
        ...(playerGoals > 0 ? [{ minute: 34, text: `⚽ GOAL! ${player.firstName} ${player.lastName} converts with surgical composure!`, type: 'goal' as const, isPlayerInvolved: true }] : []),
        ...(playerAssists > 0 ? [{ minute: 58, text: `🅰️ ASSIST! ${player.lastName} threads a masterclass through ball!`, type: 'assist' as const, isPlayerInvolved: true }] : []),
        { minute: 90, text: `Full-time whistle! Final score: ${homeClub.name} ${homeGoals} - ${awayGoals} ${awayClub.name}.`, type: 'commentary' },
      ];

  // Compute Stamina Loss & Rating Narrative
  const playerStaminaLoss = playerMinutes === 0 ? 0 : Math.round(playerMinutes * 0.28);
  const managerTrustDelta = playerRating >= 8.0 ? 8 : playerRating >= 7.0 ? 4 : playerRating >= 6.0 ? 1 : playerMinutes > 0 ? -4 : 0;
  const fanMoraleDelta = playerGoals > 0 || playerRating >= 7.5 ? 6 : playerWon ? 3 : -2;

  // Calculate earnings paid from contract
  const c = player.currentContract;
  let winningsPaid = c.weeklyWage;
  if (playerMinutes > 0) winningsPaid += c.appearanceBonus;
  if (playerStarted) winningsPaid += c.startingBonus;
  winningsPaid += (playerGoals * c.goalBonus);
  winningsPaid += (playerAssists * c.assistBonus);
  if (playerWon) winningsPaid += c.matchWinBonus;

  let matchRatingDetail = 'Solid professional display.';
  if (playerRating >= 8.5) matchRatingDetail = 'Man of the Match performance! Electrifying on the pitch.';
  else if (playerRating >= 7.5) matchRatingDetail = 'Superb performance, drove team attacks forward with confidence.';
  else if (playerRating <= 5.8 && playerMinutes > 0) matchRatingDetail = 'Struggled to impose influence against aggressive pressing.';
  else if (playerMinutes === 0) matchRatingDetail = 'Unused squad member / Rested on manager rotation.';

  return {
    homeClub,
    awayClub,
    homeScore: homeGoals,
    awayScore: awayGoals,
    playerMinutes,
    playerStarted,
    playerGoals,
    playerAssists,
    playerRating,
    matchRatingDetail,
    events,
    playerStaminaLoss,
    fanMoraleDelta,
    managerTrustDelta,
    winningsPaid,
  };
}
