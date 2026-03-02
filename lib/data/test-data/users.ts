import { ENV } from '../../../config/env';
import { ROLES, UserRole } from '../constants/roles';

export const users: Record<UserRole, any> = {
  [ROLES.LEADER]: ENV.USERS.LEADER,
  [ROLES.MEMBER]: ENV.USERS.MEMBER
};
