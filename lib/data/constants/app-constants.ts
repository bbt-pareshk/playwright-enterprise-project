/**
 * Application & Test Metadata Repository
 * --------------------------------------
 * Test data prefixes, mock data, and internal logging/runtime constants.
 */

export const APP_CONSTANTS = {
    // Runtime Log Templates
    LOGS: {
        AUTH: {
            PASS_VISIBILITY: 'Password visibility verified as',
        }
    },

    // Group related constants
    GROUP_NAME: 'AM Test - Free',
    CHAT_MESSAGE: 'Automation_Chat_Test_Message_',

    // Path related constants
    STATIC_PATH: './src/test-data/assets/',

    // Test Metadata
    TEST_PREFIX: 'PW',

    // Test Data related constants
    TEST_DATA: {
        CHAT_MESSAGE_PREFIX: 'Testing Chat Input Field - ',
        LEADER_MESSAGE_PREFIX: 'Message from Leader - ',
        PASSWORD_TEST: {
            DEFAULT: 'Password123!',
            SECRET: 'RegistrationSecret123!',
            WRONG: 'WrongPassword123!',
            TEST: 'TestPassword123!',
            SHORT: 'Pass1!',
            LONG: 'ThisPasswordIsWayTooLongAndShouldTriggerValidationErrorsIfThereIsAMaxLimitDefinedInTheApplication123!',
            MIN_LENGTH: 8,
            MAX_LENGTH: 195
        },
        LOGIN: {
            SUCCESS: {
                INVALID_TEST: 'Invalid Login test passed successfully',
                VISIBILITY_TEST: 'Password Visibility Toggle test passed successfully'
            }
        },
        DEFAULTS: {
            TITLE_PREFIX: 'Title',
            DESCRIPTION_PREFIX: 'Test description',
            EMAIL_DOMAIN: 'mailinator.com',
            AUTO_TEXT_PREFIX: 'Auto generated text',
            DEFAULT_SCHEDULE: 'Weekly on Monday'
        },
        PAYMENT: {
            CARD_NUMBER: '4242424242424242',
            EXPIRY: '1234',
            CVC: '123',
            POSTAL_CODE: '560001',
            COUNTRY_CODE: 'US'
        },
        SESSION: {
            DEFAULT_DESCRIPTION: 'Automated Session Description',
            START_TIMES: ['10:00 AM', '11:00 AM', '12:00 PM'],
            END_TIMES: ['10:30 AM', '11:30 AM', '12:30 PM'],
            TIMEZONES: ['Asia/Bangkok', 'Asia/Kolkata', 'Europe/London'],
            TITLE_PREFIX: 'Session'
        },
        IDENTIFIER: {
            DEFAULT_PREFIX: 'ID'
        }
    }
} as const;
