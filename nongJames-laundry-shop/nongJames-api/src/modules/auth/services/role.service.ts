import { UserRole } from '../../../common/enums';

// Role-based access control service
export class RoleService {
  constructor() {}

  hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return userRole === requiredRole;
  }

  hasAnyRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole);
  }

  isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN;
  }

  isDriver(userRole: UserRole): boolean {
    return userRole === UserRole.DRIVER;
  }

  isCustomer(userRole: UserRole): boolean {
    return [UserRole.CUSTOMER_B2B, UserRole.CUSTOMER_B2C].includes(userRole);
  }
}
