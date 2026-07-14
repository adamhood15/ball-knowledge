import { Redis } from "@upstash/redis";

const PLAYER_CROSSWALK_STALE_AFTER_HOURS = 24;
const LAST_REFRESHED_AT_REDIS_KEY = "sleeper:player-crosswalk:last-refreshed-at";

export interface PlayerCrosswalkClock {
  getLastRefreshedAt(): Promise<Date | null>;
  setLastRefreshedAt(at: Date): Promise<void>;
}

export function isPlayerCrosswalkStale(lastRefreshedAt: Date | null, now: Date): boolean {
  if (!lastRefreshedAt) return true;
  const hoursSinceLastRefresh = (now.getTime() - lastRefreshedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastRefresh >= PLAYER_CROSSWALK_STALE_AFTER_HOURS;
}

export function createUpstashPlayerCrosswalkClock(): PlayerCrosswalkClock {
  const redis = Redis.fromEnv();
  return {
    async getLastRefreshedAt() {
      const isoString = await redis.get<string>(LAST_REFRESHED_AT_REDIS_KEY);
      return isoString ? new Date(isoString) : null;
    },
    async setLastRefreshedAt(at: Date) {
      await redis.set(LAST_REFRESHED_AT_REDIS_KEY, at.toISOString());
    },
  };
}
