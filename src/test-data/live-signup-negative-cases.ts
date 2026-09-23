import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface LiveSignupNegativeCase {
  id: string;
  target: 'email' | 'password';
}

export function loadLiveSignupNegativeCases(): LiveSignupNegativeCase[] {
  const path = resolve('test-data/scenarios/real-app/signup-negative.json');
  const value = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('Live signup negative cases must be a non-empty array.');
  }
  const ids = new Set<string>();
  return value.map(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error('Each live signup negative case must be an object.');
    }
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.id !== 'string' ||
      !/^[a-z][a-z0-9-]*$/.test(candidate.id) ||
      ids.has(candidate.id) ||
      (candidate.target !== 'email' && candidate.target !== 'password') ||
      Object.keys(candidate).some(key => key !== 'id' && key !== 'target')
    ) {
      throw new Error('Live signup negative case is malformed or duplicated.');
    }
    ids.add(candidate.id);
    return { id: candidate.id, target: candidate.target };
  });
}
