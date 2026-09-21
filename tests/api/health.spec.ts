import { expect, test } from '../../src/fixtures/environment-test';
import { requireApiHealthEnvironment } from '../../src/config/environment';

test('API health endpoint responds successfully @api-smoke', async ({ request, environment }) => {
  const target = requireApiHealthEnvironment(environment);
  const url = new URL(target.apiHealthPath, `${target.apiBaseURL}/`);
  const response = await request.get(url.toString());
  expect(response.ok(), 'API health endpoint should respond successfully').toBe(true);
});
