export const StaffRole = {
  Admin: 'ADMIN',
  Manager: 'MANAGER',
  Waiter: 'WAITER',
  Kitchen: 'KITCHEN',
} as const;

export type StaffRole = (typeof StaffRole)[keyof typeof StaffRole];

export const Permission = {
  DashboardRead: 'dashboard.read',
  MenuRead: 'menu.read',
  MenuManage: 'menu.manage',
  OrdersRead: 'orders.read',
  OrdersCreate: 'orders.create',
  OrdersUpdateStatus: 'orders.update-status',
  TablesRead: 'tables.read',
  TablesManage: 'tables.manage',
  SessionsRead: 'sessions.read',
  SessionsManage: 'sessions.manage',
  QrsManage: 'qrs.manage',
  StaffManage: 'staff.manage',
  ProfileRead: 'profile.read',
  NotificationsRead: 'notifications.read',
  KitchenQueueRead: 'kitchen.queue.read',
  KitchenQueueUpdate: 'kitchen.queue.update',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const PermissionScope = {
  Assigned: 'assigned',
  Restaurant: 'restaurant',
} as const;

export type PermissionScope =
  (typeof PermissionScope)[keyof typeof PermissionScope];

export interface PermissionGrant {
  permission: Permission;
  scope: PermissionScope;
}

export interface PermissionRequirement extends PermissionGrant {}

const restaurantPermissions: Permission[] = Object.values(Permission);

const managerPermissions: Permission[] = [
  Permission.DashboardRead,
  Permission.MenuRead,
  Permission.MenuManage,
  Permission.OrdersRead,
  Permission.OrdersCreate,
  Permission.OrdersUpdateStatus,
  Permission.TablesRead,
  Permission.TablesManage,
  Permission.SessionsRead,
  Permission.SessionsManage,
  Permission.QrsManage,
  Permission.StaffManage,
  Permission.ProfileRead,
  Permission.NotificationsRead,
  Permission.KitchenQueueRead,
  Permission.KitchenQueueUpdate,
];

export const ROLE_PERMISSION_GRANTS: Readonly<Record<StaffRole, readonly PermissionGrant[]>> = {
  [StaffRole.Admin]: restaurantPermissions.map((permission) => ({
    permission,
    scope: PermissionScope.Restaurant,
  })),
  [StaffRole.Manager]: managerPermissions.map((permission) => ({
    permission,
    scope: PermissionScope.Restaurant,
  })),
  [StaffRole.Waiter]: [
    { permission: Permission.ProfileRead, scope: PermissionScope.Restaurant },
    { permission: Permission.OrdersRead, scope: PermissionScope.Assigned },
    { permission: Permission.OrdersCreate, scope: PermissionScope.Assigned },
    { permission: Permission.OrdersUpdateStatus, scope: PermissionScope.Assigned },
    { permission: Permission.TablesRead, scope: PermissionScope.Assigned },
    { permission: Permission.TablesManage, scope: PermissionScope.Assigned },
    { permission: Permission.NotificationsRead, scope: PermissionScope.Restaurant },
  ],
  [StaffRole.Kitchen]: [
    { permission: Permission.ProfileRead, scope: PermissionScope.Restaurant },
    { permission: Permission.OrdersRead, scope: PermissionScope.Restaurant },
    { permission: Permission.OrdersUpdateStatus, scope: PermissionScope.Restaurant },
    { permission: Permission.NotificationsRead, scope: PermissionScope.Restaurant },
    { permission: Permission.KitchenQueueRead, scope: PermissionScope.Restaurant },
    { permission: Permission.KitchenQueueUpdate, scope: PermissionScope.Restaurant },
  ],
};

const scopeRank: Record<PermissionScope, number> = {
  [PermissionScope.Assigned]: 0,
  [PermissionScope.Restaurant]: 1,
};

export function satisfiesPermission(
  grants: readonly PermissionGrant[],
  requirement: PermissionRequirement,
): boolean {
  return grants.some(
    (grant) =>
      grant.permission === requirement.permission &&
      scopeRank[grant.scope] >= scopeRank[requirement.scope],
  );
}
