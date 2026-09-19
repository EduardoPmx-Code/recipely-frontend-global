import {
  Permission,
  PermissionScope,
  ROLE_PERMISSION_GRANTS,
  satisfiesPermission,
  StaffRole,
} from './permissions';

describe('permission grants', () => {
  it('allows restaurant-scoped administrators to satisfy assigned requirements', () => {
    expect(
      satisfiesPermission(ROLE_PERMISSION_GRANTS[StaffRole.Admin], {
        permission: Permission.OrdersRead,
        scope: PermissionScope.Assigned,
      }),
    ).toBeTrue();
  });

  it('does not elevate an assigned waiter permission to restaurant scope', () => {
    expect(
      satisfiesPermission(ROLE_PERMISSION_GRANTS[StaffRole.Waiter], {
        permission: Permission.OrdersRead,
        scope: PermissionScope.Restaurant,
      }),
    ).toBeFalse();
  });

  it('allows kitchen staff to update order status only in its restaurant', () => {
    expect(
      satisfiesPermission(ROLE_PERMISSION_GRANTS[StaffRole.Kitchen], {
        permission: Permission.OrdersUpdateStatus,
        scope: PermissionScope.Restaurant,
      }),
    ).toBeTrue();
    expect(
      satisfiesPermission(ROLE_PERMISSION_GRANTS[StaffRole.Kitchen], {
        permission: Permission.StaffManage,
        scope: PermissionScope.Restaurant,
      }),
    ).toBeFalse();
  });
});
