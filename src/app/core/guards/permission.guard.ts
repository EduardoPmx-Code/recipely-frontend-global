import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { PermissionRequirement } from '../auth/permissions';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requirements = route.data['permissions'] as
    | readonly PermissionRequirement[]
    | undefined;

  if (!requirements || authService.hasAllPermissions(requirements)) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
