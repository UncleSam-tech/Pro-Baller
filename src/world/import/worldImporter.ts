import { generateCompetitionSchedule } from '../../competition/schedulerEngine';
import type {
  CompetitionDefinition,
  CompetitionFixtureResult,
  CompetitionRoundSchedule,
  CompetitionSchedule,
  ScheduledCompetitionFixture,
} from '../../competition/types';
import type {
  FootballWorldDataPack,
  WorldClubDefinition,
  WorldClubManagerSeed,
  WorldClubSquadSeed,
  WorldCompetitionSeasonSeed,
  WorldCountryDefinition,
  WorldDomesticLeagueMembershipSeed,
  WorldFixtureDateSeed,
  WorldManagerDefinition,
  WorldPlayerDefinition,
} from '../types';
import { validateFootballWorldDataPack } from '../worldDataPack';
import type {
  FootballWorldImportResult,
  RawFootballWorldSnapshot,
  RawSeasonScheduleMode,
  RawWorldFixture,
} from './types';

// ============================================================================
// MAIN IMPORTER FUNCTION
// ============================================================================

/**
 * Purely imports and normalizes a raw football world snapshot into a validated FootballWorldDataPack.
 */
export function importFootballWorldSnapshot(
  raw: RawFootballWorldSnapshot
): FootballWorldImportResult {
  // 1. Normalize Countries
  const countries: WorldCountryDefinition[] = raw.countries.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    confederationId: c.confederationId,
  }));

  // 2. Normalize Competition Definitions
  const competitionDefinitions: CompetitionDefinition[] = raw.competitions.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    countryId: c.countryId,
    confederationId: c.confederationId,
    category: c.category,
    level: c.level,
  }));

  // 3. Normalize Clubs (omitting source competitionId)
  const clubs: WorldClubDefinition[] = raw.clubs.map(c => ({
    id: c.id,
    name: c.name,
    shortName: c.shortName,
    countryId: c.countryId,
    city: c.city,
    latitude: c.latitude,
    longitude: c.longitude,
  }));

  // 4. Normalize Players (omitting source clubId)
  const players: WorldPlayerDefinition[] = raw.players.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    ...(p.dateOfBirth !== undefined ? { dateOfBirth: p.dateOfBirth } : {}),
    nationalityCountryIds: [...p.nationalityCountryIds],
    primaryPosition: p.primaryPosition,
  }));

  // 5. Normalize Managers (omitting source clubId)
  const managers: WorldManagerDefinition[] = raw.managers.map(m => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    nationalityCountryIds: [...m.nationalityCountryIds],
  }));

  // 6. Generate Domestic League Memberships from club.competitionId
  const compLookup = new Map(raw.competitions.map(c => [c.id, c]));
  const domesticLeagueMemberships: WorldDomesticLeagueMembershipSeed[] = [];
  const membershipMap = new Map<string, WorldDomesticLeagueMembershipSeed>();

  for (const club of raw.clubs) {
    if (!club.competitionId) continue;
    const comp = compLookup.get(club.competitionId);
    if (!comp || comp.category !== 'DOMESTIC_LEAGUE') continue;

    const key = `${club.countryId}:${club.competitionId}`;
    let seed = membershipMap.get(key);
    if (!seed) {
      seed = {
        countryId: club.countryId,
        competitionId: club.competitionId,
        clubIds: [],
      };
      membershipMap.set(key, seed);
      domesticLeagueMemberships.push(seed);
    }
    seed.clubIds.push(club.id);
  }

  // 7. Generate Squad Assignments from player.clubId
  const squadAssignments: WorldClubSquadSeed[] = [];
  const squadMap = new Map<string, WorldClubSquadSeed>();

  for (const player of raw.players) {
    if (!player.clubId) continue;
    let squad = squadMap.get(player.clubId);
    if (!squad) {
      squad = {
        clubId: player.clubId,
        playerIds: [],
      };
      squadMap.set(player.clubId, squad);
      squadAssignments.push(squad);
    }
    squad.playerIds.push(player.id);
  }

  // 8. Generate Manager Assignments from manager.clubId
  const managerAssignments: WorldClubManagerSeed[] = [];
  for (const manager of raw.managers) {
    if (manager.clubId) {
      managerAssignments.push({
        clubId: manager.clubId,
        managerId: manager.id,
      });
    }
  }

  // 9. Group Fixtures by Competition
  const fixturesByComp = new Map<string, RawWorldFixture[]>();
  for (const fixture of raw.fixtures) {
    let list = fixturesByComp.get(fixture.competitionId);
    if (!list) {
      list = [];
      fixturesByComp.set(fixture.competitionId, list);
    }
    list.push(fixture);
  }

  // 10. Construct Competition Season Seeds
  const competitionSeasons: WorldCompetitionSeasonSeed[] = [];
  const seasonCompIds = new Set<string>();
  for (const compId of fixturesByComp.keys()) {
    seasonCompIds.add(compId);
  }
  for (const comp of raw.competitions) {
    if (comp.scheduleMode === 'GENERATE_FROM_MEMBERSHIP') {
      seasonCompIds.add(comp.id);
    }
  }

  for (const compId of seasonCompIds) {
    // Resolve matching rule set
    const compRuleSets = raw.ruleSets.filter(rs => rs.competitionId === compId);
    if (compRuleSets.length === 0) {
      return {
        accepted: false,
        error: `No matching rule set found for competition '${compId}'.`,
      };
    }
    const matchingRuleSets = compRuleSets.filter(
      rs => rs.seasonLabel === raw.seasonLabel
    );
    const candidateRuleSets =
      matchingRuleSets.length > 0 ? matchingRuleSets : compRuleSets;

    const selectedRuleSet = candidateRuleSets.reduce((prev, curr) =>
      curr.ruleVersion > prev.ruleVersion ? curr : prev
    );

    // Format validation
    if (
      selectedRuleSet.format.type !== 'SINGLE_ROUND_ROBIN' &&
      selectedRuleSet.format.type !== 'DOUBLE_ROUND_ROBIN' &&
      selectedRuleSet.format.type !== 'CONFERENCE'
    ) {
      return {
        accepted: false,
        error: `Unsupported competition format '${selectedRuleSet.format.type}' for competition '${compId}'.`,
      };
    }

    // Determine participant team IDs from domestic membership
    const membership = domesticLeagueMemberships.find(m => m.competitionId === compId);
    const participantTeamIds = membership ? [...membership.clubIds] : [];
    const compFixtures = fixturesByComp.get(compId) ?? [];
    const rawComp = compLookup.get(compId);
    const scheduleMode: RawSeasonScheduleMode = rawComp?.scheduleMode ?? 'SOURCE_COMPLETE';

    if (scheduleMode === 'SOURCE_COMPLETE') {
      // Group fixtures by integer round
      const fixturesByRound = new Map<number, RawWorldFixture[]>();
      for (const fix of compFixtures) {
        let rList = fixturesByRound.get(fix.round);
        if (!rList) {
          rList = [];
          fixturesByRound.set(fix.round, rList);
        }
        rList.push(fix);
      }

      const sortedRounds = Array.from(fixturesByRound.keys()).sort((a, b) => a - b);
      const pairOccurrence = new Map<string, number>();
      const roundSchedules: CompetitionRoundSchedule[] = [];
      const results: CompetitionFixtureResult[] = [];
      const fixtureDates: WorldFixtureDateSeed[] = [];

      for (const roundNum of sortedRounds) {
        const roundRawFixtures = fixturesByRound.get(roundNum)!;
        const scheduledRoundFixtures: ScheduledCompetitionFixture[] = [];
        const teamsInRound = new Set<string>();

        for (const fix of roundRawFixtures) {
          // Score validation
          const hasHomeGoals = fix.homeGoals !== undefined;
          const hasAwayGoals = fix.awayGoals !== undefined;

          if (hasHomeGoals !== hasAwayGoals) {
            return {
              accepted: false,
              error: `Fixture '${fix.id}' has incomplete score: homeGoals and awayGoals must both be present or both absent.`,
            };
          }

          if (hasHomeGoals && hasAwayGoals) {
            results.push({
              fixtureId: fix.id,
              competitionId: compId,
              seasonLabel: selectedRuleSet.seasonLabel,
              ruleSetId: selectedRuleSet.id,
              round: fix.round,
              homeTeamId: fix.homeClubId,
              awayTeamId: fix.awayClubId,
              homeGoals: fix.homeGoals!,
              awayGoals: fix.awayGoals!,
            });
          }

          fixtureDates.push({
            fixtureId: fix.id,
            scheduledDate: fix.scheduledDate,
          });

          // Track pair occurrence for leg derivation
          const pairKey = [fix.homeClubId, fix.awayClubId].sort().join(':');
          const count = (pairOccurrence.get(pairKey) ?? 0) + 1;
          pairOccurrence.set(pairKey, count);

          const leg: 1 | 2 =
            selectedRuleSet.format.type === 'DOUBLE_ROUND_ROBIN'
              ? count === 1
                ? 1
                : 2
              : 1;

          scheduledRoundFixtures.push({
            id: fix.id,
            competitionId: compId,
            seasonLabel: selectedRuleSet.seasonLabel,
            ruleSetId: selectedRuleSet.id,
            round: fix.round,
            homeTeamId: fix.homeClubId,
            awayTeamId: fix.awayClubId,
            leg,
          });

          teamsInRound.add(fix.homeClubId);
          teamsInRound.add(fix.awayClubId);
        }

        const byeTeamIds = participantTeamIds.filter(t => !teamsInRound.has(t));

        roundSchedules.push({
          round: roundNum,
          fixtures: scheduledRoundFixtures,
          byeTeamIds,
        });
      }

      const schedule: CompetitionSchedule = {
        competitionId: compId,
        seasonLabel: selectedRuleSet.seasonLabel,
        ruleSetId: selectedRuleSet.id,
        formatType: selectedRuleSet.format.type,
        participantTeamIds,
        rounds: roundSchedules,
      };

      competitionSeasons.push({
        competitionId: compId,
        ruleSetId: selectedRuleSet.id,
        schedule,
        results,
        fixtureDates,
      });
    } else {
      // GENERATE_FROM_MEMBERSHIP
      const compDef = competitionDefinitions.find(c => c.id === compId);
      if (!compDef) {
        return {
          accepted: false,
          error: `Competition definition not found for '${compId}'.`,
        };
      }

      const schedResult = generateCompetitionSchedule(
        compDef,
        selectedRuleSet,
        participantTeamIds
      );

      if (!schedResult.accepted || !schedResult.schedule) {
        return {
          accepted: false,
          error: `Failed to generate competition schedule for '${compId}': ${schedResult.error ?? 'Unknown error'}`,
        };
      }

      const schedule = schedResult.schedule;

      const canonicalByDirectedPair = new Map<string, ScheduledCompetitionFixture>();
      for (const round of schedule.rounds) {
        for (const f of round.fixtures) {
          canonicalByDirectedPair.set(`${f.homeTeamId}:${f.awayTeamId}`, f);
        }
      }

      const membershipSet = new Set(participantTeamIds);
      const mappedCanonicalFixtureIds = new Set<string>();
      const results: CompetitionFixtureResult[] = [];
      const fixtureDates: WorldFixtureDateSeed[] = [];

      for (const fix of compFixtures) {
        const hasHomeGoals = fix.homeGoals !== undefined;
        const hasAwayGoals = fix.awayGoals !== undefined;

        if (hasHomeGoals !== hasAwayGoals) {
          return {
            accepted: false,
            error: `Fixture '${fix.id}' has incomplete score: homeGoals and awayGoals must both be present or both absent.`,
          };
        }

        // If neither goal value is present, omit from historical completed matches
        if (!hasHomeGoals && !hasAwayGoals) {
          continue;
        }

        if (!membershipSet.has(fix.homeClubId)) {
          return {
            accepted: false,
            error: `Historical fixture '${fix.id}' references unknown home club '${fix.homeClubId}' outside competition membership.`,
          };
        }
        if (!membershipSet.has(fix.awayClubId)) {
          return {
            accepted: false,
            error: `Historical fixture '${fix.id}' references unknown away club '${fix.awayClubId}' outside competition membership.`,
          };
        }

        const directedKey = `${fix.homeClubId}:${fix.awayClubId}`;
        const canonicalFixture = canonicalByDirectedPair.get(directedKey);
        if (!canonicalFixture) {
          return {
            accepted: false,
            error: `No matching canonical directed fixture found for historical match '${fix.id}' (${fix.homeClubId} vs ${fix.awayClubId}).`,
          };
        }

        if (mappedCanonicalFixtureIds.has(canonicalFixture.id)) {
          return {
            accepted: false,
            error: `Duplicate historical match result attempting to map to canonical fixture '${canonicalFixture.id}'.`,
          };
        }
        mappedCanonicalFixtureIds.add(canonicalFixture.id);

        if (
          fix.scheduledDate !== undefined &&
          !/^\d{4}-\d{2}-\d{2}$/.test(fix.scheduledDate)
        ) {
          return {
            accepted: false,
            error: `Historical fixture '${fix.id}' has malformed scheduledDate '${fix.scheduledDate}'. Expected YYYY-MM-DD.`,
          };
        }

        results.push({
          fixtureId: canonicalFixture.id,
          competitionId: canonicalFixture.competitionId,
          seasonLabel: selectedRuleSet.seasonLabel,
          ruleSetId: selectedRuleSet.id,
          round: canonicalFixture.round,
          homeTeamId: canonicalFixture.homeTeamId,
          awayTeamId: canonicalFixture.awayTeamId,
          homeGoals: fix.homeGoals!,
          awayGoals: fix.awayGoals!,
        });

        if (fix.scheduledDate !== undefined) {
          fixtureDates.push({
            fixtureId: canonicalFixture.id,
            scheduledDate: fix.scheduledDate,
          });
        }
      }

      competitionSeasons.push({
        competitionId: compId,
        ruleSetId: selectedRuleSet.id,
        schedule,
        results,
        fixtureDates,
      });
    }
  }

  // 11. Assemble Normalized FootballWorldDataPack
  const pack: FootballWorldDataPack = {
    id: raw.id,
    version: raw.version,
    seasonLabel: raw.seasonLabel,
    snapshotDate: raw.snapshotDate,
    countries,
    competitionDefinitions,
    competitionRuleSets: raw.ruleSets.map(r => ({ ...r })),
    competitionMovementRelationships: raw.movementRelationships.map(m => ({ ...m })),
    clubs,
    players,
    managers,
    domesticLeagueMemberships,
    squadAssignments,
    managerAssignments,
    competitionSeasons,
  };

  // 12. Heavy Validation via Canonical Pack Validator
  const validation = validateFootballWorldDataPack(pack);
  if (!validation.valid) {
    return {
      accepted: false,
      error: `Imported world data pack validation failed: ${validation.errors.join('; ')}`,
    };
  }

  return {
    accepted: true,
    pack,
  };
}
