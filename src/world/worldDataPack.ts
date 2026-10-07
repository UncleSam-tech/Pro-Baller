import type {
  FootballWorldDataPack,
  FootballWorldDataPackValidation,
} from './types';

// ============================================================================
// SHARED VALIDATION HELPERS
// ============================================================================

function validateUniqueIds<T extends { id: string }>(
  items: T[],
  collectionName: string,
  errors: string[]
): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id || item.id.trim() === '') {
      errors.push(`${collectionName} item contains a blank or empty id.`);
      continue;
    }
    if (ids.has(item.id)) {
      errors.push(`Duplicate ${collectionName} id: '${item.id}'.`);
    } else {
      ids.add(item.id);
    }
  }
  return ids;
}

// ============================================================================
// MAIN VALIDATOR
// ============================================================================

/**
 * Purely validates the structural shape and internal reference integrity of a FootballWorldDataPack.
 */
export function validateFootballWorldDataPack(
  pack: FootballWorldDataPack
): FootballWorldDataPackValidation {
  const errors: string[] = [];

  // 1. Pack Metadata Validation
  if (!pack.id || pack.id.trim() === '') {
    errors.push('Pack id must be non-blank.');
  }

  if (!Number.isInteger(pack.version) || pack.version <= 0) {
    errors.push('Pack version must be a positive integer.');
  }

  if (!pack.seasonLabel || pack.seasonLabel.trim() === '') {
    errors.push('Pack seasonLabel must be non-blank.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(pack.snapshotDate)) {
    errors.push('Pack snapshotDate must match YYYY-MM-DD format.');
  }

  // 2. Collection ID Uniqueness
  const countryIds = validateUniqueIds(pack.countries, 'country', errors);
  const competitionIds = validateUniqueIds(
    pack.competitionDefinitions,
    'competition definition',
    errors
  );
  validateUniqueIds(pack.competitionRuleSets, 'competition rule set', errors);
  validateUniqueIds(
    pack.competitionMovementRelationships,
    'competition movement relationship',
    errors
  );
  const clubIds = validateUniqueIds(pack.clubs, 'club', errors);
  const playerIds = validateUniqueIds(pack.players, 'player', errors);
  const managerIds = validateUniqueIds(pack.managers, 'manager', errors);

  const clubMap = new Map(pack.clubs.map(c => [c.id, c]));
  const compMap = new Map(pack.competitionDefinitions.map(c => [c.id, c]));

  // 3. Club Validation (Country & Coordinates)
  for (const club of pack.clubs) {
    if (!countryIds.has(club.countryId)) {
      errors.push(
        `Club '${club.id}' references unknown country '${club.countryId}'.`
      );
    }

    const hasLat = club.latitude !== undefined;
    const hasLon = club.longitude !== undefined;

    if (hasLat && !hasLon) {
      errors.push(`Club '${club.id}' has latitude without longitude.`);
    } else if (hasLon && !hasLat) {
      errors.push(`Club '${club.id}' has longitude without latitude.`);
    } else if (hasLat && hasLon) {
      const lat = club.latitude!;
      const lon = club.longitude!;

      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        errors.push(
          `Club '${club.id}' has invalid latitude ${lat}. Must be between -90 and 90.`
        );
      }
      if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
        errors.push(
          `Club '${club.id}' has invalid longitude ${lon}. Must be between -180 and 180.`
        );
      }
    }
  }

  // 4. Player Nationality Validation
  for (const player of pack.players) {
    if (!player.nationalityCountryIds || player.nationalityCountryIds.length === 0) {
      errors.push(`Player '${player.id}' has no nationalities defined.`);
      continue;
    }

    const seenNats = new Set<string>();
    for (const natId of player.nationalityCountryIds) {
      if (seenNats.has(natId)) {
        errors.push(`Duplicate nationality '${natId}' for player '${player.id}'.`);
      } else {
        seenNats.add(natId);
      }

      if (!countryIds.has(natId)) {
        errors.push(
          `Player '${player.id}' references unknown nationality country '${natId}'.`
        );
      }
    }
  }

  // 5. Manager Nationality Validation
  for (const manager of pack.managers) {
    if (!manager.nationalityCountryIds || manager.nationalityCountryIds.length === 0) {
      errors.push(`Manager '${manager.id}' has no nationalities defined.`);
      continue;
    }

    const seenNats = new Set<string>();
    for (const natId of manager.nationalityCountryIds) {
      if (seenNats.has(natId)) {
        errors.push(
          `Duplicate nationality '${natId}' for manager '${manager.id}'.`
        );
      } else {
        seenNats.add(natId);
      }

      if (!countryIds.has(natId)) {
        errors.push(
          `Manager '${manager.id}' references unknown nationality country '${natId}'.`
        );
      }
    }
  }

  // 6. Competition Definitions Country Reference
  for (const comp of pack.competitionDefinitions) {
    if (comp.countryId !== undefined && !countryIds.has(comp.countryId)) {
      errors.push(
        `Competition definition '${comp.id}' references unknown country '${comp.countryId}'.`
      );
    }
  }

  // 7. Competition Rule Sets Reference Integrity
  for (const rs of pack.competitionRuleSets) {
    if (!competitionIds.has(rs.competitionId)) {
      errors.push(
        `Competition rule set '${rs.id}' references unknown competition '${rs.competitionId}'.`
      );
    }
  }

  // 8. Movement Relationships Reference Integrity
  for (const rel of pack.competitionMovementRelationships) {
    if (!competitionIds.has(rel.sourceCompetitionId)) {
      errors.push(
        `Movement relationship '${rel.id}' references unknown source competition '${rel.sourceCompetitionId}'.`
      );
    }
    if (!competitionIds.has(rel.destinationCompetitionId)) {
      errors.push(
        `Movement relationship '${rel.id}' references unknown destination competition '${rel.destinationCompetitionId}'.`
      );
    }
    if (!countryIds.has(rel.countryId)) {
      errors.push(
        `Movement relationship '${rel.id}' references unknown country '${rel.countryId}'.`
      );
    }
  }

  // 9. Domestic League Memberships
  const seenMembershipSeeds = new Set<string>();
  const seenClubsInMemberships = new Set<string>();

  for (const seed of pack.domesticLeagueMemberships) {
    const seedKey = `${seed.countryId}:${seed.competitionId}`;
    if (seenMembershipSeeds.has(seedKey)) {
      errors.push(
        `Duplicate domestic league membership seed for country '${seed.countryId}' and competition '${seed.competitionId}'.`
      );
    } else {
      seenMembershipSeeds.add(seedKey);
    }

    if (!countryIds.has(seed.countryId)) {
      errors.push(
        `Domestic membership seed references unknown country '${seed.countryId}'.`
      );
    }

    const comp = compMap.get(seed.competitionId);
    if (!comp) {
      errors.push(
        `Domestic membership seed references unknown competition '${seed.competitionId}'.`
      );
    } else {
      if (comp.category !== 'DOMESTIC_LEAGUE') {
        errors.push(
          `Domestic membership seed references competition '${seed.competitionId}' with non-domestic category '${comp.category}'.`
        );
      }
      if (comp.countryId !== seed.countryId) {
        errors.push(
          `Domestic membership seed country '${seed.countryId}' does not match competition '${seed.competitionId}' country '${comp.countryId ?? 'undefined'}'.`
        );
      }
    }

    const seenClubsInSeed = new Set<string>();
    for (const clubId of seed.clubIds) {
      if (seenClubsInSeed.has(clubId)) {
        errors.push(
          `Duplicate club '${clubId}' in membership for competition '${seed.competitionId}'.`
        );
      } else {
        seenClubsInSeed.add(clubId);
      }

      if (seenClubsInMemberships.has(clubId)) {
        errors.push(
          `Club '${clubId}' is assigned to multiple domestic leagues.`
        );
      } else {
        seenClubsInMemberships.add(clubId);
      }

      const club = clubMap.get(clubId);
      if (!club) {
        errors.push(
          `Domestic membership for '${seed.competitionId}' references unknown club '${clubId}'.`
        );
      } else if (club.countryId !== seed.countryId) {
        errors.push(
          `Club '${clubId}' country '${club.countryId}' does not match membership country '${seed.countryId}'.`
        );
      }
    }
  }

  // 10. Squad Assignments
  const seenSquadClubs = new Set<string>();
  const seenPlayersAcrossSquads = new Set<string>();

  for (const squad of pack.squadAssignments) {
    if (!clubIds.has(squad.clubId)) {
      errors.push(
        `Squad assignment references unknown club '${squad.clubId}'.`
      );
    }

    if (seenSquadClubs.has(squad.clubId)) {
      errors.push(
        `Duplicate squad assignment seed for club '${squad.clubId}'.`
      );
    } else {
      seenSquadClubs.add(squad.clubId);
    }

    const seenPlayersInSquad = new Set<string>();
    for (const playerId of squad.playerIds) {
      if (!playerIds.has(playerId)) {
        errors.push(
          `Squad for club '${squad.clubId}' references unknown player '${playerId}'.`
        );
      }

      if (seenPlayersInSquad.has(playerId)) {
        errors.push(
          `Duplicate player '${playerId}' in squad for club '${squad.clubId}'.`
        );
      } else {
        seenPlayersInSquad.add(playerId);
      }

      if (seenPlayersAcrossSquads.has(playerId)) {
        errors.push(
          `Player '${playerId}' is assigned to multiple club squads.`
        );
      } else {
        seenPlayersAcrossSquads.add(playerId);
      }
    }
  }

  // 11. Manager Assignments
  const seenManagerClubs = new Set<string>();
  const seenAssignedManagers = new Set<string>();

  for (const assignment of pack.managerAssignments) {
    if (!clubIds.has(assignment.clubId)) {
      errors.push(
        `Manager assignment references unknown club '${assignment.clubId}'.`
      );
    }

    if (!managerIds.has(assignment.managerId)) {
      errors.push(
        `Manager assignment references unknown manager '${assignment.managerId}'.`
      );
    }

    if (seenManagerClubs.has(assignment.clubId)) {
      errors.push(
        `Multiple manager assignments detected for club '${assignment.clubId}'.`
      );
    } else {
      seenManagerClubs.add(assignment.clubId);
    }

    if (seenAssignedManagers.has(assignment.managerId)) {
      errors.push(
        `Manager '${assignment.managerId}' is assigned to multiple clubs.`
      );
    } else {
      seenAssignedManagers.add(assignment.managerId);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
