import type {
  CompetitionHierarchyRegistry,
  CompetitionHierarchyValidation,
  CompetitionMovementLookupResult,
  CompetitionMovementRelationship,
  CompetitionMovementType,
  CompetitionRuleRegistry,
} from './types';

// ============================================================================
// CANONICAL SEED HIERARCHY RELATIONSHIPS
// ============================================================================

export const CANONICAL_COMPETITION_HIERARCHY_REGISTRY: CompetitionHierarchyRegistry = {
  relationships: {
    'england-championship:promotion:england-premier-league': {
      id: 'england-championship:promotion:england-premier-league',
      countryId: 'england',
      sourceCompetitionId: 'england-championship',
      destinationCompetitionId: 'england-premier-league',
      movementType: 'PROMOTION',
    },
    'england-premier-league:relegation:england-championship': {
      id: 'england-premier-league:relegation:england-championship',
      countryId: 'england',
      sourceCompetitionId: 'england-premier-league',
      destinationCompetitionId: 'england-championship',
      movementType: 'RELEGATION',
    },
  },
};

// ============================================================================
// LOOKUP APIS
// ============================================================================

/**
 * Retrieves a movement relationship by source competition and movement type.
 * Returns error if none or multiple (ambiguous) exist.
 */
export function getCompetitionMovementRelationship(
  sourceCompetitionId: string,
  movementType: CompetitionMovementType,
  hierarchyRegistry: CompetitionHierarchyRegistry = CANONICAL_COMPETITION_HIERARCHY_REGISTRY
): CompetitionMovementLookupResult {
  const matches = Object.values(hierarchyRegistry.relationships).filter(
    rel =>
      rel.sourceCompetitionId === sourceCompetitionId &&
      rel.movementType === movementType
  );

  if (matches.length === 0) {
    return {
      accepted: false,
      error: 'No competition movement relationship is configured.',
    };
  }

  if (matches.length > 1) {
    return {
      accepted: false,
      error: 'Ambiguous competition movement relationship configuration.',
    };
  }

  return {
    accepted: true,
    relationship: matches[0],
  };
}

/**
 * Retrieves a competition movement relationship directly by its ID.
 * Returns undefined if unknown (no fallback).
 */
export function getCompetitionMovementRelationshipById(
  relationshipId: string,
  hierarchyRegistry: CompetitionHierarchyRegistry = CANONICAL_COMPETITION_HIERARCHY_REGISTRY
): CompetitionMovementRelationship | undefined {
  return hierarchyRegistry.relationships[relationshipId];
}

/**
 * Returns all explicit movement relationships outgoing from a source competition.
 * Returns a new array.
 */
export function getCompetitionMovementRelationshipsFrom(
  sourceCompetitionId: string,
  hierarchyRegistry: CompetitionHierarchyRegistry = CANONICAL_COMPETITION_HIERARCHY_REGISTRY
): CompetitionMovementRelationship[] {
  return Object.values(hierarchyRegistry.relationships).filter(
    rel => rel.sourceCompetitionId === sourceCompetitionId
  );
}

/**
 * Returns all explicit movement relationships incoming into a destination competition.
 * Returns a new array.
 */
export function getCompetitionMovementRelationshipsTo(
  destinationCompetitionId: string,
  hierarchyRegistry: CompetitionHierarchyRegistry = CANONICAL_COMPETITION_HIERARCHY_REGISTRY
): CompetitionMovementRelationship[] {
  return Object.values(hierarchyRegistry.relationships).filter(
    rel => rel.destinationCompetitionId === destinationCompetitionId
  );
}

/**
 * Returns all explicit movement relationships for a specific country.
 * Returns a new array. Does not infer relationships from level.
 */
export function getCountryCompetitionMovementRelationships(
  countryId: string,
  hierarchyRegistry: CompetitionHierarchyRegistry = CANONICAL_COMPETITION_HIERARCHY_REGISTRY
): CompetitionMovementRelationship[] {
  return Object.values(hierarchyRegistry.relationships).filter(
    rel => rel.countryId === countryId
  );
}

// ============================================================================
// HIERARCHY REGISTRY VALIDATION
// ============================================================================

/**
 * Purely validates a competition hierarchy registry against a competition rule registry.
 */
export function validateCompetitionHierarchyRegistry(
  hierarchyRegistry: CompetitionHierarchyRegistry,
  competitionRegistry: CompetitionRuleRegistry
): CompetitionHierarchyValidation {
  const errors: string[] = [];
  const seenSourceAndType = new Set<string>();

  const relationshipList = Object.entries(hierarchyRegistry.relationships);

  for (const [key, rel] of relationshipList) {
    // 1. Validate ID
    if (!rel.id || rel.id.trim() === '') {
      errors.push(`Relationship with key '${key}' has an empty or missing id.`);
      continue;
    }

    if (key !== rel.id) {
      errors.push(
        `Relationship key '${key}' does not match relationship id '${rel.id}'.`
      );
    }

    // 2. Duplicate logical relationship (sourceCompetitionId + movementType)
    const logicalKey = `${rel.sourceCompetitionId}:${rel.movementType}`;
    if (seenSourceAndType.has(logicalKey)) {
      errors.push(
        `Duplicate logical relationship detected for source '${rel.sourceCompetitionId}' and type '${rel.movementType}'.`
      );
    } else {
      seenSourceAndType.add(logicalKey);
    }

    // 3. Validate source competition
    const sourceDef = competitionRegistry.definitions[rel.sourceCompetitionId];
    if (!sourceDef) {
      errors.push(
        `Relationship '${rel.id}' references unknown source competition '${rel.sourceCompetitionId}'.`
      );
    }

    // 4. Validate destination competition
    const destDef =
      competitionRegistry.definitions[rel.destinationCompetitionId];
    if (!destDef) {
      errors.push(
        `Relationship '${rel.id}' references unknown destination competition '${rel.destinationCompetitionId}'.`
      );
    }

    // 5. No self relationship
    if (rel.sourceCompetitionId === rel.destinationCompetitionId) {
      errors.push(
        `Relationship '${rel.id}' cannot have identical source and destination competition '${rel.sourceCompetitionId}'.`
      );
    }

    // 6. Country consistency
    if (sourceDef && destDef) {
      if (
        !sourceDef.countryId ||
        !destDef.countryId ||
        sourceDef.countryId !== rel.countryId ||
        destDef.countryId !== rel.countryId
      ) {
        errors.push(
          `Country mismatch in relationship '${rel.id}': relationship country '${rel.countryId}', source country '${sourceDef.countryId ?? 'undefined'}', destination country '${destDef.countryId ?? 'undefined'}'.`
        );
      }

      // 7. Movement direction validation
      if (
        typeof sourceDef.level !== 'number' ||
        typeof destDef.level !== 'number'
      ) {
        errors.push(
          `Cannot validate movement direction for relationship '${rel.id}': numeric level missing on source or destination competition.`
        );
      } else {
        if (rel.movementType === 'PROMOTION' && !(destDef.level < sourceDef.level)) {
          errors.push(
            `Invalid PROMOTION direction in relationship '${rel.id}': destination level ${destDef.level} must be less than source level ${sourceDef.level}.`
          );
        } else if (
          rel.movementType === 'RELEGATION' &&
          !(destDef.level > sourceDef.level)
        ) {
          errors.push(
            `Invalid RELEGATION direction in relationship '${rel.id}': destination level ${destDef.level} must be greater than source level ${sourceDef.level}.`
          );
        }
      }
    }
  }

  // 8. Reverse-pair consistency
  for (const [, rel] of relationshipList) {
    const reverseRels = relationshipList.filter(
      ([, other]) =>
        other.sourceCompetitionId === rel.destinationCompetitionId &&
        other.destinationCompetitionId === rel.sourceCompetitionId
    );

    for (const [, reverseRel] of reverseRels) {
      if (
        rel.movementType === 'PROMOTION' &&
        reverseRel.movementType !== 'RELEGATION'
      ) {
        errors.push(
          `Contradictory reverse relationship pair between '${rel.sourceCompetitionId}' and '${rel.destinationCompetitionId}': PROMOTION requires reverse RELEGATION, but found '${reverseRel.movementType}'.`
        );
      } else if (
        rel.movementType === 'RELEGATION' &&
        reverseRel.movementType !== 'PROMOTION'
      ) {
        errors.push(
          `Contradictory reverse relationship pair between '${rel.sourceCompetitionId}' and '${rel.destinationCompetitionId}': RELEGATION requires reverse PROMOTION, but found '${reverseRel.movementType}'.`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
