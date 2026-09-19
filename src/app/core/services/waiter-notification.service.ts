import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AppNotification {
  id: string;
  type: 'order_created' | 'order_ready' | 'waiter_call';
  title: string;
  body: string;
  timestamp: Date;
  read: boolean;
  payload: unknown;
}

/**
 * In-memory notification queue for the current session.
 * Accumulates all WS events so they are never lost, even if a toast
 * was missed. Survives tab navigation but resets on page reload.
 */
@Injectable({ providedIn: 'root' })
export class WaiterNotificationService {
  private readonly MAX = 50;
  private readonly _list$ = new BehaviorSubject<AppNotification[]>([]);

  readonly notifications$: Observable<AppNotification[]> = this._list$.asObservable();

  readonly unreadCount$: Observable<number> = this._list$.pipe(
    map((list) => list.filter((n) => !n.read).length),
  );

  add(notif: Pick<AppNotification, 'type' | 'title' | 'body' | 'payload'>): void {
    const next: AppNotification = {
      ...notif,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
      read: false,
    };
    this._list$.next([next, ...this._list$.getValue()].slice(0, this.MAX));
  }

  markAllRead(): void {
    this._list$.next(this._list$.getValue().map((n) => ({ ...n, read: true })));
  }
}
