import type { Page, TestInfo } from '@playwright/test';

const MAX_ENTRIES = 100;
const MAX_MESSAGE_LENGTH = 500;

export function redactDiagnostic(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"']+/gi, '[url]')
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/g, '[email]')
    .replace(/\bBearer\s+[^\s"']+/gi, 'Bearer [redacted]')
    .replace(/\b(?:token|password|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '[credential]')
    .slice(0, MAX_MESSAGE_LENGTH);
}

export class BrowserDiagnostics {
  private readonly entries: string[] = [];

  constructor(private readonly page: Page) {
    page.on('console', message => {
      if (message.type() === 'warning' || message.type() === 'error') {
        this.add(`console.${message.type()}: ${message.text()}`);
      }
    });
    page.on('pageerror', error => this.add(`pageerror: ${error.message}`));
  }

  private add(message: string): void {
    if (this.entries.length < MAX_ENTRIES) {
      this.entries.push(redactDiagnostic(message));
    }
  }

  async attachOnFailure(
    testInfo: Pick<TestInfo, 'status' | 'expectedStatus' | 'attach'>
  ): Promise<void> {
    if (testInfo.status !== testInfo.expectedStatus && this.entries.length > 0) {
      await testInfo.attach('browser-diagnostics', {
        body: this.entries.join('\n'),
        contentType: 'text/plain'
      });
    }
  }
}
