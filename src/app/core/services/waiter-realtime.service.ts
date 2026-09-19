import { Injectable, OnDestroy, inject } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';
import { Subject, takeUntil } from 'rxjs';
import { WaiterNotificationService } from './waiter-notification.service';
import {
  WaiterWebsocketService,
  OrderCreatedEvent,
  OrderStatusEvent,
  WaiterCallEvent,
} from './waiter-websocket.service';

@Injectable({ providedIn: 'root' })
export class WaiterRealtimeService implements OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private started = false;
  private readonly websocket = inject(WaiterWebsocketService);
  private readonly notifications = inject(WaiterNotificationService);
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
    this.websocket.waiterCall$
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => this.handleWaiterCall(event));
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

  private handleOrderCreated(event: OrderCreatedEvent): void {
    const message = `Nueva orden - Mesa ${event.boardUuid} (${event.itemCount} item(s))`;
    this.notifications.add({ type: 'order_created', title: 'Nuevo pedido', body: message, payload: event });
    void this.showToast(message, 'warning', 5000);
  }

  private handleOrderStatusChanged(event: OrderStatusEvent): void {
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
    this.notifications.add({ type: 'order_ready', title: 'Actualización de pedido', body: message, payload: event });
    void this.showToast(message, event.status === 'cancelled' ? 'danger' : 'tertiary', 4000);
  }

  private handleWaiterCall(event: WaiterCallEvent): void {
    const message = `Mesa ${event.boardUuid} solicita atención`;
    this.notifications.add({ type: 'waiter_call', title: 'Solicitud de mesa', body: message, payload: event });
    void this.showToast(message, 'danger', 5000);
  }
  private async showToast(
    message: string,
    color: 'warning' | 'tertiary' | 'danger' | 'success',
    duration: number,
  ): Promise<void> {
    const toast = await this.toastController.create({ message, duration, color, position: 'top' });
    await toast.present();
  }
}
