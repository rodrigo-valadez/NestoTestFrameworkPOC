import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const impacts = ['minor', 'moderate', 'serious', 'critical'] as const;
export type AxeImpact = (typeof impacts)[number];

export interface ObservedAxeFinding {
  ruleId: string;
  impact: AxeImpact | 'unknown';
  target: string;
}

export interface RecordedAxeFinding {
  project: string;
  ruleId: string;
  target: string;
  impact: AxeImpact;
  disposition: 'pre-existing' | 'exception';
  reason: string;
  owner: string;
  reviewBy: string;
  issue?: string;
}

export interface AxeBaseline {
  schemaVersion: 1;
  standard: 'WCAG 2.1 AA';
  failingImpacts: AxeImpact[];
  approvedBaselineDate: string;
  findings: RecordedAxeFinding[];
}

export interface AxeGateResult {
  blocking: ObservedAxeFinding[];
  accepted: ObservedAxeFinding[];
  reportedOnly: ObservedAxeFinding[];
  resolvedRecords: RecordedAxeFinding[];
}

const baselinePath = resolve(process.cwd(), 'test-data/accessibility/signup-axe-baseline.json');

function isImpact(value: unknown): value is AxeImpact {
  return typeof value === 'string' && impacts.includes(value as AxeImpact);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;
}

export function parseAxeBaseline(value: unknown): AxeBaseline {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Accessibility baseline must be an object.');
  }
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    candidate.standard !== 'WCAG 2.1 AA' ||
    !Array.isArray(candidate.failingImpacts) ||
    !candidate.failingImpacts.every(isImpact) ||
    !isIsoDate(candidate.approvedBaselineDate) ||
    !Array.isArray(candidate.findings)
  ) {
    throw new Error('Accessibility baseline metadata is invalid.');
  }

  const findings = candidate.findings.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Accessibility finding ${index} must be an object.`);
    }
    const finding = entry as Record<string, unknown>;
    if (
      !isNonBlankString(finding.project) ||
      !isNonBlankString(finding.ruleId) ||
      !isNonBlankString(finding.target) ||
      !isImpact(finding.impact) ||
      (finding.disposition !== 'pre-existing' && finding.disposition !== 'exception') ||
      !isNonBlankString(finding.reason) ||
      !isNonBlankString(finding.owner) ||
      !isIsoDate(finding.reviewBy) ||
      (finding.issue !== undefined && !isNonBlankString(finding.issue))
    ) {
      throw new Error(`Accessibility finding ${index} has invalid fields.`);
    }
    return finding as unknown as RecordedAxeFinding;
  });
  const keys = new Set<string>();
  for (const [index, finding] of findings.entries()) {
    const findingKey = `${finding.project}\u0000${finding.ruleId}\u0000${finding.target}`;
    if (keys.has(findingKey)) {
      throw new Error(`Accessibility finding ${index} duplicates an earlier record.`);
    }
    keys.add(findingKey);
  }

  return {
    schemaVersion: 1,
    standard: 'WCAG 2.1 AA',
    failingImpacts: candidate.failingImpacts,
    approvedBaselineDate: candidate.approvedBaselineDate,
    findings
  };
}

export function loadSignupAxeBaseline(): AxeBaseline {
  return parseAxeBaseline(JSON.parse(readFileSync(baselinePath, 'utf8')) as unknown);
}

function key(ruleId: string, target: string): string {
  return `${ruleId}\u0000${target}`;
}

function impactRank(impact: AxeImpact): number {
  return impacts.indexOf(impact);
}

export function evaluateAxeGate(
  project: string,
  observed: ObservedAxeFinding[],
  baseline = loadSignupAxeBaseline(),
  asOf = new Date().toISOString().slice(0, 10)
): AxeGateResult {
  const records = baseline.findings.filter(finding => finding.project === project);
  const recordedByKey = new Map(
    records.map(finding => [key(finding.ruleId, finding.target), finding] as const)
  );
  const observedKeys = new Set(observed.map(finding => key(finding.ruleId, finding.target)));
  const blocking: ObservedAxeFinding[] = [];
  const accepted: ObservedAxeFinding[] = [];
  const reportedOnly: ObservedAxeFinding[] = [];

  for (const finding of observed) {
    if (!isImpact(finding.impact) || !baseline.failingImpacts.includes(finding.impact)) {
      reportedOnly.push(finding);
      continue;
    }

    const recorded = recordedByKey.get(key(finding.ruleId, finding.target));
    if (
      recorded &&
      recorded.reviewBy >= asOf &&
      impactRank(finding.impact) <= impactRank(recorded.impact)
    ) {
      accepted.push(finding);
    } else {
      blocking.push(finding);
    }
  }

  return {
    blocking,
    accepted,
    reportedOnly,
    resolvedRecords: records.filter(
      finding => !observedKeys.has(key(finding.ruleId, finding.target))
    )
  };
}
