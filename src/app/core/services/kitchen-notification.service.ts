import { Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';

export interface KitchenNotification {
  id: string;
  message: string;
  type: 'new_order' | 'status_change';
  status?: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class KitchenNotificationService {
  private readonly maximumNotifications = 50;
  private readonly notifications = new BehaviorSubject<KitchenNotification[]>([]);

  readonly all$ = this.notifications.asObservable();
  readonly unreadCount$ = this.notifications.pipe(
    map((items) => items.filter((item) => !item.read).length),
  );

  add(notification: Omit<KitchenNotification, 'id' | 'timestamp' | 'read'>): void {
    const item: KitchenNotification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    this.notifications.next([item, ...this.notifications.value].slice(0, this.maximumNotifications));
  }

  markAllRead(): void {
    this.notifications.next(
      this.notifications.value.map((notification) => ({ ...notification, read: true })),
    );
  }

  clear(): void {
    this.notifications.next([]);
  }
}
