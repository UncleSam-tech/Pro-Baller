import type {
  CompetitionRuleSet,
  FixtureTeamSubstitutionState,
  SubstitutionProcessResult,
  SubstitutionRecord,
  SubstitutionRequest,
  SubstitutionSummary,
} from './types';

export type { SubstitutionSummary };

/**
 * Creates an empty, pure fixture-team substitution state.
 * Copies player arrays to prevent caller mutation leakage.
 */
export function createFixtureTeamSubstitutionState(
  fixtureId: string,
  teamId: string,
  competitionId: string,
  seasonLabel: string,
  ruleSetId: string,
  onPitchPlayerIds: string[],
  registeredBenchPlayerIds: string[]
): FixtureTeamSubstitutionState {
  return {
    fixtureId,
    teamId,
    competitionId,
    seasonLabel,
    ruleSetId,
    onPitchPlayerIds: [...onPitchPlayerIds],
    registeredBenchPlayerIds: [...registeredBenchPlayerIds],
    records: [],
    processedRequestIds: [],
    usedWindowIds: [],
  };
}

/**
 * Returns the total number of accepted player substitutions made so far.
 */
export function getSubstitutionsUsed(
  state: FixtureTeamSubstitutionState
): number {
  return state.records.reduce((total, r) => total + r.changes.length, 0);
}

/**
 * Returns the number of accepted substitution records that counted as stoppage windows.
 */
export function getSubstitutionWindowsUsed(
  state: FixtureTeamSubstitutionState
): number {
  return state.records.filter(r => r.countedAsWindow).length;
}

/**
 * Returns a unique array of player IDs that have entered as substitutes.
 */
export function getUsedIncomingPlayerIds(
  state: FixtureTeamSubstitutionState
): string[] {
  const incomingIds: string[] = [];
  for (const record of state.records) {
    for (const change of record.changes) {
      if (!incomingIds.includes(change.playerInId)) {
        incomingIds.push(change.playerInId);
      }
    }
  }
  return incomingIds;
}

/**
 * Returns a summary of current squad status and substitution counts.
 */
export function getSubstitutionSummary(
  state: FixtureTeamSubstitutionState
): SubstitutionSummary {
  return {
    substitutionsUsed: getSubstitutionsUsed(state),
    windowsUsed: getSubstitutionWindowsUsed(state),
    playersCurrentlyOnPitch: state.onPitchPlayerIds.length,
    registeredBenchSize: state.registeredBenchPlayerIds.length,
  };
}

/**
 * Pure engine function that decides whether a requested substitution stoppage is legal,
 * applying atomic state changes if accepted.
 */
export function processSubstitutionRequest(
  state: FixtureTeamSubstitutionState,
  request: SubstitutionRequest,
  ruleSet: CompetitionRuleSet
): SubstitutionProcessResult {
  // 1. State invariant validation
  if (new Set(state.onPitchPlayerIds).size !== state.onPitchPlayerIds.length) {
    return {
      state,
      accepted: false,
      error: 'State invariant violation: duplicate player ID in on-pitch squad.',
    };
  }

  if (
    new Set(state.registeredBenchPlayerIds).size !==
    state.registeredBenchPlayerIds.length
  ) {
    return {
      state,
      accepted: false,
      error: 'State invariant violation: duplicate player ID in registered bench.',
    };
  }

  const usedIncomingIds = getUsedIncomingPlayerIds(state);
  const overlapPlayerId = state.onPitchPlayerIds.find(
    id =>
      state.registeredBenchPlayerIds.includes(id) &&
      !usedIncomingIds.includes(id)
  );
  if (overlapPlayerId) {
    return {
      state,
      accepted: false,
      error: `State invariant violation: player "${overlapPlayerId}" is in both on-pitch squad and bench.`,
    };
  }

  if (state.registeredBenchPlayerIds.length > ruleSet.substitutions.benchSize) {
    return {
      state,
      accepted: false,
      error: `State invariant violation: registered bench size (${state.registeredBenchPlayerIds.length}) exceeds rule limit (${ruleSet.substitutions.benchSize}).`,
    };
  }

  // 2. Rule-set scope validation
  if (ruleSet.id !== state.ruleSetId) {
    return {
      state,
      accepted: false,
      error: 'Rule-set ID mismatch.',
    };
  }

  if (ruleSet.competitionId !== state.competitionId) {
    return {
      state,
      accepted: false,
      error: 'Rule-set competition mismatch.',
    };
  }

  if (ruleSet.seasonLabel !== state.seasonLabel) {
    return {
      state,
      accepted: false,
      error: 'Rule-set season mismatch.',
    };
  }

  // 3. Request scope validation
  if (request.fixtureId !== state.fixtureId) {
    return {
      state,
      accepted: false,
      error: 'Request fixture mismatch.',
    };
  }

  if (request.teamId !== state.teamId) {
    return {
      state,
      accepted: false,
      error: 'Request team mismatch.',
    };
  }

  if (request.competitionId !== state.competitionId) {
    return {
      state,
      accepted: false,
      error: 'Request competition mismatch.',
    };
  }

  if (request.seasonLabel !== state.seasonLabel) {
    return {
      state,
      accepted: false,
      error: 'Request season mismatch.',
    };
  }

  // 4. Input validation
  if (!request.id || request.id.trim() === '') {
    return {
      state,
      accepted: false,
      error: 'Request ID must be a non-empty string.',
    };
  }

  if (!request.windowId || request.windowId.trim() === '') {
    return {
      state,
      accepted: false,
      error: 'Window ID must be a non-empty string.',
    };
  }

  if (!request.changes || request.changes.length === 0) {
    return {
      state,
      accepted: false,
      error: 'Substitution request must contain at least one change.',
    };
  }

  for (const change of request.changes) {
    if (!change.playerOutId || change.playerOutId.trim() === '') {
      return {
        state,
        accepted: false,
        error: 'playerOutId must be a non-empty string.',
      };
    }

    if (!change.playerInId || change.playerInId.trim() === '') {
      return {
        state,
        accepted: false,
        error: 'playerInId must be a non-empty string.',
      };
    }

    if (change.playerOutId === change.playerInId) {
      return {
        state,
        accepted: false,
        error: 'playerOutId and playerInId cannot be identical.',
      };
    }
  }

  // 5. Duplicate request and window ID protection
  if (state.processedRequestIds.includes(request.id)) {
    return {
      state,
      accepted: false,
      error: 'Substitution request already processed.',
    };
  }

  if (state.usedWindowIds.includes(request.windowId)) {
    return {
      state,
      accepted: false,
      error: 'Substitution window already processed.',
    };
  }

  // 6. Batch player duplication checks
  const outIds = request.changes.map(c => c.playerOutId);
  if (new Set(outIds).size !== outIds.length) {
    return {
      state,
      accepted: false,
      error: 'Duplicate playerOutId within same substitution request.',
    };
  }

  const inIds = request.changes.map(c => c.playerInId);
  if (new Set(inIds).size !== inIds.length) {
    return {
      state,
      accepted: false,
      error: 'Duplicate playerInId within same substitution request.',
    };
  }

  const conflictPlayerId = outIds.find(id => inIds.includes(id));
  if (conflictPlayerId) {
    return {
      state,
      accepted: false,
      error: `Player "${conflictPlayerId}" cannot be both substituted out and in within the same request.`,
    };
  }

  // 7. Outgoing and incoming player eligibility
  for (const change of request.changes) {
    if (!state.onPitchPlayerIds.includes(change.playerOutId)) {
      return {
        state,
        accepted: false,
        error: `Outgoing player "${change.playerOutId}" is not currently on the pitch.`,
      };
    }
  }

  // Check incoming player eligibility (reusing usedIncomingIds from invariant check)
  for (const change of request.changes) {
    if (!state.registeredBenchPlayerIds.includes(change.playerInId)) {
      return {
        state,
        accepted: false,
        error: `Incoming player "${change.playerInId}" is not on the registered bench.`,
      };
    }

    if (state.onPitchPlayerIds.includes(change.playerInId)) {
      return {
        state,
        accepted: false,
        error: `Incoming player "${change.playerInId}" is already on the pitch.`,
      };
    }

    if (usedIncomingIds.includes(change.playerInId)) {
      return {
        state,
        accepted: false,
        error: `Incoming player "${change.playerInId}" has already entered the match and cannot re-enter.`,
      };
    }
  }

  // 8. Substitution limits & phase capacity
  const subsUsed = getSubstitutionsUsed(state);
  const requestedSubsCount = request.changes.length;

  if (request.phase === 'EXTRA_TIME') {
    if (!ruleSet.format.extraTimeEnabled) {
      return {
        state,
        accepted: false,
        error: 'Extra time is not enabled for this competition rule set.',
      };
    }

    const maxTotalSubs =
      ruleSet.substitutions.maxSubsRegulation +
      ruleSet.substitutions.extraTimeExtraSub;

    if (subsUsed + requestedSubsCount > maxTotalSubs) {
      return {
        state,
        accepted: false,
        error: `Requested substitutions exceed maximum extra-time capacity (${maxTotalSubs}).`,
      };
    }
  } else if (request.phase === 'REGULATION') {
    const maxRegulationSubs = ruleSet.substitutions.maxSubsRegulation;
    if (subsUsed + requestedSubsCount > maxRegulationSubs) {
      return {
        state,
        accepted: false,
        error: `Requested substitutions exceed regulation capacity (${maxRegulationSubs}).`,
      };
    }
  } else {
    return {
      state,
      accepted: false,
      error: 'Invalid substitution phase.',
    };
  }

  // 9. Stoppage windows
  const windowsUsed = getSubstitutionWindowsUsed(state);
  let countedAsWindow: boolean;

  if (request.stoppageType === 'HALF_TIME') {
    countedAsWindow = ruleSet.substitutions.halfTimeCountsAsWindow;
  } else if (request.stoppageType === 'IN_PLAY') {
    countedAsWindow = true;
  } else {
    return {
      state,
      accepted: false,
      error: 'Invalid substitution stoppage type.',
    };
  }

  if (
    countedAsWindow &&
    windowsUsed + 1 > ruleSet.substitutions.maxStoppageWindows
  ) {
    return {
      state,
      accepted: false,
      error: `Requested substitution window exceeds maximum allowed stoppage windows (${ruleSet.substitutions.maxStoppageWindows}).`,
    };
  }

  // 10. Immutable state update
  const newOnPitch = state.onPitchPlayerIds
    .filter(id => !outIds.includes(id))
    .concat(inIds);

  const record: SubstitutionRecord = {
    requestId: request.id,
    windowId: request.windowId,
    phase: request.phase,
    stoppageType: request.stoppageType,
    changes: request.changes.map(c => ({
      playerOutId: c.playerOutId,
      playerInId: c.playerInId,
    })),
    countedAsWindow,
  };

  const newState: FixtureTeamSubstitutionState = {
    ...state,
    onPitchPlayerIds: newOnPitch,
    registeredBenchPlayerIds: [...state.registeredBenchPlayerIds],
    records: [...state.records, record],
    processedRequestIds: [...state.processedRequestIds, request.id],
    usedWindowIds: [...state.usedWindowIds, request.windowId],
  };

  return {
    state: newState,
    accepted: true,
    record,
  };
}
