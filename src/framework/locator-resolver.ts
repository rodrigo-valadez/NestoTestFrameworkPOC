import type { Locator, Page, TestInfo } from '@playwright/test';

export interface LocatorCandidate {
  /** Human-readable strategy name written to the Playwright report. */
  name: string;
  locate: (page: Page) => Locator;
}

export interface LocatorResolverOptions {
  timeout?: number;
  pollingInterval?: number;
}

export class LocatorResolver {
  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
    private readonly options: LocatorResolverOptions = {}
  ) {}

  async resolve(candidates: readonly LocatorCandidate[]): Promise<Locator> {
    if (candidates.length === 0) {
      throw new Error('LocatorResolver requires at least one candidate.');
    }

    const timeout = this.options.timeout ?? 5_000;
    const pollingInterval = this.options.pollingInterval ?? 50;
    const deadline = Date.now() + timeout;

    do {
      for (const candidate of candidates) {
        const locator = candidate.locate(this.page);
        const visibleMatches = await this.visibleMatches(locator);

        if (visibleMatches.length > 1) {
          throw new Error(
            `Locator strategy "${candidate.name}" is ambiguous: ` +
              `${visibleMatches.length} visible elements matched.`
          );
        }

        if (visibleMatches.length === 1) {
          this.testInfo.annotations.push({
            type: 'locator-strategy',
            description: candidate.name
          });
          return visibleMatches[0];
        }
      }

      if (Date.now() < deadline) {
        await this.page.waitForTimeout(Math.min(pollingInterval, deadline - Date.now()));
      }
    } while (Date.now() < deadline);

    throw new Error(
      `No unique visible element matched within ${timeout}ms. Tried: ` +
        candidates.map(({ name }) => name).join(', ')
    );
  }

  private async visibleMatches(locator: Locator): Promise<Locator[]> {
    const matches: Locator[] = [];
    const count = await locator.count();

    for (let index = 0; index < count; index += 1) {
      const match = locator.nth(index);
      if (await match.isVisible()) {
        matches.push(match);
      }
    }

    return matches;
  }
}
