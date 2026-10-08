import type {
  CompetitionFixtureResult,
  CompetitionSeasonState,
  ScheduledCompetitionFixture,
} from '../competition/types';
import type {
  FootballWorldDataPack,
  FootballWorldRuntimeState,
  FootballWorldStaticContext,
  WorldExternalFixtureResolution,
  WorldFormation,
  WorldPlayerAvailabilityState,
  WorldTacticalIntent,
} from './types';
import { buildCompetitionFixtureDateMap } from './worldProgression';
import { isPlayerAvailableForFixture } from './playerAvailability';

export interface ExternalResolutionValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
}

const VALID_FORMATIONS: ReadonlySet<WorldFormation> = new Set([
  '4-3-3',
  '4-2-3-1',
  '4-4-2',
  '3-5-2',
  '5-3-2',
  '4-1-4-1',
]);

const VALID_TACTICAL_INTENTS: ReadonlySet<WorldTacticalIntent> = new Set([
  'DEFENSIVE',
  'BALANCED',
  'ATTACKING',
]);

/**
 * Strictly validates an array of external fixture resolutions for execution on calendarDate D.
 * Returns valid: false with descriptive errors if any invariant is violated.
 */
export function validateExternalFixtureResolutions(
  runtimeState: FootballWorldRuntimeState,
  calendarDate: string,
  context: FootballWorldStaticContext | FootballWorldDataPack,
  resolutions: readonly WorldExternalFixtureResolution[]
): ExternalResolutionValidationResult {
  const errors: string[] = [];

  if (!resolutions || resolutions.length === 0) {
    return { valid: true, errors: [] };
  }

  // Check for duplicate fixtureIds within the supplied resolutions
  const seenResolutionFixtureIds = new Set<string>();
  for (const res of resolutions) {
    if (seenResolutionFixtureIds.has(res.fixtureId)) {
      errors.push(`Duplicate external resolution supplied for fixture '${res.fixtureId}'.`);
    }
    seenResolutionFixtureIds.add(res.fixtureId);
  }

  // Pre-index squad assignments: clubId -> Set<playerId>
  const squadMap = new Map<string, Set<string>>();
  for (const s of runtimeState.squadAssignments ?? []) {
    squadMap.set(s.clubId, new Set(s.playerIds));
  }

  // Pre-index all known player IDs
  const allKnownPlayerIds = new Set<string>();
  if ('players' in context && Array.isArray(context.players)) {
    for (const p of context.players) {
      allKnownPlayerIds.add(p.id);
    }
  }
  for (const s of runtimeState.playerFootballStates ?? []) {
    allKnownPlayerIds.add(s.playerId);
  }

  // Pre-index player availability states: playerId -> WorldPlayerAvailabilityState
  const availMap = new Map<string, WorldPlayerAvailabilityState>();
  for (const av of runtimeState.playerAvailabilityStates ?? []) {
    availMap.set(av.playerId, av);
  }

  for (const ext of resolutions) {
    // 1. Locate fixture across competition season states
    let foundCompState: CompetitionSeasonState | undefined;
    let scheduledFixture: ScheduledCompetitionFixture | undefined;
    let fixtureScheduledDate: string | undefined;

    for (const comp of runtimeState.competitionSeasonStates) {
      const dMap = buildCompetitionFixtureDateMap(comp, runtimeState.currentDate);
      for (const round of comp.schedule.rounds) {
        const found = round.fixtures.find((f) => f.id === ext.fixtureId);
        if (found) {
          foundCompState = comp;
          scheduledFixture = found;
          fixtureScheduledDate = dMap.get(found.id);
          break;
        }
      }
      if (foundCompState) break;
    }

    if (!foundCompState || !scheduledFixture) {
      errors.push(`External resolution fixture '${ext.fixtureId}' does not exist in active competitions.`);
      continue;
    }

    // 2. Check if already resolved
    const alreadyResolved = foundCompState.results.some((r: CompetitionFixtureResult) => r.fixtureId === ext.fixtureId);
    if (alreadyResolved) {
      errors.push(`Fixture '${ext.fixtureId}' is already resolved in competition '${foundCompState.competitionId}'.`);
      continue;
    }

    // 3. Check scheduled date
    if (fixtureScheduledDate !== calendarDate) {
      errors.push(
        `Fixture '${ext.fixtureId}' is scheduled for '${fixtureScheduledDate}', not calendar date '${calendarDate}'.`
      );
      continue;
    }

    // 4. Validate CompetitionFixtureResult
    const r = ext.result;
    if (r.fixtureId !== ext.fixtureId) {
      errors.push(`Result fixtureId '${r.fixtureId}' does not match resolution fixtureId '${ext.fixtureId}'.`);
    }
    if (r.competitionId !== foundCompState.competitionId) {
      errors.push(`Result competitionId '${r.competitionId}' does not match scheduled competition '${foundCompState.competitionId}'.`);
    }
    if (r.seasonLabel !== foundCompState.seasonLabel) {
      errors.push(`Result seasonLabel '${r.seasonLabel}' does not match competition '${foundCompState.seasonLabel}'.`);
    }
    if (r.ruleSetId !== foundCompState.ruleSetId) {
      errors.push(`Result ruleSetId '${r.ruleSetId}' does not match competition '${foundCompState.ruleSetId}'.`);
    }
    if (r.round !== scheduledFixture.round) {
      errors.push(`Result round ${r.round} does not match scheduled round ${scheduledFixture.round}.`);
    }
    if (r.homeTeamId !== scheduledFixture.homeTeamId) {
      errors.push(`Result homeTeamId '${r.homeTeamId}' does not match scheduled home team '${scheduledFixture.homeTeamId}'.`);
    }
    if (r.awayTeamId !== scheduledFixture.awayTeamId) {
      errors.push(`Result awayTeamId '${r.awayTeamId}' does not match scheduled away team '${scheduledFixture.awayTeamId}'.`);
    }
    if (!Number.isInteger(r.homeGoals) || r.homeGoals < 0) {
      errors.push(`Result homeGoals must be a non-negative integer, got ${r.homeGoals}.`);
    }
    if (!Number.isInteger(r.awayGoals) || r.awayGoals < 0) {
      errors.push(`Result awayGoals must be a non-negative integer, got ${r.awayGoals}.`);
    }

    // 5. Validate Selections
    const part = ext.participation;
    if (part.fixtureId !== ext.fixtureId) {
      errors.push(`Participation fixtureId '${part.fixtureId}' does not match '${ext.fixtureId}'.`);
    }

    const validateTeamSelection = (
      teamSelection: typeof part.homeSelection,
      expectedTeamId: string,
      label: 'home' | 'away'
    ) => {
      if (teamSelection.teamId !== expectedTeamId) {
        errors.push(`Participation ${label} selection teamId '${teamSelection.teamId}' does not match '${expectedTeamId}'.`);
      }

      const squadSet = squadMap.get(expectedTeamId) ?? new Set();

      // Check duplicates and availability in starters
      const starterSet = new Set<string>();
      for (const pid of teamSelection.startingPlayerIds) {
        if (!allKnownPlayerIds.has(pid)) {
          errors.push(`${label} starting player '${pid}' does not exist in world player registry.`);
        }
        if (!squadSet.has(pid)) {
          errors.push(`${label} starting player '${pid}' does not belong to club '${expectedTeamId}'.`);
        }
        const avail = isPlayerAvailableForFixture(
          pid,
          calendarDate,
          foundCompState!.competitionId,
          availMap.get(pid)
        );
        if (!avail.available) {
          errors.push(`${label} starting player '${pid}' is not available for fixture '${ext.fixtureId}' (${avail.reason}).`);
        }
        if (starterSet.has(pid)) {
          errors.push(`Duplicate player '${pid}' in ${label} starting XI.`);
        }
        starterSet.add(pid);
      }

      // Check duplicates and availability in bench
      const benchSet = new Set<string>();
      for (const pid of teamSelection.benchPlayerIds) {
        if (!allKnownPlayerIds.has(pid)) {
          errors.push(`${label} bench player '${pid}' does not exist in world player registry.`);
        }
        if (!squadSet.has(pid)) {
          errors.push(`${label} bench player '${pid}' does not belong to club '${expectedTeamId}'.`);
        }
        const avail = isPlayerAvailableForFixture(
          pid,
          calendarDate,
          foundCompState!.competitionId,
          availMap.get(pid)
        );
        if (!avail.available) {
          errors.push(`${label} bench player '${pid}' is not available for fixture '${ext.fixtureId}' (${avail.reason}).`);
        }
        if (benchSet.has(pid)) {
          errors.push(`Duplicate player '${pid}' in ${label} bench.`);
        }
        if (starterSet.has(pid)) {
          errors.push(`Player '${pid}' appears in both ${label} starting XI and bench.`);
        }
        benchSet.add(pid);
      }

      // Starting lineup size check: <= 11 and obeys squad availability
      if (teamSelection.startingPlayerIds.length > 11) {
        errors.push(`${label} starting XI has ${teamSelection.startingPlayerIds.length} players (maximum 11).`);
      }
    };

    validateTeamSelection(part.homeSelection, scheduledFixture.homeTeamId, 'home');
    validateTeamSelection(part.awaySelection, scheduledFixture.awayTeamId, 'away');

    // Overlap across teams
    const allHomeSelected = new Set([
      ...part.homeSelection.startingPlayerIds,
      ...part.homeSelection.benchPlayerIds,
    ]);
    for (const pid of [...part.awaySelection.startingPlayerIds, ...part.awaySelection.benchPlayerIds]) {
      if (allHomeSelected.has(pid)) {
        errors.push(`Player '${pid}' is selected for both home ('${scheduledFixture.homeTeamId}') and away ('${scheduledFixture.awayTeamId}') teams.`);
      }
    }

    // 6. Validate Manager Plans
    if (!ext.managerPlans || ext.managerPlans.length !== 2) {
      errors.push(`External resolution must supply exactly 2 manager plans, got ${ext.managerPlans?.length ?? 0}.`);
    } else {
      const homePlan = ext.managerPlans.find((m) => m.teamId === scheduledFixture.homeTeamId);
      const awayPlan = ext.managerPlans.find((m) => m.teamId === scheduledFixture.awayTeamId);

      if (!homePlan) {
        errors.push(`Missing manager plan for home team '${scheduledFixture.homeTeamId}'.`);
      } else {
        if (homePlan.fixtureId !== ext.fixtureId) {
          errors.push(`Home manager plan fixtureId '${homePlan.fixtureId}' does not match '${ext.fixtureId}'.`);
        }
        if (!VALID_FORMATIONS.has(homePlan.formation)) {
          errors.push(`Invalid home manager formation '${homePlan.formation}'.`);
        }
        if (!VALID_TACTICAL_INTENTS.has(homePlan.tacticalIntent)) {
          errors.push(`Invalid home manager tactical intent '${homePlan.tacticalIntent}'.`);
        }
      }

      if (!awayPlan) {
        errors.push(`Missing manager plan for away team '${scheduledFixture.awayTeamId}'.`);
      } else {
        if (awayPlan.fixtureId !== ext.fixtureId) {
          errors.push(`Away manager plan fixtureId '${awayPlan.fixtureId}' does not match '${ext.fixtureId}'.`);
        }
        if (!VALID_FORMATIONS.has(awayPlan.formation)) {
          errors.push(`Invalid away manager formation '${awayPlan.formation}'.`);
        }
        if (!VALID_TACTICAL_INTENTS.has(awayPlan.tacticalIntent)) {
          errors.push(`Invalid away manager tactical intent '${awayPlan.tacticalIntent}'.`);
        }
      }
    }

    // 7. Validate Player Appearances
    const appearancesByPlayer = new Map<string, (typeof part.playerAppearances)[number]>();
    let homeTotalMinutes = 0;
    let awayTotalMinutes = 0;

    const homeStarters = new Set(part.homeSelection.startingPlayerIds);
    const homeBench = new Set(part.homeSelection.benchPlayerIds);
    const awayStarters = new Set(part.awaySelection.startingPlayerIds);
    const awayBench = new Set(part.awaySelection.benchPlayerIds);

    for (const app of part.playerAppearances ?? []) {
      if (appearancesByPlayer.has(app.playerId)) {
        errors.push(`Duplicate appearance record for player '${app.playerId}'.`);
      }
      appearancesByPlayer.set(app.playerId, app);

      if (!Number.isInteger(app.minutesPlayed) || app.minutesPlayed < 0 || app.minutesPlayed > 90) {
        errors.push(`Player '${app.playerId}' appearance minutes must be an integer between 0 and 90, got ${app.minutesPlayed}.`);
      }

      const isHomeTeam = app.teamId === scheduledFixture.homeTeamId;
      const isAwayTeam = app.teamId === scheduledFixture.awayTeamId;

      if (!isHomeTeam && !isAwayTeam) {
        errors.push(`Player '${app.playerId}' appearance teamId '${app.teamId}' does not match fixture teams.`);
      }

      if (isHomeTeam) {
        homeTotalMinutes += app.minutesPlayed;
        if (app.started) {
          if (!homeStarters.has(app.playerId)) {
            errors.push(`Player '${app.playerId}' marked as started for home team, but not in starting XI.`);
          }
        } else if (app.minutesPlayed > 0) {
          if (!homeBench.has(app.playerId)) {
            errors.push(`Substitute player '${app.playerId}' played ${app.minutesPlayed} minutes for home team, but not on bench.`);
          }
        }
      } else if (isAwayTeam) {
        awayTotalMinutes += app.minutesPlayed;
        if (app.started) {
          if (!awayStarters.has(app.playerId)) {
            errors.push(`Player '${app.playerId}' marked as started for away team, but not in starting XI.`);
          }
        } else if (app.minutesPlayed > 0) {
          if (!awayBench.has(app.playerId)) {
            errors.push(`Substitute player '${app.playerId}' played ${app.minutesPlayed} minutes for away team, but not on bench.`);
          }
        }
      }
    }

    // Team Minutes Coherence:
    // Expected total minutes = starters.length * 90 (e.g. 11 * 90 = 990)
    const expectedHomeMinutes = part.homeSelection.startingPlayerIds.length * 90;
    const expectedAwayMinutes = part.awaySelection.startingPlayerIds.length * 90;

    if (homeTotalMinutes !== expectedHomeMinutes) {
      errors.push(
        `Home team appearance minutes total ${homeTotalMinutes}, expected ${expectedHomeMinutes} (${part.homeSelection.startingPlayerIds.length} starters * 90 min).`
      );
    }
    if (awayTotalMinutes !== expectedAwayMinutes) {
      errors.push(
        `Away team appearance minutes total ${awayTotalMinutes}, expected ${expectedAwayMinutes} (${part.awaySelection.startingPlayerIds.length} starters * 90 min).`
      );
    }

    // Invariant: every starting XI player must appear exactly once with started === true and minutesPlayed > 0
    for (const pid of part.homeSelection.startingPlayerIds) {
      const app = appearancesByPlayer.get(pid);
      if (!app) {
        errors.push(`Home starting player '${pid}' is missing from player appearances.`);
      } else {
        if (app.teamId !== scheduledFixture.homeTeamId) {
          errors.push(`Home starting player '${pid}' appearance teamId '${app.teamId}' does not match home team '${scheduledFixture.homeTeamId}'.`);
        }
        if (app.started !== true) {
          errors.push(`Home starting player '${pid}' must have started === true in appearances.`);
        }
        if (app.minutesPlayed <= 0) {
          errors.push(`Home starting player '${pid}' must have minutesPlayed > 0 in appearances, got ${app.minutesPlayed}.`);
        }
      }
    }

    for (const pid of part.awaySelection.startingPlayerIds) {
      const app = appearancesByPlayer.get(pid);
      if (!app) {
        errors.push(`Away starting player '${pid}' is missing from player appearances.`);
      } else {
        if (app.teamId !== scheduledFixture.awayTeamId) {
          errors.push(`Away starting player '${pid}' appearance teamId '${app.teamId}' does not match away team '${scheduledFixture.awayTeamId}'.`);
        }
        if (app.started !== true) {
          errors.push(`Away starting player '${pid}' must have started === true in appearances.`);
        }
        if (app.minutesPlayed <= 0) {
          errors.push(`Away starting player '${pid}' must have minutesPlayed > 0 in appearances, got ${app.minutesPlayed}.`);
        }
      }
    }

    // 8. Validate Match Detail (Events & Ratings)
    const detail = ext.matchDetail;
    if (detail.fixtureId !== ext.fixtureId) {
      errors.push(`MatchDetail fixtureId '${detail.fixtureId}' does not match '${ext.fixtureId}'.`);
    }

    let homeGoalEventsCount = 0;
    let awayGoalEventsCount = 0;

    for (const ev of detail.events ?? []) {
      if (ev.type !== 'GOAL' && ev.type !== 'YELLOW_CARD') {
        errors.push(`Unsupported match event type '${(ev as any).type}'. Only 'GOAL' and 'YELLOW_CARD' are supported.`);
        continue;
      }

      if (!Number.isInteger(ev.minute) || ev.minute < 1 || ev.minute > 90) {
        errors.push(`Event minute must be an integer between 1 and 90, got ${ev.minute}.`);
      }

      const isHomeEvent = ev.teamId === scheduledFixture.homeTeamId;
      const isAwayEvent = ev.teamId === scheduledFixture.awayTeamId;

      if (!isHomeEvent && !isAwayEvent) {
        errors.push(`Event player '${ev.playerId}' teamId '${ev.teamId}' does not match fixture teams.`);
      }

      const app = appearancesByPlayer.get(ev.playerId);
      if (!app || app.minutesPlayed === 0) {
        errors.push(`Event player '${ev.playerId}' did not appear in the match.`);
      } else if (app.teamId !== ev.teamId) {
        errors.push(`Event player '${ev.playerId}' appeared for team '${app.teamId}' but event is for team '${ev.teamId}'.`);
      }

      if (ev.type === 'GOAL') {
        if (isHomeEvent) homeGoalEventsCount++;
        if (isAwayEvent) awayGoalEventsCount++;

        if (ev.assistPlayerId) {
          const assistApp = appearancesByPlayer.get(ev.assistPlayerId);
          if (!assistApp || assistApp.minutesPlayed === 0) {
            errors.push(`Assist player '${ev.assistPlayerId}' did not appear in the match.`);
          } else if (assistApp.teamId !== ev.teamId) {
            errors.push(`Assist player '${ev.assistPlayerId}' belongs to team '${assistApp.teamId}', not goal team '${ev.teamId}'.`);
          }
        }
      }
    }

    if (homeGoalEventsCount !== r.homeGoals) {
      errors.push(`Home goal event count (${homeGoalEventsCount}) does not match homeGoals score (${r.homeGoals}).`);
    }
    if (awayGoalEventsCount !== r.awayGoals) {
      errors.push(`Away goal event count (${awayGoalEventsCount}) does not match awayGoals score (${r.awayGoals}).`);
    }

    // Ratings validation
    const ratedPlayerIds = new Set<string>();
    for (const pr of detail.playerRatings ?? []) {
      if (ratedPlayerIds.has(pr.playerId)) {
        errors.push(`Duplicate match rating for player '${pr.playerId}'.`);
      }
      ratedPlayerIds.add(pr.playerId);

      const app = appearancesByPlayer.get(pr.playerId);
      if (!app || app.minutesPlayed === 0) {
        errors.push(`Rating provided for player '${pr.playerId}' who did not appear in the match.`);
      } else if (app.teamId !== pr.teamId) {
        errors.push(`Player '${pr.playerId}' rating teamId '${pr.teamId}' does not match appearance teamId '${app.teamId}'.`);
      }

      if (typeof pr.rating !== 'number' || Number.isNaN(pr.rating) || pr.rating < 1.0 || pr.rating > 10.0) {
        errors.push(`Player '${pr.playerId}' rating must be between 1.0 and 10.0, got ${pr.rating}.`);
      }
    }

    // Every player with minutesPlayed > 0 must receive a rating
    for (const [pId, app] of appearancesByPlayer.entries()) {
      if (app.minutesPlayed > 0 && !ratedPlayerIds.has(pId)) {
        errors.push(`Player '${pId}' played ${app.minutesPlayed} minutes but has no match rating.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
