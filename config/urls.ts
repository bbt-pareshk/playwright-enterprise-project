import { ENV } from './env';

/**
 * Enterprise Route Paths
 * ----------------------
 * Constant route paths for the application.
 * These are separated from the domain to allow environment switching.
 */
export const ROUTE_PATHS = {
  HOME: '/',
  MH_SITE: '/',
  LOGIN: '/login',
  DASHBOARD: '/groups',
  MYGROUP: '/groups/my',
  CREATE_GROUP: '/groups/new',
  FORGOT_PASSWORD: '/forgot-password',
  RESET: '/reset',
  VERIFY_EMAIL: '/user/email/verify',
  WELCOME: '/welcome',
  PROFILE: '/profile',
  PAYMENT: '/payment',
  PROFILE_PAYMENTS: '/user/profile/payments',
  SESSIONS: '/sessions',
  REGISTER: '/register',
} as const;

/**
 * External Application Links
 */
export const EXTERNAL_URLS = {
  MAILINATOR: 'https://www.mailinator.com/v4/public/inboxes.jsp'
} as const;

/**
 * Enterprise Route Builder (ROUTES)
 * ---------------------------------
 * Dynamically constructs full URLs by combining the domain (from ENV)
 * with the application routes. This ensures consistent navigation
 * across all environments.
 *
 * Usage: ROUTES.dashboard() -> 'https://staging.mentalhappy.com/groups'
 */
export const ROUTES = {
  home: () => `${ENV.BASE_URL}${ROUTE_PATHS.HOME}`,
  login: () => `${ENV.BASE_URL}${ROUTE_PATHS.LOGIN}`,
  dashboard: () => `${ENV.BASE_URL}${ROUTE_PATHS.DASHBOARD}`,
  myGroup: () => `${ENV.BASE_URL}${ROUTE_PATHS.MYGROUP}`,
  createGroup: () => `${ENV.BASE_URL}${ROUTE_PATHS.CREATE_GROUP}`,
  forgotPassword: () => `${ENV.BASE_URL}${ROUTE_PATHS.FORGOT_PASSWORD}`,
  reset: () => `${ENV.BASE_URL}${ROUTE_PATHS.RESET}`,
  verifyEmail: () => `${ENV.BASE_URL}${ROUTE_PATHS.VERIFY_EMAIL}`,
  welcome: () => `${ENV.BASE_URL}${ROUTE_PATHS.WELCOME}`,
  profile: () => `${ENV.BASE_URL}${ROUTE_PATHS.PROFILE}`,
  payment: () => `${ENV.BASE_URL}${ROUTE_PATHS.PAYMENT}`,
  profilePayments: () => `${ENV.BASE_URL}${ROUTE_PATHS.PROFILE_PAYMENTS}`,
  sessions: () => `${ENV.BASE_URL}${ROUTE_PATHS.SESSIONS}`,
  register: () => `${ENV.BASE_URL}${ROUTE_PATHS.REGISTER}`,
} as const;

/**
 * Consolidated URL Management (Enterprise Approved)
 * ------------------------------------------------
 * Includes structured routes, external links, and a backward 
 * compatibility layer for existing references.
 */
export const URLS = {
  PATHS: ROUTE_PATHS,
  EXTERNAL: EXTERNAL_URLS,

  // Backward compatibility for top-level access (DEPRECATED: Use ROUTES helper instead)
  ...ROUTE_PATHS,
} as const;