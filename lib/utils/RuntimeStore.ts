/**
 * RuntimeStore
 * ------------
 * Stores runtime values (like created group name)
 * across dependent Playwright projects.
 *
 * Uses JSON file so data survives:
 * - project boundaries
 * - retries
 * - CI workers
 */

import fs from 'fs';
import path from 'path';
import { Logger } from './Logger';

const STORE_PATH = path.resolve(process.cwd(), 'storage/runtime.json');

type RuntimeData = {
  groupName?: string;
  chatMessage?: string;
  userEmail?: string;
  userVerified?: boolean;
};

export class RuntimeStore {
  /**
   * Read full runtime store
   */
  private static read(): RuntimeData {
    if (!fs.existsSync(STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
  }

  /**
   * Write full runtime store
   */
  private static write(data: RuntimeData): void {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  }

  /**
   * Save created group name
   */
  static saveGroupName(name: string): void {
    Logger.info(`Saving group name: ${name}`);
    const data = this.read();
    data.groupName = name;
    this.write(data);
  }

  /**
   * Save chat message
   */
  static saveChatMessage(message: string): void {
    Logger.info(`Saving chat message: ${message}`);
    const data = this.read();
    data.chatMessage = message;
    this.write(data);
  }

  /**
   * Get saved chat message
   */
  static getChatMessage(): string {
    const data = this.read();
    if (!data.chatMessage) {
      throw new Error('RuntimeStore: chatMessage not found');
    }
    return data.chatMessage;
  }

  /**
   * Get saved group name
   */
  static getGroupName(): string {
    const data = this.read();
    if (!data.groupName) {
      throw new Error('RuntimeStore: groupName not found');
    }
    return data.groupName;
  }


  /**

   * Save user email

   */

  static saveUserEmail(email: string): void {

    Logger.info(`Saving user email: ${email}`);

    const data = this.read();

    data.userEmail = email;

    this.write(data);

  }



  /**

   * Get saved user email

   */

  static getUserEmail(): string {

    const data = this.read();

    if (!data.userEmail) {

      throw new Error('RuntimeStore: userEmail not found');

    }

    return data.userEmail;

  }

  /**
   * Save user verification status
   */
  static saveUserVerified(status: boolean): void {
    Logger.info(`Saving user verification status: ${status}`);
    const data = this.read();
    data.userVerified = status;
    this.write(data);
  }

  /**
   * Check if user is verified at runtime
   */
  static isUserVerified(): boolean {
    const data = this.read();
    return !!data.userVerified;
  }
}
