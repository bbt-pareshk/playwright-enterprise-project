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
            HEADING: 'Create an Account',
            FIRST_NAME_LABEL: 'First Name',
            LAST_NAME_LABEL: 'Last Name',
            EMAIL_LABEL: 'Email',
            PASSWORD_LABEL: 'Password',
            CREATE_ACCOUNT_BUTTON: 'Create Account',
            VERIFY_EMAIL_BUTTON: 'verify email',
            RESEND_OTP_BUTTON: 'resend code',
        },
        FORGOT_PASSWORD: {
            HEADING: 'Forget password',
            EMAIL_LABEL: 'Email',
            RESET_BUTTON: 'Send Reset Link',
            BACK_TO_LOGIN_LINK: 'Back To Log In',
        },
        RESET_PASSWORD: {
            HEADING: 'Create new password',
            PASSWORD_NAME: 'password',
            CONFIRM_PASSWORD_NAME: 'password-confirm',
            CONFIRM_BUTTON: 'Create new password',
        },
        ONBOARDING: {
            CONTINUE_AS_LEADER: 'Continue as a Group Leader',
            EXPLORE_GROUPS: 'Explore support groups',
            CONTINUE: 'Continue',
            SKIP: 'Skip',
            LEADER_INTRO: 'Tell us a bit about your background',
            MEMBER_INTRO: 'What kind of support are you looking for',
        },
        MAILINATOR_RESET_LINK: 'reset password',
        LABELS: {
            USER_MENU: 'User menu',
            LOGOUT: 'Logout',
        },
    },
    DASHBOARD: {
        START_GROUP_LINK: 'Create Your Support Group',
        FIND_SUPPORT_GROUP_BUTTON: 'Explore Groups',
        SEARCH_PLACEHOLDER: 'Search for groups names or leaders',
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
        HOSTING: {
            // ⚠️ DOM-verified labels (2026-02-24):
            FREE_CTA: 'Get Group Listing',   // was 'Go to Group' — corrected from capture
            ACTIVE_CTA: 'Get Active Group',
            MULTI_CTA: 'Get Multi-Group',
            PAY_NOW: 'Pay Now',
            DO_THIS_LATER: 'Do this Later',
            // Payment success popup buttons:
            SET_UP_GROUP: 'Set Up Group',    // exact case from DOM
            DO_THIS_LATER_POPUP: 'Do this later', // lowercase 'l' confirmed from popup DOM
        },
        TABS: {
            JOINED: 'joined groups'
        },
        BUTTONS: {
            PAY_AND_ACTIVATE: 'pay and activate group'
        },
        MEMBERS_REGEX: 'Members?',
        LIMIT_MODAL: {
            OK_BUTTON: 'OK',
            CANCEL_BUTTON: 'Cancel',
            UPGRADE_BUTTON: 'Upgrade to Multi',
        },
        CREATE: {
            INPUTS: {
                NAME: 'Group name',
                SCHEDULE: 'Group Schedule',            // retained — not in updated flow
                DISPLAY_NAME: 'displayName',           // name attr — Professional Background tab (DOM-verified)
                PROFESSIONAL_ROLE: 'professionalRole', // name attr — Professional Background tab (DOM-verified)
            },
            BUTTONS: {
                SUBMIT_GROUP: 'Submit Group',          // retained for compatibility
                SELECT_TAGS: 'Select Tags',            // retained for compatibility
                DONE: 'Done',                          // retained for compatibility
                CONTINUE: 'Continue',                  // Tab 1 & Tab 2 navigation button (DOM-verified)
                LAUNCH_GROUP: 'Launch Group',          // Tab 3 final submit button (DOM-verified)
                UPLOAD_PHOTO: 'Upload Photo',          // Profile photo trigger button (DOM-verified)
            },
            TEXT: {
                DESCRIPTION_LABEL: 'Group Description',       // updated to match actual DOM label
                COVER_IMAGE_LABEL: 'Cover Image',             // Tab 1 cover image field label (DOM-verified)
                PHOTO_PROFILE_LABEL: 'Photo Profile',         // Tab 2 profile photo field label (DOM-verified)
                PROFESSIONAL_BIO_LABEL: 'Professional Bio',   // Tab 2 bio field label (DOM-verified)
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
