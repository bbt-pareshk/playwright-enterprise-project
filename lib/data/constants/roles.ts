export const ROLES = {
  LEADER: 'leader',
  MEMBER: 'member',
  LEADER_ACTIVE_HOSTING_PLAN: 'leader_active_hosting_plan',
  LEADER_MULTI_GROUP_HOSTING_PLAN: 'leader_multi_group_hosting_plan',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
