import { Injectable, OnDestroy, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { KitchenNotificationService } from './kitchen-notification.service';
import {
  KitchenWebsocketService,
  OrderCreatedPayload,
  OrderStatusChangedPayload,
} from './kitchen-websocket.service';

@Injectable({ providedIn: 'root' })
export class KitchenRealtimeService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private started = false;
  private readonly websocket = inject(KitchenWebsocketService);
  private readonly notifications = inject(KitchenNotificationService);
  private readonly toastController = inject(ToastController);

  start(): void {
    if (this.started) {
      return;
    }

    this.started = true;
    this.websocket.connect();
    this.websocket.orderCreated$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleOrderCreated(event));
    this.websocket.orderStatusChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleOrderStatusChanged(event));
  }

  stop(): void {
    if (!this.started) {
      return;
    }

    this.destroy$.next();
    this.websocket.disconnect();
    this.started = false;
  }

  ngOnDestroy(): void {
    this.stop();
    this.destroy$.complete();
  }

  private handleOrderCreated(event: OrderCreatedPayload): void {
    const message = `Nueva orden - Mesa ${event.boardUuid} (${event.itemCount} item(s))`;
    this.notifications.add({ message, type: 'new_order' });
    void this.showToast(message, 'warning', 5000);
  }

  private handleOrderStatusChanged(event: OrderStatusChangedPayload): void {
    const messages: Record<string, string> = {
      confirmed: 'Orden confirmada',
      preparing: 'Orden en preparación',
      ready: 'Orden lista para entregar',
      delivered: 'Orden entregada al cliente',
      cancelled: 'Orden cancelada',
    };
    const label = messages[event.status];
    if (!label) {
      return;
    }

    const message = `${label} - Mesa ${event.boardUuid}`;
    this.notifications.add({ message, type: 'status_change', status: event.status });
    void this.showToast(message, event.status === 'cancelled' ? 'danger' : 'tertiary', 4000);
  }

  private async showToast(
    message: string,
    color: 'warning' | 'tertiary' | 'danger',
    duration: number,
  ): Promise<void> {
    const toast = await this.toastController.create({ message, duration, color, position: 'top' });
    await toast.present();
  }
}
