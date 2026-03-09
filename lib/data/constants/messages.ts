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
            EMAIL_CONFIRMED: 'Email confirmed!',
            PASSWORD_VISIBILITY_ERROR: 'Password visibility mismatch: expected type',
            EMAIL_UNAVAILABLE: 'Email already exists',


            OTP_RESENT: 'email sent',
            FIRST_NAME_INVALID: 'only letters are allowed',
            LAST_NAME_INVALID: 'only letters are allowed',
            FIRST_NAME_REQUIRED: 'firstname is required',
            LAST_NAME_REQUIRED: 'lastname is required',
            EMAIL_REQUIRED: 'email is required',
            PASSWORD_REQUIRED: 'password is required',
        },

        FORGOT_PASSWORD: {
            SUCCESS: 'Password reset sent successfully',
        },
        RESET_PASSWORD: {
            SUCCESS: 'Password updated!',
        }
    },

    GROUPS: {
        CREATED_SUCCESS: 'Group created successfully!',
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
