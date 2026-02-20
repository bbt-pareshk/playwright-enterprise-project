import fs from 'fs';
import path from 'path';
import { ENV } from '../../config/env';
import { Logger } from './Logger';

/**
 * Global Setup
 * ------------
 * Performs one-time setup tasks before testing starts.
 * - Ensures report directories exist.
 * - Generates environment metadata for Allure reporting.
 */
export default async () => {
    Logger.info('▶ CI: ' + ENV.IS_CI);
    Logger.info('▶ Environment: ' + ENV.CURRENT);
    Logger.info('▶ Base URL: ' + ENV.BASE_URL);
    Logger.info('Initializing Global Setup');

    const resultsDir = path.resolve('allure-results');

    // Ensure results directory exists
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    // Generate environment details for Allure
    const content = `
ENVIRONMENT=${ENV.CURRENT}
BASE_URL=${ENV.BASE_URL}
CI=${ENV.IS_CI}
`.trim();

    fs.writeFileSync(
        path.join(resultsDir, 'environment.properties'),
        content
    );

    Logger.info('Global Setup Completed');
};
