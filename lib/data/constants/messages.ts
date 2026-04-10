/**
 * Centralized Enterprise Message Repository
 * ----------------------------------------
 * User-facing dynamic messages ONLY:
 * Success toasts, error notifications, validation, and confirmations.
 */

export const MESSAGES = {
    AUTH: {
        LOGIN: {
            INVALID_CREDENTIALS: "The username/email or password you've entered is incorrect.",
        },
        REGISTRATION: {
            EMAIL_CONFIRMED: 'Email Verified Successfully',
            PASSWORD_VISIBILITY_ERROR: 'Password visibility mismatch: expected type',
            EMAIL_UNAVAILABLE: 'Email already exists',


            OTP_RESENT: 'email sent',
            FIRST_NAME_INVALID: 'Only letters are allowed.',
            LAST_NAME_INVALID: 'Only letters are allowed.',
            FIRST_NAME_REQUIRED: 'First name is required.',
            LAST_NAME_REQUIRED: 'Last name is required.',
            EMAIL_REQUIRED: 'Email is required.',
            PASSWORD_REQUIRED: 'Password is required.',
        },

        FORGOT_PASSWORD: {
            SUCCESS: 'Password reset sent successfully',
        },
        RESET_PASSWORD: {
            SUCCESS: 'Success: Password Changed Successfully',
        }
    },

    GROUPS: {
        CREATED_SUCCESS: 'Group created successfully!',
        ACTIVE_LIMIT_HEADING: "You've reached your active group limit",
        ACTIVE_LIMIT_ACTIVE_PLAN: "Your current plan allows 1 active group only.\nTo create another group, you'll need to upgrade your plan.",
        ACTIVE_LIMIT_MULTI_PLAN: 'Your current plan allows 3 active groups only.',
    },

    DASHBOARD: {
        NO_GROUPS: "We're sorry — this group doesn't exist yet.",
    },

    PAYMENT: {
        TYPE_SET_SUCCESS: 'payment type set successfully',
        SUCCESS: 'payment was successful!',
    },

    CHAT: {
        NEW_MESSAGE: 'New Message',
    }
} as const;
