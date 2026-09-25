import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../../src/fixtures/test';
import {
  evaluateAxeGate,
  type AxeImpact,
  type ObservedAxeFinding
} from '../../src/accessibility/axe-quality-gate';

test('SGN-009 reports the signup accessibility baseline with severity @real-app', async ({
  liveSignupPage,
  page
}, testInfo) => {
  await liveSignupPage.open();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const violations = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact ?? 'unknown',
    help: violation.help,
    targets: violation.nodes.map(node => node.target.map(String).join(' '))
  }));
  const observedFindings: ObservedAxeFinding[] = results.violations.flatMap(violation =>
    violation.nodes.map(node => ({
      ruleId: violation.id,
      impact: (violation.impact ?? 'unknown') as AxeImpact | 'unknown',
      target: node.target.map(String).join(' ')
    }))
  );
  const gate = evaluateAxeGate(testInfo.project.name, observedFindings);

  await testInfo.attach('accessibility-violations.json', {
    body: Buffer.from(JSON.stringify(violations, null, 2)),
    contentType: 'application/json'
  });
  await testInfo.attach('accessibility-gate.json', {
    body: Buffer.from(JSON.stringify(gate, null, 2)),
    contentType: 'application/json'
  });
  testInfo.annotations.push({
    type: 'accessibility-baseline',
    description: `${violations.length} WCAG A/AA violation rules observed`
  });
  console.log(`SGN-009 ${testInfo.project.name}: ${JSON.stringify(violations)}`);

  expect(results.testEngine.name).toBe('axe-core');
  expect(
    gate.blocking,
    'New or worsened serious/critical axe findings require review or a recorded exception.'
  ).toEqual([]);
});
