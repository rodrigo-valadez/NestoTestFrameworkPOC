import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const impacts = ['minor', 'moderate', 'serious', 'critical'] as const;
export type AxeImpact = (typeof impacts)[number];

export interface ObservedAxeFinding {
  ruleId: string;
  impact: AxeImpact | 'unknown';
  target: string;
}

interface RecordedAxeFinding {
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

interface AxeBaseline {
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

function parseBaseline(value: unknown): AxeBaseline {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Accessibility baseline must be an object.');
  }
  const candidate = value as Record<string, unknown>;
  if (
    candidate.schemaVersion !== 1 ||
    candidate.standard !== 'WCAG 2.1 AA' ||
    !Array.isArray(candidate.failingImpacts) ||
    !candidate.failingImpacts.every(isImpact) ||
    typeof candidate.approvedBaselineDate !== 'string' ||
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
      typeof finding.project !== 'string' ||
      typeof finding.ruleId !== 'string' ||
      typeof finding.target !== 'string' ||
      !isImpact(finding.impact) ||
      (finding.disposition !== 'pre-existing' && finding.disposition !== 'exception') ||
      typeof finding.reason !== 'string' ||
      typeof finding.owner !== 'string' ||
      typeof finding.reviewBy !== 'string' ||
      (finding.issue !== undefined && typeof finding.issue !== 'string')
    ) {
      throw new Error(`Accessibility finding ${index} has invalid fields.`);
    }
    return finding as unknown as RecordedAxeFinding;
  });

  return {
    schemaVersion: 1,
    standard: 'WCAG 2.1 AA',
    failingImpacts: candidate.failingImpacts,
    approvedBaselineDate: candidate.approvedBaselineDate,
    findings
  };
}

export function loadSignupAxeBaseline(): AxeBaseline {
  return parseBaseline(JSON.parse(readFileSync(baselinePath, 'utf8')) as unknown);
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
  baseline = loadSignupAxeBaseline()
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
    if (recorded && impactRank(finding.impact) <= impactRank(recorded.impact)) {
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
