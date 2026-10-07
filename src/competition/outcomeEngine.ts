import type {
  CompetitionRuleSet,
  CompetitionSeasonOutcomeEvaluation,
  CompetitionSeasonOutcomeResult,
  CompetitionSeasonOutcomeRules,
  CompetitionSeasonOutcomeTag,
  CompetitionSeasonState,
  CompetitionTeamSeasonOutcome,
} from './types';
import {
  getCompetitionStandings,
  isCompetitionSeasonComplete,
  validateCompetitionSeasonState,
} from './seasonEngine';

// ============================================================================
// OUTCOME RULE VALIDATION
// ============================================================================

export function validateCompetitionSeasonOutcomeRules(
  rules: CompetitionSeasonOutcomeRules,
  participantCount: number
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Helper to validate a position number
  function isValidPosition(pos: unknown): pos is number {
    return (
      typeof pos === 'number' &&
      Number.isInteger(pos) &&
      Number.isFinite(pos) &&
      pos >= 1 &&
      pos <= participantCount
    );
  }

  // 1. Champion position validation
  if (!isValidPosition(rules.championPosition)) {
    errors.push(
      `championPosition must be an integer between 1 and ${participantCount}, received ${rules.championPosition}.`
    );
  }

  // 2. Direct promotion positions validation
  if (!Array.isArray(rules.directPromotionPositions)) {
    errors.push('directPromotionPositions must be an array.');
  } else {
    for (const pos of rules.directPromotionPositions) {
      if (!isValidPosition(pos)) {
        errors.push(
          `directPromotionPositions contains invalid position ${pos}: must be an integer between 1 and ${participantCount}.`
        );
      }
    }
    if (new Set(rules.directPromotionPositions).size !== rules.directPromotionPositions.length) {
      errors.push('directPromotionPositions contains duplicate entries.');
    }
  }

  // 3. Direct relegation positions validation
  if (!Array.isArray(rules.directRelegationPositions)) {
    errors.push('directRelegationPositions must be an array.');
  } else {
    for (const pos of rules.directRelegationPositions) {
      if (!isValidPosition(pos)) {
        errors.push(
          `directRelegationPositions contains invalid position ${pos}: must be an integer between 1 and ${participantCount}.`
        );
      }
    }
    if (new Set(rules.directRelegationPositions).size !== rules.directRelegationPositions.length) {
      errors.push('directRelegationPositions contains duplicate entries.');
    }
  }

  // 4. Promotion playoff validation
  if (rules.promotionPlayoff.mode === 'POSITIONS') {
    if (!Array.isArray(rules.promotionPlayoff.positions) || rules.promotionPlayoff.positions.length === 0) {
      errors.push('promotionPlayoff with mode "POSITIONS" must contain at least one position.');
    } else {
      for (const pos of rules.promotionPlayoff.positions) {
        if (!isValidPosition(pos)) {
          errors.push(
            `promotionPlayoff contains invalid position ${pos}: must be an integer between 1 and ${participantCount}.`
          );
        }
      }
      if (new Set(rules.promotionPlayoff.positions).size !== rules.promotionPlayoff.positions.length) {
        errors.push('promotionPlayoff contains duplicate positions.');
      }
    }
  }

  // 5. Relegation playoff validation
  if (rules.relegationPlayoff.mode === 'POSITIONS') {
    if (!Array.isArray(rules.relegationPlayoff.positions) || rules.relegationPlayoff.positions.length === 0) {
      errors.push('relegationPlayoff with mode "POSITIONS" must contain at least one position.');
    } else {
      for (const pos of rules.relegationPlayoff.positions) {
        if (!isValidPosition(pos)) {
          errors.push(
            `relegationPlayoff contains invalid position ${pos}: must be an integer between 1 and ${participantCount}.`
          );
        }
      }
      if (new Set(rules.relegationPlayoff.positions).size !== rules.relegationPlayoff.positions.length) {
        errors.push('relegationPlayoff contains duplicate positions.');
      }
    }
  }

  // 6. Overlap validation
  const directPromotionSet = new Set(rules.directPromotionPositions ?? []);
  const directRelegationSet = new Set(rules.directRelegationPositions ?? []);
  const promotionPlayoffSet =
    rules.promotionPlayoff.mode === 'POSITIONS'
      ? new Set(rules.promotionPlayoff.positions)
      : new Set<number>();
  const relegationPlayoffSet =
    rules.relegationPlayoff.mode === 'POSITIONS'
      ? new Set(rules.relegationPlayoff.positions)
      : new Set<number>();

  // 6.1 directPromotion and promotionPlayoff must not overlap
  for (const pos of directPromotionSet) {
    if (promotionPlayoffSet.has(pos)) {
      errors.push(
        `Position ${pos} cannot simultaneously be directPromotion and promotionPlayoff.`
      );
    }
  }

  // 6.2 directRelegation and relegationPlayoff must not overlap
  for (const pos of directRelegationSet) {
    if (relegationPlayoffSet.has(pos)) {
      errors.push(
        `Position ${pos} cannot simultaneously be directRelegation and relegationPlayoff.`
      );
    }
  }

  // 6.3 Any promotion outcome and any relegation outcome must not overlap
  const allPromotionPositions = new Set([...directPromotionSet, ...promotionPlayoffSet]);
  const allRelegationPositions = new Set([...directRelegationSet, ...relegationPlayoffSet]);
  for (const pos of allPromotionPositions) {
    if (allRelegationPositions.has(pos)) {
      errors.push(
        `Position ${pos} cannot simultaneously be a promotion outcome and a relegation outcome.`
      );
    }
  }

  // 6.4 Champion overlaps:
  // - Allowed: championPosition in directPromotionPositions
  // - Forbidden: championPosition in promotionPlayoff, directRelegation, or relegationPlayoff
  if (promotionPlayoffSet.has(rules.championPosition)) {
    errors.push(
      `championPosition ${rules.championPosition} cannot be a promotion playoff qualifier.`
    );
  }
  if (directRelegationSet.has(rules.championPosition)) {
    errors.push(
      `championPosition ${rules.championPosition} cannot be in directRelegationPositions.`
    );
  }
  if (relegationPlayoffSet.has(rules.championPosition)) {
    errors.push(
      `championPosition ${rules.championPosition} cannot be a relegation playoff qualifier.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MAIN EVALUATION ENGINE
// ============================================================================

export function evaluateCompetitionSeasonOutcomes(
  state: CompetitionSeasonState,
  ruleSet: CompetitionRuleSet
): CompetitionSeasonOutcomeResult {
  // 1. Rule-set scope validation against state
  if (ruleSet.id !== state.ruleSetId) {
    return {
      accepted: false,
      error: `RuleSet id mismatch: expected ${state.ruleSetId}, received ${ruleSet.id}.`,
    };
  }
  if (ruleSet.competitionId !== state.competitionId) {
    return {
      accepted: false,
      error: `RuleSet competitionId mismatch: expected ${state.competitionId}, received ${ruleSet.competitionId}.`,
    };
  }
  if (ruleSet.seasonLabel !== state.seasonLabel) {
    return {
      accepted: false,
      error: `RuleSet seasonLabel mismatch: expected ${state.seasonLabel}, received ${ruleSet.seasonLabel}.`,
    };
  }

  // 2. State integrity validation
  const stateValidation = validateCompetitionSeasonState(state);
  if (!stateValidation.valid) {
    return {
      accepted: false,
      error: `Cannot evaluate outcomes: season state is invalid (${stateValidation.errors[0]}).`,
    };
  }

  // 3. Season completion validation
  if (!isCompetitionSeasonComplete(state)) {
    return {
      accepted: false,
      error: 'Competition season is not complete.',
    };
  }

  // 4. Outcome rules presence
  if (!ruleSet.seasonOutcomes) {
    return {
      accepted: false,
      error: 'RuleSet has no season outcome rules.',
    };
  }

  // 5. UNCONFIGURED playoff check
  if (
    ruleSet.seasonOutcomes.promotionPlayoff.mode === 'UNCONFIGURED' ||
    ruleSet.seasonOutcomes.relegationPlayoff.mode === 'UNCONFIGURED'
  ) {
    return {
      accepted: false,
      error:
        'Season outcome rules are incomplete: playoff qualification positions are unconfigured.',
    };
  }

  // 6. Outcome rule validity
  const participantCount = state.schedule.participantTeamIds.length;
  const outcomeRuleValidation = validateCompetitionSeasonOutcomeRules(
    ruleSet.seasonOutcomes,
    participantCount
  );
  if (!outcomeRuleValidation.valid) {
    return {
      accepted: false,
      error: `Invalid season outcome rules: ${outcomeRuleValidation.errors[0]}`,
    };
  }

  // 7. Final standings derivation
  const standingsResult = getCompetitionStandings(state, ruleSet);
  if (!standingsResult.accepted || !standingsResult.standings) {
    return {
      accepted: false,
      error: `Failed to derive final standings: ${standingsResult.error ?? 'unknown error'}`,
    };
  }

  const finalStandings = standingsResult.standings;
  const {
    championPosition,
    directPromotionPositions,
    promotionPlayoff,
    directRelegationPositions,
    relegationPlayoff,
  } = ruleSet.seasonOutcomes;

  const directPromotionSet = new Set(directPromotionPositions);
  const directRelegationSet = new Set(directRelegationPositions);
  const promotionPlayoffSet =
    promotionPlayoff.mode === 'POSITIONS'
      ? new Set(promotionPlayoff.positions)
      : new Set<number>();
  const relegationPlayoffSet =
    relegationPlayoff.mode === 'POSITIONS'
      ? new Set(relegationPlayoff.positions)
      : new Set<number>();

  let championTeamId: string | undefined;
  const teamOutcomes: CompetitionTeamSeasonOutcome[] = [];

  for (const row of finalStandings) {
    const tags: CompetitionSeasonOutcomeTag[] = [];

    if (row.position === championPosition) {
      tags.push('CHAMPION');
      championTeamId = row.teamId;
    }
    if (directPromotionSet.has(row.position)) {
      tags.push('DIRECT_PROMOTION');
    }
    if (promotionPlayoffSet.has(row.position)) {
      tags.push('PROMOTION_PLAYOFF_QUALIFIER');
    }
    if (directRelegationSet.has(row.position)) {
      tags.push('DIRECT_RELEGATION');
    }
    if (relegationPlayoffSet.has(row.position)) {
      tags.push('RELEGATION_PLAYOFF_QUALIFIER');
    }

    teamOutcomes.push({
      teamId: row.teamId,
      finalPosition: row.position,
      tags,
    });
  }

  if (!championTeamId) {
    return {
      accepted: false,
      error: `Champion position ${championPosition} not found in final standings.`,
    };
  }

  return {
    accepted: true,
    evaluation: {
      competitionId: state.competitionId,
      seasonLabel: state.seasonLabel,
      ruleSetId: state.ruleSetId,
      championTeamId,
      teamOutcomes,
    },
  };
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

export function getTeamSeasonOutcome(
  evaluation: CompetitionSeasonOutcomeEvaluation,
  teamId: string
): CompetitionTeamSeasonOutcome | undefined {
  return evaluation.teamOutcomes.find((to) => to.teamId === teamId);
}

export function getTeamsWithSeasonOutcome(
  evaluation: CompetitionSeasonOutcomeEvaluation,
  tag: CompetitionSeasonOutcomeTag
): CompetitionTeamSeasonOutcome[] {
  return evaluation.teamOutcomes.filter((to) => to.tags.includes(tag));
}
