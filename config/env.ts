import * as dotenv from 'dotenv';
import { APP_CONSTANTS } from '../lib/data/constants/app-constants';

/**
 * Enterprise Environment Configuration Loader
 * ------------------------------------------
 * - Loads .env once and centralizes all environment-specific logic.
 * - Performs strict validation and fails fast if any required variables are missing.
 * - Supports dynamic environment switching (staging, live, etc.) without code changes.
 * - Provides backward compatibility for existing nested access patterns.
 * - Centralizes runtime flags (CI, Auth skips, etc.) to prevent bypasses.
 */

// 1. Initialization: Load dotenv
dotenv.config();

const ENVIRONMENT = process.env.ENVIRONMENT;

// 2. Strict Environment Selection Validation
if (!ENVIRONMENT) {
  throw new Error('❌ ENVIRONMENT variable is missing in .env file. Expected "staging" or "live".');
}

const VALID_ENVIRONMENTS = ['staging', 'live'];
if (!VALID_ENVIRONMENTS.includes(ENVIRONMENT.toLowerCase())) {
  throw new Error(`❌ Invalid ENVIRONMENT: "${ENVIRONMENT}". Expected one of: ${VALID_ENVIRONMENTS.join(', ')}`);
}

/**
 * Internal helper to retrieve and validate prefixed environment variables.
 * Automatically prefixes the key (e.g., STAGING_ or LIVE_) based on CURRENT_ENV.
 */
function getRequiredVar(key: string): string {
  const envPrefix = ENVIRONMENT!.toUpperCase();
  const fullKey = `${envPrefix}_${key}`;
  const value = process.env[fullKey];

  if (!value) {
    throw new Error(`❌ Missing environment variable: ${fullKey}`);
  }

  return value;
}

/**
 * Internal helper to retrieve optional boolean flags.
 */
function getBoolFlag(key: string, defaultValue = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Internal helper to retrieve optional (non-required) env vars.
 * Returns empty string if not set — tests using these must guard accordingly.
 */
function getOptionalVar(key: string): string {
  const envPrefix = ENVIRONMENT!.toUpperCase();
  return process.env[`${envPrefix}_${key}`] ?? '';
}

// 3. Unified Environment Mapping
const BASE_URL = getRequiredVar('BASE_URL');
const LEADER_USERNAME = getRequiredVar('LEADER_USERNAME');
const LEADER_PASSWORD = getRequiredVar('LEADER_PASSWORD');
const MEMBER_USERNAME = getRequiredVar('MEMBER_USERNAME');
const MEMBER_PASSWORD = getRequiredVar('MEMBER_PASSWORD');

/**
 * Unified ENV Object
 * ------------------
 * Provides both flat-access (standardized) and nested-access (backward compatible).
 */
export const ENV = {
  CURRENT: ENVIRONMENT.toLowerCase() as 'staging' | 'live',
  BASE_URL,

  // Standardized Flat Access
  LEADER_USERNAME,
  LEADER_PASSWORD,
  MEMBER_USERNAME,
  MEMBER_PASSWORD,

  // Pre-seeded plan-limit accounts (must be set manually in .env)
  LEADER_ACTIVE_HOSTING_PLAN_USERNAME: getOptionalVar('LEADER_ACTIVE_HOSTING_PLAN_USERNAME'),
  LEADER_ACTIVE_HOSTING_PLAN_PASSWORD: getOptionalVar('LEADER_ACTIVE_HOSTING_PLAN_PASSWORD'),
  LEADER_MULTI_GROUP_HOSTING_PLAN_USERNAME: getOptionalVar('LEADER_MULTI_GROUP_HOSTING_PLAN_USERNAME'),
  LEADER_MULTI_GROUP_HOSTING_PLAN_PASSWORD: getOptionalVar('LEADER_MULTI_GROUP_HOSTING_PLAN_PASSWORD'),

  // Runtime Flags & Infrastructure
  IS_CI: getBoolFlag('CI') || getBoolFlag('GITHUB_ACTIONS'),
  SKIP_MEMBER_AUTH: getBoolFlag('SKIP_MEMBER_AUTH'),
  SKIP_LEADER_AUTH: getBoolFlag('SKIP_LEADER_AUTH'),
  TEST_ROLE: process.env.TEST_ROLE,
  ALLOW_CHAT: getBoolFlag('ALLOW_CHAT'),

  // OTP Bypass Configuration (Sync'd with backend)
  USE_OTP_BYPASS: getBoolFlag('USE_OTP_BYPASS'),
  BYPASS_OTP_VALUE: APP_CONSTANTS.AUTH.OTP_BYPASS.BYPASS_OTP_VALUE,

  // Backward Compatibility (Maintains compatibility with tests and fixtures)
  USERS: {
    LEADER: {
      username: LEADER_USERNAME,
      password: LEADER_PASSWORD,
    },
    MEMBER: {
      username: MEMBER_USERNAME,
      password: MEMBER_PASSWORD,
    },
  },
} as const;

export const CURRENT_ENVIRONMENT = ENV.CURRENT;
