import { AsyncPipe } from '@angular/common';
import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChartOutline, fastFoodOutline, peopleOutline, qrCodeOutline, gridOutline, personOutline, receiptOutline, restaurantOutline, notificationsOutline } from 'ionicons/icons';
import { Permission, PermissionRequirement, PermissionScope, StaffRole } from '../core/auth/permissions';
import { AuthService } from '../core/services/auth.service';
import { KitchenNotificationService } from '../core/services/kitchen-notification.service';
import { WaiterNotificationService } from '../core/services/waiter-notification.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [AsyncPipe, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  public readonly kitchenNotifications = inject(KitchenNotificationService);
  public readonly waiterNotifications = inject(WaiterNotificationService);
  private readonly authService = inject(AuthService);

  constructor() {
    addIcons({ statsChartOutline, fastFoodOutline, peopleOutline, qrCodeOutline, gridOutline, personOutline, receiptOutline, restaurantOutline, notificationsOutline });
  }

  canAccess(permission: Permission, scope: PermissionScope = PermissionScope.Restaurant): boolean {
    const requirement: PermissionRequirement = { permission, scope };
    return this.authService.hasPermission(requirement);
  }

  canAccessWaiterNotifications(): boolean {
    return (
      this.canAccess(Permission.TablesRead, PermissionScope.Assigned) &&
      this.canAccess(Permission.NotificationsRead)
    );
  }

  isManagementUser(): boolean {
    const role = this.authService.getStaffInfo()?.role;
    return role === StaffRole.Admin || role === StaffRole.Manager;
  }

  isWaiter(): boolean {
    return this.authService.getStaffInfo()?.role === StaffRole.Waiter;
  }

  isKitchen(): boolean {
    return this.authService.getStaffInfo()?.role === StaffRole.Kitchen;
  }
}