import { test } from '@playwright/test';
import { APP_CONSTANTS } from '../data/constants/app-constants';

/* -------------------------------------------------------
 * Enterprise DataGenerator Utility
 * -------------------------------------------------------
 * Purpose:
 * - Generate unique test data
 * - Avoid hardcoded values
 * - Parallel-safe & retry-safe
 * - Self-contained (no external RandomUtil dependency)
 * -------------------------------------------------------
 */

export class DataGenerator {

  /* =====================================================
     Timestamp Helper
     ===================================================== */

  private static safeTimestamp(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) + '_' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds())
    );
  }

  /* =====================================================
     Internal Random Generator (Replaces RandomUtil)
     ===================================================== */

  private static generateRandomString(minLength: number, maxLength: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const length =
      minLength === maxLength
        ? minLength
        : Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static randomLetters(minLength: number, maxLength: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const length =
      Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static randomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /* =====================================================
     Enterprise Entropy Generator
     - worker-safe
     - retry-safe
     - configurable length
     ===================================================== */

  private static getEntropy(length: number = 3): string {
    const ms = new Date().getMilliseconds().toString().padStart(3, '0');
    let worker = 'w0';
    let retry = 'r0';

    try {
      const info = test.info();
      worker = `w${info.workerIndex}`;
      retry = `r${info.retry}`;
    } catch {
      // fallback when outside test context
    }

    const rnd = this.generateRandomString(length, length).toLowerCase();
    return `${worker}${retry}${ms}${rnd}`;
  }

  /* =====================================================
     Enterprise Naming Formatter
     ===================================================== */

  private static formatName(entity: string, suffix: string): string {
    return `${APP_CONSTANTS.TEST_PREFIX}_${entity}_${suffix}`;
  }

  /* =====================================================
     PRIMARY GENERATORS
     ===================================================== */

  static generateGroupName(entropyLength = 3): string {
    return this.formatName(
      'Group',
      `${this.safeTimestamp()}_${this.getEntropy(entropyLength)}`
    );
  }

  static generateSessionName(entropyLength = 3): string {
    return this.formatName(
      'Session',
      `${this.safeTimestamp()}_${this.getEntropy(entropyLength)}`
    );
  }

  static generateUserName(entropyLength = 3): string {
    return this.formatName(
      'User',
      `${this.generateRandomString(5, 8)}_${this.getEntropy(entropyLength)}`
    );
  }

  static generateChatMessage(entropyLength = 3): string {
    return this.formatName(
      'Chat',
      `${this.safeTimestamp()}_${this.getEntropy(entropyLength)}`
    );
  }

  static generateEmail(
    domain = APP_CONSTANTS.TEST_DATA.DEFAULTS.EMAIL_DOMAIN,
    entropyLength = 1
  ): string {
    // Mailinator UI truncates after 25 chars. 
    // Format: em_[DDHHMM][worker][retry][rnd]
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const hhmm = pad(now.getHours()) + pad(now.getMinutes());

    const info = { worker: 'w0', retry: 'r0' };
    try {
      const playwrightInfo = test.info();
      info.worker = `w${playwrightInfo.workerIndex}`;
      info.retry = `r${playwrightInfo.retry}`;
    } catch (e) { }

    const rnd = this.generateRandomString(entropyLength, entropyLength);

    // Total approx 15-18 chars: "em_192230w0r0a"
    return `em_${day}${hhmm}${info.worker}${info.retry}${rnd}@${domain}`.toLowerCase();
  }
  /* =====================================================
     Compatibility Methods (DO NOT REMOVE)
     ===================================================== */

  static groupName(): string {
    return this.generateGroupName();
  }

  static sessionName(): string {
    return this.generateSessionName();
  }

  static userName(): string {
    return this.generateUserName();
  }

  static email(
    domain = APP_CONSTANTS.TEST_DATA.DEFAULTS.EMAIL_DOMAIN
  ): string {
    return this.generateEmail(domain);
  }

  /* =====================================================
     Text / Names
     ===================================================== */

  static firstName(): string {
    return `First${this.randomLetters(4, 6)}`;
  }

  static lastName(): string {
    return `Last${this.randomLetters(4, 6)}`;
  }

  static title(
    prefix = APP_CONSTANTS.TEST_DATA.DEFAULTS.TITLE_PREFIX
  ): string {
    return `${prefix} ${this.generateRandomString(3, 6)}`;
  }

  static description(
    prefix = APP_CONSTANTS.TEST_DATA.DEFAULTS.DESCRIPTION_PREFIX
  ): string {
    return `${prefix} ${this.generateRandomString(8, 12)}`;
  }

  static sentence(): string {
    return `${APP_CONSTANTS.TEST_DATA.DEFAULTS.AUTO_TEXT_PREFIX} ${this.generateRandomString(10, 15)}`;
  }

  /* =====================================================
     Numbers
     ===================================================== */

  static number(length = 4): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return this.randomNumber(min, max).toString();
  }

  static sessionTitle(): string {
    return this.generateSessionName();
  }
}
