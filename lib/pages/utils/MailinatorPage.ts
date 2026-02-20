import { Page, Locator } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import { URLS } from '../../../config/urls';
import { Logger } from '../../utils/Logger';

/**
 * MailinatorPage
 * ----------------
 * Handles interactions with Mailinator public inbox
 * for email OTP verification during automated testing.
 */
export class MailinatorPage extends BasePage {
    private readonly emailList: Locator;

    constructor(page: Page) {
        super(page);
        this.emailList = page.locator('.table-striped tbody tr');
    }

    /**
     * Opens Mailinator public inbox for a specific email address
     * @param email - Full email address
     */
    async openInbox(email: string): Promise<void> {
        const username = email.split('@')[0];
        const inboxUrl = `${URLS.EXTERNAL.MAILINATOR}?to=${username}`;
        Logger.step(`Opening Mailinator inbox: ${inboxUrl}`);

        try {
            await this.page.goto(inboxUrl, {
                timeout: 60000,
                waitUntil: 'networkidle'
            });
        } catch (error: any) {
            Logger.warn(`First attempt failed: ${error.message}. Retrying...`);
            await this.page.goto(inboxUrl, {
                timeout: 60000,
                waitUntil: 'domcontentloaded'
            });
        }

        Logger.success('Mailinator inbox loaded');
    }

    /**
     * Opens the latest email in the inbox, optionally filtered by subject keywords
     * @param timeout - Maximum wait time for email to appear
     * @param subjectFilter - Optional keywords to filter by subject
     */
    async openLatestEmail(timeout: number = 90000, subjectFilter?: string | string[]): Promise<void> {
        const filters = Array.isArray(subjectFilter) ? subjectFilter : subjectFilter ? [subjectFilter] : [];
        const filterStatus = filters.length > 0 ? `keywords: ${filters.join(', ')}` : 'latest email';
        const currentUrl = this.page.url();

        Logger.step(`Searching for ${filterStatus} in Inbox: ${currentUrl} (Timeout: ${timeout}ms)`);

        let attempts = 0;
        const maxAttempts = 5;
        const waitPerAttempt = Math.floor(timeout / maxAttempts);

        while (attempts < maxAttempts) {
            try {
                // Wait for any row to appear in the table
                await this.emailList.first().waitFor({ state: 'visible', timeout: waitPerAttempt });

                const emailCount = await this.emailList.count();
                const foundSubjects: string[] = [];

                for (let i = 0; i < emailCount && i < 15; i++) {
                    const rowText = await this.emailList.nth(i).innerText();
                    foundSubjects.push(rowText.replace(/\n/g, ' ').trim());

                    const isMatch = filters.length === 0 || filters.some(f => rowText.toLowerCase().includes(f.toLowerCase()));
                    if (isMatch) {
                        Logger.success(`Matched email: "${rowText.substring(0, 60).replace(/\n/g, ' ')}..."`);
                        await this.emailList.nth(i).click();
                        await this.page.waitForTimeout(3000);
                        return;
                    }
                }

                if (filters.length > 0) {
                    Logger.info(`Target email not found among ${emailCount} rows. Subjects: [${foundSubjects.map(s => s.substring(0, 30)).join(' | ')}]`);
                }

                throw new Error(`Email with filters [${filters}] not found in inbox.`);
            } catch (error: any) {
                attempts++;
                if (attempts >= maxAttempts) {
                    const pageText = await this.page.locator('body').innerText().catch(() => 'could not read page text');
                    Logger.error(`Mailinator Failure after ${attempts} attempts. Page Content Snippet: ${pageText.substring(0, 300)}`);
                    throw error;
                }
                Logger.warn(`Attempt ${attempts}/${maxAttempts} failed: ${error.message}. Refreshing inbox...`);
                await this.page.reload({ waitUntil: 'domcontentloaded' });
                await this.page.waitForTimeout(2000);
            }
        }
    }

    /**
     * Extracts 6-digit OTP from email body
     */
    async extractOTP(): Promise<string> {
        Logger.step('Extracting OTP');

        const iframeSelectors = ['#html_msg_body', '#msg_body', 'iframe[name="msg_body"]'];
        let lastBody = '';

        for (let attempt = 1; attempt <= 3; attempt++) {
            await this.page.waitForTimeout(2000 * attempt);

            for (const selector of iframeSelectors) {
                try {
                    const frame = this.page.frameLocator(selector);
                    await frame.locator('body').waitFor({ state: 'visible', timeout: 5000 });
                    const body = await frame.locator('body').innerText();
                    lastBody = body;

                    const match = body.match(/\b\d{6}\b/);
                    if (match) {
                        Logger.success(`OTP found: ${match[0]}`);
                        return match[0];
                    }
                } catch (e) { }
            }

            // Fallback to page body
            const pageText = await this.page.locator('body').innerText();
            const match = pageText.match(/\b\d{6}\b/);
            if (match) return match[0];

            if (attempt < 3) {
                Logger.warn('OTP not found, refreshing email...');
                await this.page.reload({ waitUntil: 'networkidle' });
                await this.emailList.first().waitFor({ state: 'visible' });
                await this.emailList.first().click();
            }
        }

        throw new Error(`OTP extraction failed. Email body snippet: ${lastBody.substring(0, 100)}`);
    }

    async getOTPFromEmail(email: string): Promise<string> {
        await this.openInbox(email);
        await this.openLatestEmail(60000, ['confirm', 'email', 'verify', 'otp', 'code']);
        return await this.extractOTP();
    }

    async clickForgotPasswordResetLink(): Promise<void> {
        Logger.step('Clicking reset link');

        // Try multiple iframe possibilities as Mailinator can be dynamic
        const iframeSelectors = ['#html_msg_body', '#msg_body', 'iframe[name="msg_body"]'];
        let found = false;

        for (const selector of iframeSelectors) {
            const frame = this.page.frameLocator(selector);
            // Check if frame exists and is populated
            if (await frame.locator('body').isVisible({ timeout: 5000 }).catch(() => false)) {
                Logger.info(`Using iframe: ${selector}`);
                const selectors = [
                    frame.getByRole('link', { name: /reset password/i }),
                    frame.locator('a').filter({ hasText: /reset/i }),
                    frame.locator('a[href*="reset"]')
                ];

                for (const s of selectors) {
                    if (await s.count() > 0) {
                        const targetUrl = await s.first().getAttribute('href').catch(() => 'unknown');
                        Logger.info(`Clicking Reset Link found in iframe: ${targetUrl}`);
                        await s.first().evaluate(el => (el as HTMLElement).click());
                        found = true;
                        break;
                    }
                }
            }
            if (found) break;
        }

        if (!found) {
            Logger.warn('Reset link not found in standard iframes. Checking page body as fallback...');
            const pageSelectors = [
                this.page.getByRole('link', { name: /reset password/i }),
                this.page.locator('a').filter({ hasText: /reset/i }),
                this.page.locator('a[href*="reset"]')
            ];

            for (const s of pageSelectors) {
                if (await s.count() > 0) {
                    const targetUrl = await s.first().getAttribute('href').catch(() => 'unknown');
                    Logger.info(`Clicking Reset Link found in page body: ${targetUrl}`);
                    await s.first().evaluate(el => (el as HTMLElement).click());
                    found = true;
                    break;
                }
            }
        }

        if (!found) {
            const bodyHtml = await this.page.locator('body').innerHTML().catch(() => 'unavailable');
            Logger.error('Email content summary: ' + bodyHtml.substring(0, 300));
            throw new Error('Reset link not found in email body (iframes or main page)');
        }

        Logger.success('Reset link interaction completed');
    }

    async clickResetPasswordLinkFromEmail(email: string): Promise<void> {
        await this.openInbox(email);
        await this.openLatestEmail(90000, ['reset', 'password', 'forgot']);
        await this.clickForgotPasswordResetLink();
    }
}
