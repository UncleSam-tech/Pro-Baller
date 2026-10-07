import {
  getCompetitionMovementRelationship,
  getCompetitionMovementRelationshipById,
  validateCompetitionHierarchyRegistry,
} from './hierarchyRegistry';
import type {
  CompetitionHierarchyRegistry,
  CompetitionRuleRegistry,
  CompetitionSeasonOutcomeEvaluation,
  DirectCompetitionMovementDerivationResult,
  DomesticLeagueMembershipState,
  DomesticLeagueMembershipTransition,
  DomesticLeagueMembershipTransitionResult,
  DomesticLeagueMembershipValidation,
  ResolvedCompetitionClubMovement,
} from './types';

// ============================================================================
// PART 1: DOMESTIC MEMBERSHIP STATE FACTORY & VALIDATOR
// ============================================================================

/**
 * Creates a new DomesticLeagueMembershipState with defensive copies of maps and team arrays.
 * Preserves caller team order without automatic sorting.
 */
export function createDomesticLeagueMembershipState(
  countryId: string,
  seasonLabel: string,
  competitionTeamIds: Record<string, string[]>
): DomesticLeagueMembershipState {
  const copied: Record<string, string[]> = {};
  for (const [compId, teams] of Object.entries(competitionTeamIds)) {
    copied[compId] = [...teams];
  }

  return {
    countryId,
    seasonLabel,
    competitionTeamIds: copied,
  };
}

/**
 * Purely validates a DomesticLeagueMembershipState against a CompetitionRuleRegistry.
 */
export function validateDomesticLeagueMembershipState(
  state: DomesticLeagueMembershipState,
  competitionRegistry: CompetitionRuleRegistry
): DomesticLeagueMembershipValidation {
  const errors: string[] = [];

  // 1. Country & Season validation
  if (!state.countryId || state.countryId.trim() === '') {
    errors.push('Domestic league membership state must have a non-empty countryId.');
  }

  if (!state.seasonLabel || state.seasonLabel.trim() === '') {
    errors.push('Domestic league membership state must have a non-empty seasonLabel.');
  }

  const seenTeamsGlobal = new Map<string, string>(); // teamId -> competitionId

  // 2. Validate competitions and teams
  for (const [compId, teamIds] of Object.entries(state.competitionTeamIds)) {
    const compDef = competitionRegistry.definitions[compId];
    if (!compDef) {
      errors.push(`Competition '${compId}' does not exist in competition registry definitions.`);
      continue;
    }

    if (compDef.category !== 'DOMESTIC_LEAGUE') {
      errors.push(
        `Competition '${compId}' has category '${compDef.category}', but only DOMESTIC_LEAGUE is permitted in domestic membership state.`
      );
    }

    if (compDef.countryId !== state.countryId) {
      errors.push(
        `Competition '${compId}' country '${compDef.countryId ?? 'undefined'}' does not match state country '${state.countryId}'.`
      );
    }

    // 3. Validate team arrays
    const seenTeamsInComp = new Set<string>();
    for (const teamId of teamIds) {
      if (!teamId || teamId.trim() === '') {
        errors.push(`Competition '${compId}' contains a blank or empty team ID.`);
        continue;
      }

      if (seenTeamsInComp.has(teamId)) {
        errors.push(`Competition '${compId}' contains duplicate team ID '${teamId}'.`);
      } else {
        seenTeamsInComp.add(teamId);
      }

      // 4. One domestic league per team across competitions
      const existingComp = seenTeamsGlobal.get(teamId);
      if (existingComp && existingComp !== compId) {
        errors.push(
          `Team '${teamId}' is assigned to multiple domestic leagues: '${existingComp}' and '${compId}'.`
        );
      } else {
        seenTeamsGlobal.set(teamId, compId);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Returns a new array of team IDs in the specified domestic competition, or undefined if not found.
 */
export function getDomesticLeagueTeamIds(
  state: DomesticLeagueMembershipState,
  competitionId: string
): string[] | undefined {
  const teams = state.competitionTeamIds[competitionId];
  if (!teams) {
    return undefined;
  }
  return [...teams];
}

/**
 * Returns the domestic league competition ID that contains the specified team, or undefined if not found.
 */
export function getTeamDomesticLeagueCompetitionId(
  state: DomesticLeagueMembershipState,
  teamId: string
): string | undefined {
  for (const [compId, teams] of Object.entries(state.competitionTeamIds)) {
    if (teams.includes(teamId)) {
      return compId;
    }
  }
  return undefined;
}

// ============================================================================
// PART 2 & 3: DIRECT MOVEMENT DERIVATION
// ============================================================================

function compareMovements(
  a: ResolvedCompetitionClubMovement,
  b: ResolvedCompetitionClubMovement
): number {
  const compCompare = a.sourceCompetitionId.localeCompare(b.sourceCompetitionId);
  if (compCompare !== 0) return compCompare;

  const posA = typeof a.sourceFinalPosition === 'number' ? a.sourceFinalPosition : Number.MAX_SAFE_INTEGER;
  const posB = typeof b.sourceFinalPosition === 'number' ? b.sourceFinalPosition : Number.MAX_SAFE_INTEGER;
  if (posA !== posB) return posA - posB;

  return a.teamId.localeCompare(b.teamId);
}

/**
 * Derives explicit resolved club movement records from direct season outcomes.
 * Ignores CHAMPION, PROMOTION_PLAYOFF_QUALIFIER, and RELEGATION_PLAYOFF_QUALIFIER.
 */
export function deriveDirectCompetitionMovements(
  membershipState: DomesticLeagueMembershipState,
  outcomeEvaluations: CompetitionSeasonOutcomeEvaluation[],
  hierarchyRegistry: CompetitionHierarchyRegistry
): DirectCompetitionMovementDerivationResult {
  const seenEvaluationComps = new Set<string>();
  const derivedMovements: ResolvedCompetitionClubMovement[] = [];

  for (const evaluation of outcomeEvaluations) {
    // 1. Reject duplicate evaluations for the same competition
    if (seenEvaluationComps.has(evaluation.competitionId)) {
      return {
        accepted: false,
        error: `Duplicate outcome evaluation detected for competition '${evaluation.competitionId}'.`,
      };
    }
    seenEvaluationComps.add(evaluation.competitionId);

    // 2. Season label matching
    if (evaluation.seasonLabel !== membershipState.seasonLabel) {
      return {
        accepted: false,
        error: `Evaluation season '${evaluation.seasonLabel}' does not match membership state season '${membershipState.seasonLabel}'.`,
      };
    }

    // 3. Competition must exist in membership
    const currentMembers = membershipState.competitionTeamIds[evaluation.competitionId];
    if (!currentMembers) {
      return {
        accepted: false,
        error: `Evaluation competition '${evaluation.competitionId}' is not present in membership state.`,
      };
    }

    // 4-8. Validate teamOutcomes
    if (evaluation.teamOutcomes.length !== currentMembers.length) {
      return {
        accepted: false,
        error: `Outcome evaluation team count (${evaluation.teamOutcomes.length}) does not match membership count (${currentMembers.length}) for '${evaluation.competitionId}'.`,
      };
    }

    const seenTeamsInEval = new Set<string>();
    const seenPositions = new Set<number>();

    for (const teamOutcome of evaluation.teamOutcomes) {
      if (seenTeamsInEval.has(teamOutcome.teamId)) {
        return {
          accepted: false,
          error: `Duplicate team '${teamOutcome.teamId}' in outcome evaluation for '${evaluation.competitionId}'.`,
        };
      }
      seenTeamsInEval.add(teamOutcome.teamId);

      if (!currentMembers.includes(teamOutcome.teamId)) {
        return {
          accepted: false,
          error: `Team '${teamOutcome.teamId}' in outcome evaluation does not belong to membership for '${evaluation.competitionId}'.`,
        };
      }

      if (
        !Number.isInteger(teamOutcome.finalPosition) ||
        teamOutcome.finalPosition < 1 ||
        teamOutcome.finalPosition > currentMembers.length
      ) {
        return {
          accepted: false,
          error: `Invalid final position ${teamOutcome.finalPosition} for team '${teamOutcome.teamId}' in '${evaluation.competitionId}'.`,
        };
      }

      if (seenPositions.has(teamOutcome.finalPosition)) {
        return {
          accepted: false,
          error: `Duplicate final position ${teamOutcome.finalPosition} in outcome evaluation for '${evaluation.competitionId}'.`,
        };
      }
      seenPositions.add(teamOutcome.finalPosition);

      // Check contradictory direct tags
      const hasDirectPromo = teamOutcome.tags.includes('DIRECT_PROMOTION');
      const hasDirectReleg = teamOutcome.tags.includes('DIRECT_RELEGATION');

      if (hasDirectPromo && hasDirectReleg) {
        return {
          accepted: false,
          error: `Contradictory tags on team '${teamOutcome.teamId}': cannot have both DIRECT_PROMOTION and DIRECT_RELEGATION.`,
        };
      }

      if (hasDirectPromo) {
        const lookup = getCompetitionMovementRelationship(
          evaluation.competitionId,
          'PROMOTION',
          hierarchyRegistry
        );
        if (!lookup.accepted || !lookup.relationship) {
          return {
            accepted: false,
            error:
              lookup.error ??
              `No PROMOTION relationship configured for source '${evaluation.competitionId}'.`,
          };
        }

        const rel = lookup.relationship;
        if (rel.countryId !== membershipState.countryId) {
          return {
            accepted: false,
            error: `Movement relationship country '${rel.countryId}' does not match membership state country '${membershipState.countryId}'.`,
          };
        }
        if (rel.sourceCompetitionId !== evaluation.competitionId) {
          return {
            accepted: false,
            error: `Movement relationship source '${rel.sourceCompetitionId}' does not match evaluation '${evaluation.competitionId}'.`,
          };
        }
        if (!(rel.destinationCompetitionId in membershipState.competitionTeamIds)) {
          return {
            accepted: false,
            error: `Movement destination '${rel.destinationCompetitionId}' is not present in membership state.`,
          };
        }

        derivedMovements.push({
          teamId: teamOutcome.teamId,
          countryId: rel.countryId,
          sourceCompetitionId: evaluation.competitionId,
          destinationCompetitionId: rel.destinationCompetitionId,
          movementType: 'PROMOTION',
          relationshipId: rel.id,
          source: 'DIRECT_SEASON_OUTCOME',
          sourceFinalPosition: teamOutcome.finalPosition,
        });
      }

      if (hasDirectReleg) {
        const lookup = getCompetitionMovementRelationship(
          evaluation.competitionId,
          'RELEGATION',
          hierarchyRegistry
        );
        if (!lookup.accepted || !lookup.relationship) {
          return {
            accepted: false,
            error:
              lookup.error ??
              `No RELEGATION relationship configured for source '${evaluation.competitionId}'.`,
          };
        }

        const rel = lookup.relationship;
        if (rel.countryId !== membershipState.countryId) {
          return {
            accepted: false,
            error: `Movement relationship country '${rel.countryId}' does not match membership state country '${membershipState.countryId}'.`,
          };
        }
        if (rel.sourceCompetitionId !== evaluation.competitionId) {
          return {
            accepted: false,
            error: `Movement relationship source '${rel.sourceCompetitionId}' does not match evaluation '${evaluation.competitionId}'.`,
          };
        }
        if (!(rel.destinationCompetitionId in membershipState.competitionTeamIds)) {
          return {
            accepted: false,
            error: `Movement destination '${rel.destinationCompetitionId}' is not present in membership state.`,
          };
        }

        derivedMovements.push({
          teamId: teamOutcome.teamId,
          countryId: rel.countryId,
          sourceCompetitionId: evaluation.competitionId,
          destinationCompetitionId: rel.destinationCompetitionId,
          movementType: 'RELEGATION',
          relationshipId: rel.id,
          source: 'DIRECT_SEASON_OUTCOME',
          sourceFinalPosition: teamOutcome.finalPosition,
        });
      }
    }
  }

  derivedMovements.sort(compareMovements);

  return {
    accepted: true,
    movements: derivedMovements,
  };
}

// ============================================================================
// PART 4: MEMBERSHIP TRANSITION APPLICATION
// ============================================================================

/**
 * Atomically applies a complete set of resolved club movements to produce next season membership state.
 * Validates division size preservation, relationship pinning, and purity.
 */
export function applyDomesticLeagueMembershipTransition(
  currentState: DomesticLeagueMembershipState,
  movements: ResolvedCompetitionClubMovement[],
  competitionRegistry: CompetitionRuleRegistry,
  hierarchyRegistry: CompetitionHierarchyRegistry,
  toSeasonLabel: string
): DomesticLeagueMembershipTransitionResult {
  // 1. Validate current membership
  const currentValidation = validateDomesticLeagueMembershipState(
    currentState,
    competitionRegistry
  );
  if (!currentValidation.valid) {
    return {
      accepted: false,
      error: `Current membership state is invalid: ${currentValidation.errors.join('; ')}`,
    };
  }

  // 2. Validate hierarchy registry
  const hierarchyValidation = validateCompetitionHierarchyRegistry(
    hierarchyRegistry,
    competitionRegistry
  );
  if (!hierarchyValidation.valid) {
    return {
      accepted: false,
      error: `Hierarchy registry is invalid: ${hierarchyValidation.errors.join('; ')}`,
    };
  }

  // 3. Target season label validation
  if (!toSeasonLabel || toSeasonLabel.trim() === '') {
    return {
      accepted: false,
      error: 'Target toSeasonLabel must be a non-empty string.',
    };
  }

  if (toSeasonLabel === currentState.seasonLabel) {
    return {
      accepted: false,
      error: `Target season '${toSeasonLabel}' cannot be identical to current season '${currentState.seasonLabel}'.`,
    };
  }

  // 4. Validate all movements atomically
  const movedTeamIds = new Set<string>();

  for (const m of movements) {
    if (!m.teamId || m.teamId.trim() === '') {
      return {
        accepted: false,
        error: 'Movement record contains a blank teamId.',
      };
    }

    if (m.countryId !== currentState.countryId) {
      return {
        accepted: false,
        error: `Movement country '${m.countryId}' does not match current state country '${currentState.countryId}'.`,
      };
    }

    if (!(m.sourceCompetitionId in currentState.competitionTeamIds)) {
      return {
        accepted: false,
        error: `Movement source competition '${m.sourceCompetitionId}' does not exist in current membership state.`,
      };
    }

    if (!(m.destinationCompetitionId in currentState.competitionTeamIds)) {
      return {
        accepted: false,
        error: `Movement destination competition '${m.destinationCompetitionId}' does not exist in current membership state.`,
      };
    }

    if (m.sourceCompetitionId === m.destinationCompetitionId) {
      return {
        accepted: false,
        error: `Movement cannot have identical source and destination competition '${m.sourceCompetitionId}'.`,
      };
    }

    const currentSourceMembers = currentState.competitionTeamIds[m.sourceCompetitionId];
    if (!currentSourceMembers.includes(m.teamId)) {
      return {
        accepted: false,
        error: `Team '${m.teamId}' does not currently belong to source competition '${m.sourceCompetitionId}'.`,
      };
    }

    const currentDestMembers = currentState.competitionTeamIds[m.destinationCompetitionId];
    if (currentDestMembers.includes(m.teamId)) {
      return {
        accepted: false,
        error: `Team '${m.teamId}' already belongs to destination competition '${m.destinationCompetitionId}'.`,
      };
    }

    // Relationship pinning
    const pinnedRel = getCompetitionMovementRelationshipById(
      m.relationshipId,
      hierarchyRegistry
    );
    if (!pinnedRel) {
      return {
        accepted: false,
        error: `Movement references unknown relationship ID '${m.relationshipId}'.`,
      };
    }

    if (pinnedRel.countryId !== m.countryId) {
      return {
        accepted: false,
        error: `Movement country '${m.countryId}' does not match pinned relationship country '${pinnedRel.countryId}'.`,
      };
    }

    if (pinnedRel.sourceCompetitionId !== m.sourceCompetitionId) {
      return {
        accepted: false,
        error: `Movement source competition '${m.sourceCompetitionId}' does not match pinned relationship source '${pinnedRel.sourceCompetitionId}'.`,
      };
    }

    if (pinnedRel.destinationCompetitionId !== m.destinationCompetitionId) {
      return {
        accepted: false,
        error: `Movement destination competition '${m.destinationCompetitionId}' does not match pinned relationship destination '${pinnedRel.destinationCompetitionId}'.`,
      };
    }

    if (pinnedRel.movementType !== m.movementType) {
      return {
        accepted: false,
        error: `Movement type '${m.movementType}' does not match pinned relationship type '${pinnedRel.movementType}'.`,
      };
    }

    // Duplicate movement for same team
    if (movedTeamIds.has(m.teamId)) {
      return {
        accepted: false,
        error: `Duplicate movement detected for team '${m.teamId}'. A team may move at most once per transition.`,
      };
    }
    movedTeamIds.add(m.teamId);
  }

  // 5. Construct next state membership
  const nextCompetitionTeamIds: Record<string, string[]> = {};

  for (const [compId, currentTeams] of Object.entries(currentState.competitionTeamIds)) {
    const outgoing = movements.filter(m => m.sourceCompetitionId === compId);
    const outgoingTeamIds = new Set(outgoing.map(m => m.teamId));

    const incoming = movements
      .filter(m => m.destinationCompetitionId === compId)
      .slice();

    incoming.sort(compareMovements);

    const nonMoving = currentTeams.filter(t => !outgoingTeamIds.has(t));
    const nextTeams = [...nonMoving, ...incoming.map(m => m.teamId)];

    // 6. Preserve division size
    if (nextTeams.length !== currentTeams.length) {
      return {
        accepted: false,
        error: `Division size mismatch for competition '${compId}': current count is ${currentTeams.length}, next count would be ${nextTeams.length}. Stable-size domestic divisions require equal counts.`,
      };
    }

    nextCompetitionTeamIds[compId] = nextTeams;
  }

  const nextState = createDomesticLeagueMembershipState(
    currentState.countryId,
    toSeasonLabel,
    nextCompetitionTeamIds
  );

  // 7. Validate next state
  const nextValidation = validateDomesticLeagueMembershipState(
    nextState,
    competitionRegistry
  );
  if (!nextValidation.valid) {
    return {
      accepted: false,
      error: `Constructed next state failed validation: ${nextValidation.errors.join('; ')}`,
    };
  }

  return {
    accepted: true,
    transition: {
      countryId: currentState.countryId,
      fromSeasonLabel: currentState.seasonLabel,
      toSeasonLabel,
      movements: movements.map(m => ({ ...m })),
      nextState,
    },
  };
}

// ============================================================================
// PART 5: CONVENIENCE ORCHESTRATOR
// ============================================================================

/**
 * Derives direct movements and applies them to construct next season domestic league membership.
 */
export function buildDirectDomesticLeagueMembershipTransition(
  currentState: DomesticLeagueMembershipState,
  outcomeEvaluations: CompetitionSeasonOutcomeEvaluation[],
  competitionRegistry: CompetitionRuleRegistry,
  hierarchyRegistry: CompetitionHierarchyRegistry,
  toSeasonLabel: string
): DomesticLeagueMembershipTransitionResult {
  const derivationResult = deriveDirectCompetitionMovements(
    currentState,
    outcomeEvaluations,
    hierarchyRegistry
  );

  if (!derivationResult.accepted || !derivationResult.movements) {
    return {
      accepted: false,
      error:
        derivationResult.error ?? 'Failed to derive direct competition movements.',
    };
  }

  return applyDomesticLeagueMembershipTransition(
    currentState,
    derivationResult.movements,
    competitionRegistry,
    hierarchyRegistry,
    toSeasonLabel
  );
}

// ============================================================================
// PART 6: QUERY HELPERS
// ============================================================================

/**
 * Returns incoming movements into a competition from a transition.
 * Returns a new array.
 */
export function getIncomingCompetitionMovements(
  transition: DomesticLeagueMembershipTransition,
  competitionId: string
): ResolvedCompetitionClubMovement[] {
  return transition.movements
    .filter(m => m.destinationCompetitionId === competitionId)
    .map(m => ({ ...m }));
}

/**
 * Returns outgoing movements from a competition from a transition.
 * Returns a new array.
 */
export function getOutgoingCompetitionMovements(
  transition: DomesticLeagueMembershipTransition,
  competitionId: string
): ResolvedCompetitionClubMovement[] {
  return transition.movements
    .filter(m => m.sourceCompetitionId === competitionId)
    .map(m => ({ ...m }));
}
