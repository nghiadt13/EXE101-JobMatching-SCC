import { Injectable } from '@nestjs/common';
import type { HomepageResponse } from './homepage.types';

type CacheEntry = {
  value: HomepageResponse;
  expiresAt: number;
};

@Injectable()
export class HomepageCacheService {
  private readonly cache = new Map<string, CacheEntry>();

  get(key: string): HomepageResponse | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(key);
      return null;
    }

    return JSON.parse(JSON.stringify(entry.value)) as HomepageResponse;
  }

  set(key: string, value: HomepageResponse, ttlMs: number): void {
    this.cache.set(key, {
      value: JSON.parse(JSON.stringify(value)) as HomepageResponse,
      expiresAt: Date.now() + Math.max(1000, ttlMs),
    });
  }

  clearAll(): void {
    this.cache.clear();
  }

  clearByUser(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`:u:${userId}`)) {
        this.cache.delete(key);
      }
    }
  }
}
