import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface SignupCase {
  id: string;
  email: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validate external JSON at the boundary rather than trusting a TypeScript cast. */
export function parseSignupCases(value: unknown): SignupCase[] {
  if (!isRecord(value) || !Array.isArray(value.cases) || value.cases.length === 0) {
    throw new Error('Signup data must contain a non-empty "cases" array.');
  }

  const seenIds = new Set<string>();

  return value.cases.map((entry: unknown, index: number) => {
    if (!isRecord(entry)) {
      throw new Error(`Signup case ${index + 1} must be an object.`);
    }

    const { id, email } = entry;
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error(`Signup case ${index + 1} needs a non-empty id.`);
    }
    if (seenIds.has(id)) {
      throw new Error(`Duplicate signup case id: ${id}`);
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Signup case "${id}" needs a syntactically valid email address.`);
    }

    seenIds.add(id);
    return { id, email };
  });
}

export function loadSignupCases(profile: string): SignupCase[] {
  if (!/^[a-z][a-z0-9-]*$/.test(profile)) {
    throw new Error(`Invalid test data profile: ${profile}`);
  }

  const path = join(__dirname, '../../test-data/scenarios', profile, 'signup.json');
  let parsed: unknown;

  try {
    parsed = JSON.parse(readFileSync(path, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Could not read signup test data at ${path}`, { cause: error });
  }

  return parseSignupCases(parsed);
}
