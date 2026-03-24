export enum UserRole {
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  CUSTOMER_B2C = 'CUSTOMER_B2C',
  CUSTOMER_B2B = 'CUSTOMER_B2B',
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.DRIVER]: 'Driver',
  [UserRole.CUSTOMER_B2C]: 'B2C Customer',
  [UserRole.CUSTOMER_B2B]: 'B2B Customer',
};
