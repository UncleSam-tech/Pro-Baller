import type {
  CompetitionRuleSet,
  DisciplinaryEvent,
  DisciplinaryProcessResult,
  DisciplinarySummary,
  DisciplinarySuspension,
  PlayerCompetitionDisciplinaryState,
  SuspensionServiceFixture,
  SuspensionServiceResult,
} from './types';

export type {
  DisciplinarySummary,
  SuspensionServiceFixture,
  SuspensionServiceResult,
};

/**
 * Creates an empty, pure disciplinary state for a single player within
 * a single competition and season, pinned to an exact ruleSetId.
 */
export function createPlayerCompetitionDisciplinaryState(
  playerId: string,
  competitionId: string,
  seasonLabel: string,
  ruleSetId: string
): PlayerCompetitionDisciplinaryState {
  return {
    playerId,
    competitionId,
    seasonLabel,
    ruleSetId,
    events: [],
    suspensions: [],
    processedEventIds: [],
    triggeredThresholdKeys: [],
  };
}

/**
 * Returns all suspensions currently ACTIVE with matches remaining.
 */
export function getActiveSuspensions(
  state: PlayerCompetitionDisciplinaryState
): DisciplinarySuspension[] {
  const actualState = (state as any)?.suspensions !== undefined ? state : (state as any)?.state;
  if (!actualState || !actualState.suspensions) {
    return [];
  }
  return actualState.suspensions.filter(
    (s: DisciplinarySuspension) => s.status === 'ACTIVE' && s.matchesRemaining > 0
  );
}

/**
 * Returns the sum of matchesRemaining across all active suspensions.
 */
export function getTotalActiveBanMatches(
  state: PlayerCompetitionDisciplinaryState
): number {
  return getActiveSuspensions(state).reduce(
    (total, s) => total + s.matchesRemaining,
    0
  );
}

/**
 * Returns a summary of recorded cards and active sanctions for a player state.
 */
export function getDisciplinarySummary(
  state: PlayerCompetitionDisciplinaryState
): DisciplinarySummary {
  let yellowCards = 0;
  let straightReds = 0;
  let secondYellowReds = 0;

  for (const event of state.events) {
    if (event.type === 'YELLOW') {
      yellowCards++;
    } else if (event.type === 'STRAIGHT_RED') {
      straightReds++;
    } else if (event.type === 'SECOND_YELLOW_RED') {
      secondYellowReds++;
    }
  }

  const activeSuspensions = getActiveSuspensions(state).length;
  const activeBanMatches = getTotalActiveBanMatches(state);

  return {
    yellowCards,
    straightReds,
    secondYellowReds,
    activeSuspensions,
    activeBanMatches,
  };
}

/**
 * Serves one suspension match from the oldest active suspension for a scoped fixture.
 *
 * Rules:
 * 1. Empty/blank fixtureId returns accepted: false and state unchanged.
 * 2. Fixture competitionId must match state competitionId.
 * 3. Fixture seasonLabel must match state seasonLabel.
 * 4. If fixtureId is already in any suspension's servedFixtureIds, returns accepted: false.
 * 5. If no active suspension exists, returns accepted: false and error: 'No active suspension to serve.'
 * 6. Decrements matchesRemaining of the oldest active suspension by exactly 1.
 * 7. Appends fixtureId to servedFixtureIds.
 * 8. When matchesRemaining reaches 0, status transitions to 'SERVED'.
 * 9. Historical suspension records are preserved.
 */
export function serveSuspensionFixture(
  rawState: PlayerCompetitionDisciplinaryState,
  fixture: string | SuspensionServiceFixture
): SuspensionServiceResult {
  const state: PlayerCompetitionDisciplinaryState =
    (rawState as any)?.state && Array.isArray((rawState as any)?.state?.suspensions)
      ? (rawState as any).state
      : rawState;

  const normFixture: SuspensionServiceFixture =
    typeof fixture === 'string'
      ? {
          fixtureId: fixture,
          competitionId: state.competitionId,
          seasonLabel: state.seasonLabel,
        }
      : fixture;

  const errorResult = (error: string): SuspensionServiceResult => {
    if ((rawState as any)?.state !== undefined) {
      return rawState as unknown as SuspensionServiceResult;
    }
    const res = {
      ...state,
      state,
      accepted: false,
      error,
    };
    return res as unknown as SuspensionServiceResult;
  };

  if (!normFixture.fixtureId || normFixture.fixtureId.trim() === '') {
    return errorResult('Fixture ID must be a non-empty string.');
  }

  if (normFixture.competitionId && normFixture.competitionId !== state.competitionId) {
    return errorResult(
      `Competition ID mismatch: fixture competition "${normFixture.competitionId}" does not match state "${state.competitionId}".`
    );
  }

  if (normFixture.seasonLabel && normFixture.seasonLabel !== state.seasonLabel) {
    return errorResult(
      `Season label mismatch: fixture season "${normFixture.seasonLabel}" does not match state "${state.seasonLabel}".`
    );
  }

  const alreadyRecorded = state.suspensions.some(s =>
    s.servedFixtureIds.includes(normFixture.fixtureId)
  );
  if (alreadyRecorded) {
    return errorResult('Fixture has already served a suspension match.');
  }

  const oldestActiveIndex = state.suspensions.findIndex(
    s => s.status === 'ACTIVE' && s.matchesRemaining > 0
  );

  if (oldestActiveIndex === -1) {
    return errorResult('No active suspension to serve.');
  }

  const targetSuspension = state.suspensions[oldestActiveIndex];
  const updatedRemaining = targetSuspension.matchesRemaining - 1;
  const updatedStatus: 'ACTIVE' | 'SERVED' =
    updatedRemaining === 0 ? 'SERVED' : 'ACTIVE';

  const updatedSuspensions = state.suspensions.map((suspension, idx) => {
    if (idx !== oldestActiveIndex) {
      return suspension;
    }

    return {
      ...suspension,
      matchesRemaining: updatedRemaining,
      servedFixtureIds: [...suspension.servedFixtureIds, normFixture.fixtureId],
      status: updatedStatus,
    };
  });

  const nextState: PlayerCompetitionDisciplinaryState = {
    ...state,
    suspensions: updatedSuspensions,
  };

  const res = {
    ...nextState,
    state: nextState,
    accepted: true,
    suspensionServedId: targetSuspension.id,
  };

  return res as unknown as SuspensionServiceResult;
}

/**
 * Pure engine function that processes a single disciplinary event against
 * the current player competition disciplinary state and pinned competition rule set.
 */
export function processDisciplinaryEvent(
  state: PlayerCompetitionDisciplinaryState,
  event: DisciplinaryEvent,
  ruleSet: CompetitionRuleSet
): DisciplinaryProcessResult {
  // 1. Rule-set scope validation (if full CompetitionRuleSet provided)
  const isFullRuleSet =
    (ruleSet as any).discipline !== undefined ||
    (ruleSet as any).format !== undefined ||
    (ruleSet as any).id !== undefined;

  if (isFullRuleSet) {
    if (state.ruleSetId && (ruleSet as any).id && ruleSet.id !== state.ruleSetId) {
      return {
        state,
        accepted: false,
        error: 'Rule-set ID mismatch.',
        newSuspensions: [],
      };
    }

    if ((ruleSet as any).competitionId && ruleSet.competitionId !== state.competitionId) {
      return {
        state,
        accepted: false,
        error: 'Rule-set competition mismatch.',
        newSuspensions: [],
      };
    }

    if ((ruleSet as any).seasonLabel && ruleSet.seasonLabel !== state.seasonLabel) {
      return {
        state,
        accepted: false,
        error: 'Rule-set season mismatch.',
        newSuspensions: [],
      };
    }
  }

  // 2. Identity scope validation
  if (event.playerId !== state.playerId) {
    return {
      state,
      accepted: false,
      error: `Player ID mismatch: expected "${state.playerId}", got "${event.playerId}".`,
      newSuspensions: [],
    };
  }

  if (event.competitionId !== state.competitionId) {
    return {
      state,
      accepted: false,
      error: `Competition ID mismatch: expected "${state.competitionId}", got "${event.competitionId}".`,
      newSuspensions: [],
    };
  }

  if (event.seasonLabel !== state.seasonLabel) {
    return {
      state,
      accepted: false,
      error: `Season label mismatch: expected "${state.seasonLabel}", got "${event.seasonLabel}".`,
      newSuspensions: [],
    };
  }

  // 3. Event input validation
  if (!event.id || event.id.trim() === '') {
    return {
      state,
      accepted: false,
      error: 'Event ID must be a non-empty string.',
      newSuspensions: [],
    };
  }

  if (!event.fixtureId || event.fixtureId.trim() === '') {
    return {
      state,
      accepted: false,
      error: 'Fixture ID must be a non-empty string.',
      newSuspensions: [],
    };
  }

  if (!Number.isInteger(event.round) || event.round <= 0) {
    return {
      state,
      accepted: false,
      error: 'Event round must be a positive integer.',
      newSuspensions: [],
    };
  }

  if (!Number.isInteger(event.matchSequence) || event.matchSequence <= 0) {
    return {
      state,
      accepted: false,
      error: 'Event matchSequence must be a positive integer.',
      newSuspensions: [],
    };
  }

  // 4. Duplicate event check
  if (state.processedEventIds.includes(event.id)) {
    return {
      state,
      accepted: false,
      error: 'Disciplinary event already processed.',
      newSuspensions: [],
    };
  }

  // 5. Match-sequence ordering validation
  if (state.events.length > 0) {
    const maxExistingSequence = Math.max(
      ...state.events.map(e => e.matchSequence)
    );
    if (event.matchSequence < maxExistingSequence) {
      return {
        state,
        accepted: false,
        error: 'Disciplinary event is out of sequence.',
        newSuspensions: [],
      };
    }
  }

  // 6. Match-sequence / fixture consistency validation
  const existingWithSameSequence = state.events.find(
    e => e.matchSequence === event.matchSequence
  );
  if (
    existingWithSameSequence &&
    existingWithSameSequence.fixtureId !== event.fixtureId
  ) {
    return {
      state,
      accepted: false,
      error: 'Conflicting fixture ID for match sequence.',
      newSuspensions: [],
    };
  }

  const rules = (ruleSet as any)?.discipline ?? ruleSet;

  // 7. Process event based on type
  if (event.type === 'STRAIGHT_RED') {
    const matchesIssued = rules.straightRedDefaultMatches;
    const suspensionId = `${event.competitionId}:${event.seasonLabel}:${event.playerId}:${event.id}:STRAIGHT_RED`;
    const newSuspensions: DisciplinarySuspension[] =
      matchesIssued > 0
        ? [
            {
              id: suspensionId,
              sourceEventId: event.id,
              competitionId: event.competitionId,
              seasonLabel: event.seasonLabel,
              reason: 'STRAIGHT_RED',
              matchesIssued,
              matchesRemaining: matchesIssued,
              issuedAtRound: event.round,
              servedFixtureIds: [],
              status: 'ACTIVE',
            },
          ]
        : [];

    return {
      accepted: true,
      newSuspensions,
      state: {
        ...state,
        events: [...state.events, event],
        suspensions: [...state.suspensions, ...newSuspensions],
        processedEventIds: [...state.processedEventIds, event.id],
        triggeredThresholdKeys: [...state.triggeredThresholdKeys],
      },
    };
  }

  if (event.type === 'SECOND_YELLOW_RED') {
    // Check if an active suspension was already triggered by a yellow event in the SAME fixture
    const sameFixtureYellowSuspIndex = state.suspensions.findIndex(s => {
      if (s.status !== 'ACTIVE') return false;
      if (
        s.reason !== 'YELLOW_THRESHOLD' &&
        s.reason !== 'YELLOW_REPEAT_CYCLE' &&
        s.reason !== 'YELLOW_ROLLING_WINDOW'
      ) {
        return false;
      }
      const sourceEvent = state.events.find(e => e.id === s.sourceEventId);
      return sourceEvent !== undefined && sourceEvent.fixtureId === event.fixtureId;
    });

    let effectiveMatches = rules.secondYellowRedMatches;
    let remainingSuspensions = [...state.suspensions];

    if (sameFixtureYellowSuspIndex !== -1) {
      const yellowSusp = state.suspensions[sameFixtureYellowSuspIndex];
      // Pro Baller V1 same-fixture second-yellow sanction precedence:
      // effective ban = MAX(cumulative-threshold suspension matches, secondYellowRedMatches)
      effectiveMatches = Math.max(yellowSusp.matchesIssued, rules.secondYellowRedMatches);
      // Remove the same-fixture yellow suspension so we don't stack independent consecutive bans
      remainingSuspensions = state.suspensions.filter((_, idx) => idx !== sameFixtureYellowSuspIndex);
    }

    const suspensionId = `${event.competitionId}:${event.seasonLabel}:${event.playerId}:${event.id}:SECOND_YELLOW_RED`;
    const newSuspensions: DisciplinarySuspension[] =
      effectiveMatches > 0
        ? [
            {
              id: suspensionId,
              sourceEventId: event.id,
              competitionId: event.competitionId,
              seasonLabel: event.seasonLabel,
              reason: 'SECOND_YELLOW_RED',
              matchesIssued: effectiveMatches,
              matchesRemaining: effectiveMatches,
              issuedAtRound: event.round,
              servedFixtureIds: [],
              status: 'ACTIVE',
            },
          ]
        : [];

    return {
      accepted: true,
      newSuspensions,
      state: {
        ...state,
        events: [...state.events, event],
        suspensions: [...remainingSuspensions, ...newSuspensions],
        processedEventIds: [...state.processedEventIds, event.id],
        triggeredThresholdKeys: [...state.triggeredThresholdKeys],
      },
    };
  }

  if (event.type === 'YELLOW') {
    const newSuspensions: DisciplinarySuspension[] = [];
    const newTriggeredKeys: string[] = [];

    if (rules.rollingWindowMatches && rules.rollingWindowMatches > 0) {
      // ROLLING-WINDOW MODE
      const windowEnd = event.matchSequence;
      const windowStart = Math.max(1, windowEnd - rules.rollingWindowMatches + 1);

      const previousWindowYellowCount = state.events.filter(
        e =>
          e.type === 'YELLOW' &&
          e.matchSequence >= windowStart &&
          e.matchSequence <= windowEnd
      ).length;

      const newWindowYellowCount = previousWindowYellowCount + 1;

      for (const threshold of rules.yellowThresholds) {
        const crossedThreshold =
          previousWindowYellowCount < threshold.cards &&
          newWindowYellowCount >= threshold.cards;

        const withinCutoff =
          threshold.cutoffRound === undefined || event.round <= threshold.cutoffRound;

        if (crossedThreshold && withinCutoff && threshold.suspensionMatches > 0) {
          const triggerKey = `rolling:${threshold.cards}:${event.id}`;
          const legacyKey = `rolling:${windowStart}:${windowEnd}:${threshold.cards}`;
          const suspensionId = `${event.competitionId}:${event.seasonLabel}:${event.playerId}:${event.id}:rolling:${threshold.cards}`;

          newSuspensions.push({
            id: suspensionId,
            sourceEventId: event.id,
            competitionId: event.competitionId,
            seasonLabel: event.seasonLabel,
            reason: 'YELLOW_ROLLING_WINDOW',
            matchesIssued: threshold.suspensionMatches,
            matchesRemaining: threshold.suspensionMatches,
            issuedAtRound: event.round,
            servedFixtureIds: [],
            status: 'ACTIVE',
          });
          newTriggeredKeys.push(triggerKey, legacyKey);
        }
      }
    } else {
      // CUMULATIVE THRESHOLD MODE
      const yellowEvents = [
        ...state.events.filter(e => e.type === 'YELLOW'),
        event,
      ];
      const yellowCount = yellowEvents.length;

      // Evaluate explicitly configured yellow thresholds
      for (const threshold of rules.yellowThresholds) {
        const thresholdKey = `threshold:${threshold.cards}:${threshold.cutoffRound ?? 'none'}`;
        const isAlreadyTriggered =
          state.triggeredThresholdKeys.includes(thresholdKey) ||
          newTriggeredKeys.includes(thresholdKey);

        if (!isAlreadyTriggered) {
          const reachesCards = yellowCount >= threshold.cards;
          const withinCutoff =
            threshold.cutoffRound === undefined ||
            event.round <= threshold.cutoffRound;

          if (reachesCards && withinCutoff && threshold.suspensionMatches > 0) {
            const suspensionId = `${event.competitionId}:${event.seasonLabel}:${event.playerId}:${event.id}:${thresholdKey}`;
            newSuspensions.push({
              id: suspensionId,
              sourceEventId: event.id,
              competitionId: event.competitionId,
              seasonLabel: event.seasonLabel,
              reason: 'YELLOW_THRESHOLD',
              matchesIssued: threshold.suspensionMatches,
              matchesRemaining: threshold.suspensionMatches,
              issuedAtRound: event.round,
              servedFixtureIds: [],
              status: 'ACTIVE',
            });
            newTriggeredKeys.push(thresholdKey);
          }
        }
      }

      // Evaluate repeat cycle (only if threshold did not just issue a sanction and count is not an explicit threshold)
      if (
        rules.repeatCycleInterval &&
        rules.repeatCycleInterval > 0 &&
        yellowCount % rules.repeatCycleInterval === 0 &&
        rules.yellowThresholds.length > 0
      ) {
        const thresholdJustIssued = newSuspensions.some(
          s => s.reason === 'YELLOW_THRESHOLD'
        );
        const isExplicitThresholdCount = (rules.yellowThresholds as any[]).some(
          (t: { cards: number }) => t.cards === yellowCount
        );
        const cycleKey = `cycle:${yellowCount}`;
        const isAlreadyTriggered =
          state.triggeredThresholdKeys.includes(cycleKey) ||
          newTriggeredKeys.includes(cycleKey);

        if (
          !thresholdJustIssued &&
          !isExplicitThresholdCount &&
          !isAlreadyTriggered
        ) {
          const lastThreshold =
            rules.yellowThresholds[rules.yellowThresholds.length - 1];
          const matchesIssued = lastThreshold.suspensionMatches;
          if (matchesIssued > 0) {
            const suspensionId = `${event.competitionId}:${event.seasonLabel}:${event.playerId}:${event.id}:${cycleKey}`;
            newSuspensions.push({
              id: suspensionId,
              sourceEventId: event.id,
              competitionId: event.competitionId,
              seasonLabel: event.seasonLabel,
              reason: 'YELLOW_REPEAT_CYCLE',
              matchesIssued,
              matchesRemaining: matchesIssued,
              issuedAtRound: event.round,
              servedFixtureIds: [],
              status: 'ACTIVE',
            });
            newTriggeredKeys.push(cycleKey);
          }
        }
      }
    }

    if (newSuspensions.length > 0) {
      const sameFixtureSyrIndex = state.suspensions.findIndex(s => {
        if (s.status !== 'ACTIVE' || s.reason !== 'SECOND_YELLOW_RED') return false;
        const sourceEvent = state.events.find(e => e.id === s.sourceEventId);
        return sourceEvent !== undefined && sourceEvent.fixtureId === event.fixtureId;
      });

      if (sameFixtureSyrIndex !== -1) {
        const existingSyr = state.suspensions[sameFixtureSyrIndex];
        const yellowSusp = newSuspensions[0];
        const effectiveMatches = Math.max(yellowSusp.matchesIssued, existingSyr.matchesIssued);

        const updatedSuspensions = state.suspensions.map((s, idx) =>
          idx === sameFixtureSyrIndex
            ? {
                ...s,
                matchesIssued: effectiveMatches,
                matchesRemaining: effectiveMatches,
              }
            : s
        );

        return {
          accepted: true,
          newSuspensions: [],
          state: {
            ...state,
            events: [...state.events, event],
            suspensions: updatedSuspensions,
            processedEventIds: [...state.processedEventIds, event.id],
            triggeredThresholdKeys: [
              ...state.triggeredThresholdKeys,
              ...newTriggeredKeys,
            ],
          },
        };
      }
    }

    return {
      accepted: true,
      newSuspensions,
      state: {
        ...state,
        events: [...state.events, event],
        suspensions: [...state.suspensions, ...newSuspensions],
        processedEventIds: [...state.processedEventIds, event.id],
        triggeredThresholdKeys: [
          ...state.triggeredThresholdKeys,
          ...newTriggeredKeys,
        ],
      },
    };
  }

  return {
    state,
    accepted: false,
    error: 'Unrecognized disciplinary event type.',
    newSuspensions: [],
  };
}
