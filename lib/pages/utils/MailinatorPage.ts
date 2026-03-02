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

        // Initial wait for the message viewer to stabilize 
        await this.page.waitForTimeout(3000);

        const iframeSelectors = [
            '#html_msg_body',
            '#msg_body',
            'iframe[name="msg_body"]',
            'iframe[id="html_msg_body"]',
            'iframe[title*="Message"]'
        ];

        let lastBody = '';

        for (let attempt = 1; attempt <= 5; attempt++) {
            Logger.info(`OTP extraction attempt ${attempt}/5`);

            for (const selector of iframeSelectors) {
                try {
                    const frameLocator = this.page.frameLocator(selector);
                    const bodyLocator = frameLocator.locator('body');

                    // Wait for body to be visible and have some content
                    const isVisible = await bodyLocator.isVisible({ timeout: 4000 }).catch(() => false);

                    if (isVisible) {
                        const body = await bodyLocator.innerText().catch(() => '');
                        const html = await bodyLocator.innerHTML().catch(() => '');

                        lastBody = body || html || 'Empty Body Content';

                        // Look for 6-digit code. Use a more flexible regex that handles potential &nbsp; or hidden chars
                        const otpRegex = /(?:OTP[:\s]*)(\d{6})\b|\b(\d{6})\b/;
                        const match = lastBody.match(otpRegex);

                        if (match) {
                            const otp = match[1] || match[2];
                            Logger.success(`OTP found in iframe ${selector}: ${otp}`);
                            return otp;
                        }
                    }
                } catch (e: any) {
                    Logger.debug(`Selector ${selector} failed or not found: ${e.message}`);
                }
            }

            // Fallback: Check the main page body (Mailinator sometimes shows "Plain Text" version directly)
            const pageText = await this.page.locator('body').innerText().catch(() => '');
            const pageMatch = pageText.match(/\b\d{6}\b/);
            if (pageMatch) {
                Logger.success(`OTP found in page body: ${pageMatch[0]}`);
                return pageMatch[0];
            }

            // If we didn't find it yet, take more drastic measures
            if (attempt < 5) {
                Logger.warn(`OTP not found in attempt ${attempt}. Waiting 4s before next try...`);
                await this.page.waitForTimeout(4000);

                // If the body is still empty, try clicking the "Plain Text" tab if available
                const plainTextTab = this.page.locator('a:has-text("Plain Text")');
                if (await plainTextTab.isVisible().catch(() => false)) {
                    Logger.info('Switching to Plain Text tab in Mailinator...');
                    await plainTextTab.click().catch(() => { });
                    await this.page.waitForTimeout(2000);
                } else if (attempt === 3) {
                    // Halfway through, try a reload if we're totally stuck
                    Logger.warn('Stuck. Reloading to re-trigger Mailinator content load...');
                    await this.page.reload({ waitUntil: 'domcontentloaded' });
                    await this.page.waitForTimeout(4000);
                }
            }
        }

        throw new Error(`OTP extraction failed after 5 attempts. Last content snapshot: ${lastBody.substring(0, 300)}`);
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
