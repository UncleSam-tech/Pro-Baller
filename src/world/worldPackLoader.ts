import worldPackAsset from '../../data/world/2026-27/world-2026-27.pack.json?url';
import type { FootballWorldDataPack } from './types';
import { validateFootballWorldDataPack } from './worldDataPack';

let cachedPackPromise: Promise<FootballWorldDataPack> | null = null;

/**
 * Loads and validates the canonical 2026-27 living-world data pack.
 *
 * In browser production/dev builds, Vite emits the pack as a separate static asset
 * and returns its URL. In Node/test runners, the import resolves directly or via fallback.
 * The result is cached in memory so it is only loaded once per session.
 */
export async function loadDefaultFootballWorldPack(): Promise<FootballWorldDataPack> {
  if (cachedPackPromise) {
    return cachedPackPromise;
  }

  cachedPackPromise = (async () => {
    let rawData: unknown;

    if (typeof worldPackAsset === 'string') {
      const response = await fetch(worldPackAsset);
      if (!response.ok) {
        throw new Error(
          `Failed to load football world pack asset (${worldPackAsset}): HTTP ${response.status} ${response.statusText}`
        );
      }
      rawData = await response.json();
    } else if (worldPackAsset && typeof worldPackAsset === 'object') {
      rawData = worldPackAsset;
    } else {
      throw new Error(`Unexpected world pack asset type: ${typeof worldPackAsset}`);
    }

    const pack = rawData as FootballWorldDataPack;
    const validation = validateFootballWorldDataPack(pack);
    if (!validation.valid) {
      throw new Error(
        `World pack validation failed with ${validation.errors.length} error(s): ${validation.errors.slice(0, 5).join('; ')}`
      );
    }

    return pack;
  })();

  return cachedPackPromise;
}

/**
 * Clears the in-memory cache for testing purposes.
 */
export function clearWorldPackCache(): void {
  cachedPackPromise = null;
}
