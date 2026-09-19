import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Permission,
  PermissionGrant,
  PermissionRequirement,
  ROLE_PERMISSION_GRANTS,
  satisfiesPermission,
  StaffRole,
} from '../auth/permissions';
import { KitchenRealtimeService } from './kitchen-realtime.service';
import { WaiterRealtimeService } from './waiter-realtime.service';
import { StaffWebsocketService } from './staff-websocket.service';

export interface StaffInfo {
  uuid: string;
  name: string;
  email: string;
  role: StaffRole;
  localUuid: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  staff: StaffInfo;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private kitchenRealtime: KitchenRealtimeService,
    private waiterRealtime: WaiterRealtimeService,
    private staffSocket: StaffWebsocketService,
  ) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.base}staff-auth/login`, { email, password })
      .pipe(
        tap((res) => {
          localStorage.setItem('staff_access_token', res.accessToken);
          localStorage.setItem('staff_refresh_token', res.refreshToken);
          localStorage.setItem('staff_info', JSON.stringify(res.staff));
          this.restoreRealtimeConnections();
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}staff-auth/logout`, {}).pipe(
      tap(() => this.clearStorage()),
    );
  }

  refreshToken(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem('staff_refresh_token');
    const staff = this.getStaffInfo();
    return this.http
      .post<RefreshResponse>(`${this.base}staff-auth/refresh`, {
        refreshToken,
        staffUuid: staff?.uuid,
      })
      .pipe(
        tap((res) => {
          localStorage.setItem('staff_access_token', res.accessToken);
          localStorage.setItem('staff_refresh_token', res.refreshToken);
        }),
      );
  }

  getToken(): string | null {
    return localStorage.getItem('staff_access_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getStaffInfo(): StaffInfo | null {
    const info = localStorage.getItem('staff_info');
    return info ? JSON.parse(info) : null;
  }

  getPermissionGrants(): readonly PermissionGrant[] {
    const role = this.getStaffInfo()?.role;
    return role ? ROLE_PERMISSION_GRANTS[role] : [];
  }

  hasPermission(requirement: PermissionRequirement): boolean {
    return satisfiesPermission(this.getPermissionGrants(), requirement);
  }

  hasAllPermissions(requirements: readonly PermissionRequirement[]): boolean {
    return requirements.every((requirement) => this.hasPermission(requirement));
  }

  hasAnyPermission(requirements: readonly PermissionRequirement[]): boolean {
    return requirements.some((requirement) => this.hasPermission(requirement));
  }

  getDefaultRoute(): string | null {
    if (this.hasPermission({ permission: Permission.DashboardRead, scope: 'restaurant' })) {
      return '/tabs/dashboard';
    }

    if (
      this.hasPermission({
        permission: Permission.KitchenQueueRead,
        scope: 'restaurant',
      })
    ) {
      return '/tabs/kitchen-orders';
    }

    if (this.hasPermission({ permission: Permission.OrdersRead, scope: 'restaurant' })) {
      return '/tabs/pedidos';
    }

    if (this.hasPermission({ permission: Permission.OrdersRead, scope: 'assigned' })) {
      return '/tabs/waiter-mesas';
    }

    return null;
  }

  restoreRealtimeConnections(): void {
    if (
      this.hasPermission({
        permission: Permission.KitchenQueueRead,
        scope: 'restaurant',
      })
    ) {
      this.kitchenRealtime.start();
    }

    if (
      this.hasPermission({
        permission: Permission.TablesRead,
        scope: 'assigned',
      })
    ) {
      this.waiterRealtime.start();
    }
  }

  clearStorage(): void {
    this.kitchenRealtime.stop();
    this.waiterRealtime.stop();
    this.staffSocket.disconnect();
    localStorage.removeItem('staff_access_token');
    localStorage.removeItem('staff_refresh_token');
    localStorage.removeItem('staff_info');
  }
}
