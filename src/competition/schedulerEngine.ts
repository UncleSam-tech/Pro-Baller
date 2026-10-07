import type {
  CompetitionDefinition,
  CompetitionRoundSchedule,
  CompetitionRuleSet,
  CompetitionSchedule,
  CompetitionScheduleGenerationResult,
  CompetitionScheduleValidation,
  ScheduledCompetitionFixture,
} from './types';

export type {
  CompetitionScheduleValidation,
  CompetitionScheduleGenerationResult,
};

const BYE_SENTINEL = '__BYE_SENTINEL__';

/**
 * Pure generator function that produces a complete, deterministic round-robin competition schedule.
 * Supports SINGLE_ROUND_ROBIN and DOUBLE_ROUND_ROBIN formats.
 */
export function generateCompetitionSchedule(
  definition: CompetitionDefinition,
  ruleSet: CompetitionRuleSet,
  participantTeamIds: string[]
): CompetitionScheduleGenerationResult {
  // 1. Identity validation
  if (definition.id !== ruleSet.competitionId) {
    return {
      accepted: false,
      error: `Definition ID "${definition.id}" does not match ruleSet competition ID "${ruleSet.competitionId}".`,
    };
  }

  if (!ruleSet.seasonLabel || ruleSet.seasonLabel.trim() === '') {
    return {
      accepted: false,
      error: 'Rule-set season label must be non-empty.',
    };
  }

  if (!ruleSet.id || ruleSet.id.trim() === '') {
    return {
      accepted: false,
      error: 'Rule-set ID must be non-empty.',
    };
  }

  // 2. Participant validation
  if (participantTeamIds.length < 2) {
    return {
      accepted: false,
      error: 'At least 2 participants are required for round-robin scheduling.',
    };
  }

  for (const id of participantTeamIds) {
    if (!id || id.trim() === '') {
      return {
        accepted: false,
        error: 'Participant team IDs cannot be blank.',
      };
    }
  }

  if (new Set(participantTeamIds).size !== participantTeamIds.length) {
    return {
      accepted: false,
      error: 'Duplicate participant team IDs found.',
    };
  }

  // 3. Expected club count validation
  if (
    ruleSet.format.expectedClubCount !== undefined &&
    participantTeamIds.length !== ruleSet.format.expectedClubCount
  ) {
    return {
      accepted: false,
      error: `Participant count (${participantTeamIds.length}) does not match expected club count (${ruleSet.format.expectedClubCount}).`,
    };
  }

  // 4. Supported format validation
  if (
    ruleSet.format.type !== 'SINGLE_ROUND_ROBIN' &&
    ruleSet.format.type !== 'DOUBLE_ROUND_ROBIN'
  ) {
    return {
      accepted: false,
      error: `Competition format ${ruleSet.format.type} is not supported by the round-robin scheduler.`,
    };
  }

  // 5. Derived round count
  const N = participantTeamIds.length;
  const roundsPerLeg = N % 2 === 0 ? N - 1 : N;
  const totalRounds =
    ruleSet.format.type === 'SINGLE_ROUND_ROBIN'
      ? roundsPerLeg
      : roundsPerLeg * 2;

  // 6. Configured rounds validation
  if (
    ruleSet.format.rounds !== undefined &&
    ruleSet.format.rounds !== totalRounds
  ) {
    return {
      accepted: false,
      error: `Configured format rounds (${ruleSet.format.rounds}) does not match derived total rounds (${totalRounds}).`,
    };
  }

  // 7. Circle-method rotation setup
  // Use caller's participant order
  const elements = [...participantTeamIds];
  if (N % 2 !== 0) {
    elements.push(BYE_SENTINEL);
  }

  const M = elements.length;
  const fixed = elements[0];
  let rotating = elements.slice(1);

  const firstLegRounds: CompetitionRoundSchedule[] = [];

  for (let r = 0; r < roundsPerLeg; r++) {
    const roundNum = r + 1;
    const current = [fixed, ...rotating];
    const fixtures: ScheduledCompetitionFixture[] = [];
    const byeTeamIds: string[] = [];

    for (let i = 0; i < M / 2; i++) {
      let teamA: string;
      let teamB: string;

      if (i === 0) {
        if (r % 2 === 0) {
          teamA = current[0];
          teamB = current[M - 1];
        } else {
          teamA = current[M - 1];
          teamB = current[0];
        }
      } else {
        if ((i + r) % 2 === 0) {
          teamA = current[i];
          teamB = current[M - 1 - i];
        } else {
          teamA = current[M - 1 - i];
          teamB = current[i];
        }
      }

      if (teamA === BYE_SENTINEL) {
        byeTeamIds.push(teamB);
      } else if (teamB === BYE_SENTINEL) {
        byeTeamIds.push(teamA);
      } else {
        fixtures.push({
          id: `${definition.id}:${ruleSet.seasonLabel}:r${roundNum}:${teamA}:${teamB}`,
          competitionId: definition.id,
          seasonLabel: ruleSet.seasonLabel,
          ruleSetId: ruleSet.id,
          round: roundNum,
          homeTeamId: teamA,
          awayTeamId: teamB,
          leg: 1,
        });
      }
    }

    firstLegRounds.push({
      round: roundNum,
      fixtures,
      byeTeamIds,
    });

    // Rotate rotating array: last element moves to the front
    rotating = [
      rotating[rotating.length - 1],
      ...rotating.slice(0, rotating.length - 1),
    ];
  }

  let allRounds = firstLegRounds;

  // 8. Second leg for DOUBLE_ROUND_ROBIN
  if (ruleSet.format.type === 'DOUBLE_ROUND_ROBIN') {
    const secondLegRounds: CompetitionRoundSchedule[] = firstLegRounds.map(
      firstRound => {
        const secondRoundNum = firstRound.round + roundsPerLeg;
        const secondFixtures: ScheduledCompetitionFixture[] =
          firstRound.fixtures.map(f => ({
            id: `${definition.id}:${ruleSet.seasonLabel}:r${secondRoundNum}:${f.awayTeamId}:${f.homeTeamId}`,
            competitionId: definition.id,
            seasonLabel: ruleSet.seasonLabel,
            ruleSetId: ruleSet.id,
            round: secondRoundNum,
            homeTeamId: f.awayTeamId,
            awayTeamId: f.homeTeamId,
            leg: 2,
          }));

        return {
          round: secondRoundNum,
          fixtures: secondFixtures,
          byeTeamIds: [...firstRound.byeTeamIds],
        };
      }
    );

    allRounds = [...firstLegRounds, ...secondLegRounds];
  }

  const schedule: CompetitionSchedule = {
    competitionId: definition.id,
    seasonLabel: ruleSet.seasonLabel,
    ruleSetId: ruleSet.id,
    formatType: ruleSet.format.type,
    participantTeamIds: [...participantTeamIds],
    rounds: allRounds,
  };

  return {
    accepted: true,
    schedule,
  };
}

/**
 * Returns all fixtures scheduled for a specific round.
 */
export function getFixturesForRound(
  schedule: CompetitionSchedule,
  round: number
): ScheduledCompetitionFixture[] {
  const roundSchedule = schedule.rounds.find(r => r.round === round);
  return roundSchedule ? [...roundSchedule.fixtures] : [];
}

/**
 * Returns all fixtures involving a specific team across the entire competition schedule.
 */
export function getFixturesForTeam(
  schedule: CompetitionSchedule,
  teamId: string
): ScheduledCompetitionFixture[] {
  const teamFixtures: ScheduledCompetitionFixture[] = [];
  for (const round of schedule.rounds) {
    for (const fixture of round.fixtures) {
      if (fixture.homeTeamId === teamId || fixture.awayTeamId === teamId) {
        teamFixtures.push(fixture);
      }
    }
  }
  return teamFixtures;
}

/**
 * Returns the total number of scheduled fixtures for a given team.
 */
export function getTeamFixtureCount(
  schedule: CompetitionSchedule,
  teamId: string
): number {
  return getFixturesForTeam(schedule, teamId).length;
}

/**
 * Returns the round numbers in which a specific team receives a bye.
 */
export function getTeamByeRounds(
  schedule: CompetitionSchedule,
  teamId: string
): number[] {
  return schedule.rounds
    .filter(r => r.byeTeamIds.includes(teamId))
    .map(r => r.round);
}

/**
 * Thoroughly validates a competition schedule for structural correctness,
 * integrity, pair frequencies, and home/away balance.
 */
export function validateCompetitionSchedule(
  schedule: CompetitionSchedule
): CompetitionScheduleValidation {
  const errors: string[] = [];
  const seenFixtureIds = new Set<string>();
  const participantSet = new Set(schedule.participantTeamIds);
  const N = schedule.participantTeamIds.length;

  const unorderedPairCounts = new Map<string, number>();
  const orderedPairCounts = new Map<string, number>();

  let totalFixtures = 0;

  for (const round of schedule.rounds) {
    const teamsInRound = new Set<string>();

    const roundByeSet = new Set<string>();
    for (const byeTeamId of round.byeTeamIds) {
      if (!participantSet.has(byeTeamId)) {
        errors.push(
          `Round ${round.round}: bye team "${byeTeamId}" is not in participantTeamIds.`
        );
      }
      if (roundByeSet.has(byeTeamId)) {
        errors.push(`Round ${round.round}: duplicate bye team "${byeTeamId}".`);
      }
      roundByeSet.add(byeTeamId);
    }

    for (const fixture of round.fixtures) {
      totalFixtures++;

      if (seenFixtureIds.has(fixture.id)) {
        errors.push(`Duplicate fixture ID "${fixture.id}".`);
      }
      seenFixtureIds.add(fixture.id);

      if (fixture.homeTeamId === fixture.awayTeamId) {
        errors.push(
          `Round ${round.round}: team "${fixture.homeTeamId}" cannot play against itself.`
        );
      }

      if (fixture.competitionId !== schedule.competitionId) {
        errors.push(
          `Fixture "${fixture.id}" competitionId "${fixture.competitionId}" does not match schedule "${schedule.competitionId}".`
        );
      }
      if (fixture.seasonLabel !== schedule.seasonLabel) {
        errors.push(
          `Fixture "${fixture.id}" seasonLabel "${fixture.seasonLabel}" does not match schedule "${schedule.seasonLabel}".`
        );
      }
      if (fixture.ruleSetId !== schedule.ruleSetId) {
        errors.push(
          `Fixture "${fixture.id}" ruleSetId "${fixture.ruleSetId}" does not match schedule "${schedule.ruleSetId}".`
        );
      }

      if (!participantSet.has(fixture.homeTeamId)) {
        errors.push(
          `Round ${round.round}: home team "${fixture.homeTeamId}" is not in participantTeamIds.`
        );
      }
      if (!participantSet.has(fixture.awayTeamId)) {
        errors.push(
          `Round ${round.round}: away team "${fixture.awayTeamId}" is not in participantTeamIds.`
        );
      }

      if (teamsInRound.has(fixture.homeTeamId)) {
        errors.push(
          `Round ${round.round}: team "${fixture.homeTeamId}" appears more than once in this round.`
        );
      }
      teamsInRound.add(fixture.homeTeamId);

      if (teamsInRound.has(fixture.awayTeamId)) {
        errors.push(
          `Round ${round.round}: team "${fixture.awayTeamId}" appears more than once in this round.`
        );
      }
      teamsInRound.add(fixture.awayTeamId);

      if (roundByeSet.has(fixture.homeTeamId)) {
        errors.push(
          `Round ${round.round}: team "${fixture.homeTeamId}" cannot both play and receive a bye in the same round.`
        );
      }
      if (roundByeSet.has(fixture.awayTeamId)) {
        errors.push(
          `Round ${round.round}: team "${fixture.awayTeamId}" cannot both play and receive a bye in the same round.`
        );
      }

      const unorderedKey =
        fixture.homeTeamId < fixture.awayTeamId
          ? `${fixture.homeTeamId}:${fixture.awayTeamId}`
          : `${fixture.awayTeamId}:${fixture.homeTeamId}`;
      unorderedPairCounts.set(
        unorderedKey,
        (unorderedPairCounts.get(unorderedKey) ?? 0) + 1
      );

      const orderedKey = `${fixture.homeTeamId}:${fixture.awayTeamId}`;
      orderedPairCounts.set(
        orderedKey,
        (orderedPairCounts.get(orderedKey) ?? 0) + 1
      );
    }
  }

  if (
    schedule.formatType === 'SINGLE_ROUND_ROBIN' ||
    schedule.formatType === 'DOUBLE_ROUND_ROBIN'
  ) {
    const expectedTotalFixtures =
      schedule.formatType === 'SINGLE_ROUND_ROBIN'
        ? (N * (N - 1)) / 2
        : N * (N - 1);

    if (totalFixtures !== expectedTotalFixtures) {
      errors.push(
        `Total fixture count (${totalFixtures}) does not match expected (${expectedTotalFixtures}).`
      );
    }

    const expectedPerTeam =
      schedule.formatType === 'SINGLE_ROUND_ROBIN' ? N - 1 : 2 * (N - 1);

    for (const teamId of schedule.participantTeamIds) {
      const count = getTeamFixtureCount(schedule, teamId);
      if (count !== expectedPerTeam) {
        errors.push(
          `Team "${teamId}" fixture count (${count}) does not match expected (${expectedPerTeam}).`
        );
      }
    }

    for (let i = 0; i < schedule.participantTeamIds.length; i++) {
      for (let j = i + 1; j < schedule.participantTeamIds.length; j++) {
        const t1 = schedule.participantTeamIds[i];
        const t2 = schedule.participantTeamIds[j];
        const unorderedKey = t1 < t2 ? `${t1}:${t2}` : `${t2}:${t1}`;
        const unorderedCount = unorderedPairCounts.get(unorderedKey) ?? 0;

        if (schedule.formatType === 'SINGLE_ROUND_ROBIN') {
          if (unorderedCount !== 1) {
            errors.push(
              `Pair (${t1}, ${t2}) appeared ${unorderedCount} times (expected 1).`
            );
          }
        } else if (schedule.formatType === 'DOUBLE_ROUND_ROBIN') {
          if (unorderedCount !== 2) {
            errors.push(
              `Pair (${t1}, ${t2}) appeared ${unorderedCount} times (expected 2).`
            );
          }
          const home1 = orderedPairCounts.get(`${t1}:${t2}`) ?? 0;
          const home2 = orderedPairCounts.get(`${t2}:${t1}`) ?? 0;
          if (home1 !== 1 || home2 !== 1) {
            errors.push(
              `Pair (${t1}, ${t2}) home/away imbalance: ${t1} home = ${home1}, ${t2} home = ${home2} (expected 1 each).`
            );
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
