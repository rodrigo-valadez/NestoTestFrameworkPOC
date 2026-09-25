import { expect, test } from '@playwright/test';
import {
  evaluateAxeGate,
  type AxeImpact,
  type ObservedAxeFinding,
  parseAxeBaseline
} from '../../src/accessibility/axe-quality-gate';

const baseline = {
  schemaVersion: 1 as const,
  standard: 'WCAG 2.1 AA' as const,
  failingImpacts: ['serious', 'critical'] as AxeImpact[],
  approvedBaselineDate: '2026-09-23',
  findings: [
    {
      project: 'chromium-en-CA',
      ruleId: 'known-rule',
      target: '#known',
      impact: 'serious' as const,
      disposition: 'pre-existing' as const,
      reason: 'Tracked for remediation.',
      owner: 'QA owner',
      reviewBy: '2026-10-23'
    }
  ]
};

test('axe quality gate blocks new or worsened serious and critical findings', () => {
  const observed: ObservedAxeFinding[] = [
    { ruleId: 'known-rule', target: '#known', impact: 'critical' },
    { ruleId: 'new-rule', target: '#new', impact: 'serious' }
  ];

  const result = evaluateAxeGate('chromium-en-CA', observed, baseline, '2026-09-23');

  expect(result.blocking).toEqual(observed);
  expect(result.accepted).toEqual([]);
});

test('axe quality gate reports lower impacts and accepts unchanged recorded findings', () => {
  const observed: ObservedAxeFinding[] = [
    { ruleId: 'known-rule', target: '#known', impact: 'serious' },
    { ruleId: 'minor-rule', target: '#minor', impact: 'minor' }
  ];

  const result = evaluateAxeGate('chromium-en-CA', observed, baseline, '2026-09-23');

  expect(result.blocking).toEqual([]);
  expect(result.accepted).toEqual([observed[0]]);
  expect(result.reportedOnly).toEqual([observed[1]]);
});

test('axe quality gate rejects expired records', () => {
  const expired = {
    ...baseline,
    findings: [{ ...baseline.findings[0], reviewBy: '2026-09-22' }]
  };

  const finding: ObservedAxeFinding = {
    ruleId: 'known-rule',
    target: '#known',
    impact: 'serious'
  };

  expect(evaluateAxeGate('chromium-en-CA', [finding], expired, '2026-09-23').blocking).toEqual([
    finding
  ]);
});

test('axe baseline rejects blank governance fields and duplicate records', () => {
  expect(() =>
    parseAxeBaseline({
      ...baseline,
      findings: [{ ...baseline.findings[0], reason: ' ' }]
    })
  ).toThrow('invalid fields');

  expect(() =>
    parseAxeBaseline({
      ...baseline,
      findings: [baseline.findings[0], { ...baseline.findings[0] }]
    })
  ).toThrow('duplicates an earlier record');
});

test('axe baseline cannot redefine the approved failing impacts', () => {
  expect(() =>
    parseAxeBaseline({
      ...baseline,
      failingImpacts: ['minor', 'critical']
    })
  ).toThrow('metadata is invalid');
});
