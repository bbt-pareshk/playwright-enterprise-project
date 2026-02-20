/**
 * UI Structural Text Repository
 * ----------------------------
 * Headers, labels, buttons, placeholders, and static structural text.
 */

export const UI_CONSTANTS = {
    AUTH: {
        LOGIN: {
            HEADING: 'Welcome Back!',
            BUTTON: 'Log in',
            EMAIL_LABEL: 'Email or Username',
            PASSWORD_LABEL: 'Password',
            SIGN_UP_LINK: 'Sign Up',
            FORGOT_PASSWORD_LINK: 'Forget Password?',
        },
        REGISTRATION: {
            HEADING: 'Create Account',
            CREATE_ACCOUNT_BUTTON: 'Create Account',
            PASSWORD_INPUT_NAME: 'password',
            VERIFY_EMAIL_BUTTON: 'verify email',
            RESEND_OTP_BUTTON: 'resend code',
        },
        FORGOT_PASSWORD: {
            HEADING: 'Reset password',
            EMAIL_LABEL: 'Email',
            RESET_BUTTON: 'Reset Password',
            BACK_TO_LOGIN_LINK: 'Back to Login',
        },
        RESET_PASSWORD: {
            HEADING: 'Create new password',
            PASSWORD_NAME: 'password',
            CONFIRM_PASSWORD_NAME: 'password-confirm',
            CONFIRM_BUTTON: 'Create new password',
        },
        ONBOARDING: {
            CONTINUE_AS_LEADER: 'continue as a group leader',
            CONTINUE: 'continue',
            SKIP: 'skip',
        },
        MAILINATOR_RESET_LINK: 'reset password',
        LABELS: {
            USER_MENU: 'User menu',
            LOGOUT: 'Logout',
        },
        ASSERTION_MESSAGES: {
            LOGIN_HEADING_VISIBLE: 'Login heading should be visible',
            ERROR_MESSAGE_VISIBLE: 'Invalid login error message should be visible',
            RESET_HEADING_VISIBLE: 'Reset password heading should be visible',
            SUCCESS_MESSAGE_VISIBLE: 'Success message should be visible',
            CREATE_PASS_HEADING_VISIBLE: 'Create new password heading should be visible',
            UPDATE_SUCCESS_VISIBLE: 'Password updated! toast should be visible',
            GROUP_VISIBLE: 'should be visible'
        }
    },
    DASHBOARD: {
        START_GROUP_LINK: 'Start a Group',
        FIND_SUPPORT_GROUP_BUTTON: 'Find a support group',
        SEARCH_PLACEHOLDER: 'Search support groups...',
    },
    CHAT: {
        BUTTONS: {
            CLOSE: 'close',
            ACTION_MENU: 'chat box action menu',
            SEND_MESSAGE: 'send-message'
        },
        MENU_ITEMS: {
            SCHEDULE_SESSION: 'schedule a session'
        },
        HEADINGS: {
            SCHEDULE_SESSION: 'schedule a session'
        }
    },
    GROUPS: {
        STATUS: {
            ACTIVATE: 'activate your group',
            INTERESTED: "i'm interested"
        },
        TABS: {
            JOINED: 'joined groups'
        },
        BUTTONS: {
            PAY_AND_ACTIVATE: 'pay and activate group'
        },
        MEMBERS_REGEX: 'Members?',
        CREATE: {
            INPUTS: {
                NAME: 'Group name',
                SCHEDULE: 'Group Schedule'
            },
            BUTTONS: {
                SUBMIT_GROUP: 'Submit Group',
                SELECT_TAGS: 'Select Tags',
                DONE: 'Done',
                CONTINUE: 'Continue to Review & Submit'
            },
            TEXT: {
                DESCRIPTION_LABEL: 'let us know what your group is about'
            }
        }
    },
    SESSION: {
        SCHEDULE_SESSION: 'schedule a session'
    },
    PAYMENT: {
        SETTINGS: {
            BUTTONS: {
                SAVE: 'Save Payment Settings'
            },
            DROPDOWN: {
                TYPE: 'paymentType'
            }
        }
    },
    COMMON: {
        CLOSE: 'close',
    }
} as const;
