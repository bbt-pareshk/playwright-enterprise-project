export const ROLES = {
  LEADER: 'leader',
  MEMBER: 'member',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
